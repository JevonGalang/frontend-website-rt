import { useState } from 'react';
import { 
  LayoutDashboard, Users, Wallet, Calendar, FileCheck, LogOut, 
  Search, Plus, Edit, Trash2, Check, X as XIcon, Landmark, 
  Sun, Moon, TrendingUp, TrendingDown, CheckCircle2, 
  AlertCircle, Sparkles, Filter, Eye, EyeOff, Activity
} from 'lucide-react';

export default function AdminDashboard({ 
  currentUser, 
  setCurrentUser, 
  wargaList, 
  setWargaList, 
  transaksiKasList, 
  setTransaksiKasList, 
  agendaList, 
  setAgendaList, 
  submissionsList, 
  setSubmissionsList,
  darkMode,
  setDarkMode
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'warga' | 'kas' | 'agenda' | 'layanan'
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // CRUD Modal States
  const [modalType, setModalType] = useState(''); // '' | 'add_warga' | 'edit_warga' | 'add_kas' | 'edit_kas' | 'add_agenda' | 'edit_agenda'
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Form States
  const [wargaForm, setWargaForm] = useState({
    name: '', username: '', password: '', nik: '', noKk: '', alamat: '', gender: 'Laki-laki', usia: '', status: 'Tetap', statusHidup: 'Hidup', statusIuran: 'Lunas'
  });
  const [kasForm, setKasForm] = useState({
    description: '', amount: '', date: new Date().toISOString().split('T')[0], type: 'income', category: 'Iuran Warga'
  });
  const [agendaForm, setAgendaForm] = useState({
    title: '', date: '', time: '', location: '', category: 'Kegiatan RT', participants: 'Semua Warga', description: ''
  });

  const [formError, setFormError] = useState('');

  // NIK, KK, and Password Censoring / Reveal States
  const [revealedNiks, setRevealedNiks] = useState({});
  const [revealedKks, setRevealedKks] = useState({});
  const [revealedPasswords, setRevealedPasswords] = useState({});
  
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [promptPasswordInput, setPromptPasswordInput] = useState('');
  const [promptError, setPromptError] = useState('');
  const [targetId, setTargetId] = useState(null);
  const [targetField, setTargetField] = useState(''); // 'nik' | 'kk' | 'password'

  // Access Logs & Sesi Active states
  const [logsTrigger, setLogsTrigger] = useState(0);
  const [viewingCitizenProfile, setViewingCitizenProfile] = useState(null);
  const accessLogs = JSON.parse(localStorage.getItem('rt_access_logs') || '[]');

  const handleShowAccessProfile = (username) => {
    const citizen = wargaList.find(w => w.username.toLowerCase() === username.toLowerCase());
    if (citizen) {
      setViewingCitizenProfile(citizen);
    } else {
      alert('Data profil kependudukan warga tidak ditemukan di database.');
    }
  };

  const handleRevealClick = (id, field) => {
    setTargetId(id);
    setTargetField(field);
    setPromptPasswordInput('');
    setPromptError('');
    setShowPasswordPrompt(true);
  };

  const handleConfirmPassword = (e) => {
    e.preventDefault();
    if (promptPasswordInput === 'admin') {
      if (targetField === 'nik') {
        setRevealedNiks(prev => ({ ...prev, [targetId]: true }));
      } else if (targetField === 'kk') {
        setRevealedKks(prev => ({ ...prev, [targetId]: true }));
      } else if (targetField === 'password') {
        setRevealedPasswords(prev => ({ ...prev, [targetId]: true }));
      }
      setShowPasswordPrompt(false);
    } else {
      setPromptError('Sandi Admin salah.');
    }
  };

  const getDisplayNik = (id, fullNik) => {
    if (revealedNiks[id]) return fullNik;
    if (!fullNik || fullNik.length < 12) return '****************';
    return fullNik.slice(0, 6) + '******' + fullNik.slice(12);
  };

  const getDisplayKk = (id, fullKk) => {
    if (revealedKks[id]) return fullKk;
    if (!fullKk || fullKk.length < 12) return '****************';
    return fullKk.slice(0, 6) + '******' + fullKk.slice(12);
  };

  const getDisplayPassword = (id, fullPassword) => {
    if (revealedPasswords[id]) return fullPassword;
    return '******';
  };

  // Auto-sync functions for CRUD
  const saveWarga = (updatedList) => {
    setWargaList(updatedList);
    localStorage.setItem('rt_wargalist', JSON.stringify(updatedList));
  };

  const saveKas = (updatedList) => {
    setTransaksiKasList(updatedList);
    localStorage.setItem('rt_kaslist', JSON.stringify(updatedList));
  };

  const saveAgenda = (updatedList) => {
    setAgendaList(updatedList);
    localStorage.setItem('rt_agendalist', JSON.stringify(updatedList));
  };

  const saveSubmissions = (updatedList) => {
    setSubmissionsList(updatedList);
    localStorage.setItem('rt_submissions', JSON.stringify(updatedList));
  };

  // Log out function
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('rt_current_user');
  };

  // Calc Dynamic stats for Overview
  const totalWarga = wargaList.filter(w => w.statusHidup === 'Hidup').length;
  
  // Unique KK count (using living residents)
  const uniqueKKs = new Set(
    wargaList.filter(w => w.statusHidup === 'Hidup').map(w => w.noKk)
  ).size;

  const totalPemasukan = transaksiKasList
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalPengeluaran = transaksiKasList
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const sisaKas = totalPemasukan - totalPengeluaran;

  const totalAgendas = agendaList.length;
  const pendingSubmissionsCount = submissionsList.filter(s => s.status === 'Pending' || !s.status).length;

  // Format currency
  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  // Setup Form for Editing
  const openEditModal = (type, item) => {
    setSelectedItem(item);
    setFormError('');
    if (type === 'warga') {
      setWargaForm({ ...item });
      setModalType('edit_warga');
    } else if (type === 'kas') {
      setKasForm({ ...item });
      setModalType('edit_kas');
    } else if (type === 'agenda') {
      setAgendaForm({ ...item });
      setModalType('edit_agenda');
    }
  };

  // Setup Form for Adding
  const openAddModal = (type) => {
    setSelectedItem(null);
    setFormError('');
    if (type === 'warga') {
      setWargaForm({
        name: '', username: '', password: 'warga', nik: '', noKk: '', alamat: '', gender: 'Laki-laki', usia: '', status: 'Tetap', statusHidup: 'Hidup', statusIuran: 'Lunas'
      });
      setModalType('add_warga');
    } else if (type === 'kas') {
      setKasForm({
        description: '', amount: '', date: new Date().toISOString().split('T')[0], type: 'income', category: 'Iuran Warga'
      });
      setModalType('add_kas');
    } else if (type === 'agenda') {
      setAgendaForm({
        title: '', date: '', time: '', location: '', category: 'Kegiatan RT', participants: 'Semua Warga', description: ''
      });
      setModalType('add_agenda');
    }
  };

  // Delete Handlers
  const handleDelete = (type, id) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data ini?`)) {
      if (type === 'warga') {
        const updated = wargaList.filter(w => w.id !== id);
        saveWarga(updated);
      } else if (type === 'kas') {
        const updated = transaksiKasList.filter(t => t.id !== id);
        saveKas(updated);
      } else if (type === 'agenda') {
        const updated = agendaList.filter(a => a.id !== id);
        saveAgenda(updated);
      }
    }
  };

  // Form Submit Handlers
  const handleWargaSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (wargaForm.nik.length !== 16 || isNaN(wargaForm.nik)) {
      setFormError('NIK harus berupa 16 digit angka.');
      return;
    }
    if (wargaForm.noKk.length !== 16 || isNaN(wargaForm.noKk)) {
      setFormError('Nomor KK harus berupa 16 digit angka.');
      return;
    }
    if (!wargaForm.name || !wargaForm.username || !wargaForm.alamat || !wargaForm.usia) {
      setFormError('Semua kolom bertanda wajib harus diisi.');
      return;
    }

    if (modalType === 'add_warga') {
      // check unique username
      if (wargaList.some(w => w.username.toLowerCase() === wargaForm.username.toLowerCase() || wargaForm.username.toLowerCase() === 'admin')) {
        setFormError('Username sudah digunakan.');
        return;
      }
      if (wargaList.some(w => w.nik === wargaForm.nik)) {
        setFormError('NIK sudah terdaftar.');
        return;
      }
      const newWarga = {
        ...wargaForm,
        id: 'WRG-' + Math.floor(Math.random() * 9000 + 1000),
        usia: parseInt(wargaForm.usia) || 30
      };
      saveWarga([...wargaList, newWarga]);
    } else {
      // edit warga
      if (wargaList.some(w => w.id !== selectedItem.id && w.username.toLowerCase() === wargaForm.username.toLowerCase())) {
        setFormError('Username sudah digunakan.');
        return;
      }
      const updated = wargaList.map(w => w.id === selectedItem.id ? { ...wargaForm, usia: parseInt(wargaForm.usia) || 30 } : w);
      saveWarga(updated);
    }
    setModalType('');
  };

  const handleKasSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!kasForm.description || !kasForm.amount || !kasForm.date) {
      setFormError('Semua kolom wajib diisi.');
      return;
    }

    const amountNum = parseFloat(kasForm.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setFormError('Jumlah uang harus angka positif.');
      return;
    }

    if (modalType === 'add_kas') {
      const newKas = {
        ...kasForm,
        id: 'TX-' + Math.floor(Math.random() * 90000 + 10000),
        amount: amountNum
      };
      saveKas([newKas, ...transaksiKasList]);
    } else {
      const updated = transaksiKasList.map(t => t.id === selectedItem.id ? { ...kasForm, amount: amountNum } : t);
      saveKas(updated);
    }
    setModalType('');
  };

  const handleAgendaSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!agendaForm.title || !agendaForm.date || !agendaForm.time || !agendaForm.location || !agendaForm.description) {
      setFormError('Semua kolom wajib diisi.');
      return;
    }

    if (modalType === 'add_agenda') {
      const newAgenda = {
        ...agendaForm,
        id: 'AGD-' + Math.floor(Math.random() * 9000 + 1000)
      };
      saveAgenda([newAgenda, ...agendaList]);
    } else {
      const updated = agendaList.map(a => a.id === selectedItem.id ? { ...agendaForm } : a);
      saveAgenda(updated);
    }
    setModalType('');
  };

  // Letter Submissions Handlers (Approve/Reject/Complete)
  const handleSubmissionStatus = (id, nextStatus) => {
    const updated = submissionsList.map(sub => {
      if (sub.id === id) {
        return {
          ...sub,
          status: nextStatus,
          processedDate: new Date().toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        };
      }
      return sub;
    });
    saveSubmissions(updated);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row text-slate-800 dark:text-slate-100 font-sans antialiased">
      
      {/* 1. SIDEBAR */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-350 border-r border-slate-800 flex flex-col flex-shrink-0">
        {/* Brand/Logo Header */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl text-white">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-base text-white tracking-tight leading-tight">Admin Portal</h1>
            <span className="text-[10px] text-emerald-450 uppercase font-bold tracking-widest leading-none">RT 04 / RW 09</span>
          </div>
        </div>

        {/* Admin Info */}
        <div className="p-4 mx-4 my-3 bg-slate-850 rounded-2xl border border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-sm">
            AD
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-200 truncate">{currentUser.name}</p>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Ketua RT</p>
          </div>
        </div>

        {/* Sidebar Nav Menus */}
        <nav className="flex-1 px-4 py-2 space-y-1">
          <button
            onClick={() => { setActiveTab('overview'); setSearchQuery(''); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-650/15'
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Ringkasan</span>
          </button>
          
          <button
            onClick={() => { setActiveTab('warga'); setSearchQuery(''); }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'warga'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-655/15'
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4" />
              <span>Data Warga</span>
            </div>
            <span className="text-xs bg-slate-800 dark:bg-slate-950/60 px-2 py-0.5 rounded-full font-bold text-slate-400">{totalWarga}</span>
          </button>

          <button
            onClick={() => { setActiveTab('kas'); setSearchQuery(''); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'kas'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-655/15'
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Kas RT Keuangan</span>
          </button>

          <button
            onClick={() => { setActiveTab('agenda'); setSearchQuery(''); }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'agenda'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-655/15'
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4" />
              <span>Agenda RT</span>
            </div>
            <span className="text-xs bg-slate-800 dark:bg-slate-950/60 px-2 py-0.5 rounded-full font-bold text-slate-400">{totalAgendas}</span>
          </button>

          <button
            onClick={() => { setActiveTab('layanan'); setSearchQuery(''); }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'layanan'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-655/15'
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileCheck className="w-4 h-4" />
              <span>Pengajuan Surat</span>
            </div>
            {pendingSubmissionsCount > 0 && (
              <span className="text-xs bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                {pendingSubmissionsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('logs'); setSearchQuery(''); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-655/15'
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Log Akses Warga</span>
          </button>
        </nav>

        {/* Theme Toggle & Logout */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          {/* Dark Mode toggle inside sidebar */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 hover:text-white transition-colors cursor-pointer text-left"
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
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-rose-455 hover:bg-rose-500/10 hover:text-rose-400 transition-colors cursor-pointer text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Dashboard</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 overflow-y-auto max-h-screen">
        
        {/* Header Ribbon */}
        <header className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 py-4 px-6 md:px-8 z-30 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-mono">
              {activeTab === 'overview' && 'KONTROL PANEL'}
              {activeTab === 'warga' && 'ADMINISTRASI PENDUDUK'}
              {activeTab === 'kas' && 'MONITORING KEUANGAN'}
              {activeTab === 'agenda' && 'PENJADWALAN KOMUNITAS'}
              {activeTab === 'layanan' && 'LOKET PELAYANAN SURAT'}
              {activeTab === 'logs' && 'LOG AKTIVITAS & SESI'}
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {activeTab === 'overview' && 'Ringkasan Portal Admin'}
              {activeTab === 'warga' && 'Daftar Warga & Keluarga'}
              {activeTab === 'kas' && 'Buku Kas & Transaksi'}
              {activeTab === 'agenda' && 'Kegiatan & Rapat RT'}
              {activeTab === 'layanan' && 'Layanan Pengajuan Surat'}
              {activeTab === 'logs' && 'Log Akses Masuk Portal'}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Sesi Aktif
            </span>
          </div>
        </header>

        {/* Content body */}
        <div className="p-6 md:p-8 flex-1 space-y-6">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fade-in">
              {/* Statistic Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Warga Count */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs flex items-center gap-4">
                  <div className="p-4 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-2xl font-black text-slate-900 dark:text-white">{totalWarga}</span>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Jiwa (Warga)</span>
                  </div>
                </div>

                {/* KK Count */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs flex items-center gap-4">
                  <div className="p-4 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl">
                    <Landmark className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-2xl font-black text-slate-900 dark:text-white">{uniqueKKs}</span>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Kepala Keluarga</span>
                  </div>
                </div>

                {/* Sisa Kas */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs flex items-center gap-4">
                  <div className="p-4 bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 rounded-2xl">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-lg font-black text-slate-900 dark:text-white truncate max-w-[150px]">
                      {formatRupiah(sisaKas)}
                    </span>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Saldo Kas RT</span>
                  </div>
                </div>

                {/* Pending Submissions */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs flex items-center gap-4">
                  <div className={`p-4 rounded-2xl ${
                    pendingSubmissionsCount > 0 
                      ? 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-500 dark:text-rose-450 animate-pulse' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-2xl font-black text-slate-900 dark:text-white">{pendingSubmissionsCount}</span>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Pengajuan Pending</span>
                  </div>
                </div>

              </div>

              {/* Layout Split: Quick actions & Recent submissions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left panel: Quick Actions */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between">
                  <div className="space-y-2 mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Aksi Cepat Admin</h3>
                    <p className="text-xs text-slate-400">Pilih modul pintasan untuk mempercepat entry data Anda.</p>
                  </div>
                  <div className="space-y-3.5 my-auto">
                    <button
                      onClick={() => { setActiveTab('warga'); openAddModal('warga'); }}
                      className="w-full py-3.5 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold text-xs rounded-2xl flex items-center justify-between group transition-all cursor-pointer"
                    >
                      <span>Tambah Warga Baru</span>
                      <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
                    </button>
                    <button
                      onClick={() => { setActiveTab('kas'); openAddModal('kas'); }}
                      className="w-full py-3.5 px-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500 text-blue-600 dark:text-blue-400 font-bold text-xs rounded-2xl flex items-center justify-between group transition-all cursor-pointer"
                    >
                      <span>Catat Transaksi Keuangan</span>
                      <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
                    </button>
                    <button
                      onClick={() => { setActiveTab('agenda'); openAddModal('agenda'); }}
                      className="w-full py-3.5 px-4 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500 text-purple-600 dark:text-purple-400 font-bold text-xs rounded-2xl flex items-center justify-between group transition-all cursor-pointer"
                    >
                      <span>Buat Agenda Rapat/Kegiatan</span>
                      <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
                    </button>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-medium text-center">
                    Gunakan panel navigasi kiri untuk manajemen terperinci.
                  </div>
                </div>

                {/* Right panel: Recent submissions */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Daftar Pengajuan Surat Terbaru</h3>
                      <p className="text-xs text-slate-400">Verifikasi dokumen pengantar yang diajukan warga.</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('layanan')}
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-450 hover:underline cursor-pointer"
                    >
                      Lihat Semua
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-[280px] space-y-4 pr-1">
                    {submissionsList.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                        <p className="text-xs font-bold">Tidak ada pengajuan surat yang masuk.</p>
                      </div>
                    ) : (
                      submissionsList.slice().reverse().map((sub, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-150 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:shadow-xs transition-shadow">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-800 dark:text-white">{sub.wargaNama}</span>
                              <span className="text-[10px] px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-655 dark:text-slate-400 font-bold rounded-md font-mono">{sub.id}</span>
                            </div>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{sub.wargaTipeSurat}</p>
                            <p className="text-[10px] text-slate-450 italic">"{sub.wargaKeperluan}"</p>
                          </div>

                          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                            {/* Status Badge */}
                            <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg ${
                              sub.status === 'Approved'
                                ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600'
                                : sub.status === 'Rejected'
                                ? 'bg-red-50 dark:bg-red-950/20 text-red-600'
                                : sub.status === 'Completed'
                                ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600'
                                : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 animate-pulse'
                            }`}>
                              {sub.status || 'Pending'}
                            </span>

                            {/* Action shortcuts for pending */}
                            {(!sub.status || sub.status === 'Pending') && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleSubmissionStatus(sub.id, 'Approved')}
                                  title="Setujui Pengajuan"
                                  className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleSubmissionStatus(sub.id, 'Rejected')}
                                  title="Tolak Pengajuan"
                                  className="p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors cursor-pointer"
                                >
                                  <XIcon className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: MANAJEMEN WARGA */}
          {activeTab === 'warga' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
                {/* Search & Filter */}
                <div className="flex flex-wrap items-center gap-3 flex-1 max-w-xl">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari warga (Nama, NIK, No. KK)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 outline-none"
                    >
                      <option value="All">Semua Warga</option>
                      <option value="Tetap">Status Tetap</option>
                      <option value="Kontrak">Status Kontrak</option>
                      <option value="Hidup">Masih Hidup</option>
                      <option value="Meninggal">Meninggal Dunia</option>
                    </select>
                  </div>
                </div>

                {/* Add Button */}
                <button
                  onClick={() => openAddModal('warga')}
                  className="py-2.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-500 dark:to-teal-400 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] hover:shadow-lg hover:shadow-emerald-500/10 cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Warga</span>
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto border border-slate-150 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-150 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider">
                      <th className="p-4">No. NIK / KK</th>
                      <th className="p-4">Nama Lengkap</th>
                      <th className="p-4">Kontak / Akun</th>
                      <th className="p-4">Alamat Rumah</th>
                      <th className="p-4 text-center">Status / Gender</th>
                      <th className="p-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                    {wargaList
                      .filter(w => {
                        const q = searchQuery.toLowerCase();
                        const matchesSearch = w.name.toLowerCase().includes(q) || w.nik.includes(q) || w.noKk.includes(q);
                        
                        if (statusFilter === 'All') return matchesSearch;
                        if (statusFilter === 'Tetap') return matchesSearch && w.status === 'Tetap';
                        if (statusFilter === 'Kontrak') return matchesSearch && w.status === 'Kontrak';
                        if (statusFilter === 'Hidup') return matchesSearch && w.statusHidup !== 'Meninggal';
                        if (statusFilter === 'Meninggal') return matchesSearch && w.statusHidup === 'Meninggal';
                        return matchesSearch;
                      })
                      .map((w) => (
                        <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                          <td className="p-4 font-mono space-y-1">
                            <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                              <span>NIK: {getDisplayNik(w.id, w.nik)}</span>
                              <button
                                onClick={() => revealedNiks[w.id] ? setRevealedNiks(prev => ({ ...prev, [w.id]: false })) : handleRevealClick(w.id, 'nik')}
                                className="text-slate-400 hover:text-emerald-500 transition-colors p-0.5 cursor-pointer"
                                title={revealedNiks[w.id] ? "Sembunyikan NIK" : "Tampilkan NIK (Perlu Sandi)"}
                              >
                                {revealedNiks[w.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                              <span>KK: {getDisplayKk(w.id, w.noKk)}</span>
                              <button
                                onClick={() => revealedKks[w.id] ? setRevealedKks(prev => ({ ...prev, [w.id]: false })) : handleRevealClick(w.id, 'kk')}
                                className="text-slate-400 hover:text-emerald-500 transition-colors p-0.5 cursor-pointer"
                                title={revealedKks[w.id] ? "Sembunyikan KK" : "Tampilkan KK (Perlu Sandi)"}
                              >
                                {revealedKks[w.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="p-4 space-y-1 font-sans">
                            <span className="font-bold text-slate-905 dark:text-slate-100">{w.name}</span>
                            <div className="flex gap-2">
                              <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-850 rounded font-semibold text-slate-400 font-mono">
                                ID: {w.id}
                              </span>
                              {w.statusHidup === 'Meninggal' && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-red-500/10 text-red-500 font-bold rounded">
                                  Wafat
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 space-y-1">
                            <div className="font-semibold text-slate-655 dark:text-slate-350">U: {w.username}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                              <span>P: {getDisplayPassword(w.id, w.password)}</span>
                              <button
                                onClick={() => revealedPasswords[w.id] ? setRevealedPasswords(prev => ({ ...prev, [w.id]: false })) : handleRevealClick(w.id, 'password')}
                                className="text-slate-400 hover:text-emerald-500 transition-colors p-0.5 cursor-pointer"
                                title={revealedPasswords[w.id] ? "Sembunyikan Password" : "Tampilkan Password (Perlu Sandi)"}
                              >
                                {revealedPasswords[w.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="p-4 max-w-[200px] truncate" title={w.alamat}>
                            {w.alamat}
                          </td>
                          <td className="p-4 text-center space-y-1">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                w.status === 'Tetap'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              }`}>
                                {w.status}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400">{w.gender}, {w.usia} thn</div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditModal('warga', w)}
                                className="p-2 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-all cursor-pointer"
                                title="Edit Data Warga"
                              >
                                <Edit className="w-3.5 h-3.5 text-slate-500 hover:text-emerald-500" />
                              </button>
                              <button
                                onClick={() => handleDelete('warga', w.id)}
                                className="p-2 border border-slate-200 dark:border-slate-800 hover:border-red-500 dark:hover:border-red-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-all cursor-pointer"
                                title="Hapus Warga"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-red-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: KAS RT */}
          {activeTab === 'kas' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              
              {/* Financial mini dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-slate-100 dark:border-slate-800 pb-6">
                <div className="p-4 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 dark:border-emerald-500/25 rounded-2xl">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs mb-1.5">
                    <TrendingUp className="w-4 h-4" />
                    <span>Total Pemasukan</span>
                  </div>
                  <span className="block text-xl font-black text-slate-900 dark:text-white">{formatRupiah(totalPemasukan)}</span>
                </div>
                <div className="p-4 bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/10 dark:border-rose-500/25 rounded-2xl">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-455 font-bold text-xs mb-1.5">
                    <TrendingDown className="w-4 h-4" />
                    <span>Total Pengeluaran</span>
                  </div>
                  <span className="block text-xl font-black text-slate-900 dark:text-white">{formatRupiah(totalPengeluaran)}</span>
                </div>
                <div className="p-4 bg-teal-500/5 dark:bg-teal-500/10 border border-teal-500/10 dark:border-teal-500/25 rounded-2xl">
                  <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-xs mb-1.5">
                    <Wallet className="w-4 h-4" />
                    <span>Saldo Akhir Kas</span>
                  </div>
                  <span className="block text-xl font-black text-slate-900 dark:text-white">{formatRupiah(sisaKas)}</span>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari transaksi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white transition-all"
                  />
                </div>

                <button
                  onClick={() => openAddModal('kas')}
                  className="py-2.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-500 dark:to-teal-400 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] hover:shadow-lg hover:shadow-emerald-500/10 cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Catat Transaksi</span>
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto border border-slate-150 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-150 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider">
                      <th className="p-4">Tanggal / ID</th>
                      <th className="p-4">Deskripsi Transaksi</th>
                      <th className="p-4">Kategori</th>
                      <th className="p-4 text-center">Tipe</th>
                      <th className="p-4 text-right">Jumlah Uang</th>
                      <th className="p-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                    {transaksiKasList
                      .filter(t => t.description.toLowerCase().includes(searchQuery.toLowerCase()) || t.category.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                          <td className="p-4 space-y-1 font-mono">
                            <span className="font-bold text-slate-700 dark:text-slate-350">{t.date}</span>
                            <div className="text-[10px] text-slate-400">{t.id}</div>
                          </td>
                          <td className="p-4 font-semibold text-slate-900 dark:text-white max-w-[280px] whitespace-normal break-words">
                            {t.description}
                          </td>
                          <td className="p-4 font-semibold text-slate-500 dark:text-slate-450">
                            {t.category}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] inline-block ${
                              t.type === 'income'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-455'
                            }`}>
                              {t.type === 'income' ? 'Masuk' : 'Keluar'}
                            </span>
                          </td>
                          <td className={`p-4 text-right font-bold text-sm font-mono ${
                            t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-455'
                          }`}>
                            {t.type === 'income' ? '+' : '-'}{formatRupiah(t.amount).replace('Rp', 'Rp ')}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditModal('kas', t)}
                                className="p-2 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-all cursor-pointer"
                                title="Edit Transaksi"
                              >
                                <Edit className="w-3.5 h-3.5 text-slate-500 hover:text-emerald-500" />
                              </button>
                              <button
                                onClick={() => handleDelete('kas', t.id)}
                                className="p-2 border border-slate-200 dark:border-slate-800 hover:border-red-500 dark:hover:border-red-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-all cursor-pointer"
                                title="Hapus Transaksi"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-red-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 4: MANAJEMEN AGENDA */}
          {activeTab === 'agenda' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center font-sans">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari agenda kegiatan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white transition-all"
                  />
                </div>

                <button
                  onClick={() => openAddModal('agenda')}
                  className="py-2.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-500 dark:to-teal-400 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] hover:shadow-lg hover:shadow-emerald-500/10 cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agenda Baru</span>
                </button>
              </div>

              {/* Grid lists cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {agendaList
                  .filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.category.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((a) => (
                    <div key={a.id} className="relative bg-slate-50 dark:bg-slate-950/50 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between overflow-hidden">
                      {/* Top Accent line */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
                      
                      <div className="space-y-4">
                        {/* Title & Badge */}
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-450 uppercase font-black tracking-widest">{a.category}</span>
                            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5 leading-tight">{a.title}</h4>
                          </div>
                          <span className="text-[9px] px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-500 font-mono rounded font-semibold">{a.id}</span>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed line-clamp-3">
                          {a.description}
                        </p>

                        {/* Meta info Grid */}
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-150 dark:border-slate-800 text-[10px]">
                          <div>
                            <span className="block text-slate-400 font-bold uppercase tracking-wider">Tanggal & Waktu</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{a.date} ({a.time})</span>
                          </div>
                          <div>
                            <span className="block text-slate-400 font-bold uppercase tracking-wider">Tempat</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block" title={a.location}>{a.location}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-150 dark:border-slate-800">
                        <button
                          onClick={() => openEditModal('agenda', a)}
                          className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-900 text-xs font-bold rounded-xl text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete('agenda', a.id)}
                          className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 hover:border-red-500 hover:bg-slate-100 dark:hover:bg-slate-900 text-xs font-bold rounded-xl text-slate-600 dark:text-slate-300 hover:text-red-655 dark:hover:text-red-400 flex items-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>

                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 5: LAYANAN WARGA */}
          {activeTab === 'layanan' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              
              {/* Search Toolbar */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center font-sans">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari pengajuan berdasarkan nama warga..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white transition-all"
                  />
                </div>
              </div>

              {/* List table for Submissions */}
              <div className="overflow-x-auto border border-slate-150 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-150 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider">
                      <th className="p-4">Tanggal / ID</th>
                      <th className="p-4">Data Warga Pemohon</th>
                      <th className="p-4">Jenis Surat Pengantar</th>
                      <th className="p-4">Keperluan / Keterangan</th>
                      <th className="p-4 text-center">Status Berkas</th>
                      <th className="p-4 text-right">Aksi Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                    {submissionsList
                      .filter(s => s.wargaNama.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                          <td className="p-4 font-mono space-y-1">
                            <span className="font-semibold text-slate-805 dark:text-slate-350">{sub.submissionDate}</span>
                            <div className="text-[10px] text-slate-400">{sub.id}</div>
                          </td>
                          <td className="p-4 space-y-1">
                            <span className="font-bold text-slate-905 dark:text-slate-100">{sub.wargaNama}</span>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 flex-wrap">
                              <span>NIK: {getDisplayNik(sub.id, sub.wargaNik)}</span>
                              <button
                                onClick={() => revealedNiks[sub.id] ? setRevealedNiks(prev => ({ ...prev, [sub.id]: false })) : handleRevealClick(sub.id, 'nik')}
                                className="text-slate-400 hover:text-emerald-500 transition-colors p-0.5 cursor-pointer"
                                title={revealedNiks[sub.id] ? "Sembunyikan NIK" : "Tampilkan NIK (Perlu Sandi)"}
                              >
                                {revealedNiks[sub.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <span>| KK: {getDisplayKk(sub.id, sub.wargaNoKk)}</span>
                              <button
                                onClick={() => revealedKks[sub.id] ? setRevealedKks(prev => ({ ...prev, [sub.id]: false })) : handleRevealClick(sub.id, 'kk')}
                                className="text-slate-400 hover:text-emerald-500 transition-colors p-0.5 cursor-pointer"
                                title={revealedKks[sub.id] ? "Sembunyikan KK" : "Tampilkan KK (Perlu Sandi)"}
                              >
                                {revealedKks[sub.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            <div className="text-[10px] text-slate-500">Alamat: {sub.wargaAlamat}</div>
                          </td>
                          <td className="p-4 font-bold text-emerald-600 dark:text-emerald-450">
                            {sub.wargaTipeSurat}
                          </td>
                          <td className="p-4 italic max-w-[200px] whitespace-normal break-words text-slate-600 dark:text-slate-300">
                            "{sub.wargaKeperluan}"
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg inline-block ${
                                sub.status === 'Approved'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600'
                                  : sub.status === 'Rejected'
                                  ? 'bg-red-50 dark:bg-red-950/20 text-red-600'
                                  : sub.status === 'Completed'
                                  ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600'
                                  : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 animate-pulse'
                              }`}>
                                {sub.status || 'Pending'}
                              </span>
                              {sub.processedDate && (
                                <span className="text-[8px] text-slate-400">Diproses: {sub.processedDate}</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* If Pending, can Approve or Reject */}
                              {(!sub.status || sub.status === 'Pending') && (
                                <>
                                  <button
                                    onClick={() => handleSubmissionStatus(sub.id, 'Approved')}
                                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                                    title="Setujui"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Setujui</span>
                                  </button>
                                  <button
                                    onClick={() => handleSubmissionStatus(sub.id, 'Rejected')}
                                    className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                                    title="Tolak"
                                  >
                                    <XIcon className="w-3 h-3" />
                                    <span>Tolak</span>
                                  </button>
                                </>
                              )}

                              {/* If Approved, can Complete (when resident picks up) */}
                              {sub.status === 'Approved' && (
                                <button
                                  onClick={() => handleSubmissionStatus(sub.id, 'Completed')}
                                  className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                                  title="Tandai Selesai Diambil"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Selesaikan</span>
                                </button>
                              )}
                              
                              {/* If Completed or Rejected, no further actions, show status lock */}
                              {(sub.status === 'Completed' || sub.status === 'Rejected') && (
                                <span className="text-[10px] text-slate-400 font-semibold italic">Arsip Terkunci</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 6: LOG AKSES WARGA */}
          {activeTab === 'logs' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari aktivitas berdasarkan nama/username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white transition-all"
                  />
                </div>
                <button
                  onClick={() => {
                    if (confirm('Apakah Anda yakin ingin membersihkan seluruh log akses?')) {
                      localStorage.setItem('rt_access_logs', JSON.stringify([]));
                      setLogsTrigger(t => t + 1);
                    }
                  }}
                  className="px-4 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Semua Log</span>
                </button>
              </div>
              <span className="hidden" aria-hidden="true">{logsTrigger}</span>

              {/* Table rendering logs */}
              <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
                <table className="w-full border-collapse text-left text-xs font-sans">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-955 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="p-4">ID Log</th>
                      <th className="p-4">Warga / Pengguna</th>
                      <th className="p-4">Peran (Role)</th>
                      <th className="p-4">Waktu Masuk</th>
                      <th className="p-4">IP Address</th>
                      <th className="p-4">Aplikasi/Device</th>
                      <th className="p-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                    {accessLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 font-semibold italic">
                          Belum ada aktivitas masuk di portal ini.
                        </td>
                      </tr>
                    ) : (
                      accessLogs
                        .filter(log => 
                          log.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.username.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition-colors">
                            <td className="p-4 font-mono font-bold text-slate-500">{log.id}</td>
                            <td className="p-4">
                              <div>
                                <span className="font-extrabold text-slate-900 dark:text-white block">{log.name}</span>
                                <span className="text-[10px] text-slate-400">@{log.username}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block uppercase ${
                                log.role === 'rt' || log.role === 'admin'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                                  : log.role === 'sekertaris'
                                  ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                                  : log.role === 'bendahara'
                                  ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-655 dark:text-slate-400'
                              }`}>
                                {log.role}
                              </span>
                            </td>
                            <td className="p-4 text-slate-500 font-semibold">
                              {new Date(log.loginTime).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                            </td>
                            <td className="p-4 font-mono text-[11px] text-slate-500">{log.ipAddress}</td>
                            <td className="p-4 text-slate-500">{log.userAgent}</td>
                            <td className="p-4 text-right">
                              {log.role === 'warga' ? (
                                <button
                                  onClick={() => handleShowAccessProfile(log.username)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                                >
                                  Lihat Profil Warga
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic font-semibold">Bukan Warga</span>
                              )}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* 3. CRUD MODALS */}
      {modalType !== '' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setModalType('')}
          ></div>

          <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-2xl overflow-hidden z-10 animate-scale-up max-h-[90vh] flex flex-col">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>

            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                {modalType === 'add_warga' && 'Tambah Warga Baru'}
                {modalType === 'edit_warga' && 'Edit Data Warga'}
                {modalType === 'add_kas' && 'Catat Kas Masuk/Keluar'}
                {modalType === 'edit_kas' && 'Edit Catatan Kas'}
                {modalType === 'add_agenda' && 'Buat Agenda Baru'}
                {modalType === 'edit_agenda' && 'Edit Detail Agenda'}
              </h3>
              <button 
                onClick={() => setModalType('')}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-655 cursor-pointer"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 font-sans text-xs">
              {formError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* WARGA FORM */}
              {(modalType === 'add_warga' || modalType === 'edit_warga') && (
                <form onSubmit={handleWargaSubmit} className="space-y-4 text-xs font-sans">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-655 dark:text-slate-350">Nama Lengkap *</label>
                    <input
                      required
                      type="text"
                      placeholder="Nama lengkap warga"
                      value={wargaForm.name}
                      onChange={(e) => setWargaForm({ ...wargaForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-655 dark:text-slate-350">Username Akun *</label>
                      <input
                        required
                        type="text"
                        placeholder="Username login"
                        value={wargaForm.username}
                        onChange={(e) => setWargaForm({ ...wargaForm, username: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-655 dark:text-slate-350">Password Akun *</label>
                      <input
                        required
                        type="text"
                        placeholder="Password login"
                        value={wargaForm.password}
                        onChange={(e) => setWargaForm({ ...wargaForm, password: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-655 dark:text-slate-350">NIK (16 Digit) *</label>
                      <input
                        required
                        type="text"
                        maxLength={16}
                        placeholder="Nomor NIK"
                        value={wargaForm.nik}
                        onChange={(e) => setWargaForm({ ...wargaForm, nik: e.target.value.replace(/\D/g, '') })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-655 dark:text-slate-350">No. KK (16 Digit) *</label>
                      <input
                        required
                        type="text"
                        maxLength={16}
                        placeholder="Nomor KK"
                        value={wargaForm.noKk}
                        onChange={(e) => setWargaForm({ ...wargaForm, noKk: e.target.value.replace(/\D/g, '') })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5 col-span-2">
                      <label className="font-bold text-slate-655 dark:text-slate-350">Jenis Kelamin</label>
                      <select
                        value={wargaForm.gender}
                        onChange={(e) => setWargaForm({ ...wargaForm, gender: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                      >
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-655 dark:text-slate-350">Usia (Thn) *</label>
                      <input
                        required
                        type="number"
                        min="1"
                        max="120"
                        placeholder="Usia"
                        value={wargaForm.usia}
                        onChange={(e) => setWargaForm({ ...wargaForm, usia: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-655 dark:text-slate-350">Status Rumah</label>
                      <select
                        value={wargaForm.status}
                        onChange={(e) => setWargaForm({ ...wargaForm, status: e.target.value })}
                        className="w-full px-2 py-2.5 bg-slate-50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-[11px]"
                      >
                        <option value="Tetap">Tetap</option>
                        <option value="Kontrak">Kontrak</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-655 dark:text-slate-350">Status Hidup</label>
                      <select
                        value={wargaForm.statusHidup}
                        onChange={(e) => setWargaForm({ ...wargaForm, statusHidup: e.target.value })}
                        className="w-full px-2 py-2.5 bg-slate-50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-[11px]"
                      >
                        <option value="Hidup">Hidup (Aktif)</option>
                        <option value="Meninggal">Meninggal Dunia</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-655 dark:text-slate-350">Status Iuran</label>
                      <select
                        value={wargaForm.statusIuran || 'Lunas'}
                        onChange={(e) => setWargaForm({ ...wargaForm, statusIuran: e.target.value })}
                        className="w-full px-2 py-2.5 bg-slate-50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-[11px]"
                      >
                        <option value="Lunas">Lunas</option>
                        <option value="Menunggak (Rp 50.000)">Menunggak (50rb)</option>
                        <option value="Menunggak (Rp 100.000)">Menunggak (100rb)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-655 dark:text-slate-350">Alamat Rumah *</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Sawangan Green Park Blok X No Y"
                      value={wargaForm.alamat}
                      onChange={(e) => setWargaForm({ ...wargaForm, alamat: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors cursor-pointer text-xs"
                  >
                    Simpan Data Warga
                  </button>
                </form>
              )}

              {/* KAS FORM */}
              {(modalType === 'add_kas' || modalType === 'edit_kas') && (
                <form onSubmit={handleKasSubmit} className="space-y-4 text-xs font-sans">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-655 dark:text-slate-350">Jenis Transaksi</label>
                      <select
                        value={kasForm.type}
                        onChange={(e) => setKasForm({ ...kasForm, type: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                      >
                        <option value="income">Masuk (Pemasukan)</option>
                        <option value="expense">Keluar (Pengeluaran)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-655 dark:text-slate-350">Kategori Kas</label>
                      <select
                        value={kasForm.category}
                        onChange={(e) => setKasForm({ ...kasForm, category: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                      >
                        <option value="Iuran Warga">Iuran Warga</option>
                        <option value="Donasi">Donasi / Sumbangan</option>
                        <option value="Kebersihan">Kebersihan</option>
                        <option value="Keamanan">Keamanan Complex</option>
                        <option value="Sosial / Santunan">Sosial / Santunan</option>
                        <option value="Kas Masjid">Kas Masjid</option>
                        <option value="Pembangunan">Pembangunan Fisik</option>
                        <option value="Lain-lain">Lain-lain</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-655 dark:text-slate-350">Jumlah Uang (Rupiah) *</label>
                      <input
                        required
                        type="number"
                        placeholder="Contoh: 50000"
                        value={kasForm.amount}
                        onChange={(e) => setKasForm({ ...kasForm, amount: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-mono text-sm"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-655 dark:text-slate-350">Tanggal Transaksi *</label>
                      <input
                        required
                        type="date"
                        value={kasForm.date}
                        onChange={(e) => setKasForm({ ...kasForm, date: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-655 dark:text-slate-350">Deskripsi / Keterangan *</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Tulis alasan transaksi kas secara jelas..."
                      value={kasForm.description}
                      onChange={(e) => setKasForm({ ...kasForm, description: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors cursor-pointer text-xs"
                  >
                    Simpan Transaksi Kas
                  </button>
                </form>
              )}

              {/* AGENDA FORM */}
              {(modalType === 'add_agenda' || modalType === 'edit_agenda') && (
                <form onSubmit={handleAgendaSubmit} className="space-y-4 text-xs font-sans">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-655 dark:text-slate-350">Judul Kegiatan / Rapat *</label>
                    <input
                      required
                      type="text"
                      placeholder="Kerja bakti, Rapat bulanan..."
                      value={agendaForm.title}
                      onChange={(e) => setAgendaForm({ ...agendaForm, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-655 dark:text-slate-350">Kategori Kegiatan</label>
                      <select
                        value={agendaForm.category}
                        onChange={(e) => setAgendaForm({ ...agendaForm, category: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                      >
                        <option value="Kerja Bakti">Kerja Bakti</option>
                        <option value="Rapat Warga">Rapat Warga</option>
                        <option value="Kesehatan">Kesehatan / Posyandu</option>
                        <option value="Perayaan 17an">Perayaan Hari Besar</option>
                        <option value="Keagamaan">Kegiatan Keagamaan</option>
                        <option value="Sosialisasi">Sosialisasi / Edukasi</option>
                        <option value="Lain-lain">Lain-lain</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-655 dark:text-slate-350">Target Peserta *</label>
                      <input
                        required
                        type="text"
                        placeholder="Contoh: Seluruh Warga Blok A - E"
                        value={agendaForm.participants}
                        onChange={(e) => setAgendaForm({ ...agendaForm, participants: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-655 dark:text-slate-350">Tanggal Pelaksanaan *</label>
                      <input
                        required
                        type="date"
                        value={agendaForm.date}
                        onChange={(e) => setAgendaForm({ ...agendaForm, date: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-655 dark:text-slate-350">Waktu Pelaksanaan *</label>
                      <input
                        required
                        type="text"
                        placeholder="Contoh: 07:00 - 11:00 WIB"
                        value={agendaForm.time}
                        onChange={(e) => setAgendaForm({ ...agendaForm, time: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-655 dark:text-slate-350">Lokasi / Tempat Rapat *</label>
                    <input
                      required
                      type="text"
                      placeholder="Contoh: Balai Warga RT 04"
                      value={agendaForm.location}
                      onChange={(e) => setAgendaForm({ ...agendaForm, location: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-655 dark:text-slate-350">Deskripsi Kegiatan Lengkap *</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Jelaskan detail agenda kegiatan atau rapat..."
                      value={agendaForm.description}
                      onChange={(e) => setAgendaForm({ ...agendaForm, description: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors cursor-pointer text-xs"
                  >
                    Simpan Agenda
                  </button>
                 </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PASSWORD PROMPT MODAL FOR REVEALING NIK */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setShowPasswordPrompt(false)}
          ></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-10 p-6 space-y-4 animate-scale-up font-sans text-xs">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            <div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">Verifikasi Keamanan</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Masukkan sandi Admin untuk membuka {targetField === 'nik' ? 'data NIK lengkap.' : targetField === 'kk' ? 'data nomor KK lengkap.' : 'sandi akun warga.'}
              </p>
            </div>

            {promptError && (
              <div className="p-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 font-semibold flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{promptError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmPassword} className="space-y-4">
              <input
                required
                autoFocus
                type="password"
                placeholder="Masukkan Sandi Admin"
                value={promptPasswordInput}
                onChange={(e) => setPromptPasswordInput(e.target.value)}
                className="w-full px-3 py-2 bg-slate-55 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-805 rounded-xl outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold rounded-xl cursor-pointer"
                >
                  Konfirmasi
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordPrompt(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-655 text-slate-600 dark:text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEWING CITIZEN PROFILE MODAL FROM LOGS */}
      {viewingCitizenProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setViewingCitizenProfile(null)}
          ></div>
          
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-2xl overflow-hidden z-10 animate-scale-up">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Profil Lengkap Warga</h3>
              <button 
                onClick={() => setViewingCitizenProfile(null)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-655 cursor-pointer"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 font-sans text-xs sm:text-sm overflow-y-auto max-h-[80vh]">
              {/* Visual Avatar */}
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-black flex items-center justify-center rounded-2xl text-2xl shadow-lg">
                  {viewingCitizenProfile.name ? viewingCitizenProfile.name.charAt(0) : 'W'}
                </div>
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white text-base">{viewingCitizenProfile.name}</h4>
                  <span className="text-[10px] text-slate-400">ID Warga: {viewingCitizenProfile.id}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500 font-semibold">Username Login</span>
                  <span className="font-bold text-slate-900 dark:text-white">@{viewingCitizenProfile.username}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-slate-100 dark:border-slate-800/40">
                  <span className="text-slate-505 font-semibold">Email Warga</span>
                  <span className="font-bold text-slate-900 dark:text-white">{viewingCitizenProfile.email || '-'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-slate-100 dark:border-slate-800/40">
                  <span className="text-slate-500 font-semibold">NIK (Tersensor)</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    {viewingCitizenProfile.nik ? viewingCitizenProfile.nik.slice(0, 6) + '******' + viewingCitizenProfile.nik.slice(12) : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-slate-100 dark:border-slate-800/40">
                  <span className="text-slate-550 font-semibold">No. KK (Tersensor)</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    {viewingCitizenProfile.noKk ? viewingCitizenProfile.noKk.slice(0, 6) + '******' + viewingCitizenProfile.noKk.slice(12) : '-'}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Jenis Kelamin</span>
                  <span className="font-bold text-slate-800 dark:text-slate-205">{viewingCitizenProfile.gender}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-slate-100 dark:border-slate-800/40">
                  <span className="text-slate-500 font-semibold">Usia</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{viewingCitizenProfile.usia} Tahun</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-slate-100 dark:border-slate-800/40">
                  <span className="text-slate-550 font-semibold">Status Rumah</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-450">{viewingCitizenProfile.status}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-slate-100 dark:border-slate-800/40">
                  <span className="text-slate-500 font-semibold">Status Hidup</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${viewingCitizenProfile.statusHidup === 'Hidup' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-650' : 'bg-red-50 dark:bg-red-950/30 text-red-655'}`}>{viewingCitizenProfile.statusHidup}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-955/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-semibold block mb-1 text-xs">Alamat Rumah Lengkap</span>
                <span className="text-slate-800 dark:text-slate-200 italic font-medium leading-relaxed block text-xs">
                  "{viewingCitizenProfile.alamat}"
                </span>
              </div>

              <button
                onClick={() => setViewingCitizenProfile(null)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Tutup Profil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
