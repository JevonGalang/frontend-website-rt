import { useState } from 'react';
import { 
  Menu, X, User, LogOut, ChevronDown, Bell, 
  Home, FileText, Wallet, MapPin, Landmark
} from 'lucide-react';
import { clearSession } from '../utils/authSession';
import logoRW11 from '../assets/logo_rw11.png';
import logoDepok from '../assets/logo_depok.png';

const menuItems = [
  { id: 'beranda', label: 'Beranda', icon: Home, restricted: false },
  { id: 'profil-saya', label: 'Profil Saya', icon: User, restricted: true },
  { id: 'profil', label: 'Profil RT', icon: Landmark, restricted: false },
  { id: 'layanan', label: 'Layanan', icon: FileText, restricted: true },
  { id: 'data-warga', label: 'Data Warga', icon: User, restricted: true },
  { id: 'kas', label: 'Kas RT', icon: Wallet, restricted: true },
  { id: 'kontak', label: 'Peta', icon: MapPin, restricted: false },
];

export default function Navbar({ 
  currentUser, 
  setCurrentUser, 
  currentPage, 
  setCurrentPage 
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleNavClick = (id) => {
    setMobileMenuOpen(false);
    setCurrentPage(id);
    const forceScroll = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    forceScroll();
    setTimeout(forceScroll, 10);
    setTimeout(forceScroll, 100);
  };

  const activeUserRole = currentUser?.role === 'admin' || currentUser?.role === 'rt' || currentUser?.role === 'sekertaris' || currentUser?.role === 'bendahara'
    ? 'Pengurus RT'
    : currentUser?.role === 'warga'
      ? 'Warga - Kepala Keluarga'
      : 'Warga / Tamu';

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════
          1. TOP HORIZONTAL NAVBAR (DESKTOP)
          ═══════════════════════════════════════════════════════════════════ */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 z-50 transition-all font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => handleNavClick('beranda')}>
            <div className="flex items-center gap-2">
              <img src={logoDepok} alt="Logo Depok" className="h-8 w-auto object-contain" />
              <img src={logoRW11} alt="Logo RW 11" className="h-9 w-auto object-contain" />
            </div>
            <div className="leading-tight">
              <h1 className="font-extrabold text-xs sm:text-sm text-slate-900 tracking-tight">
                Villa Mutiara Mas Cinere
              </h1>
              <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">
                RT 05 / RW 11
              </p>
            </div>
          </div>

          {/* Center: Desktop Top Navbar Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {menuItems
              .filter(item => !item.restricted || !!currentUser)
              .map((item) => {
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-orange-500 text-white font-bold shadow-md shadow-orange-500/20'
                        : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
          </nav>

          {/* Right: Notifications, Profile Dropdown */}
          <div className="hidden lg:flex items-center gap-3">
            
            {/* Notifications Button */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2.5 rounded-full bg-slate-100 text-slate-600 hover:text-orange-600 transition-all relative cursor-pointer"
                  title="Notifikasi"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-orange-500 text-white font-bold text-[8px] rounded-full flex items-center justify-center border-2 border-white">
                    3
                  </span>
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 animate-fade-in space-y-2 text-left">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-bold text-xs text-slate-800">Notifikasi</span>
                      <span className="text-[10px] text-orange-500 font-semibold cursor-pointer">Tandai dibaca</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="p-2 rounded-xl bg-orange-50/60 border border-orange-100">
                        <p className="font-bold text-slate-800">Pengumuman Kerja Bakti</p>
                        <p className="text-[10px] text-slate-500">Kerja bakti hari Minggu pukul 07:00 WIB.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Account Pill */}
            {currentUser && (
              <div className="relative pl-2 border-l border-slate-200">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/70 transition-all cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                  </div>
                  <div className="text-left hidden xl:block">
                    <span className="block font-bold text-xs text-slate-800 leading-tight">
                      {currentUser.name ? currentUser.name.split(' ')[0] : 'Warga'}
                    </span>
                    <span className="block text-[10px] text-slate-500 leading-none">
                      {activeUserRole}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-fade-in space-y-1">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        handleNavClick('profil-saya');
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-orange-50 rounded-xl flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5 text-orange-500" />
                      <span>Profil Saya</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        clearSession();
                        setCurrentUser(null);
                        setCurrentPage('beranda');
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Keluar Portal</span>
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Mobile Header Controls */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-800 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Drawer Menu (Synced with menuItems) */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-16 bg-slate-950/60 backdrop-blur-xs z-40 animate-fade-in" onClick={() => setMobileMenuOpen(false)}>
            <div className="bg-white border-b border-slate-200 p-4 space-y-2 shadow-2xl" onClick={e => e.stopPropagation()}>
              {menuItems
                .filter(item => !item.restricted || !!currentUser)
                .map((item) => {
                  const isActive = currentPage === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isActive ? 'bg-orange-500 text-white' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}

              {currentUser && (
                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      clearSession();
                      setCurrentUser(null);
                      setCurrentPage('beranda');
                    }}
                    className="w-full py-2.5 bg-rose-600 text-white font-bold text-xs rounded-xl text-center flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar Portal</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          2. FLOATING MOBILE BOTTOM NAVIGATION DOCK (100% Synced)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="lg:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md px-3 py-2 rounded-full border border-slate-200/80 shadow-2xl flex items-center justify-around w-[92vw] max-w-sm font-sans">
        
        {/* Beranda */}
        <button
          onClick={() => handleNavClick('beranda')}
          className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
            currentPage === 'beranda' ? 'text-orange-600 font-extrabold scale-105' : 'text-slate-500'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Beranda</span>
        </button>

        {/* Profil */}
        <button
          onClick={() => handleNavClick(currentUser ? 'profil-saya' : 'profil')}
          className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
            currentPage === 'profil-saya' || currentPage === 'profil' ? 'text-orange-600 font-extrabold scale-105' : 'text-slate-500'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profil</span>
        </button>

        {/* Layanan */}
        {currentUser && (
          <button
            onClick={() => handleNavClick('layanan')}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
              currentPage === 'layanan' ? 'text-orange-600 font-extrabold scale-105' : 'text-slate-500'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Layanan</span>
          </button>
        )}

        {/* Kas RT */}
        {currentUser && (
          <button
            onClick={() => handleNavClick('kas')}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
              currentPage === 'kas' ? 'text-orange-600 font-extrabold scale-105' : 'text-slate-500'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Kas RT</span>
          </button>
        )}

        {/* Peta */}
        <button
          onClick={() => handleNavClick('kontak')}
          className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
            currentPage === 'kontak' ? 'text-orange-600 font-extrabold scale-105' : 'text-slate-500'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Peta</span>
        </button>
      </div>
    </>
  );
}
