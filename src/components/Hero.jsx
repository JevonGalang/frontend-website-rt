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
      className="relative min-h-screen pt-24 pb-16 flex flex-col items-center justify-center overflow-hidden bg-[var(--color-canvas)] text-[var(--color-ink)]"
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
              <span className="text-[var(--color-accent-purple)]">
                Rukun Tetangga 04
              </span>
            </h1>
            
            <p className="text-sm sm:text-base text-[var(--color-body-text)] max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Mewujudkan lingkungan hunian yang asri, aman, rukun, dan berteknologi demi kenyamanan bersama. Akses layanan persuratan mandiri, pelaporan iuran bulanan, dan transparansi kas RT 04 secara instan dan terbuka.
            </p>
            
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              <button
                onClick={() => setCurrentPage && setCurrentPage('layanan')}
                className="inline-flex items-center justify-center px-5 py-3 bg-[var(--color-primary-wf)] hover:opacity-90 text-[var(--color-on-primary-wf)] font-semibold rounded-sm transition-all cursor-pointer text-xs uppercase tracking-wider"
              >
                Ajukan Surat Pengantar
              </button>
              <button
                onClick={navigateToProfil}
                className="inline-flex items-center justify-center px-5 py-3 bg-[var(--color-canvas)] text-[var(--color-ink)] border border-[var(--color-hairline)] hover:bg-slate-50 dark:hover:bg-slate-900 font-semibold rounded-sm transition-all cursor-pointer text-xs uppercase tracking-wider"
              >
                Kenali Pengurus RT
              </button>
            </div>

            {/* Quick trust badges */}
            <div className="pt-2 flex items-center justify-center lg:justify-start gap-6 text-[var(--color-body-mid)] text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[var(--color-accent-green)]" />
                <span>Pelayanan Cepat</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[var(--color-accent-green)]" />
                <span>Kas Transparan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[var(--color-accent-green)]" />
                <span>Upload Mandiri</span>
              </div>
            </div>
          </div>
          
          {/* Summary / Access Portal Column (Right Side) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md">
              
              {/* Core Feature Card (rounded-md with hairline border) */}
              <div className="bg-[var(--color-canvas)] border border-[var(--color-hairline)] rounded-md p-6 sm:p-8 space-y-6 shadow-md">
                
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
                    <p className="text-[10px] font-medium text-[var(--color-body-mid)] mt-1">Anda saat ini sedang masuk ke dalam portal administrasi RT 04.</p>
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
                            Informasi Umum RT 04
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
                            Catatan mutasi kas RT 04 yang dipublikasikan secara transparan.
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

        {/* Peta Panduan Alur Layanan Digital RT 04 */}
        <div className="mt-20 pt-16 border-t border-[var(--color-hairline)] w-full font-sans">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <span className="px-3 py-1.5 rounded-sm border border-[var(--color-hairline)] bg-slate-50 dark:bg-slate-900 text-[var(--color-ink)] text-[9px] font-bold tracking-wider uppercase">
              📖 Petunjuk Navigasi Portal
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-ink)] tracking-tight leading-tight lg:tracking-[-0.8px]">
              Peta Alur Layanan Digital RT 04
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-body-mid)] leading-relaxed max-w-2xl mx-auto">
              Silakan pilih kategori portal Anda untuk memahami rute penggunaan layanan digital baik di HP maupun komputer tanpa bingung mencari menu.
            </p>
          </div>

          {/* Role Switcher Tab Buttons */}
          <div className="flex flex-wrap justify-center gap-3 mb-8 font-sans">
            {[
              { id: 'warga', label: 'Portal Warga', desc: 'Layanan Warga Mandiri', color: 'purple' },
              { id: 'rt', label: 'Portal Ketua RT', desc: 'Super Administrator', color: 'blue' },
              { id: 'sekretaris', label: 'Portal Sekretaris', desc: 'Pelayanan Surat & Keluhan', color: 'cyan' },
              { id: 'bendahara', label: 'Portal Bendahara', desc: 'Keuangan & Saldo Kas', color: 'orange' },
            ].map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setActiveRoadmapTab(role.id)}
                className={`px-5 py-3 rounded-sm text-left transition-all cursor-pointer border flex flex-col min-w-[170px] sm:min-w-[210px] ${
                  activeRoadmapTab === role.id
                    ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] border-transparent shadow-xs'
                    : 'bg-[var(--color-canvas)] text-[var(--color-ink)] border-[var(--color-hairline)] hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <span className={`text-[8px] font-bold uppercase tracking-wider ${activeRoadmapTab === role.id ? 'text-[var(--color-mute-soft)]' : 'text-[var(--color-mute)]'}`}>
                  {role.desc}
                </span>
                <span className="text-xs sm:text-sm font-semibold mt-0.5">{role.label}</span>
              </button>
            ))}
          </div>

          {/* Steps Render Block */}
          <div className="bg-[var(--color-canvas)] border border-[var(--color-hairline)] rounded-md p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
              {/* Connector line for desktop */}
              <div className="hidden md:block absolute top-[28px] left-[10%] right-[10%] h-0.5 bg-[var(--color-hairline)] -z-20"></div>

              {roadmapSteps[activeRoadmapTab].map((step, idx) => (
                <div key={idx} className="flex flex-col items-center md:items-start text-center md:text-left space-y-4 relative group">
                  {/* Step Bubble */}
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-[var(--color-canvas)] border-2 border-[var(--color-hairline)] flex items-center justify-center text-[var(--color-ink)] font-extrabold text-lg shadow-xs transition-all duration-300 group-hover:border-[var(--color-accent-purple)] group-hover:text-[var(--color-accent-purple)]">
                      {idx + 1}
                    </div>
                    {/* Step line for mobile */}
                    {idx < 3 && (
                      <div className="md:hidden absolute top-14 left-7 w-0.5 h-8 bg-[var(--color-hairline)] -z-10"></div>
                    )}
                  </div>

                  {/* Step Info */}
                  <div className="space-y-1.5 md:pr-2">
                    <h4 className="text-xs sm:text-sm font-bold text-[var(--color-ink)]">
                      {step.title}
                    </h4>
                    <p className="text-[10px] sm:text-xs text-[var(--color-body-text)] leading-relaxed font-medium">
                      {step.desc}
                    </p>
                    <span className="inline-block text-[8px] font-bold uppercase text-[var(--color-accent-purple)] bg-[var(--color-accent-purple)]/10 px-2.5 py-0.5 rounded-sm mt-2">
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
                  <h3 className="text-lg sm:text-xl font-extrabold">Profil Sawangan Green Park — RT 04</h3>
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
                        <span className="text-xs sm:text-sm font-semibold">RT 04 / RW 06</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <User className="w-4 h-4 mt-0.5 shrink-0 opacity-80" />
                      <div>
                        <span className="block text-[8px] font-bold opacity-60 uppercase tracking-wider">Ketua RT Aktif</span>
                        <span className="text-xs sm:text-sm font-semibold">Bpk. Ahmad Mulyono</span>
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
                        <span className="text-xs sm:text-sm font-semibold">rt04.sgp@gmail.com</span>
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
                </div>

                {/* Quick stats row */}
                <div className="mt-8 pt-6 border-t border-white/10 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                  <h3 className="text-sm sm:text-base font-extrabold text-[var(--color-ink)] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[var(--color-accent-green)]" />
                    Arus Keuangan Kas RT
                  </h3>
                  <p className="text-[10px] text-[var(--color-body-mid)] mt-1">Data keuangan diperbarui secara real-time dari database transaksi.</p>
                </div>
                <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--color-accent-green)] bg-[var(--color-accent-green)]/15 px-2.5 py-1 rounded-sm border border-[var(--color-accent-green)]/20">LIVE</span>
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
                      <div className="p-3 bg-slate-50 dark:bg-slate-900/30 border border-[var(--color-hairline)] rounded-sm text-center">
                        <TrendingUp className="w-4 h-4 text-[var(--color-accent-green)] mx-auto mb-1" />
                        <span className="block text-xs sm:text-sm font-extrabold text-[var(--color-accent-green)]">{formatCurrency(dynIncome)}</span>
                        <span className="text-[8px] font-bold text-[var(--color-mute)] uppercase tracking-wider">Pemasukan</span>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-900/30 border border-[var(--color-hairline)] rounded-sm text-center">
                        <TrendingDown className="w-4 h-4 text-[var(--color-accent-red)] mx-auto mb-1" />
                        <span className="block text-xs sm:text-sm font-extrabold text-[var(--color-accent-red)]">{formatCurrency(dynExpense)}</span>
                        <span className="text-[8px] font-bold text-[var(--color-mute)] uppercase tracking-wider">Pengeluaran</span>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-900/30 border border-[var(--color-hairline)] rounded-sm text-center">
                        <Wallet className="w-4 h-4 text-[var(--color-accent-blue)] mx-auto mb-1" />
                        <span className={`block text-xs sm:text-sm font-extrabold ${dynBalance >= 0 ? 'text-[var(--color-accent-blue-deep)]' : 'text-[var(--color-accent-red)]'}`}>{formatCurrency(dynBalance)}</span>
                        <span className="text-[8px] font-bold text-[var(--color-mute)] uppercase tracking-wider">Saldo Aktif</span>
                      </div>
                    </div>

                    {/* Progress bars */}
                    <div className="space-y-3 font-sans">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[9px] font-bold text-[var(--color-body-mid)]">
                          <span>PEMASUKAN (ARUS MASUK)</span>
                          <span className="text-[var(--color-accent-green)] font-extrabold">{dynInPct}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-850 rounded-sm overflow-hidden">
                          <div className="h-full bg-[var(--color-accent-green)] rounded-sm transition-all duration-700" style={{ width: `${dynInPct}%` }}></div>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[9px] font-bold text-[var(--color-body-mid)]">
                          <span>PENGELUARAN (ARUS KELUAR)</span>
                          <span className="text-[var(--color-accent-red)] font-extrabold">{dynOutPct}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-850 rounded-sm overflow-hidden">
                          <div className="h-full bg-[var(--color-accent-red)] rounded-sm transition-all duration-700" style={{ width: `${dynOutPct}%` }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Donut chart for income vs expense */}
                    <div className="flex items-center justify-center gap-8">
                      <div className="relative">
                        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f1f5f9" strokeWidth="8" className="dark:stroke-slate-800" />
                          <circle cx="50" cy="50" r="38" fill="transparent" stroke="var(--color-accent-green)" strokeWidth="8"
                            strokeDasharray={`${2.39 * dynInPct} ${239 - 2.39 * dynInPct}`}
                            strokeLinecap="round"
                          />
                          <circle cx="50" cy="50" r="38" fill="transparent" stroke="var(--color-accent-red)" strokeWidth="8"
                            strokeDasharray={`${2.39 * dynOutPct} ${239 - 2.39 * dynOutPct}`}
                            strokeDashoffset={`${-(2.39 * dynInPct)}`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-[6px] font-bold text-[var(--color-mute)] uppercase">RASIO</span>
                          <span className="text-[9px] font-black text-[var(--color-ink)]">{dynInPct}:{dynOutPct}</span>
                        </div>
                      </div>
                      <div className="space-y-2 text-[9px] font-semibold">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-sm bg-[var(--color-accent-green)]"></div>
                          <span className="text-[var(--color-body-text)]">Pemasukan ({dynInPct}%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-sm bg-[var(--color-accent-red)]"></div>
                          <span className="text-[var(--color-body-text)]">Pengeluaran ({dynOutPct}%)</span>
                        </div>
                      </div>
                    </div>

                    {/* Recent 5 transactions */}
                    <div className="pt-4 border-t border-[var(--color-hairline)] space-y-2 font-sans">
                      <span className="text-[9px] font-bold text-[var(--color-mute)] uppercase tracking-wider block">5 Transaksi Terakhir</span>
                      {(() => {
                        const recentTx = transaksiKasList.length > 0
                          ? transaksiKasList.slice(0, 5)
                          : displayLedger;
                        return recentTx.map((tx, i) => (
                          <div key={i} className="flex items-center justify-between text-[10px] p-2.5 rounded-sm bg-slate-50/50 dark:bg-slate-900/30 border border-[var(--color-hairline)]">
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <span className="font-bold text-[var(--color-ink-strong)] block truncate">{tx.description || tx.kategori || 'Transaksi'}</span>
                              <span className="text-[8px] text-[var(--color-mute)] font-mono">{tx.transaction_date || tx.date || tx.tanggal || '—'}</span>
                            </div>
                            <span className={`font-bold shrink-0 ml-2 ${(tx.type === 'in' || tx.type === 'income') ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-accent-red)]'}`}>
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
                <h3 className="text-sm sm:text-base font-extrabold text-[var(--color-ink)] flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-[var(--color-accent-purple)]" />
                  Demografi Kependudukan
                </h3>
                <p className="text-[10px] text-[var(--color-body-mid)] mt-1">Statistik komposisi warga berdasarkan gender, usia, dan status hunian.</p>
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
                        <span className="text-[9px] font-bold text-[var(--color-mute)] uppercase tracking-wider">Rasio Gender</span>
                        <div className="relative">
                          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
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
                            <span className="text-base font-black text-[var(--color-ink)]">{totalPop}</span>
                            <span className="text-[7px] font-bold text-[var(--color-mute)] uppercase">Jiwa</span>
                          </div>
                        </div>
                        <div className="space-y-1 text-[9px] w-full font-semibold">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-sm bg-[var(--color-accent-blue)]"></div>
                              <span className="text-[var(--color-body-text)]">Laki-laki</span>
                            </div>
                            <span className="text-[var(--color-ink)]">{male} ({malePct}%)</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-sm bg-[var(--color-accent-pink)]"></div>
                              <span className="text-[var(--color-body-text)]">Perempuan</span>
                            </div>
                            <span className="text-[var(--color-ink)]">{female} ({femalePct}%)</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Hunian */}
                      <div className="flex flex-col items-center space-y-3">
                        <span className="text-[9px] font-bold text-[var(--color-mute)] uppercase tracking-wider">Status Hunian</span>
                        <div className="relative">
                          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
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
                            <Home className="w-3.5 h-3.5 text-slate-400 mb-0.5" />
                            <span className="text-[7px] font-bold text-[var(--color-mute)] uppercase">Hunian</span>
                          </div>
                        </div>
                        <div className="space-y-1 text-[9px] w-full font-semibold">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-sm bg-[var(--color-accent-green)]"></div>
                              <span className="text-[var(--color-body-text)]">Tetap</span>
                            </div>
                            <span className="text-[var(--color-ink)]">{tetap} ({tetapPct}%)</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-sm bg-[var(--color-accent-orange)]"></div>
                              <span className="text-[var(--color-body-text)]">Kontrak</span>
                            </div>
                            <span className="text-[var(--color-ink)]">{kontrak} ({kontrakPct}%)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Age Distribution Bars */}
                    <div className="pt-4 border-t border-[var(--color-hairline)] space-y-3 font-sans">
                      <span className="text-[9px] font-bold text-[var(--color-mute)] uppercase tracking-wider block">Distribusi Kelompok Usia</span>
                      {[
                        { label: 'Anak-anak (0–12 th)', count: anak, pct: anakPct, color: 'from-[var(--color-accent-blue)] to-[var(--color-accent-blue-deep)]' },
                        { label: 'Remaja (13–20 th)', count: remaja, pct: remajaPct, color: 'from-[var(--color-accent-purple)] to-[var(--color-accent-pink)]' },
                        { label: 'Dewasa (21–50 th)', count: dewasa, pct: dewasaPct, color: 'from-[var(--color-accent-green)] to-teal-500' },
                        { label: 'Lansia (>50 th)', count: lansia, pct: lansiaPct, color: 'from-[var(--color-accent-orange)] to-yellow-500' },
                      ].map((ag, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            <span>{ag.label}</span>
                            <span className="text-[var(--color-ink)] font-extrabold">{ag.count} orang ({ag.pct}%)</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 dark:bg-slate-850 rounded-sm overflow-hidden">
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
    </section>
  );
}
