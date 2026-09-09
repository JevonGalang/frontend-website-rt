import Swal from 'sweetalert2';
import { useState } from 'react';
import { 
  Lock, User, LogIn, CheckCircle2, 
  ShieldAlert, Landmark
} from 'lucide-react';
import OtpVerificationModal from './OtpVerificationModal';
import { setSession } from '../utils/authSession';
import logoRW11 from '../assets/logo_rw11.png';
import logoDepok from '../assets/logo_depok.png';
import menaraImg from '../assets/menara_vila_mutiara.png';

export default function LoginPage({ 
  wargaList = [], 
  setCurrentUser 
}) {
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [unverifiedOtpState, setUnverifiedOtpState] = useState({
    isOpen: false,
    userId: null,
    email: ''
  });

  const handleLoginSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
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
      const response = await fetch('http://172.20.32.85:3333/post/login', {
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

      if (!response.ok) {
        setError(resData.message || resData.status || 'Username atau password salah.');
        return;
      }

      setSuccess('Login Berhasil! Mengalihkan...');
      
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
        name: localCitizen ? localCitizen.name : (resData.user.role === 'rt' || resData.user.role === 'admin' ? 'Pak RT (Moch. Taufik)' : resData.user.username)
      };

      setSession(userSession, resData.token);

      setTimeout(() => {
        setCurrentUser(userSession);
      }, 1000);
      return;

    } catch (err) {
      console.warn('API Login offline/error:', err);
      setError('Gagal menghubungkan ke server API.');
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
        confirmButtonColor: '#f97316',
        confirmButtonText: 'Masuk Sekarang'
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col justify-center relative overflow-hidden font-sans">
      
      {/* Decorative background ambient blobs */}
      <div className="absolute top-1/4 left-10 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-10 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Brand Left Column */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 py-1">
                <img src={logoDepok} alt="Logo Kota Depok" className="h-9 sm:h-10 w-auto object-contain drop-shadow-xs" />
                <img src={logoRW11} alt="Logo RW 11" className="h-10 sm:h-11 w-auto object-contain drop-shadow-xs" />
              </div>
              <div className="text-left">
                <span className="block text-2xl font-black tracking-tight bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
                  Villa Mutiara Mas Cinere
                </span>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
                  RUKUN TETANGGA 05 / RW 11
                </span>
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 leading-none tracking-tight">
              Sistem Informasi & <br />
              <span className="bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">Layanan Warga RT 05</span>
            </h1>

            <p className="text-sm text-slate-500 leading-relaxed max-w-lg">
              Akses pintu gerbang layanan digital mandiri warga. Ajukan surat pengantar, pantau transparansi buku kas keuangan, serta dapatkan pengumuman penting secara real-time.
            </p>

            {/* Visual Komplek / Perumahan Banner */}
            <div className="relative rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm max-w-md group">
              <img 
                src={menaraImg} 
                alt="Lingkungan Villa Mutiara Mas Cinere" 
                className="w-full h-44 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex flex-col justify-end p-4">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-400 bg-orange-950/60 px-2.5 py-0.5 rounded-full w-fit mb-1 backdrop-blur-xs border border-orange-500/30">
                  Hunian Asri & Harmonis
                </span>
                <h4 className="text-white font-extrabold text-sm sm:text-base leading-tight">
                  Perumahan Villa Mutiara Cinere
                </h4>
                <p className="text-slate-300 text-[11px] font-medium mt-0.5">
                  Kawasan RT 05 / RW 11 Kelurahan Cinere, Kec. Limo, Depok
                </p>
              </div>
            </div>

            {/* Biodata RT & Contoh Wilayah */}
            <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-3xl p-6 shadow-sm shadow-slate-100/50 space-y-4 max-w-md text-left font-sans text-xs">
              <h3 className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px]">
                Informasi & Profil Administrasi
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-slate-600">
                <div>
                  <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Nama Wilayah</span>
                  <span className="font-bold text-slate-850">Villa Mutiara Mas Cinere</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Kecamatan</span>
                  <span className="font-bold text-slate-850">Limo / Cinere</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Kota</span>
                  <span className="font-bold text-slate-850">Depok, Jawa Barat</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Cakupan Wilayah</span>
                  <span className="font-bold text-slate-850">RT 05 / RW 11</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Card Right Column */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="w-full max-w-md bg-white border border-slate-200/60 rounded-3xl shadow-xl shadow-orange-500/5 p-6 sm:p-8 space-y-6">
              
              {/* Form header */}
              <div className="text-center space-y-1.5">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Selamat Datang</h2>
                <p className="text-xs text-slate-400">Masukkan username atau nomor NIK untuk melanjutkan</p>
              </div>

              {/* Feedback Alerts */}
              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-bold flex items-center gap-2 animate-fade-in">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-105 rounded-2xl text-emerald-600 text-xs font-bold flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 animate-bounce" />
                  <span>{success}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs font-sans">
                <div className="space-y-1.5 text-left">
                  <label className="font-bold text-slate-500">Username atau NIK</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      required
                      type="text"
                      placeholder="Masukkan username atau NIK"
                      value={loginData.username}
                      onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-slate-900 transition-all text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="font-bold text-slate-500">Kata Sandi</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      required
                      type="password"
                      placeholder="Masukkan kata sandi"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-slate-900 transition-all text-xs font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all cursor-pointer text-xs flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>MASUK SEKARANG</span>
                </button>
              </form>



            </div>
          </div>
          
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
