import { useState } from 'react';
import { 
  Lock, User, LogIn, CheckCircle2, 
  ShieldAlert, Landmark, Sun, Moon
} from 'lucide-react';

export default function LoginPage({ 
  wargaList = [], 
  setCurrentUser, 
  darkMode, 
  setDarkMode 
}) {
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Check for admin
    if (loginData.username.toLowerCase() === 'admin' && loginData.password === 'admin') {
      const adminUser = {
        id: 'ADM-001',
        name: 'Pak RT (Ahmad Mulyono)',
        username: 'admin',
        role: 'admin',
      };
      setSuccess('Login Admin Berhasil! Mengalihkan...');
      setTimeout(() => {
        setCurrentUser(adminUser);
        localStorage.setItem('rt_current_user', JSON.stringify(adminUser));
      }, 1000);
      return;
    }

    // Check for warga
    const citizen = wargaList.find(
      (w) =>
        (w.username.toLowerCase() === loginData.username.toLowerCase() || w.nik === loginData.username) &&
        w.password === loginData.password &&
        w.statusHidup !== 'Meninggal'
    );

    if (citizen) {
      const citizenUser = {
        ...citizen,
        role: 'warga',
      };
      setSuccess(`Login Berhasil! Selamat datang, ${citizen.name}.`);
      setTimeout(() => {
        setCurrentUser(citizenUser);
        localStorage.setItem('rt_current_user', JSON.stringify(citizenUser));
      }, 1000);
    } else {
      setError('Username/NIK atau Password salah. Silakan coba lagi.');
    }
  };

  const handleQuickLogin = (role) => {
    setError('');
    setSuccess('');
    if (role === 'admin') {
      setLoginData({ username: 'admin', password: 'admin' });
      setSuccess('Login Admin Berhasil!');
      setTimeout(() => {
        const adminUser = {
          id: 'ADM-001',
          name: 'Pak RT (Ahmad Mulyono)',
          username: 'admin',
          role: 'admin',
        };
        setCurrentUser(adminUser);
        localStorage.setItem('rt_current_user', JSON.stringify(adminUser));
      }, 1000);
    } else {
      setLoginData({ username: 'warga', password: 'warga' });
      const citizen = wargaList.find((w) => w.username === 'warga');
      if (citizen) {
        setSuccess(`Login Warga Berhasil! Selamat datang, ${citizen.name}.`);
        setTimeout(() => {
          const citizenUser = { ...citizen, role: 'warga' };
          setCurrentUser(citizenUser);
          localStorage.setItem('rt_current_user', JSON.stringify(citizenUser));
        }, 1000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center relative overflow-hidden font-sans">
      
      {/* Decorative background shapes */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* Floating Theme Toggle (Top Right) */}
      <div className="absolute top-6 right-6">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          aria-label="Toggle Theme"
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-450" /> : <Moon className="w-5 h-5 text-indigo-500" />}
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Brand Left Column */}
          <div className="lg:col-span-6 text-center lg:text-left space-y-6">
            <div className="flex items-center gap-3 justify-center lg:justify-start">
              <div className="p-3 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl shadow-lg text-white">
                <Landmark className="w-8 h-8" />
              </div>
              <div className="text-left">
                <span className="block text-2xl font-black tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
                  Sawangan Green Park
                </span>
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest leading-none mt-0.5">
                  Rukun Tetangga 04 / RW 09
                </span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-tight">
              Sistem Informasi Rukun Tetangga <br />
              & Portal Warga Mandiri
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-355 leading-relaxed max-w-lg mx-auto lg:mx-0">
              Selamat datang di portal informasi internal RT 04 / RW 09. Silakan masuk menggunakan akun Anda untuk mengelola biodata diri, mengajukan surat pengantar mandiri, dan memantau kas keuangan.
            </p>

            {/* Biodata RT & Contoh Wilayah */}
            <div className="bg-white/40 dark:bg-slate-900/30 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 space-y-4 max-w-md mx-auto lg:mx-0 text-left font-sans text-xs">
              <h3 className="font-extrabold text-slate-800 dark:text-white uppercase tracking-wider text-[10px] text-slate-400">
                Profil & Biodata Wilayah RT
              </h3>
              <div className="grid grid-cols-2 gap-3 text-slate-655 dark:text-slate-350">
                <div>
                  <span className="block text-[9px] text-slate-405 font-bold uppercase">Nama Wilayah</span>
                  <span className="font-semibold text-slate-850 dark:text-slate-200">Sawangan Green Park</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-405 font-bold uppercase">Administrasi</span>
                  <span className="font-semibold text-slate-850 dark:text-slate-200">RT 04 / RW 09</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-405 font-bold uppercase">Kecamatan</span>
                  <span className="font-semibold text-slate-850 dark:text-slate-200">Sawangan</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-405 font-bold uppercase">Kota</span>
                  <span className="font-semibold text-slate-850 dark:text-slate-200">Depok, Jawa Barat</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-405 font-bold uppercase">Jumlah Warga</span>
                  <span className="font-semibold text-slate-850 dark:text-slate-200">45 Kepala Keluarga</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-405 font-bold uppercase">Luas Wilayah</span>
                  <span className="font-semibold text-slate-850 dark:text-slate-200">± 12.500 m²</span>
                </div>
              </div>
              
              <div className="pt-2.5 border-t border-slate-200/50 dark:border-slate-800/50">
                <span className="block text-[9px] text-slate-405 font-bold uppercase mb-1">Batas-Batas Wilayah</span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px] italic">
                  Utara: Perumahan BSI | Selatan: Jalan Raya Sawangan | Timur: Sungai Irigasi | Barat: Hutan Komplek / RTH.
                </p>
              </div>
            </div>
          </div>

          {/* Form Card Right Column */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="relative group w-full max-w-md">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-emerald-550 to-teal-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
              
              <div className="relative bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
                
                {/* Form header */}
                <div className="text-center">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">Akses Masuk Portal</h2>
                  <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">Masukkan username / NIK dan password akun Anda</p>
                </div>

                {/* Feedback Alerts */}
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2 animate-pulse">
                    <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                {success && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-emerald-600 dark:text-emerald-450 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 animate-bounce" />
                    <span>{success}</span>
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 dark:text-slate-400">Username atau NIK</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-405" />
                      <input
                        required
                        type="text"
                        placeholder="Masukkan username atau NIK"
                        value={loginData.username}
                        onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-emerald-500 text-slate-900 dark:text-white transition-all text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 dark:text-slate-400">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-405" />
                      <input
                        required
                        type="password"
                        placeholder="Masukkan password akun"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-emerald-500 text-slate-900 dark:text-white transition-all text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:scale-[1.01] active:scale-[0.99] text-white font-bold rounded-xl cursor-pointer hover:shadow-lg transition-all text-xs mt-1"
                  >
                    <LogIn className="w-4 h-4 inline-block mr-1.5" />
                    <span>Masuk ke Portal</span>
                  </button>

                  {/* Demo buttons */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-850">
                    <span className="block text-[9px] text-center text-slate-450 dark:text-slate-400 uppercase tracking-widest font-bold mb-2">
                      Demo Akses Cepat (Skenario Pengujian)
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleQuickLogin('warga')}
                        className="py-2.5 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl font-bold flex flex-col items-center text-center gap-0.5 cursor-pointer transition-all"
                      >
                        <span className="text-[11px] text-slate-800 dark:text-slate-200">Portal Warga</span>
                        <span className="text-[9px] text-slate-400 font-mono">warga / warga</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickLogin('admin')}
                        className="py-2.5 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl font-bold flex flex-col items-center text-center gap-0.5 cursor-pointer transition-all"
                      >
                        <span className="text-[11px] text-slate-800 dark:text-slate-200">Portal Admin RT</span>
                        <span className="text-[9px] text-slate-400 font-mono">admin / admin</span>
                      </button>
                    </div>
                  </div>
                </form>

              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
