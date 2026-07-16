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

  const recordAccessLog = (user) => {
    try {
      const logsData = localStorage.getItem('rt_access_logs');
      const logs = logsData ? JSON.parse(logsData) : [];
      
      const newLog = {
        id: 'LOG-' + Math.floor(Math.random() * 90000 + 10000),
        username: user.username,
        name: user.name || user.username,
        role: user.role || 'warga',
        loginTime: new Date().toISOString(),
        ipAddress: '172.20.32.62',
        userAgent: navigator.userAgent.includes('Chrome') ? 'Google Chrome (Windows)' : 'Mozilla Firefox (Windows)',
        status: 'Aktif'
      };
      
      logs.unshift(newLog);
      localStorage.setItem('rt_access_logs', JSON.stringify(logs.slice(0, 100)));
    } catch (e) {
      console.error('Gagal mencatat log akses:', e);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validations: Username min 3 characters, Password min 8 characters (exempting demo/local accounts)
    const isWarga = wargaList.some(w => w.username.toLowerCase() === loginData.username.toLowerCase() || w.nik === loginData.username);
    const isDemo = ['admin', 'rt', 'sekertaris', 'bendahara'].includes(loginData.username.toLowerCase());
    
    if (loginData.username.length < 3) {
      setError('Username/NIK minimal harus 3 karakter.');
      return;
    }
    if (!isWarga && !isDemo && loginData.password.length < 8) {
      setError('Password minimal harus 8 karakter.');
      return;
    }

    // Call API Login
    try {
      const response = await fetch('http://172.20.32.62:3333/post/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginData.username,
          password: loginData.password
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        setError(resData.message || resData.status || 'Username atau password salah.');
        return;
      }

      setSuccess('Login Berhasil! Mengalihkan...');
      
      // Save token (JWT) to localStorage valid for 1 day
      localStorage.setItem('rt_token', resData.token);
      localStorage.setItem('rt_token_time', new Date().getTime().toString());

      // Merge local rich citizen data if exists
      const localCitizen = wargaList.find(w => w.username.toLowerCase() === resData.user.username.toLowerCase());
      
      const userSession = {
        ...localCitizen, // fallback fields
        id: resData.user.id,
        username: resData.user.username,
        email: resData.user.email,
        role: resData.user.role,
        familyId: resData.user.family_id,
        must_change_password: resData.user.must_change_password,
        name: localCitizen ? localCitizen.name : (resData.user.role === 'rt' || resData.user.role === 'admin' ? 'Pak RT (Ahmad Mulyono)' : resData.user.username)
      };

      recordAccessLog(userSession);
      setTimeout(() => {
        setCurrentUser(userSession);
        localStorage.setItem('rt_current_user', JSON.stringify(userSession));
      }, 1000);
      return;

    } catch (err) {
      console.warn('API Login offline/error, menggunakan fallback lokal:', err);
      const proceedOffline = window.confirm('Gagal menghubungkan ke server API (Offline). Apakah Anda ingin masuk menggunakan akun lokal (Offline Mode)?');
      if (!proceedOffline) {
        setError('Gagal menghubungkan ke server API.');
        return;
      }
    }

    // LOCAL OFFLINE FALLBACK
    const usernameLower = loginData.username.toLowerCase();
    
    // Check for RT (Ketua RT)
    if ((usernameLower === 'admin' && loginData.password === 'admin') || (usernameLower === 'rt' && loginData.password === 'rt')) {
      const adminUser = {
        id: 'ADM-001',
        name: 'Pak RT (Ahmad Mulyono)',
        username: usernameLower,
        role: 'rt',
      };
      setSuccess('Login Ketua RT Lokal Berhasil! Mengalihkan...');
      recordAccessLog(adminUser);
      setTimeout(() => {
        setCurrentUser(adminUser);
        localStorage.setItem('rt_current_user', JSON.stringify(adminUser));
      }, 1000);
      return;
    }

    // Check for Sekretaris
    if (usernameLower === 'sekertaris' && loginData.password === 'sekertaris') {
      const secretaryUser = {
        id: 'SEC-001',
        name: 'Bu Sekretaris (Riana Sukma)',
        username: 'sekertaris',
        role: 'sekertaris',
      };
      setSuccess('Login Sekretaris Lokal Berhasil! Mengalihkan...');
      recordAccessLog(secretaryUser);
      setTimeout(() => {
        setCurrentUser(secretaryUser);
        localStorage.setItem('rt_current_user', JSON.stringify(secretaryUser));
      }, 1000);
      return;
    }

    // Check for Bendahara
    if (usernameLower === 'bendahara' && loginData.password === 'bendahara') {
      const treasurerUser = {
        id: 'TRE-001',
        name: 'Pak Bendahara (Hadi Suwarno)',
        username: 'bendahara',
        role: 'bendahara',
      };
      setSuccess('Login Bendahara Lokal Berhasil! Mengalihkan...');
      recordAccessLog(treasurerUser);
      setTimeout(() => {
        setCurrentUser(treasurerUser);
        localStorage.setItem('rt_current_user', JSON.stringify(treasurerUser));
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
      setSuccess(`Login Warga Lokal Berhasil! Selamat datang, ${citizen.name}.`);
      recordAccessLog(citizenUser);
      setTimeout(() => {
        setCurrentUser(citizenUser);
        localStorage.setItem('rt_current_user', JSON.stringify(citizenUser));
      }, 1000);
    } else {
      setError('Username/NIK atau Password salah. Silakan coba lagi.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/90 flex flex-col justify-center relative overflow-hidden font-sans">
      
      {/* Decorative background ambient blobs */}
      <div className="absolute top-1/4 left-10 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-10 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* Floating Theme Toggle (Top Right) */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all cursor-pointer"
          aria-label="Toggle Theme"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Brand Left Column */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl shadow-lg shadow-emerald-500/10 text-white">
                <Landmark className="w-8 h-8" />
              </div>
              <div className="text-left">
                <span className="block text-2xl font-black tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
                  Sawangan Green Park
                </span>
                <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mt-1">
                  RUKUN TETANGGA 04 / RW 06
                </span>
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
              Sistem Informasi & <br />
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">Layanan Warga RT 05</span>
            </h1>

            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg">
              Akses pintu gerbang layanan digital mandiri warga. Ajukan surat pengantar, pantau transparansi buku kas keuangan, serta dapatkan pengumuman penting secara real-time.
            </p>

            {/* Biodata RT & Contoh Wilayah */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm shadow-slate-100/50 space-y-4 max-w-md text-left font-sans text-xs">
              <h3 className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                Informasi & Profil Administrasi
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-slate-600 dark:text-slate-350">
                <div>
                  <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Nama Wilayah</span>
                  <span className="font-bold text-slate-850 dark:text-slate-200">Sawangan Green Park</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Kecamatan</span>
                  <span className="font-bold text-slate-850 dark:text-slate-200">Sawangan</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Kota</span>
                  <span className="font-bold text-slate-850 dark:text-slate-200">Depok, Jawa Barat</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Luas Wilayah</span>
                  <span className="font-bold text-slate-850 dark:text-slate-200">± 12.500 m²</span>
                </div>
              </div>
              
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Batas-Batas Lingkungan</span>
                <p className="text-slate-500 dark:text-slate-405 leading-relaxed text-[11px] font-medium">
                  Utara: Perumahan BSI | Selatan: Jalan Raya Sawangan | Timur: Sungai Irigasi | Barat: RTH Komplek.
                </p>
              </div>
            </div>
          </div>

          {/* Form Card Right Column */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl shadow-xl shadow-slate-100/40 dark:shadow-none p-6 sm:p-8 space-y-6">
              
              {/* Form header */}
              <div className="text-center space-y-1.5">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Selamat Datang</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500">Masukkan username atau nomor NIK untuk melanjutkan</p>
              </div>

              {/* Feedback Alerts */}
              {error && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2 animate-fade-in">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-105 dark:border-emerald-900/50 rounded-2xl text-emerald-600 dark:text-emerald-450 text-xs font-bold flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 animate-bounce" />
                  <span>{success}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs font-sans">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 dark:text-slate-400">Username atau NIK</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      required
                      type="text"
                      placeholder="Masukkan username atau NIK"
                      value={loginData.username}
                      onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 text-slate-900 dark:text-white transition-all text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 dark:text-slate-400">Kata Sandi</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      required
                      type="password"
                      placeholder="Masukkan kata sandi"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 text-slate-900 dark:text-white transition-all text-xs font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold rounded-xl cursor-pointer hover:shadow-lg hover:shadow-emerald-600/10 transition-all text-xs flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Masuk ke Portal</span>
                </button>
              </form>



            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
