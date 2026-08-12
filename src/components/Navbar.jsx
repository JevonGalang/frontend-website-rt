import { useState } from 'react';
import { Sun, Moon, Menu, X, Landmark, User, FileText, Wallet, PhoneCall } from 'lucide-react';
import logoGSP from '../assets/logoGSP.png';

const menuItems = [
  { id: 'beranda', label: 'Beranda' },
  { id: 'profil-saya', label: 'Profil Saya' },
  { id: 'profil', label: 'Profil RT' },
  { id: 'agenda', label: 'Agenda' },
  { id: 'layanan', label: 'Layanan' },
  { id: 'data-warga', label: 'Data Warga' },
  { id: 'kas', label: 'Kas RT' },
  { id: 'kontak', label: 'Kontak' },
];

export default function Navbar({ darkMode, setDarkMode, currentUser, setCurrentUser, currentPage, setCurrentPage }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavClick = (id) => {
    setIsOpen(false);
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

  return (
    <nav
      className="fixed top-0 left-0 w-full z-50 bg-[var(--color-canvas)] border-b border-[var(--color-hairline)] py-3 transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12 sm:h-14">
          
          {/* Logo / Brand Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavClick('beranda')}>
            <div className="flex items-center justify-center py-1">
              <img src={logoGSP} alt="Logo Sawangan Green Park" className="h-8 sm:h-9 w-auto object-contain drop-shadow-xs" />
            </div>
            <div className="leading-tight">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-[var(--color-ink)] block">
                Sawangan Green Park
              </span>
              <span className="block text-[8px] font-bold text-[var(--color-mute)] uppercase tracking-wider leading-none mt-0.5">
                Rukun Tetangga 05
              </span>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-1">
            {menuItems
              .filter(item => {
                const restrictedTabs = ['profil-saya', 'layanan', 'data-warga', 'kas'];
                if (!currentUser && restrictedTabs.includes(item.id)) return false;
                return true;
              })
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-3 py-2 rounded-sm text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                    currentPage === item.id
                      ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)]'
                      : 'text-[var(--color-body-text)] hover:text-[var(--color-ink)] hover:bg-slate-150/40 dark:hover:bg-slate-900/50'
                  }`}
                >
                  {item.label}
                </button>
              ))}

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="ml-3 p-2 rounded-sm border border-[var(--color-hairline)] bg-[var(--color-canvas)] text-[var(--color-body-text)] hover:text-[var(--color-ink)] hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
            </button>

            {/* Auth Controls */}
            {currentUser && (
              <div className="flex items-center gap-3 ml-2 border-l border-[var(--color-hairline)] pl-3">
                <span className="text-xs font-bold text-[var(--color-body-text)]">
                  Hi, {currentUser.name ? currentUser.name.split(' ')[0] : 'Warga'}
                </span>
                <button
                  onClick={() => {
                    setCurrentUser(null);
                    localStorage.removeItem('rt_current_user');
                    localStorage.removeItem('rt_token');
                    setCurrentPage('beranda');
                  }}
                  className="px-3 py-1.5 bg-[var(--color-canvas)] hover:bg-rose-600 hover:text-white border border-rose-500/30 text-rose-500 font-bold text-xs rounded-sm cursor-pointer transition-all"
                >
                  Keluar
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu & Dark Mode Controls */}
          <div className="flex lg:hidden items-center gap-2">
            {/* Theme Toggle for Mobile */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-sm text-[var(--color-body-text)] hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>

            {/* Hamburger Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-sm text-[var(--color-ink)] hover:bg-slate-100 dark:hover:bg-slate-900 focus:outline-none cursor-pointer"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <div
        className={`lg:hidden absolute top-[100%] left-0 w-full bg-[var(--color-canvas)] border-b border-[var(--color-hairline)] shadow-lg transition-all duration-300 origin-top ${
          isOpen ? 'scale-y-100 opacity-100 visible' : 'scale-y-0 opacity-0 invisible h-0 pointer-events-none'
        }`}
      >
        <div className="px-4 py-4 space-y-1 sm:px-5">
          {menuItems
            .filter(item => {
              const restrictedTabs = ['profil-saya', 'layanan', 'data-warga', 'kas'];
              if (!currentUser && restrictedTabs.includes(item.id)) return false;
              return true;
            })
            .map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`block w-full text-left px-4 py-2.5 rounded-sm text-sm font-bold transition-all cursor-pointer ${
                  currentPage === item.id
                    ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)]'
                    : 'text-[var(--color-body-text)] hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}

          {/* Auth Controls for Mobile */}
          {currentUser && (
            <div className="pt-3 mt-3 border-t border-[var(--color-hairline)] px-4 space-y-3">
              <div className="text-xs font-bold text-[var(--color-ink)]">
                Nama Sesi: {currentUser.name}
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setCurrentUser(null);
                  localStorage.removeItem('rt_current_user');
                  localStorage.removeItem('rt_token');
                  setCurrentPage('beranda');
                }}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-sm cursor-pointer text-center block transition-all"
              >
                Keluar Portal
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Mobile Bottom Floating Dock Bar (Portrait Mode Optimized) */}
      <div className="lg:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-lg text-white px-3 py-2 rounded-full border border-emerald-500/30 shadow-2xl flex items-center gap-1.5 max-w-[94vw] overflow-x-auto no-scrollbar font-sans">
        <button
          onClick={() => handleNavClick('beranda')}
          className={`flex flex-col items-center py-1 px-3 rounded-full transition-all text-[9px] font-bold cursor-pointer ${
            currentPage === 'beranda' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm scale-105' : 'text-slate-300 hover:text-white'
          }`}
        >
          <Landmark className="w-3.5 h-3.5" />
          <span>Beranda</span>
        </button>

        {currentUser && (
          <button
            onClick={() => handleNavClick('profil-saya')}
            className={`flex flex-col items-center py-1 px-3 rounded-full transition-all text-[9px] font-bold cursor-pointer ${
              currentPage === 'profil-saya' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm scale-105' : 'text-slate-300 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profil</span>
          </button>
        )}

        {currentUser && (
          <button
            onClick={() => handleNavClick('layanan')}
            className={`flex flex-col items-center py-1 px-3 rounded-full transition-all text-[9px] font-bold cursor-pointer ${
              currentPage === 'layanan' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm scale-105' : 'text-slate-300 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Surat</span>
          </button>
        )}

        {currentUser && (
          <button
            onClick={() => handleNavClick('kas')}
            className={`flex flex-col items-center py-1 px-3 rounded-full transition-all text-[9px] font-bold cursor-pointer ${
              currentPage === 'kas' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm scale-105' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Kas RT</span>
          </button>
        )}

        <button
          onClick={() => handleNavClick('kontak')}
          className={`flex flex-col items-center py-1 px-3 rounded-full transition-all text-[9px] font-bold cursor-pointer ${
            currentPage === 'kontak' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm scale-105' : 'text-slate-300 hover:text-white'
          }`}
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Kontak</span>
        </button>
      </div>
    </nav>
  );
}
