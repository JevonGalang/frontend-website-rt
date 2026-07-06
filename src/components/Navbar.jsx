import { useState, useEffect } from 'react';
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

export default function Navbar({ darkMode, setDarkMode, currentUser, setCurrentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('beranda');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      // Track active section on scroll
      const scrollPosition = window.scrollY + 100;
      for (const item of menuItems) {
        const el = document.getElementById(item.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(item.id);
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (id) => {
    setIsOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-md border-b border-slate-200/50 dark:border-slate-800/50 py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand Name */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNavClick('beranda')}>
            <div className="p-2.5 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl shadow-lg shadow-emerald-500/20 text-white">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
                Sawangan Green Park
              </span>
              <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">
                Rukun Tetangga
              </span>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1.5">
            {menuItems
              .filter(item => item.id !== 'profil-saya' || (currentUser && currentUser.role === 'warga'))
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                    activeSection === item.id
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                      : 'text-slate-600 hover:text-emerald-500 dark:text-slate-305 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="ml-4 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-850 bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-405" /> : <Moon className="w-5 h-5 text-indigo-500" />}
            </button>

            {/* Auth Buttons */}
            {currentUser && (
              <div className="flex items-center gap-3 ml-2 border-l border-slate-200 dark:border-slate-800 pl-4">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Hi, {currentUser.name.split(' ')[0]}
                </span>
                <button
                  onClick={() => {
                    setCurrentUser(null);
                    localStorage.removeItem('rt_current_user');
                  }}
                  className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white dark:text-rose-400 font-bold text-xs rounded-xl cursor-pointer transition-all duration-200"
                >
                  Keluar
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu & Dark Mode Controls */}
          <div className="flex md:hidden items-center gap-2">
            {/* Theme Toggle for Mobile */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-slate-655 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-805 cursor-pointer"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-405" /> : <Moon className="w-5 h-5 text-indigo-500" />}
            </button>

            {/* Hamburger Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-655 dark:text-slate-305 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none cursor-pointer"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <div
        className={`md:hidden absolute top-full left-0 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xl transition-all duration-300 origin-top ${
          isOpen ? 'scale-y-100 opacity-100 visible' : 'scale-y-0 opacity-0 invisible h-0 pointer-events-none'
        }`}
      >
        <div className="px-4 pt-2 pb-6 space-y-1 sm:px-3">
          {menuItems
            .filter(item => item.id !== 'profil-saya' || (currentUser && currentUser.role === 'warga'))
            .map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`block w-full text-left px-4 py-3 rounded-lg text-base font-semibold transition-all cursor-pointer ${
                  activeSection === item.id
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-455'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-805'
                }`}
              >
                {item.label}
              </button>
            ))}

          {/* Auth Controls for Mobile */}
          {currentUser && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-805 px-4 space-y-3">
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Hi, {currentUser.name}
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setCurrentUser(null);
                  localStorage.removeItem('rt_current_user');
                }}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl cursor-pointer text-center block transition-all"
              >
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
