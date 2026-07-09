import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, User, Volume2, Calendar, Phone, Wallet, History, Upload, 
  FileText, Send, AlertTriangle, FolderOpen, Bell, Settings, 
  CheckCircle2, AlertCircle, Trash2, Eye, EyeOff, Lock, 
  Landmark, LogOut, Sun, Moon, Sparkles, ChevronDown, ChevronRight, X, Edit2, Save
} from 'lucide-react';

export default function ProfilWarga({ 
  currentUser, 
  setCurrentUser,
  onUpdateProfile, 
  wargaList = [],
  submissionsList = [],
  setSubmissionsList,
  agendaList = [],
  transaksiKasList = [],
  darkMode,
  setDarkMode
}) {
  // Navigation & Collapsible Menu States
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isInformasiOpen, setIsInformasiOpen] = useState(true);
  const [isIuranOpen, setIsIuranOpen] = useState(true);
  const [isSuratOpen, setIsSuratOpen] = useState(true);
  
  // Profile Form & Password verification States
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser ? currentUser.name || '' : '',
    username: currentUser ? currentUser.username || '' : '',
    password: currentUser ? currentUser.password || '' : '',
    nik: currentUser ? currentUser.nik || '' : '',
    noKk: currentUser ? currentUser.noKk || '' : '',
    alamat: currentUser ? currentUser.alamat || '' : '',
    gender: currentUser ? currentUser.gender || 'Laki-laki' : 'Laki-laki',
    usia: currentUser ? currentUser.usia || '' : '',
    status: currentUser ? currentUser.status || 'Tetap' : 'Tetap',
    email: currentUser ? currentUser.email || '' : '',
    noHp: currentUser ? currentUser.noHp || '' : '',
  });

  const [revealPassword, setRevealPassword] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [promptPasswordInput, setPromptPasswordInput] = useState('');
  const [promptError, setPromptError] = useState('');
  const [pendingAction, setPendingAction] = useState(''); // 'edit' | 'reveal_pwd'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Letter Request Form States
  const [letterForm, setLetterForm] = useState({
    tipeSurat: 'Surat Pengantar Pengurusan KTP',
    keperluan: ''
  });

  // Arrears Payment Form States
  const [buktiBayarList, setBuktiBayarList] = useState(() => {
    const saved = localStorage.getItem('rt_warga_bukti_bayar');
    return saved ? JSON.parse(saved) : [];
  });
  const [buktiBayarForm, setBuktiBayarForm] = useState({
    nominal: '',
    bulan: 'Juli',
    catatan: ''
  });

  // Complaint States
  const [pengaduanList, setPengaduanList] = useState(() => {
    const saved = localStorage.getItem('rt_warga_pengaduan_list');
    return saved ? JSON.parse(saved) : [
      { id: 'COM-101', date: '2026-07-01', category: 'Keamanan', description: 'Lampu penerangan jalan dekat gapura padam, mohon ditinjau.', status: 'Selesai' }
    ];
  });
  const [pengaduanForm, setPengaduanForm] = useState({
    category: 'Fasilitas Umum',
    description: ''
  });

  // Change Password Form State
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Save changes helper
  useEffect(() => {
    localStorage.setItem('rt_warga_bukti_bayar', JSON.stringify(buktiBayarList));
  }, [buktiBayarList]);

  useEffect(() => {
    localStorage.setItem('rt_warga_pengaduan_list', JSON.stringify(pengaduanList));
  }, [pengaduanList]);

  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const handleCancel = () => {
    setFormData({
      name: currentUser.name || '',
      username: currentUser.username || '',
      password: currentUser.password || '',
      nik: currentUser.nik || '',
      noKk: currentUser.noKk || '',
      alamat: currentUser.alamat || '',
      gender: currentUser.gender || 'Laki-laki',
      usia: currentUser.usia || '',
      status: currentUser.status || 'Tetap',
      email: currentUser.email || '',
      noHp: currentUser.noHp || '',
    });
    setIsEditing(false);
  };

  const handleEditClick = () => {
    setPendingAction('edit');
    setPromptPasswordInput('');
    setPromptError('');
    setShowPasswordPrompt(true);
  };

  const handleConfirmPassword = (e) => {
    e.preventDefault();
    if (promptPasswordInput === currentUser.password) {
      setShowPasswordPrompt(false);
      if (pendingAction === 'edit') {
        setIsEditing(true);
      }
    } else {
      setPromptError('Sandi akun salah.');
    }
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.email || !formData.noHp) {
      setError('Email dan nomor HP wajib diisi.');
      return;
    }

    const updated = {
      ...currentUser,
      email: formData.email,
      noHp: formData.noHp,
    };

    onUpdateProfile(updated);
    setSuccess('Profil berhasil diperbarui!');
    setIsEditing(false);
  };

  const handleLetterSubmit = (e) => {
    e.preventDefault();
    if (!letterForm.keperluan.trim()) {
      alert('Silakan tulis keperluan pengajuan surat.');
      return;
    }

    const newSubmission = {
      id: 'LTR-' + Math.floor(Math.random() * 90000 + 10000),
      wargaId: currentUser.id,
      wargaNama: currentUser.name,
      wargaTipeSurat: letterForm.tipeSurat,
      wargaKeperluan: letterForm.keperluan,
      status: 'Pending',
      submissionDate: new Date().toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };

    setSubmissionsList([newSubmission, ...submissionsList]);
    alert('Pengajuan surat pengantar berhasil dikirim ke Pengurus RT!');
    setLetterForm({
      tipeSurat: 'Surat Pengantar Pengurusan KTP',
      keperluan: ''
    });
    setActiveTab('layanan_status');
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!buktiBayarForm.nominal) {
      alert('Silakan masukkan nominal transfer.');
      return;
    }

    const newUpload = {
      id: 'UP-' + Math.floor(Math.random() * 9000 + 1000),
      date: new Date().toISOString().split('T')[0],
      nominal: parseInt(buktiBayarForm.nominal) || 0,
      bulan: buktiBayarForm.bulan,
      catatan: buktiBayarForm.catatan,
      status: 'Menunggu Verifikasi'
    };

    setBuktiBayarList([newUpload, ...buktiBayarList]);
    alert(`Sukses mengupload bukti iuran bulan ${buktiBayarForm.bulan}. Tunggu verifikasi Bendahara.`);
    setBuktiBayarForm({ nominal: '', bulan: 'Juli', catatan: '' });
    setActiveTab('iuran_riwayat');
  };

  const handleComplaintSubmit = (e) => {
    e.preventDefault();
    if (!pengaduanForm.description.trim()) {
      alert('Silakan isi deskripsi pengaduan.');
      return;
    }

    const newComplaint = {
      id: 'COM-' + Math.floor(Math.random() * 900 + 100),
      date: new Date().toISOString().split('T')[0],
      category: pengaduanForm.category,
      description: pengaduanForm.description,
      status: 'Diterima'
    };

    setPengaduanList([newComplaint, ...pengaduanList]);
    alert('Laporan pengaduan lingkungan berhasil dikirim!');
    setPengaduanForm({ category: 'Fasilitas Umum', description: '' });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordForm.oldPassword !== currentUser.password) {
      alert('Kata sandi lama salah.');
      return;
    }
    if (passwordForm.newPassword.length < 5) {
      alert('Sandi baru minimal 5 karakter.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Konfirmasi sandi tidak sesuai.');
      return;
    }

    const updated = {
      ...currentUser,
      password: passwordForm.newPassword
    };

    onUpdateProfile(updated);
    alert('Kata sandi berhasil diperbarui!');
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setActiveTab('dashboard');
  };

  // Derived properties
  const mySubmissions = submissionsList.filter(s => s.wargaId === currentUser.id);
  const myPayments = transaksiKasList.filter(t => t.description.includes(currentUser.name));

  // Resolved dynamic values for mock alignment
  const rtRw = currentUser.rtRw || '04 / 09';
  const tanggalLahir = currentUser.tanggalLahir || (currentUser.name === 'Budi Santoso' ? '11 November 1990' : '20 Januari 2004');
  const pekerjaan = currentUser.pekerjaan || (currentUser.name === 'Budi Santoso' ? 'Wiraswasta' : 'Mahasiswa');
  const statusRumah = currentUser.statusRumah || (currentUser.status === 'Kontrak' ? 'Sewa / Kontrak' : 'Milik Sendiri');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row text-slate-800 dark:text-slate-100 font-sans antialiased">
      
      {/* 1. SIDEBAR */}
      <aside className="w-full md:w-64 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-r border-slate-200/80 dark:border-slate-800 flex flex-col flex-shrink-0">
        
        {/* Logo/Brand Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl text-white">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight leading-tight">Warga Portal</h1>
            <span className="text-[9px] text-emerald-450 uppercase font-bold tracking-widest leading-none">RT 04 / RW 09</span>
          </div>
        </div>

        {/* Citizen Profile Card in Sidebar */}
        <div className="p-4 mx-4 my-3 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs uppercase">
            {currentUser.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{currentUser.name}</p>
            <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Warga Portal</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto max-h-[calc(100vh-250px)]">
          
          {/* Dashboard Button */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-emerald-400" />
            <span>Dashboard</span>
          </button>

          {/* Profil Saya Button */}
          <button
            onClick={() => { setActiveTab('profil_saya'); handleCancel(); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'profil_saya'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="w-4 h-4 text-sky-400" />
            <span>Profil Saya</span>
          </button>

          {/* Informasi Dropdown */}
          <div>
            <button
              onClick={() => setIsInformasiOpen(!isInformasiOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>Informasi</span>
              </div>
              <span className="text-[9px] text-slate-500 font-extrabold">{isInformasiOpen ? '▼' : '▶'}</span>
            </button>

            {isInformasiOpen && (
              <div className="pl-6 py-1 space-y-1 border-l border-slate-200/60 dark:border-slate-800 ml-6 font-sans text-xs">
                <button
                  onClick={() => setActiveTab('informasi_pengumuman')}
                  className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'informasi_pengumuman' 
                      ? 'text-emerald-400 font-bold bg-slate-800/50' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'informasi_pengumuman' ? 'bg-emerald-400 scale-125' : 'bg-slate-600'}`}></span>
                  <span>Pengumuman</span>
                </button>
                <button
                  onClick={() => setActiveTab('informasi_jadwal')}
                  className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'informasi_jadwal' 
                      ? 'text-emerald-400 font-bold bg-slate-800/50' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'informasi_jadwal' ? 'bg-emerald-400 scale-125' : 'bg-slate-600'}`}></span>
                  <span>Jadwal Kegiatan</span>
                </button>
                <button
                  onClick={() => setActiveTab('informasi_kontak')}
                  className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'informasi_kontak' 
                      ? 'text-emerald-400 font-bold bg-slate-800/50' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'informasi_kontak' ? 'bg-emerald-400 scale-125' : 'bg-slate-600'}`}></span>
                  <span>Kontak Pengurus</span>
                </button>
              </div>
            )}
          </div>

          {/* Iuran Dropdown */}
          <div>
            <button
              onClick={() => setIsIuranOpen(!isIuranOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Wallet className="w-4 h-4 text-amber-400" />
                <span>Iuran</span>
              </div>
              <span className="text-[9px] text-slate-500 font-extrabold">{isIuranOpen ? '▼' : '▶'}</span>
            </button>

            {isIuranOpen && (
              <div className="pl-6 py-1 space-y-1 border-l border-slate-200/60 dark:border-slate-800 ml-6 font-sans text-xs">
                <button
                  onClick={() => setActiveTab('iuran_tagihan')}
                  className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'iuran_tagihan' 
                      ? 'text-emerald-400 font-bold bg-slate-800/50' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'iuran_tagihan' ? 'bg-emerald-400 scale-125' : 'bg-slate-600'}`}></span>
                  <span>Tagihan Saya</span>
                </button>
                <button
                  onClick={() => setActiveTab('iuran_riwayat')}
                  className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'iuran_riwayat' 
                      ? 'text-emerald-400 font-bold bg-slate-800/50' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'iuran_riwayat' ? 'bg-emerald-400 scale-125' : 'bg-slate-600'}`}></span>
                  <span>Riwayat Pembayaran</span>
                </button>
                <button
                  onClick={() => setActiveTab('iuran_upload')}
                  className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'iuran_upload' 
                      ? 'text-emerald-400 font-bold bg-slate-800/50' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'iuran_upload' ? 'bg-emerald-400 scale-125' : 'bg-slate-600'}`}></span>
                  <span>Upload Bukti Bayar</span>
                </button>
              </div>
            )}
          </div>

          {/* Layanan Surat Dropdown */}
          <div>
            <button
              onClick={() => setIsSuratOpen(!isSuratOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-sky-400" />
                <span>Layanan Surat</span>
              </div>
              <span className="text-[9px] text-slate-500 font-extrabold">{isSuratOpen ? '▼' : '▶'}</span>
            </button>

            {isSuratOpen && (
              <div className="pl-6 py-1 space-y-1 border-l border-slate-200/60 dark:border-slate-800 ml-6 font-sans text-xs">
                <button
                  onClick={() => setActiveTab('layanan_ajukan')}
                  className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'layanan_ajukan' 
                      ? 'text-emerald-400 font-bold bg-slate-800/50' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'layanan_ajukan' ? 'bg-emerald-400 scale-125' : 'bg-slate-600'}`}></span>
                  <span>Ajukan Surat</span>
                </button>
                <button
                  onClick={() => setActiveTab('layanan_status')}
                  className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'layanan_status' 
                      ? 'text-emerald-400 font-bold bg-slate-800/50' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'layanan_status' ? 'bg-emerald-400 scale-125' : 'bg-slate-600'}`}></span>
                  <span>Status Pengajuan</span>
                </button>
              </div>
            )}
          </div>

          {/* Pengaduan */}
          <button
            onClick={() => setActiveTab('pengaduan')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'pengaduan'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Pengaduan</span>
          </button>

          {/* Dokumen */}
          <button
            onClick={() => setActiveTab('dokumen')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'dokumen'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FolderOpen className="w-4 h-4 text-purple-400" />
            <span>Dokumen</span>
          </button>

          {/* Notifikasi */}
          <button
            onClick={() => setActiveTab('notifikasi')}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'notifikasi'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-pink-400" />
              <span>Notifikasi</span>
            </div>
            {currentUser.tagihNotification && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            )}
          </button>

          {/* Pengaturan */}
          <button
            onClick={() => setActiveTab('pengaturan')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'pengaturan'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Pengaturan</span>
          </button>

        </nav>

        {/* Sidebar Footer / Theme Toggle & Logout */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 hover:text-white transition-colors cursor-pointer text-left"
          >
            {darkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Mode Terang</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>Mode Gelap</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              const check = window.confirm('Apakah Anda ingin keluar dari portal warga?');
              if (check) {
                setCurrentUser(null);
                localStorage.removeItem('rt_current_user');
              }
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-rose-500/20 hover:text-rose-400 text-rose-500 transition-colors cursor-pointer text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Portal</span>
          </button>
        </div>

      </aside>

      {/* 2. MAIN AREA */}
      <main className="flex-grow flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 overflow-y-auto max-h-screen">
        
        {/* Dynamic Header Ribbon */}
        <header className="sticky top-0 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 py-4 px-6 md:px-8 z-30 flex items-center justify-between">
          <div className="flex flex-col font-sans">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-mono">
              {activeTab === 'dashboard' && 'RANGKUMAN AKTIVITAS'}
              {activeTab === 'profil_saya' && 'PROFIL MANDIRI WARGA'}
              {activeTab === 'informasi_pengumuman' && 'INFORMASI SEPUTAR RT'}
              {activeTab === 'informasi_jadwal' && 'JADWAL & AGENDA HARI INI'}
              {activeTab === 'informasi_kontak' && 'PAPAN HUBUNGI PENGURUS'}
              {activeTab === 'iuran_tagihan' && 'STATUS IURAN BULANAN'}
              {activeTab === 'iuran_riwayat' && 'LOG SETORAN KEUANGAN'}
              {activeTab === 'iuran_upload' && 'INPUT BUKTI TRANSAKSI'}
              {activeTab === 'layanan_ajukan' && 'LOKET SURAT PENGANTAR'}
              {activeTab === 'layanan_status' && 'STATUS AJUAN WARGA'}
              {activeTab === 'pengaduan' && 'SALURAN PENGADUAN WARGA'}
              {activeTab === 'dokumen' && 'ARSIP DOKUMEN & PANDUAN'}
              {activeTab === 'notifikasi' && 'KOTAK MASUK NOTIFIKASI'}
              {activeTab === 'pengaturan' && 'KONFIGURASI AKUN'}
            </span>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight pt-0.5">
              {activeTab === 'dashboard' && 'Dashboard Portal Warga'}
              {activeTab === 'profil_saya' && 'Profil Saya'}
              {activeTab === 'informasi_pengumuman' && 'Pengumuman Terbaru'}
              {activeTab === 'informasi_jadwal' && 'Kegiatan & Rapat RT'}
              {activeTab === 'informasi_kontak' && 'Kontak Layanan Pengurus'}
              {activeTab === 'iuran_tagihan' && 'Rincian Tagihan Saya'}
              {activeTab === 'iuran_riwayat' && 'Riwayat Pembayaran'}
              {activeTab === 'iuran_upload' && 'Upload Bukti Pembayaran'}
              {activeTab === 'layanan_ajukan' && 'Ajukan Surat Pengantar'}
              {activeTab === 'layanan_status' && 'Status Pengajuan Surat'}
              {activeTab === 'pengaduan' && 'Laporan Pengaduan Lingkungan'}
              {activeTab === 'dokumen' && 'Unduh Berkas & AD/ART'}
              {activeTab === 'notifikasi' && 'Notifikasi Terbaru'}
              {activeTab === 'pengaturan' && 'Ubah Kata Sandi'}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold items-center gap-1.5 font-sans">
              <Sparkles className="w-3 h-3" />
              Portal Warga
            </span>
          </div>
        </header>

        {/* 3. SCROLL CONTENT AREA */}
        <div className="p-6 md:p-8 flex-1 max-w-5xl w-full mx-auto">
          
          {/* TAB 1: Dashboard View */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fade-in font-sans">
              
              {/* Welcome banner card */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
                <div className="space-y-2 z-10">
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">Selamat datang kembali, {currentUser.name}! 👋</h3>
                  <p className="text-xs text-slate-400 max-w-lg leading-relaxed">Pantau iuran bulanan Anda secara transparan, ajukan surat pengantar mandiri, dan dapatkan pengumuman RT 04 terupdate dalam satu dasbor.</p>
                </div>
                <div className="px-5 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/10 flex items-center gap-2">
                  <Landmark className="w-4 h-4" />
                  <span>Blok: {currentUser.alamat.split('Blok ').pop() || currentUser.alamat}</span>
                </div>
              </div>

              {/* Quick statistics widgets grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className={`p-4 rounded-2xl ${currentUser.statusIuran?.includes('Menunggak') ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider">Iuran Kas RT</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white leading-tight block mt-0.5">{currentUser.statusIuran || 'Lunas'}</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="p-4 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-2xl">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider">Surat Pengantar</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white leading-tight block mt-0.5">{mySubmissions.length} Diajukan</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="p-4 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider">Kegiatan RT</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white leading-tight block mt-0.5">{agendaList.length} Terjadwal</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="p-4 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider">Pengaduan Saya</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white leading-tight block mt-0.5">{pengaduanList.length} Dikirim</span>
                  </div>
                </div>
              </div>

              {/* Layout Split: Quick Action Menu & Latest Notifications feed */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left panel: Quick shortcuts list */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider block mb-2">Tautan Aksi Cepat</h4>
                  
                  <button 
                    onClick={() => setActiveTab('layanan_ajukan')}
                    className="w-full py-3 px-4 border border-slate-200/60 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl text-left text-xs font-bold flex items-center gap-3 transition-all hover:bg-slate-50 dark:hover:bg-slate-950/20 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Ajukan Surat Pengantar</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('iuran_upload')}
                    className="w-full py-3 px-4 border border-slate-200/60 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl text-left text-xs font-bold flex items-center gap-3 transition-all hover:bg-slate-50 dark:hover:bg-slate-950/20 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-amber-500" />
                    <span>Upload Bukti Bayar Iuran</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('pengaduan')}
                    className="w-full py-3 px-4 border border-slate-200/60 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl text-left text-xs font-bold flex items-center gap-3 transition-all hover:bg-slate-50 dark:hover:bg-slate-950/20 cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span>Kirim Pengaduan Warga</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('informasi_kontak')}
                    className="w-full py-3 px-4 border border-slate-200/60 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl text-left text-xs font-bold flex items-center gap-3 transition-all hover:bg-slate-50 dark:hover:bg-slate-950/20 cursor-pointer"
                  >
                    <Phone className="w-4 h-4 text-blue-500" />
                    <span>Hubungi Pengurus RT</span>
                  </button>
                </div>

                {/* Right panel: Active announcements and notification updates */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col">
                  <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider block mb-4">Informasi Lingkungan Terkini</h4>
                  
                  <div className="flex-1 space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {currentUser.tagihNotification && (
                      <div className="p-4 bg-rose-500/10 dark:bg-rose-500/5 border border-rose-500/20 dark:border-rose-500/30 rounded-2xl flex items-center gap-3 animate-pulse">
                        <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        <span className="text-xs font-bold text-rose-700 dark:text-rose-400">🚨 Anda memiliki tagihan iuran yang belum dikonfirmasi Bendahara. Mohon segera lunasi.</span>
                      </div>
                    )}

                    <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 rounded-2xl space-y-1">
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-600 rounded font-bold px-1.5 py-0.5">KEGIATAN</span>
                      <h5 className="font-bold text-xs pt-1 text-slate-800 dark:text-white">Gotong Royong & Fogging Lingkungan</h5>
                      <p className="text-[10px] text-slate-550 dark:text-slate-400 leading-normal font-sans">Pelaksanaan penyemprotan nyamuk DBD (fogging) serta pembersihan pos RT akan diadakan hari Sabtu pagi ini pukul 08:00 WIB.</p>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 rounded-2xl space-y-1">
                      <span className="text-[9px] bg-blue-500/10 text-blue-600 rounded font-bold px-1.5 py-0.5">KEAMANAN</span>
                      <h5 className="font-bold text-xs pt-1 text-slate-800 dark:text-white">Penutupan Pintu Gerbang RT Malam Hari</h5>
                      <p className="text-[10px] text-slate-550 dark:text-slate-400 leading-normal font-sans">Mulai jam 23:00 WIB portal selatan akan digembok demi keamanan bersama. Harap lewat gerbang utara dekat pos jaga satpam.</p>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: Profil Saya (MOCKUP ALIGNED) */}
          {activeTab === 'profil_saya' && (
            <div className="space-y-6 animate-fade-in font-sans">
              
              {/* Header Visual Card - Foto Profil */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col items-center text-center space-y-4">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-extrabold flex items-center justify-center text-3xl shadow-lg border-4 border-white dark:border-slate-800">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/40 text-white text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    👤 FOTO PROFIL
                  </div>
                </div>
                
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{currentUser.name}</h3>
                  <p className="text-xs text-slate-400 font-bold mt-0.5">Warga RT {rtRw}</p>
                </div>

                {!isEditing ? (
                  <button
                    onClick={handleEditClick}
                    className="py-1.5 px-4 bg-slate-100 hover:bg-slate-205 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-slate-200/50 dark:border-slate-800"
                  >
                    Edit Profil
                  </button>
                ) : (
                  <span className="text-[10px] text-amber-500 font-bold animate-pulse">Mode Edit Kontak Aktif</span>
                )}
              </div>

              {/* Feedback Alerts */}
              {error && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-500 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {/* Card 2: Informasi Pribadi */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
                <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">Informasi Pribadi</h4>
                
                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between sm:justify-start items-center">
                    <span className="w-32 text-slate-400 font-bold">Nama</span>
                    <span className="text-slate-805 dark:text-slate-200 font-bold">{currentUser.name}</span>
                  </div>
                  <div className="flex justify-between sm:justify-start items-center">
                    <span className="w-32 text-slate-400 font-bold">NIK</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold font-mono">
                      {currentUser.nik ? `${currentUser.nik.slice(0, 4)}********${currentUser.nik.slice(-4)}` : '3276********1234'}
                    </span>
                  </div>
                  <div className="flex justify-between sm:justify-start items-center">
                    <span className="w-32 text-slate-400 font-bold">Jenis Kelamin</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">{currentUser.gender || 'Laki-laki'}</span>
                  </div>
                  <div className="flex justify-between sm:justify-start items-center">
                    <span className="w-32 text-slate-400 font-bold">Tanggal Lahir</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">{tanggalLahir}</span>
                  </div>
                  <div className="flex justify-between sm:justify-start items-center">
                    <span className="w-32 text-slate-400 font-bold">Pekerjaan</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">{pekerjaan}</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Alamat */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
                <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">Alamat</h4>
                
                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between sm:justify-start items-center">
                    <span className="w-32 text-slate-400 font-bold">RT/RW</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">{rtRw}</span>
                  </div>
                  <div className="flex justify-between sm:justify-start items-center">
                    <span className="w-32 text-slate-400 font-bold">Alamat</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">{currentUser.alamat}</span>
                  </div>
                  <div className="flex justify-between sm:justify-start items-center">
                    <span className="w-32 text-slate-400 font-bold">Status Rumah</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">{statusRumah}</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Kontak (HP & Email edit mode supported) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
                <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">Kontak</h4>
                
                <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs sm:text-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
                    <span className="w-32 text-slate-400 font-bold">No HP</span>
                    {isEditing ? (
                      <input
                        required
                        type="text"
                        value={formData.noHp}
                        onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                        className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold max-w-xs w-full"
                      />
                    ) : (
                      <span className="text-slate-800 dark:text-slate-200 font-bold">{currentUser.noHp}</span>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
                    <span className="w-32 text-slate-400 font-bold">Email</span>
                    {isEditing ? (
                      <input
                        required
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold max-w-xs w-full"
                      />
                    ) : (
                      <span className="text-slate-800 dark:text-slate-200 font-bold">{currentUser.email}</span>
                    )}
                  </div>

                  {isEditing && (
                    <div className="flex gap-2.5 pt-2">
                      <button
                        type="submit"
                        className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
                      >
                        Simpan
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="py-1.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-slate-200/50 dark:border-slate-800"
                      >
                        Batal
                      </button>
                    </div>
                  )}
                </form>
              </div>

              {/* Card 5: Keamanan */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
                <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">Keamanan</h4>
                
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setActiveTab('pengaturan')}
                    className="py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer border border-slate-200/50 dark:border-slate-800"
                  >
                    Ganti Password
                  </button>
                  <button
                    onClick={() => {
                      const check = window.confirm('Apakah Anda ingin keluar dari semua perangkat?');
                      if (check) {
                        setCurrentUser(null);
                        localStorage.removeItem('rt_current_user');
                      }
                    }}
                    className="py-2 px-4 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-455 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Logout Semua Perangkat
                  </button>
                </div>
              </div>

              {/* Password Prompt Verification modal */}
              {showPasswordPrompt && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Verifikasi Sandi Akun</h4>
                      <button onClick={() => setShowPasswordPrompt(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-450 leading-relaxed font-sans">Silakan masukkan kata sandi akun Anda untuk memverifikasi identitas sebelum mengubah data.</p>
                    <form onSubmit={handleConfirmPassword} className="space-y-4">
                      <div className="space-y-1.5 font-sans">
                        <input
                          required
                          type="password"
                          placeholder="Masukkan kata sandi Anda..."
                          value={promptPasswordInput}
                          onChange={(e) => setPromptPasswordInput(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white font-semibold"
                        />
                        {promptError && (
                          <span className="text-[10px] text-rose-500 font-bold block">{promptError}</span>
                        )}
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-colors cursor-pointer text-center block shadow-xs"
                      >
                        Konfirmasi Verifikasi
                      </button>
                    </form>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: Informasi -> Pengumuman */}
          {activeTab === 'informasi_pengumuman' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="border-b border-slate-200/60 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pengumuman & Pemberitahuan Terbaru</h3>
                <p className="text-xs text-slate-400">Informasi resmi seputar lingkungan RT 04 Sawangan Green Park.</p>
              </div>

              <div className="space-y-4">
                <div className="p-5 bg-slate-50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800 rounded-3xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 font-bold text-[9px] rounded-md">KEBERSIHAN</span>
                    <span className="text-[10px] text-slate-400 font-bold">07 Juli 2026</span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">Kerja Bakti Saluran Air Warga</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">Pelaksanaan pembersihan gorong-gorong dan pemangkasan dahan pohon liar akan diadakan hari Minggu depan pukul 07:00 WIB. Diharapkan bapak-bapak warga RT 04 membawa cangkul/sabit masing-masing.</p>
                </div>

                <div className="p-5 bg-slate-50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800 rounded-3xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[9px] rounded-md">KEAMANAN</span>
                    <span className="text-[10px] text-slate-400 font-bold">05 Juli 2026</span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">Ketertiban Parkir Mobil Depan Rumah</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">Mengingat sempitnya badan jalan komplek, warga dihimbau tidak memarkir kendaraannya di badan jalan utama dalam waktu lama agar tidak mengganggu arus darurat pemadam kebakaran / ambulans.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Informasi -> Jadwal Kegiatan */}
          {activeTab === 'informasi_jadwal' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="border-b border-slate-200/60 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Jadwal & Agenda RT Terjadwal</h3>
                <p className="text-xs text-slate-400">Daftar agenda kegiatan dan rapat rutin lingkungan RT 04.</p>
              </div>

              <div className="space-y-4">
                {agendaList.length > 0 ? (
                  agendaList.map((a) => (
                    <div key={a.id} className="p-5 bg-slate-50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800 rounded-3xl flex gap-4 font-sans">
                      <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center font-black text-sm font-mono flex-shrink-0">
                        {a.date.split('-')[2] || a.date.split(' ')[0] || '12'}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white">{a.title}</h4>
                        <div className="flex flex-wrap gap-x-4 text-[10px] text-slate-400 font-bold">
                          <span>📅 {a.date}</span>
                          <span>⏰ {a.time} WIB</span>
                          <span>📍 {a.location}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-normal pt-1.5">{a.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-400 font-bold italic text-xs">Belum ada agenda terdaftar.</div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: Informasi -> Kontak Pengurus */}
          {activeTab === 'informasi_kontak' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="border-b border-slate-200/60 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Kontak Layanan Pengurus RT 04</h3>
                <p className="text-xs text-slate-400">Kontak resmi pengurus Rukun Tetangga yang dapat dihubungi warga.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 bg-slate-50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800 rounded-3xl space-y-4">
                  <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-xs uppercase">RT</div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Pak Ahmad Mulyono</h4>
                    <span className="text-[10px] text-slate-400 font-bold">Ketua RT 04</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-semibold text-slate-500 space-y-1">
                    <p>No HP: 0812-9834-0401</p>
                    <button onClick={() => alert('Menghubungi Pak RT via WhatsApp (0812-9834-0401)...')} className="text-emerald-500 font-bold hover:underline cursor-pointer block">Chat WhatsApp</button>
                  </div>
                </div>

                <div className="p-5 bg-slate-50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800 rounded-3xl space-y-4">
                  <div className="w-10 h-10 bg-sky-500/10 text-sky-600 rounded-xl flex items-center justify-center font-bold text-xs uppercase">SEC</div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Bu Riana Sukma</h4>
                    <span className="text-[10px] text-slate-400 font-bold">Sekretaris RT 04</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-semibold text-slate-500 space-y-1">
                    <p>No HP: 0815-7722-0402</p>
                    <button onClick={() => alert('Menghubungi Sekretaris via WhatsApp (0815-7722-0402)...')} className="text-emerald-500 font-bold hover:underline cursor-pointer block">Chat WhatsApp</button>
                  </div>
                </div>

                <div className="p-5 bg-slate-50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800 rounded-3xl space-y-4">
                  <div className="w-10 h-10 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center font-bold text-xs uppercase">TRE</div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Pak Hadi Suwarno</h4>
                    <span className="text-[10px] text-slate-400 font-bold">Bendahara RT 04</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-semibold text-slate-500 space-y-1">
                    <p>No HP: 0878-8311-0403</p>
                    <button onClick={() => alert('Menghubungi Bendahara via WhatsApp (0878-8311-0403)...')} className="text-emerald-500 font-bold hover:underline cursor-pointer block">Chat WhatsApp</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Iuran -> Tagihan Saya */}
          {activeTab === 'iuran_tagihan' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="border-b border-slate-200/60 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tagihan Iuran Kas Bulanan Saya</h3>
                <p className="text-xs text-slate-400">Rincian status pembayaran iuran wajib bulanan komplek RT 04.</p>
              </div>

              {(currentUser.statusIuran?.includes('Menunggak') || currentUser.tagihNotification) ? (
                <div className="p-6 bg-rose-500/10 border border-rose-500/25 rounded-3xl space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl flex-shrink-0">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Status Iuran: Menunggak</h4>
                      <p className="text-[11px] text-slate-400 mt-1">Anda terdeteksi memiliki tunggakan iuran bulanan kas RT 04 sebesar <span className="font-black text-rose-500">{currentUser.statusIuran || 'Rp 50.000'}</span>.</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800 rounded-2xl text-[11px] grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-slate-400 font-bold block text-[9px] uppercase tracking-wider">REKENING BANK MANDIRI RT</span>
                      <p className="font-mono font-black text-slate-800 dark:text-slate-200">157-00-98234-04-1</p>
                      <p className="text-[9px] text-slate-500 font-semibold">a.n. KAS RT 04 SAWANGAN GREEN PARK</p>
                    </div>
                    <div className="space-y-1 leading-relaxed">
                      <span className="text-slate-400 font-bold block text-[9px] uppercase tracking-wider">CARA KONFIRMASI</span>
                      <p className="text-slate-500 text-[10px]">Silakan transfer nominal tunggakan iuran di atas ke rekening RT, lalu upload struk bukti bayar di tab **Upload Bukti Bayar** untuk diverifikasi Bendahara.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-emerald-500/10 border border-emerald-500/25 rounded-3xl flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">Selamat! Dues Iuran Lunas</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Anda tidak memiliki tunggakan iuran bulanan kas RT bulan ini. Terima kasih atas partisipasi Anda.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: Iuran -> Riwayat Pembayaran */}
          {activeTab === 'iuran_riwayat' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="border-b border-slate-200/60 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Riwayat Setoran Uang Saya</h3>
                <p className="text-xs text-slate-400">Bukti catatan pembayaran iuran yang telah diverifikasi dan masuk kas RT.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider block mb-3 font-sans">Telah Diverifikasi</h4>
                  <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead>
                        <tr className="bg-slate-50/70 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider">
                          <th className="p-4">Tanggal / ID</th>
                          <th className="p-4">Keterangan Setoran</th>
                          <th className="p-4 text-right">Jumlah Setor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {myPayments.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                            <td className="p-4 font-mono space-y-1">
                              <span className="font-bold text-slate-800 dark:text-slate-200">{t.date}</span>
                              <div className="text-[10px] text-slate-400">{t.id}</div>
                            </td>
                            <td className="p-4 font-bold text-slate-700 dark:text-slate-300">{t.description}</td>
                            <td className="p-4 text-right font-black text-emerald-600 dark:text-emerald-400 font-mono">+{formatRupiah(t.amount)}</td>
                          </tr>
                        ))}
                        {myPayments.length === 0 && (
                          <tr>
                            <td colSpan={3} className="p-8 text-center text-slate-400 font-bold italic">Belum ada riwayat setoran iuran yang tercatat di Buku Kas Umum RT.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Uploaded receipt drafts */}
                <div>
                  <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider block mb-3 animate-fade-in">Bukti Bayar Diupload (Menunggu Konfirmasi)</h4>
                  <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead>
                        <tr className="bg-slate-50/70 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider">
                          <th className="p-4">Bulan / Uploaded Date</th>
                          <th className="p-4">Nominal Bayar</th>
                          <th className="p-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {buktiBayarList.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                            <td className="p-4 space-y-0.5">
                              <span className="font-bold text-slate-800 dark:text-white">Iuran Bulan {b.bulan}</span>
                              <div className="text-[9px] text-slate-400">Diupload: {b.date} • ID: {b.id}</div>
                            </td>
                            <td className="p-4 font-bold text-slate-900 dark:text-slate-100 font-mono">{formatRupiah(b.nominal)}</td>
                            <td className="p-4 text-center">
                              <span className="px-2.5 py-0.5 rounded-full font-bold text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse">
                                {b.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {buktiBayarList.length === 0 && (
                          <tr>
                            <td colSpan={3} className="p-8 text-center text-slate-400 font-bold italic">Tidak ada antrean verifikasi bukti transfer.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 8: Iuran -> Upload Bukti Bayar */}
          {activeTab === 'iuran_upload' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="border-b border-slate-200/60 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Kirim Bukti Pembayaran Iuran</h3>
                <p className="text-xs text-slate-400">Kirim laporan setoran transfer kas RT Anda agar dikonfirmasi Bendahara.</p>
              </div>

              <form onSubmit={handleUploadSubmit} className="max-w-xl space-y-4 text-xs sm:text-sm font-sans">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 dark:text-slate-400">Nominal Transfer (Rp) *</label>
                    <input
                      required
                      type="number"
                      placeholder="Contoh: 50000"
                      value={buktiBayarForm.nominal}
                      onChange={(e) => setBuktiBayarForm({ ...buktiBayarForm, nominal: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 dark:text-slate-400">Untuk Bulan Iuran *</label>
                    <select
                      value={buktiBayarForm.bulan}
                      onChange={(e) => setBuktiBayarForm({ ...buktiBayarForm, bulan: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold text-xs"
                    >
                      {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Upload Foto Struk / Screenshot Bukti Transfer *</label>
                  <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 hover:bg-slate-100/50 dark:hover:bg-slate-900/20 transition-all cursor-pointer">
                    <Upload className="w-8 h-8 text-slate-400 animate-pulse-slow" />
                    <span className="font-bold text-xs text-slate-700 dark:text-slate-350">Pilih berkas struk pembayaran...</span>
                    <span className="text-[10px] text-slate-400 font-sans">Mendukung format JPG, PNG, atau screenshot HP. (Maks 3MB)</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Catatan Tambahan (Opsional)</label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Transfer via M-Banking Mandiri a.n Budi"
                    value={buktiBayarForm.catatan}
                    onChange={(e) => setBuktiBayarForm({ ...buktiBayarForm, catatan: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-semibold"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-extrabold rounded-xl hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-md"
                  >
                    Kirim Bukti Pembayaran
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 9: Layanan Surat -> Ajukan Surat */}
          {activeTab === 'layanan_ajukan' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="border-b border-slate-200/60 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Layanan Mandiri Pengajuan Surat</h3>
                <p className="text-xs text-slate-400">Ajukan permohonan surat pengantar RT secara instan.</p>
              </div>

              <form onSubmit={handleLetterSubmit} className="max-w-xl space-y-5 text-xs sm:text-sm font-sans">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 font-sans">Nama Pemohon (Warga) 🔒</label>
                  <input
                    disabled
                    type="text"
                    value={currentUser.name}
                    className="w-full px-3.5 py-2.5 bg-slate-100/50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-500 outline-none cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 font-sans">Pilih Jenis Surat Pengantar *</label>
                  <select
                    value={letterForm.tipeSurat}
                    onChange={(e) => setLetterForm({ ...letterForm, tipeSurat: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold text-xs"
                  >
                    <option value="Surat Pengantar Pengurusan KTP">Surat Pengantar Pengurusan KTP / KK</option>
                    <option value="Surat Keterangan Domisili">Surat Keterangan Domisili Warga</option>
                    <option value="Surat Keterangan Catatan Kepolisian (SKCK)">Surat Keterangan Pengantar SKCK</option>
                    <option value="Surat Keterangan Tidak Mampu (SKTM)">Surat Keterangan Tidak Mampu (SKTM)</option>
                    <option value="Surat Pengantar Izin Keramaian">Surat Pengantar Izin Acara / Keramaian</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 font-sans">Tulis Keperluan / Alasan Pengajuan *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tulis alasan lengkap Anda mengajukan surat, contoh: Syarat pembuatan KTP baru di Kelurahan Sawangan karena pindah domisili..."
                    value={letterForm.keperluan}
                    onChange={(e) => setLetterForm({ ...letterForm, keperluan: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-semibold leading-relaxed"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-extrabold rounded-xl hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-md"
                  >
                    Kirim Pengajuan Surat
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 10: Layanan Surat -> Status Pengajuan */}
          {activeTab === 'layanan_status' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="border-b border-slate-200/60 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Status Permohonan Surat Pengantar Saya</h3>
                <p className="text-xs text-slate-400">Daftar riwayat surat pengantar mandiri beserta status verifikasi pengurus.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 font-sans">
                {mySubmissions.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-slate-400 dark:text-slate-500 font-bold italic text-xs">
                    Belum ada riwayat pengajuan surat pengantar dari Anda.
                  </div>
                ) : (
                  mySubmissions.map((sub) => (
                    <div key={sub.id} className="bg-slate-50 dark:bg-slate-900/20 border border-slate-200/60 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300">
                      
                      {/* Document Item visual card */}
                      <div className="p-3 border-b border-slate-200/60 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900/50">
                        <span className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">{sub.wargaNama}</span>
                        <span className="text-[8px] font-mono text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{sub.id}</span>
                      </div>

                      <div className="aspect-square bg-slate-100/70 dark:bg-slate-950/70 flex flex-col justify-center items-center p-6 text-center relative select-none">
                        <FileText className="w-10 h-10 text-slate-300 dark:text-slate-800 animate-pulse-slow mb-3" />
                        <h5 className="font-extrabold text-slate-800 dark:text-white text-[11px] leading-snug px-2">{sub.wargaTipeSurat}</h5>
                        <p className="text-[9px] text-slate-400 dark:text-slate-550 mt-1 max-w-[150px] line-clamp-2 italic font-sans">"{sub.wargaKeperluan}"</p>
                      </div>

                      <div className="p-3 bg-white dark:bg-slate-900/50 space-y-2.5">
                        <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 font-sans">
                          Status: {' '}
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold inline-block ${
                            sub.status === 'Completed'
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                              : sub.status === 'Approved'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                              : sub.status === 'Rejected'
                              ? 'bg-red-50 dark:bg-red-950/40 text-rose-500'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 animate-pulse'
                          }`}>
                            {sub.status || 'Pending'}
                          </span>
                        </div>
                        
                        <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider font-sans">
                          Diajukan: {sub.submissionDate || '12 Juni 2026'}
                        </div>

                        {(sub.status === 'Approved' || sub.status === 'Completed') && (
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 font-sans">
                            <button
                              onClick={() => {
                                alert(`Mengunduh berkas ${sub.wargaTipeSurat} untuk keperluan: ${sub.wargaKeperluan}. (Simulasi berkas PDF RT berhasil diunduh)`);
                              }}
                              className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-extrabold text-[10px] rounded-xl transition-all cursor-pointer text-center block shadow-xs"
                            >
                              Unduh Surat Pengantar
                            </button>
                          </div>
                        )}
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 11: Pengaduan */}
          {activeTab === 'pengaduan' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="border-b border-slate-200/60 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Laporan Pengaduan & Masukan Warga</h3>
                <p className="text-xs text-slate-400">Saluran aspirasi dan pengaduan darurat lingkungan sekitar warga RT 04.</p>
              </div>

              <form onSubmit={handleComplaintSubmit} className="max-w-xl space-y-4 text-xs sm:text-sm font-sans">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-350">Kategori Laporan *</label>
                  <select
                    value={pengaduanForm.category}
                    onChange={(e) => setPengaduanForm({ ...pengaduanForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-955/50 border border-slate-205 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold text-xs"
                  >
                    <option value="Fasilitas Umum">Fasilitas Umum (Jalan, Lampu, Selokan)</option>
                    <option value="Keamanan">Keamanan & Ketertiban Komplek</option>
                    <option value="Kebersihan">Kebersihan Lingkungan / Sampah</option>
                    <option value="Sosial Kemasyarakatan">Sosial & Kehidupan Warga</option>
                    <option value="Lainnya">Pengaduan Lain-lain</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-350 font-sans">Deskripsi / Detail Laporan Kejadian *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tulis secara lengkap perihal masukan atau kendala lingkungan yang Anda alami..."
                    value={pengaduanForm.description}
                    onChange={(e) => setPengaduanForm({ ...pengaduanForm, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-semibold leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  className="py-3 px-6 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-md"
                >
                  Kirim Pengaduan RT
                </button>
              </form>

              {/* Complaints log */}
              <div className="pt-6">
                <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider block mb-3 font-sans">Riwayat Pengaduan Saya</h4>
                <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                  <table className="w-full text-left text-xs border-collapse font-sans">
                    <thead>
                      <tr className="bg-slate-50/70 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider">
                        <th className="p-4">Tanggal / ID</th>
                        <th className="p-4">Kategori Laporan</th>
                        <th className="p-4">Deskripsi Masalah</th>
                        <th className="p-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {pengaduanList.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                          <td className="p-4 font-mono space-y-0.5">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{p.date}</span>
                            <div className="text-[10px] text-slate-400">{p.id}</div>
                          </td>
                          <td className="p-4 font-bold text-slate-700 dark:text-slate-300">{p.category}</td>
                          <td className="p-4 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={p.description}>{p.description}</td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] inline-block ${
                              p.status === 'Selesai' 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 12: Dokumen */}
          {activeTab === 'dokumen' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="border-b border-slate-200/60 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Arsip Dokumen Resmi Warga</h3>
                <p className="text-xs text-slate-400">Regulasi dan berkas administrasi RT 04 Sawangan.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 bg-slate-50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800 rounded-3xl space-y-3">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">AD / ART Rukun Tetangga 04</h4>
                  <p className="text-[10px] text-slate-500 leading-normal">Dokumen Anggaran Dasar dan Anggaran Rumah Tangga resmi yang berisi aturan kerukunan hidup bertetangga.</p>
                  <button onClick={() => alert('Mengunduh AD_ART_RT04.pdf... (Simulasi unduhan berkas PDF)')} className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-xl cursor-pointer font-sans">Unduh PDF</button>
                </div>

                <div className="p-5 bg-slate-50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800 rounded-3xl space-y-3">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Formulir Pendaftaran Warga Baru</h4>
                  <p className="text-[10px] text-slate-500 leading-normal">Berkas formulir kosong yang wajib diisi bagi penghuni baru (kontrak maupun tetap) untuk diserahkan ke Sekretaris.</p>
                  <button onClick={() => alert('Mengunduh FORM_WARGA_BARU.pdf... (Simulasi unduhan berkas PDF)')} className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-xl cursor-pointer font-sans">Unduh PDF</button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 13: Notifikasi */}
          {activeTab === 'notifikasi' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="border-b border-slate-200/60 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Kotak Masuk Notifikasi Saya</h3>
                <p className="text-xs text-slate-400">Daftar notifikasi terbaru terkait administrasi, iuran, dan agenda RT.</p>
              </div>

              <div className="space-y-4">
                {currentUser.tagihNotification && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-xs text-rose-600 dark:text-rose-400 font-sans">Peringatan Tagihan Pembayaran Iuran</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-sans">Bendahara RT 04 mengirimkan tagihan resmi pembayaran iuran kas Anda. Harap segera lakukan pembayaran.</p>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-slate-50 dark:bg-slate-905/35 border border-slate-200/60 dark:border-slate-800 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-xs text-slate-800 dark:text-white font-sans">Akses Portal Sukses</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-sans">Akun warga Anda berhasil masuk ke portal layanan mandiri Sawangan Green Park.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 14: Pengaturan (Password Reset) */}
          {activeTab === 'pengaturan' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="border-b border-slate-200/60 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pengaturan Keamanan & Sandi</h3>
                <p className="text-xs text-slate-400">Kelola kata sandi akun portal warga Anda agar tetap aman.</p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-4 text-xs sm:text-sm font-sans">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Kata Sandi Lama *</label>
                  <input
                    required
                    type="password"
                    placeholder="Masukkan sandi saat ini..."
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Kata Sandi Baru *</label>
                  <input
                    required
                    type="password"
                    placeholder="Masukkan sandi baru (min 5 karakter)..."
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 font-sans">Konfirmasi Kata Sandi Baru *</label>
                  <input
                    required
                    type="password"
                    placeholder="Ketik ulang sandi baru..."
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-semibold"
                  />
                </div>

                <button
                  type="submit"
                  className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
                >
                  Ubah Kata Sandi
                </button>
              </form>
            </div>
          )}

        </div>

      </main>
    </div>
  );
}
