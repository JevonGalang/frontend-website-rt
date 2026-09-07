import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { 
  Users, Calendar, Wallet, CheckCircle2, BarChart2, BookOpen, Layers, FileText,
  Lock, User, LogIn, ShieldAlert, Eye, EyeOff, Loader2,
  MapPin, Phone, Mail, Home, TrendingUp, TrendingDown, PieChart, Activity,
  Clock, AlertTriangle, Shield, Building2, Megaphone, Landmark, GraduationCap,
  Camera, Play, Video, Image, Sparkles, Filter, Maximize2, X,
  Award, Heart
} from 'lucide-react';
import dummyImg1 from '../assets/dummy/dummy_1.png';
import dummyImg2 from '../assets/dummy/dummy_2.png';
import dummyImg3 from '../assets/dummy/dummy_3.jpg';
import dummyImg4 from '../assets/dummy/dummy_4.jpg';
import dummyImg5 from '../assets/dummy/dummy_5.jpg';
import OtpVerificationModal from './OtpVerificationModal';
import { setSession } from '../utils/authSession';
import { API_BASE_URL } from '../config/api';

// ═════════════════════════════════════════════════════════════════════════
// DUMMY CMS DATA TEMPLATE: Siap dihubungkan ke Endpoint API / Database CMS
// ═════════════════════════════════════════════════════════════════════════
const DUMMY_DOKUMENTASI = [
  {
    id: 'doc-1',
    title: 'Kerja Bakti Massal & Penghijauan Taman',
    category: 'Gotong Royong',
    type: 'image',
    date: '20 Agustus 2026',
    location: 'Taman Utama & Jalur Hijau RT 05',
    thumbnail: dummyImg1,
    description: 'Kegiatan gotong royong rutin warga dalam merapikan fasilitas umum, pembersihan saluran drainase, dan penanaman pohon peneduh di lingkungan komplek.'
  },
  {
    id: 'doc-2',
    title: 'Semarak Perayaan & Pentas Seni HUT RI ke-81',
    category: 'HUT RI',
    type: 'video',
    duration: '03:24',
    date: '17 Agustus 2026',
    location: 'Lapangan Serbaguna RT 05 / RW 11',
    thumbnail: dummyImg2,
    description: 'Dokumentasi video kemeriahan lomba anak-anak, karnaval kostum daerah, serta malam panggung gembira perayaan kemerdekaan RI warga Villa Mutiara Mas Cinere.'
  },
  {
    id: 'doc-3',
    title: 'Senam Sehat Bugar & Jalan Santai Keluarga',
    category: 'Olahraga',
    type: 'image',
    date: '10 Agustus 2026',
    location: 'Area Bundaran Utama Komplek',
    thumbnail: dummyImg3,
    description: 'Aktivitas kebugaran jasmani bersama instruktur profesional dilanjutkan jalan santai keluarga untuk mempererat tali silaturahmi antarwarga.'
  },
  {
    id: 'doc-4',
    title: 'Layanan Posyandu Balita & Skrining Lansia',
    category: 'Kesehatan',
    type: 'image',
    date: '05 Agustus 2026',
    location: 'Balai Warga RW 011',
    thumbnail: dummyImg4,
    description: 'Pemeriksaan kesehatan berkala, imunisasi balita, penimbangan berat badan, dan cek tensi/gula darah gratis untuk lansia bekerjasama dengan Puskesmas Cinere.'
  },
  {
    id: 'doc-5',
    title: 'Turnamen Badminton Antar-RT Se-RW 11',
    category: 'Olahraga',
    type: 'image',
    date: '28 Juli 2026',
    location: 'Gedung Olahraga (GOR) Komunitas',
    thumbnail: dummyImg5,
    description: 'Kompetisi bulutangkis ganda putra dan campuran yang diikuti perwakilan warga RT 001 hingga RT 009 dalam rangka menjunjung sportivitas.'
  },
  {
    id: 'doc-6',
    title: 'Rapat Koordinasi & Rembug Warga Triwulan III',
    category: 'Sosial',
    type: 'video',
    duration: '01:50',
    date: '15 Juli 2026',
    location: 'Ruang Pertemuan Balai Warga',
    thumbnail: dummyImg3,
    description: 'Musyawarah keterbukaan anggaran kas RT, evaluasi program kebersihan lingkungan, serta pembahasan rencana perbaikan pos keamanan portal.'
  }
];

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
  const [activeMainTab, setActiveMainTab] = useState('login'); // 'login' | 'info'

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

  // Documentation / Gallery states (Pure API: GET /post/arsip-media)
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [serverArchives, setServerArchives] = useState([]);
  const [isLoadingArchives, setIsLoadingArchives] = useState(false);

  const fetchPublicArchives = async () => {
    try {
      setIsLoadingArchives(true);
      const res = await fetch(`${API_BASE_URL}/post/arsip-media?limit=24`);
      if (res.ok) {
        const data = await res.json();
        
        // Extract array from backend response
        let rawItems = [];
        if (Array.isArray(data)) {
          rawItems = data;
        } else if (Array.isArray(data.output?.pesan?.items)) {
          rawItems = data.output.pesan.items;
        } else if (Array.isArray(data.output?.pesan)) {
          rawItems = data.output.pesan;
        } else if (Array.isArray(data.output?.items)) {
          rawItems = data.output.items;
        } else if (Array.isArray(data.output?.data)) {
          rawItems = data.output.data;
        } else if (Array.isArray(data.output)) {
          rawItems = data.output;
        } else if (Array.isArray(data.items)) {
          rawItems = data.items;
        }

        if (rawItems.length > 0) {
          const mapped = rawItems.map(item => {
            const rawUrl = item.media_url || (item.id ? `/post/arsip-media/${item.id}/file` : '');
            const fullUrl = rawUrl 
              ? (rawUrl.startsWith('http') ? rawUrl : `${API_BASE_URL}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`)
              : `${API_BASE_URL}/post/arsip-media/${item.id}/file`;
            
            const isVideo = 
              (item.media_type && item.media_type.toLowerCase().includes('video')) || 
              (item.mime_type && item.mime_type.toLowerCase().includes('video')) ||
              /\.(mp4|webm|mov|mkv|avi|mpeg)$/i.test(item.original_name || item.media_url || item.judul || item.name || '');

            return {
              id: item.id || `arc-${Math.random()}`,
              title: item.judul || item.title || item.name || 'Dokumentasi Kegiatan',
              category: item.kategori || item.category || 'Dokumentasi Umum',
              type: isVideo ? 'video' : 'image',
              mime_type: item.mime_type || (isVideo ? 'video/mp4' : 'image/jpeg'),
              date: item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Dokumentasi Lingkungan',
              location: 'Lingkungan RT 05',
              thumbnail: fullUrl,
              media_url: fullUrl,
              description: item.judul || item.description || 'Dokumentasi kegiatan warga RT 05.',
              file_size: item.file_size
            };
          });
          setServerArchives(mapped);
          console.info('[Hero] Galeri arsip media berhasil dimuat dari API backend:', mapped.length, 'item');
        } else {
          setServerArchives([]);
        }
      } else {
        console.warn(`[Hero] API /post/arsip-media respon status ${res.status}.`);
      }
    } catch (err) {
      console.warn('[Hero] Gagal memuat arsip media dari API server:', err.message);
    } finally {
      setIsLoadingArchives(false);
    }
  };

  useEffect(() => {
    fetchPublicArchives();
  }, []);

  const activeDokumentasiList = serverArchives.length > 0 ? serverArchives : DUMMY_DOKUMENTASI;

  const filteredDokumentasi = selectedCategory === 'all'
    ? activeDokumentasiList
    : selectedCategory === 'image'
    ? activeDokumentasiList.filter(d => d.type === 'image')
    : selectedCategory === 'video'
    ? activeDokumentasiList.filter(d => d.type === 'video')
    : activeDokumentasiList.filter(d => (d.category || '').toLowerCase() === selectedCategory.toLowerCase());

  // Modal dialog for Emergency Call
  const handleEmergencyClick = (emg) => {
    Swal.fire({
      title: `📞 ${emg.title}`,
      html: `
        <div class="space-y-3 text-left font-sans text-xs pt-2">
          <p class="text-slate-500 font-medium">${emg.subtitle}</p>
          <div class="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-center">
            <span class="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">Nomor Siaga Utama</span>
            <span class="text-lg font-black font-mono text-orange-600">${emg.phone}</span>
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
    const reqList = srv.requirements.map(r => `<li class="flex items-center gap-2 text-slate-700 font-semibold py-1 border-b border-slate-100"><span class="text-orange-500 font-bold">✓</span> ${r}</li>`).join('');
    Swal.fire({
      title: `📋 ${srv.title}`,
      html: `
        <div class="space-y-3 text-left font-sans text-xs pt-2">
          <div class="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span class="font-bold text-orange-600 uppercase text-[10px] bg-orange-500/10 px-2 py-0.5 rounded-md">${srv.category}</span>
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
      const response = await fetch(`${API_BASE_URL}/post/login`, {
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

      const localCitizen = wargaList.find(w => w.username.toLowerCase() === resData.user.username.toLowerCase());
      
      const userSession = {
        ...localCitizen,
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
        setIsLoggingIn(false);
        setCurrentUser(userSession);
        
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

    // Flow 2: If credentials exist in React state, re-trigger login.
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
    <section
      id="beranda"
      className="relative min-h-screen pt-6 sm:pt-10 pb-20 flex flex-col items-center justify-center overflow-hidden bg-[var(--color-canvas)] text-[var(--color-ink)]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-grow flex flex-col justify-center font-sans relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Welcoming Text Column */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            <div className="text-orange-600 dark:text-orange-400 text-xs sm:text-sm font-extrabold tracking-wider uppercase">
              Portal Informasi & Layanan Mandiri RT 05
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-black tracking-tight text-[var(--color-ink)] leading-[1.1] lg:tracking-[-0.8px]">
              Selamat Datang di Portal <br className="hidden sm:inline" />
              <span className="text-orange-600 dark:text-orange-400">
                Villa Mutiara Cinere
              </span>
            </h1>
            
            <p className="text-xs sm:text-base text-[var(--color-body-text)] max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Mewujudkan lingkungan hunian yang asri, aman, rukun, dan berteknologi demi kenyamanan bersama. Akses layanan persuratan mandiri, pelaporan iuran bulanan, dan transparansi kas RT 05 secara instan dan terbuka.
            </p>

            {/* Characteristics Card (Option 3: 2-Column Split with Individual Lucide Icons) */}
            <div className="w-full p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs text-left space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Karakteristik & Fasilitas Wilayah
                  </span>
                  <span className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                    Villa Mutiara Cinere
                  </span>
                </div>
              </div>

              {/* 2-Column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                
                {/* 1. Kawasan Perumahan */}
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80">
                  <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                    Kawasan perumahan menengah terdiri dari 9 RT
                  </p>
                </div>

                {/* 2. Sarana Ibadah */}
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80">
                  <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 shrink-0">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                    Memiliki sarana ibadah
                  </p>
                </div>

                {/* 3. Fasilitas Olahraga */}
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80">
                  <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                    Memiliki fasilitas olahraga
                  </p>
                </div>

                {/* 4. Sarana Pendidikan */}
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80">
                  <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                    Terdapat pendidikan anak usia dini dan TKIT
                  </p>
                </div>

              </div>
            </div>
          </div>
          
          {/* Summary / Access Portal Column (Right Side) */}
          <div className="lg:col-span-5 flex justify-center w-full">
            <div className="relative w-full max-w-md">
              {/* Core Feature Card (rounded-md with hairline border) */}
              <div className="bg-[var(--color-canvas)] border border-[var(--color-hairline)] rounded-xl sm:rounded-md p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 shadow-md w-full">
                
                {/* Main Access Header (Shown if guest) */}
                {!currentUser ? (
                  <div className="flex bg-slate-50 dark:bg-slate-950 p-2 rounded-sm border border-[var(--color-hairline)] text-xs font-bold font-sans items-center justify-center gap-2 text-[var(--color-ink)]">
                    <Lock className="w-4 h-4 text-[var(--color-primary-wf)]" />
                    <span>Portal Login Warga & Staf</span>
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
                {!currentUser && (
                  <div className="space-y-4 animate-fade-in font-sans">
                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-[var(--color-ink)]">Gerbang Masuk Warga & Staf</h3>
                      <p className="text-[10px] text-[var(--color-body-mid)]">Silakan login untuk mengakses layanan mandiri & administrasi RT.</p>
                    </div>

                    <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs font-semibold">
                      {error ? (
                        <div className="p-3 bg-[var(--color-accent-red)]/10 border border-[var(--color-accent-red)]/20 text-[var(--color-accent-red)] rounded-sm flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 shrink-0" />
                          <span>{error}</span>
                        </div>
                      ) : success ? (
                        <div className="p-3 bg-[var(--color-accent-green)]/10 border border-[var(--color-accent-green)]/20 text-[var(--color-accent-green)] rounded-sm flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0 animate-pulse" />
                          <span>{success}</span>
                        </div>
                      ) : null}

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
                {currentUser && (
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
            DOKUMENTASI & GALERI KEGIATAN WARGA (DUMMY CMS GRID TEMPLATE)
            ═══════════════════════════════════════════════════════════════════ */}
        {!currentUser && (
          <div className="mt-16 pt-12 border-t border-[var(--color-hairline)] w-full font-sans space-y-8 animate-fade-in">
            {/* Section Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 text-left">
              <div className="space-y-2">
                <span className="px-3 py-1.5 rounded-sm border border-[var(--color-hairline)] bg-slate-50 dark:bg-slate-900 text-[var(--color-ink)] text-[9px] font-bold tracking-wider uppercase inline-flex items-center gap-1.5 w-fit">
                  <Camera className="w-3.5 h-3.5 text-orange-500" /> Galeri & Momen Lingkungan
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--color-ink)] tracking-tight">
                  Dokumentasi Kegiatan Warga
                </h2>
                <p className="text-xs sm:text-sm text-[var(--color-body-mid)] max-w-xl">
                  Dokumentasi acara kegiatan warga Villa Mutiara Mas Cinere
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-900/80 p-1.5 rounded-xl border border-[var(--color-hairline)] text-xs font-bold">
                {[
                  { id: 'all', label: 'Semua' },
                  { id: 'image', label: 'Foto' },
                  { id: 'video', label: 'Video' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedCategory(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                      selectedCategory === tab.id
                        ? 'bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 shadow-xs font-black'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid 6 Items (3 columns on lg, 2 on sm, 1 on mobile) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {filteredDokumentasi.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedMedia(item)}
                  className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-xs hover:shadow-lg hover:border-orange-500/40 transition-all duration-300 cursor-pointer flex flex-col justify-between text-left"
                >
                  {/* Thumbnail Container */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                    {item.type === 'video' ? (
                      item.media_url ? (
                        <div className="w-full h-full relative flex items-center justify-center bg-slate-950">
                          <video
                            src={`${item.media_url}#t=0.5`}
                            preload="metadata"
                            muted
                            playsInline
                            crossOrigin="anonymous"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30"></div>
                        </div>
                      ) : (
                        <div className="w-full h-full relative">
                          <img
                            src={item.thumbnail || dummyImg3}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30"></div>
                        </div>
                      )
                    ) : (
                      <>
                        <img
                          src={item.thumbnail || item.media_url}
                          alt={item.title}
                          crossOrigin="anonymous"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = dummyImg1;
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>
                      </>
                    )}

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                      <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-wider">
                        {item.category}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-orange-600/90 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1">
                        {item.type === 'video' ? (
                          <>
                            <Play className="w-3 h-3 fill-current" />
                            <span>{item.duration || 'Video'}</span>
                          </>
                        ) : (
                          <>
                            <Camera className="w-3 h-3" />
                            <span>Foto</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Center Play Button for Video */}
                    {item.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-orange-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-orange-500 transition-all duration-300">
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-orange-500" />
                          {item.date}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 truncate max-w-[140px]">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {item.location}
                        </span>
                      </div>

                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-1">
                        {item.title}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-orange-600 dark:text-orange-400">
                      <span>Lihat Dokumentasi</span>
                      <Maximize2 className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                TENTANG VILLA MUTIARA MAS CINERE (PROFIL SINGKAT)
                ═══════════════════════════════════════════════════════════════════ */}
            <div className="pt-14 border-t border-[var(--color-hairline)] w-full font-sans space-y-6">
              {/* Section Header */}
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--color-ink)] tracking-tight">
                  Tentang Villa Mutiara Cinere
                </h2>
              </div>

              {/* Clean Single Profile Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-8 space-y-3 shadow-xs text-left max-w-4xl mx-auto">
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-extrabold text-xs uppercase tracking-wider">
                  <Landmark className="w-4 h-4" />
                  <span>Profil Perumahan</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Villa Mutiara Mas Cinere merupakan kawasan hunian perumahan menengah yang terletak di Kelurahan Grogol, Kecamatan Limo, Kota Depok. Memadukan kenyamanan kehidupan perumahan asri, tertib, dan aman dengan sistem tata kelola lingkungan RT 05 yang transparan dan berbasis digital demi kemudahan pelayanan mandiri seluruh warga.
                </p>
              </div>

              {/* ═══════════════════════════════════════════════════════════════════
                  BAGAN STRUKTUR PENGURUS RT 05
                  ═══════════════════════════════════════════════════════════════════ */}
              <div className="pt-6 space-y-8 max-w-4xl mx-auto">
                <div className="text-center space-y-1.5">
                  <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] font-extrabold uppercase tracking-wider">
                    Struktur Organisasi
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Bagan Pengurus RT 006  RW 011
                  </h3>
                </div>

                {/* Tree Structure Visual */}
                <div className="flex flex-col items-center justify-center">
                  
                  {/* Level 1: Ketua RT */}
                  <div className="relative flex flex-col items-center z-10">
                    <div className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-orange-500/40 shadow-md shadow-orange-500/5 hover:border-orange-500 transition-all min-w-[260px] sm:min-w-[290px]">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center font-black text-sm shadow-md shrink-0">
                        <User className="w-6 h-6" />
                      </div>
                      <div className="text-left space-y-0.5">
                        <span className="block text-[10px] font-extrabold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                          Ketua RT 006 / RW 011
                        </span>
                        <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                          Wartono SE
                        </h4>
                      </div>
                    </div>

                    {/* Connector line down from Ketua */}
                    <div className="w-0.5 h-8 bg-orange-500/40 dark:bg-orange-500/30"></div>
                  </div>

                  {/* Horizontal Crossbar Connector (Desktop) */}
                  <div className="relative w-full max-w-xl">
                    <div className="hidden sm:block absolute top-0 left-1/4 right-1/4 h-0.5 bg-orange-500/40 dark:bg-orange-500/30"></div>
                    <div className="hidden sm:block absolute top-0 left-1/4 w-0.5 h-6 bg-orange-500/40 dark:bg-orange-500/30"></div>
                    <div className="hidden sm:block absolute top-0 right-1/4 w-0.5 h-6 bg-orange-500/40 dark:bg-orange-500/30"></div>

                    {/* Level 2: Sekretaris & Bendahara Columns */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 pt-0 sm:pt-6 w-full">
                      
                      {/* Branch 1: Sekretaris */}
                      <div className="flex flex-col items-center space-y-3">
                        {/* Group Header Badge */}
                        <div className="px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold uppercase tracking-wider w-fit">
                          Sekretariat
                        </div>

                        {/* Member: Yulia Sutianti */}
                        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-blue-500/50 transition-all w-full max-w-[260px]">
                          <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                            <User className="w-5 h-5" />
                          </div>
                          <div className="text-left min-w-0 flex-1">
                            <span className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Sekretaris</span>
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate block">Yulia Sutianti</span>
                          </div>
                        </div>
                      </div>

                      {/* Branch 2: Bendahara */}
                      <div className="flex flex-col items-center space-y-3">
                        {/* Group Header Badge */}
                        <div className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold uppercase tracking-wider w-fit">
                          Bendahara / Keuangan
                        </div>

                        {/* Member: Arief Kurniawan */}
                        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-amber-500/50 transition-all w-full max-w-[260px]">
                          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                            <User className="w-5 h-5" />
                          </div>
                          <div className="text-left min-w-0 flex-1">
                            <span className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Bendahara</span>
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate block">Arief Kurniawan</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

                {/* ═══════════════════════════════════════════════════════════════════
            QUICK ACCESS PORTAL & INFORMASI DASHBOARD (HANYA UNTUK USER LOGIN)
            ═══════════════════════════════════════════════════════════════════ */}
        {currentUser && (
          <>
        <div className="mt-16 pt-12 border-t border-[var(--color-hairline)] w-full font-sans space-y-10 sm:space-y-12">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="px-3 py-1.5 rounded-sm border border-[var(--color-hairline)] bg-slate-50 dark:bg-slate-900 text-[var(--color-ink)] text-[9px] font-bold tracking-wider uppercase inline-flex items-center justify-center gap-1.5 w-fit mx-auto">
              <Megaphone className="w-3.5 h-3.5 text-orange-500" /> Akses Cepat & Pusat Informasi RT
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
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
              <div className="p-2.5 sm:p-3 bg-orange-500 text-white rounded-xl sm:rounded-2xl shadow-md shadow-orange-500/20 shrink-0">
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
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
              <div className="p-2.5 sm:p-3 bg-blue-500 text-white rounded-xl sm:rounded-2xl shadow-md shadow-blue-500/20 shrink-0">
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
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
              <div className="p-2.5 sm:p-3 bg-indigo-500 text-white rounded-xl sm:rounded-2xl shadow-md shadow-indigo-500/20 shrink-0">
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
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
              <div className="p-2.5 sm:p-3 bg-emerald-500 text-white rounded-xl sm:rounded-2xl shadow-md shadow-emerald-500/20 shrink-0">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">
                  {publicStats?.ipl_lunas || 42} <span className="text-xs text-orange-600 dark:text-orange-400 font-bold">KK</span>
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block truncate">IPL Lunas</span>
              </div>
            </div>

            {/* 5. IPL Belum Lunas */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
              <div className="p-2.5 sm:p-3 bg-amber-500 text-white rounded-xl sm:rounded-2xl shadow-md shadow-amber-500/20 shrink-0">
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
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
              <div className="p-2.5 sm:p-3 bg-cyan-500 text-white rounded-xl sm:rounded-2xl shadow-md shadow-cyan-500/20 shrink-0">
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
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
              <div className="p-2.5 sm:p-3 bg-purple-500 text-white rounded-xl sm:rounded-2xl shadow-md shadow-purple-500/20 shrink-0">
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
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
              <div className="p-2.5 sm:p-3 bg-rose-500 text-white rounded-xl sm:rounded-2xl shadow-md shadow-rose-500/20 shrink-0">
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
              MODUL 1: PUSAT KONTAK DARURAT (SOLID COLOR PALETTE)
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xs space-y-4 sm:space-y-6">
            
            {/* Unified Header for Emergency Contacts Rumpun */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 sm:p-3 bg-orange-500 text-white rounded-2xl shadow-md shadow-orange-500/20 shrink-0">
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
              <span className="px-3 py-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 font-extrabold text-xs rounded-full shadow-xs w-fit whitespace-nowrap">
                🚨 Layanan Siaga 24 Jam
              </span>
            </div>

            {/* 4 Emergency Contact Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { id: 'emg-1', title: 'Pos Keamanan RT 05', subtitle: 'Keamanan 24 Jam Satpam', phone: '0812-9988-7711', altPhone: 'Ext. Pos Satpam Utama', badge: 'Keamanan', color: 'emerald' },
                { id: 'emg-2', title: 'Ketua RT 05 Cinere', subtitle: 'Bpk. Achmad Mulyono', phone: '0812-3456-7890', altPhone: 'Rumah Blok B3 No. 12', badge: 'Pengurus RT', color: 'emerald' },
                { id: 'emg-3', title: 'Ambulans & Medis Depok', subtitle: 'Layanan Medis Darurat', phone: '119 / (021) 777-8899', altPhone: 'RSUD Depok / Cinere', badge: 'Kesehatan', color: 'emerald' },
                { id: 'emg-4', title: 'Polsek Cinere Depok', subtitle: 'Kepolisian Sektor', phone: '(021) 778-5544', altPhone: 'Layanan Pengaduan 110', badge: 'Kepolisian', color: 'emerald' },
              ].map((emg) => (
                <div
                  key={emg.id}
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.open(`tel:${emg.phone.replace(/[^0-9+]/g, '')}`, '_self');
                    }
                  }}
                  className="bg-white/90 dark:bg-slate-950/80 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800/80 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-md hover:border-orange-500/40 dark:hover:border-orange-500/40 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-xl text-white shadow-xs bg-gradient-to-br from-orange-500 to-amber-600 shadow-orange-500/20">
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase border bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20">
                        {emg.badge}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
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
                    className="mt-3.5 w-full py-2 px-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
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
                  <BookOpen className="w-5 h-5 text-orange-500" /> Panduan Syarat Persuratan Publik
                </h3>
                <p className="text-xs text-slate-400">Daftar dokumen persyaratan yang wajib disiapkan sebelum mengajukan permohonan surat pengantar.</p>
              </div>
              <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20 w-fit">
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
                      <span className="px-2.5 py-0.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 rounded-full text-[9px] font-extrabold uppercase">
                        {srv.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">⏱️ {srv.estimate}</span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                      {srv.title}
                    </h4>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Persyaratan Utama:</span>
                      {srv.requirements.map((req, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                          <span className="text-orange-500 text-xs">✓</span>
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
                    className="mt-4 w-full py-2 px-3 bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-extrabold text-xs rounded-xl border border-orange-500/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
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
              Informasi terbuka kependudukan, keuangan kas RT, dan kepatuhan iuran warga Villa Mutiara Mas Cinere. Seluruh data dapat diakses publik tanpa memerlukan login.
            </p>
          </div>

          {/* ─── BIODATA SAWANGAN GREEN PARK ─── */}
          <div className="mb-12">
            <div className="bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] rounded-md p-8 sm:p-10 relative overflow-hidden shadow-md">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <Building2 className="w-5 h-5" />
                  <h3 className="text-lg sm:text-xl font-extrabold">Profil Villa Mutiara Mas Cinere — RT 05</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 mt-0.5 shrink-0 opacity-80" />
                      <div>
                        <span className="block text-[8px] font-bold opacity-60 uppercase tracking-wider">Alamat Lengkap</span>
                        <span className="text-xs sm:text-sm font-semibold leading-snug">Perumahan Villa Mutiara Mas Cinere, Kel. Cinere, Kec. Cinere, Kota Depok, Jawa Barat 16514</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Home className="w-4 h-4 mt-0.5 shrink-0 opacity-80" />
                      <div>
                        <span className="block text-[8px] font-bold opacity-60 uppercase tracking-wider">Wilayah Cakupan</span>
                        <span className="text-xs sm:text-sm font-semibold">RT 05 / RW 11</span>
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
                        { label: 'Dewasa (21–50 th)', count: dewasa, pct: dewasaPct, color: 'from-[var(--color-accent-green)] to-amber-500' },
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
                  gradient: 'from-[var(--color-accent-green)] to-amber-400'
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
                              <div className="h-full bg-gradient-to-r from-[var(--color-accent-green)] to-amber-400 rounded-sm" style={{ width: `${row.pct}%` }}></div>
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
              Data statistik & informasi dashboard ini khusus dapat diakses oleh warga dan pengurus yang telah terverifikasi dan login ke portal resmi RT.
              <br />Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.
            </p>
          </div>
        </div>
        </>
        )}

      </div>

      {/* Modal Popup Preview Dokumentasi (CMS Ready) */}
      {selectedMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in font-sans text-left">
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-scale-up">
            
            {/* Close Button */}
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Media Area */}
            <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
              {selectedMedia.type === 'video' ? (
                selectedMedia.media_url ? (
                  <video
                    key={selectedMedia.id || selectedMedia.media_url}
                    controls
                    autoPlay
                    playsInline
                    preload="auto"
                    crossOrigin="anonymous"
                    className="w-full h-full object-contain bg-black"
                    src={selectedMedia.media_url}
                  >
                    <source src={selectedMedia.media_url} type={selectedMedia.mime_type || 'video/mp4'} />
                    Browser Anda tidak mendukung pemutar video HTML5.
                  </video>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-white space-y-3 p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-orange-600 flex items-center justify-center shadow-lg">
                      <Play className="w-8 h-8 fill-current ml-1" />
                    </div>
                    <span className="text-xs font-bold text-slate-300">Video Dokumentasi Kegiatan ({selectedMedia.duration || 'HD'})</span>
                    <p className="text-[11px] text-slate-500">Video siap diputar otomatis saat dihubungkan ke storage / media server backend</p>
                  </div>
                )
              ) : (
                <img
                  src={selectedMedia.media_url || selectedMedia.thumbnail}
                  alt={selectedMedia.title}
                  crossOrigin="anonymous"
                  className="w-full h-full object-contain bg-black"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = dummyImg1;
                  }}
                />
              )}
            </div>

            {/* Info Area */}
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold text-[10px] uppercase tracking-wider">
                  {selectedMedia.category}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {selectedMedia.date} • {selectedMedia.location}
                </span>
              </div>

              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {selectedMedia.title}
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {selectedMedia.description}
              </p>

              <div className="pt-3 flex justify-end">
                <button
                  onClick={() => setSelectedMedia(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Tutup Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
