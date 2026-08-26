import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { 
  Users, Calendar, Wallet, CheckCircle2, BarChart2, BookOpen, Layers, 
  Lock, User, LogIn, ShieldAlert, Eye, EyeOff, Loader2,
  MapPin, Phone, Mail, Home, TrendingUp, TrendingDown, PieChart, Activity,
  Clock, AlertTriangle, Shield, Building2, Megaphone
} from 'lucide-react';
import OtpVerificationModal from './OtpVerificationModal';

export default function Hero({ 
  totalKK, 
  totalAgendaBulanIni, 
  sisaKasRT, 
  setCurrentPage, 
  publicStats, 
  publicLedger = [], 
  isWargaLabel,
  wargaList = [],
  setCurrentUser,
  currentUser,
  transaksiKasList = [],
  totalPemasukan = 0,
  totalPengeluaran = 0
}) {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'chart' | 'ledger'
  const [activeMainTab, setActiveMainTab] = useState(currentUser ? 'info' : 'login'); // 'login' | 'info'

  // Login form states
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [revealPassword, setRevealPassword] = useState(false);
  const [unverifiedOtpState, setUnverifiedOtpState] = useState({
    isOpen: false,
    userId: null,
    email: ''
  });

  // Modal dialog for Emergency Call
  const handleEmergencyClick = (emg) => {
    Swal.fire({
      title: `📞 ${emg.title}`,
      html: `
        <div class="space-y-3 text-left font-sans text-xs pt-2">
          <p class="text-slate-500 font-medium">${emg.subtitle}</p>
          <div class="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
            <span class="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">Nomor Siaga Utama</span>
            <span class="text-lg font-black font-mono text-emerald-600">${emg.phone}</span>
            <span class="block text-[10px] text-slate-400 font-medium mt-1">${emg.altPhone}</span>
          </div>
          <p class="text-[10px] text-slate-400 italic text-center">Tekan 'Panggil Sekarang' untuk menghubungi kontak darurat secara langsung.</p>
        </div>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: '📞 Panggil Sekarang',
      cancelButtonText: 'Tutup'
    }).then((res) => {
      if (res.isConfirmed && typeof window !== 'undefined') {
        window.open(`tel:${emg.phone.replace(/[^0-9+]/g, '')}`, '_self');
      }
    });
  };

  // Modal dialog for Service Requirement Guide
  const handleShowGuideModal = (srv) => {
    const reqList = srv.requirements.map(r => `<li class="flex items-center gap-2 text-slate-700 font-semibold py-1 border-b border-slate-100"><span class="text-emerald-500 font-bold">✓</span> ${r}</li>`).join('');
    Swal.fire({
      title: `📋 ${srv.title}`,
      html: `
        <div class="space-y-3 text-left font-sans text-xs pt-2">
          <div class="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span class="font-bold text-emerald-600 uppercase text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded-md">${srv.category}</span>
            <span class="text-slate-500 font-bold text-[10px]">⏱️ Estimasi: ${srv.estimate}</span>
          </div>
          <div>
            <span class="block text-slate-400 font-extrabold uppercase text-[10px] tracking-wider mb-2">Dokumen Persyaratan Wajib:</span>
            <ul class="space-y-1">
              ${reqList}
            </ul>
          </div>
          <p class="text-[10px] text-slate-400 italic text-center pt-2">Setelah dokumen siap, Anda dapat mengajukan permohonan secara mandiri di portal layanan warga.</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: '📑 Ajukan Surat Pengantar',
      cancelButtonText: 'Tutup'
    }).then((res) => {
      if (res.isConfirmed) {
        if (setCurrentPage) setCurrentPage('layanan');
      }
    });
  };

  // Sync main tab toggle if auth state changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveMainTab(currentUser ? 'info' : 'login');
    }, 0);
    return () => clearTimeout(timer);
  }, [currentUser]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Infographic statistics fallback calculation
  const income = publicStats?.total_income || 0;
  const expense = publicStats?.total_expense || 0;
  const balance = publicStats?.current_balance || sisaKasRT || 0;
  const prevBalance = publicStats?.previous_balance || 0;
  const totalWarga = publicStats?.total_warga || 0;

  const totalArus = income + expense || 1;
  const incomePct = Math.round((income / totalArus) * 100);
  const expensePct = Math.round((expense / totalArus) * 100);

  // Ledger data from backend API
  const displayLedger = publicLedger.slice(0, 3);


  // Direct login submit handler
  const handleLoginSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoggingIn(true);

    const isWarga = wargaList.some(w => w.username.toLowerCase() === loginData.username.toLowerCase() || w.nik === loginData.username);
    const isDemo = ['admin', 'rt', 'sekertaris', 'bendahara'].includes(loginData.username.toLowerCase());
    
    if (loginData.username.length < 3) {
      setError('Username/NIK minimal harus 3 karakter.');
      setIsLoggingIn(false);
      return;
    }
    if (!isWarga && !isDemo && loginData.password.length < 8) {
      setError('Password minimal harus 8 karakter.');
      setIsLoggingIn(false);
      return;
    }

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
        setIsLoggingIn(false);
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
        setIsLoggingIn(false);
        return;
      }

      setSuccess('Login Berhasil! Mengalihkan...');
      localStorage.setItem('rt_token', resData.token);
      localStorage.setItem('rt_token_time', new Date().getTime().toString());

      const localCitizen = wargaList.find(w => w.username.toLowerCase() === resData.user.username.toLowerCase());
      
      const userSession = {
        ...localCitizen,
        id: resData.user.id,
        username: resData.user.username,
        email: resData.user.email,
        role: resData.user.role,
        familyId: resData.user.family_id,
        must_change_password: resData.user.must_change_password,
        name: localCitizen ? localCitizen.name : (resData.user.role === 'rt' || resData.user.role === 'admin' ? 'Pak RT (Ahmad Mulyono)' : resData.user.username)
      };

      setTimeout(() => {
        setIsLoggingIn(false);
        setCurrentUser(userSession);
        localStorage.setItem('rt_current_user', JSON.stringify(userSession));
        
        // Push user redirect
        if (userSession.role === 'warga') {
          if (setCurrentPage) setCurrentPage('profil-saya');
        }
      }, 1000);
    } catch {
      setError('Gagal terhubung ke server. Periksa jaringan Anda.');
      setIsLoggingIn(false);
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

  return (
    <section
      id="beranda"
      className="relative min-h-screen pt-4 sm:pt-6 pb-16 flex flex-col items-center justify-center overflow-hidden bg-[var(--color-canvas)] text-[var(--color-ink)]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-grow flex flex-col justify-center font-sans">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Welcoming Text Column */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-[var(--color-hairline)] bg-slate-50 dark:bg-slate-900 text-[var(--color-ink)] text-[10px] font-bold tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-purple)]"></span>
              Selamat Datang Warga Sawangan Green Park
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold tracking-tight text-[var(--color-ink)] leading-[1.1] lg:tracking-[-0.8px]">
              Portal Resmi <br className="hidden sm:inline" />
              <span className="text-[var(--color-accent-green)]">
                Rukun Tetangga RT 05 <br/> RW 06
              </span>
            </h1>
            
            <p className="text-xs sm:text-base text-[var(--color-body-text)] max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Mewujudkan lingkungan hunian yang asri, aman, rukun, dan berteknologi demi kenyamanan bersama. Akses layanan persuratan mandiri, pelaporan iuran bulanan, dan transparansi kas RT 05 secara instan dan terbuka.
            </p>

            {/* Quick trust badges */}
            <div className="pt-1 flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-6 text-[var(--color-body-mid)] text-[11px] sm:text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--color-accent-green)] shrink-0" />
                <span>Pelayanan Cepat</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--color-accent-green)] shrink-0" />
                <span>Kas Transparan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--color-accent-green)] shrink-0" />
                <span>Upload Mandiri</span>
              </div>
            </div>
          </div>
          
          {/* Summary / Access Portal Column (Right Side) */}
          <div className="lg:col-span-5 flex justify-center w-full">
            <div className="w-full max-w-md">
              
              {/* Core Feature Card (rounded-md with hairline border) */}
              <div className="bg-[var(--color-canvas)] border border-[var(--color-hairline)] rounded-xl sm:rounded-md p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 shadow-md w-full">
                
                {/* Main Access Tabs (Only shown if guest) */}
                {!currentUser ? (
                  <div className="flex bg-slate-50 dark:bg-slate-950 p-1 rounded-sm border border-[var(--color-hairline)] text-[10px] sm:text-xs font-bold gap-1 font-sans">
                    <button
                      type="button"
                      onClick={() => setActiveMainTab('login')}
                      className={`flex-1 py-2 rounded-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        activeMainTab === 'login' 
                          ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)]' 
                          : 'text-[var(--color-body-mid)] hover:text-[var(--color-ink)]'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Portal Login</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMainTab('info')}
                      className={`flex-1 py-2 rounded-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        activeMainTab === 'info' 
                          ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)]' 
                          : 'text-[var(--color-body-mid)] hover:text-[var(--color-ink)]'
                      }`}
                    >
                      <BarChart2 className="w-3.5 h-3.5" />
                      <span>Info & Kas RT</span>
                    </button>
                  </div>
                ) : (
                  /* Welcome card for logged in user */
                  <div className="p-4 bg-[var(--color-accent-purple)]/10 text-[var(--color-accent-purple)] rounded-sm flex flex-col gap-1 border border-[var(--color-accent-purple)]/20 font-sans">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>👋 Halo, {currentUser.name}!</span>
                      <span className="uppercase text-[9px] px-2 py-0.5 bg-[var(--color-accent-purple)] text-white rounded-sm font-bold">
                        {currentUser.role === 'rt' ? 'Ketua RT' : currentUser.role.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[10px] font-medium text-[var(--color-body-mid)] mt-1">Anda saat ini sedang masuk ke dalam portal administrasi RT 05.</p>
                  </div>
                )}

                {/* TAB CONTENT: DIRECT LOGIN PANEL */}
                {activeMainTab === 'login' && !currentUser && (
                  <div className="space-y-4 animate-fade-in font-sans">
                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-[var(--color-ink)]">Gerbang Masuk Warga & Staf</h3>
                      <p className="text-[10px] text-[var(--color-body-mid)]">Silakan login untuk mengakses layanan mandiri & administrasi RT.</p>
                    </div>

                    <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs font-semibold">
                      {error && (
                        <div className="p-3 bg-[var(--color-accent-red)]/10 border border-[var(--color-accent-red)]/20 text-[var(--color-accent-red)] rounded-sm flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 shrink-0" />
                          <span>{error}</span>
                        </div>
                      )}

                      {success && (
                        <div className="p-3 bg-[var(--color-accent-green)]/10 border border-[var(--color-accent-green)]/20 text-[var(--color-accent-green)] rounded-sm flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>{success}</span>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-[var(--color-body-text)]">Username atau NIK Warga *</label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            required
                            type="text"
                            placeholder="Ketik username / NIK..."
                            value={loginData.username}
                            onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-canvas)] text-[var(--color-ink)] border border-[var(--color-hairline)] rounded-sm outline-none font-semibold transition-all focus:border-[var(--color-primary-wf)]"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[var(--color-body-text)]">Kata Sandi (Password) *</label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            required
                            type={revealPassword ? 'text' : 'password'}
                            placeholder="Ketik password..."
                            value={loginData.password}
                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                            className="w-full pl-10 pr-10 py-2.5 bg-[var(--color-canvas)] text-[var(--color-ink)] border border-[var(--color-hairline)] rounded-sm outline-none font-semibold transition-all focus:border-[var(--color-primary-wf)]"
                          />
                          <button
                            type="button"
                            onClick={() => setRevealPassword(!revealPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-[var(--color-ink)] cursor-pointer"
                          >
                            {revealPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="w-full py-3 bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] font-bold rounded-sm transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider"
                      >
                        {isLoggingIn ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Memproses...</span>
                          </>
                        ) : (
                          <>
                            <LogIn className="w-4 h-4" />
                            <span>Masuk Sekarang</span>
                          </>
                        )}
                      </button>
                    </form>

                    <div className="pt-2 text-center text-[10px] text-[var(--color-mute)]">
                      <span>Lupa kata sandi? Silakan hubungi Ketua RT setempat untuk reset akun.</span>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: STATS & INFOGRAPHICS */}
                {(activeMainTab === 'info' || currentUser) && (
                  <div className="space-y-6 animate-fade-in font-sans">
                    {/* Tab controls */}
                    <div className="flex bg-slate-55 bg-slate-105 p-1 rounded-sm border border-[var(--color-hairline)] text-[10px] font-bold">
                      <button
                        onClick={() => setActiveTab('summary')}
                        className={`flex-1 py-1.5 rounded-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          activeTab === 'summary' ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)]' : 'text-[var(--color-body-mid)]'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Ringkasan</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('chart')}
                        className={`flex-1 py-1.5 rounded-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          activeTab === 'chart' ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)]' : 'text-[var(--color-body-mid)]'
                        }`}
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                        <span>Grafik Kas</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('ledger')}
                        className={`flex-1 py-1.5 rounded-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          activeTab === 'ledger' ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)]' : 'text-[var(--color-body-mid)]'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Buku Kas</span>
                      </button>
                    </div>

                    {activeTab === 'summary' && (
                      <div className="space-y-5 animate-fade-in text-xs font-semibold">
                        <div>
                          <h3 className="text-sm font-extrabold text-[var(--color-ink)]">
                            Informasi Umum RT 05
                          </h3>
                          <p className="text-[9px] text-[var(--color-body-mid)]">
                            Statistik terkini kependudukan dan keuangan wilayah komplek.
                          </p>
                        </div>

                        <div className="space-y-3">
                          {/* KK Count */}
                          <div className="flex items-center gap-4 p-3 border border-[var(--color-hairline)] rounded-sm bg-slate-50/50 dark:bg-slate-900/30">
                            <div className="p-2 bg-[var(--color-accent-purple)]/10 text-[var(--color-accent-purple)] rounded-sm">
                              <Users className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="block text-[9px] font-bold text-[var(--color-mute)] uppercase tracking-wider">
                                {isWargaLabel ? 'Total Penduduk' : 'Total Keluarga'}
                              </span>
                              <span className="text-base font-black text-[var(--color-ink)]">
                                {isWargaLabel ? `${totalKK} Jiwa` : `${totalKK || Math.round(totalWarga / 4)} KK (${totalWarga} Jiwa)`}
                              </span>
                            </div>
                          </div>

                          {/* Agendas count */}
                          <div className="flex items-center gap-4 p-3 border border-[var(--color-hairline)] rounded-sm bg-slate-50/50 dark:bg-slate-900/30">
                            <div className="p-2 bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)] rounded-sm">
                              <Calendar className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="block text-[9px] font-bold text-[var(--color-mute)] uppercase tracking-wider">Agenda Kegiatan</span>
                              <span className="text-base font-black text-[var(--color-ink)]">{totalAgendaBulanIni} Terjadwal</span>
                            </div>
                          </div>

                          {/* Cash Balance */}
                          <div className="flex items-center gap-4 p-3 border border-[var(--color-hairline)] rounded-sm bg-slate-50/50 dark:bg-slate-900/30">
                            <div className="p-2 bg-[var(--color-accent-orange)]/10 text-[var(--color-accent-orange)] rounded-sm">
                              <Wallet className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="block text-[9px] font-bold text-[var(--color-mute)] uppercase tracking-wider">Saldo Kas RT Aktif</span>
                              <span className="text-base font-black text-[var(--color-ink)]">{formatCurrency(balance)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'chart' && (
                      <div className="space-y-6 animate-fade-in text-xs font-semibold">
                        <div>
                          <h3 className="text-sm font-extrabold text-[var(--color-ink)]">
                            Infografis Transparansi Kas
                          </h3>
                          <p className="text-[9px] text-[var(--color-body-mid)]">
                            Saldo Awal Kepengurusan Sebelumnya: <span className="font-extrabold text-[var(--color-ink-strong)]">{formatCurrency(prevBalance)}</span>
                          </p>
                        </div>

                        <div className="space-y-4">
                          {/* Income Progress Bar */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[9px] font-bold text-[var(--color-body-mid)]">
                              <span>PEMASUKAN</span>
                              <span className="text-[var(--color-accent-green)] font-extrabold">{incomePct}% ({formatCurrency(income)})</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-sm overflow-hidden">
                              <div className="h-full bg-[var(--color-accent-green)] rounded-sm" style={{ width: `${incomePct}%` }}></div>
                            </div>
                          </div>

                          {/* Expense Progress Bar */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[9px] font-bold text-[var(--color-body-mid)]">
                              <span>PENGELUARAN</span>
                              <span className="text-[var(--color-accent-red)] font-extrabold">{expensePct}% ({formatCurrency(expense)})</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-sm overflow-hidden">
                              <div className="h-full bg-[var(--color-accent-red)] rounded-sm" style={{ width: `${expensePct}%` }}></div>
                            </div>
                          </div>

                          {/* Center SVG Circle gauge */}
                          <div className="flex flex-col items-center justify-center pt-2 relative">
                            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#e2e8f0" strokeWidth="8" className="dark:stroke-slate-800" />
                              <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--color-accent-green)" strokeWidth="8"
                                strokeDasharray={`${2.51 * incomePct} ${251 - 2.51 * incomePct}`}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute text-center flex flex-col justify-center">
                              <span className="text-[7px] font-bold text-[var(--color-mute)] uppercase tracking-wider leading-none font-sans">SALDO AKHIR</span>
                              <span className="text-xs font-black text-[var(--color-ink)] mt-1">{formatCurrency(balance)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'ledger' && (
                      <div className="space-y-5 animate-fade-in text-xs font-semibold">
                        <div>
                          <h3 className="text-sm font-extrabold text-[var(--color-ink)]">
                            Laporan Transaksi Umum
                          </h3>
                          <p className="text-[9px] text-[var(--color-body-mid)]">
                            Catatan mutasi kas RT 05 yang dipublikasikan secara transparan.
                          </p>
                        </div>

                        <div className="space-y-3">
                          {displayLedger.map((item) => (
                            <div key={item.id} className="p-3 bg-slate-55/40 dark:bg-slate-900/30 border border-[var(--color-hairline)] rounded-sm flex items-center justify-between transition-colors hover:bg-slate-50">
                              <div className="space-y-0.5">
                                <span className="font-extrabold text-[var(--color-ink-strong)] block truncate max-w-[190px]">{item.description}</span>
                                <span className="text-[8px] text-[var(--color-mute)] font-mono block">{item.transaction_date ? item.transaction_date.substring(0, 10) : ''} • {item.source_type?.toUpperCase()}</span>
                              </div>
                              <span className={`font-black font-mono text-right shrink-0 ${item.type === 'in' ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-accent-red)]'}`}>
                                {item.type === 'in' ? '+' : '-'}{formatCurrency(item.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Decorative border bottom note */}
                    <div className="pt-2 border-t border-[var(--color-hairline)] text-center">
                      <span className="text-[9px] text-[var(--color-mute)] uppercase tracking-widest font-bold">
                        Diperbarui Secara Berkala
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </div>

                {/* ═══════════════════════════════════════════════════════════════════
            QUICK ACCESS PORTAL & INFORMASI DASHBOARD
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="mt-16 pt-12 border-t border-[var(--color-hairline)] w-full font-sans space-y-10 sm:space-y-12">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="px-3 py-1.5 rounded-sm border border-[var(--color-hairline)] bg-slate-50 dark:bg-slate-900 text-[var(--color-ink)] text-[9px] font-bold tracking-wider uppercase inline-flex items-center justify-center gap-1.5 w-fit mx-auto">
              <Megaphone className="w-3.5 h-3.5 text-emerald-500" /> Akses Cepat & Pusat Informasi RT
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[var(--color-ink)] tracking-tight leading-tight lg:tracking-[-0.8px]">
              Quick Access Portal & Informasi Dashboard
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-body-mid)] leading-relaxed max-w-2xl mx-auto">
              Akses portal operasional pengurus, pengumuman terbaru lingkungan, agenda kegiatan RT, dan log aktivitas sistem dalam satu tampilan terpadu.
            </p>
          </div>

          {/* 1. Dashboard Statistik Grid (8 Cards - 2 Columns on Portrait/Mobile) */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
            
            {/* 1. Total Warga */}
            <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white dark:from-emerald-950/40 dark:to-slate-900 border border-emerald-500/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
              <div className="p-2.5 sm:p-3 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl sm:rounded-2xl shadow-md shadow-emerald-500/20 shrink-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">
                  {publicStats?.total_warga || (wargaList.length > 0 ? wargaList.length : 128)}
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block truncate">Total Warga</span>
              </div>
            </div>

            {/* 2. Total Kartu Keluarga */}
            <div className="bg-gradient-to-br from-blue-500/10 via-sky-500/5 to-white dark:from-blue-950/40 dark:to-slate-900 border border-blue-500/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
              <div className="p-2.5 sm:p-3 bg-gradient-to-br from-blue-500 to-sky-600 text-white rounded-xl sm:rounded-2xl shadow-md shadow-blue-500/20 shrink-0">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">
                  {totalKK || publicStats?.total_kk || 48}
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block truncate">Total KK</span>
              </div>
            </div>

            {/* 3. Total Rumah */}
            <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-white dark:from-indigo-950/40 dark:to-slate-900 border border-indigo-500/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
              <div className="p-2.5 sm:p-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl sm:rounded-2xl shadow-md shadow-indigo-500/20 shrink-0">
                <Home className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">
                  {publicStats?.total_rumah || 52}
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block truncate">Total Rumah</span>
              </div>
            </div>

            {/* 4. IPL Sudah Lunas */}
            <div className="bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-white dark:from-emerald-950/40 dark:to-slate-900 border border-emerald-500/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
              <div className="p-2.5 sm:p-3 bg-gradient-to-br from-emerald-600 to-green-600 text-white rounded-xl sm:rounded-2xl shadow-md shadow-emerald-500/20 shrink-0">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">
                  {publicStats?.ipl_lunas || 42} <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">KK</span>
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block truncate">IPL Lunas</span>
              </div>
            </div>

            {/* 5. IPL Belum Lunas */}
            <div className="bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-white dark:from-amber-950/40 dark:to-slate-900 border border-amber-500/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
              <div className="p-2.5 sm:p-3 bg-gradient-to-br from-amber-500 to-rose-600 text-white rounded-xl sm:rounded-2xl shadow-md shadow-amber-500/20 shrink-0">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">
                  {publicStats?.ipl_belum_lunas || 6} <span className="text-xs text-rose-500 font-bold">KK</span>
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block truncate">IPL Belum Lunas</span>
              </div>
            </div>

            {/* 6. Surat Masuk */}
            <div className="bg-gradient-to-br from-cyan-500/10 via-teal-500/5 to-white dark:from-cyan-950/40 dark:to-slate-900 border border-cyan-500/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
              <div className="p-2.5 sm:p-3 bg-gradient-to-br from-cyan-500 to-teal-600 text-white rounded-xl sm:rounded-2xl shadow-md shadow-cyan-500/20 shrink-0">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">
                  {publicStats?.surat_masuk || 18}
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block truncate">Surat Masuk</span>
              </div>
            </div>

            {/* 7. Surat Keluar */}
            <div className="bg-gradient-to-br from-purple-500/10 via-violet-500/5 to-white dark:from-purple-950/40 dark:to-slate-900 border border-purple-500/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
              <div className="p-2.5 sm:p-3 bg-gradient-to-br from-purple-500 to-violet-600 text-white rounded-xl sm:rounded-2xl shadow-md shadow-purple-500/20 shrink-0">
                <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">
                  {publicStats?.surat_keluar || 34}
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block truncate">Surat Keluar</span>
              </div>
            </div>

            {/* 8. Pengaduan Aktif */}
            <div className="bg-gradient-to-br from-rose-500/10 via-red-500/5 to-white dark:from-rose-950/40 dark:to-slate-900 border border-rose-500/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
              <div className="p-2.5 sm:p-3 bg-gradient-to-br from-rose-500 to-red-600 text-white rounded-xl sm:rounded-2xl shadow-md shadow-rose-500/20 shrink-0">
                <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">
                  {publicStats?.pengaduan_aktif || 3}
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block truncate">Pengaduan Aktif</span>
              </div>
            </div>

          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              MODUL 1: PUSAT KONTAK DARURAT (HARMONIZED COLOR PALETTE)
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 border border-emerald-500/25 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xs space-y-4 sm:space-y-6">
            
            {/* Unified Header for Emergency Contacts Rumpun */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-emerald-500/20 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 sm:p-3 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl shadow-md shadow-emerald-500/20 shrink-0">
                  <Phone className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Pusat Kontak Bantuan & Direktori Darurat RT 05
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Satu rumpun kontak siaga darurat 24 jam untuk keamanan, pertolongan medis, kepolisian, dan pengurus RT.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-extrabold text-xs rounded-full shadow-xs w-fit whitespace-nowrap">
                🚨 Layanan Siaga 24 Jam
              </span>
            </div>

            {/* 4 Emergency Contact Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { id: 'emg-1', title: 'Pos Keamanan RT 05', subtitle: 'Keamanan 24 Jam Satpam', phone: '0812-9988-7711', altPhone: 'Ext. Pos Satpam Utama', badge: 'Keamanan', color: 'emerald' },
                { id: 'emg-2', title: 'Ketua RT 05 Sawangan', subtitle: 'Bpk. Achmad Mulyono', phone: '0812-3456-7890', altPhone: 'Rumah Blok B3 No. 12', badge: 'Pengurus RT', color: 'emerald' },
                { id: 'emg-3', title: 'Ambulans & Medis Depok', subtitle: 'Layanan Medis Darurat', phone: '119 / (021) 777-8899', altPhone: 'RSUD Depok Sawangan', badge: 'Kesehatan', color: 'emerald' },
                { id: 'emg-4', title: 'Polsek Sawangan Depok', subtitle: 'Kepolisian Sektor', phone: '(021) 778-5544', altPhone: 'Layanan Pengaduan 110', badge: 'Kepolisian', color: 'emerald' },
              ].map((emg) => (
                <div
                  key={emg.id}
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.open(`tel:${emg.phone.replace(/[^0-9+]/g, '')}`, '_self');
                    }
                  }}
                  className="bg-white/90 dark:bg-slate-950/80 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800/80 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-md hover:border-emerald-500/40 dark:hover:border-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-xl text-white shadow-xs bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20">
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                        {emg.badge}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {emg.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium">{emg.subtitle}</p>
                    </div>

                    <div className="p-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-800 rounded-lg">
                      <span className="block text-xs font-black font-mono text-slate-900 dark:text-white">{emg.phone}</span>
                      <span className="block text-[9px] text-slate-400 font-medium truncate">{emg.altPhone}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEmergencyClick(emg);
                    }}
                    className="mt-3.5 w-full py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Hubungi Sekarang</span>
                  </button>
                </div>
              ))}
            </div>

          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              MODUL 2: PANDUAN SYARAT PERSURATAN PUBLIK (CHECKLIST)
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-500" /> Panduan Syarat Persuratan Publik
                </h3>
                <p className="text-xs text-slate-400">Daftar dokumen persyaratan yang wajib disiapkan sebelum mengajukan permohonan surat pengantar.</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 w-fit">
                📋 Bebas Akses Tanpa Login
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { id: 'srv-1', category: 'KTP & KK', estimate: '1 Hari Kerja', title: 'Pengantar KTP & KK Baru', requirements: ['Fotokopi KK Lama / Surat Pindah', 'Fotokopi KTP Pemohon', 'Pas Foto 3x4 (2 lembar)'] },
                { id: 'srv-2', category: 'Domisili', estimate: '1 Hari Kerja', title: 'Surat Keterangan Domisili', requirements: ['Fotokopi KTP Warga', 'Fotokopi Kartu Keluarga', 'Surat Sewa Rumah (Jika Kontrak)'] },
                { id: 'srv-3', category: 'Kepolisian', estimate: '1 Hari Kerja', title: 'Pengantar SKCK', requirements: ['Fotokopi KTP Aktif', 'Fotokopi Kartu Keluarga', 'Fotokopi Akta Kelahiran / Ijazah'] },
                { id: 'srv-4', category: 'Bantuan Sosial', estimate: '1 Hari Kerja', title: 'Keterangan Tidak Mampu (SKTM)', requirements: ['Fotokopi KTP & KK', 'Surat Pernyataan Penghasilan', 'Foto Kondisi Rumah'] },
              ].map((srv) => (
                <div
                  key={srv.id}
                  onClick={() => handleShowGuideModal(srv)}
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[9px] font-extrabold uppercase">
                        {srv.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">⏱️ {srv.estimate}</span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {srv.title}
                    </h4>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Persyaratan Utama:</span>
                      {srv.requirements.map((req, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                          <span className="text-emerald-500 text-xs">✓</span>
                          <span className="line-clamp-1">{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShowGuideModal(srv);
                    }}
                    className="mt-4 w-full py-2 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs rounded-xl border border-emerald-500/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Lihat Panduan Lengkap</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            PUSAT DATA & STATISTIK LINGKUNGAN RT 05 - PUBLIK (TANPA LOGIN)
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="mt-20 pt-16 border-t border-[var(--color-hairline)] w-full font-sans">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <span className="px-3 py-1.5 rounded-sm border border-[var(--color-hairline)] bg-slate-50 dark:bg-slate-900 text-[var(--color-ink)] text-[9px] font-bold tracking-wider uppercase">
              📊 Data Terbuka & Transparan
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-ink)] tracking-tight leading-tight lg:tracking-[-0.8px]">
              Pusat Data & Statistik Lingkungan
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-body-mid)] leading-relaxed max-w-2xl mx-auto">
              Informasi terbuka kependudukan, keuangan kas RT, dan kepatuhan iuran warga Sawangan Green Park. Seluruh data dapat diakses publik tanpa memerlukan login.
            </p>
          </div>

          {/* ─── BIODATA SAWANGAN GREEN PARK ─── */}
          <div className="mb-12">
            <div className="bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] rounded-md p-8 sm:p-10 relative overflow-hidden shadow-md">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <Building2 className="w-5 h-5" />
                  <h3 className="text-lg sm:text-xl font-extrabold">Profil Sawangan Green Park — RT 05</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 mt-0.5 shrink-0 opacity-80" />
                      <div>
                        <span className="block text-[8px] font-bold opacity-60 uppercase tracking-wider">Alamat Lengkap</span>
                        <span className="text-xs sm:text-sm font-semibold leading-snug">Perumahan Sawangan Green Park, Kel. Sawangan Baru, Kec. Sawangan, Kota Depok, Jawa Barat 16511</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Home className="w-4 h-4 mt-0.5 shrink-0 opacity-80" />
                      <div>
                        <span className="block text-[8px] font-bold opacity-60 uppercase tracking-wider">Wilayah Cakupan</span>
                        <span className="text-xs sm:text-sm font-semibold">RT 05 / RW 06</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <User className="w-4 h-4 mt-0.5 shrink-0 opacity-80" />
                      <div>
                        <span className="block text-[8px] font-bold opacity-60 uppercase tracking-wider">Ketua RT Aktif</span>
                        <span className="text-xs sm:text-sm font-semibold">Bpk. Achmad </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-4 h-4 mt-0.5 shrink-0 opacity-80" />
                      <div>
                        <span className="block text-[8px] font-bold opacity-60 uppercase tracking-wider">Kontak Sekretariat</span>
                        <span className="text-xs sm:text-sm font-semibold">+62 812-3456-7890</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Mail className="w-4 h-4 mt-0.5 shrink-0 opacity-80" />
                      <div>
                        <span className="block text-[8px] font-bold opacity-60 uppercase tracking-wider">Email Resmi</span>
                        <span className="text-xs sm:text-sm font-semibold">CONTOH EMAIL-@gmail.com</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="w-4 h-4 mt-0.5 shrink-0 opacity-80" />
                      <div>
                        <span className="block text-[8px] font-bold opacity-60 uppercase tracking-wider">Periode Kepengurusan</span>
                        <span className="text-xs sm:text-sm font-semibold">2024 — 2027 (3 Tahun)</span>
                      </div>
                    </div>
                  </div>
{(() => {
                    const living = wargaList.filter(w => w.statusHidup !== 'Meninggal');
                    const uniqueKK = new Set(living.map(w => w.noKk).filter(Boolean));
                    const tetap = living.filter(w => w.status === 'Tetap').length;
                    const kontrak = living.filter(w => w.status === 'Kontrak').length;
                    return [
                      { label: 'Total Jiwa', value: living.length || totalKK || '100' },
                      { label: 'Kepala Keluarga', value: uniqueKK.size || Math.round((living.length || totalKK || 0) / 4) || '25' },
                      { label: 'Warga Tetap', value: tetap || '78' },
                      { label: 'Warga Kontrak', value: kontrak || '22' },
                    ].map((stat, i) => (
                      <div key={i} className="text-center">
                        <span className="block text-2xl sm:text-3xl font-black">{stat.value}</span>
                        <span className="text-[9px] font-bold opacity-75 uppercase tracking-wider">{stat.label}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* ─── GRID STATISTIK UTAMA ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">

            {/* Card 1: Arus Keuangan Dinamis */}
            <div className="bg-[var(--color-canvas)] border border-[var(--color-hairline)] rounded-md p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-[var(--color-ink)] flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[var(--color-accent-green)]" />
                    Arus Keuangan Kas RT
                  </h3>
                  <p className="text-[11px] sm:text-xs text-[var(--color-body-mid)] mt-1">Data keuangan diperbarui secara real-time dari database transaksi.</p>
                </div>
              </div>

              {/* Income & Expense Summary */}
              {(() => {
                const dynIncome = totalPemasukan || (publicStats?.total_income) || 0;
                const dynExpense = totalPengeluaran || (publicStats?.total_expense) || 0;
                const dynBalance = dynIncome - dynExpense;
                const dynTotal = dynIncome + dynExpense || 1;
                const dynInPct = Math.round((dynIncome / dynTotal) * 100);
                const dynOutPct = Math.round((dynExpense / dynTotal) * 100);

                return (
                  <div className="space-y-5">
                    {/* Big numbers */}
                    <div className="grid grid-cols-3 gap-3 font-sans">
                      <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-900/30 border border-[var(--color-hairline)] rounded-sm text-center">
                        <TrendingUp className="w-5 h-5 text-[var(--color-accent-green)] mx-auto mb-1" />
                        <span className="block text-xs sm:text-sm md:text-base font-black text-[var(--color-accent-green)]">{formatCurrency(dynIncome)}</span>
                        <span className="text-[9px] sm:text-xs font-bold text-[var(--color-mute)] uppercase tracking-wider mt-0.5">Pemasukan</span>
                      </div>
                      <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-900/30 border border-[var(--color-hairline)] rounded-sm text-center">
                        <TrendingDown className="w-5 h-5 text-[var(--color-accent-red)] mx-auto mb-1" />
                        <span className="block text-xs sm:text-sm md:text-base font-black text-[var(--color-accent-red)]">{formatCurrency(dynExpense)}</span>
                        <span className="text-[9px] sm:text-xs font-bold text-[var(--color-mute)] uppercase tracking-wider mt-0.5">Pengeluaran</span>
                      </div>
                      <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-900/30 border border-[var(--color-hairline)] rounded-sm text-center">
                        <Wallet className="w-5 h-5 text-[var(--color-accent-blue)] mx-auto mb-1" />
                        <span className={`block text-xs sm:text-sm md:text-base font-black ${dynBalance >= 0 ? 'text-[var(--color-accent-blue-deep)]' : 'text-[var(--color-accent-red)]'}`}>{formatCurrency(dynBalance)}</span>
                        <span className="text-[9px] sm:text-xs font-bold text-[var(--color-mute)] uppercase tracking-wider mt-0.5">Saldo Aktif</span>
                      </div>
                    </div>

                    {/* Progress bars */}
                    <div className="space-y-3 font-sans">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] sm:text-xs font-bold text-[var(--color-body-mid)]">
                          <span>PEMASUKAN (ARUS MASUK)</span>
                          <span className="text-[var(--color-accent-green)] font-extrabold">{dynInPct}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-850 rounded-sm overflow-hidden">
                          <div className="h-full bg-[var(--color-accent-green)] rounded-sm transition-all duration-700" style={{ width: `${dynInPct}%` }}></div>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] sm:text-xs font-bold text-[var(--color-body-mid)]">
                          <span>PENGELUARAN (ARUS KELUAR)</span>
                          <span className="text-[var(--color-accent-red)] font-extrabold">{dynOutPct}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-850 rounded-sm overflow-hidden">
                          <div className="h-full bg-[var(--color-accent-red)] rounded-sm transition-all duration-700" style={{ width: `${dynOutPct}%` }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Donut chart for income vs expense */}
                    <div className="flex items-center justify-center gap-8 py-1">
                      <div className="relative">
                        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f1f5f9" strokeWidth="9" className="dark:stroke-slate-800" />
                          <circle cx="50" cy="50" r="38" fill="transparent" stroke="var(--color-accent-green)" strokeWidth="9"
                            strokeDasharray={`${2.39 * dynInPct} ${239 - 2.39 * dynInPct}`}
                            strokeLinecap="round"
                          />
                          <circle cx="50" cy="50" r="38" fill="transparent" stroke="var(--color-accent-red)" strokeWidth="9"
                            strokeDasharray={`${2.39 * dynOutPct} ${239 - 2.39 * dynOutPct}`}
                            strokeDashoffset={`${-(2.39 * dynInPct)}`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-[7px] font-bold text-[var(--color-mute)] uppercase tracking-wider">RASIO</span>
                          <span className="text-xs sm:text-sm font-black text-[var(--color-ink)]">{dynInPct}:{dynOutPct}</span>
                        </div>
                      </div>
                      <div className="space-y-2 text-[10px] sm:text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm bg-[var(--color-accent-green)]"></div>
                          <span className="text-[var(--color-body-text)]">Pemasukan ({dynInPct}%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm bg-[var(--color-accent-red)]"></div>
                          <span className="text-[var(--color-body-text)]">Pengeluaran ({dynOutPct}%)</span>
                        </div>
                      </div>
                    </div>

                    {/* Recent 5 transactions */}
                    <div className="pt-4 border-t border-[var(--color-hairline)] space-y-2.5 font-sans">
                      <span className="text-[10px] sm:text-xs font-extrabold text-[var(--color-mute)] uppercase tracking-wider block mb-0.5">5 Transaksi Terakhir</span>
                      {(() => {
                        const recentTx = transaksiKasList.length > 0
                          ? transaksiKasList.slice(0, 5)
                          : displayLedger;
                        return recentTx.map((tx, i) => (
                          <div key={i} className="flex items-center justify-between text-[11px] sm:text-xs p-3 rounded-sm bg-slate-50/50 dark:bg-slate-900/30 border border-[var(--color-hairline)]">
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <span className="font-bold text-[11px] sm:text-xs text-[var(--color-ink-strong)] block truncate">{tx.description || tx.kategori || 'Transaksi'}</span>
                              <span className="text-[10px] sm:text-xs text-[var(--color-mute)] font-mono">{tx.transaction_date || tx.date || tx.tanggal || '—'}</span>
                            </div>
                            <span className={`font-extrabold shrink-0 ml-3 text-[11px] sm:text-xs ${(tx.type === 'in' || tx.type === 'income') ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-accent-red)]'}`}>
                              {(tx.type === 'in' || tx.type === 'income') ? '+' : '-'}{formatCurrency(tx.amount || tx.nominal || 0)}
                            </span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Card 2: Demografi Kependudukan */}
            <div className="bg-[var(--color-canvas)] border border-[var(--color-hairline)] rounded-md p-6 sm:p-8 space-y-6 shadow-sm">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-[var(--color-ink)] flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-[var(--color-accent-purple)]" />
                  Demografi Kependudukan
                </h3>
                <p className="text-[11px] sm:text-xs text-[var(--color-body-mid)] mt-1">Statistik komposisi warga berdasarkan gender, usia, dan status hunian.</p>
              </div>

              {(() => {
                const living = wargaList.filter(w => w.statusHidup !== 'Meninggal');
                const totalPop = living.length || 1;
                
                // Gender ratio
                const male = living.filter(w => (w.gender || w.jenisKelamin || '').toLowerCase().includes('laki')).length;
                const female = totalPop - male;
                const malePct = Math.round((male / totalPop) * 100) || 50;
                const femalePct = 100 - malePct;

                // Status hunian
                const tetap = living.filter(w => w.status === 'Tetap').length;
                const kontrak = living.filter(w => w.status === 'Kontrak').length;
                const tetapPct = Math.round((tetap / totalPop) * 100) || 70;
                const kontrakPct = 100 - tetapPct;

                // Age distribution
                const anak = living.filter(w => { const u = parseInt(w.usia || w.umur) || 0; return u >= 0 && u <= 12; }).length;
                const remaja = living.filter(w => { const u = parseInt(w.usia || w.umur) || 0; return u >= 13 && u <= 20; }).length;
                const dewasa = living.filter(w => { const u = parseInt(w.usia || w.umur) || 0; return u >= 21 && u <= 50; }).length;
                const lansia = living.filter(w => { const u = parseInt(w.usia || w.umur) || 0; return u > 50; }).length;
                const anakPct = Math.round((anak / totalPop) * 100);
                const remajaPct = Math.round((remaja / totalPop) * 100);
                const dewasaPct = Math.round((dewasa / totalPop) * 100);
                const lansiaPct = Math.round((lansia / totalPop) * 100);

                return (
                  <div className="space-y-6">
                    {/* Gender SVG Donut & Status Donut side-by-side */}
                    <div className="grid grid-cols-2 gap-6">
                      {/* Gender */}
                      <div className="flex flex-col items-center space-y-3">
                        <span className="text-[10px] sm:text-xs font-extrabold text-[var(--color-mute)] uppercase tracking-wider">Rasio Gender</span>
                        <div className="relative">
                          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f1f5f9" strokeWidth="10" className="dark:stroke-slate-800" />
                            <circle cx="50" cy="50" r="38" fill="transparent" stroke="var(--color-accent-blue)" strokeWidth="10"
                              strokeDasharray={`${2.39 * malePct} ${239 - 2.39 * malePct}`}
                              strokeLinecap="round"
                            />
                            <circle cx="50" cy="50" r="38" fill="transparent" stroke="var(--color-accent-pink)" strokeWidth="10"
                              strokeDasharray={`${2.39 * femalePct} ${239 - 2.39 * femalePct}`}
                              strokeDashoffset={`${-(2.39 * malePct)}`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xl font-black text-[var(--color-ink)]">{totalPop}</span>
                            <span className="text-[9px] font-bold text-[var(--color-mute)] uppercase">Jiwa</span>
                          </div>
                        </div>
                        <div className="space-y-1.5 text-[10px] sm:text-xs w-full font-semibold mt-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="w-3 h-3 rounded-sm bg-[var(--color-accent-blue)]"></div>
                              <span className="text-[var(--color-body-text)]">Laki-laki</span>
                            </div>
                            <span className="text-[var(--color-ink)]">{male} ({malePct}%)</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="w-3 h-3 rounded-sm bg-[var(--color-accent-pink)]"></div>
                              <span className="text-[var(--color-body-text)]">Perempuan</span>
                            </div>
                            <span className="text-[var(--color-ink)]">{female} ({femalePct}%)</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Hunian */}
                      <div className="flex flex-col items-center space-y-3">
                        <span className="text-[10px] sm:text-xs font-extrabold text-[var(--color-mute)] uppercase tracking-wider">Status Hunian</span>
                        <div className="relative">
                          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f1f5f9" strokeWidth="10" className="dark:stroke-slate-800" />
                            <circle cx="50" cy="50" r="38" fill="transparent" stroke="var(--color-accent-green)" strokeWidth="10"
                              strokeDasharray={`${2.39 * tetapPct} ${239 - 2.39 * tetapPct}`}
                              strokeLinecap="round"
                            />
                            <circle cx="50" cy="50" r="38" fill="transparent" stroke="var(--color-accent-orange)" strokeWidth="10"
                              strokeDasharray={`${2.39 * kontrakPct} ${239 - 2.39 * kontrakPct}`}
                              strokeDashoffset={`${-(2.39 * tetapPct)}`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <Home className="w-5 h-5 text-slate-400 mb-0.5" />
                            <span className="text-[9px] font-bold text-[var(--color-mute)] uppercase">Hunian</span>
                          </div>
                        </div>
                        <div className="space-y-1.5 text-[10px] sm:text-xs w-full font-semibold mt-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="w-3 h-3 rounded-sm bg-[var(--color-accent-green)]"></div>
                              <span className="text-[var(--color-body-text)]">Tetap</span>
                            </div>
                            <span className="text-[var(--color-ink)]">{tetap} ({tetapPct}%)</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="w-3 h-3 rounded-sm bg-[var(--color-accent-orange)]"></div>
                              <span className="text-[var(--color-body-text)]">Kontrak</span>
                            </div>
                            <span className="text-[var(--color-ink)]">{kontrak} ({kontrakPct}%)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Age Distribution Bars */}
                    <div className="pt-4 border-t border-[var(--color-hairline)] space-y-3 font-sans">
                      <span className="text-[10px] sm:text-xs font-extrabold text-[var(--color-mute)] uppercase tracking-wider block">Distribusi Kelompok Usia</span>
                      {[
                        { label: 'Anak-anak (0–12 th)', count: anak, pct: anakPct, color: 'from-[var(--color-accent-blue)] to-[var(--color-accent-blue-deep)]' },
                        { label: 'Remaja (13–20 th)', count: remaja, pct: remajaPct, color: 'from-[var(--color-accent-purple)] to-[var(--color-accent-pink)]' },
                        { label: 'Dewasa (21–50 th)', count: dewasa, pct: dewasaPct, color: 'from-[var(--color-accent-green)] to-teal-500' },
                        { label: 'Lansia (>50 th)', count: lansia, pct: lansiaPct, color: 'from-[var(--color-accent-orange)] to-yellow-500' },
                      ].map((ag, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
                            <span>{ag.label}</span>
                            <span className="text-[var(--color-ink)] font-extrabold">{ag.count} orang ({ag.pct}%)</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-850 rounded-sm overflow-hidden">
                            <div className={`h-full bg-gradient-to-r ${ag.color} rounded-sm`} style={{ width: `${Math.max(ag.pct, 2)}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* ─── STATISTIK KEPATUHAN PEMBAYARAN IPL (STATIS) ─── */}
          <div className="bg-[var(--color-canvas)] border border-[var(--color-hairline)] rounded-md p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-[var(--color-ink)] flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[var(--color-accent-purple)]" />
                  Statistik Kepatuhan Pembayaran IPL & Kas
                </h3>
                <p className="text-[10px] text-[var(--color-body-mid)] mt-1">Data historis tingkat ketertiban warga dalam membayar iuran pengelolaan lingkungan dan uang kas sosial.</p>
              </div>
              <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--color-accent-purple)] bg-[var(--color-accent-purple)]/10 px-2.5 py-1 rounded-sm border border-[var(--color-accent-purple)]/20 shrink-0">DATA STATIS</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 font-sans">
              {/* Static compliance metrics */}
              {[
                { 
                  label: 'Tingkat Kepatuhan IPL', 
                  value: '78%', 
                  pct: 78, 
                  desc: 'Warga yang membayar IPL tepat waktu',
                  icon: <CheckCircle2 className="w-4 h-4" />,
                  iconBg: 'bg-[var(--color-accent-green)]/10 text-[var(--color-accent-green)] border border-[var(--color-accent-green)]/20',
                  gradient: 'from-[var(--color-accent-green)] to-teal-400'
                },
                { 
                  label: 'Keterlambatan IPL', 
                  value: '22%', 
                  pct: 22, 
                  desc: 'Warga yang terlambat membayar IPL',
                  icon: <Clock className="w-4 h-4" />,
                  iconBg: 'bg-[var(--color-accent-orange)]/10 text-[var(--color-accent-orange)] border border-[var(--color-accent-orange)]/20',
                  gradient: 'from-[var(--color-accent-orange)] to-yellow-400'
                },
                { 
                  label: 'Kepatuhan Kas Sosial', 
                  value: '85%', 
                  pct: 85, 
                  desc: 'Partisipasi warga dalam iuran sosial',
                  icon: <Users className="w-4 h-4" />,
                  iconBg: 'bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)] border border-[var(--color-accent-blue)]/20',
                  gradient: 'from-[var(--color-accent-blue)] to-indigo-400'
                },
                { 
                  label: 'Tunggakan Aktif', 
                  value: '12%', 
                  pct: 12, 
                  desc: 'Warga dengan tunggakan belum terbayar',
                  icon: <AlertTriangle className="w-4 h-4" />,
                  iconBg: 'bg-[var(--color-accent-red)]/10 text-[var(--color-accent-red)] border border-[var(--color-accent-red)]/20',
                  gradient: 'from-[var(--color-accent-red)] to-pink-400'
                },
              ].map((metric, i) => (
                <div key={i} className="p-5 bg-slate-50/50 dark:bg-slate-900/30 border border-[var(--color-hairline)] rounded-sm space-y-4">
                  <div className={`p-2.5 w-fit ${metric.iconBg} rounded-sm`}>
                    {metric.icon}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[var(--color-mute)] uppercase tracking-wider block">{metric.label}</span>
                    <span className="text-2xl font-black text-[var(--color-ink)]">{metric.value}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-sm overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${metric.gradient} rounded-sm`} style={{ width: `${metric.pct}%` }}></div>
                  </div>
                  <p className="text-[9px] text-[var(--color-mute)] font-medium leading-relaxed">{metric.desc}</p>
                </div>
              ))}
            </div>

            {/* Monthly breakdown static table */}
            <div className="pt-6 border-t border-[var(--color-hairline)]">
              <span className="text-[9px] font-bold text-[var(--color-mute)] uppercase tracking-wider block mb-4">Rincian Kepatuhan Bulanan (Tahun Berjalan)</span>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="text-left text-[var(--color-mute)] font-bold uppercase tracking-wider border-b border-[var(--color-hairline)]">
                      <th className="pb-3 pr-4 font-semibold">Bulan</th>
                      <th className="pb-3 pr-4 font-semibold">Tepat Waktu</th>
                      <th className="pb-3 pr-4 font-semibold">Terlambat</th>
                      <th className="pb-3 pr-4 font-semibold">Belum Bayar</th>
                      <th className="pb-3 font-semibold">Tingkat Kepatuhan</th>
                    </tr>
                  </thead>
                  <tbody className="text-[var(--color-body-text)] font-semibold">
                    {[
                      { bulan: 'Januari 2026', tepat: 82, lambat: 14, belum: 4, pct: 82 },
                      { bulan: 'Februari 2026', tepat: 79, lambat: 16, belum: 5, pct: 79 },
                      { bulan: 'Maret 2026', tepat: 84, lambat: 12, belum: 4, pct: 84 },
                      { bulan: 'April 2026', tepat: 76, lambat: 18, belum: 6, pct: 76 },
                      { bulan: 'Mei 2026', tepat: 80, lambat: 15, belum: 5, pct: 80 },
                      { bulan: 'Juni 2026', tepat: 78, lambat: 17, belum: 5, pct: 78 },
                      { bulan: 'Juli 2026', tepat: 75, lambat: 19, belum: 6, pct: 75 },
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-[var(--color-hairline)]/50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 pr-4 font-extrabold text-[var(--color-ink)]">{row.bulan}</td>
                        <td className="py-2.5 pr-4">
                          <span className="text-[var(--color-accent-green)] font-extrabold">{row.tepat}%</span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="text-[var(--color-accent-orange)] font-extrabold">{row.lambat}%</span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="text-[var(--color-accent-red)] font-extrabold">{row.belum}%</span>
                        </td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-sm overflow-hidden max-w-[80px]">
                              <div className="h-full bg-gradient-to-r from-[var(--color-accent-green)] to-teal-400 rounded-sm" style={{ width: `${row.pct}%` }}></div>
                            </div>
                            <span className="text-[var(--color-ink)] font-black">{row.pct}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-8 text-center font-sans">
            <p className="text-[10px] text-[var(--color-mute)] font-semibold">
              Data statistik ini bersifat terbuka dan dapat diakses oleh seluruh warga maupun pengunjung tanpa harus login ke dalam sistem.
              <br />Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.
            </p>
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
    </section>
  );
}
