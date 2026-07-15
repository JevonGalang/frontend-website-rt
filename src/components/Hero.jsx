import { useState, useEffect } from 'react';
import { 
  Users, Calendar, Wallet, CheckCircle2, BarChart2, BookOpen, Layers, 
  Lock, User, LogIn, ShieldAlert, ArrowRight, ChevronRight, Eye, EyeOff, Loader2
} from 'lucide-react';

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
  currentUser
}) {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'chart' | 'ledger'
  const [activeMainTab, setActiveMainTab] = useState(currentUser ? 'info' : 'login'); // 'login' | 'info'
  const [activeRoadmapTab, setActiveRoadmapTab] = useState('warga'); // 'warga' | 'rt' | 'sekretaris' | 'bendahara'

  // Login form states
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [revealPassword, setRevealPassword] = useState(false);

  // Sync main tab toggle if auth state changes
  useEffect(() => {
    if (currentUser) {
      setActiveMainTab('info');
    } else {
      setActiveMainTab('login');
    }
  }, [currentUser]);

  const navigateToProfil = () => {
    if (setCurrentPage) setCurrentPage('profil');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Infographic statistics fallback calculation
  const income = publicStats?.total_income || 14800000;
  const expense = publicStats?.total_expense || 5200000;
  const balance = publicStats?.current_balance || sisaKasRT || 9600000;
  const prevBalance = publicStats?.previous_balance || 7500000;
  const totalWarga = publicStats?.total_warga || 128;

  const totalArus = income + expense || 1;
  const incomePct = Math.round((income / totalArus) * 100);
  const expensePct = Math.round((expense / totalArus) * 100);

  // Mock ledger data if API falls back to empty
  const displayLedger = publicLedger.length > 0 ? publicLedger.slice(0, 3) : [
    { id: 1, type: 'in', amount: 4800000, source_type: 'ipl', description: 'Iuran Bulanan Warga (IPL Juli)', transaction_date: '2026-07-05' },
    { id: 2, type: 'out', amount: 1500000, source_type: 'kebersihan', description: 'Pengangkutan Sampah TPA Sawangan', transaction_date: '2026-07-04' },
    { id: 3, type: 'in', amount: 2000000, source_type: 'donasi', description: 'Donasi Pembelian Mesin Fogging', transaction_date: '2026-07-02' }
  ];

  // Access log helper
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
      console.error(e);
    }
  };

  // Direct login submit handler
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
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

      recordAccessLog(userSession);
      setTimeout(() => {
        setIsLoggingIn(false);
        setCurrentUser(userSession);
        localStorage.setItem('rt_current_user', JSON.stringify(userSession));
        
        // Push user redirect
        if (userSession.role === 'warga') {
          if (setCurrentPage) setCurrentPage('profil-saya');
        } else {
          // Admin dashboards are triggered in App.jsx rendering
        }
      }, 1000);
    } catch (err) {
      setError('Gagal terhubung ke server. Periksa jaringan Anda.');
      setIsLoggingIn(false);
    }
  };

  // Interactive user flows roadmap structure
  const roadmapSteps = {
    warga: [
      { title: 'Masuk Portal Warga', desc: 'Gunakan tab "Portal Login" di kanan atas halaman utama. Ketik NIK atau Username dan Kata Sandi.', badge: 'Langkah 1' },
      { title: 'Lengkapi Data Keluarga', desc: 'Akses menu "Keluarga Saya" untuk mengedit data keluarga, mengunggah KK, KTP, KIA, dan Akta kelahiran Anda.', badge: 'Langkah 2' },
      { title: 'Bayar Iuran & IPL', desc: 'Buka menu "Bayar Iuran" untuk menyetor IPL tetap bulanan secara rapel 1 tahun, atau setoran kas insidental.', badge: 'Langkah 3' },
      { title: 'Pelayanan Mandiri', desc: 'Ajukan permohonan surat pengantar (SKCK, SKTM, Domisili) dan pantau status persetujuan pengurus secara online.', badge: 'Langkah 4' },
    ],
    rt: [
      { title: 'Masuk Administrator', desc: 'Gunakan Portal Login utama dengan akun Ketua RT/Super Admin. Sistem akan membuka dashboard manajemen.', badge: 'Langkah 1' },
      { title: 'Verifikasi Berkas Warga', desc: 'Lihat pengajuan data keluarga dan unduh langsung berkas KTP/KK yang diupload mandiri oleh warga.', badge: 'Langkah 2' },
      { title: 'Atur Kebijakan Keuangan', desc: 'Konfigurasi Saldo Awal kepengurusan, tetapkan nominal iuran bulanan, serta pantau keseluruhan mutasi.', badge: 'Langkah 3' },
      { title: 'Kirim Notifikasi Tagihan', desc: 'Kirim pengingat tagihan iuran berkala langsung ke kotak pesan warga via saluran resmi Email & Telegram.', badge: 'Langkah 4' },
    ],
    sekretaris: [
      { title: 'Akses Sekretariat', desc: 'Gunakan Portal Login menggunakan akun Sekretaris. Panel kerja disaring khusus untuk administrasi surat.', badge: 'Langkah 1' },
      { title: 'Tanggapi Aspirasi', desc: 'Terima dan tindaklanjuti laporan pengaduan fasilitas umum atau keluhan dari warga secara real-time.', badge: 'Langkah 2' },
      { title: 'Proses Persuratan', desc: 'Buka daftar antrean pengajuan surat pengantar warga, lalu klik "Setujui" atau "Tolak".', badge: 'Langkah 3' },
      { title: 'Cetak & Terbitkan', desc: 'Terbitkan dokumen surat resmi secara instan dengan klik tombol cetak setelah disetujui.', badge: 'Langkah 4' },
    ],
    bendahara: [
      { title: 'Akses Kas & Keuangan', desc: 'Gunakan Portal Login dengan akun Bendahara. Menu disaring khusus untuk pengelolaan kas lingkungan.', badge: 'Langkah 1' },
      { title: 'Konfirmasi Bukti Transfer', desc: 'Periksa lampiran struk transfer bank dari laporan IPL/Kas warga, klik "Setujui" untuk memutakhirkan saldo.', badge: 'Langkah 2' },
      { title: 'Catat Pengeluaran RT', desc: 'Masukkan rincian pengeluaran incidental (kerja bakti, sampah, santunan) untuk transparansi publik.', badge: 'Langkah 3' },
      { title: 'Kunci Saldo Awal', desc: 'Sesuaikan dan kunci catatan Saldo Awal RT agar komparasi surplus/minus buku kas presisi.', badge: 'Langkah 4' },
    ],
  };

  return (
    <section
      id="beranda"
      className="relative min-h-screen pt-24 pb-16 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-emerald-50/40 via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900"
    >
      {/* Decorative background shapes */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-emerald-300/10 dark:bg-emerald-500/5 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-teal-300/10 dark:bg-teal-500/5 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-grow flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Welcoming Text Column */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Selamat Datang Warga Sawangan Green Park
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
              Portal Resmi <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
                Rukun Tetangga 04
              </span>
            </h1>
            
            <p className="text-sm sm:text-base text-slate-655 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-sans">
              Mewujudkan lingkungan hunian yang asri, aman, rukun, dan berteknologi demi kenyamanan bersama. Akses layanan persuratan mandiri, pelaporan iuran bulanan, dan transparansi kas RT 04 secara instan dan terbuka.
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <button
                onClick={() => setCurrentPage && setCurrentPage('layanan')}
                className="inline-flex items-center justify-center px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 dark:from-emerald-500 dark:to-teal-400 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-xs"
              >
                Ajukan Surat Pengantar
              </button>
              <button
                onClick={navigateToProfil}
                className="inline-flex items-center justify-center px-6 py-3.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 font-extrabold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-xs"
              >
                Kenali Pengurus RT
              </button>
            </div>

            {/* Quick trust badges */}
            <div className="pt-2 flex items-center justify-center lg:justify-start gap-6 text-slate-500 dark:text-slate-400 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Pelayanan Cepat</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Kas Transparan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Upload KK/KTP Mandiri</span>
              </div>
            </div>
          </div>
          
          {/* Summary / Access Portal Column (Right Side) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative group w-full max-w-md">
              {/* Outer gradient glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur opacity-25 group-hover:opacity-35 transition duration-1000 group-hover:duration-200"></div>
              
              {/* Core Glass Card */}
              <div className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/80 rounded-3xl shadow-xl p-6 sm:p-8 space-y-6">
                
                {/* Main Access Tabs (Only shown if guest) */}
                {!currentUser ? (
                  <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl text-[10px] sm:text-xs font-extrabold gap-1">
                    <button
                      type="button"
                      onClick={() => setActiveMainTab('login')}
                      className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        activeMainTab === 'login' 
                          ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-white shadow-xs' 
                          : 'text-slate-555 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5 text-emerald-500" />
                      <span>🔑 Portal Login</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMainTab('info')}
                      className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        activeMainTab === 'info' 
                          ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-white shadow-xs' 
                          : 'text-slate-555 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <BarChart2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>📈 Info & Kas RT</span>
                    </button>
                  </div>
                ) : (
                  /* Welcome card for logged in user */
                  <div className="p-4 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex flex-col gap-1 border border-emerald-500/20">
                    <div className="flex items-center justify-between text-xs font-black">
                      <span>👋 Halo, {currentUser.name}!</span>
                      <span className="uppercase text-[9px] px-2.5 py-0.5 bg-emerald-500 text-white rounded-full font-black">
                        {currentUser.role === 'rt' ? 'Ketua RT' : currentUser.role.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1">Anda saat ini sedang masuk ke dalam portal administrasi RT 04.</p>
                  </div>
                )}

                {/* TAB CONTENT: DIRECT LOGIN PANEL */}
                {activeMainTab === 'login' && !currentUser && (
                  <div className="space-y-4 animate-fade-in font-sans">
                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Gerbang Masuk Warga & Staf</h3>
                      <p className="text-[10px] text-slate-450 dark:text-slate-400">Silakan login untuk mengakses layanan mandiri & administrasi RT.</p>
                    </div>

                    <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs font-bold">
                      {error && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl flex items-center gap-2 font-semibold">
                          <ShieldAlert className="w-4 h-4 shrink-0" />
                          <span>{error}</span>
                        </div>
                      )}

                      {success && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center gap-2 font-semibold">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>{success}</span>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-slate-705 dark:text-slate-350">Username atau NIK Warga *</label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            required
                            type="text"
                            placeholder="Ketik username / NIK..."
                            value={loginData.username}
                            onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-semibold transition-all focus:border-emerald-500 focus:bg-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-slate-705 dark:text-slate-350">Kata Sandi (Password) *</label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            required
                            type={revealPassword ? 'text' : 'password'}
                            placeholder="Ketik password..."
                            value={loginData.password}
                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-semibold transition-all focus:border-emerald-500 focus:bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => setRevealPassword(!revealPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-455 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                          >
                            {revealPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-extrabold rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-500/10 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider"
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

                    <div className="pt-2 text-center text-[10px] text-slate-400">
                      <span>Lupa kata sandi? Silakan hubungi Ketua RT setempat untuk reset akun.</span>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: STATS & INFOGRAPHICS */}
                {(activeMainTab === 'info' || currentUser) && (
                  <div className="space-y-6 animate-fade-in font-sans">
                    {/* Tab controls */}
                    <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl text-[10px] font-bold">
                      <button
                        onClick={() => setActiveTab('summary')}
                        className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          activeTab === 'summary' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Ringkasan</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('chart')}
                        className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          activeTab === 'chart' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                        <span>Grafik Kas</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('ledger')}
                        className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          activeTab === 'ledger' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-white shadow-xs' : 'text-slate-555 dark:text-slate-400'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Buku Kas</span>
                      </button>
                    </div>

                    {activeTab === 'summary' && (
                      <div className="space-y-5 animate-fade-in">
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                            Informasi Umum RT 04
                          </h3>
                          <p className="text-[9px] text-slate-450 dark:text-slate-400">
                            Statistik terkini kependudukan dan keuangan wilayah komplek.
                          </p>
                        </div>

                        <div className="space-y-3.5">
                          {/* KK Count */}
                          <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50">
                            <div className="p-2.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                              <Users className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {isWargaLabel ? 'Total Penduduk' : 'Total Keluarga'}
                              </span>
                              <span className="text-xl font-black text-slate-900 dark:text-white">
                                {isWargaLabel ? `${totalKK} Jiwa` : `${totalKK || Math.round(totalWarga / 4)} KK (${totalWarga} Jiwa)`}
                              </span>
                            </div>
                          </div>

                          {/* Agendas count */}
                          <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50">
                            <div className="p-2.5 bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 rounded-xl">
                              <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Agenda Kegiatan</span>
                              <span className="text-xl font-black text-slate-900 dark:text-white">{totalAgendaBulanIni} Terjadwal</span>
                            </div>
                          </div>

                          {/* Cash Balance */}
                          <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50">
                            <div className="p-2.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl">
                              <Wallet className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Saldo Kas RT Aktif</span>
                              <span className="text-xl font-black text-slate-900 dark:text-white">{formatCurrency(balance)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'chart' && (
                      <div className="space-y-6 animate-fade-in">
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                            Infografis Transparansi Kas
                          </h3>
                          <p className="text-[9px] text-slate-450 dark:text-slate-400">
                            Saldo Awal Kepengurusan Sebelumnya: <span className="font-extrabold text-slate-800 dark:text-white">{formatCurrency(prevBalance)}</span>
                          </p>
                        </div>

                        <div className="space-y-4">
                          {/* Income Progress Bar */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400">
                              <span>TOTAL ARUS MASUK (PEMASUKAN)</span>
                              <span className="text-emerald-500 font-extrabold">{incomePct}% ({formatCurrency(income)})</span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: `${incomePct}%` }}></div>
                            </div>
                          </div>

                          {/* Expense Progress Bar */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400">
                              <span>TOTAL ARUS KELUAR (PENGELUARAN)</span>
                              <span className="text-rose-500 font-extrabold">{expensePct}% ({formatCurrency(expense)})</span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-rose-500 to-orange-400 rounded-full" style={{ width: `${expensePct}%` }}></div>
                            </div>
                          </div>

                          {/* Center SVG Circle gauge */}
                          <div className="flex flex-col items-center justify-center pt-2 relative">
                            <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="9" className="dark:stroke-slate-800" />
                              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="9"
                                strokeDasharray={`${2.51 * incomePct} ${251 - 2.51 * incomePct}`}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute text-center flex flex-col justify-center">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">SALDO AKHIR</span>
                              <span className="text-xs font-black text-slate-900 dark:text-white mt-1">{formatCurrency(balance)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'ledger' && (
                      <div className="space-y-5 animate-fade-in">
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                            Laporan Transaksi Umum
                          </h3>
                          <p className="text-[9px] text-slate-450 dark:text-slate-400">
                            Catatan mutasi kas RT 04 yang dipublikasikan secara transparan.
                          </p>
                        </div>

                        <div className="space-y-3">
                          {displayLedger.map((item) => (
                            <div key={item.id} className="p-3 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 rounded-2xl flex items-center justify-between text-xs transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-800/60">
                              <div className="space-y-0.5">
                                <span className="font-extrabold text-slate-800 dark:text-white block truncate max-w-[200px]">{item.description}</span>
                                <span className="text-[9px] text-slate-400 font-mono block">{item.transaction_date ? item.transaction_date.substring(0, 10) : ''} • {item.source_type?.toUpperCase()}</span>
                              </div>
                              <span className={`font-black font-mono text-right shrink-0 ${item.type === 'in' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {item.type === 'in' ? '+' : '-'}{formatCurrency(item.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Decorative border bottom note */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                        Diperbarui Secara Berkala
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </div>

        {/* Peta Panduan Alur Layanan Digital RT 04 */}
        <div className="mt-20 pt-16 border-t border-slate-200/60 dark:border-slate-800/80 w-full font-sans">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold tracking-wider uppercase">
              📖 Petunjuk Navigasi Portal
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              Peta Alur Layanan Digital RT 04
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Silakan pilih kategori portal Anda untuk memahami rute penggunaan layanan digital baik di HP maupun komputer tanpa bingung mencari menu.
            </p>
          </div>

          {/* Role Switcher Tab Buttons */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {[
              { id: 'warga', label: 'Portal Warga', desc: 'Layanan Warga Mandiri', color: 'from-emerald-500 to-teal-400' },
              { id: 'rt', label: 'Portal Ketua RT', desc: 'Super Administrator', color: 'from-blue-500 to-indigo-500' },
              { id: 'sekretaris', label: 'Portal Sekretaris', desc: 'Pelayanan Surat & Keluhan', color: 'from-cyan-500 to-blue-500' },
              { id: 'bendahara', label: 'Portal Bendahara', desc: 'Keuangan & Saldo Kas', color: 'from-amber-500 to-orange-500' },
            ].map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setActiveRoadmapTab(role.id)}
                className={`px-5 py-3 rounded-2xl text-left transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-xs border flex flex-col min-w-[170px] sm:min-w-[210px] ${
                  activeRoadmapTab === role.id
                    ? 'bg-slate-900 dark:bg-slate-800 text-white border-transparent shadow-md'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 border-slate-200 dark:border-slate-855 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <span className={`text-[9px] font-black uppercase tracking-wider ${activeRoadmapTab === role.id ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {role.desc}
                </span>
                <span className="text-xs sm:text-sm font-extrabold mt-0.5">{role.label}</span>
              </button>
            ))}
          </div>

          {/* Steps Render Block */}
          <div className="bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-855 rounded-3xl p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
              {/* Connector line for desktop */}
              <div className="hidden md:block absolute top-[28px] left-[10%] right-[10%] h-0.5 bg-slate-200 dark:bg-slate-800 -z-20"></div>

              {roadmapSteps[activeRoadmapTab].map((step, idx) => (
                <div key={idx} className="flex flex-col items-center md:items-start text-center md:text-left space-y-4 relative group">
                  {/* Step Bubble */}
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-extrabold text-lg shadow-sm transition-all duration-300 group-hover:border-emerald-500 group-hover:bg-emerald-500/10 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                      {idx + 1}
                    </div>
                    {/* Step line for mobile */}
                    {idx < 3 && (
                      <div className="md:hidden absolute top-14 left-7 w-0.5 h-8 bg-slate-200 dark:bg-slate-800 -z-10"></div>
                    )}
                  </div>

                  {/* Step Info */}
                  <div className="space-y-1 md:pr-2">
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                      {step.title}
                    </h4>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      {step.desc}
                    </p>
                    <span className="inline-block text-[8px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full mt-2">
                      {step.badge}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
