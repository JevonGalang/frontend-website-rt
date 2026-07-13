import { useState } from 'react';
import { Sun, Moon, Menu, X, Landmark } from 'lucide-react';

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
  };

  return (
    <nav
      className="fixed top-4 left-1/2 -translate-x-1/2 w-[92%] max-w-6xl z-50 transition-all duration-300 rounded-2xl border bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-lg border-slate-200/50 dark:border-slate-800/80 py-2.5 sm:py-3"
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12 sm:h-14">
          {/* Logo / Brand Name */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => handleNavClick('beranda')}>
            <div className="p-2 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl shadow-md shadow-emerald-500/20 text-white">
              <Landmark className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-450 dark:to-teal-350 bg-clip-text text-transparent block">
                Sawangan Green Park
              </span>
              <span className="block text-[8px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest leading-none mt-0.5">
                Rukun Tetangga 04
              </span>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-1">
            {menuItems
              .filter(item => item.id !== 'profil-saya' || (currentUser && currentUser.role === 'warga'))
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer ${
                    currentPage === item.id
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15'
                      : 'text-slate-600 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                  }`}
                >
                  {item.label}
                </button>
              ))}

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="ml-3 p-2 rounded-xl border border-slate-200/50 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-550" />}
            </button>

            {/* Auth Controls */}
            {currentUser && (
              <div className="flex items-center gap-3 ml-2 border-l border-slate-200 dark:border-slate-800 pl-3">
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  Hi, {currentUser.name ? currentUser.name.split(' ')[0] : 'Warga'}
                </span>
                <button
                  onClick={() => {
                    setCurrentUser(null);
                    localStorage.removeItem('rt_current_user');
                  }}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-500 dark:hover:text-white font-extrabold text-xs rounded-xl cursor-pointer transition-all"
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
              className="p-2 rounded-xl text-slate-500 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-550" />}
            </button>

            {/* Hamburger Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none cursor-pointer"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <div
        className={`lg:hidden absolute top-[110%] left-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-2xl rounded-2xl transition-all duration-300 origin-top ${
          isOpen ? 'scale-y-100 opacity-100 visible' : 'scale-y-0 opacity-0 invisible h-0 pointer-events-none'
        }`}
      >
        <div className="px-4 py-4 space-y-1 sm:px-5">
          {menuItems
            .filter(item => item.id !== 'profil-saya' || (currentUser && currentUser.role === 'warga'))
            .map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`block w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  currentPage === item.id
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            ))}

          {/* Auth Controls for Mobile */}
          {currentUser && (
            <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 px-4 space-y-3">
              <div className="text-xs font-black text-slate-800 dark:text-white">
                Nama Sesi: {currentUser.name}
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setCurrentUser(null);
                  localStorage.removeItem('rt_current_user');
                }}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl cursor-pointer text-center block transition-all"
              >
                Keluar Portal
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
