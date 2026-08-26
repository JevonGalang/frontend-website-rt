import Swal from 'sweetalert2';
import { useState } from 'react';
import { X, Lock, User, UserPlus, LogIn, CheckCircle2, ShieldAlert } from 'lucide-react';
import OtpVerificationModal from './OtpVerificationModal';

export default function LoginModal({ isOpen, onClose, wargaList, setWargaList, setCurrentUser }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '',
    username: '',
    password: '',
    nik: '',
    noKk: '',
    alamat: '',
    gender: 'Laki-laki',
    usia: '',
    status: 'Tetap',
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [unverifiedOtpState, setUnverifiedOtpState] = useState({
    isOpen: false,
    userId: null,
    email: ''
  });

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');

    // Check for admin local shortcut
    if (loginData.username.toLowerCase() === 'admin' && loginData.password === 'admin') {
      const adminUser = {
        id: 'ADM-001',
        name: 'Pak RT (Ahmad Mulyono)',
        username: 'admin',
        role: 'admin',
      };
      setCurrentUser(adminUser);
      localStorage.setItem('rt_current_user', JSON.stringify(adminUser));
      setSuccess('Login Admin Berhasil! Mengalihkan...');
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 1000);
      return;
    }

    // Call API Login to check credentials & verification status
    try {
      const response = await fetch('http://172.20.32.31:3333/post/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginData.username,
          password: loginData.password
        })
      });

      const resData = await response.json();

      // FLOW 2: Check for unverified status
      const isUnverified = (resData.status && String(resData.status).toLowerCase() === 'unverified') ||
                           (resData.message && String(resData.message).toLowerCase().includes('unverified'));
      const unverifiedUserId = resData.userId || resData.output?.userId || resData.user?.id || resData.id;

      if (isUnverified && unverifiedUserId) {
        setError('');
        setUnverifiedOtpState({
          isOpen: true,
          userId: unverifiedUserId,
          email: resData.email || resData.user?.email || ''
        });
        return;
      }

      if (response.ok && resData.token && resData.user) {
        setSuccess('Login Berhasil! Mengalihkan...');
        try {
          localStorage.setItem('rt_token', resData.token);
          localStorage.setItem('rt_token_time', new Date().getTime().toString());
        } catch (e) {}

        const localCitizen = wargaList.find(w => w.username.toLowerCase() === resData.user.username.toLowerCase());
        const citizenUser = {
          ...localCitizen,
          id: resData.user.id,
          username: resData.user.username,
          email: resData.user.email,
          role: resData.user.role,
          familyId: resData.user.family_id,
          must_change_password: resData.user.must_change_password,
          name: localCitizen ? localCitizen.name : (resData.user.role === 'rt' || resData.user.role === 'admin' ? 'Pak RT (Ahmad Mulyono)' : resData.user.username)
        };

        setCurrentUser(citizenUser);
        localStorage.setItem('rt_current_user', JSON.stringify(citizenUser));
        setTimeout(() => {
          setSuccess('');
          onClose();
        }, 1000);
        return;
      }
    } catch (err) {
      console.warn('API Login check skipped or error:', err);
    }

    // Fallback check for warga in local wargaList
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
      setCurrentUser(citizenUser);
      localStorage.setItem('rt_current_user', JSON.stringify(citizenUser));
      setSuccess(`Selamat datang kembali, ${citizen.name}!`);
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 1200);
    } else {
      setError('Username/NIK atau Password salah. Silakan coba lagi.');
    }
  };

  const handleOtpSuccess = () => {
    setUnverifiedOtpState({ isOpen: false, userId: null, email: '' });

    // Flow 2: Use in-memory state only. If credentials exist in React state, re-trigger login.
    if (loginData.username && loginData.password) {
      Swal.fire({
        title: 'Verifikasi Berhasil! 🎉',
        text: 'Akun Anda telah aktif. Melanjutkan proses login otomatis...',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      setTimeout(() => {
        handleLoginSubmit();
      }, 600);
    } else {
      Swal.fire({
        title: 'Verifikasi Berhasil! 🎉',
        text: 'Akun Anda telah berhasil diverifikasi. Silakan masukkan kata sandi Anda untuk masuk.',
        icon: 'success',
        confirmButtonColor: '#10b981',
        confirmButtonText: 'Masuk Sekarang'
      });
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validations
    if (registerData.nik.length !== 16 || isNaN(registerData.nik)) {
      setError('NIK harus berupa 16 digit angka.');
      return;
    }
    if (registerData.noKk.length !== 16 || isNaN(registerData.noKk)) {
      setError('Nomor KK harus berupa 16 digit angka.');
      return;
    }
    if (!registerData.name || !registerData.username || !registerData.password || !registerData.alamat || !registerData.usia) {
      setError('Semua kolom wajib diisi.');
      return;
    }

    // Check if username already exists locally
    const usernameExists = wargaList.some(
      (w) => w.username.toLowerCase() === registerData.username.toLowerCase() || w.username.toLowerCase() === 'admin'
    );
    if (usernameExists) {
      setError('Username sudah digunakan. Pilih username lain.');
      return;
    }

    // Check if NIK already exists locally
    const nikExists = wargaList.some((w) => w.nik === registerData.nik);
    if (nikExists) {
      setError('NIK sudah terdaftar dalam sistem.');
      return;
    }

    const emailToSend = registerData.email || `${registerData.username.toLowerCase()}@example.com`;

    // Send register request to backend
    try {
      const res = await fetch('http://172.20.32.31:3333/post/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: registerData.username,
          password: registerData.password,
          email: emailToSend,
          role: 'warga'
        })
      });
      const resData = await res.json();
      if (!res.ok) {
        const errorMsg = resData.pesan || resData.message || resData.error || (resData.errors && resData.errors[0]?.message) || 'Gagal mendaftar ke server.';
        setError(errorMsg);
        return;
      }
    } catch (err) {
      console.warn('Backend register offline or notice:', err.message);
    }

    // Create new citizen
    const newCitizen = {
      id: 'WRG-' + Math.floor(Math.random() * 9000 + 1000),
      name: registerData.name,
      username: registerData.username,
      password: registerData.password,
      email: emailToSend,
      nik: registerData.nik,
      noKk: registerData.noKk,
      alamat: registerData.alamat,
      gender: registerData.gender,
      usia: parseInt(registerData.usia) || 30,
      status: registerData.status,
      statusHidup: 'Hidup',
    };

    const updatedWargaList = [...wargaList, newCitizen];
    setWargaList(updatedWargaList);


    // Log them in automatically
    const citizenUser = {
      ...newCitizen,
      role: 'warga',
    };
    setCurrentUser(citizenUser);
    localStorage.setItem('rt_current_user', JSON.stringify(citizenUser));

    setSuccess('Registrasi berhasil! Anda telah otomatis masuk.');
    setTimeout(() => {
      setSuccess('');
      onClose();
      // Reset form
      setRegisterData({
        name: '',
        username: '',
        password: '',
        email: '',
        nik: '',
        noKk: '',
        alamat: '',
        gender: 'Laki-laki',
        usia: '',
        status: 'Tetap',
      });
    }, 1500);
  };

  const handleQuickLogin = (role) => {
    if (role === 'admin') {
      setLoginData({ username: 'admin', password: 'admin' });
      // Automate form submission
      setTimeout(() => {
        const adminUser = {
          id: 'ADM-001',
          name: 'Pak RT (Ahmad Mulyono)',
          username: 'admin',
          role: 'admin',
        };
        setCurrentUser(adminUser);
        localStorage.setItem('rt_current_user', JSON.stringify(adminUser));
        setSuccess('Login Admin Berhasil! Mengalihkan...');
        setTimeout(() => {
          setSuccess('');
          onClose();
        }, 1000);
      }, 100);
    } else {
      setLoginData({ username: 'warga', password: 'warga' });
      setTimeout(() => {
        const citizen = wargaList.find((w) => w.username === 'warga');
        if (citizen) {
          const citizenUser = { ...citizen, role: 'warga' };
          setCurrentUser(citizenUser);
          localStorage.setItem('rt_current_user', JSON.stringify(citizenUser));
          setSuccess(`Selamat datang kembali, ${citizen.name}!`);
          setTimeout(() => {
            setSuccess('');
            onClose();
          }, 1200);
        }
      }, 100);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-2xl overflow-hidden z-10 animate-scale-up max-h-[90vh] flex flex-col">
        {/* Header Ribbon */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500"></div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-855 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto p-6 sm:p-8 flex-1">
          {/* Brand Header */}
          <div className="text-center mb-6 mt-2">
            <h3 className="text-2xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
              Sawangan Green Park
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold mt-1">
              Portal Warga & Admin
            </p>
          </div>

          {/* Tab Selection */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl mb-6">
            <button
              onClick={() => { setActiveTab('login'); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                activeTab === 'login'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk</span>
            </button>
            <button
              onClick={() => { setActiveTab('register'); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                activeTab === 'register'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Daftar Warga</span>
            </button>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-red-650 dark:text-red-400 text-xs font-semibold flex items-center gap-2.5 animate-pulse">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-5 p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-emerald-650 dark:text-emerald-450 text-xs font-semibold flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 animate-bounce" />
              <span>{success}</span>
            </div>
          )}

          {activeTab === 'login' ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Username atau NIK</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    required
                    type="text"
                    placeholder="Masukkan username atau NIK"
                    value={loginData.username}
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    required
                    type="password"
                    placeholder="Masukkan password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-505 dark:from-emerald-500 dark:to-teal-400 hover:scale-[1.01] active:scale-[0.99] hover:shadow-lg hover:shadow-emerald-500/10 text-white font-bold text-sm cursor-pointer transition-all mt-2"
              >
                Masuk ke Akun
              </button>

              {/* Quick Login Section */}
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] text-center text-slate-450 dark:text-slate-400 uppercase tracking-widest font-bold mb-3">
                  Demo Quick Login (Uji Coba Cepat)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('warga')}
                    className="py-2.5 px-3 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl flex flex-col items-center text-center gap-1 cursor-pointer transition-all"
                  >
                    <span className="text-xs font-bold text-slate-805 dark:text-slate-200">Akun Warga</span>
                    <span className="text-[10px] text-slate-450 dark:text-slate-500 font-mono">warga / warga</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin')}
                    className="py-2.5 px-3 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl flex flex-col items-center text-center gap-1 cursor-pointer transition-all"
                  >
                    <span className="text-xs font-bold text-slate-805 dark:text-slate-200">Akun Admin RT</span>
                    <span className="text-[10px] text-slate-450 dark:text-slate-500 font-mono">admin / admin</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-4 font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Nama Lengkap</label>
                  <input
                    required
                    type="text"
                    placeholder="Nama sesuai KTP"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Username</label>
                  <input
                    required
                    type="text"
                    placeholder="Buat username"
                    value={registerData.username}
                    onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">NIK (16 Digit)</label>
                  <input
                    required
                    type="text"
                    maxLength={16}
                    placeholder="Nomor Induk Kependudukan"
                    value={registerData.nik}
                    onChange={(e) => setRegisterData({ ...registerData, nik: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">No. KK (16 Digit)</label>
                  <input
                    required
                    type="text"
                    maxLength={16}
                    placeholder="Nomor Kartu Keluarga"
                    value={registerData.noKk}
                    onChange={(e) => setRegisterData({ ...registerData, noKk: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Jenis Kelamin</label>
                  <select
                    value={registerData.gender}
                    onChange={(e) => setRegisterData({ ...registerData, gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white transition-all cursor-pointer"
                  >
                    <option value="Laki-laki" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Laki-laki</option>
                    <option value="Perempuan" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Perempuan</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Usia (Tahun)</label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="120"
                    placeholder="Usia"
                    value={registerData.usia}
                    onChange={(e) => setRegisterData({ ...registerData, usia: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Status Tinggal</label>
                  <select
                    value={registerData.status}
                    onChange={(e) => setRegisterData({ ...registerData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white transition-all cursor-pointer"
                  >
                    <option value="Tetap" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Tetap</option>
                    <option value="Kontrak" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Kontrak</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Buat Password</label>
                  <input
                    required
                    type="password"
                    placeholder="Password akun"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Alamat Lengkap (Nomor Blok / Unit)</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Contoh: Sawangan Green Park Blok B3 No. 12"
                  value={registerData.alamat}
                  onChange={(e) => setRegisterData({ ...registerData, alamat: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-505 dark:from-emerald-500 dark:to-teal-400 hover:scale-[1.01] active:scale-[0.99] hover:shadow-lg hover:shadow-emerald-500/10 text-white font-bold text-sm cursor-pointer transition-all mt-3"
              >
                Daftar & Masuk
              </button>
            </form>
          )}
        </div>
      </div>

      {/* OTP Verification Modal for Unverified Citizen Login (Flow 2) */}
      <OtpVerificationModal
        isOpen={unverifiedOtpState.isOpen}
        onClose={() => setUnverifiedOtpState({ isOpen: false, userId: null, email: '' })}
        userId={unverifiedOtpState.userId}
        email={unverifiedOtpState.email}
        flowType="user_login"
        title="Verifikasi Akun Warga"
        subtitle="Akun Anda belum diverifikasi. Kode OTP baru telah otomatis dikirimkan ke email Anda. Masukkan 6 digit kode OTP untuk mengaktifkan akun:"
        onSuccess={handleOtpSuccess}
      />
    </div>
  );
}
