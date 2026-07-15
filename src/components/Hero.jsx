import { useState, useEffect } from 'react';
import { 
  Users, Calendar, Wallet, CheckCircle2, BarChart2, BookOpen, Layers, 
  Lock, User, LogIn, ShieldAlert, ArrowRight, ChevronRight, Eye, EyeOff, Loader2,
  MapPin, Phone, Mail, Home, TrendingUp, TrendingDown, PieChart, Activity,
  Clock, AlertTriangle, Shield, Building2
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
  currentUser,
  transaksiKasList = [],
  totalPemasukan = 0,
  totalPengeluaran = 0
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

        {/* ═══════════════════════════════════════════════════════════════════
            PUSAT DATA & STATISTIK LINGKUNGAN RT 04 - PUBLIK (TANPA LOGIN)
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="mt-20 pt-16 border-t border-slate-200/60 dark:border-slate-800/80 w-full font-sans">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <span className="px-3 py-1.5 rounded-full bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold tracking-wider uppercase">
              📊 Data Terbuka & Transparan
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              Pusat Data & Statistik Lingkungan
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Informasi terbuka kependudukan, keuangan kas RT, dan kepatuhan iuran warga Sawangan Green Park. Seluruh data dapat diakses publik tanpa memerlukan login.
            </p>
          </div>

          {/* ─── BIODATA SAWANGAN GREEN PARK ─── */}
          <div className="mb-12">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-600 dark:from-emerald-700 dark:to-teal-700 rounded-3xl p-8 sm:p-10 text-white relative overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <Building2 className="w-5 h-5" />
                  <h3 className="text-lg sm:text-xl font-extrabold">Profil Sawangan Green Park — RT 04</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-emerald-200" />
                      <div>
                        <span className="block text-[10px] font-bold text-emerald-200 uppercase tracking-wider">Alamat Lengkap</span>
                        <span className="text-sm font-semibold leading-snug">Perumahan Sawangan Green Park, Kel. Sawangan Baru, Kec. Sawangan, Kota Depok, Jawa Barat 16511</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Home className="w-4 h-4 mt-0.5 shrink-0 text-emerald-200" />
                      <div>
                        <span className="block text-[10px] font-bold text-emerald-200 uppercase tracking-wider">Wilayah Cakupan</span>
                        <span className="text-sm font-semibold">RT 04 / RW 06</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <User className="w-4 h-4 mt-0.5 shrink-0 text-emerald-200" />
                      <div>
                        <span className="block text-[10px] font-bold text-emerald-200 uppercase tracking-wider">Ketua RT Aktif</span>
                        <span className="text-sm font-semibold">Bpk. Ahmad Mulyono</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-4 h-4 mt-0.5 shrink-0 text-emerald-200" />
                      <div>
                        <span className="block text-[10px] font-bold text-emerald-200 uppercase tracking-wider">Kontak Sekretariat</span>
                        <span className="text-sm font-semibold">+62 812-3456-7890</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Mail className="w-4 h-4 mt-0.5 shrink-0 text-emerald-200" />
                      <div>
                        <span className="block text-[10px] font-bold text-emerald-200 uppercase tracking-wider">Email Resmi</span>
                        <span className="text-sm font-semibold">rt04.sgp@gmail.com</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="w-4 h-4 mt-0.5 shrink-0 text-emerald-200" />
                      <div>
                        <span className="block text-[10px] font-bold text-emerald-200 uppercase tracking-wider">Periode Kepengurusan</span>
                        <span className="text-sm font-semibold">2024 — 2027 (3 Tahun)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick stats row */}
                <div className="mt-8 pt-6 border-t border-white/20 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {(() => {
                    const living = wargaList.filter(w => w.statusHidup !== 'Meninggal');
                    const uniqueKK = new Set(living.map(w => w.noKk).filter(Boolean));
                    const tetap = living.filter(w => w.status === 'Tetap').length;
                    const kontrak = living.filter(w => w.status === 'Kontrak').length;
                    return [
                      { label: 'Total Jiwa', value: living.length || totalKK || '—' },
                      { label: 'Kepala Keluarga', value: uniqueKK.size || Math.round((living.length || totalKK || 0) / 4) || '—' },
                      { label: 'Warga Tetap', value: tetap || '—' },
                      { label: 'Warga Kontrak', value: kontrak || '—' },
                    ].map((stat, i) => (
                      <div key={i} className="text-center">
                        <span className="block text-2xl sm:text-3xl font-black">{stat.value}</span>
                        <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider">{stat.label}</span>
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
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    Arus Keuangan Kas RT
                  </h3>
                  <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-1">Data keuangan diperbarui secara real-time dari database transaksi.</p>
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">LIVE</span>
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
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/30 rounded-2xl text-center">
                        <TrendingUp className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                        <span className="block text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(dynIncome)}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Pemasukan</span>
                      </div>
                      <div className="p-3 bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/50 dark:border-rose-800/30 rounded-2xl text-center">
                        <TrendingDown className="w-4 h-4 text-rose-500 mx-auto mb-1" />
                        <span className="block text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400">{formatCurrency(dynExpense)}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Pengeluaran</span>
                      </div>
                      <div className="p-3 bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/30 rounded-2xl text-center">
                        <Wallet className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                        <span className={`block text-xs sm:text-sm font-black ${dynBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>{formatCurrency(dynBalance)}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Saldo Aktif</span>
                      </div>
                    </div>

                    {/* Progress bars */}
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400">
                          <span>PEMASUKAN (ARUS MASUK)</span>
                          <span className="text-emerald-500 font-extrabold">{dynInPct}%</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700" style={{ width: `${dynInPct}%` }}></div>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400">
                          <span>PENGELUARAN (ARUS KELUAR)</span>
                          <span className="text-rose-500 font-extrabold">{dynOutPct}%</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-rose-500 to-orange-400 rounded-full transition-all duration-700" style={{ width: `${dynOutPct}%` }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Donut chart for income vs expense */}
                    <div className="flex items-center justify-center gap-8">
                      <div className="relative">
                        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f1f5f9" strokeWidth="10" className="dark:stroke-slate-800" />
                          <circle cx="50" cy="50" r="38" fill="transparent" stroke="#10b981" strokeWidth="10"
                            strokeDasharray={`${2.39 * dynInPct} ${239 - 2.39 * dynInPct}`}
                            strokeLinecap="round"
                          />
                          <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f43f5e" strokeWidth="10"
                            strokeDasharray={`${2.39 * dynOutPct} ${239 - 2.39 * dynOutPct}`}
                            strokeDashoffset={`${-(2.39 * dynInPct)}`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-[7px] font-black text-slate-400 uppercase">RASIO</span>
                          <span className="text-[10px] font-black text-slate-900 dark:text-white">{dynInPct}:{dynOutPct}</span>
                        </div>
                      </div>
                      <div className="space-y-2 text-[10px]">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                          <span className="font-bold text-slate-600 dark:text-slate-300">Pemasukan ({dynInPct}%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                          <span className="font-bold text-slate-600 dark:text-slate-300">Pengeluaran ({dynOutPct}%)</span>
                        </div>
                      </div>
                    </div>

                    {/* Recent 5 transactions */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">5 Transaksi Terakhir</span>
                      {(() => {
                        const recentTx = transaksiKasList.length > 0
                          ? transaksiKasList.slice(0, 5)
                          : displayLedger;
                        return recentTx.map((tx, i) => (
                          <div key={i} className="flex items-center justify-between text-[10px] p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-100/80 dark:border-slate-800/50">
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <span className="font-bold text-slate-700 dark:text-slate-200 block truncate">{tx.description || tx.kategori || 'Transaksi'}</span>
                              <span className="text-[8px] text-slate-400 font-mono">{tx.transaction_date || tx.date || tx.tanggal || '—'}</span>
                            </div>
                            <span className={`font-black shrink-0 ml-2 ${(tx.type === 'in' || tx.type === 'income') ? 'text-emerald-500' : 'text-rose-500'}`}>
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
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-blue-500" />
                  Demografi Kependudukan
                </h3>
                <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-1">Statistik komposisi warga berdasarkan gender, usia, dan status hunian.</p>
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
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Rasio Gender</span>
                        <div className="relative">
                          <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f1f5f9" strokeWidth="12" className="dark:stroke-slate-800" />
                            <circle cx="50" cy="50" r="38" fill="transparent" stroke="#3b82f6" strokeWidth="12"
                              strokeDasharray={`${2.39 * malePct} ${239 - 2.39 * malePct}`}
                              strokeLinecap="round"
                            />
                            <circle cx="50" cy="50" r="38" fill="transparent" stroke="#ec4899" strokeWidth="12"
                              strokeDasharray={`${2.39 * femalePct} ${239 - 2.39 * femalePct}`}
                              strokeDashoffset={`${-(2.39 * malePct)}`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-lg font-black text-slate-900 dark:text-white">{totalPop}</span>
                            <span className="text-[7px] font-bold text-slate-400 uppercase">Jiwa</span>
                          </div>
                        </div>
                        <div className="space-y-1.5 text-[10px] w-full">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                              <span className="font-bold text-slate-600 dark:text-slate-300">Laki-laki</span>
                            </div>
                            <span className="font-black text-slate-900 dark:text-white">{male} ({malePct}%)</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-pink-500"></div>
                              <span className="font-bold text-slate-600 dark:text-slate-300">Perempuan</span>
                            </div>
                            <span className="font-black text-slate-900 dark:text-white">{female} ({femalePct}%)</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Hunian */}
                      <div className="flex flex-col items-center space-y-3">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Status Hunian</span>
                        <div className="relative">
                          <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f1f5f9" strokeWidth="12" className="dark:stroke-slate-800" />
                            <circle cx="50" cy="50" r="38" fill="transparent" stroke="#10b981" strokeWidth="12"
                              strokeDasharray={`${2.39 * tetapPct} ${239 - 2.39 * tetapPct}`}
                              strokeLinecap="round"
                            />
                            <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f59e0b" strokeWidth="12"
                              strokeDasharray={`${2.39 * kontrakPct} ${239 - 2.39 * kontrakPct}`}
                              strokeDashoffset={`${-(2.39 * tetapPct)}`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <Home className="w-4 h-4 text-slate-400 mb-0.5" />
                            <span className="text-[7px] font-bold text-slate-400 uppercase">Hunian</span>
                          </div>
                        </div>
                        <div className="space-y-1.5 text-[10px] w-full">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                              <span className="font-bold text-slate-600 dark:text-slate-300">Tetap</span>
                            </div>
                            <span className="font-black text-slate-900 dark:text-white">{tetap} ({tetapPct}%)</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                              <span className="font-bold text-slate-600 dark:text-slate-300">Kontrak</span>
                            </div>
                            <span className="font-black text-slate-900 dark:text-white">{kontrak} ({kontrakPct}%)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Age Distribution Bars */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Distribusi Kelompok Usia</span>
                      {[
                        { label: 'Anak-anak (0–12 th)', count: anak, pct: anakPct, color: 'from-sky-400 to-blue-500' },
                        { label: 'Remaja (13–20 th)', count: remaja, pct: remajaPct, color: 'from-violet-400 to-purple-500' },
                        { label: 'Dewasa (21–50 th)', count: dewasa, pct: dewasaPct, color: 'from-emerald-400 to-teal-500' },
                        { label: 'Lansia (>50 th)', count: lansia, pct: lansiaPct, color: 'from-amber-400 to-orange-500' },
                      ].map((ag, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            <span>{ag.label}</span>
                            <span className="text-slate-900 dark:text-white font-extrabold">{ag.count} orang ({ag.pct}%)</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full bg-gradient-to-r ${ag.color} rounded-full transition-all duration-700`} style={{ width: `${Math.max(ag.pct, 2)}%` }}></div>
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
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-500" />
                  Statistik Kepatuhan Pembayaran IPL & Kas
                </h3>
                <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-1">Data historis tingkat ketertiban warga dalam membayar iuran pengelolaan lingkungan dan uang kas sosial.</p>
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-500/10 px-2.5 py-1 rounded-full shrink-0">DATA STATIS</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Static compliance metrics */}
              {[
                { 
                  label: 'Tingkat Kepatuhan IPL', 
                  value: '78%', 
                  pct: 78, 
                  desc: 'Warga yang membayar IPL tepat waktu',
                  icon: <CheckCircle2 className="w-5 h-5" />,
                  iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
                  gradient: 'from-emerald-500 to-teal-400'
                },
                { 
                  label: 'Keterlambatan IPL', 
                  value: '22%', 
                  pct: 22, 
                  desc: 'Warga yang terlambat membayar IPL',
                  icon: <Clock className="w-5 h-5" />,
                  iconBg: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
                  gradient: 'from-amber-500 to-orange-400'
                },
                { 
                  label: 'Kepatuhan Kas Sosial', 
                  value: '85%', 
                  pct: 85, 
                  desc: 'Partisipasi warga dalam iuran sosial',
                  icon: <Users className="w-5 h-5" />,
                  iconBg: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
                  gradient: 'from-blue-500 to-indigo-400'
                },
                { 
                  label: 'Tunggakan Aktif', 
                  value: '12%', 
                  pct: 12, 
                  desc: 'Warga dengan tunggakan belum terbayar',
                  icon: <AlertTriangle className="w-5 h-5" />,
                  iconBg: 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400',
                  gradient: 'from-rose-500 to-pink-400'
                },
              ].map((metric, i) => (
                <div key={i} className="p-5 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 rounded-2xl space-y-4">
                  <div className={`p-2.5 w-fit ${metric.iconBg} rounded-xl`}>
                    {metric.icon}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{metric.label}</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white">{metric.value}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200/80 dark:bg-slate-700/50 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${metric.gradient} rounded-full`} style={{ width: `${metric.pct}%` }}></div>
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium leading-relaxed">{metric.desc}</p>
                </div>
              ))}
            </div>

            {/* Monthly breakdown static table */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-4">Rincian Kepatuhan Bulanan (Tahun Berjalan)</span>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="text-left text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <th className="pb-3 pr-4">Bulan</th>
                      <th className="pb-3 pr-4">Tepat Waktu</th>
                      <th className="pb-3 pr-4">Terlambat</th>
                      <th className="pb-3 pr-4">Belum Bayar</th>
                      <th className="pb-3">Tingkat Kepatuhan</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-700 dark:text-slate-300 font-bold">
                    {[
                      { bulan: 'Januari 2026', tepat: 82, lambat: 14, belum: 4, pct: 82 },
                      { bulan: 'Februari 2026', tepat: 79, lambat: 16, belum: 5, pct: 79 },
                      { bulan: 'Maret 2026', tepat: 84, lambat: 12, belum: 4, pct: 84 },
                      { bulan: 'April 2026', tepat: 76, lambat: 18, belum: 6, pct: 76 },
                      { bulan: 'Mei 2026', tepat: 80, lambat: 15, belum: 5, pct: 80 },
                      { bulan: 'Juni 2026', tepat: 78, lambat: 17, belum: 5, pct: 78 },
                      { bulan: 'Juli 2026', tepat: 75, lambat: 19, belum: 6, pct: 75 },
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 pr-4 font-extrabold text-slate-900 dark:text-white">{row.bulan}</td>
                        <td className="py-2.5 pr-4">
                          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{row.tepat}%</span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="text-amber-600 dark:text-amber-400 font-extrabold">{row.lambat}%</span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="text-rose-500 font-extrabold">{row.belum}%</span>
                        </td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden max-w-[80px]">
                              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: `${row.pct}%` }}></div>
                            </div>
                            <span className="text-slate-900 dark:text-white font-black">{row.pct}%</span>
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
          <div className="mt-8 text-center">
            <p className="text-[10px] text-slate-400 font-semibold">
              Data statistik ini bersifat terbuka dan dapat diakses oleh seluruh warga maupun pengunjung tanpa harus login ke dalam sistem.
              <br />Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
