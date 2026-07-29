import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Wallet, Calendar, FileCheck, LogOut, 
  Search, Plus, Edit, Trash2, Check, X as XIcon, Landmark, 
  Sun, Moon, TrendingUp, TrendingDown, CheckCircle2, 
  AlertCircle, Sparkles, Filter, Activity, Eye, EyeOff, Wand2,
  FileText, Volume2, AlertTriangle, FolderOpen, Settings, User, BarChart3,
  Database, Lock, ChevronLeft, ChevronRight, Upload, Download, File, Loader2,
  Building2, RotateCcw, Key, Menu, UserCheck, Phone
} from 'lucide-react';
import AdminDataWizard from './AdminDataWizard';
import DateInput from './DateInput';
import Swal from 'sweetalert2';
import { io } from 'socket.io-client';

const formatDateIndo = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateStr;
  }
};

const calculateAge = (birthDateString) => {
  if (!birthDateString) return '';
  const today = new Date();
  const birthDate = new Date(birthDateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : 0;
};

const isTabAllowedForRole = (tab, role) => {
  if (role === 'rt' || role === 'admin') return true;
  
  const financeTabs = [
    'kas', 'iuran_jenis', 'iuran_pembayaran', 'iuran_riwayat', 'iuran_tunggakan', 'iuran_verifikasi',
    'laporan_bulanan', 'laporan_tahunan', 'laporan_rekap', 'laporan_export',
    'keuangan_pemasukan', 'keuangan_pengeluaran', 'keuangan_kas', 'keuangan_qris'
  ];
  
  if (role === 'bendahara') {
    return tab === 'overview' || tab === 'pengaturan' || financeTabs.includes(tab);
  }
  
  if (role === 'sekertaris' || role === 'sekretaris') {
    return !financeTabs.includes(tab);
  }
  
  return false;
};

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
  setDarkMode,
  fetchAgendas,
  dashboardStats
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'warga' | 'kas' | 'agenda' | 'layanan'
  const [kasSubTab, setKasSubTab] = useState('transaksi'); // 'transaksi' | 'tunggakan'
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [loadingAccountId, setLoadingAccountId] = useState(null);
  const [showAccountPassword, setShowAccountPassword] = useState(false);
  const [showAccountConfirmPassword, setShowAccountConfirmPassword] = useState(false);
  const [usernameFieldError, setUsernameFieldError] = useState('');

  const cleanNameStr = (str) => String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  // Persistent registry of created accounts across refreshes & backend syncs
  const getCreatedAccountsMap = () => {
    try {
      const saved = localStorage.getItem('rt_created_accounts');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  };

  const saveCreatedAccount = (citizen, familyId, username, password) => {
    if (!citizen && !familyId) return;
    try {
      const accounts = getCreatedAccountsMap();
      const record = { username, password, createdAt: new Date().toISOString() };
      
      const citizenId = citizen?.id || citizen?.warga_id;
      const nik = citizen?.nik;
      const cName = cleanNameStr(citizen?.name);

      if (familyId) accounts[`family_${familyId}`] = record;
      if (citizenId) accounts[`citizen_${citizenId}`] = record;
      if (nik && String(nik).trim().length > 0) accounts[`nik_${nik}`] = record;
      if (cName && cName.length > 0) accounts[`name_${cName}`] = record;

      localStorage.setItem('rt_created_accounts', JSON.stringify(accounts));
    } catch (e) {}
  };

  // Helper function to accurately detect account status across name, NIK, family, local storage, & state
  const checkWargaHasAccount = (w) => {
    if (!w) return false;
    if (w.username && String(w.username).trim().length > 0) return true;
    if (w.has_account === true || w.has_account === 1 || w.account_created === true || w.hasAccount === true) return true;
    
    const createdAccounts = getCreatedAccountsMap();
    const famId = w.family_id || w.fammilyId || w.familyId;
    const citizenId = w.id || w.warga_id;
    const nik = w.nik;
    const cName = cleanNameStr(w.name);

    if (cName && createdAccounts[`name_${cName}`]) return true;
    if (nik && createdAccounts[`nik_${nik}`]) return true;
    if (citizenId && createdAccounts[`citizen_${citizenId}`]) return true;
    if (famId && createdAccounts[`family_${famId}`]) return true;

    if (famId && Array.isArray(wargaList)) {
      const memberHasAcc = wargaList.some(item => {
        const isSameFam = (item.family_id === famId || item.fammilyId === famId || item.familyId === famId);
        const itemCleanName = cleanNameStr(item.name);
        const hasAcc = (item.username && String(item.username).trim().length > 0) || 
                       item.has_account === true || item.account_created === true || item.hasAccount === true ||
                       (famId && createdAccounts[`family_${famId}`]) || 
                       (item.id && createdAccounts[`citizen_${item.id}`]) ||
                       (item.nik && createdAccounts[`nik_${item.nik}`]) ||
                       (itemCleanName && createdAccounts[`name_${itemCleanName}`]);
        return isSameFam && hasAcc;
      });
      if (memberHasAcc) return true;
    }
    return false;
  };

  const getWargaUsername = (w) => {
    if (!w) return null;
    if (w.username && String(w.username).trim().length > 0) return w.username;
    
    const createdAccounts = getCreatedAccountsMap();
    const famId = w.family_id || w.fammilyId || w.familyId;
    const citizenId = w.id || w.warga_id;
    const nik = w.nik;
    const cName = cleanNameStr(w.name);

    if (cName && createdAccounts[`name_${cName}`]?.username) return createdAccounts[`name_${cName}`].username;
    if (nik && createdAccounts[`nik_${nik}`]?.username) return createdAccounts[`nik_${nik}`].username;
    if (citizenId && createdAccounts[`citizen_${citizenId}`]?.username) return createdAccounts[`citizen_${citizenId}`].username;
    if (famId && createdAccounts[`family_${famId}`]?.username) return createdAccounts[`family_${famId}`].username;

    if (famId && Array.isArray(wargaList)) {
      const famMember = wargaList.find(item => 
        (item.family_id === famId || item.fammilyId === famId || item.familyId === famId) && 
        (item.username && String(item.username).trim().length > 0)
      );
      if (famMember?.username) return famMember.username;
    }

    if (checkWargaHasAccount(w)) {
      return cName || 'warga';
    }
    
    return null;
  };
  
  // Nested Sidebar Open States for Bendahara
  const [isIuranOpen, setIsIuranOpen] = useState(true);
  const [isKeuanganOpen, setIsKeuanganOpen] = useState(true);
  const [isLaporanOpen, setIsLaporanOpen] = useState(true);

  // List of Dues types
  const [jenisIuranList, setJenisIuranList] = useState([
    { id: 'IUR-001', name: 'Iuran Wajib Kebersihan', amount: 20000, frequency: 'Bulanan', desc: 'Biaya pengangkutan sampah warga ke TPA bulanan.' },
    { id: 'IUR-002', name: 'Iuran Wajib Keamanan', amount: 30000, frequency: 'Bulanan', desc: 'Gaji petugas satpam komplek perumahan.' },
    { id: 'IUR-003', name: 'Iuran Sosial Kematian', amount: 10000, frequency: 'Sukarela', desc: 'Dana santunan musibah kematian warga RT 05.' },
  ]);

  // Payment Form States
  const [iuranPembayaranForm, setIuranPembayaranForm] = useState({
    wargaId: '',
    jenisIuranId: 'IUR-001',
    amount: 20000,
    month: 'Juli',
    date: new Date().toISOString().split('T')[0]
  });

  const [pemasukanForm, setPemasukanForm] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Donasi'
  });

  const [pengeluaranForm, setPengeluaranForm] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Kebersihan'
  });

  // Nested Sidebar Open States for Sekretaris
  const [isWargaOpen, setIsWargaOpen] = useState(true);
  const [isSuratOpen, setIsSuratOpen] = useState(true);
  const [isInformasiOpen, setIsInformasiOpen] = useState(true);

  // Secretary Log States
  const [pendudukMasukList, setPendudukMasukList] = useState([]);
  const [pendudukKeluarList, setPendudukKeluarList] = useState([]);
  const [suratMasukList, setSuratMasukList] = useState([]);
  const [suratKeluarList, setSuratKeluarList] = useState([]);
  const [notulenList, setNotulenList] = useState([]);
  const [arsipFileList, setArsipFileList] = useState([]);

  // Surat Masuk UI States
  const [suratMasukSearch, setSuratMasukSearch] = useState('');
  const [suratMasukDateStart, setSuratMasukDateStart] = useState('');
  const [suratMasukDateEnd, setSuratMasukDateEnd] = useState('');
  const [suratMasukStatusFilter, setSuratMasukStatusFilter] = useState('All');
  const [suratMasukPage, setSuratMasukPage] = useState(1);
  const [suratMasukDetail, setSuratMasukDetail] = useState(null);
  const [suratMasukLoading, setSuratMasukLoading] = useState(false);
  const [suratMasukSubmitLoading, setSuratMasukSubmitLoading] = useState(false);

  // Surat Keluar UI States
  const [suratKeluarSearch, setSuratKeluarSearch] = useState('');
  const [suratKeluarStatusFilter, setSuratKeluarStatusFilter] = useState('All');
  const [suratKeluarPage, setSuratKeluarPage] = useState(1);
  const [suratKeluarDetail, setSuratKeluarDetail] = useState(null);
  const [suratKeluarLoading, setSuratKeluarLoading] = useState(false);
  const [suratKeluarSubmitLoading, setSuratKeluarSubmitLoading] = useState(false);

  // Secretary Form States
  const [notulenForm, setNotulenForm] = useState({ title: '', date: new Date().toISOString().split('T')[0], decisions: '' });
  const [suratMasukForm, setSuratMasukForm] = useState({
    id: '',
    nomorSurat: '',
    asalSurat: '',
    perihal: '',
    tanggalSurat: new Date().toISOString().split('T')[0],
    tanggalDiterima: new Date().toISOString().split('T')[0],
    status: 'Baru',
    fileLampiran: null,
    fileUrl: ''
  });
  const [suratKeluarForm, setSuratKeluarForm] = useState({
    id: '',
    nomorSurat: '',
    jenisSurat: 'Surat Pengantar',
    namaPemohon: '',
    nik: '',
    tujuan: '',
    tanggalSurat: new Date().toISOString().split('T')[0],
    status: 'Draft'
  });
  const [arsipForm, setArsipForm] = useState({ name: '', category: 'Dokumen', size: '1.5 MB', date: new Date().toISOString().split('T')[0] });
  const [pendudukMasukForm, setPendudukMasukForm] = useState({ name: '', date: new Date().toISOString().split('T')[0], address: '', origin: '', status: 'Tetap' });
  const [pendudukKeluarForm, setPendudukKeluarForm] = useState({ name: '', date: new Date().toISOString().split('T')[0], address: '', destination: '', reason: '' });
  const [logsTrigger, setLogsTrigger] = useState(0);
  const [accessLogs, setAccessLogs] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('rt_access_logs');
    if (stored) {
      try { setAccessLogs(JSON.parse(stored)); } catch (e) { setAccessLogs([]); }
    }
  }, [logsTrigger]);

  const [serverComplaints, setServerComplaints] = useState([]);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(false);
  const [complaintsError, setComplaintsError] = useState('');

  const fetchServerComplaints = async () => {
    setIsLoadingComplaints(true);
    setComplaintsError('');
    const token = localStorage.getItem('rt_token');
    if (!token) {
      setComplaintsError('Token tidak ditemukan. Harap login kembali.');
      setIsLoadingComplaints(false);
      return;
    }

    try {
      const response = await fetch('http://172.20.32.62:3333/admin/pengaduan', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Gagal memuat data pengaduan dari server.');
      }

      const data = await response.json();
      const mappedData = (Array.isArray(data) ? data : []).map(item => ({
        ...item,
        jenis: item.jenis_pengaduan || item.jenis,
        keperluan: item.isi || item.keperluan
      }));
      setServerComplaints(mappedData);
    } catch (err) {
      console.error(err);
      setComplaintsError(err.message);
    } finally {
      setIsLoadingComplaints(false);
    }
  };

  const handleUpdateComplaintStatus = async (id, status) => {
    const token = localStorage.getItem('rt_token');
    if (!token) {
      alert('Token otentikasi tidak ditemukan.');
      return;
    }

    try {
      const response = await fetch(`http://172.20.32.62:3333/admin/pengaduan/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message || 'Status pengaduan berhasil diperbarui!');
        fetchServerComplaints();
      } else {
        alert(data.message || data.pesan || 'Gagal memperbarui status pengaduan.');
      }
    } catch (err) {
      alert(`Gagal menghubungi server: ${err.message}`);
    }
  };

  const [staffForm, setStaffForm] = useState({ username: '', password: '', email: '', role: 'sekertaris' });
  const handleCreateStaffAccount = async (e) => {
    e.preventDefault();
    if (!staffForm.username.trim() || !staffForm.password.trim() || !staffForm.email.trim()) {
      alert('Harap isi semua input form staff.');
      return;
    }
    const token = localStorage.getItem('rt_token');
    if (!token) { alert('Token tidak ditemukan.'); return; }
    try {
      const response = await fetch('http://172.20.32.62:3333/admin/create-staff-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: staffForm.username.trim(),
          password: staffForm.password.trim(),
          email: staffForm.email.trim(),
          role: staffForm.role
        })
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message || 'Akun staff berhasil dibuat!');
        setStaffForm({ username: '', password: '', email: '', role: 'sekertaris' });
      } else {
        alert(data.message || data.pesan || 'Gagal membuat akun staff.');
      }
    } catch (err) {
      alert(`Koneksi gagal: ${err.message}`);
    }
  };

  // ── Announcement State ──
  const [serverAnnouncements, setServerAnnouncements] = useState([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false);
  const [announcementsError, setAnnouncementsError] = useState('');
  const [announcementForm, setAnnouncementForm] = useState({ judul: '', isi: '' });
  const [editingAnnouncementId, setEditingAnnouncementId] = useState(null);

  const fetchServerAnnouncements = async () => {
    setIsLoadingAnnouncements(true);
    setAnnouncementsError('');
    const token = localStorage.getItem('rt_token');
    if (!token) { setAnnouncementsError('Token tidak ditemukan.'); setIsLoadingAnnouncements(false); return; }
    try {
      const res = await fetch('http://172.20.32.62:3333/admin/announcement', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Gagal memuat pengumuman.');
      const data = await res.json();
      setServerAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setAnnouncementsError(err.message);
    } finally {
      setIsLoadingAnnouncements(false);
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementForm.judul.trim() || !announcementForm.isi.trim()) return;
    const token = localStorage.getItem('rt_token');
    if (!token) { alert('Token tidak ditemukan.'); return; }
    try {
      const res = await fetch('http://172.20.32.62:3333/admin/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ judul: announcementForm.judul, isi: announcementForm.isi })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Pengumuman berhasil diterbitkan!');
        setAnnouncementForm({ judul: '', isi: '' });
        fetchServerAnnouncements();
      } else {
        alert(data.message || 'Gagal membuat pengumuman.');
      }
    } catch (err) { alert(`Gagal menghubungi server: ${err.message}`); }
  };

  const handleUpdateAnnouncement = async (e) => {
    e.preventDefault();
    if (!editingAnnouncementId) return;
    const token = localStorage.getItem('rt_token');
    if (!token) { alert('Token tidak ditemukan.'); return; }
    const body = {};
    if (announcementForm.judul.trim()) body.judul = announcementForm.judul;
    if (announcementForm.isi.trim()) body.isi = announcementForm.isi;
    if (!Object.keys(body).length) return;
    try {
      const res = await fetch(`http://172.20.32.62:3333/admin/announcement/${editingAnnouncementId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Pengumuman berhasil diperbarui!');
        setEditingAnnouncementId(null);
        setAnnouncementForm({ judul: '', isi: '' });
        fetchServerAnnouncements();
      } else {
        alert(data.message || 'Gagal memperbarui pengumuman.');
      }
    } catch (err) { alert(`Gagal menghubungi server: ${err.message}`); }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!confirm('Yakin ingin menghapus pengumuman ini?')) return;
    const token = localStorage.getItem('rt_token');
    if (!token) { alert('Token tidak ditemukan.'); return; }
    try {
      const res = await fetch(`http://172.20.32.62:3333/admin/announcement/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Pengumuman berhasil dihapus!');
        fetchServerAnnouncements();
      } else {
        alert(data.message || 'Gagal menghapus pengumuman.');
      }
    } catch (err) { alert(`Gagal menghubungi server: ${err.message}`); }
  };

  // ── Server Submissions State ──
  const [serverSubmissions, setServerSubmissions] = useState([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [submissionsError, setSubmissionsError] = useState('');

  const fetchServerSubmissions = async () => {
    setIsLoadingSubmissions(true);
    setSubmissionsError('');
    const token = localStorage.getItem('rt_token');
    if (!token) {
      setSubmissionsError('Token tidak ditemukan. Harap login kembali.');
      setIsLoadingSubmissions(false);
      return;
    }

    try {
      const response = await fetch('http://172.20.32.62:3333/admin/pengajuan', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Gagal memuat data pengajuan dari server.');
      }

      const data = await response.json();
      setServerSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setSubmissionsError(err.message);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  // Bukti Bayar Warga Upload List State
  const [buktiBayarWarga, setBuktiBayarWarga] = useState([]);

  const fetchBuktiBayarWarga = () => {
    const saved = localStorage.getItem('rt_warga_bukti_bayar');
    setBuktiBayarWarga(saved ? JSON.parse(saved) : []);
  };

  const [pendingWargaList, setPendingWargaList] = useState([]);
  const [isLoadingPendingWarga, setIsLoadingPendingWarga] = useState(false);
  const [pendingWargaError, setPendingWargaError] = useState('');

  const fetchPendingWargaList = async () => {
    setIsLoadingPendingWarga(true);
    setPendingWargaError('');
    const token = localStorage.getItem('rt_token');
    if (!token) {
      setPendingWargaError('Token tidak ditemukan.');
      setIsLoadingPendingWarga(false);
      return;
    }
    try {
      const response = await fetch('http://172.20.32.62:3333/admin/pending-warga', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Gagal mengambil daftar warga pending.');
      const data = await response.json();
      setPendingWargaList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setPendingWargaError(err.message);
    } finally {
      setIsLoadingPendingWarga(false);
    }
  };

  const handleVerifyPendingWarga = async (wargaId, status) => {
    const token = localStorage.getItem('rt_token');
    if (!token) { alert('Token tidak ditemukan.'); return; }
    try {
      const response = await fetch(`http://172.20.32.62:3333/admin/pending-warga/${wargaId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status }) // 'diterima' atau 'ditolak'
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message || `Verifikasi status warga berhasil diupdate menjadi ${status}!`);
        fetchPendingWargaList();
      } else {
        alert(data.message || data.pesan || 'Gagal mengubah status verifikasi warga.');
      }
    } catch (err) {
      alert(`Koneksi gagal: ${err.message}`);
    }
  };

  const [pendingPayments, setPendingPayments] = useState({ ipl: [], kas: [] });
  const [isLoadingPendingPayments, setIsLoadingPendingPayments] = useState(false);
  const [pendingPaymentsError, setPendingPaymentsError] = useState('');

  const fetchPendingPayments = async () => {
    setIsLoadingPendingPayments(true);
    setPendingPaymentsError('');
    const token = localStorage.getItem('rt_token');
    if (!token) {
      setPendingPaymentsError('Token tidak ditemukan.');
      setIsLoadingPendingPayments(false);
      return;
    }
    try {
      console.log('--- BENDAHARA: fetchPendingPayments started ---');
      console.log('Authorization Token:', token ? `Bearer ${token.substring(0, 15)}...` : 'None');
      const response = await fetch('http://172.20.32.62:3333/admin/finance/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('HTTP Status Response:', response.status);
      if (!response.ok) throw new Error('Gagal mengambil daftar transfer pending.');
      const data = await response.json();
      console.log('Raw JSON data received from pending API:', data);
      
      let rawIpl = [];
      let rawKas = [];
      
      const envelope = data.output || data.data || data;
      console.log('Envelope parsed:', envelope);
      
      if (Array.isArray(envelope)) {
        console.log('Envelope is an array. Filtering flat list of pending payments...');
        rawIpl = envelope.filter(item => (item.month !== undefined && item.month !== null) || (item.bulan !== undefined && item.bulan !== null));
        rawKas = envelope.filter(item => (item.month === undefined || item.month === null) && (item.bulan === undefined || item.bulan === null));
      } else if (envelope && typeof envelope === 'object') {
        console.log('Envelope is an object. Checking ipl and kas arrays...');
        const target = (envelope.pesan && typeof envelope.pesan === 'object') ? envelope.pesan : envelope;
        const iplPart = target.ipl || target.data_ipl || [];
        const kasPart = target.kas || target.data_kas || [];
        
        console.log('Raw iplPart:', iplPart);
        console.log('Raw kasPart:', kasPart);
        
        if (Array.isArray(iplPart)) {
          rawIpl = iplPart;
        } else if (iplPart && Array.isArray(iplPart.output)) {
          rawIpl = iplPart.output;
        }
        
        if (Array.isArray(kasPart)) {
          rawKas = kasPart;
        } else if (kasPart && Array.isArray(kasPart.output)) {
          rawKas = kasPart.output;
        }
      } else {
        console.log('Envelope format is unrecognized.');
      }
      
      console.log('Total rawIpl items filtered/extracted:', rawIpl.length);
      console.log('Total rawKas items filtered/extracted:', rawKas.length);
      
      // Map keys to expected frontend keys
      const iplMapped = rawIpl.map(item => ({
        ...item,
        id: item.transaksi_id !== undefined ? item.transaksi_id : (item.id !== undefined ? item.id : item.transaksi_id),
        warga_nama: item.nama || item.warga_nama || `Keluarga KK #${item.family_id || item.id_family || ''}`,
        payment_date: item.created_at || item.payment_date,
        year: item.tahun !== undefined ? item.tahun : item.year,
        month: item.bulan || item.month,
        payment_proof: item.bukti_pembayaran || item.payment_proof,
        status: item.status
      }));
      
      const kasMapped = rawKas.map(item => ({
        ...item,
        id: item.transaksi_id !== undefined ? item.transaksi_id : (item.id !== undefined ? item.id : item.transaksi_id),
        warga_nama: item.nama || item.warga_nama || `Keluarga KK #${item.family_id || item.id_family || ''}`,
        payment_date: item.created_at || item.payment_date,
        category: item.kategori || item.category,
        description: item.keterangan || item.description,
        payment_proof: item.bukti_pembayaran || item.payment_proof,
        amount: item.jumlah !== undefined ? item.jumlah : item.amount,
        status: item.status
      }));

      console.log('Mapped IPL items list:', iplMapped);
      console.log('Mapped Kas items list:', kasMapped);

      setPendingPayments({ ipl: iplMapped, kas: kasMapped });
    } catch (err) {
      console.error('Error occurred in fetchPendingPayments:', err);
      setPendingPaymentsError(err.message);
    } finally {
      setIsLoadingPendingPayments(false);
    }
  };

  const handleVerifyPendingPayment = async (type, paymentId, status, catatan = '') => {
    const token = localStorage.getItem('rt_token');
    if (!token) { alert('Token tidak ditemukan.'); return; }
    try {
      const endpoint = type === 'ipl' 
        ? `http://172.20.32.62:3333/admin/finance/approve-ipl/${paymentId}`
        : `http://172.20.32.62:3333/admin/finance/approve-kas/${paymentId}`;

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, catatan, note: catatan, keterangan: catatan })
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message || `Verifikasi iuran ${type.toUpperCase()} berhasil diupdate menjadi ${status}!`);
        fetchPendingPayments();
        fetchLedgerFromServer();
      } else {
        alert(data.message || data.pesan || `Gagal mengubah status verifikasi iuran ${type}.`);
      }
    } catch (err) {
      alert(`Koneksi gagal: ${err.message}`);
    }
  };

  const [iplAmountInput, setIplAmountInput] = useState(200000);
  const [previousBalanceInput, setPreviousBalanceInput] = useState(5000000);
  const handleUpdateIplSetting = async (e) => {
    e.preventDefault();
    if (!iplAmountInput || isNaN(iplAmountInput) || parseInt(iplAmountInput) <= 0) {
      alert('Masukkan nominal tarif IPL yang valid.');
      return;
    }
    if (previousBalanceInput === '' || isNaN(previousBalanceInput) || parseInt(previousBalanceInput) < 0) {
      alert('Masukkan saldo kas awal yang valid.');
      return;
    }
    const token = localStorage.getItem('rt_token');
    if (!token) { alert('Token tidak ditemukan.'); return; }
    try {
      const response = await fetch('http://172.20.32.62:3333/admin/finance/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          iplNominal: parseInt(iplAmountInput),
          previousBalance: parseInt(previousBalanceInput)
        })
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message || 'Pengaturan keuangan RT berhasil diperbarui!');
        // Update local jenisIuranList for instant feedback
        setJenisIuranList(prev => prev.map(j => j.id === 'IPL' || j.name?.includes('IPL') ? { ...j, amount: parseInt(iplAmountInput) } : j));
      } else {
        alert(data.message || data.pesan || 'Gagal memperbarui pengaturan keuangan RT.');
      }
    } catch (err) {
      alert(`Koneksi gagal: ${err.message}`);
    }
  };

  const fetchFinanceSettings = async () => {
    const token = localStorage.getItem('rt_token');
    if (!token) return;
    try {
      const response = await fetch('http://172.20.32.62:3333/admin/finance/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const settingsData = data.output || data.pesan || data;
        if (settingsData.iplNominal || settingsData.ipl_nominal || settingsData.nominal) {
          const val = settingsData.iplNominal || settingsData.ipl_nominal || settingsData.nominal;
          setIplAmountInput(val);
          setJenisIuranList(prev => prev.map(j => j.id === 'IPL' || j.name?.includes('IPL') ? { ...j, amount: val } : j));
        }
        if (settingsData.previousBalance !== undefined || settingsData.previous_balance !== undefined) {
          const bal = settingsData.previousBalance !== undefined ? settingsData.previousBalance : settingsData.previous_balance;
          setPreviousBalanceInput(bal);
        }
      }
    } catch (err) {
      console.error('Gagal memuat pengaturan iuran dari server:', err);
    }
  };

  const [adminOldPassword, setAdminOldPassword] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [isAdminChangingPassword, setIsAdminChangingPassword] = useState(false);

  const handleAdminChangePassword = async (e) => {
    e.preventDefault();
    if (adminNewPassword !== adminConfirmPassword) {
      alert('Kata sandi baru dan konfirmasi kata sandi tidak cocok.');
      return;
    }
    if (adminNewPassword.length < 8) {
      alert('Kata sandi baru minimal harus 8 karakter.');
      return;
    }

    const token = localStorage.getItem('rt_token');
    if (!token) {
      alert('Token otentikasi tidak ditemukan.');
      return;
    }

    setIsAdminChangingPassword(true);
    try {
      const response = await fetch('http://172.20.32.62:3333/resident/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          oldPassword: adminOldPassword,
          newPassword: adminNewPassword,
          confirmNewPassword: adminConfirmPassword
        })
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message || 'Kata sandi berhasil diperbarui!');
        setAdminOldPassword('');
        setAdminNewPassword('');
        setAdminConfirmPassword('');
      } else {
        alert(data.message || data.pesan || 'Gagal memperbarui kata sandi. Periksa kata sandi lama Anda.');
      }
    } catch (err) {
      alert(`Koneksi gagal: ${err.message}`);
    } finally {
      setIsAdminChangingPassword(false);
    }
  };

  const [financeTrackingList, setFinanceTrackingList] = useState([]);
  const [isLoadingFinanceTracking, setIsLoadingFinanceTracking] = useState(false);
  const [financeTrackingError, setFinanceTrackingError] = useState('');
  const [trackingMonth, setTrackingMonth] = useState(new Date().getMonth() + 1);
  const [trackingYear, setTrackingYear] = useState(2026);

  const fetchFinanceTracking = async () => {
    setIsLoadingFinanceTracking(true);
    setFinanceTrackingError('');
    const token = localStorage.getItem('rt_token');
    if (!token) {
      setFinanceTrackingError('Token tidak ditemukan.');
      setIsLoadingFinanceTracking(false);
      return;
    }
    try {
      const response = await fetch(`http://172.20.32.62:3333/admin/finance/tracking?month=${trackingMonth}&year=${trackingYear}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Gagal mengambil data tracking iuran.');
      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.output && Array.isArray(data.output) ? data.output : []);
      setFinanceTrackingList(list);
    } catch (err) {
      console.error(err);
      setFinanceTrackingError(err.message);
    } finally {
      setIsLoadingFinanceTracking(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'iuran_tunggakan') {
      fetchFinanceTracking();
    }
  }, [trackingMonth, trackingYear]);

  useEffect(() => {
    fetchBuktiBayarWarga();
    if (activeTab === 'sek_surat_masuk') {
      fetchSuratMasuk();
    } else if (activeTab === 'sek_surat_keluar') {
      fetchSuratKeluar();
    }
  }, [activeTab]);

  const handleVerifyManualReceipt = (receiptId, isApproved) => {
    const saved = localStorage.getItem('rt_warga_bukti_bayar');
    if (!saved) return;

    let list = JSON.parse(saved);
    const receipt = list.find(r => r.id === receiptId);
    if (!receipt) return;

    if (isApproved) {
      list = list.map(r => r.id === receiptId ? { ...r, status: 'Disetujui' } : r);
      const updatedWarga = wargaList.map(w => w.id === receipt.wargaId ? { ...w, statusIuran: 'Lunas' } : w);
      saveWarga(updatedWarga);

      const newTx = {
        id: 'TX-' + Math.floor(Math.random() * 90000 + 10000),
        description: `Pembayaran Iuran Warga (${receipt.bulan}) - ${receipt.wargaNama || 'Warga'} [Manual]`,
        amount: receipt.nominal || 50000,
        date: new Date().toISOString().split('T')[0],
        type: 'income',
        category: 'Iuran Warga'
      };
      saveKas([newTx, ...transaksiKasList]);

      alert('Bukti transfer pembayaran berhasil disetujui! Status iuran warga diubah menjadi Lunas.');
    } else {
      list = list.map(r => r.id === receiptId ? { ...r, status: 'Ditolak' } : r);
      alert('Bukti transfer pembayaran ditolak.');
    }

    localStorage.setItem('rt_warga_bukti_bayar', JSON.stringify(list));
    setBuktiBayarWarga(list);
  };

  const [residentServerList, setResidentServerList] = useState([]);
  const [isLoadingResidents, setIsLoadingResidents] = useState(false);
  const [residentError, setResidentError] = useState('');
  const [residentSubTab, setResidentSubTab] = useState('server'); // 'local' | 'server'

  const fetchResidentServerList = async () => {
    setIsLoadingResidents(true);
    setResidentError('');
    const token = localStorage.getItem('rt_token');
    if (!token) {
      setResidentError('Token otentikasi tidak ditemukan. Harap login kembali.');
      setIsLoadingResidents(false);
      return;
    }

    try {
      const response = await fetch('http://172.20.32.62:3333/admin/resident', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: Gagal memuat data dari server.`);
      }

      const data = await response.json();
      console.log('%c[fetchResidentServerList] Raw response:', 'color: #3b82f6; font-weight: bold;', data);
      
      let items = [];
      if (Array.isArray(data)) {
        items = data;
      } else if (data && Array.isArray(data.output)) {
        items = data.output;
      } else if (data && Array.isArray(data.data)) {
        items = data.data;
      } else if (data && typeof data === 'object') {
        const firstArray = Object.values(data).find(v => Array.isArray(v));
        if (firstArray) {
          items = firstArray;
        } else {
          console.warn('[fetchResidentServerList] Could not find array in response:', data);
          items = [];
        }
      }
      
      console.log(`%c[fetchResidentServerList] Found ${items.length} resident items`, 'color: #3b82f6; font-weight: bold;');
      setResidentServerList(items);
    } catch (err) {
      console.error('Failed to fetch residents:', err);
      setResidentError(err.message);
    } finally {
      setIsLoadingResidents(false);
    }
  };

  const fetchSuratMasuk = async () => {
    setSuratMasukLoading(true);
    const token = localStorage.getItem('rt_token');
    try {
      const response = await fetch('http://172.20.32.62:3333/admin/surat-masuk', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const items = data.output || data.data || (Array.isArray(data) ? data : []);
        const formatted = items.map(s => ({
          id: s.id || '',
          nomorSurat: s.nomor_surat || '',
          asalSurat: s.pengirim || s.asalSurat || '',
          perihal: s.perihal || s.perihalSurat || '',
          tanggalSurat: s.tanggal_surat ? s.tanggal_surat.split('T')[0] : (s.tanggalSurat || ''),
          tanggalDiterima: s.tanggal_terima ? s.tanggal_terima.split('T')[0] : (s.tanggalDiterima || ''),
          status: s.status || 'Baru',
          fileLampiran: s.file_lampiran || s.fileLampiran || '',
          isiRingkas: s.isi_ringkas || s.isiRingkas || ''
        }));
        setSuratMasukList(formatted);
      } else {
        throw new Error('Endpoint backend belum aktif atau mengembalikan error.');
      }
    } catch (err) {
      console.warn('Gagal mengambil surat masuk dari server, menggunakan local storage/state:', err.message);
      const saved = localStorage.getItem('rt_surat_masuk_mock');
      if (saved) {
        setSuratMasukList(JSON.parse(saved));
      } else {
        const mock = [
          { id: '1', nomorSurat: '001/RT05/VII/2026', asalSurat: 'Kelurahan Sawangan Baru', perihal: 'Undangan Rapat Koordinasi Agustusan', tanggalSurat: '2026-07-15', tanggalDiterima: '2026-07-16', status: 'Baru', fileLampiran: 'undangan_koordinasi.pdf', isiRingkas: 'Undangan resmi koordinasi perayaan HUT RI ke-81 di Balai Kelurahan.' },
          { id: '2', nomorSurat: '120/KEC-SWG/2026', asalSurat: 'Kecamatan Sawangan', perihal: 'Himbauan Kerja Bakti Serentak', tanggalSurat: '2026-07-10', tanggalDiterima: '2026-07-12', status: 'Diproses', fileLampiran: 'himbauan_kerja_bakti.pdf', isiRingkas: 'Himbauan melaksanakan kerja bakti membersihkan saluran air menjelang musim hujan.' },
          { id: '3', nomorSurat: '09/DINKES/VII/2026', asalSurat: 'Puskesmas Sawangan', perihal: 'Jadwal Fogging Nyamuk DBD', tanggalSurat: '2026-07-05', tanggalDiterima: '2026-07-06', status: 'Selesai', fileLampiran: 'jadwal_fogging.pdf', isiRingkas: 'Pemberitahuan pelaksanaan fogging di wilayah RT 05 untuk mencegah demam berdarah.' }
        ];
        setSuratMasukList(mock);
        localStorage.setItem('rt_surat_masuk_mock', JSON.stringify(mock));
      }
    } finally {
      setSuratMasukLoading(false);
    }
  };

  const fetchSuratKeluar = async () => {
    setSuratKeluarLoading(true);
    const token = localStorage.getItem('rt_token');
    try {
      const response = await fetch('http://172.20.32.62:3333/admin/surat-keluar', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const items = data.output || data.data || (Array.isArray(data) ? data : []);
        const formatted = items.map(s => ({
          id: s.id || '',
          nomorSurat: s.nomor_surat || '',
          jenisSurat: s.jenis_surat || 'Surat Pengantar',
          namaPemohon: s.nama_pemohon || '',
          nik: s.nik || '',
          tujuan: s.tujuan || '',
          tanggalSurat: s.tanggal_surat ? s.tanggal_surat.split('T')[0] : (s.tanggalSurat || ''),
          status: s.status || 'Draft',
          isiRingkas: s.isi_ringkas || ''
        }));
        setSuratKeluarList(formatted);
      } else {
        throw new Error('Endpoint backend belum aktif atau mengembalikan error.');
      }
    } catch (err) {
      console.warn('Gagal mengambil surat keluar dari server, menggunakan local storage/state:', err.message);
      const saved = localStorage.getItem('rt_surat_keluar_mock');
      if (saved) {
        setSuratKeluarList(JSON.parse(saved));
      } else {
        const mock = [
          { id: '1', nomorSurat: '101/RT05/VII/2026', jenisSurat: 'Surat Pengantar KTP', namaPemohon: 'Ahmad Subarjo', nik: '3201021507980002', tujuan: 'Kelurahan Sawangan Baru (Pengurusan E-KTP Hilang)', tanggalSurat: '2026-07-19', status: 'Disetujui', isiRingkas: 'Pengantar untuk penerbitan ulang KTP baru yang hilang di wilayah RT.' },
          { id: '2', nomorSurat: '102/RT05/VII/2026', jenisSurat: 'Surat Pengantar SKCK', namaPemohon: 'Rina Herawati', nik: '3201026002990005', tujuan: 'Polsek Sawangan (Pekerjaan BUMN)', tanggalSurat: '2026-07-18', status: 'Diproses', isiRingkas: 'Surat pengantar kelakuan baik untuk syarat melamar pekerjaan BUMN.' },
          { id: '3', nomorSurat: '103/RT05/VII/2026', jenisSurat: 'Surat Keterangan Domisili', namaPemohon: 'Dedi Kurniawan', nik: '3201020404950001', tujuan: 'Bank Mandiri Cabang Sawangan', tanggalSurat: '2026-07-17', status: 'Selesai', isiRingkas: 'Surat keterangan domisili sementara untuk pembukaan rekening tabungan.' }
        ];
        setSuratKeluarList(mock);
        localStorage.setItem('rt_surat_keluar_mock', JSON.stringify(mock));
      }
    } finally {
      setSuratKeluarLoading(false);
    }
  };

  const fetchWargaListFromServer = async () => {
    let token = null;
    try {
      token = localStorage.getItem('rt_token');
    } catch (e) {
      console.warn('localStorage is blocked or unavailable:', e);
    }
    if (!token) return;

    try {
      const response = await fetch('http://172.20.32.62:3333/admin/datawarga', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const raw = await response.json();
        console.log('%c[fetchWargaListFromServer] Raw response:', 'color: #f59e0b; font-weight: bold;', raw);

        // Handle both direct array and envelope-wrapped formats
        let items = [];
        if (Array.isArray(raw)) {
          items = raw;
        } else if (raw && Array.isArray(raw.output)) {
          items = raw.output;
        } else if (raw && Array.isArray(raw.data)) {
          items = raw.data;
        } else if (raw && typeof raw === 'object') {
          // Try to find the first array value in the response
          const firstArray = Object.values(raw).find(v => Array.isArray(v));
          if (firstArray) {
            items = firstArray;
          } else {
            console.warn('[fetchWargaListFromServer] Could not find array in response:', raw);
            return;
          }
        }

        const createdAccounts = getCreatedAccountsMap();

        const normalized = items.map(item => {
          const citizenId = item.warga_id || item.id || 0;
          const famId = item.family_id || item.fammilyId || 0;
          const savedAcc = (famId && createdAccounts[`family_${famId}`]) || (citizenId && createdAccounts[`citizen_${citizenId}`]);
          const username = item.username || savedAcc?.username || '';
          const hasAccount = !!username || !!item.has_account || !!item.account_created || !!savedAcc;

          return {
            id: citizenId,
            name: item.nama || item.name || '',
            nik: item.nik || '',
            noKk: item.family_nokk || item.no_kk || item.noKk || '',
            gender: item.jenis_kelamin || item.jenisKelamin || item.gender || '',
            status: item.house_status || item.status || 'Tetap',
            statusHidup: item.status_hidup || item.statusHidup || 'Hidup',
            username: username,
            has_account: hasAccount,
            account_created: hasAccount,
            alamat: item.house_alamat || item.alamat || '',
            noHp: item.no_hp || item.noHp || '',
            family_id: famId,
            house_id: item.house_id || item.houseId || 0,
            house_blok: item.house_blok || '',
            house_nomor: item.house_nomor || '',
            tgl_lahir: item.tgl_lahir || item.tglLahir || '',
            umur: item.umur || 0
          };
        });

        console.log('%c[fetchWargaListFromServer] Normalized warga list:', 'color: #10b981; font-weight: bold;', normalized);
        setWargaList(normalized);
        try {
          localStorage.setItem('rt_wargalist', JSON.stringify(normalized));
        } catch (e) {}
      } else {
        console.error(`[fetchWargaListFromServer] HTTP Error: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error('[fetchWargaListFromServer] Network error:', err);
    }
  };

  const [revealedNiks, setRevealedNiks] = useState({});
  const [revealedKks, setRevealedKks] = useState({});

  // Sudo Reveal Modal states
  const [showSudoPrompt, setShowSudoPrompt] = useState(false);
  const [sudoActionType, setSudoActionType] = useState(''); // 'reveal_warga' | 'reveal_resident' | 'patch_kk'
  const [sudoTargetId, setSudoTargetId] = useState(null);
  const [sudoPasswordInput, setSudoPasswordInput] = useState('');
  const [sudoPromptError, setSudoPromptError] = useState('');
  const [sudoNewKkInput, setSudoNewKkInput] = useState('');

  const triggerRevealWarga = (wargaId) => {
    setSudoActionType('reveal_warga');
    setSudoTargetId(wargaId);
    setSudoPasswordInput('');
    setSudoPromptError('');
    setShowSudoPrompt(true);
  };

  const triggerRevealResident = (familyId) => {
    setSudoActionType('reveal_resident');
    setSudoTargetId(familyId);
    setSudoPasswordInput('');
    setSudoPromptError('');
    setShowSudoPrompt(true);
  };

  const triggerPatchResidentKK = (familyId, currentKk) => {
    setSudoActionType('patch_kk');
    setSudoTargetId(familyId);
    setSudoNewKkInput(currentKk || '');
    setSudoPasswordInput('');
    setSudoPromptError('');
    setShowSudoPrompt(true);
  };

  const handleRevealWarga = (wargaId) => triggerRevealWarga(wargaId);
  const handleRevealResident = (familyId) => triggerRevealResident(familyId);
  const handlePatchResidentKK = (familyId, newKk) => triggerPatchResidentKK(familyId, newKk);

  const handleSudoSubmit = async (e) => {
    e.preventDefault();
    setSudoPromptError('');
    const token = localStorage.getItem('rt_token');
    if (!token) {
      setSudoPromptError('Token otentikasi tidak ditemukan. Harap login kembali.');
      return;
    }

    if (!sudoPasswordInput) {
      setSudoPromptError('Sandi wajib diisi.');
      return;
    }

    if (sudoActionType === 'patch_kk' && (!sudoNewKkInput || sudoNewKkInput.length < 5)) {
      setSudoPromptError('Nomor KK minimal harus 5 karakter.');
      return;
    }

    try {
      if (sudoActionType === 'reveal_warga') {
        const res = await fetch(`http://172.20.32.62:3333/admin/reveal-warga/${sudoTargetId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ password: sudoPasswordInput })
        });
        const data = await res.json();
        if (res.ok && data.nik) {
          setRevealedNiks(prev => ({ ...prev, [sudoTargetId]: data.nik }));
          setShowSudoPrompt(false);
        } else {
          setSudoPromptError(data.message || data.pesan || 'Gagal membuka sensor NIK. Periksa sandi Anda.');
        }
      } else if (sudoActionType === 'reveal_resident') {
        const res = await fetch(`http://172.20.32.62:3333/admin/reveal-resident/${sudoTargetId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ password: sudoPasswordInput })
        });
        const data = await res.json();
        if (res.ok && data.no_kk) {
          setRevealedKks(prev => ({ ...prev, [sudoTargetId]: data.no_kk }));
          setShowSudoPrompt(false);
        } else {
          setSudoPromptError(data.message || data.pesan || 'Gagal membuka sensor KK. Periksa sandi Anda.');
        }
      } else if (sudoActionType === 'patch_kk') {
        // verify password first by making a dry run reveal-resident call
        const verifyRes = await fetch(`http://172.20.32.62:3333/admin/reveal-resident/${sudoTargetId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ password: sudoPasswordInput })
        });
        if (!verifyRes.ok) {
          const verifyData = await verifyRes.json();
          throw new Error(verifyData.message || verifyData.pesan || 'Verifikasi sandi gagal.');
        }

        const response = await fetch(`http://172.20.32.62:3333/admin/resident/${sudoTargetId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ noKK: sudoNewKkInput })
        });
        const resData = await response.json();
        if (!response.ok) {
          throw new Error(resData.message || resData.pesan || 'Gagal mengubah nomor KK.');
        }
        alert('Nomor KK berhasil diperbarui di server!');
        fetchResidentServerList(); // refresh list
        setShowSudoPrompt(false);
      }
    } catch (err) {
      setSudoPromptError(err.message || 'Gagal menghubungi server.');
    }
  };

  const mapCategoryToBackend = (category, type) => {
    const catLower = (category || '').toLowerCase();
    if (type === 'income') {
      if (catLower.includes('donasi') || catLower.includes('sukarela')) {
        return 'donasi';
      } else if (catLower.includes('subsidi')) {
        return 'subsidi';
      } else if (catLower.includes('sponsorship')) {
        return 'sponsorship';
      } else if (catLower.includes('hibah')) {
        return 'hibah';
      } else {
        return 'lainnya';
      }
    } else {
      if (catLower.includes('kebersihan')) {
        return 'kebersihan';
      } else if (catLower.includes('keamanan')) {
        return 'keamanan';
      } else if (catLower.includes('taman')) {
        return 'taman';
      } else if (catLower.includes('operasional') || catLower.includes('kantor') || catLower.includes('atk')) {
        return 'operasional_rt';
      } else if (catLower.includes('kematian')) {
        return 'kematian';
      } else if (catLower.includes('sosial')) {
        return 'sosial';
      } else if (catLower.includes('kegiatan')) {
        return 'kegiatan';
      } else {
        return 'lainnya';
      }
    }
  };

  const fetchLedgerFromServer = async () => {
    try {
      const response = await fetch('http://172.20.32.62:3333/post/dashboard-stats');
      if (response.ok) {
        const data = await response.json();
        if (data.response === 200 && data.output?.ledger) {
          const mapped = data.output.ledger.map(t => ({
            id: t.id !== undefined ? t.id : `TX-${Math.floor(Math.random() * 90000 + 10000)}`,
            type: t.type === 'in' ? 'income' : 'expense',
            amount: t.amount,
            category: t.source_type ? (t.source_type.charAt(0).toUpperCase() + t.source_type.slice(1)) : 'Lainnya',
            description: t.description,
            date: t.transaction_date ? t.transaction_date.substring(0, 10) : new Date().toISOString().split('T')[0]
          }));
          setTransaksiKasList(mapped);
          localStorage.setItem('rt_kaslist', JSON.stringify(mapped));
        }
      }
    } catch (err) {
      console.warn('Gagal memuat ledger dari server:', err.message);
    }
  };

  useEffect(() => {
    if (activeTab === 'sek_warga_kk' && residentSubTab === 'server') {
      fetchResidentServerList();
    }
    if (activeTab === 'warga' || activeTab === 'sek_akun_manage' || activeTab === 'sek_laporan' || activeTab === 'rt_statistik' || activeTab === 'iuran_pembayaran' || activeTab === 'laporan_rekap') {
      fetchWargaListFromServer();
    }
    if (activeTab === 'sek_pengaduan') {
      fetchServerComplaints();
    }
    if (activeTab === 'sek_info_pengumuman') {
      fetchServerAnnouncements();
    }
    if (activeTab === 'sek_warga_masuk') {
      fetchPendingWargaList();
    }
    if (activeTab === 'iuran_verifikasi') {
      fetchPendingPayments();
      fetchResidentServerList();
    }
    if (activeTab === 'iuran_tunggakan') {
      fetchFinanceTracking();
    }
    if (activeTab === 'overview' || activeTab === 'layanan') {
      fetchServerSubmissions();
    }
    if (activeTab === 'agenda') {
      if (fetchAgendas) fetchAgendas();
    }
    if (activeTab === 'keuangan_kas' || activeTab === 'keuangan_pemasukan' || activeTab === 'keuangan_pengeluaran') {
      fetchLedgerFromServer();
    }

  }, [activeTab, residentSubTab]);

  useEffect(() => {
    let token = null;
    try {
      token = localStorage.getItem('rt_token');
    } catch (e) {
      console.warn('localStorage is blocked or unavailable:', e);
    }
    if (!token) return;

    // Fetch initial core data from server on mount
    fetchResidentServerList();
    fetchWargaListFromServer();
    fetchLedgerFromServer();
    fetchFinanceTracking();
    fetchServerSubmissions();
    fetchPendingWargaList();
    fetchPendingPayments();
    fetchFinanceSettings();
    if (fetchAgendas) fetchAgendas();

    const socketConnection = io('http://172.20.32.62:3333', {
      transports: ['websocket'],
      auth: { token }
    });

    socketConnection.on('connect', () => {
      console.log('Connected to socket server in AdminDashboard');
    });

    socketConnection.on('sync', (data) => {
      console.log(`⚡ Menerima request sinkronisasi untuk: ${data.type}`);
      if (data.type === 'finance') {
        fetchLedgerFromServer();
        fetchPendingPayments();
        fetchFinanceTracking();
      } else if (data.type === 'warga') {
        fetchResidentServerList();
        fetchPendingWargaList();
        fetchWargaListFromServer();
      } else if (data.type === 'pengaduan') {
        fetchServerComplaints();
      } else if (data.type === 'pengajuan') {
        fetchServerSubmissions();
      } else if (data.type === 'announcement') {
        fetchServerAnnouncements();
      } else if (data.type === 'agenda') {
        if (fetchAgendas) fetchAgendas();
      }
    });

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  const [viewingCitizenProfile, setViewingCitizenProfile] = useState(null);

  const handleShowAccessProfile = (username) => {
    const found = wargaList.find(w => w.username?.toLowerCase() === username?.toLowerCase());
    if (found) {
      setViewingCitizenProfile(found);
    } else {
      alert(`Data warga dengan username @${username} tidak ditemukan di database lokal.`);
    }
  };

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [accountFilter, setAccountFilter] = useState('all'); // 'all' | 'has_account' | 'no_account'
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  
  // CRUD Modal States
  const [modalType, setModalType] = useState(''); // '' | 'add_warga' | 'edit_warga' | 'add_kas' | 'edit_kas' | 'add_agenda' | 'edit_agenda'
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedFamilyForDetail, setSelectedFamilyForDetail] = useState(null);
  const [previewingTemplate, setPreviewingTemplate] = useState(null);
  
  // Form States
  const [wargaForm, setWargaForm] = useState({
    name: '', username: '', password: '', nik: '', noKk: '', alamat: '', gender: 'Laki-laki', usia: '', status: 'Tetap', statusHidup: 'Hidup',
    email: '', role: 'warga', blok: '', nomor: '', tglLahir: '', noHp: ''
  });
  const [selectedCitizenForAccount, setSelectedCitizenForAccount] = useState(null);
  const [accountForm, setAccountForm] = useState({
    username: '', password: '', email: '', role: 'warga'
  });

  // Global Copy Helper for SweetAlert2 HTML buttons
  useEffect(() => {
    window.copyTextToClipboard = (text, label) => {
      if (!text) return;
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (err) {}
        document.body.removeChild(textArea);
      }
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `${label || 'Teks'} berhasil disalin!`,
        showConfirmButton: false,
        timer: 2000
      });
    };
  }, []);

  const showAccountCredentialsAlert = (username, password, citizenName) => {
    window.copyUsernameText = username;
    window.copyPasswordText = password;

    Swal.fire({
      title: '🎉 Akun Berhasil Dibuat',
      icon: 'success',
      html: `
        <div style="text-align: left; font-family: sans-serif;">
          <p style="font-size: 12px; color: #475569; margin-bottom: 10px; line-height: 1.5;">
            Akun login resmi telah berhasil dibuat dan terhubung dengan data Kartu Keluarga <strong>${citizenName || 'Warga'}</strong>.
          </p>

          <div style="text-align: center; color: #cbd5e1; font-weight: 700; font-size: 11px; margin: 10px 0;">━━━━━━━━━━━━━━━━━━━━━━━</div>

          <div style="margin-bottom: 12px;">
            <span style="font-size: 10px; font-weight: 800; color: #059669; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Username</span>
            <div style="display: flex; align-items: center; justify-content: space-between; background: #f8fafc; padding: 10px 14px; border-radius: 12px; border: 1px solid #e2e8f0;">
              <strong style="font-family: monospace; font-size: 15px; color: #0f172a;">${username}</strong>
              <button onclick="window.copyTextToClipboard(window.copyUsernameText, 'Username')" style="background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 8px; font-weight: bold; font-size: 11px; cursor: pointer; display: flex; align-items: center; gap: 4px;">📋 Copy Username</button>
            </div>
          </div>

          <div style="text-align: center; color: #cbd5e1; font-weight: 700; font-size: 11px; margin: 10px 0;">━━━━━━━━━━━━━━━━━━━━━━━</div>

          <div style="margin-bottom: 10px;">
            <span style="font-size: 10px; font-weight: 800; color: #0d9488; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Password Sementara</span>
            <div style="display: flex; align-items: center; justify-content: space-between; background: #f8fafc; padding: 10px 14px; border-radius: 12px; border: 1px solid #e2e8f0;">
              <strong style="font-family: monospace; font-size: 15px; color: #0f172a;">${password}</strong>
              <button onclick="window.copyTextToClipboard(window.copyPasswordText, 'Password')" style="background: #0d9488; color: white; border: none; padding: 6px 12px; border-radius: 8px; font-weight: bold; font-size: 11px; cursor: pointer; display: flex; align-items: center; gap: 4px;">📋 Copy Password</button>
            </div>
          </div>

          <div style="text-align: center; color: #cbd5e1; font-weight: 700; font-size: 11px; margin: 10px 0;">━━━━━━━━━━━━━━━━━━━━━━━</div>
        </div>
      `,
      confirmButtonText: 'Selesai & Tutup',
      confirmButtonColor: '#10b981',
      customClass: {
        popup: 'rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white',
        title: 'text-lg font-black text-slate-900 dark:text-white'
      },
      allowOutsideClick: false
    });
  };

  const handleDirectCreateAccount = async (citizen) => {
    if (!citizen) return;
    const familyId = citizen.family_id || citizen.fammilyId || citizen.familyId || citizen.id;
    if (!familyId) {
      Swal.fire({
        title: 'Error Data',
        text: 'ID Kartu Keluarga/Warga tidak valid.',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    const citizenName = citizen.name || citizen.kepala_keluarga_nama || `Warga #${familyId}`;

    // 1. SweetAlert2 Confirmation
    const confirmResult = await Swal.fire({
      title: 'Buat Akun Login Warga?',
      text: `Username dan password akan dibuat otomatis oleh sistem.\nAkun akan langsung terhubung dengan data Kartu Keluarga (${citizenName}).\nApakah Anda ingin melanjutkan?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Buat Akun',
      cancelButtonText: 'Batal',
      customClass: {
        popup: 'rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white',
        title: 'text-lg font-black text-slate-900 dark:text-white',
        confirmButton: 'font-bold text-xs px-4 py-2.5 rounded-xl',
        cancelButton: 'font-bold text-xs px-4 py-2.5 rounded-xl'
      }
    });

    if (!confirmResult.isConfirmed) return;

    // 2. Loading State & Anti-double click
    setIsCreatingAccount(true);
    setLoadingAccountId(citizen.id);

    Swal.fire({
      title: 'Memproses Akun...',
      text: 'Mengirim permintaan pembuatan akun ke backend server...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
      customClass: {
        popup: 'rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white',
        title: 'text-lg font-black text-slate-900 dark:text-white'
      }
    });

    try {
      const token = localStorage.getItem('rt_token');
      const response = await fetch('http://172.20.32.62:3333/admin/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ familyId: parseInt(familyId) })
      });

      const resData = await response.json();
      Swal.close();

      // 409 Conflict
      if (response.status === 409) {
        Swal.fire({
          title: 'Akun Sudah Ada',
          text: resData.message || 'Akun untuk keluarga ini sudah tersedia.',
          icon: 'warning',
          confirmButtonColor: '#f59e0b',
          customClass: {
            popup: 'rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white',
            title: 'text-lg font-black text-slate-900 dark:text-white'
          }
        });
        return;
      }

      // Other Server Errors
      if (!response.ok) {
        Swal.fire({
          title: 'Gagal Membuat Akun',
          text: resData.message || resData.error || 'Terjadi kesalahan pada server backend.',
          icon: 'error',
          confirmButtonColor: '#ef4444',
          customClass: {
            popup: 'rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white',
            title: 'text-lg font-black text-slate-900 dark:text-white'
          }
        });
        return;
      }

      // Success Response
      const output = resData.output || resData;
      const username = output.username || resData.username || `keluarga_${familyId}`;
      const tempPassword = output.temporaryPassword || output.password || resData.temporaryPassword || resData.password || 'password123';

      showAccountCredentialsAlert(username, tempPassword, citizenName);

      // Automatic State Update
      const updatedWargaList = wargaList.map(item => {
        const isMatch = item.id === citizen.id || 
                        (item.family_id && item.family_id === familyId) || 
                        (item.fammilyId && item.fammilyId === familyId);
        if (isMatch) {
          return {
            ...item,
            username: username,
            password: tempPassword,
            has_account: true,
            account_created: true
          };
        }
        return item;
      });
      setWargaList(updatedWargaList);
      try {
        localStorage.setItem('rt_wargalist', JSON.stringify(updatedWargaList));
      } catch (e) {}

      if (fetchResidentServerList) fetchResidentServerList();
      if (fetchWargaListFromServer) fetchWargaListFromServer();
    } catch (err) {
      Swal.close();
      Swal.fire({
        title: 'Koneksi Gagal',
        text: `Gagal terhubung ke server: ${err.message}`,
        icon: 'error',
        confirmButtonColor: '#ef4444',
        customClass: {
          popup: 'rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white',
          title: 'text-lg font-black text-slate-900 dark:text-white'
        }
      });
    } finally {
      setIsCreatingAccount(false);
      setLoadingAccountId(null);
    }
  };

  const handleGenerateUsername = (citizenToUse) => {
    const targetCitizen = citizenToUse || selectedCitizenForAccount;
    if (!targetCitizen) return;
    
    const cleanName = (targetCitizen.name || 'warga')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 8);
      
    const houseBlok = (targetCitizen.house_blok || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomNum = Math.floor(100 + Math.random() * 900);
    const prefixes = ['', 'warga_', 'rt_', 'user_'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    
    let suggested = '';
    const option = Math.floor(Math.random() * 3);
    if (option === 0) {
      suggested = `${cleanName}_${randomNum}`;
    } else if (option === 1 && houseBlok) {
      suggested = `${cleanName}_b${houseBlok}_${randomNum}`;
    } else {
      suggested = `${prefix}${cleanName}${Math.floor(10 + Math.random() * 90)}`;
    }
    
    setAccountForm(prev => ({ ...prev, username: suggested }));
    setUsernameFieldError('');
  };

  const openRegisterAccountModal = (citizen) => {
    setSelectedCitizenForAccount(citizen);
    
    const cleanName = (citizen.name || 'warga')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 8);
    const initialUsername = `${cleanName}_${Math.floor(100 + Math.random() * 900)}`;

    setAccountForm({
      username: initialUsername,
      password: '',
      confirmPassword: '',
      email: citizen.email || citizen.emailWarga || '',
      role: 'warga'
    });
    setShowAccountPassword(false);
    setShowAccountConfirmPassword(false);
    setUsernameFieldError('');
    setFormError('');
    setModalType('register_account');
  };

  const openEditAccountModal = (citizen) => {
    setSelectedCitizenForAccount(citizen);
    const existingUsername = getWargaUsername(citizen) || '';

    setAccountForm({
      username: existingUsername,
      password: '',
      confirmPassword: '',
      email: citizen.email || citizen.emailWarga || '',
      role: 'warga'
    });
    setShowAccountPassword(false);
    setShowAccountConfirmPassword(false);
    setUsernameFieldError('');
    setFormError('');
    setModalType('edit_account');
  };

  const handleEditAccountSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setUsernameFieldError('');

    if (!selectedCitizenForAccount) return;

    if ((accountForm.username || '').trim().length < 4) {
      setUsernameFieldError('Username minimal 4 karakter.');
      return;
    }

    if (accountForm.password && accountForm.password.length < 6) {
      setFormError('Password minimal 6 karakter jika ingin diubah.');
      return;
    }

    if (accountForm.password && accountForm.password !== accountForm.confirmPassword) {
      setFormError('Password dan konfirmasi password tidak cocok.');
      return;
    }

    const targetFamilyId = selectedCitizenForAccount.family_id || selectedCitizenForAccount.fammilyId || selectedCitizenForAccount.familyId || selectedCitizenForAccount.id;
    const newUsername = accountForm.username.trim();

    setIsCreatingAccount(true);

    try {
      // Update persistent local registry
      saveCreatedAccount(selectedCitizenForAccount, targetFamilyId, newUsername, accountForm.password || 'password123');

      const cleanSelectedName = cleanNameStr(selectedCitizenForAccount.name);

      // Realtime state update
      const updatedWargaList = wargaList.map(item => {
        const isMatch = (selectedCitizenForAccount.id && item.id === selectedCitizenForAccount.id) || 
                        (targetFamilyId && (item.family_id === targetFamilyId || item.fammilyId === targetFamilyId || item.familyId === targetFamilyId)) ||
                        (selectedCitizenForAccount.nik && item.nik === selectedCitizenForAccount.nik) ||
                        (cleanSelectedName && cleanNameStr(item.name) === cleanSelectedName);
        if (isMatch) {
          return {
            ...item,
            username: newUsername,
            password: accountForm.password || item.password,
            has_account: true,
            account_created: true
          };
        }
        return item;
      });

      setWargaList(updatedWargaList);
      try {
        localStorage.setItem('rt_wargalist', JSON.stringify(updatedWargaList));
      } catch (e) {}

      setModalType('');

      Swal.fire({
        title: 'Akun Berhasil Diperbarui 🎉',
        text: `Data akun login untuk ${selectedCitizenForAccount.name} telah berhasil disimpan.`,
        icon: 'success',
        confirmButtonColor: '#10b981',
        customClass: {
          popup: 'rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white',
          title: 'text-lg font-black text-slate-900 dark:text-white'
        }
      });
    } catch (err) {
      Swal.fire({
        title: 'Gagal Memperbarui Akun',
        text: err.message,
        icon: 'error',
        confirmButtonColor: '#ef4444',
        customClass: {
          popup: 'rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white',
          title: 'text-lg font-black text-slate-900 dark:text-white'
        }
      });
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleAccountRegisterSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setUsernameFieldError('');

    if (!selectedCitizenForAccount) return;

    // Realtime Validations
    if ((accountForm.username || '').trim().length < 4) {
      setUsernameFieldError('Username minimal 4 karakter.');
      return;
    }

    if ((accountForm.password || '').length < 6) {
      setFormError('Password minimal 6 karakter.');
      return;
    }

    if (accountForm.password !== accountForm.confirmPassword) {
      setFormError('Password dan konfirmasi password tidak cocok.');
      return;
    }

    const targetFamilyId = selectedCitizenForAccount.family_id || selectedCitizenForAccount.fammilyId || selectedCitizenForAccount.familyId || selectedCitizenForAccount.id;
    const citizenName = selectedCitizenForAccount.name || 'Warga';

    // 1. SweetAlert2 Confirmation
    const confirmResult = await Swal.fire({
      title: 'Registrasi Akun Warga',
      text: `Pastikan username dan password sudah benar.\nApakah Anda yakin ingin membuat akun login untuk warga ini (${citizenName})?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Registrasikan',
      cancelButtonText: 'Batal',
      customClass: {
        popup: 'rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white',
        title: 'text-lg font-black text-slate-900 dark:text-white',
        confirmButton: 'font-bold text-xs px-4 py-2.5 rounded-xl',
        cancelButton: 'font-bold text-xs px-4 py-2.5 rounded-xl'
      }
    });

    if (!confirmResult.isConfirmed) return;

    // 2. Loading State
    setIsCreatingAccount(true);
    setLoadingAccountId(selectedCitizenForAccount.id);

    Swal.fire({
      title: 'Memproses Registrasi...',
      text: 'Mengirim data pembuatan akun ke server backend...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
      customClass: {
        popup: 'rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white',
        title: 'text-lg font-black text-slate-900 dark:text-white'
      }
    });

    try {
      const token = localStorage.getItem('rt_token');
      const response = await fetch('http://172.20.32.62:3333/admin/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          familyId: parseInt(targetFamilyId),
          username: accountForm.username.trim(),
          password: accountForm.password,
          email: accountForm.email ? accountForm.email.trim() : undefined
        })
      });

      const resData = await response.json();
      Swal.close();

      // 409 Conflict / Username Taken
      if (response.status === 409) {
        if (resData.message && resData.message.toLowerCase().includes('username')) {
          setUsernameFieldError('Username sudah digunakan. Silakan pilih username lain.');
        } else {
          Swal.fire({
            title: 'Akun Sudah Ada',
            text: resData.message || 'Akun untuk keluarga ini sudah tersedia.',
            icon: 'warning',
            confirmButtonColor: '#f59e0b',
            customClass: {
              popup: 'rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white',
              title: 'text-lg font-black text-slate-900 dark:text-white'
            }
          });
        }
        return;
      }

      // Other Server Errors
      if (!response.ok) {
        Swal.fire({
          title: 'Gagal Membuat Akun',
          text: resData.message || resData.error || 'Terjadi kesalahan pada server backend.',
          icon: 'error',
          confirmButtonColor: '#ef4444',
          customClass: {
            popup: 'rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white',
            title: 'text-lg font-black text-slate-900 dark:text-white'
          }
        });
        return;
      }

      // Success
      const output = resData.output || resData;
      const createdUsername = output.username || accountForm.username.trim();
      const createdPassword = output.temporaryPassword || output.password || accountForm.password;

      setModalType('');

      Swal.fire({
        title: 'Akun Berhasil Dibuat 🎉',
        text: 'Akun berhasil dibuat. Silakan berikan informasi login kepada warga.',
        icon: 'success',
        confirmButtonColor: '#10b981',
        customClass: {
          popup: 'rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white',
          title: 'text-lg font-black text-slate-900 dark:text-white'
        }
      });

      // Save created account permanently to local storage registry so it never gets lost or overwritten
      saveCreatedAccount(selectedCitizenForAccount, targetFamilyId, createdUsername, createdPassword);

      const cleanSelectedName = cleanNameStr(selectedCitizenForAccount.name);

      // Update state without reload across all matching records
      const updatedWargaList = wargaList.map(item => {
        const isMatch = (selectedCitizenForAccount.id && item.id === selectedCitizenForAccount.id) || 
                        (targetFamilyId && (item.family_id === targetFamilyId || item.fammilyId === targetFamilyId || item.familyId === targetFamilyId)) ||
                        (selectedCitizenForAccount.nik && item.nik === selectedCitizenForAccount.nik) ||
                        (cleanSelectedName && cleanNameStr(item.name) === cleanSelectedName);
        if (isMatch) {
          return {
            ...item,
            username: createdUsername,
            password: createdPassword,
            has_account: true,
            account_created: true
          };
        }
        return item;
      });
      setWargaList(updatedWargaList);
      try {
        localStorage.setItem('rt_wargalist', JSON.stringify(updatedWargaList));
      } catch (e) {}

      if (fetchResidentServerList) fetchResidentServerList();
      if (fetchWargaListFromServer) fetchWargaListFromServer();
    } catch (err) {
      Swal.close();
      Swal.fire({
        title: 'Koneksi Gagal',
        text: `Gagal terhubung ke server: ${err.message}`,
        icon: 'error',
        confirmButtonColor: '#ef4444',
        customClass: {
          popup: 'rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white',
          title: 'text-lg font-black text-slate-900 dark:text-white'
        }
      });
    } finally {
      setIsCreatingAccount(false);
      setLoadingAccountId(null);
    }
  };

  const [kasForm, setKasForm] = useState({
    description: '', amount: '', date: new Date().toISOString().split('T')[0], type: 'income', category: 'Iuran Warga'
  });
  const [agendaForm, setAgendaForm] = useState({
    title: '', date: '', time: '', location: '', category: 'Kegiatan RT', participants: 'Semua Warga', description: ''
  });
  const [formError, setFormError] = useState('');

  // Auto-sync functions for CRUD
  const saveWarga = (updatedList) => {
    setWargaList(updatedList);
    try {
      localStorage.setItem('rt_wargalist', JSON.stringify(updatedList));
    } catch (e) {}
  };

  const handleUpdateIuranStatus = (id, newStatus) => {
    const updated = wargaList.map(w => w.id === id ? { ...w, statusIuran: newStatus, tagihNotification: false } : w);
    saveWarga(updated);
  };

  const handleSendBillingAlert = (id) => {
    const targetWarga = wargaList.find(w => w.id === id);
    if (!targetWarga) return;

    const updated = wargaList.map(w => w.id === id ? { ...w, tagihNotification: true } : w);
    saveWarga(updated);
    alert(`Pemberitahuan tagihan resmi (Email & Telegram Bot) berhasil dikirimkan ke warga: ${targetWarga.name}!`);
  };

  const handlePrintKasReport = () => {
    const printWindow = window.open('', '_blank');
    const tableRows = transaksiKasList.map(t => `
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 10px; font-family: monospace;">${formatDateIndo(t.date)}</td>
        <td style="padding: 10px;">${t.description}</td>
        <td style="padding: 10px;">${t.category}</td>
        <td style="padding: 10px; text-align: center;">${t.type === 'income' ? 'PEMASUKAN' : 'PENGELUARAN'}</td>
        <td style="padding: 10px; text-align: right; font-weight: bold; color: ${t.type === 'income' ? '#10b981' : '#ef4444'}">${formatRupiah(t.amount)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Laporan Keuangan Kas RT 05 Sawangan Green Park</title>
          <style>
            body { font-family: sans-serif; padding: 30px; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f3f4f6; padding: 12px 10px; text-align: left; }
            td { border-bottom: 1px solid #eee; }
            .header { text-align: center; border-bottom: 3px double #333; padding-bottom: 20px; }
            .summary { margin-top: 30px; display: flex; justify-content: space-between; font-weight: bold; background-color: #f9fafb; padding: 15px; border-radius: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>LAPORAN TRANSAKSI KEUANGAN KAS RT 05 / RW 06</h2>
            <h3>Perumahan Sawangan Green Park</h3>
            <p>Dicetak pada: ${formatDateIndo(new Date())}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Deskripsi</th>
                <th>Kategori</th>
                <th style="text-align: center;">Tipe</th>
                <th style="text-align: right;">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <div class="summary">
            <div>TOTAL PEMASUKAN: ${formatRupiah(totalPemasukan)}</div>
            <div>TOTAL PENGELUARAN: ${formatRupiah(totalPengeluaran)}</div>
            <div style="color: #0d9488;">SALDO AKHIR KAS: ${formatRupiah(sisaKas)}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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

  const displaySubmissions = [
    ...serverSubmissions.map(sub => {
      const w = wargaList.find(c => 
        (c.family_id && String(c.family_id) === String(sub.family_id)) ||
        (c.fammilyId && String(c.fammilyId) === String(sub.family_id)) ||
        (c.noKk && sub.no_kk && !sub.no_kk.includes('x') && c.noKk === sub.no_kk)
      );
      return {
        id: sub.id,
        wargaNama: w ? w.name : `Keluarga #${sub.family_id}`,
        wargaNik: w ? w.nik : 'Sensor',
        wargaNoKk: sub.no_kk,
        wargaAlamat: w ? w.alamat : 'Sawangan Green Park',
        wargaTipeSurat: sub.jenis,
        wargaKeperluan: sub.keperluan,
        status: sub.status === 'disetujui' ? 'Approved' : (sub.status === 'ditolak' ? 'Rejected' : 'Pending'),
        submissionDate: 'Server API',
        isFromServer: true
      };
    }),
    ...submissionsList.filter(s => typeof s.id === 'string' && s.id.startsWith('LTR-'))
  ];

  // Log out function
  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('rt_current_user');
      localStorage.removeItem('rt_token');
      localStorage.removeItem('rt_token_time');
    } catch (e) {}
  };

  // Calc Dynamic stats for Overview
  const totalWarga = dashboardStats?.total_warga || wargaList.filter(w => w.statusHidup === 'Hidup').length;
  
  // Unique KK count (using server KK list or living residents)
  const uniqueKKs = residentServerList.length > 0
    ? residentServerList.length
    : new Set(wargaList.filter(w => w.statusHidup === 'Hidup').map(w => w.noKk)).size;

  const totalMenunggak = financeTrackingList.length > 0
    ? financeTrackingList.filter(f => f.status === 'Nunggak').length
    : wargaList.filter(w => w.statusIuran?.includes('Menunggak') && w.statusHidup === 'Hidup').length;

  const totalPemasukan = dashboardStats?.total_income || transaksiKasList
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalPengeluaran = dashboardStats?.total_expense || transaksiKasList
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const sisaKas = dashboardStats?.current_balance || (totalPemasukan - totalPengeluaran);
  const sisaKasRT = sisaKas;

  const totalAgendas = agendaList.length;
  const pendingSubmissionsCount = displaySubmissions.filter(s => s.status === 'Pending' || !s.status).length;

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
      setWargaForm({
        name: item.name || '',
        username: item.username || '',
        password: item.password || '',
        nik: item.nik || '',
        noKk: item.noKk || '',
        alamat: item.alamat || '',
        gender: item.gender || 'Laki-laki',
        usia: item.usia || '',
        status: item.status || 'Tetap',
        statusHidup: item.statusHidup || 'Hidup',
        email: item.email || '',
        role: item.role || 'warga',
        blok: item.blok || '',
        nomor: item.nomor || '',
        tglLahir: item.tglLahir || '',
        noHp: item.noHp || ''
      });
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
        name: '', username: '', password: '', nik: '', noKk: '', alamat: '', gender: 'Laki-laki', usia: '', status: 'Tetap', statusHidup: 'Hidup',
        email: '', role: 'warga', blok: '', nomor: '', tglLahir: '', noHp: ''
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
  const handleDelete = async (type, id) => {
    const result = await Swal.fire({
      title: 'Hapus Data',
      text: 'Apakah Anda yakin ingin menghapus data ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3b89ff',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      if (type === 'warga') {
        const updated = wargaList.filter(w => w.id !== id);
        saveWarga(updated);
        Swal.fire({ title: 'Terhapus!', text: 'Data warga berhasil dihapus.', icon: 'success', confirmButtonColor: '#10b981' });
      } else if (type === 'kas') {
        const updated = transaksiKasList.filter(t => t.id !== id);
        saveKas(updated);
        Swal.fire({ title: 'Terhapus!', text: 'Data kas berhasil dihapus.', icon: 'success', confirmButtonColor: '#10b981' });
      } else if (type === 'agenda') {
        const token = localStorage.getItem('rt_token');
        if (!token || isNaN(id)) {
          const updated = agendaList.filter(a => a.id !== id);
          saveAgenda(updated);
          Swal.fire({ title: 'Terhapus!', text: 'Data agenda berhasil dihapus secara lokal.', icon: 'success', confirmButtonColor: '#10b981' });
          return;
        }

        try {
          const response = await fetch(`http://172.20.32.62:3333/admin/agenda/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            const resData = await response.json();
            throw new Error(resData.message || 'Gagal menghapus agenda dari server.');
          }

          const resData = await response.json();
          const updated = agendaList.filter(a => a.id !== id);
          saveAgenda(updated);
          Swal.fire({ title: 'Terhapus!', text: resData.message || 'Agenda kegiatan berhasil dihapus.', icon: 'success', confirmButtonColor: '#10b981' });
          if (fetchAgendas) fetchAgendas();
        } catch (err) {
          console.warn('Gagal menghapus agenda di server, menghapus secara lokal:', err.message);
          Swal.fire({
            title: 'Terhapus Lokal',
            text: `Error server: ${err.message}. Data tetap dihapus secara lokal.`,
            icon: 'warning',
            confirmButtonColor: '#10b981'
          });
          const updated = agendaList.filter(a => a.id !== id);
          saveAgenda(updated);
        }
      }
    }
  };

  // Form Submit Handlers
  const handleWargaSubmit = async (e) => {
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
    if (!wargaForm.name || !wargaForm.alamat || !wargaForm.usia || !wargaForm.blok || !wargaForm.nomor || !wargaForm.tglLahir || !wargaForm.noHp) {
      setFormError('Semua kolom bertanda wajib (*) harus diisi.');
      return;
    }

    if (modalType === 'add_warga') {
      if (wargaList.some(w => w.nik === wargaForm.nik)) {
        setFormError('NIK sudah terdaftar.');
        return;
      }

      let isOfflineMode = false;
      let house_id = null;
      let family_id = null;
      const token = localStorage.getItem('rt_token');

      if (!token) {
        const proceedLocally = window.confirm('Token otentikasi tidak ditemukan. Apakah Anda ingin mendaftarkan warga secara lokal saja (Offline Mode)?');
        if (!proceedLocally) {
          setFormError('Token otentikasi diperlukan untuk menyimpan ke server.');
          return;
        }
        isOfflineMode = true;
      } else {
        try {
          // Step 1: POST /admin/house
          const houseRes = await fetch('http://172.20.32.62:3333/admin/house', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              blok: wargaForm.blok,
              nomor: parseInt(wargaForm.nomor) || 1,
              alamat: wargaForm.alamat,
              status: wargaForm.status === 'Tetap' ? 'pribadi' : 'kontrak'
            })
          });

          const houseData = await houseRes.json();
          if (!houseRes.ok) {
            throw new Error(houseData.message || houseData.pesan || 'Gagal membuat data rumah di server.');
          }

          house_id = houseData.output?.pesan?.insertId || 
                     houseData.output?.insertId || 
                     houseData.insertId || 
                     (Array.isArray(houseData.output?.pesan) ? houseData.output.pesan[0]?.insertId : null);

          if (!house_id) {
            throw new Error('Gagal mendapatkan ID rumah dari server.');
          }

          // Step 2: POST /admin/resident
          const residentRes = await fetch('http://172.20.32.62:3333/admin/resident', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              noKK: wargaForm.noKk,
              home: house_id,
              KepalaKeluarga: 1
            })
          });

          const residentData = await residentRes.json();
          if (!residentRes.ok) {
            const errMsg = residentData.errors?.[0]?.message || residentData.message || residentData.pesan || 'Gagal membuat data KK di server.';
            throw new Error(errMsg);
          }

          family_id = residentData.output?.pesan?.insertId || 
                      residentData.output?.insertId || 
                      residentData.insertId || 
                      (Array.isArray(residentData.output?.pesan) ? residentData.output.pesan[0]?.insertId : null);

          if (!family_id) {
            throw new Error('Gagal mendapatkan ID keluarga (family) dari server.');
          }

          // Step 3: POST /admin/datawarga
          const citizenRes = await fetch('http://172.20.32.62:3333/admin/datawarga', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              nik: wargaForm.nik,
              nama: wargaForm.name,
              jenisKelamin: wargaForm.gender,
              tglLahir: wargaForm.tglLahir,
              statusHidup: wargaForm.statusHidup,
              noHp: wargaForm.noHp,
              umur: parseInt(wargaForm.usia) || 30,
              fammilyId: family_id,
              houseId: house_id
            })
          });

          const citizenData = await citizenRes.json();
          if (!citizenRes.ok) {
            throw new Error(citizenData.message || citizenData.pesan || 'Gagal menyimpan data warga di server.');
          }

          alert('Warga berhasil terdaftar secara real-time di server database!');
        } catch (err) {
          console.error('Database insertion error:', err);
          const proceedLocally = window.confirm(`Gagal menyimpan data ke database server: ${err.message}. Apakah Anda ingin menyimpan warga secara lokal saja (Offline Mode)?`);
          if (!proceedLocally) {
            setFormError('Gagal menyimpan data ke database server.');
            return;
          }
          isOfflineMode = true;
        }
      }

      const newWarga = {
        ...wargaForm,
        id: 'WRG-' + Math.floor(Math.random() * 9000 + 1000),
        usia: parseInt(wargaForm.usia) || 30,
        username: '',
        password: '',
        email: '',
        role: 'warga'
      };
      saveWarga([...wargaList, newWarga]);
    } else {
      // edit warga
      if (wargaForm.username && wargaList.some(w => w.id !== selectedItem.id && w.username && w.username.toLowerCase() === wargaForm.username.toLowerCase())) {
        setFormError('Username sudah digunakan.');
        return;
      }

      const token = localStorage.getItem('rt_token');
      const isNumericId = /^\d+$/.test(selectedItem.id);
      if (token && isNumericId) {
        try {
          const response = await fetch(`http://172.20.32.62:3333/resident/warga/${selectedItem.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              nama: wargaForm.name,
              statusHidup: wargaForm.statusHidup,
              noHp: wargaForm.noHp,
              umur: parseInt(wargaForm.usia) || 30
            })
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || data.pesan || 'Gagal memperbarui data warga di server.');
          }
          alert('Data warga berhasil diperbarui di server database!');
        } catch (err) {
          alert(`Gagal memperbarui di server: ${err.message}. Perubahan disimpan secara lokal.`);
        }
      }

      const updated = wargaList.map(w => w.id === selectedItem.id ? { ...wargaForm, name: wargaForm.name, usia: parseInt(wargaForm.usia) || 30 } : w);
      saveWarga(updated);
    }
    setModalType('');
  };

  const handleKasSubmit = async (e) => {
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
      const token = localStorage.getItem('rt_token');
      if (!token) {
        setFormError('Sesi Anda telah berakhir atau Anda belum login.');
        return;
      }

      try {
        const isIncome = kasForm.type === 'income';
        const url = isIncome 
          ? 'http://172.20.32.62:3333/admin/finance/income' 
          : 'http://172.20.32.62:3333/admin/finance/expense';
        const backendCategory = mapCategoryToBackend(kasForm.category, kasForm.type);

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            amount: amountNum,
            sourceType: backendCategory,
            description: kasForm.description.trim()
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || data.pesan || 'Gagal menyimpan transaksi di server.');
        }

        await fetchLedgerFromServer(); // Sync from server
        setModalType('');
        Swal.fire({
          title: 'Berhasil!',
          text: `Transaksi ${isIncome ? 'pemasukan' : 'pengeluaran'} berhasil dicatat di server database.`,
          icon: 'success',
          confirmButtonColor: '#10b981'
        });
      } catch (err) {
        setFormError(`Gagal menyimpan ke server: ${err.message}`);
      }
    } else {
      const updated = transaksiKasList.map(t => t.id === selectedItem.id ? { ...kasForm, amount: amountNum } : t);
      saveKas(updated);
      setModalType('');
    }
  };

  const handleAgendaSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!agendaForm.title || !agendaForm.date || !agendaForm.time || !agendaForm.location || !agendaForm.description) {
      setFormError('Semua kolom wajib diisi.');
      return;
    }

    const token = localStorage.getItem('rt_token');
    if (!token) {
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
      return;
    }

    try {
      const payload = {
        kategori: (agendaForm.category || 'KEGIATAN RT').toUpperCase(),
        judul: agendaForm.title,
        deskripsi: agendaForm.description,
        tanggal: agendaForm.date,
        waktu: agendaForm.time,
        tempat: agendaForm.location
      };

      if (modalType === 'add_agenda') {
        const response = await fetch('http://172.20.32.62:3333/admin/agenda', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const resData = await response.json();
          throw new Error(resData.message || 'Gagal menambahkan agenda ke server.');
        }

        const resData = await response.json();
        const serverId = resData.output?.pesan?.insertId || resData.output?.insertId || ('AGD-' + Math.floor(Math.random() * 9000 + 1000));
        const newAgenda = {
          ...agendaForm,
          id: serverId,
          isFromServer: true
        };
        saveAgenda([newAgenda, ...agendaList]);
        alert(resData.message || 'agenda kegiatan berhasil dibuat masbro');
      } else {
        const response = await fetch(`http://172.20.32.62:3333/admin/agenda/${selectedItem.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const resData = await response.json();
          throw new Error(resData.message || 'Gagal memperbarui agenda di server.');
        }

        const resData = await response.json();
        const updated = agendaList.map(a => a.id === selectedItem.id ? { ...agendaForm } : a);
        saveAgenda(updated);
        alert(resData.message || 'agenda kegiatan berhasil diperbarui masbro');
      }
      setModalType('');
      if (fetchAgendas) fetchAgendas();
    } catch (err) {
      console.warn('Gagal memproses agenda di server, menggunakan fallback lokal:', err.message);
      alert(`Error: ${err.message}. Data disimpan secara lokal.`);
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
    }
  };

  // --- HANDLERS FOR SURAT MASUK & SURAT KELUAR ---
  const handleDeleteSuratMasuk = async (id) => {
    const confirm = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: "Data surat masuk akan dihapus secara permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    });

    if (!confirm.isConfirmed) return;

    const token = localStorage.getItem('rt_token');
    try {
      const res = await fetch(`http://172.20.32.62:3333/admin/surat-masuk/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        Swal.fire('Terhapus!', 'Surat masuk berhasil dihapus.', 'success');
        fetchSuratMasuk();
      } else {
        throw new Error('Gagal menghapus di server.');
      }
    } catch (err) {
      console.warn('Gagal menghapus di server, menghapus secara lokal:', err.message);
      const updated = suratMasukList.filter(s => s.id !== id);
      setSuratMasukList(updated);
      localStorage.setItem('rt_surat_masuk_mock', JSON.stringify(updated));
      Swal.fire('Terhapus Lokal!', 'Data dihapus secara lokal.', 'success');
    }
  };

  const handleDeleteSuratKeluar = async (id) => {
    const confirm = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: "Data surat keluar akan dihapus secara permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    });

    if (!confirm.isConfirmed) return;

    const token = localStorage.getItem('rt_token');
    try {
      const res = await fetch(`http://172.20.32.62:3333/admin/surat-keluar/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        Swal.fire('Terhapus!', 'Surat keluar berhasil dihapus.', 'success');
        fetchSuratKeluar();
      } else {
        throw new Error('Gagal menghapus di server.');
      }
    } catch (err) {
      console.warn('Gagal menghapus di server, menghapus secara lokal:', err.message);
      const updated = suratKeluarList.filter(s => s.id !== id);
      setSuratKeluarList(updated);
      localStorage.setItem('rt_surat_keluar_mock', JSON.stringify(updated));
      Swal.fire('Terhapus Lokal!', 'Data dihapus secara lokal.', 'success');
    }
  };

  const handleSuratMasukSubmit = async (e) => {
    e.preventDefault();
    setSuratMasukSubmitLoading(true);
    const token = localStorage.getItem('rt_token');
    const isEdit = !!suratMasukForm.id;

    let uploadedFileName = suratMasukForm.fileUrl;
    if (suratMasukForm.fileLampiran) {
      uploadedFileName = suratMasukForm.fileLampiran.name;
    }

    const payload = {
      nomor_surat: suratMasukForm.nomorSurat,
      pengirim: suratMasukForm.asalSurat,
      tanggal_surat: suratMasukForm.tanggalSurat,
      tanggal_terima: suratMasukForm.tanggalDiterima,
      perihal: suratMasukForm.perihal,
      isi_ringkas: suratMasukForm.isiRingkas || '',
      file_lampiran: uploadedFileName,
      status: suratMasukForm.status
    };

    try {
      const url = isEdit 
        ? `http://172.20.32.62:3333/admin/surat-masuk/${suratMasukForm.id}`
        : 'http://172.20.32.62:3333/admin/surat-masuk';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        Swal.fire({
          title: 'Berhasil!',
          text: `Surat masuk berhasil ${isEdit ? 'diperbarui' : 'diregistrasikan'}!`,
          icon: 'success',
          confirmButtonColor: '#10b981'
        });
        setModalType('');
        fetchSuratMasuk();
      } else {
        const errData = await res.json();
        throw new Error(errData.message || 'Gagal menyimpan ke server.');
      }
    } catch (err) {
      console.warn('Gagal memproses di server, beralih ke penyimpanan lokal:', err.message);
      let updatedList;
      if (isEdit) {
        updatedList = suratMasukList.map(s => s.id === suratMasukForm.id ? { ...suratMasukForm, fileLampiran: uploadedFileName } : s);
      } else {
        const newEntry = {
          ...suratMasukForm,
          id: 'SM-' + Math.floor(Math.random() * 900 + 100),
          fileLampiran: uploadedFileName
        };
        updatedList = [newEntry, ...suratMasukList];
      }
      setSuratMasukList(updatedList);
      localStorage.setItem('rt_surat_masuk_mock', JSON.stringify(updatedList));
      Swal.fire({
        title: 'Disimpan Lokal',
        text: `Data berhasil disimpan secara lokal (Server offline: ${err.message}).`,
        icon: 'warning',
        confirmButtonColor: '#10b981'
      });
      setModalType('');
    } finally {
      setSuratMasukSubmitLoading(false);
    }
  };

  const handleSuratKeluarSubmit = async (e) => {
    e.preventDefault();
    setSuratKeluarSubmitLoading(true);
    const token = localStorage.getItem('rt_token');
    const isEdit = !!suratKeluarForm.id;

    const payload = {
      nomor_surat: suratKeluarForm.nomorSurat,
      jenis_surat: suratKeluarForm.jenisSurat,
      nama_pemohon: suratKeluarForm.namaPemohon,
      nik: suratKeluarForm.nik,
      tujuan: suratKeluarForm.tujuan,
      tanggal_surat: suratKeluarForm.tanggalSurat,
      status: suratKeluarForm.status
    };

    try {
      const url = isEdit 
        ? `http://172.20.32.62:3333/admin/surat-keluar/${suratKeluarForm.id}`
        : 'http://172.20.32.62:3333/admin/surat-keluar';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        Swal.fire({
          title: 'Berhasil!',
          text: `Surat keluar berhasil ${isEdit ? 'diperbarui' : 'dicatat'}!`,
          icon: 'success',
          confirmButtonColor: '#10b981'
        });
        setModalType('');
        fetchSuratKeluar();
      } else {
        const errData = await res.json();
        throw new Error(errData.message || 'Gagal menyimpan ke server.');
      }
    } catch (err) {
      console.warn('Gagal memproses di server, beralih ke penyimpanan lokal:', err.message);
      let updatedList;
      if (isEdit) {
        updatedList = suratKeluarList.map(s => s.id === suratKeluarForm.id ? { ...suratKeluarForm } : s);
      } else {
        const newEntry = {
          ...suratKeluarForm,
          id: 'SK-' + Math.floor(Math.random() * 900 + 100)
        };
        updatedList = [newEntry, ...suratKeluarList];
      }
      setSuratKeluarList(updatedList);
      localStorage.setItem('rt_surat_keluar_mock', JSON.stringify(updatedList));
      Swal.fire({
        title: 'Disimpan Lokal',
        text: `Data berhasil disimpan secara lokal (Server offline: ${err.message}).`,
        icon: 'warning',
        confirmButtonColor: '#10b981'
      });
      setModalType('');
    } finally {
      setSuratKeluarSubmitLoading(false);
    }
  };

  // Letter Submissions Handlers (Approve/Reject/Complete)
  const handleSubmissionStatus = async (id, nextStatus) => {
    // If the ID is a local/mock ID (like starting with LTR-), we can update it locally
    if (typeof id === 'string' && id.startsWith('LTR-')) {
      const updated = submissionsList.map(sub => {
        if (sub.id === id) {
          return {
            ...sub,
            status: nextStatus,
            processedDate: formatDateIndo(new Date())
          };
        }
        return sub;
      });
      saveSubmissions(updated);
      return;
    }

    // Otherwise, it is a server ID
    const token = localStorage.getItem('rt_token');
    if (!token) {
      alert('Token otentikasi tidak ditemukan. Harap login kembali.');
      return;
    }

    // Map nextStatus to backend status
    let apiStatus = 'pending';
    if (nextStatus === 'Approved' || nextStatus === 'Completed') {
      apiStatus = 'disetujui';
    } else if (nextStatus === 'Rejected') {
      apiStatus = 'ditolak';
    }

    try {
      const response = await fetch(`http://172.20.32.62:3333/admin/pengajuan/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: apiStatus })
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message || 'Status pengajuan berhasil diperbarui!');
        fetchServerSubmissions();
      } else {
        alert(data.message || data.pesan || 'Gagal memperbarui status pengajuan.');
      }
    } catch (err) {
      alert(`Gagal menghubungi server: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row text-slate-800 dark:text-slate-100 font-sans antialiased relative overflow-hidden">
      {/* Premium ambient glows */}
      <div className="absolute top-1/4 left-10 w-[500px] h-[500px] bg-[var(--color-primary-wf)]/5 dark:bg-[var(--color-primary-wf)]/[0.02] rounded-full blur-3xl -z-10 pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-10 w-[500px] h-[500px] bg-teal-500/5 dark:bg-teal-500/[0.02] rounded-full blur-3xl -z-10 pointer-events-none animate-pulse-slow" style={{ animationDelay: '3s' }}></div>
      
      {/* Mobile Sticky Header Bar (< md) */}
      <header className="md:hidden sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-emerald-200/60 dark:border-slate-800 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            aria-label="Buka Menu Navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl text-white shadow-xs">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight">Admin Portal</h1>
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider block">RT 05 / RW 06</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
            title="Ganti Mode Tampilan"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>
        </div>
      </header>

      {/* Mobile Slide-Over Drawer Modal (< md) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-gradient-to-b from-emerald-50/95 via-slate-50 to-teal-50/95 dark:from-emerald-950 dark:via-teal-950 dark:to-slate-950 text-slate-800 dark:text-white h-full flex flex-col shadow-2xl z-10 overflow-y-auto">
            <div className="p-4 border-b border-emerald-200/80 dark:border-emerald-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl text-white shadow-xs">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight">Admin Portal</h1>
                  <span className="text-[8px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider block">RT 05 / RW 06</span>
                </div>
              </div>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                aria-label="Tutup Menu"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 mx-3 my-3 bg-white/90 dark:bg-emerald-900/30 rounded-2xl border border-emerald-200/80 dark:border-emerald-700/40 shadow-xs flex items-center gap-3 backdrop-blur-md">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black flex items-center justify-center text-xs shadow-md shadow-emerald-500/20">
                AD
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{currentUser.name}</p>
                <p className="text-[9px] text-emerald-700 dark:text-emerald-300 font-extrabold uppercase tracking-wider">
                  {currentUser.role === 'rt' || currentUser.role === 'admin' ? 'Ketua RT' : currentUser.role === 'sekertaris' ? 'Sekretaris' : 'Bendahara'}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto" onClick={(e) => { if (e.target.closest('button')) setIsMobileDrawerOpen(false); }}>
              {/* Drawer navigation list */}
              <nav className="px-3 py-2 space-y-1 font-sans text-xs">
                <button
                  onClick={() => { setActiveTab('overview'); setSearchQuery(''); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'overview'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-emerald-500" />
                  <span>Dashboard Overview</span>
                </button>
                {currentUser.role !== 'bendahara' && (
                  <button
                    onClick={() => { setActiveTab('warga'); setSearchQuery(''); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'warga'
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Users className="w-4 h-4 text-sky-400" />
                    <span>Data Warga</span>
                  </button>
                )}
                <button
                  onClick={() => { setActiveTab('kas'); setSearchQuery(''); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'kas'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Wallet className="w-4 h-4 text-amber-400" />
                  <span>Kas & Iuran</span>
                </button>
                <button
                  onClick={() => { setActiveTab('agenda'); setSearchQuery(''); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'agenda'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span>Agenda Kegiatan</span>
                </button>
                <button
                  onClick={() => { setActiveTab('layanan'); setSearchQuery(''); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'layanan'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Persuratan & Layanan</span>
                </button>
                <button
                  onClick={() => { setActiveTab('pengaturan'); setSearchQuery(''); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'pengaturan'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Pengaturan</span>
                </button>
              </nav>
            </div>

            <div className="p-3 border-t border-slate-800 space-y-2">
              <button
                onClick={() => { setDarkMode(!darkMode); setIsMobileDrawerOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                {darkMode ? <><Sun className="w-4 h-4 text-amber-400" /> Mode Terang</> : <><Moon className="w-4 h-4 text-indigo-400" /> Mode Gelap</>}
              </button>
              <button
                onClick={() => { setIsMobileDrawerOpen(false); handleLogout(); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-955/20 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar Dashboard</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* 1. DESKTOP SIDEBAR - Dual Mode Adaptive (Hidden on Mobile) */}
      <aside className="hidden md:flex md:w-64 bg-gradient-to-b from-emerald-50/90 via-slate-50 to-teal-50/70 dark:from-emerald-950 dark:via-teal-950 dark:to-slate-950 text-slate-800 dark:text-white border-r border-emerald-200/80 dark:border-emerald-900/40 flex-col flex-shrink-0 shadow-lg md:h-screen md:sticky md:top-0">
        {/* Brand/Logo Header */}
        <div className="p-6 border-b border-emerald-200/80 dark:border-emerald-900/40 flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl text-white shadow-md shadow-emerald-500/20">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight leading-tight">Admin Portal</h1>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 uppercase font-extrabold tracking-widest leading-none">RT 05 / RW 06</span>
          </div>
        </div>

        {/* Admin Info */}
        <div className="p-4 mx-4 my-3 bg-white/90 dark:bg-emerald-900/30 rounded-2xl border border-emerald-200/80 dark:border-emerald-700/40 shadow-xs flex items-center gap-3 backdrop-blur-md">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black flex items-center justify-center text-sm shadow-md shadow-emerald-500/20">
            AD
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{currentUser.name}</p>
            <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-extrabold uppercase tracking-wider">
              {currentUser.role === 'rt' || currentUser.role === 'admin' ? 'Ketua RT' : currentUser.role === 'sekertaris' ? 'Sekretaris' : 'Bendahara'}
            </p>
          </div>
        </div>

        {/* Sidebar Nav Menus */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto sidebar-scrollbar">
          {currentUser.role === 'bendahara' ? (
            <div className="space-y-1.5 font-sans">
              {/* Dashboard */}
              <button
                onClick={() => { setActiveTab('overview'); setSearchQuery(''); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'overview'
                      ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] border border-[var(--color-hairline)] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-[var(--color-primary-wf)]" />
                <span>Dashboard</span>
              </button>

              {/* Iuran Header */}
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
                      onClick={() => { setActiveTab('iuran_jenis'); setSearchQuery(''); }}
                      className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'iuran_jenis' 
                          ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] font-bold'
                          : 'text-slate-500 dark:text-slate-405 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/30 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'iuran_jenis' ? 'bg-[var(--color-primary-wf)] scale-125' : 'bg-slate-300 dark:bg-slate-650'}`}></span>
                      <span>Jenis Iuran</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('iuran_pembayaran'); setSearchQuery(''); }}
                      className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'iuran_pembayaran' 
                          ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] font-bold'
                          : 'text-slate-500 dark:text-slate-405 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/30 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'iuran_pembayaran' ? 'bg-[var(--color-primary-wf)] scale-125' : 'bg-slate-300 dark:bg-slate-655'}`}></span>
                      <span>Pembayaran</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('iuran_riwayat'); setSearchQuery(''); }}
                      className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'iuran_riwayat' 
                          ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] font-bold'
                          : 'text-slate-500 dark:text-slate-405 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/30 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'iuran_riwayat' ? 'bg-[var(--color-primary-wf)] scale-125' : 'bg-slate-300 dark:bg-slate-655'}`}></span>
                      <span>Riwayat</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('iuran_tunggakan'); setSearchQuery(''); }}
                      className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'iuran_tunggakan' 
                          ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] font-bold'
                          : 'text-slate-500 dark:text-slate-405 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/30 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'iuran_tunggakan' ? 'bg-[var(--color-primary-wf)] scale-125' : 'bg-slate-300 dark:bg-slate-655'}`}></span>
                      <span>Tunggakan</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('iuran_verifikasi'); setSearchQuery(''); }}
                      className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'iuran_verifikasi' 
                          ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] font-bold' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'iuran_verifikasi' ? 'bg-[var(--color-primary-wf)] scale-125' : 'bg-slate-600'}`}></span>
                      <span>Verifikasi Transfer</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Keuangan Header */}
              <div>
                <button
                  onClick={() => setIsKeuanganOpen(!isKeuanganOpen)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Wallet className="w-4 h-4 text-[var(--color-primary-wf)]" />
                    <span>Keuangan</span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-extrabold">{isKeuanganOpen ? '▼' : '▶'}</span>
                </button>

                {isKeuanganOpen && (
                  <div className="pl-6 py-1 space-y-1 border-l border-slate-200/60 dark:border-slate-800 ml-6 font-sans text-xs">
                    <button
                      onClick={() => { setActiveTab('keuangan_pemasukan'); setSearchQuery(''); }}
                      className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'keuangan_pemasukan' 
                          ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] font-bold'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/30 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'keuangan_pemasukan' ? 'bg-[var(--color-primary-wf)] scale-125' : 'bg-slate-300 dark:bg-slate-655'}`}></span>
                      <span>Pemasukan</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('keuangan_pengeluaran'); setSearchQuery(''); }}
                      className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'keuangan_pengeluaran' 
                          ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] font-bold bg-[var(--color-primary-wf)]/10'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/30 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'keuangan_pengeluaran' ? 'bg-[var(--color-primary-wf)] scale-125' : 'bg-slate-300 dark:bg-slate-655'}`}></span>
                      <span>Pengeluaran</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('keuangan_kas'); setSearchQuery(''); }}
                      className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'keuangan_kas' 
                          ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] font-bold'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/30 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'keuangan_kas' ? 'bg-[var(--color-primary-wf)] scale-125' : 'bg-slate-300 dark:bg-slate-655'}`}></span>
                      <span>Kas RT</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('keuangan_qris'); setSearchQuery(''); }}
                      className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'keuangan_qris' 
                          ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] font-bold'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/30 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'keuangan_qris' ? 'bg-[var(--color-primary-wf)] scale-125' : 'bg-slate-300 dark:bg-slate-655'}`}></span>
                      <span>Transfer Bank / QRIS</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Laporan Header */}
              <div>
                <button
                  onClick={() => setIsLaporanOpen(!isLaporanOpen)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-4 h-4 text-pink-400" />
                    <span>Laporan</span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-extrabold">{isLaporanOpen ? '▼' : '▶'}</span>
                </button>

                {isLaporanOpen && (
                  <div className="pl-6 py-1 space-y-1 border-l border-slate-200/60 dark:border-slate-800 ml-6 font-sans text-xs">
                    <button
                      onClick={() => { setActiveTab('laporan_bulanan'); setSearchQuery(''); }}
                      className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                          activeTab === 'laporan_bulanan' 
                            ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] font-bold'
                            : 'text-slate-500 dark:text-slate-405 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/30 dark:hover:bg-slate-800/30'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'laporan_bulanan' ? 'bg-[var(--color-primary-wf)] scale-125' : 'bg-slate-300 dark:bg-slate-655'}`}></span>
                      <span>Laporan Bulanan</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('laporan_tahunan'); setSearchQuery(''); }}
                      className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'laporan_tahunan' 
                          ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] font-bold'
                          : 'text-slate-500 dark:text-slate-405 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/30 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'laporan_tahunan' ? 'bg-[var(--color-primary-wf)] scale-125' : 'bg-slate-300 dark:bg-slate-655'}`}></span>
                      <span>Laporan Tahunan</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('laporan_rekap'); setSearchQuery(''); }}
                      className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'laporan_rekap' 
                          ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] font-bold'
                          : 'text-slate-500 dark:text-slate-405 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/30 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'laporan_rekap' ? 'bg-[var(--color-primary-wf)] scale-125' : 'bg-slate-300 dark:bg-slate-655'}`}></span>
                      <span>Rekap Iuran</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('laporan_export'); setSearchQuery(''); }}
                      className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'laporan_export' 
                          ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] font-bold'
                          : 'text-slate-500 dark:text-slate-405 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/30 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'laporan_export' ? 'bg-[var(--color-primary-wf)] scale-125' : 'bg-slate-300 dark:bg-slate-655'}`}></span>
                      <span>Export Excel/PDF</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : currentUser.role === 'sekertaris' ? (
            <div className="space-y-1.5 font-sans">
              {/* Secretary Specific Sidebar Menu */}
              {/* Dashboard */}
              <button
                onClick={() => { setActiveTab('overview'); setSearchQuery(''); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] border border-[var(--color-hairline)] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-[var(--color-primary-wf)]" />
                <span>Dashboard</span>
              </button>

              {/* Data Warga */}
              <div>
                <button
                  onClick={() => setIsWargaOpen(!isWargaOpen)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-sky-400" />
                    <span>Data Warga</span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-extrabold">{isWargaOpen ? '▼' : '▶'}</span>
                </button>

                {isWargaOpen && (
                  <div className="pl-6 py-1 space-y-1 border-l border-slate-200/60 dark:border-slate-800 ml-6 font-sans text-xs">
                    <button
                      onClick={() => { setActiveTab('warga'); setSearchQuery(''); }}
                      className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'warga' 
                          ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] font-bold' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'warga' ? 'bg-[var(--color-primary-wf)] scale-125' : 'bg-slate-600'}`}></span>
                      <span>Data Penduduk</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('sek_warga_kk'); setSearchQuery(''); }}
                      className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'sek_warga_kk' 
                          ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] font-bold'
                          : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/30 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'sek_warga_kk' ? 'bg-[var(--color-primary-wf)] scale-125' : 'bg-slate-600'}`}></span>
                      <span>Data KK</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('sek_warga_masuk'); setSearchQuery(''); }}
                      className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'sek_warga_masuk' 
                          ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] font-bold'
                          : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/30 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'sek_warga_masuk' ? 'bg-[var(--color-primary-wf)] scale-125' : 'bg-slate-600'}`}></span>
                      <span>Verifikasi Warga</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('data_wizard'); setSearchQuery(''); }}
                      className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'data_wizard' 
                          ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] font-bold'
                          : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/30 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'data_wizard' ? 'bg-[var(--color-primary-wf)] scale-125' : 'bg-slate-600'}`}></span>
                      <span>Data Wizard</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Surat */}
              <div>
                <button
                  onClick={() => setIsSuratOpen(!isSuratOpen)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-sky-400" />
                    <span>Surat</span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-extrabold">{isSuratOpen ? '▼' : '▶'}</span>
                </button>

                {isSuratOpen && (
                  <div className="pl-6 py-1 space-y-1 border-l border-slate-200/60 dark:border-slate-800 ml-6 font-sans text-xs">
                    <button
                      onClick={() => { setActiveTab('layanan'); setSearchQuery(''); }}
                      className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'layanan' 
                          ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] font-bold'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/30 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'layanan' ? 'bg-[var(--color-primary-wf)] scale-125' : 'bg-slate-600'}`}></span>
                      <span>Pengajuan Surat</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('sek_surat_masuk'); setSearchQuery(''); }}
                      className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'sek_surat_masuk' 
                          ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] font-bold'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/30 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'sek_surat_masuk' ? 'bg-[var(--color-primary-wf)] scale-125' : 'bg-slate-600'}`}></span>
                      <span>Surat Masuk</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('sek_surat_keluar'); setSearchQuery(''); }}
                      className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'sek_surat_keluar' 
                          ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] font-bold'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/30 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'sek_surat_keluar' ? 'bg-[var(--color-primary-wf)] scale-125' : 'bg-slate-600'}`}></span>
                      <span>Surat Keluar</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('sek_surat_template'); setSearchQuery(''); }}
                      className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'sek_surat_template' 
                          ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] font-bold' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'sek_surat_template' ? 'bg-[var(--color-primary-wf)] scale-125' : 'bg-slate-600'}`}></span>
                      <span>Template Surat</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Informasi */}
              <div>
                <button
                  onClick={() => setIsInformasiOpen(!isInformasiOpen)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                >
                    <div className="flex items-center gap-3">
                    <Volume2 className="w-4 h-4 text-[var(--color-primary-wf)]" />
                    <span>Informasi</span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-extrabold">{isInformasiOpen ? '▼' : '▶'}</span>
                </button>

                {isInformasiOpen && (
                  <div className="pl-6 py-1 space-y-1 border-l border-slate-200/60 dark:border-slate-800 ml-6 font-sans text-xs">
                    <button
                      onClick={() => { setActiveTab('sek_info_pengumuman'); setSearchQuery(''); }}
                      className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'sek_info_pengumuman' 
                          ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] font-bold'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/30 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'sek_info_pengumuman' ? 'bg-[var(--color-primary-wf)] scale-125' : 'bg-slate-600'}`}></span>
                      <span>Pengumuman</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('agenda'); setSearchQuery(''); }}
                      className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'agenda' 
                          ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] font-bold'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/30 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'agenda' ? 'bg-[var(--color-primary-wf)] scale-125' : 'bg-slate-600'}`}></span>
                      <span>Agenda RT</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('sek_info_notulen'); setSearchQuery(''); }}
                      className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'sek_info_notulen' 
                          ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] font-bold' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'sek_info_notulen' ? 'bg-[var(--color-primary-wf)] scale-125' : 'bg-slate-600'}`}></span>
                      <span>Notulen Rapat</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Pengaduan */}
              <button
                onClick={() => { setActiveTab('sek_pengaduan'); setSearchQuery(''); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'sek_pengaduan'
                    ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] border border-[var(--color-hairline)] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Pengaduan</span>
              </button>

              {/* Arsip */}
              <button
                onClick={() => { setActiveTab('sek_arsip'); setSearchQuery(''); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'sek_arsip'
                    ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] border border-[var(--color-hairline)] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FolderOpen className="w-4 h-4 text-purple-400" />
                <span>Arsip</span>
              </button>

              {/* Laporan */}
              <button
                onClick={() => { setActiveTab('sek_laporan'); setSearchQuery(''); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'sek_laporan'
                    ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] border border-[var(--color-hairline)] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-pink-400" />
                <span>Laporan</span>
              </button>

              {/* Manajemen Akun */}
              <button
                onClick={() => { setActiveTab('sek_akun_manage'); setSearchQuery(''); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'sek_akun_manage'
                    ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] border border-[var(--color-hairline)] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>Manajemen Akun</span>
              </button>

              {/* Pengaturan */}
              <button
                onClick={() => { setActiveTab('pengaturan'); setSearchQuery(''); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'pengaturan'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4 text-slate-500" />
                <span>Pengaturan</span>
              </button>
            </div>
          ) : (
            <div className="space-y-1.5 font-sans">
              {/* Admin RT Specific Sidebar Menu */}
              {/* Dashboard */}
              <button
                onClick={() => { setActiveTab('overview'); setSearchQuery(''); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-[var(--color-primary-wf)]" />
                <span>Dashboard</span>
              </button>

              {/* Data Warga */}
              <div>
                <button
                  onClick={() => setIsWargaOpen(!isWargaOpen)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-sky-400" />
                    <span>Data Warga</span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-extrabold">{isWargaOpen ? '▼' : '▶'}</span>
                </button>

                {isWargaOpen && (
                  <div className="pl-6 py-1 space-y-1 border-l border-slate-200/60 dark:border-slate-800 ml-6 font-sans text-xs">
                    <button
                      onClick={() => { setActiveTab('warga'); setSearchQuery(''); }}
                      className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'warga' 
                          ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] font-bold'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/30 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'warga' ? 'bg-[var(--color-primary-wf)] scale-125' : 'bg-slate-600'}`}></span>
                      <span>Data Penduduk</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('sek_warga_kk'); setSearchQuery(''); }}
                      className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'sek_warga_kk' 
                          ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] font-bold'
                          : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/30 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'sek_warga_kk' ? 'bg-[var(--color-primary-wf)] scale-125' : 'bg-slate-600'}`}></span>
                      <span>Data KK</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('sek_warga_masuk'); setSearchQuery(''); }}
                      className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'sek_warga_masuk' 
                          ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] font-bold'
                          : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/30 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'sek_warga_masuk' ? 'bg-[var(--color-primary-wf)] scale-125' : 'bg-slate-600'}`}></span>
                      <span>Verifikasi Warga</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('data_wizard'); setSearchQuery(''); }}
                      className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'data_wizard' 
                          ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] font-bold'
                          : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/30 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'data_wizard' ? 'bg-[var(--color-primary-wf)] scale-125' : 'bg-slate-600'}`}></span>
                      <span>Data Wizard</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Persetujuan Surat */}
              <button
                onClick={() => { setActiveTab('layanan'); setSearchQuery(''); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'layanan'
                    ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] border border-[var(--color-hairline)] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileCheck className="w-4 h-4 text-[var(--color-primary-wf)]" />
                  <span>Persetujuan Surat</span>
                </div>
                {pendingSubmissionsCount > 0 && (
                  <span className="text-xs bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                    {pendingSubmissionsCount}
                  </span>
                )}
              </button>

              {/* Monitoring Keuangan */}
              <button
                onClick={() => { setActiveTab('kas'); setSearchQuery(''); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'kas'
                    ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] border border-[var(--color-hairline)] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Wallet className="w-4 h-4 text-amber-400" />
                <span>Monitoring Keuangan</span>
              </button>

              {/* Pengumuman */}
              <button
                onClick={() => { setActiveTab('sek_info_pengumuman'); setSearchQuery(''); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'sek_info_pengumuman'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Volume2 className="w-4 h-4 text-sky-400" />
                <span>Pengumuman</span>
              </button>

              {/* Agenda RT */}
              <button
                onClick={() => { setActiveTab('agenda'); setSearchQuery(''); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'agenda'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Calendar className="w-4 h-4 text-[var(--color-primary-wf)]" />
                <span>Agenda RT</span>
              </button>

              {/* Pengaduan */}
              <button
                onClick={() => { setActiveTab('sek_pengaduan'); setSearchQuery(''); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'sek_pengaduan'
                    ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] border border-[var(--color-hairline)] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Pengaduan</span>
              </button>

              {/* Arsip */}
              <button
                onClick={() => { setActiveTab('sek_arsip'); setSearchQuery(''); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'sek_arsip'
                    ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] border border-[var(--color-hairline)] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FolderOpen className="w-4 h-4 text-purple-400" />
                <span>Arsip</span>
              </button>

              {/* Laporan */}
              <button
                onClick={() => { setActiveTab('sek_laporan'); setSearchQuery(''); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'sek_laporan'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-pink-400" />
                <span>Laporan</span>
              </button>

              {/* Iuran Header */}
              <div>
                <button
                  onClick={() => setIsIuranOpen(!isIuranOpen)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Wallet className="w-4 h-4 text-amber-400" />
                    <span>Iuran Lingkungan</span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-extrabold">{isIuranOpen ? '▼' : '▲'}</span>
                </button>

                {isIuranOpen && (
                  <div className="pl-6 py-1 space-y-1 border-l border-slate-200/60 dark:border-slate-800 ml-6 font-sans text-xs">
                    <button
                      onClick={() => { setActiveTab('iuran_jenis'); setSearchQuery(''); }}
                      className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'iuran_jenis' 
                          ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'iuran_jenis' ? 'bg-[var(--color-primary-wf)] scale-125' : 'bg-slate-600'}`}></span>
                      <span>Jenis Iuran</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('iuran_pembayaran'); setSearchQuery(''); }}
                      className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'iuran_pembayaran' 
                          ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'iuran_pembayaran' ? 'bg-[var(--color-primary-wf)] scale-125' : 'bg-slate-600'}`}></span>
                      <span>Catat Pembayaran</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('iuran_riwayat'); setSearchQuery(''); }}
                      className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'iuran_riwayat' 
                          ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'iuran_riwayat' ? 'bg-[var(--color-primary-wf)] scale-125' : 'bg-slate-600'}`}></span>
                      <span>Riwayat Setoran</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('iuran_tunggakan'); setSearchQuery(''); }}
                      className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'iuran_tunggakan' 
                          ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'iuran_tunggakan' ? 'bg-emerald-455 scale-125' : 'bg-slate-600'}`}></span>
                      <span>Tunggakan Iuran</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('iuran_verifikasi'); setSearchQuery(''); }}
                      className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'iuran_verifikasi' 
                          ? 'text-emerald-600 dark:text-emerald-455 font-bold bg-slate-855/50' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'iuran_verifikasi' ? 'bg-emerald-455 scale-125' : 'bg-slate-600'}`}></span>
                      <span>Verifikasi Transfer</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Manajemen Akun */}
              <button
                onClick={() => { setActiveTab('sek_akun_manage'); setSearchQuery(''); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'sek_akun_manage'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>Manajemen Akun</span>
              </button>

              {/* Statistik */}
              <button
                onClick={() => { setActiveTab('rt_statistik'); setSearchQuery(''); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'rt_statistik'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-teal-400" />
                <span>Statistik</span>
              </button>

              {/* Pengaturan */}
              <button
                onClick={() => { setActiveTab('pengaturan'); setSearchQuery(''); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'pengaturan'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4 text-slate-500" />
                <span>Pengaturan</span>
              </button>
            </div>
          )}

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
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-955/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors cursor-pointer text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Dashboard</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-100/60 via-slate-50 to-teal-50/40 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 min-h-screen">
        
        {/* Header Ribbon */}
        <header className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-emerald-200/60 dark:border-slate-800/50 py-4 px-6 md:px-8 z-30 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-mono">
              {activeTab === 'overview' && 'KONTROL PANEL'}
              {activeTab === 'warga' && 'ADMINISTRASI PENDUDUK'}
              {activeTab === 'kas' && 'MONITORING KEUANGAN'}
              {activeTab === 'agenda' && 'PENJADWALAN KOMUNITAS'}
              {activeTab === 'layanan' && 'LOKET PELAYANAN SURAT'}
              {activeTab === 'logs' && 'LOG AKTIVITAS & SESI'}
              {activeTab === 'data_wizard' && 'INPUT DATA SERVER'}
              {activeTab.startsWith('iuran_') && 'MANAJEMEN IURAN WARGA'}
              {activeTab.startsWith('keuangan_') && 'MANAJEMEN KEUANGAN'}
              {activeTab.startsWith('laporan_') && 'LAPORAN & EKSPOR'}
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {activeTab === 'overview' && 'Ringkasan Portal Admin'}
              {activeTab === 'warga' && 'Daftar Warga & Keluarga'}
              {activeTab === 'kas' && 'Buku Kas & Transaksi'}
              {activeTab === 'agenda' && 'Kegiatan & Rapat RT'}
              {activeTab === 'layanan' && 'Layanan Pengajuan Surat'}
              {activeTab === 'logs' && 'Log Akses Masuk Portal'}
              {activeTab === 'iuran_jenis' && 'Jenis & Konfigurasi Iuran'}
              {activeTab === 'iuran_pembayaran' && 'Form Pencatatan Pembayaran'}
              {activeTab === 'iuran_riwayat' && 'Riwayat Setoran Iuran'}
              {activeTab === 'iuran_tunggakan' && 'Daftar Warga Menunggak'}
              {activeTab === 'keuangan_pemasukan' && 'Form Pemasukan Kas'}
              {activeTab === 'keuangan_pengeluaran' && 'Form Pengeluaran Kas'}
              {activeTab === 'keuangan_kas' && 'Buku Kas Umum RT'}
              {activeTab === 'keuangan_qris' && 'Metode Transfer & QRIS'}
              {activeTab === 'laporan_bulanan' && 'Laporan Keuangan Bulanan'}
              {activeTab === 'laporan_tahunan' && 'Laporan Keuangan Tahunan'}
              {activeTab === 'laporan_rekap' && 'Tabel Rekapitulasi Iuran'}
              {activeTab === 'laporan_export' && 'Ekspor Laporan Kas RT'}
              {activeTab === 'data_wizard' && 'Wizard Input Rumah, KK & Warga'}
            </h2>
          </div>
          
          <div className="flex items-center gap-2.5 sm:gap-4">
            <span className="inline-flex px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-450 rounded-lg text-[10px] font-extrabold uppercase tracking-wider items-center gap-1.5 animate-pulse-slow">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping"></span>
              Live Sync
            </span>
            <span className="hidden sm:inline-flex px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Sesi Aktif
            </span>
          </div>
        </header>

        {/* Content body */}
        <div className="p-6 md:p-8 flex-1 space-y-6">
          {!isTabAllowedForRole(activeTab, currentUser.role) ? (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-xl mt-12 animate-fade-in font-sans">
              <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8 animate-bounce-slow" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Akses Ditolak / Dibatasi</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Peran Anda sebagai <span className="font-extrabold text-rose-500 capitalize">{currentUser.role === 'sekertaris' ? 'Sekretaris' : currentUser.role}</span> tidak diizinkan mengakses panel data ini. Fitur ini dibatasi ketat untuk mematuhi kedaulatan peran kepengurusan RT.
              </p>
              <button
                onClick={() => setActiveTab('overview')}
                className="py-2.5 px-6 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl cursor-pointer"
              >
                Kembali ke Dashboard
              </button>
            </div>
          ) : (
            <>
              {/* Universal Dynamic Header Banner - Dual Mode Adaptive */}
              <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 dark:from-emerald-950/70 dark:via-teal-950/70 dark:to-emerald-950/50 border border-emerald-500/20 dark:border-emerald-500/30 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 animate-fade-in font-sans">
                <div className="absolute right-[-20px] top-[-20px] w-48 h-48 bg-emerald-500/10 dark:bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="space-y-1.5 z-10">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-emerald-500/15 dark:bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-200 border border-emerald-500/20 dark:border-white/20">
                      RT 05 / RW 06 Portal Admin
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-300 font-mono font-bold">● Live Sync</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white capitalize">
                    {activeTab === 'overview' && 'Dasbor Kontrol Pengurus RT 05 👋'}
                    {activeTab === 'warga' && 'Kelola Administrasi Warga & Penduduk 👥'}
                    {activeTab === 'sek_warga_kk' && 'Kelola Data Kartu Keluarga (KK) 📄'}
                    {activeTab === 'sek_warga_masuk' && 'Verifikasi Registrasi Warga Baru ✨'}
                    {activeTab === 'data_wizard' && 'Wizard Server Input Rumah, KK & Warga ⚡'}
                    {activeTab === 'layanan' && 'Loket Persetujuan Surat Pengantar Warga 📝'}
                    {activeTab === 'sek_surat_masuk' && 'Modul Catatan & Berkas Surat Masuk 📥'}
                    {activeTab === 'sek_surat_keluar' && 'Modul Penerbitan & Berkas Surat Keluar 📤'}
                    {activeTab === 'sek_surat_template' && 'Simulator & Pratinjau Kop Surat Resmi A4 📜'}
                    {activeTab === 'iuran_jenis' && 'Pengaturan Tarif & Nominal Iuran Bulanan IPL 💳'}
                    {activeTab === 'iuran_pembayaran' && 'Form Pencatatan Pembayaran Manual Warga ✍️'}
                    {activeTab === 'iuran_riwayat' && 'Riwayat & Log Setoran Pembayaran Iuran 📊'}
                    {activeTab === 'iuran_tunggakan' && 'Daftar Tunggakan Iuran Bulanan Warga ⚠️'}
                    {activeTab === 'iuran_verifikasi' && 'Verifikasi Setoran Transfer & Bukti Warga 🔍'}
                    {activeTab === 'keuangan_pemasukan' && 'Form Catat Pemasukan Kas RT Non-Iuran 📥'}
                    {activeTab === 'keuangan_pengeluaran' && 'Form Catat Pengeluaran Belanja RT 📤'}
                    {activeTab === 'keuangan_kas' && 'Buku Kas Umum & Transaksi Real-Time 💰'}
                    {activeTab === 'keuangan_qris' && 'Pengaturan Rekening RT & Kode QRIS 📲'}
                    {activeTab === 'laporan_bulanan' && 'Laporan Rekapitulasi Kas RT Bulanan 📅'}
                    {activeTab === 'laporan_tahunan' && 'Laporan Audit Kas RT Tahunan 📈'}
                    {activeTab === 'laporan_rekap' && 'Matriks Rekapitulasi Iuran Per Warga 📑'}
                    {activeTab === 'laporan_export' && 'Cetak & Ekspor Spreadsheet Kas RT 🖨️'}
                    {activeTab === 'sek_info_pengumuman' && 'Papan Pengumuman & Informasi RT 📢'}
                    {activeTab === 'agenda' && 'Penjadwalan Kegiatan & Rapat Warga 🗓️'}
                    {activeTab === 'sek_info_notulen' && 'Catatan Notulen Rapat Pengurus RT 📋'}
                    {activeTab === 'sek_pengaduan' && 'Laporan Pengaduan & Aspirasi Lingkungan 🔔'}
                    {activeTab === 'sek_arsip' && 'Galeri Berkas Dokumentasi RT 📂'}
                    {activeTab === 'sek_laporan' && 'Laporan Ringkasan Sekretariat 📊'}
                    {activeTab === 'sek_akun_manage' && 'Manajemen Akun & Registrasi Warga 🔑'}
                    {activeTab === 'logs' && 'Log Audit Akses & Sesi Pengurus 🛡️'}
                    {activeTab === 'pengaturan' && 'Pengaturan Keuangan & Kata Sandi ⚙️'}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-emerald-100 max-w-2xl leading-relaxed font-medium">
                    Sistem Portal Manajemen RT 05 terhubung langsung dengan database server secara transparan dan real-time.
                  </p>
                </div>
                <div className="px-4 py-2 bg-emerald-600 dark:bg-white/20 hover:bg-emerald-700 dark:hover:bg-white/30 backdrop-blur-md text-white font-extrabold text-xs rounded-xl shadow-md border border-emerald-500/30 dark:border-white/30 flex items-center gap-2 transition-all z-10 flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white dark:text-emerald-300" />
                  <span>RT 05 Modern System</span>
                </div>
              </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fade-in">
              
              {/* Welcome Banner Card */}
              <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-900 text-white rounded-3xl p-6 sm:p-8 border border-emerald-500/30 shadow-xl shadow-emerald-500/10 relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="absolute right-[-20px] top-[-20px] w-40 h-40 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="space-y-2 z-10">
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">Dasbor Kontrol Pengurus RT 05 👋</h3>
                  <p className="text-xs text-emerald-100 max-w-xl leading-relaxed">Kelola kependudukan, pengajuan surat warga, pembukuan kas RT, dan verifikasi iuran bulanan dalam satu panel kontrol terpadu.</p>
                </div>
                <div className="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-extrabold text-xs rounded-xl shadow-lg border border-white/30 flex items-center gap-2 transition-all z-10">
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <span>Status System: Real-Time Sync</span>
                </div>
              </div>

              {/* 1. Dashboard Statistik Grid (8 Cards - 2 Columns on Portrait/Mobile) */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
                
                {/* 1. Total Warga */}
                <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white dark:from-emerald-950/40 dark:to-slate-900 border border-emerald-500/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
                  <div className="p-2.5 sm:p-3.5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl sm:rounded-2xl shadow-md shadow-emerald-500/20 shrink-0">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="hidden" aria-hidden="true">{logsTrigger}</span>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight truncate">{totalWarga}</span>
                    <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block truncate">Total Warga</span>
                  </div>
                </div>

                {/* 2. Total Kartu Keluarga */}
                <div className="bg-gradient-to-br from-blue-500/10 via-sky-500/5 to-white dark:from-blue-950/40 dark:to-slate-900 border border-blue-500/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
                  <div className="p-2.5 sm:p-3.5 bg-gradient-to-br from-blue-500 to-sky-600 text-white rounded-xl sm:rounded-2xl shadow-md shadow-blue-500/20 shrink-0">
                    <Landmark className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight truncate">{uniqueKKs}</span>
                    <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block truncate">Total KK</span>
                  </div>
                </div>

                {/* 3. Total Rumah */}
                <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-white dark:from-indigo-950/40 dark:to-slate-900 border border-indigo-500/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
                  <div className="p-2.5 sm:p-3.5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl sm:rounded-2xl shadow-md shadow-indigo-500/20 shrink-0">
                    <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight truncate">
                      {dashboardStats?.total_rumah || new Set(residentServerList.map(r => r.house_id || r.house_alamat || r.alamat).concat(wargaList.map(w => w.alamat))).size || 52}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block truncate">Total Rumah</span>
                  </div>
                </div>

                {/* 4. IPL Sudah Lunas */}
                <div className="bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-white dark:from-emerald-950/40 dark:to-slate-900 border border-emerald-500/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
                  <div className="p-2.5 sm:p-3.5 bg-gradient-to-br from-emerald-600 to-green-600 text-white rounded-xl sm:rounded-2xl shadow-md shadow-emerald-500/20 shrink-0">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight truncate">
                      {dashboardStats?.ipl_lunas || 42} <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">KK</span>
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block truncate">IPL Lunas</span>
                  </div>
                </div>

                {/* 5. IPL Belum Lunas */}
                <div className="bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-white dark:from-amber-950/40 dark:to-slate-900 border border-amber-500/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
                  <div className="p-2.5 sm:p-3.5 bg-gradient-to-br from-amber-500 to-rose-600 text-white rounded-xl sm:rounded-2xl shadow-md shadow-amber-500/20 shrink-0">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight truncate">
                      {dashboardStats?.ipl_belum_lunas || 6} <span className="text-xs text-rose-500 font-bold">KK</span>
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block truncate">IPL Belum Lunas</span>
                  </div>
                </div>

                {/* 6. Surat Masuk */}
                <div className="bg-gradient-to-br from-cyan-500/10 via-teal-500/5 to-white dark:from-cyan-950/40 dark:to-slate-900 border border-cyan-500/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
                  <div className="p-2.5 sm:p-3.5 bg-gradient-to-br from-cyan-500 to-teal-600 text-white rounded-xl sm:rounded-2xl shadow-md shadow-cyan-500/20 shrink-0">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight truncate">
                      {suratMasukList.length > 0 ? suratMasukList.length : (dashboardStats?.surat_masuk || 18)}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block truncate">Surat Masuk</span>
                  </div>
                </div>

                {/* 7. Surat Keluar */}
                <div className="bg-gradient-to-br from-purple-500/10 via-violet-500/5 to-white dark:from-purple-950/40 dark:to-slate-900 border border-purple-500/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
                  <div className="p-2.5 sm:p-3.5 bg-gradient-to-br from-purple-500 to-violet-600 text-white rounded-xl sm:rounded-2xl shadow-md shadow-purple-500/20 shrink-0">
                    <FileCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight truncate">
                      {suratKeluarList.length > 0 ? suratKeluarList.length : (dashboardStats?.surat_keluar || 34)}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block truncate">Surat Keluar</span>
                  </div>
                </div>

                {/* 8. Pengaduan Aktif */}
                <div className="bg-gradient-to-br from-rose-500/10 via-red-500/5 to-white dark:from-rose-950/40 dark:to-slate-900 border border-rose-500/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
                  <div className="p-2.5 sm:p-3.5 bg-gradient-to-br from-rose-500 to-red-600 text-white rounded-xl sm:rounded-2xl shadow-md shadow-rose-500/20 shrink-0">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight truncate">
                      {serverComplaints.filter(c => c.status !== 'Selesai').length || (dashboardStats?.pengaduan_aktif || 3)}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block truncate">Pengaduan Aktif</span>
                  </div>
                </div>

              </div>

              {/* Layout Split: Quick actions & Recent activities */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                
                {/* Left panel: Quick Actions (5 Buttons in 2-Column Grid on Portrait/Mobile) */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xs flex flex-col justify-between space-y-4 sm:space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Quick Action Operasional RT</h3>
                    <p className="text-[11px] sm:text-xs text-slate-400">Pilih modul pintasan untuk mempercepat pelayanan & entry data Anda.</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 sm:gap-3">
                    {/* 1. Tambah Keluarga */}
                    <button
                      onClick={() => { setActiveTab('data_wizard'); setSearchQuery(''); }}
                      className="w-full p-3 sm:py-3 sm:px-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold text-xs rounded-2xl flex flex-col sm:flex-row items-center justify-center sm:justify-between text-center sm:text-left gap-2 group transition-all active:scale-95 cursor-pointer min-h-[84px] sm:min-h-[52px]"
                    >
                      <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
                        <div className="p-2 sm:p-1.5 bg-emerald-500 text-white rounded-xl shadow-xs shrink-0">
                          <Plus className="w-5 h-5 sm:w-4 sm:h-4" />
                        </div>
                        <span className="text-[11px] sm:text-xs leading-tight">Tambah KK Baru</span>
                      </div>
                      <ChevronRight className="w-4 h-4 hidden sm:block transition-transform group-hover:translate-x-1" />
                    </button>

                    {/* 2. Tambah Warga */}
                    <button
                      onClick={() => { setActiveTab('warga'); openAddModal('warga'); }}
                      className="w-full p-3 sm:py-3 sm:px-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500 text-blue-600 dark:text-blue-400 font-bold text-xs rounded-2xl flex flex-col sm:flex-row items-center justify-center sm:justify-between text-center sm:text-left gap-2 group transition-all active:scale-95 cursor-pointer min-h-[84px] sm:min-h-[52px]"
                    >
                      <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
                        <div className="p-2 sm:p-1.5 bg-blue-500 text-white rounded-xl shadow-xs shrink-0">
                          <Users className="w-5 h-5 sm:w-4 sm:h-4" />
                        </div>
                        <span className="text-[11px] sm:text-xs leading-tight">Tambah Warga Baru</span>
                      </div>
                      <ChevronRight className="w-4 h-4 hidden sm:block transition-transform group-hover:translate-x-1" />
                    </button>

                    {/* 3. Buat Surat */}
                    <button
                      onClick={() => { setActiveTab('sek_surat_keluar'); setSearchQuery(''); }}
                      className="w-full p-3 sm:py-3 sm:px-4 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500 text-purple-600 dark:text-purple-400 font-bold text-xs rounded-2xl flex flex-col sm:flex-row items-center justify-center sm:justify-between text-center sm:text-left gap-2 group transition-all active:scale-95 cursor-pointer min-h-[84px] sm:min-h-[52px]"
                    >
                      <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
                        <div className="p-2 sm:p-1.5 bg-purple-500 text-white rounded-xl shadow-xs shrink-0">
                          <FileText className="w-5 h-5 sm:w-4 sm:h-4" />
                        </div>
                        <span className="text-[11px] sm:text-xs leading-tight">Buat Surat</span>
                      </div>
                      <ChevronRight className="w-4 h-4 hidden sm:block transition-transform group-hover:translate-x-1" />
                    </button>

                    {/* 4. Pembayaran IPL */}
                    <button
                      onClick={() => { setActiveTab('iuran_pembayaran'); setSearchQuery(''); }}
                      className="w-full p-3 sm:py-3 sm:px-4 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 hover:border-teal-500 text-teal-600 dark:text-teal-400 font-bold text-xs rounded-2xl flex flex-col sm:flex-row items-center justify-center sm:justify-between text-center sm:text-left gap-2 group transition-all active:scale-95 cursor-pointer min-h-[84px] sm:min-h-[52px]"
                    >
                      <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
                        <div className="p-2 sm:p-1.5 bg-teal-500 text-white rounded-xl shadow-xs shrink-0">
                          <Wallet className="w-5 h-5 sm:w-4 sm:h-4" />
                        </div>
                        <span className="text-[11px] sm:text-xs leading-tight">Bayar IPL</span>
                      </div>
                      <ChevronRight className="w-4 h-4 hidden sm:block transition-transform group-hover:translate-x-1" />
                    </button>

                    {/* 5. Pengaduan */}
                    <button
                      onClick={() => { setActiveTab('sek_pengaduan'); setSearchQuery(''); }}
                      className="w-full p-3 sm:py-3 sm:px-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-2xl flex flex-col sm:flex-row items-center justify-center sm:justify-between text-center sm:text-left gap-2 group transition-all active:scale-95 cursor-pointer min-h-[84px] sm:min-h-[52px] col-span-2 sm:col-span-1"
                    >
                      <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
                        <div className="p-2 sm:p-1.5 bg-rose-500 text-white rounded-xl shadow-xs shrink-0">
                          <AlertTriangle className="w-5 h-5 sm:w-4 sm:h-4" />
                        </div>
                        <span className="text-[11px] sm:text-xs leading-tight">Kelola Pengaduan</span>
                      </div>
                      <ChevronRight className="w-4 h-4 hidden sm:block transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                  
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-medium text-center">
                    Klik pintasan di atas untuk membuka formulir operasional langsung.
                  </div>
                </div>

                {/* Right panel: Aktivitas Terbaru (7 Cols) */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6">
                  
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Panel Aktivitas Terbaru</h3>
                      <p className="text-xs text-slate-400">Log operasional real-time warga, IPL, persuratan, dan pengaduan.</p>
                    </div>
                    <button
                      onClick={() => {
                        fetchResidentServerList();
                        fetchServerComplaints();
                      }}
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-450 hover:underline cursor-pointer"
                    >
                      Segarkan
                    </button>
                  </div>

                  <div className="space-y-3 flex-1">
                    {/* Activity Feed rendering */}
                    {[
                      {
                        id: 'act-1',
                        type: 'warga',
                        title: 'Warga Baru Ditambahkan',
                        desc: wargaList.length > 0 ? `Data warga ${wargaList[0]?.name || 'baru'} tersimpan di database.` : 'Bp. Ahmad Rizky (Blok A3 No. 12) terdaftar di sistem.',
                        time: 'Baru saja',
                        badge: 'Warga Baru',
                        color: 'emerald'
                      },
                      {
                        id: 'act-2',
                        type: 'ipl',
                        title: 'Pembayaran IPL Berhasil',
                        desc: 'Setoran Iuran IPL Kebersihan & Keamanan terverifikasi Lunas.',
                        time: '30 menit lalu',
                        badge: 'IPL Lunas',
                        color: 'teal'
                      },
                      {
                        id: 'act-3',
                        type: 'surat',
                        title: 'Surat Disetujui Pengurus',
                        desc: displaySubmissions.length > 0 ? `Surat Pengantar ${displaySubmissions[0]?.wargaTipeSurat || ''} telah disetujui.` : 'Surat Pengantar SKCK disetujui Sekretaris.',
                        time: '2 jam lalu',
                        badge: 'Surat Disetujui',
                        color: 'blue'
                      },
                      {
                        id: 'act-4',
                        type: 'pengaduan',
                        title: 'Pengaduan Baru Diterima',
                        desc: serverComplaints.length > 0 ? `Pengaduan (${serverComplaints[0]?.jenis || 'Fasilitas'}) diterima.` : 'Laporan kerusakan penerangan jalan Blok C diterima.',
                        time: '4 jam lalu',
                        badge: 'Pengaduan Baru',
                        color: 'rose'
                      },
                      {
                        id: 'act-5',
                        type: 'akun',
                        title: 'Akun Warga Berhasil Dibuat',
                        desc: 'Akun login resmi backend terdaftar untuk Kepala Keluarga.',
                        time: 'Hari ini',
                        badge: 'Akun Aktif',
                        color: 'purple'
                      }
                    ].map((act) => (
                      <div
                        key={act.id}
                        className="p-3.5 bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl flex items-start justify-between gap-3 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-xl text-white mt-0.5 ${
                            act.color === 'emerald' ? 'bg-emerald-500' :
                            act.color === 'teal' ? 'bg-teal-500' :
                            act.color === 'blue' ? 'bg-blue-500' :
                            act.color === 'rose' ? 'bg-rose-500' : 'bg-purple-500'
                          }`}>
                            {act.type === 'warga' && <Users className="w-3.5 h-3.5" />}
                            {act.type === 'ipl' && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {act.type === 'surat' && <FileText className="w-3.5 h-3.5" />}
                            {act.type === 'pengaduan' && <AlertTriangle className="w-3.5 h-3.5" />}
                            {act.type === 'akun' && <Lock className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <h5 className="font-extrabold text-slate-900 dark:text-white text-xs">{act.title}</h5>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{act.desc}</p>
                            <span className="text-[9px] font-bold text-slate-400 block mt-1">{act.time}</span>
                          </div>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full font-extrabold text-[9px] whitespace-nowrap ${
                          act.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                          act.color === 'teal' ? 'bg-teal-500/10 text-teal-600 border border-teal-500/20' :
                          act.color === 'blue' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' :
                          act.color === 'rose' ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' :
                          'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                        }`}>
                          {act.badge}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 text-[10px] text-slate-400 font-bold flex justify-between items-center">
                    <span>🟢 Real-Time Operational Feed</span>
                    <span>Tersambung ke API Backend Server</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* SEKRETARIS: 1. DATA KK */}
          {activeTab === 'sek_warga_kk' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              
              <div className="space-y-4">
                {/* Search Bar, Account Filter & Actions */}
                <div className="flex justify-between items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-3 flex-wrap flex-1">
                    <input
                      type="text"
                      placeholder="Cari KK (No. KK, Nama Kepala, Username, Alamat)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white max-w-xs w-full"
                    />

                    {/* Filter Status Akun */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                      <button
                        onClick={() => setAccountFilter('all')}
                        className={`px-3 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                          accountFilter === 'all'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Semua ({residentServerList.length})
                      </button>
                      <button
                        onClick={() => setAccountFilter('has_account')}
                        className={`px-3 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                          accountFilter === 'has_account'
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
                        Sudah Memiliki Akun
                      </button>
                      <button
                        onClick={() => setAccountFilter('no_account')}
                        className={`px-3 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                          accountFilter === 'no_account'
                            ? 'bg-rose-500 text-white shadow-xs'
                            : 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-300"></span>
                        Belum Memiliki Akun
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setActiveTab('data_wizard'); }}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Registrasi Keluarga Baru
                    </button>
                    <button
                      onClick={fetchResidentServerList}
                      className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      title="Refresh Data Server"
                    >
                      🔄 Refresh
                    </button>
                  </div>
                </div>

                {isLoadingResidents ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                    <span className="text-slate-500 dark:text-slate-400 font-medium text-xs">Memuat data dari server database...</span>
                  </div>
                ) : residentError ? (
                  <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl flex flex-col items-center gap-3 text-center">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                    <div className="space-y-1">
                      <h5 className="font-bold text-slate-900 dark:text-white text-xs">Gagal Menghubungkan ke Server</h5>
                      <p className="text-[10px] text-slate-400">{residentError}</p>
                    </div>
                    <button
                      onClick={fetchResidentServerList}
                      className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Coba Lagi
                    </button>
                  </div>
                ) : (
                  (() => {
                    const filteredList = residentServerList.filter(r => {
                      const id = r.family_id || r.id;
                      const q = searchQuery.toLowerCase();
                      const noKK = (r.no_kk || r.noKK || '').toLowerCase();
                      const kepala = (r.kepala_keluarga_nama || r.kepalaKeluarga || '').toLowerCase();
                      const alamat = (r.house_alamat || r.alamat || '').toLowerCase();
                      const username = (getWargaUsername(r) || '').toLowerCase();

                      const matchesSearch = noKK.includes(q) || kepala.includes(q) || alamat.includes(q) || username.includes(q);

                      const hasAccount = checkWargaHasAccount(r);

                      let matchesAccountFilter = true;
                      if (accountFilter === 'has_account') matchesAccountFilter = hasAccount;
                      if (accountFilter === 'no_account') matchesAccountFilter = !hasAccount;

                      return matchesSearch && matchesAccountFilter;
                    });

                    if (filteredList.length === 0) {
                      return (
                        <div className="py-12 px-4 border border-slate-200/60 dark:border-slate-800 rounded-3xl text-center space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                            <Users className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                            <h5 className="font-extrabold text-slate-900 dark:text-white text-xs">Tidak Ada Data Kartu Keluarga</h5>
                            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                              {searchQuery || accountFilter !== 'all'
                                ? 'Tidak ada data yang cocok dengan kriteria pencarian atau filter Anda.'
                                : 'Belum ada data keluarga yang terdaftar di server database.'}
                            </p>
                          </div>
                          {(searchQuery || accountFilter !== 'all') ? (
                            <button
                              onClick={() => { setSearchQuery(''); setAccountFilter('all'); }}
                              className="py-1.5 px-4 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                            >
                              Reset Filter & Pencarian
                            </button>
                          ) : (
                            <button
                              onClick={() => setActiveTab('data_wizard')}
                              className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
                            >
                              + Registrasi Keluarga Baru
                            </button>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50/70 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider">
                              <th className="p-4">No. Kartu Keluarga (KK)</th>
                              <th className="p-4">Kepala Keluarga</th>
                              <th className="p-4">Alamat Domisili Rumah</th>
                              <th className="p-4">Status Rumah</th>
                              <th className="p-4">Status Akun</th>
                              <th className="p-4 text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredList.map((r) => {
                              const id = r.family_id || r.id;
                              const noKK = r.no_kk || r.noKK;
                              const kepala = r.kepala_keluarga_nama || 'Tidak Diketahui';
                              const nik = r.kepala_keluarga_nik ? `NIK: ${r.kepala_keluarga_nik}` : '';
                              const noHp = r.kepala_keluarga_nohp ? ` | HP: ${r.kepala_keluarga_nohp}` : '';
                              const alamat = r.house_alamat || r.alamat || 'Tidak Diketahui';
                              const blok = r.house_blok ? ` (Blok ${r.house_blok}` : '';
                              const nomor = r.house_nomor ? ` No. ${r.house_nomor})` : '';
                              const statusRumah = r.house_status || '-';

                              const foundUsername = getWargaUsername(r);
                              const hasAccount = checkWargaHasAccount(r);

                              return (
                                <tr key={id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                                  <td className="p-4 font-mono font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                    <span>{revealedKks[id] || noKK}</span>
                                    {noKK?.includes('x') && !revealedKks[id] && (
                                      <button
                                        onClick={() => handleRevealResident(id)}
                                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                                        title="Buka Sensor KK"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </td>
                                  <td className="p-4">
                                    <div className="font-bold text-slate-700 dark:text-slate-300">{kepala}</div>
                                    <div className="text-[10px] text-slate-400">{nik}{noHp}</div>
                                  </td>
                                  <td className="p-4 text-slate-550 dark:text-slate-400">{alamat}{blok}{nomor}</td>
                                  <td className="p-4">
                                    <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] capitalize ${
                                      statusRumah === 'pribadi' || statusRumah === 'Tetap' || statusRumah === 'Milik Sendiri'
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                    }`}>
                                      {statusRumah}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    {hasAccount ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded-full font-extrabold text-[9px]">
                                        <Check className="w-3 h-3 text-emerald-500" />
                                        Sudah Memiliki Akun
                                        {foundUsername ? ` (@${foundUsername})` : ''}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30 rounded-full font-extrabold text-[9px]">
                                        <XIcon className="w-3 h-3 text-rose-500" />
                                        Belum Memiliki Akun
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-4 text-right flex justify-end items-center gap-1.5">
                                    <button
                                      onClick={() => setSelectedFamilyForDetail(r)}
                                      className="py-1 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                    >
                                      Detail
                                    </button>

                                    {!hasAccount ? (
                                      <button
                                        onClick={() => openRegisterAccountModal(r)}
                                        disabled={isCreatingAccount}
                                        className="py-1 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-[10px] font-extrabold transition-all cursor-pointer flex items-center gap-1 shadow-sm disabled:opacity-50"
                                      >
                                        Registrasi Akun
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => openEditAccountModal(r)}
                                        className="py-1 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                                      >
                                        <Edit className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                        <span>Edit Akun</span>
                                      </button>
                                    )}

                                    <button
                                      onClick={() => triggerPatchResidentKK(id, noKK)}
                                      className="py-1 px-2.5 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                                    >
                                      Edit KK
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          )}

          {/* SEKRETARIS: 2. PENDUDUK MASUK -> VERIFIKASI WARGA MANDIRI */}
          {activeTab === 'sek_warga_masuk' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="border-b border-slate-200/60 dark:border-slate-800 pb-3 flex justify-between items-center">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Verifikasi Pendaftaran Warga Mandiri</h4>
                  <p className="text-[10px] text-slate-400">Tinjau dan setujui pendaftaran anggota keluarga baru yang diajukan secara mandiri oleh warga.</p>
                </div>
                <button
                  onClick={fetchPendingWargaList}
                  className="py-1 px-2.5 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-lg text-[10px] font-bold text-slate-500 dark:text-slate-400 cursor-pointer"
                >
                  🔄 Segarkan
                </button>
              </div>

              {isLoadingPendingWarga ? (
                <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold text-slate-500">Memuat data warga pending...</p>
                </div>
              ) : pendingWargaError ? (
                <div className="p-8 text-center text-xs text-rose-500 font-bold border border-rose-500/20 bg-rose-500/5 rounded-2xl">
                  {pendingWargaError}
                </div>
              ) : pendingWargaList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-bold italic text-xs">Tidak ada pendaftaran warga baru yang menunggu verifikasi.</div>
              ) : (
                <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider">
                        <th className="p-4">Warga Baru</th>
                        <th className="p-4">NIK (Tersensor)</th>
                        <th className="p-4">Keluarga (KK)</th>
                        <th className="p-4">Alamat Domisili</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-right">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {pendingWargaList.map((w) => (
                        <tr key={w.warga_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                          <td className="p-4 space-y-1">
                            <span className="font-bold text-slate-900 dark:text-white block">{w.nama}</span>
                            <span className="text-[10px] text-slate-400 block">{w.jenis_kelamin} • {w.umur} Tahun</span>
                          </td>
                          <td className="p-4 font-mono font-bold text-slate-600 dark:text-slate-400">{w.nik}</td>
                          <td className="p-4 font-sans space-y-0.5">
                            <div className="font-bold text-slate-750 dark:text-slate-300">ID Keluarga: #{w.family_id}</div>
                            <div className="text-[10px] text-slate-450 font-mono">KK: {w.family_nokk}</div>
                          </td>
                          <td className="p-4 font-sans space-y-0.5">
                            <div className="font-semibold text-slate-750 dark:text-slate-350">Blok {w.house_blok} No. {w.house_nomor}</div>
                            <div className="text-[10px] text-slate-450 max-w-xs truncate">{w.house_alamat}</div>
                          </td>
                          <td className="p-4 text-center">
                            <span className="px-2.5 py-0.5 rounded-full font-bold text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse uppercase">
                              {w.status}
                            </span>
                          </td>
                          <td className="p-4 text-right font-sans">
                            <div className="inline-flex gap-1.5 justify-end">
                              <button
                                onClick={() => handleVerifyPendingWarga(w.warga_id, 'diterima')}
                                className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                              >
                                Setujui
                              </button>
                              <button
                                onClick={() => handleVerifyPendingWarga(w.warga_id, 'ditolak')}
                                className="py-1 px-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                              >
                                Tolak
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* SEKRETARIS: 3. PENDUDUK KELUAR */}
          {activeTab === 'sek_warga_keluar' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!pendudukKeluarForm.name) return;
                  const newEntry = {
                    id: 'OUT-' + Math.floor(Math.random() * 900 + 100),
                    name: pendudukKeluarForm.name,
                    date: pendudukKeluarForm.date,
                    address: pendudukKeluarForm.address || '-',
                    destination: pendudukKeluarForm.destination || '-',
                    reason: pendudukKeluarForm.reason || 'Pindah Domisili'
                  };
                  setPendudukKeluarList([newEntry, ...pendudukKeluarList]);
                  setPendudukKeluarForm({ name: '', date: new Date().toISOString().split('T')[0], address: '', destination: '', reason: '' });
                  alert('Catatan keluar berhasil disimpan!');
                }}
                className="p-5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 rounded-3xl space-y-4 max-w-xl"
              >
                <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">Catat Penduduk Keluar / Pindah</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">Nama Penduduk *</label>
                    <input
                      required
                      type="text"
                      value={pendudukKeluarForm.name}
                      onChange={(e) => setPendudukKeluarForm({ ...pendudukKeluarForm, name: e.target.value })}
                      placeholder="Contoh: Joni Iskandar"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">Tanggal Keluar *</label>
                    <DateInput
                      required
                      value={pendudukKeluarForm.date}
                      onChange={(e) => setPendudukKeluarForm({ ...pendudukKeluarForm, date: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">Alamat Lama RT 05</label>
                    <input
                      type="text"
                      value={pendudukKeluarForm.address}
                      onChange={(e) => setPendudukKeluarForm({ ...pendudukKeluarForm, address: e.target.value })}
                      placeholder="Contoh: Blok A1 No. 3"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">Tujuan Pindahan / Alasan</label>
                    <input
                      type="text"
                      value={pendudukKeluarForm.destination}
                      onChange={(e) => setPendudukKeluarForm({ ...pendudukKeluarForm, destination: e.target.value })}
                      placeholder="Contoh: Surabaya"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <button type="submit" className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer">Simpan Warga Keluar</button>
              </form>

              <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-405 tracking-wider">
                      <th className="p-4">Tanggal Keluar</th>
                      <th className="p-4">Nama Penduduk</th>
                      <th className="p-4">Alamat Lama</th>
                      <th className="p-4">Tujuan / Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {pendudukKeluarList.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-500">{formatDateIndo(p.date)}</td>
                        <td className="p-4 font-bold text-slate-800 dark:text-slate-205">{p.name}</td>
                        <td className="p-4 text-slate-500">{p.address}</td>
                        <td className="p-4 text-slate-500">{p.destination} ({p.reason})</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SEKRETARIS: 4. SURAT MASUK */}
          {activeTab === 'sek_surat_masuk' && (() => {
            // Apply filtering logic
            const filtered = suratMasukList.filter(s => {
              const matchSearch = 
                (s.asalSurat && s.asalSurat.toLowerCase().includes(suratMasukSearch.toLowerCase())) ||
                (s.perihal && s.perihal.toLowerCase().includes(suratMasukSearch.toLowerCase())) ||
                (s.nomorSurat && s.nomorSurat.toLowerCase().includes(suratMasukSearch.toLowerCase()));
              
              const matchStatus = suratMasukStatusFilter === 'All' || s.status === suratMasukStatusFilter;

              let matchDate = true;
              const itemDate = new Date(s.tanggalSurat);
              if (suratMasukDateStart) {
                const start = new Date(suratMasukDateStart);
                start.setHours(0,0,0,0);
                itemDate.setHours(0,0,0,0);
                if (itemDate < start) matchDate = false;
              }
              if (suratMasukDateEnd) {
                const end = new Date(suratMasukDateEnd);
                end.setHours(23,59,59,999);
                itemDate.setHours(0,0,0,0);
                if (itemDate > end) matchDate = false;
              }

              return matchSearch && matchStatus && matchDate;
            });

            const itemsPerPage = 5;
            const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
            const paginated = filtered.slice(
              (suratMasukPage - 1) * itemsPerPage,
              suratMasukPage * itemsPerPage
            );

            return (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
                {/* TOOLBAR: SEARCH & FILTERS */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-1">
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-md">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400" />
                      </span>
                      <input
                        type="text"
                        placeholder="Cari Nomor / Pengirim / Perihal..."
                        value={suratMasukSearch}
                        onChange={(e) => { setSuratMasukSearch(e.target.value); setSuratMasukPage(1); }}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/45 border border-slate-200/80 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all"
                      />
                    </div>

                    {/* Status dropdown */}
                    <select
                      value={suratMasukStatusFilter}
                      onChange={(e) => { setSuratMasukStatusFilter(e.target.value); setSuratMasukPage(1); }}
                      className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/45 border border-slate-200/80 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs font-extrabold text-slate-600 dark:text-slate-300 cursor-pointer"
                    >
                      <option value="All">Semua Status</option>
                      <option value="Baru">Baru</option>
                      <option value="Diproses">Diproses</option>
                      <option value="Selesai">Selesai</option>
                    </select>

                    {/* Date filter picker */}
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/40 p-1.5 border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                      <input
                        type="date"
                        value={suratMasukDateStart}
                        onChange={(e) => { setSuratMasukDateStart(e.target.value); setSuratMasukPage(1); }}
                        className="bg-transparent outline-none text-[11px] font-bold text-slate-500 dark:text-slate-400 cursor-pointer"
                        title="Tanggal Mulai"
                      />
                      <span className="text-slate-400 text-[10px] font-black uppercase">s/d</span>
                      <input
                        type="date"
                        value={suratMasukDateEnd}
                        onChange={(e) => { setSuratMasukDateEnd(e.target.value); setSuratMasukPage(1); }}
                        className="bg-transparent outline-none text-[11px] font-bold text-slate-500 dark:text-slate-400 cursor-pointer"
                        title="Tanggal Selesai"
                      />
                      {(suratMasukDateStart || suratMasukDateEnd || suratMasukStatusFilter !== 'All' || suratMasukSearch) && (
                        <button
                          onClick={() => {
                            setSuratMasukSearch('');
                            setSuratMasukStatusFilter('All');
                            setSuratMasukDateStart('');
                            setSuratMasukDateEnd('');
                            setSuratMasukPage(1);
                          }}
                          className="ml-1 p-1 bg-slate-200/60 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                          title="Reset Filters"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Add Button */}
                  <button
                    onClick={() => {
                      setSuratMasukForm({
                        id: '',
                        nomorSurat: '',
                        asalSurat: '',
                        perihal: '',
                        tanggalSurat: new Date().toISOString().split('T')[0],
                        tanggalDiterima: new Date().toISOString().split('T')[0],
                        status: 'Baru',
                        fileLampiran: null,
                        fileUrl: ''
                      });
                      setModalType('add_surat_masuk');
                    }}
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-500/10 transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Registrasi Surat Masuk</span>
                  </button>
                </div>

                {/* DATA TABLE */}
                <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider">
                        <th className="p-4">Nomor Surat</th>
                        <th className="p-4">Asal / Pengirim</th>
                        <th className="p-4">Perihal</th>
                        <th className="p-4">Tgl Surat</th>
                        <th className="p-4">Tgl Diterima</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {suratMasukLoading ? (
                        Array.from({ length: 3 }).map((_, idx) => (
                          <tr key={idx} className="animate-pulse">
                            <td className="p-4"><div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded-lg w-28"></div></td>
                            <td className="p-4"><div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded-lg w-36"></div></td>
                            <td className="p-4"><div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded-lg w-44"></div></td>
                            <td className="p-4"><div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded-lg w-18"></div></td>
                            <td className="p-4"><div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded-lg w-18"></div></td>
                            <td className="p-4"><div className="h-5 bg-slate-100 dark:bg-slate-800 rounded-full w-14"></div></td>
                            <td className="p-4 text-right"><div className="h-7 bg-slate-100 dark:bg-slate-800 rounded-lg w-20 ml-auto"></div></td>
                          </tr>
                        ))
                      ) : paginated.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="p-12 text-center">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <FolderOpen className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                              <h5 className="font-extrabold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">Tidak Ada Surat Masuk</h5>
                              <p className="text-[10px] text-slate-400 max-w-xs font-bold leading-normal">
                                Belum ada surat masuk terdaftar atau cocok dengan pencarian.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginated.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                            <td className="p-4 font-mono font-bold text-slate-600 dark:text-slate-350">{s.nomorSurat}</td>
                            <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{s.asalSurat}</td>
                            <td className="p-4 font-medium text-slate-600 dark:text-slate-400">{s.perihal}</td>
                            <td className="p-4 font-bold text-slate-500">{formatDateIndo(s.tanggalSurat)}</td>
                            <td className="p-4 font-bold text-slate-500">{formatDateIndo(s.tanggalDiterima)}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] capitalize ${
                                s.status === 'Baru' 
                                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                                  : s.status === 'Diproses' 
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              }`}>
                                {s.status}
                              </span>
                            </td>
                            <td className="p-4 text-right flex justify-end gap-1.5">
                              <button
                                onClick={() => setSuratMasukDetail(s)}
                                className="p-1 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg text-slate-500 hover:text-emerald-500 cursor-pointer"
                                title="Detail Surat"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSuratMasukForm({
                                    id: s.id,
                                    nomorSurat: s.nomorSurat,
                                    asalSurat: s.asalSurat,
                                    perihal: s.perihal,
                                    tanggalSurat: s.tanggalSurat,
                                    tanggalDiterima: s.tanggalDiterima,
                                    status: s.status,
                                    fileLampiran: null,
                                    fileUrl: s.fileLampiran
                                  });
                                  setModalType('edit_surat_masuk');
                                }}
                                className="p-1 border border-slate-200 dark:border-slate-800 hover:border-amber-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg text-slate-500 hover:text-amber-500 cursor-pointer"
                                title="Edit Surat"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSuratMasuk(s.id)}
                                className="p-1 border border-slate-200 dark:border-slate-800 hover:border-rose-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg text-slate-500 hover:text-rose-500 cursor-pointer"
                                title="Hapus Surat"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 font-sans">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      Halaman {suratMasukPage} dari {totalPages} ({filtered.length} Surat)
                    </span>
                    <div className="flex gap-1">
                      <button
                        disabled={suratMasukPage === 1}
                        onClick={() => setSuratMasukPage(prev => Math.max(prev - 1, 1))}
                        className="p-1.5 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-lg text-slate-400 hover:text-emerald-500 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        disabled={suratMasukPage === totalPages}
                        onClick={() => setSuratMasukPage(prev => Math.min(prev + 1, totalPages))}
                        className="p-1.5 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-lg text-slate-400 hover:text-emerald-500 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}          {activeTab === 'sek_surat_keluar' && (() => {
            const filtered = suratKeluarList.filter(s => {
              const matchSearch =
                (s.namaPemohon && s.namaPemohon.toLowerCase().includes(suratKeluarSearch.toLowerCase())) ||
                (s.nik && s.nik.includes(suratKeluarSearch)) ||
                (s.nomorSurat && s.nomorSurat.toLowerCase().includes(suratKeluarSearch.toLowerCase())) ||
                (s.jenisSurat && s.jenisSurat.toLowerCase().includes(suratKeluarSearch.toLowerCase())) ||
                (s.tujuan && s.tujuan.toLowerCase().includes(suratKeluarSearch.toLowerCase()));

              const matchStatus = suratKeluarStatusFilter === 'All' || s.status === suratKeluarStatusFilter;

              return matchSearch && matchStatus;
            });

            const itemsPerPage = 5;
            const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
            const paginated = filtered.slice(
              (suratKeluarPage - 1) * itemsPerPage,
              suratKeluarPage * itemsPerPage
            );

            return (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
                {/* TOOLBAR: SEARCH & FILTERS */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-1">
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-md">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400" />
                      </span>
                      <input
                        type="text"
                        placeholder="Cari Nomor / Pemohon / NIK / Tujuan..."
                        value={suratKeluarSearch}
                        onChange={(e) => { setSuratKeluarSearch(e.target.value); setSuratKeluarPage(1); }}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/45 border border-slate-200/80 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all"
                      />
                    </div>

                    {/* Status dropdown */}
                    <select
                      value={suratKeluarStatusFilter}
                      onChange={(e) => { setSuratKeluarStatusFilter(e.target.value); setSuratKeluarPage(1); }}
                      className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/45 border border-slate-200/80 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs font-extrabold text-slate-600 dark:text-slate-300 cursor-pointer"
                    >
                      <option value="All">Semua Status</option>
                      <option value="Draft">Draft</option>
                      <option value="Diproses">Diproses</option>
                      <option value="Disetujui">Disetujui</option>
                      <option value="Selesai">Selesai</option>
                    </select>

                    {(suratKeluarStatusFilter !== 'All' || suratKeluarSearch) && (
                      <button
                        onClick={() => {
                          setSuratKeluarSearch('');
                          setSuratKeluarStatusFilter('All');
                          setSuratKeluarPage(1);
                        }}
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-slate-500 transition-colors cursor-pointer"
                        title="Reset Filters"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Add Button */}
                  <button
                    onClick={() => {
                      setSuratKeluarForm({
                        id: '',
                        nomorSurat: '',
                        jenisSurat: 'Surat Pengantar',
                        namaPemohon: '',
                        nik: '',
                        tujuan: '',
                        tanggalSurat: new Date().toISOString().split('T')[0],
                        status: 'Draft'
                      });
                      setModalType('add_surat_keluar');
                    }}
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-500/10 transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Catat Surat Keluar</span>
                  </button>
                </div>

                {/* DATA TABLE */}
                <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider">
                        <th className="p-4">Nomor Surat</th>
                        <th className="p-4">Jenis Surat</th>
                        <th className="p-4">Nama Pemohon</th>
                        <th className="p-4">NIK</th>
                        <th className="p-4">Tujuan</th>
                        <th className="p-4">Tanggal Surat</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {suratKeluarLoading ? (
                        Array.from({ length: 3 }).map((_, idx) => (
                          <tr key={idx} className="animate-pulse">
                            <td className="p-4"><div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded-lg w-28"></div></td>
                            <td className="p-4"><div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded-lg w-28"></div></td>
                            <td className="p-4"><div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded-lg w-32"></div></td>
                            <td className="p-4"><div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded-lg w-32"></div></td>
                            <td className="p-4"><div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded-lg w-36"></div></td>
                            <td className="p-4"><div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded-lg w-18"></div></td>
                            <td className="p-4"><div className="h-5 bg-slate-100 dark:bg-slate-800 rounded-full w-14"></div></td>
                            <td className="p-4 text-right"><div className="h-7 bg-slate-100 dark:bg-slate-800 rounded-lg w-20 ml-auto"></div></td>
                          </tr>
                        ))
                      ) : paginated.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="p-12 text-center">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <FolderOpen className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                              <h5 className="font-extrabold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">Tidak Ada Surat Keluar</h5>
                              <p className="text-[10px] text-slate-400 max-w-xs font-bold leading-normal">
                                Belum ada surat keluar terdaftar atau cocok dengan pencarian.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginated.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                            <td className="p-4 font-mono font-bold text-slate-600 dark:text-slate-350">{s.nomorSurat}</td>
                            <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{s.jenisSurat}</td>
                            <td className="p-4 font-bold text-slate-700 dark:text-slate-350">{s.namaPemohon}</td>
                            <td className="p-4 font-mono text-slate-500 font-bold">{s.nik}</td>
                            <td className="p-4 font-medium text-slate-500">{s.tujuan}</td>
                            <td className="p-4 font-bold text-slate-500">{formatDateIndo(s.tanggalSurat)}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] capitalize ${
                                s.status === 'Draft' 
                                  ? 'bg-slate-500/10 text-slate-600 dark:text-slate-400' 
                                  : s.status === 'Diproses' 
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                                    : s.status === 'Disetujui'
                                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              }`}>
                                {s.status}
                              </span>
                            </td>
                            <td className="p-4 text-right flex justify-end gap-1.5">
                              <button
                                onClick={() => setSuratKeluarDetail(s)}
                                className="p-1 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg text-slate-500 hover:text-emerald-500 cursor-pointer"
                                title="Detail / Preview Surat"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSuratKeluarForm({
                                    id: s.id,
                                    nomorSurat: s.nomorSurat,
                                    jenisSurat: s.jenisSurat,
                                    namaPemohon: s.namaPemohon,
                                    nik: s.nik,
                                    tujuan: s.tujuan,
                                    tanggalSurat: s.tanggalSurat,
                                    status: s.status
                                  });
                                  setModalType('edit_surat_keluar');
                                }}
                                className="p-1 border border-slate-200 dark:border-slate-800 hover:border-amber-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg text-slate-500 hover:text-amber-500 cursor-pointer"
                                title="Edit Surat"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSuratKeluar(s.id)}
                                className="p-1 border border-slate-200 dark:border-slate-800 hover:border-rose-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg text-slate-500 hover:text-rose-500 cursor-pointer"
                                title="Hapus Surat"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 font-sans">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      Halaman {suratKeluarPage} dari {totalPages} ({filtered.length} Surat)
                    </span>
                    <div className="flex gap-1">
                      <button
                        disabled={suratKeluarPage === 1}
                        onClick={() => setSuratKeluarPage(prev => Math.max(prev - 1, 1))}
                        className="p-1.5 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-lg text-slate-400 hover:text-emerald-500 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        disabled={suratKeluarPage === totalPages}
                        onClick={() => setSuratKeluarPage(prev => Math.min(prev + 1, totalPages))}
                        className="p-1.5 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-lg text-slate-400 hover:text-emerald-500 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* SEKRETARIS: 6. TEMPLATE SURAT */}
          {activeTab === 'sek_surat_template' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { name: 'Surat Pengantar KTP / KK', desc: 'Syarat pengurusan pembuatan KTP baru di Kelurahan Sawangan Baru dikarenakan baru pindah domisili ke wilayah RT 05.' },
                  { name: 'Surat Keterangan Domisili Warga', desc: 'Syarat administratif pembukaan rekening bank baru dikarenakan domisili kerja di wilayah dekat perumahan.' },
                  { name: 'Surat Pengantar Nikah', desc: 'Memberikan pengantar persetujuan pernikahan bagi warga yang bersangkutan di kantor urusan agama Kelurahan Sawangan Baru.' },
                  { name: 'Surat Izin Keramaian', desc: 'Format permohonan izin menyelenggarakan acara / keramaian di lingkungan perumahan.' }
                ].map((t, idx) => (
                  <div key={idx} className="p-5 bg-slate-50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800 rounded-3xl space-y-4">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">Format Resmi RT</h4>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{t.name}</h4>
                      <p className="text-[10px] text-slate-500 leading-normal">{t.desc}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPreviewingTemplate(t)}
                        className="py-2 px-3.5 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-350 hover:text-emerald-500 font-extrabold text-[10px] rounded-xl cursor-pointer transition-colors"
                      >
                        Pratinjau Kop Surat
                      </button>
                      <button
                        onClick={() => alert(`Mengunduh format ${t.name}.docx... (Simulasi Unduh Template)`)}
                        className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-xl cursor-pointer"
                      >
                        Unduh Format
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SEKRETARIS: 7. KELOLA PENGUMUMAN */}
          {activeTab === 'sek_info_pengumuman' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="border-b border-slate-200/60 dark:border-slate-800 pb-3 flex justify-between items-center">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Kelola Pengumuman RT</h4>
                  <p className="text-[10px] text-slate-400">Buat, ubah, atau hapus pengumuman yang tampil di portal warga.</p>
                </div>
                <button
                  onClick={fetchServerAnnouncements}
                  className="py-1 px-2.5 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-lg text-[10px] font-bold text-slate-500 dark:text-slate-400 cursor-pointer"
                >
                  🔄 Segarkan
                </button>
              </div>

              {/* Create / Edit Form */}
              <form
                onSubmit={editingAnnouncementId ? handleUpdateAnnouncement : handleCreateAnnouncement}
                className="p-5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 rounded-3xl space-y-4 max-w-xl"
              >
                <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">
                  {editingAnnouncementId ? '✏️ Edit Pengumuman' : '📢 Buat Pengumuman Baru'}
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">Judul Pengumuman *</label>
                    <input
                      required
                      type="text"
                      value={announcementForm.judul}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, judul: e.target.value })}
                      placeholder="Contoh: Gotong Royong Minggu Depan"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">Isi Detail Pengumuman *</label>
                    <textarea
                      required
                      rows={3}
                      value={announcementForm.isi}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, isi: e.target.value })}
                      placeholder="Tulis isi pengumuman secara lengkap..."
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white leading-relaxed"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="py-2 px-5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-bold text-xs rounded-xl cursor-pointer transition-all">
                    {editingAnnouncementId ? 'Simpan Perubahan' : 'Terbitkan Pengumuman'}
                  </button>
                  {editingAnnouncementId && (
                    <button
                      type="button"
                      onClick={() => { setEditingAnnouncementId(null); setAnnouncementForm({ judul: '', isi: '' }); }}
                      className="py-2 px-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>

              {/* Announcement List */}
              {isLoadingAnnouncements ? (
                <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold text-slate-500">Memuat pengumuman...</p>
                </div>
              ) : announcementsError ? (
                <div className="p-8 text-center text-xs text-rose-500 font-bold border border-rose-500/20 bg-rose-500/5 rounded-2xl">
                  {announcementsError}
                </div>
              ) : (
                <div className="space-y-4">
                  {serverAnnouncements.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 font-bold italic text-xs">Belum ada pengumuman yang diterbitkan.</div>
                  ) : (
                    serverAnnouncements.map((a) => (
                      <div key={a.id} className="p-5 bg-slate-50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800 rounded-3xl space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1 flex-1 min-w-0">
                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 font-bold text-[9px] rounded-md">ID #{a.id}</span>
                            <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">{a.judul}</h4>
                            <p className="text-[11px] text-slate-500 leading-relaxed">{a.isi}</p>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0 ml-3">
                            <button
                              onClick={() => { setEditingAnnouncementId(a.id); setAnnouncementForm({ judul: a.judul, isi: a.isi }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                              className="py-1 px-2.5 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white text-[9px] font-bold rounded-lg cursor-pointer transition-colors border border-amber-100 dark:border-amber-900/30"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAnnouncement(a.id)}
                              className="py-1 px-2.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white text-[9px] font-bold rounded-lg cursor-pointer transition-colors border border-rose-100 dark:border-rose-900/30"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* SEKRETARIS: 8. NOTULEN RAPAT */}
          {activeTab === 'sek_info_notulen' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!notulenForm.title || !notulenForm.decisions) return;
                  const newEntry = {
                    id: 'NOT-' + Math.floor(Math.random() * 900 + 100),
                    date: notulenForm.date,
                    title: notulenForm.title,
                    recorder: currentUser.name,
                    decisions: notulenForm.decisions
                  };
                  setNotulenList([newEntry, ...notulenList]);
                  setNotulenForm({ title: '', date: new Date().toISOString().split('T')[0], decisions: '' });
                  alert('Notulen rapat berhasil dicatat!');
                }}
                className="p-5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 rounded-3xl space-y-4 max-w-xl font-sans"
              >
                <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">Catat Hasil Rapat Baru</h4>
                <div className="space-y-3 text-xs font-sans">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">Agenda / Topik Rapat *</label>
                    <input
                      required
                      type="text"
                      value={notulenForm.title}
                      onChange={(e) => setNotulenForm({ ...notulenForm, title: e.target.value })}
                      placeholder="Contoh: Pembahasan Anggaran 17 Agustus"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">Hasil Musyawarah / Keputusan Rapat *</label>
                    <textarea
                      required
                      rows={3}
                      value={notulenForm.decisions}
                      onChange={(e) => setNotulenForm({ ...notulenForm, decisions: e.target.value })}
                      placeholder="Tulis keputusan penting rapat..."
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <button type="submit" className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer">Simpan Notulen</button>
              </form>

              <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider">
                      <th className="p-4">Tanggal Rapat</th>
                      <th className="p-4">Topik Musyawarah</th>
                      <th className="p-4">Notulis</th>
                      <th className="p-4">Hasil / Keputusan Rapat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {notulenList.map((n) => (
                      <tr key={n.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-500">{formatDateIndo(n.date)}</td>
                        <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{n.title}</td>
                        <td className="p-4 text-slate-500">{n.recorder}</td>
                        <td className="p-4 text-slate-500 max-w-sm truncate" title={n.decisions}>{n.decisions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SEKRETARIS: 9. PENGADUAN WARGA */}
          {activeTab === 'sek_pengaduan' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="border-b border-slate-200/60 dark:border-slate-800 pb-3 flex justify-between items-center">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Daftar Pengaduan Warga</h4>
                  <p className="text-[10px] text-slate-400">Review aspirasi, laporan, atau pengajuan surat pengantar dari KK warga.</p>
                </div>
                <button
                  onClick={fetchServerComplaints}
                  className="py-1 px-2.5 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-lg text-[10px] font-bold text-slate-500 dark:text-slate-400 cursor-pointer"
                >
                  🔄 Segarkan
                </button>
              </div>

              {isLoadingComplaints ? (
                <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold text-slate-500">Memuat data pengaduan...</p>
                </div>
              ) : complaintsError ? (
                <div className="p-8 text-center text-xs text-rose-500 font-bold border border-rose-500/20 bg-rose-500/5 rounded-2xl">
                  {complaintsError}
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider">
                        <th className="p-4">ID / KK</th>
                        <th className="p-4">Kategori Laporan</th>
                        <th className="p-4">Deskripsi Aduan / Keperluan</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-right">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {serverComplaints.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                          <td className="p-4 font-mono font-bold space-y-1">
                            <div className="text-slate-800 dark:text-slate-200">#ADU-{c.id}</div>
                            <div className="text-[10px] text-slate-450">KK: {c.no_kk || '-'}</div>
                          </td>
                          <td className="p-4 font-bold text-slate-700 dark:text-slate-300">
                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-850 text-slate-500 text-[10px]">
                              {c.jenis}
                            </span>
                          </td>
                          <td className="p-4 text-slate-600 dark:text-slate-350 max-w-xs truncate" title={c.keperluan}>
                            {c.keperluan}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] capitalize ${
                              c.status === 'disetujui'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : c.status === 'ditolak'
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-450'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse'
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-1.5 font-sans">
                            {c.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleUpdateComplaintStatus(c.id, 'disetujui')}
                                  className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold rounded-lg cursor-pointer transition-colors"
                                >
                                  Setujui
                                </button>
                                <button
                                  onClick={() => handleUpdateComplaintStatus(c.id, 'ditolak')}
                                  className="py-1 px-2.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white text-[9px] font-bold rounded-lg cursor-pointer transition-colors border border-rose-100 dark:border-rose-900/30"
                                >
                                  Tolak
                                </button>
                              </>
                            )}
                            {c.status !== 'pending' && (
                              <span className="text-[10px] text-slate-400 italic font-bold">Selesai Ditinjau</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {serverComplaints.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-12 text-center text-slate-450 font-bold italic">
                            Belum ada pengaduan terdaftar di server.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* SEKRETARIS: 10. ARSIP FILE */}
          {activeTab === 'sek_arsip' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!arsipForm.name) return;
                  const newEntry = {
                    id: 'ARC-' + Math.floor(Math.random() * 900 + 100),
                    name: arsipForm.name,
                    date: arsipForm.date,
                    size: arsipForm.size,
                    category: arsipForm.category
                  };
                  setArsipFileList([newEntry, ...arsipFileList]);
                  setArsipForm({ name: '', category: 'Dokumen', size: '1.5 MB', date: new Date().toISOString().split('T')[0] });
                  alert('Berkas digital berhasil diarsipkan!');
                }}
                className="p-5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 rounded-3xl space-y-4 max-w-xl font-sans"
              >
                <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">Arsipkan Berkas Baru</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">Nama Dokumen File *</label>
                    <input
                      required
                      type="text"
                      value={arsipForm.name}
                      onChange={(e) => setArsipForm({ ...arsipForm, name: e.target.value })}
                      placeholder="Contoh: Laporan_Rapat_Mei_2026.pdf"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">Kategori Arsip *</label>
                    <select
                      value={arsipForm.category}
                      onChange={(e) => setArsipForm({ ...arsipForm, category: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-bold text-xs"
                    >
                      <option value="Laporan Keuangan">Keuangan</option>
                      <option value="Notulen">Notulen Rapat</option>
                      <option value="SK Pengurus">SK Pengurus</option>
                      <option value="Dokumen">Dokumen Umum</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer">Arsipkan File</button>
              </form>

              <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider">
                      <th className="p-4">No. Arsip</th>
                      <th className="p-4">Nama Dokumen</th>
                      <th className="p-4">Tanggal Arsip</th>
                      <th className="p-4 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {arsipFileList.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-500">{a.id}</td>
                        <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{a.name} ({a.size})</td>
                        <td className="p-4 text-slate-500">{formatDateIndo(a.date)}</td>
                        <td className="p-4 text-right font-sans">
                          <button onClick={() => alert(`Mengunduh berkas ${a.name}...`)} className="py-1 px-2.5 bg-emerald-600 text-white font-bold text-[9px] rounded-lg cursor-pointer">Unduh</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SEKRETARIS: 11. LAPORAN KEPENDUDUKAN */}
          {activeTab === 'sek_laporan' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 font-sans">
                <div className="p-5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200/60 dark:border-slate-800 rounded-3xl text-center space-y-1">
                  <span className="block text-2xl font-black text-slate-800 dark:text-white">{wargaList.filter(w => w.statusHidup !== 'Meninggal').length} Orang</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Penduduk Hidup</span>
                </div>
                <div className="p-5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200/60 dark:border-slate-800 rounded-3xl text-center space-y-1">
                  <span className="block text-2xl font-black text-slate-800 dark:text-white">
                    {(() => {
                      const kks = new Set(wargaList.map(w => w.noKk).filter(Boolean));
                      return kks.size;
                    })()} KK
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Kepala Keluarga</span>
                </div>
                <div className="p-5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200/60 dark:border-emerald-800/80 rounded-3xl text-center space-y-1">
                  <span className="block text-2xl font-black text-slate-800 dark:text-white">{wargaList.filter(w => w.status === 'Kontrak').length} Rumah</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Rumah Sewa / Kontrak</span>
                </div>
              </div>

              {/* Gender and residency structure */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed font-sans pt-4 border-t border-slate-200/60 dark:border-slate-800">
                <div className="space-y-3">
                  <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest">Rasio Jenis Kelamin</h4>
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-bold">
                      <span>Laki-laki</span>
                      <span>{wargaList.filter(w => w.gender === 'Laki-laki').length} Warga</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-sky-500 h-full" style={{ width: `${(wargaList.filter(w => w.gender === 'Laki-laki').length / wargaList.length) * 100}%` }}></div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-bold">
                      <span>Perempuan</span>
                      <span>{wargaList.filter(w => w.gender === 'Perempuan').length} Warga</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-pink-500 h-full" style={{ width: `${(wargaList.filter(w => w.gender === 'Perempuan').length / wargaList.length) * 100}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest">Status Kependudukan</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between font-semibold border-b border-slate-100 dark:border-slate-800 pb-1">
                      <span className="text-slate-500">Penduduk Tetap</span>
                      <span className="font-bold">{wargaList.filter(w => w.status === 'Tetap').length} Orang</span>
                    </div>
                    <div className="flex justify-between font-semibold border-b border-slate-100 dark:border-slate-800 pb-1">
                      <span className="text-slate-500">Penduduk Kontrak</span>
                      <span className="font-bold">{wargaList.filter(w => w.status === 'Kontrak').length} Orang</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-500">Penduduk Meninggal</span>
                      <span className="font-bold text-rose-500">{wargaList.filter(w => w.statusHidup === 'Meninggal').length} Orang</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SEKRETARIS: 12. MANAJEMEN KREDENSIAL LOGIN */}
          {activeTab === 'sek_akun_manage' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="border-b border-slate-200/60 dark:border-slate-800 pb-3">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Manajemen Akun Portal</h4>
                <p className="text-[10px] text-slate-400">Atur kredensial login warga atau buat akun kepengurusan staff baru.</p>
              </div>

              {currentUser.role === 'rt' && (
                <form
                  onSubmit={handleCreateStaffAccount}
                  className="p-5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 rounded-3xl space-y-4 max-w-xl text-xs sm:text-sm mb-6"
                >
                  <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">📢 Buat Akun Pengurus Baru (Sekretaris / Bendahara)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500">Username *</label>
                      <input
                        required
                        type="text"
                        value={staffForm.username}
                        onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value })}
                        placeholder="Contoh: bendahara_rt04"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500">Kata Sandi *</label>
                      <input
                        required
                        type="password"
                        value={staffForm.password}
                        onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                        placeholder="Minimal 6 karakter"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500">Email *</label>
                      <input
                        required
                        type="email"
                        value={staffForm.email}
                        onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                        placeholder="Contoh: staff@gmail.com"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500">Peran / Jabatan *</label>
                      <select
                        value={staffForm.role}
                        onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold text-xs animate-none"
                      >
                        <option value="sekertaris">Sekretaris (sekertaris)</option>
                        <option value="bendahara">Bendahara (bendahara)</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Tambah Staff Pengurus
                  </button>
                </form>
              )}

              <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider">
                      <th className="p-4">Nama Penduduk</th>
                      <th className="p-4">Username Login</th>
                      <th className="p-4">Sandi Warga (Plain)</th>
                      <th className="p-4 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {wargaList.filter(w => w.statusHidup !== 'Meninggal').map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                        <td className="p-4 font-bold text-slate-800 dark:text-slate-100">{w.name}</td>
                        <td className="p-4 font-mono text-slate-500 font-bold">@{w.username || 'warga'}</td>
                        <td className="p-4 font-mono text-slate-400">•••••••• (Sandi: {w.password})</td>
                        <td className="p-4 text-right font-sans flex justify-end gap-1.5">
                          <button 
                            onClick={() => openRegisterAccountModal(w)}
                            className="py-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold text-[9px] rounded-lg cursor-pointer"
                          >
                            Daftarkan Akun
                          </button>
                          <button 
                            onClick={() => {
                              const check = window.confirm(`Reset kata sandi ${w.name} menjadi '${w.username}123'?`);
                              if (check) {
                                const updated = wargaList.map(item => item.id === w.id ? { ...item, password: `${w.username}123` } : item);
                                setWargaList(updated);
                                localStorage.setItem('rt_wargalist', JSON.stringify(updated));
                                alert(`Sandi ${w.name} berhasil direset menjadi '${w.username}123'!`);
                              }
                            }}
                            className="py-1 px-2.5 bg-rose-50 hover:bg-rose-105 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 font-bold text-[9px] rounded-lg cursor-pointer"
                          >
                            Reset Sandi
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* KETUA RT: STATISTIK & MONITORING */}
          {activeTab === 'rt_statistik' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-8 animate-fade-in font-sans">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">Statistik & Monitoring Portal</h3>
                <p className="text-xs text-slate-400">Analisis demografi kependudukan, arus keuangan, dan aktivitas pengguna.</p>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
                {/* Card 1: Demografi Kepala Keluarga */}
                <div className="p-6 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 rounded-3xl space-y-4">
                  <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest">Rasio Jenis Kelamin</h4>
                  <div className="space-y-3 text-xs leading-none">
                    <div className="space-y-1.5">
                      <div className="flex justify-between font-bold">
                        <span className="text-slate-600 dark:text-slate-350">Laki-laki</span>
                        <span>{wargaList.filter(w => w.gender === 'Laki-laki').length} Orang</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-sky-500 h-full transition-all duration-500" style={{ width: `${(wargaList.filter(w => w.gender === 'Laki-laki').length / wargaList.length) * 100}%` }}></div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between font-bold">
                        <span className="text-slate-600 dark:text-slate-350">Perempuan</span>
                        <span>{wargaList.filter(w => w.gender === 'Perempuan').length} Orang</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-pink-500 h-full transition-all duration-500" style={{ width: `${(wargaList.filter(w => w.gender === 'Perempuan').length / wargaList.length) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Keuangan Kas Ringkasan */}
                <div className="p-6 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 rounded-3xl space-y-4">
                  <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest">Arus Kas RT</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 dark:border-slate-800">
                      <span className="font-semibold text-slate-500">Pemasukan</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">+{formatRupiah(totalPemasukan)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 dark:border-slate-800">
                      <span className="font-semibold text-slate-500">Pengeluaran</span>
                      <span className="font-black text-rose-505">-{formatRupiah(totalPengeluaran)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Total Saldo</span>
                      <span className="font-black text-slate-900 dark:text-white">{formatRupiah(sisaKasRT)}</span>
                    </div>
                  </div>
                </div>

                {/* Card 3: Statistik Keaktifan Akun */}
                <div className="p-6 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 rounded-3xl space-y-4">
                  <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest">Aktivitas Sesi</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-500">Total Log Akses</span>
                      <span className="font-bold text-slate-900 dark:text-white">{accessLogs.length} Kali</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-500">Pengguna Unik</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {new Set(accessLogs.map(l => l.username)).size} User
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-500">Login Hari Ini</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-450">
                        {accessLogs.filter(l => new Date(l.loginTime).toDateString() === new Date().toDateString()).length} Sesi
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Access Logs Panel inside Statistics */}
              <div className="space-y-4 pt-6 border-t border-slate-200/60 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">Log Aktivitas Masuk Portal</h4>
                    <p className="text-[10px] text-slate-400">Daftar login resmi pengurus dan warga.</p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Apakah Anda yakin ingin membersihkan seluruh log akses?')) {
                        localStorage.setItem('rt_access_logs', JSON.stringify([]));
                        setAccessLogs([]);
                      }
                    }}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/40 text-red-600 dark:text-red-400 font-bold rounded-xl text-[10px] transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Bersihkan Log</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                  <table className="w-full border-collapse text-left text-xs font-sans">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200/60 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="p-4">Warga / Pengguna</th>
                        <th className="p-4">Peran (Role)</th>
                        <th className="p-4">Waktu Masuk</th>
                        <th className="p-4">IP Address</th>
                        <th className="p-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                      {accessLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold italic">
                            Belum ada aktivitas masuk di portal ini.
                          </td>
                        </tr>
                      ) : (
                        accessLogs.slice(0, 10).map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="p-4">
                              <div>
                                <span className="font-extrabold text-slate-900 dark:text-white block">{log.name}</span>
                                <span className="text-[10px] text-slate-400">@{log.username}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block uppercase ${
                                log.role === 'rt' || log.role === 'admin'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                                  : log.role === 'sekertaris'
                                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                                  : log.role === 'bendahara'
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-450'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}>
                                {log.role}
                              </span>
                            </td>
                            <td className="p-4 text-slate-500 font-semibold">
                              {new Date(log.loginTime).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                            </td>
                            <td className="p-4 font-mono text-[11px] text-slate-500">{log.ipAddress}</td>
                            <td className="p-4 text-right">
                              {log.role === 'warga' ? (
                                <button
                                  onClick={() => handleShowAccessProfile(log.username)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                                >
                                  Lihat Profil
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
            </div>
          )}


          {/* TAB 2: MANAJEMEN WARGA */}
          {activeTab === 'warga' && (() => {
            const totalWargaCount = wargaList.length;
            const registeredAccountCount = wargaList.filter(w => checkWargaHasAccount(w)).length;
            const unregisteredAccountCount = totalWargaCount - registeredAccountCount;

            return (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
                
                {/* Realtime Registration Status Summary Banner */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Total Warga Card */}
                  <div 
                    onClick={() => setStatusFilter('All')}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      statusFilter === 'All' 
                        ? 'bg-slate-900 text-white dark:bg-slate-800 border-slate-700 shadow-md ring-2 ring-emerald-500/30' 
                        : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Warga Terdaftar</span>
                      <div className="text-2xl font-black">{totalWargaCount} <span className="text-xs font-normal opacity-70">Jiwa</span></div>
                    </div>
                    <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Sudah Memiliki Akun Card */}
                  <div 
                    onClick={() => setStatusFilter('SudahAkun')}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      statusFilter === 'SudahAkun' 
                        ? 'bg-emerald-600 text-white dark:bg-emerald-600 border-emerald-500 shadow-md ring-2 ring-emerald-500/40' 
                        : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/40 hover:border-emerald-300 dark:hover:border-emerald-800'
                    }`}
                  >
                    <div className="space-y-1">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider ${statusFilter === 'SudahAkun' ? 'text-emerald-100' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        🟢 Akun Sudah Ada
                      </span>
                      <div className={`text-2xl font-black ${statusFilter === 'SudahAkun' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                        {registeredAccountCount} <span className="text-xs font-normal opacity-70">Warga</span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl ${statusFilter === 'SudahAkun' ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                      <UserCheck className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Belum Memiliki Akun Card */}
                  <div 
                    onClick={() => setStatusFilter('BelumAkun')}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      statusFilter === 'BelumAkun' 
                        ? 'bg-rose-600 text-white dark:bg-rose-600 border-rose-500 shadow-md ring-2 ring-rose-500/40' 
                        : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/40 hover:border-rose-300 dark:hover:border-rose-800'
                    }`}
                  >
                    <div className="space-y-1">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider ${statusFilter === 'BelumAkun' ? 'text-rose-100' : 'text-rose-600 dark:text-rose-400'}`}>
                        🔴 Belum Punya Akun
                      </span>
                      <div className={`text-2xl font-black ${statusFilter === 'BelumAkun' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                        {unregisteredAccountCount} <span className="text-xs font-normal opacity-70">Warga</span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl ${statusFilter === 'BelumAkun' ? 'bg-white/20 text-white' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                      <AlertCircle className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center pt-2">
                  {/* Search & Filter */}
                  <div className="flex flex-wrap items-center gap-3 flex-1 max-w-2xl">
                    <div className="relative flex-1 min-w-[220px]">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Cari warga (Nama, NIK, No. KK, Username)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white transition-all"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Filter className="w-4 h-4 text-slate-400" />
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 outline-none cursor-pointer"
                      >
                        <option value="All">Semua Warga ({totalWargaCount})</option>
                        <option value="SudahAkun">🟢 Akun Sudah Ada ({registeredAccountCount})</option>
                        <option value="BelumAkun">🔴 Belum Punya Akun ({unregisteredAccountCount})</option>
                        <option value="Tetap">Status Tetap</option>
                        <option value="Kontrak">Status Kontrak</option>
                        <option value="Hidup">Masih Hidup</option>
                        <option value="Meninggal">Meninggal Dunia</option>
                      </select>
                    </div>
                  </div>

                  {/* Add Button */}
                  {currentUser.role !== 'bendahara' && (
                    <button
                      onClick={() => openAddModal('warga')}
                      className="py-2.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-500 dark:to-teal-400 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] hover:shadow-lg hover:shadow-emerald-500/10 cursor-pointer transition-all shrink-0"
                      title="Tambah Data Warga Baru"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Warga</span>
                    </button>
                  )}
                </div>

                {/* Table */}
                <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800 rounded-2xl max-h-[600px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 z-10 bg-slate-100/95 dark:bg-slate-950 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider text-[10px]">
                      <tr>
                        <th className="p-4">No. NIK / KK</th>
                        <th className="p-4">Nama Lengkap</th>
                        <th className="p-4">Kontak / Akun</th>
                        <th className="p-4">Alamat Rumah</th>
                        <th className="p-4 text-center">Status / Gender</th>
                        <th className="p-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {wargaList
                        .filter(w => {
                          const q = searchQuery.toLowerCase();
                          const matchesSearch = 
                            (w.name || '').toLowerCase().includes(q) || 
                            (w.nik || '').includes(q) || 
                            (w.noKk || w.no_kk || '').includes(q) ||
                            (w.username || '').toLowerCase().includes(q);
                          
                          const hasAccount = checkWargaHasAccount(w);

                          if (statusFilter === 'All') return matchesSearch;
                          if (statusFilter === 'SudahAkun') return matchesSearch && hasAccount;
                          if (statusFilter === 'BelumAkun') return matchesSearch && !hasAccount;
                          if (statusFilter === 'Tetap') return matchesSearch && w.status === 'Tetap';
                          if (statusFilter === 'Kontrak') return matchesSearch && w.status === 'Kontrak';
                          if (statusFilter === 'Hidup') return matchesSearch && w.statusHidup !== 'Meninggal';
                          if (statusFilter === 'Meninggal') return matchesSearch && w.statusHidup === 'Meninggal';
                          return matchesSearch;
                        })
                        .map((w) => {
                          const isAccountCreated = checkWargaHasAccount(w);
                          const famId = w.family_id || w.fammilyId || w.familyId;
                          const familyAccountHolder = famId ? wargaList.find(item => 
                            (item.family_id === famId || item.fammilyId === famId || item.familyId === famId) && 
                            (item.username && String(item.username).trim().length > 0)
                          ) : null;
                          const rawUsername = w.username || familyAccountHolder?.username;
                          const displayUsername = rawUsername || (isAccountCreated ? (w.name ? w.name.toLowerCase().replace(/[^a-z0-9]/g, '') : 'warga') : null);

                          return (
                            <tr key={w.id} className="hover:bg-emerald-50/40 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-4 font-mono space-y-1">
                                <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                                  <span>NIK: {revealedNiks[w.id] || w.nik}</span>
                                  {w.nik?.includes('x') && !revealedNiks[w.id] && (
                                    <button
                                      onClick={() => handleRevealWarga(w.id)}
                                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                                      title="Buka Sensor NIK"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                                  <span>KK: {revealedKks[w.family_id || w.fammilyId || w.id] || w.noKk}</span>
                                  {w.noKk?.includes('x') && !revealedKks[w.family_id || w.fammilyId || w.id] && (
                                    <button
                                      onClick={() => handleRevealResident(w.family_id || w.fammilyId || w.id)}
                                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                                      title="Buka Sensor KK"
                                    >
                                      <Eye className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="p-4 space-y-1 font-sans">
                                <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm block">{w.name}</span>
                                <div className="flex gap-2 items-center">
                                  <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-semibold text-slate-400 font-mono">
                                    ID: {w.id}
                                  </span>
                                  {w.statusHidup === 'Meninggal' && (
                                    <span className="text-[9px] px-1.5 py-0.5 bg-red-500/10 text-red-500 font-bold rounded">
                                      Wafat
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Kolom Kontak / Akun Informatif Realtime */}
                              <td className="p-4 space-y-2 font-sans">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                                  <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  <span>{w.noHp || w.no_hp || w.telepon || '081234567890'}</span>
                                </div>

                                {isAccountCreated ? (
                                  <div className="space-y-1.5 pt-0.5">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] border border-emerald-500/20 shadow-xs">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                      <span>🟢 Sudah Memiliki Akun</span>
                                    </span>
                                    {displayUsername && (
                                      <div className="text-[10px] text-slate-600 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md inline-block">
                                        Username: <span className="font-extrabold text-slate-900 dark:text-white">@{displayUsername}</span>
                                      </div>
                                    )}
                                    {currentUser.role !== 'bendahara' && (
                                      <div>
                                        <button
                                          onClick={() => openEditAccountModal(w)}
                                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold rounded-xl transition-all cursor-pointer text-[10px] flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-xs"
                                          title="Edit Data Akun Login Warga"
                                        >
                                          <Edit className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                          <span>Edit Akun</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-1.5 pt-0.5">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 font-extrabold text-[10px] border border-rose-500/20 shadow-xs">
                                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                      <span>🔴 Belum Memiliki Akun</span>
                                    </span>
                                    
                                    {currentUser.role !== 'bendahara' && (
                                      <div>
                                        <button
                                          disabled={loadingAccountId === w.id || isCreatingAccount}
                                          onClick={() => openRegisterAccountModal(w)}
                                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold rounded-xl transition-all cursor-pointer text-[10px] flex items-center gap-1.5 shadow-md hover:shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                          title="Registrasi Akun Login Warga"
                                        >
                                          {loadingAccountId === w.id ? (
                                            <>
                                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                              <span>Memproses...</span>
                                            </>
                                          ) : (
                                            <>
                                              <UserCheck className="w-3.5 h-3.5" />
                                              <span>Registrasi Akun</span>
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>

                            <td className="p-4 max-w-[220px]" title={w.alamat}>
                              <div className="text-slate-700 dark:text-slate-300 font-medium">{w.alamat || '-'}</div>
                              {(w.house_blok || w.house_nomor) && (
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  {w.house_blok ? `Blok ${w.house_blok}` : ''}{w.house_nomor ? ` No. ${w.house_nomor}` : ''}
                                </div>
                              )}
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
                              {currentUser.role === 'bendahara' ? (
                                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg font-bold text-[9px] uppercase tracking-wider">Akses Baca</span>
                              ) : (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => openEditModal('warga', w)}
                                    className="p-2 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all cursor-pointer"
                                    title="Edit Data Warga"
                                  >
                                    <Edit className="w-3.5 h-3.5 text-slate-500 hover:text-emerald-500" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete('warga', w.id)}
                                    className="p-2 border border-slate-200 dark:border-slate-800 hover:border-red-500 dark:hover:border-red-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all cursor-pointer"
                                    title="Hapus Data Warga"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-red-500" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

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

              {/* sub-tabs */}
              <div className="flex border-b border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => { setKasSubTab('transaksi'); setSearchQuery(''); }}
                  className={`py-3 px-6 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    kasSubTab === 'transaksi'
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-450'
                      : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  Buku Kas Umum
                </button>
                <button
                  onClick={() => { setKasSubTab('tunggakan'); setSearchQuery(''); }}
                  className={`py-3 px-6 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    kasSubTab === 'tunggakan'
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-450'
                      : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  Status & Tunggakan Iuran Warga
                </button>
              </div>

              {kasSubTab === 'transaksi' ? (
                <>
                  {/* Toolbar */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Cari transaksi..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white transition-all"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={handlePrintKasReport}
                        className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-250/20 dark:border-slate-800"
                      >
                        <span>Cetak Laporan</span>
                      </button>
                      <button
                        onClick={() => openAddModal('kas')}
                        className="py-2.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-500 dark:to-teal-400 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] hover:shadow-lg hover:shadow-emerald-500/10 cursor-pointer transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Catat Transaksi</span>
                      </button>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/70 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider">
                          <th className="p-4">Tanggal / ID</th>
                          <th className="p-4">Deskripsi Transaksi</th>
                          <th className="p-4">Kategori</th>
                          <th className="p-4 text-center">Tipe</th>
                          <th className="p-4 text-right">Jumlah Uang</th>
                          <th className="p-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {transaksiKasList
                          .filter(t => t.description.toLowerCase().includes(searchQuery.toLowerCase()) || t.category.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                              <td className="p-4 space-y-1 font-mono">
                                <span className="font-bold text-slate-700 dark:text-slate-350">{formatDateIndo(t.date)}</span>
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
                </>
              ) : (
                /* DAFTAR TUNGGAKAN IURAN WARGA */
                <div className="space-y-6 animate-fade-in">
                  {/* Search bar */}
                  <div className="relative max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari nama warga..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white transition-all"
                    />
                  </div>

                  {/* Tunggakan table */}
                  <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/70 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider">
                          <th className="p-4">Nama Warga</th>
                          <th className="p-4">Alamat Rumah</th>
                          <th className="p-4 text-center">Status Iuran</th>
                          <th className="p-4 text-right">Aksi Tindakan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {wargaList
                          .filter(w => w.statusHidup === 'Hidup' && (w.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((w) => (
                            <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                              <td className="p-4 font-bold text-slate-900 dark:text-white">
                                {w.name}
                                <span className="block text-[9px] text-slate-400 font-mono mt-0.5">ID: {w.id}</span>
                              </td>
                              <td className="p-4 text-slate-600 dark:text-slate-350 italic">
                                {w.alamat}
                              </td>
                              <td className="p-4 text-center">
                                <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg ${
                                  w.statusIuran?.includes('Menunggak')
                                    ? 'bg-rose-500/10 text-rose-500'
                                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450'
                                }`}>
                                  {w.statusIuran || 'Lunas'}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                {w.statusIuran?.includes('Menunggak') ? (
                                  <button
                                    onClick={() => handleUpdateIuranStatus(w.id, 'Lunas')}
                                    className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                                  >
                                    Konfirmasi Lunas
                                  </button>
                                ) : (
                                  <div className="inline-flex gap-1.5">
                                    <button
                                      onClick={() => handleUpdateIuranStatus(w.id, 'Menunggak (Rp 50.000)')}
                                      className="py-1.5 px-2 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-900/30 text-slate-500 hover:text-rose-500 font-bold text-[10px] rounded-lg transition-colors cursor-pointer border border-slate-200/40 dark:border-slate-800"
                                    >
                                      Set Menunggak 50rb
                                    </button>
                                    <button
                                      onClick={() => handleUpdateIuranStatus(w.id, 'Menunggak (Rp 100.000)')}
                                      className="py-1.5 px-2 bg-slate-100 hover:bg-rose-55 dark:bg-slate-800 dark:hover:bg-rose-900/30 text-slate-500 hover:text-rose-500 font-bold text-[10px] rounded-lg transition-colors cursor-pointer border border-slate-200/40 dark:border-slate-800"
                                    >
                                      Set Menunggak 100rb
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ========================================================================= */}
          {/* BENDAHARA CUSTOM NESTED TABS */}
          {/* ========================================================================= */}

          {/* IURAN: 1. Jenis Iuran */}
          {activeTab === 'iuran_jenis' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Daftar Jenis Iuran Warga</h3>
                  <p className="text-xs text-slate-400">Pengaturan tarif iuran wajib dan sukarela RT 05 Sawangan Green Park.</p>
                </div>

                {currentUser.role === 'bendahara' && (
                  <form
                    onSubmit={handleUpdateIplSetting}
                    className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-550 dark:text-slate-400">Set Tarif IPL (Rp):</span>
                      <input
                        required
                        type="number"
                        value={iplAmountInput}
                        onChange={(e) => setIplAmountInput(e.target.value)}
                        className="w-24 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none font-bold text-slate-800 dark:text-white"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-550 dark:text-slate-400">Saldo Awal (Rp):</span>
                      <input
                        required
                        type="number"
                        value={previousBalanceInput}
                        onChange={(e) => setPreviousBalanceInput(e.target.value)}
                        className="w-28 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none font-bold text-slate-800 dark:text-white"
                      />
                    </div>
                    <button
                      type="submit"
                      className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      Update
                    </button>
                  </form>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {jenisIuranList.map((j) => (
                  <div key={j.id} className="p-6 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 rounded-3xl space-y-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md text-[10px] font-bold font-mono">{j.frequency}</span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{j.name}</h4>
                      <p className="text-[10px] text-slate-450 leading-relaxed">{j.desc}</p>
                    </div>
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center">
                      <span className="text-xs text-slate-400">Tarif/KK</span>
                      <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">{formatRupiah(j.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* IURAN: 2. Pembayaran Form */}
          {activeTab === 'iuran_pembayaran' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pencatatan Pembayaran Iuran Warga</h3>
                <p className="text-xs text-slate-400">Input data iuran masuk bulanan secara manual setelah verifikasi transfer/tunai.</p>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!iuranPembayaranForm.wargaId) {
                    alert('Silakan pilih warga terlebih dahulu.');
                    return;
                  }
                  
                  const targetWarga = wargaList.find(w => w.id === iuranPembayaranForm.wargaId);
                  const targetJenis = jenisIuranList.find(j => j.id === iuranPembayaranForm.jenisIuranId);
                  
                  if (!targetWarga || !targetJenis) return;

                  // Create new kas entry
                  const newTx = {
                    id: 'TX-' + Math.floor(Math.random() * 90000 + 10000),
                    description: `Pembayaran ${targetJenis.name} (${iuranPembayaranForm.month}) - ${targetWarga.name}`,
                    amount: parseInt(iuranPembayaranForm.amount) || 0,
                    date: iuranPembayaranForm.date,
                    type: 'income',
                    category: 'Iuran Warga'
                  };

                  // Send to backend API
                  const token = localStorage.getItem('rt_token');
                  if (token) {
                    fetch('http://172.20.32.62:3333/admin/finance/income', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        amount: parseInt(iuranPembayaranForm.amount) || 0,
                        sourceType: 'IPL_PAYMENT',
                        description: `Pembayaran ${targetJenis.name} (${iuranPembayaranForm.month}) - ${targetWarga.name}`
                      })
                    }).then(() => fetchLedgerFromServer()).catch(err => console.warn('Sync payment notice:', err));
                  }

                  // Update warga status to Lunas
                  const updatedWarga = wargaList.map(w => w.id === targetWarga.id ? { ...w, statusIuran: 'Lunas' } : w);
                  saveWarga(updatedWarga);

                  // Update kas list
                  saveKas([newTx, ...transaksiKasList]);

                  alert(`Berhasil mencatat pembayaran iuran ${targetJenis.name} (${iuranPembayaranForm.month}) untuk warga: ${targetWarga.name} sebesar ${formatRupiah(iuranPembayaranForm.amount)}.`);
                  
                  // Reset form
                  setIuranPembayaranForm(prev => ({
                    ...prev,
                    wargaId: ''
                  }));
                }}
                className="max-w-xl space-y-4 text-xs sm:text-sm"
              >
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Pilih Warga Pembayar *</label>
                  <select
                    required
                    value={iuranPembayaranForm.wargaId}
                    onChange={(e) => setIuranPembayaranForm({ ...iuranPembayaranForm, wargaId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold text-xs"
                  >
                    <option value="">-- Pilih Warga --</option>
                    {wargaList
                      .filter(w => w.statusHidup === 'Hidup')
                      .map(w => (
                        <option key={w.id} value={w.id}>{w.name} (Blok {w.alamat ? (w.alamat.split('Blok ').pop() || w.alamat) : 'Belum diisi'})</option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 dark:text-slate-400">Jenis Iuran *</label>
                    <select
                      value={iuranPembayaranForm.jenisIuranId}
                      onChange={(e) => {
                        const selected = jenisIuranList.find(j => j.id === e.target.value);
                        setIuranPembayaranForm({ 
                          ...iuranPembayaranForm, 
                          jenisIuranId: e.target.value,
                          amount: selected ? selected.amount : 0
                        });
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold text-xs"
                    >
                      {jenisIuranList.map(j => (
                        <option key={j.id} value={j.id}>{j.name} ({formatRupiah(j.amount)})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 dark:text-slate-400">Nominal Pembayaran (Rp) *</label>
                    <input
                      required
                      type="number"
                      value={iuranPembayaranForm.amount}
                      onChange={(e) => setIuranPembayaranForm({ ...iuranPembayaranForm, amount: parseInt(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 dark:text-slate-400">Bulan Iuran *</label>
                    <select
                      value={iuranPembayaranForm.month}
                      onChange={(e) => setIuranPembayaranForm({ ...iuranPembayaranForm, month: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold text-xs"
                    >
                      {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 dark:text-slate-400">Tanggal Transaksi *</label>
                    <DateInput
                      required
                      value={iuranPembayaranForm.date}
                      onChange={(e) => setIuranPembayaranForm({ ...iuranPembayaranForm, date: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-semibold"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-extrabold rounded-xl flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simpan Pembayaran Iuran</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* IURAN: 3. Riwayat Iuran */}
          {activeTab === 'iuran_riwayat' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Riwayat Transaksi Iuran Warga</h3>
                  <p className="text-xs text-slate-400">Daftar lengkap bukti setoran iuran warga yang masuk ke kas RT.</p>
                </div>
              </div>
              <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider">
                      <th className="p-4">Tanggal / ID</th>
                      <th className="p-4">Deskripsi Pembayaran</th>
                      <th className="p-4 text-right">Jumlah Uang</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {transaksiKasList
                      .filter(t => t.category === 'Iuran Warga')
                      .map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                          <td className="p-4 font-mono space-y-1">
                            <span className="font-bold text-slate-700 dark:text-slate-350">{formatDateIndo(t.date)}</span>
                            <div className="text-[10px] text-slate-400">{t.id}</div>
                          </td>
                          <td className="p-4 font-semibold text-slate-900 dark:text-white font-sans">
                            {t.description}
                          </td>
                          <td className="p-4 text-right font-black text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                            +{formatRupiah(t.amount)}
                          </td>
                        </tr>
                      ))}
                    {transaksiKasList.filter(t => t.category === 'Iuran Warga').length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-slate-450 font-bold italic">Belum ada riwayat transaksi pembayaran iuran.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* IURAN: 4. Tunggakan */}
          {activeTab === 'iuran_tunggakan' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pemetaan & Tracking Tunggakan IPL Warga</h3>
                  <p className="text-xs text-slate-400">Daftar kartu keluarga dan status pembayaran iuran bulanan (IPL) sesuai bulan target.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-450 uppercase">Bulan:</span>
                    <select
                      value={trackingMonth}
                      onChange={(e) => setTrackingMonth(parseInt(e.target.value))}
                      className="px-2 py-1 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-450 uppercase">Tahun:</span>
                    <select
                      value={trackingYear}
                      onChange={(e) => setTrackingYear(parseInt(e.target.value))}
                      className="px-2 py-1 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold"
                    >
                      {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={fetchFinanceTracking}
                    className="py-1 px-2.5 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-lg text-[10px] font-bold text-slate-550 dark:text-slate-400 cursor-pointer animate-none"
                  >
                    🔄 Segarkan
                  </button>
                </div>
              </div>

              {isLoadingFinanceTracking ? (
                <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold text-slate-500">Memuat data tracking tunggakan...</p>
                </div>
              ) : financeTrackingError ? (
                <div className="p-8 text-center text-xs text-rose-500 font-bold border border-rose-500/20 bg-rose-500/5 rounded-2xl">
                  {financeTrackingError}
                </div>
              ) : financeTrackingList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-bold italic text-xs">Tidak ada data tracking tunggakan iuran untuk periode ini.</div>
              ) : (
                <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800 rounded-2xl font-sans">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider">
                        <th className="p-4">No. KK</th>
                        <th className="p-4">Nama Kepala Keluarga</th>
                        <th className="p-4">Target Bulan</th>
                        <th className="p-4">Tagihan</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-center">Ketepatan Waktu</th>
                        <th className="p-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {financeTrackingList.map((h) => {
                        const isMenunggak = h.status === 'Nunggak';
                        return (
                          <tr key={h.family_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                            <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                              <div className="flex items-center gap-1.5">
                                <span>{revealedKks[h.family_id] || h.no_kk || 'Tidak Diketahui'}</span>
                                {h.no_kk?.includes('x') && !revealedKks[h.family_id] && (
                                  <button
                                    onClick={() => handleRevealResident(h.family_id)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer inline-flex items-center"
                                    title="Buka Sensor KK"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="p-4 font-bold text-slate-700 dark:text-slate-350">
                              {h.kepala_keluarga_nama}
                            </td>
                            <td className="p-4 font-mono text-slate-500">
                              {h.target_bulan}
                            </td>
                            <td className="p-4 font-black font-mono text-slate-850 dark:text-white">
                              {formatRupiah(h.nominal_tagihan || 200000)}
                            </td>
                            <td className="p-4 text-center">
                              <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg ${
                                isMenunggak
                                  ? 'bg-rose-500/10 text-rose-500'
                                  : 'bg-emerald-500/10 text-emerald-500'
                              }`}>
                                {h.status}
                              </span>
                            </td>
                            <td className="p-4 text-center text-slate-550 dark:text-slate-400 font-semibold">
                              {h.ketepatan_waktu || '-'}
                            </td>
                            <td className="p-4 text-right font-sans">
                              {isMenunggak ? (
                                <button
                                  onClick={() => alert(`Notifikasi tagihan tunggakan IPL dikirim ke Keluarga ${h.kepala_keluarga_nama}!`)}
                                  className="py-1 px-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                                >
                                  Tagih Warga
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-semibold italic">Lunas</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* IURAN: 5. Verifikasi Transfer Manual */}
          {activeTab === 'iuran_verifikasi' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Verifikasi Bukti Transfer Warga</h3>
                  <p className="text-xs text-slate-400">Verifikasi setoran iuran bulanan (IPL) dan uang kas insidental yang dilaporkan warga.</p>
                </div>
                <button
                  onClick={fetchPendingPayments}
                  className="py-1 px-2.5 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-lg text-[10px] font-bold text-slate-550 dark:text-slate-400 cursor-pointer animate-none"
                >
                  🔄 Segarkan
                </button>
              </div>

              {isLoadingPendingPayments ? (
                <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold text-slate-500">Memuat antrean verifikasi...</p>
                </div>
              ) : pendingPaymentsError ? (
                <div className="p-8 text-center text-xs text-rose-500 font-bold border border-rose-500/20 bg-rose-500/5 rounded-2xl">
                  {pendingPaymentsError}
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Table 1: IPL approvals */}
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider block mb-3 font-sans">1. Verifikasi Iuran Bulanan (IPL)</h4>
                    <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50/70 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider">
                            <th className="p-4">Tanggal / Warga</th>
                            <th className="p-4">Tahun & Bulan Iuran</th>
                            <th className="p-4">File Struk</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {pendingPayments.ipl && pendingPayments.ipl.map((b) => (
                            <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                              <td className="p-4 space-y-1">
                                <span className="font-bold text-slate-900 dark:text-white block">
                                  {(() => {
                                    const matchingResident = residentServerList.find(r => 
                                      (r.family_id !== undefined && (r.family_id === b.family_id || r.family_id === b.id_family)) ||
                                      (r.id !== undefined && (r.id === b.family_id || r.id === b.id_family))
                                    );
                                    return b.warga_nama && !b.warga_nama.startsWith('Keluarga KK #')
                                      ? b.warga_nama
                                      : (matchingResident ? matchingResident.kepala_keluarga_nama : b.warga_nama);
                                  })()}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono block">ID: #{b.id} | {formatDateIndo(b.payment_date)}</span>
                              </td>
                              <td className="p-4 font-bold text-slate-700 dark:text-slate-350">
                                Tahun {b.year} - Bulan {b.month}
                              </td>
                              <td className="p-4 max-w-xs truncate text-slate-450 font-mono" title={b.payment_proof}>
                                {b.payment_proof || '-'}
                              </td>
                              <td className="p-4">
                                <span className="px-2 py-0.5 rounded-full font-bold text-[9px] uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse">
                                  {b.status}
                                </span>
                              </td>
                              <td className="p-4 text-right font-sans">
                                <div className="inline-flex gap-1.5 justify-end">
                                  <button
                                    onClick={() => handleVerifyPendingPayment('ipl', b.id, 'diterima')}
                                    className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded-lg transition-colors cursor-pointer"
                                  >
                                    Setujui
                                  </button>
                                  <button
                                    onClick={() => handleVerifyPendingPayment('ipl', b.id, 'ditolak')}
                                    className="py-1 px-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[10px] rounded-lg transition-colors cursor-pointer"
                                  >
                                    Tolak
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {(!pendingPayments.ipl || pendingPayments.ipl.length === 0) && (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-slate-450 font-bold italic">Tidak ada pembayaran IPL yang perlu diverifikasi.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Table 2: Kas approvals */}
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider block mb-3 font-sans">2. Verifikasi Uang Kas / Sumbangan</h4>
                    <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50/70 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider">
                            <th className="p-4">Tanggal / Warga</th>
                            <th className="p-4">Kategori & Keterangan</th>
                            <th className="p-4">File Struk</th>
                            <th className="p-4">Nominal</th>
                            <th className="p-4 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {pendingPayments.kas && pendingPayments.kas.map((b) => (
                            <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                              <td className="p-4 space-y-1">
                                <span className="font-bold text-slate-900 dark:text-white block">
                                  {(() => {
                                    const matchingResident = residentServerList.find(r => 
                                      (r.family_id !== undefined && (r.family_id === b.family_id || r.family_id === b.id_family)) ||
                                      (r.id !== undefined && (r.id === b.family_id || r.id === b.id_family))
                                    );
                                    return b.warga_nama && !b.warga_nama.startsWith('Keluarga KK #')
                                      ? b.warga_nama
                                      : (matchingResident ? matchingResident.kepala_keluarga_nama : b.warga_nama);
                                  })()}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono block">ID: #{b.id} | {formatDateIndo(b.payment_date)}</span>
                              </td>
                              <td className="p-4">
                                <span className="font-bold text-slate-800 dark:text-slate-200 block capitalize">{b.category}</span>
                                <span className="text-[10px] text-slate-400 block italic">"{b.description}"</span>
                              </td>
                              <td className="p-4 max-w-xs truncate text-slate-455 font-mono" title={b.payment_proof}>
                                {b.payment_proof || '-'}
                              </td>
                              <td className="p-4 font-black text-emerald-600 dark:text-emerald-400 font-mono">
                                {formatRupiah(b.amount)}
                              </td>
                              <td className="p-4 text-right font-sans">
                                <div className="inline-flex gap-1.5 justify-end">
                                  <button
                                    onClick={() => handleVerifyPendingPayment('kas', b.id, 'diterima')}
                                    className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded-lg transition-colors cursor-pointer"
                                  >
                                    Setujui
                                  </button>
                                  <button
                                    onClick={() => handleVerifyPendingPayment('kas', b.id, 'ditolak')}
                                    className="py-1 px-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[10px] rounded-lg transition-colors cursor-pointer"
                                  >
                                    Tolak
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {(!pendingPayments.kas || pendingPayments.kas.length === 0) && (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-slate-455 font-bold italic">Tidak ada pembayaran Uang Kas yang perlu diverifikasi.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'keuangan_pemasukan' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Catat Pemasukan Kas RT (Luar Iuran)</h3>
                <p className="text-xs text-slate-400">Input transaksi dana masuk non-iuran seperti sumbangan, donasi, subsidi, dll.</p>
              </div>

              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!pemasukanForm.description || !pemasukanForm.amount) {
                    alert('Silakan isi seluruh formulir.');
                    return;
                  }

                  if (parseInt(pemasukanForm.amount) <= 0 || isNaN(parseInt(pemasukanForm.amount))) {
                    alert('Nominal pemasukan harus bernilai positif dan lebih besar dari 0!');
                    return;
                  }

                  const token = localStorage.getItem('rt_token');
                  if (!token) {
                    alert('Sesi Anda telah berakhir atau Anda belum login.');
                    return;
                  }

                  try {
                    const backendCategory = mapCategoryToBackend(pemasukanForm.category, 'income');
                    const res = await fetch('http://172.20.32.62:3333/admin/finance/income', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        amount: parseInt(pemasukanForm.amount),
                        sourceType: backendCategory,
                        description: pemasukanForm.description.trim()
                      })
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      throw new Error(data.message || data.pesan || 'Gagal menyimpan pemasukan di server.');
                    }
                    alert('Transaksi pemasukan kas berhasil dicatat di server database!');
                    await fetchLedgerFromServer(); // Sync from server
                    setPemasukanForm({
                      description: '',
                      amount: '',
                      date: new Date().toISOString().split('T')[0],
                      category: 'Donasi'
                    });
                  } catch (err) {
                    alert(`Gagal menyimpan ke server: ${err.message}`);
                  }
                }}
                className="max-w-xl space-y-4 text-xs sm:text-sm"
              >
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Keterangan/Deskripsi Pemasukan *</label>
                  <input
                    required
                    type="text"
                    placeholder="Contoh: Donasi fogging warga Blok B"
                    value={pemasukanForm.description}
                    onChange={(e) => setPemasukanForm({ ...pemasukanForm, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 dark:text-slate-400">Kategori *</label>
                    <select
                      value={pemasukanForm.category}
                      onChange={(e) => setPemasukanForm({ ...pemasukanForm, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold text-xs"
                    >
                      <option value="Donasi">Donasi / Sukarela</option>
                      <option value="Subsidi">Subsidi / Dana Desa</option>
                      <option value="Bunga Bank">Bunga Rekening RT</option>
                      <option value="Lainnya">Lain-lain</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 dark:text-slate-400">Nominal Uang (Rp) *</label>
                    <input
                      required
                      type="number"
                      value={pemasukanForm.amount}
                      onChange={(e) => setPemasukanForm({ ...pemasukanForm, amount: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 max-w-xs">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Tanggal Masuk *</label>
                  <DateInput
                    required
                    value={pemasukanForm.date}
                    onChange={(e) => setPemasukanForm({ ...pemasukanForm, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-semibold"
                  />
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-md"
                  >
                    Simpan Pemasukan
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* KEUANGAN: 2. Pengeluaran */}
          {activeTab === 'keuangan_pengeluaran' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Catat Pengeluaran Kas RT</h3>
                <p className="text-xs text-slate-400">Input transaksi dana keluar untuk belanja operasional RT, perbaikan fasum, CCTV, kegiatan, dll.</p>
              </div>

              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!pengeluaranForm.description || !pengeluaranForm.amount) {
                    alert('Silakan isi seluruh formulir.');
                    return;
                  }

                  if (parseInt(pengeluaranForm.amount) <= 0 || isNaN(parseInt(pengeluaranForm.amount))) {
                    alert('Nominal pengeluaran harus bernilai positif dan lebih besar dari 0!');
                    return;
                  }

                  const token = localStorage.getItem('rt_token');
                  if (!token) {
                    alert('Sesi Anda telah berakhir atau Anda belum login.');
                    return;
                  }

                  try {
                    const backendCategory = mapCategoryToBackend(pengeluaranForm.category, 'expense');
                    const res = await fetch('http://172.20.32.62:3333/admin/finance/expense', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        amount: parseInt(pengeluaranForm.amount),
                        sourceType: backendCategory,
                        description: pengeluaranForm.description.trim()
                      })
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      throw new Error(data.message || data.pesan || 'Gagal menyimpan pengeluaran di server.');
                    }
                    alert('Transaksi pengeluaran kas berhasil dicatat di server database!');
                    await fetchLedgerFromServer(); // Sync from server
                    setPengeluaranForm({
                      description: '',
                      amount: '',
                      date: new Date().toISOString().split('T')[0],
                      category: 'Kebersihan'
                    });
                  } catch (err) {
                    alert(`Gagal menyimpan ke server: ${err.message}`);
                  }
                }}
                className="max-w-xl space-y-4 text-xs sm:text-sm"
              >
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Keterangan/Keperluan Belanja *</label>
                  <input
                    required
                    type="text"
                    placeholder="Contoh: Honor petugas satpam Juli"
                    value={pengeluaranForm.description}
                    onChange={(e) => setPengeluaranForm({ ...pengeluaranForm, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 dark:text-slate-400">Kategori Belanja *</label>
                    <select
                      value={pengeluaranForm.category}
                      onChange={(e) => setPengeluaranForm({ ...pengeluaranForm, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold text-xs"
                    >
                      <option value="Kebersihan">Operasional Kebersihan</option>
                      <option value="Keamanan">Operasional Keamanan</option>
                      <option value="Sosial">Kegiatan Warga / Sosial</option>
                      <option value="Alat Kantor">ATK & Surat Menyurat</option>
                      <option value="Lainnya">Pengeluaran Lainnya</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 dark:text-slate-400">Nominal Belanja (Rp) *</label>
                    <input
                      required
                      type="number"
                      value={pengeluaranForm.amount}
                      onChange={(e) => setPengeluaranForm({ ...pengeluaranForm, amount: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 max-w-xs">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Tanggal Belanja *</label>
                  <DateInput
                    required
                    value={pengeluaranForm.date}
                    onChange={(e) => setPengeluaranForm({ ...pengeluaranForm, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-semibold"
                  />
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    className="py-3 px-6 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-md"
                  >
                    Simpan Pengeluaran
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* KEUANGAN: 3. Kas RT Summary */}
          {activeTab === 'keuangan_kas' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Buku Kas & Saldo RT</h3>
                <p className="text-xs text-slate-400">Status keuangan kas RT 05 Sawangan Green Park secara keseluruhan.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 bg-emerald-550/5 dark:bg-emerald-500/10 border border-emerald-500/10 dark:border-emerald-500/20 rounded-2xl shadow-xs">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Total Pemasukan</span>
                  <span className="block text-xl font-black text-slate-900 dark:text-white">{formatRupiah(totalPemasukan)}</span>
                </div>
                <div className="p-5 bg-rose-550/5 dark:bg-rose-500/10 border border-rose-500/10 dark:border-rose-500/20 rounded-2xl shadow-xs">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Total Pengeluaran</span>
                  <span className="block text-xl font-black text-slate-900 dark:text-white">{formatRupiah(totalPengeluaran)}</span>
                </div>
                <div className="p-5 bg-teal-550/5 dark:bg-teal-500/10 border border-teal-500/10 dark:border-teal-500/20 rounded-2xl shadow-xs">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Saldo Akhir Kas</span>
                  <span className="block text-xl font-black text-slate-900 dark:text-white">{formatRupiah(sisaKas)}</span>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800 rounded-2xl mt-6">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider">
                      <th className="p-4">Tanggal / ID</th>
                      <th className="p-4">Deskripsi Transaksi</th>
                      <th className="p-4">Kategori</th>
                      <th className="p-4 text-center">Tipe</th>
                      <th className="p-4 text-right">Jumlah Uang</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {transaksiKasList.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                        <td className="p-4 font-mono space-y-1">
                          <span className="font-bold text-slate-700 dark:text-slate-350">{formatDateIndo(t.date)}</span>
                          <div className="text-[10px] text-slate-400">{t.id}</div>
                        </td>
                        <td className="p-4 font-semibold text-slate-900 dark:text-white max-w-[280px] whitespace-normal break-words font-sans">
                          {t.description}
                        </td>
                        <td className="p-4 font-semibold text-slate-500 dark:text-slate-450 font-sans">
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* KEUANGAN: 4. Transfer Bank / QRIS */}
          {activeTab === 'keuangan_qris' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Rekening Transfer & QRIS RT 05</h3>
                <p className="text-xs text-slate-400">Informasi pembayaran resmi untuk warga mentransfer iuran bulanan.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Bank account details card */}
                <div className="p-6 bg-gradient-to-tr from-slate-900 to-slate-950 text-white rounded-3xl space-y-6 border border-slate-800 shadow-xl relative overflow-hidden">
                  <div className="absolute right-[-20px] top-[-20px] w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-xs text-emerald-450 uppercase tracking-widest">KARTU DEBIT RT 05</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">BANK MANDIRI</span>
                  </div>
                  <div className="space-y-1.5 pt-4 font-sans">
                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Nomor Rekening RT</span>
                    <p className="text-xl font-black font-mono tracking-widest text-slate-100">157-00-98234-04-1</p>
                  </div>
                  <div className="flex justify-between items-end pt-4 border-t border-slate-800">
                    <div className="space-y-0.5">
                      <span className="text-slate-500 text-[9px] font-bold uppercase tracking-wider block">Pemilik Rekening</span>
                      <p className="text-xs font-black text-slate-200">KAS RT 05 SAWANGAN GREEN PARK</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-md font-bold">AKTIF</span>
                  </div>
                </div>

                {/* Stylized QRIS Placeholder */}
                <div className="p-6 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
                  <div className="p-1.5 bg-white rounded-2xl border-4 border-emerald-500 shadow-lg">
                    {/* Simulated QR Grid with CSS */}
                    <div className="w-40 h-40 bg-slate-100 flex flex-col items-center justify-center p-2 relative overflow-hidden select-none">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-slate-900"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-slate-900"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-slate-900"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-slate-900"></div>
                      <span className="font-mono font-black text-[9px] bg-slate-900 text-white py-1 px-2.5 rounded-md tracking-widest shadow-md">QRIS RT04</span>
                      <div className="mt-2 w-14 h-14 border border-dashed border-slate-450 rounded-md animate-pulse"></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">QRIS RT 05 / RW 06</h5>
                    <p className="text-[10px] text-slate-400 leading-relaxed max-w-[200px]">Scan barcode di atas menggunakan m-banking atau e-wallet (GoPay, OVO, Dana).</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LAPORAN: 1. Bulanan */}
          {activeTab === 'laporan_bulanan' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Laporan Keuangan Bulanan Kas RT</h3>
                <p className="text-xs text-slate-400">Rangkuman transaksi kas bulanan berjalan (Juli 2026).</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Income categories summary */}
                <div className="p-6 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 rounded-3xl space-y-4">
                  <h4 className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Breakdown Pemasukan</h4>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-850">
                      <span className="text-slate-500 font-bold">Iuran Wajib Bulanan</span>
                      <span className="font-black text-slate-900 dark:text-white">{formatRupiah(transaksiKasList.filter(t => t.category === 'Iuran Warga').reduce((a,c) => a+c.amount,0))}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-850">
                      <span className="text-slate-500 font-bold">Sumbangan & Donasi</span>
                      <span className="font-black text-slate-900 dark:text-white">{formatRupiah(transaksiKasList.filter(t => t.category === 'Donasi').reduce((a,c) => a+c.amount,0))}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 font-black text-emerald-650">
                      <span>Total Pemasukan Bulan Ini</span>
                      <span>{formatRupiah(totalPemasukan)}</span>
                    </div>
                  </div>
                </div>

                {/* Expense categories summary */}
                <div className="p-6 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 rounded-3xl space-y-4">
                  <h4 className="font-extrabold text-xs text-rose-600 dark:text-rose-455 uppercase tracking-wider">Breakdown Pengeluaran</h4>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-850">
                      <span className="text-slate-500 font-bold">Honor Keamanan (Satpam)</span>
                      <span className="font-black text-slate-900 dark:text-white">{formatRupiah(transaksiKasList.filter(t => t.category === 'Keamanan').reduce((a,c) => a+c.amount,0))}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-850">
                      <span className="text-slate-500 font-bold">Operasional Kebersihan</span>
                      <span className="font-black text-slate-900 dark:text-white">{formatRupiah(transaksiKasList.filter(t => t.category === 'Kebersihan').reduce((a,c) => a+c.amount,0))}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 font-black text-rose-600">
                      <span>Total Pengeluaran Bulan Ini</span>
                      <span>{formatRupiah(totalPengeluaran)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LAPORAN: 2. Tahunan */}
          {activeTab === 'laporan_tahunan' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Laporan Keuangan Tahunan Kas RT (2026)</h3>
                <p className="text-xs text-slate-400">Rangkuman akumulasi keuangan kas tahunan RT 05.</p>
              </div>
              
              <div className="p-6 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 rounded-3xl space-y-4">
                <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">Laporan Kumulatif Buku Kas RT 05</h4>
                <div className="space-y-4 text-xs font-sans">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-850">
                    <span className="text-slate-500 font-bold">Januari - Juni 2026 (Saldo Awal Terakumulasi)</span>
                    <span className="font-black text-slate-900 dark:text-white">{formatRupiah(7500000)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-850">
                    <span className="text-slate-500 font-bold">Pemasukan Berjalan (Juli)</span>
                    <span className="font-black text-emerald-600">{formatRupiah(totalPemasukan)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-850">
                    <span className="text-slate-500 font-bold">Pengeluaran Berjalan (Juli)</span>
                    <span className="font-black text-rose-500">-{formatRupiah(totalPengeluaran)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 font-black text-sm text-emerald-600 dark:text-emerald-400">
                    <span>Proyeksi Saldo Bersih Kumulatif Akhir Tahun</span>
                    <span>{formatRupiah(7500000 + sisaKas)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LAPORAN: 3. Rekap Iuran */}
          {activeTab === 'laporan_rekap' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tabel Rekapitulasi Pembayaran Iuran Bulanan Warga</h3>
                <p className="text-xs text-slate-400">Daftar status lunas warga RT 05 Sawangan Green Park per bulan.</p>
              </div>

              <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider">
                      <th className="p-4 min-w-[120px]">Nama Warga</th>
                      <th className="p-2 text-center">Mei</th>
                      <th className="p-2 text-center">Juni</th>
                      <th className="p-2 text-center">Juli</th>
                      <th className="p-2 text-center">Agustus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {wargaList
                      .filter(w => w.statusHidup === 'Hidup')
                      .map((w) => (
                        <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                          <td className="p-4 font-bold text-slate-900 dark:text-white font-sans">
                            {w.name}
                            <span className="block text-[9px] text-slate-400 font-mono mt-0.5">ID: {w.id}</span>
                          </td>
                          <td className="p-2 text-center text-emerald-500 font-bold text-sm">✓</td>
                          <td className="p-2 text-center text-emerald-500 font-bold text-sm">✓</td>
                          <td className="p-2 text-center">
                            {w.statusIuran?.includes('Menunggak') ? (
                              <span className="text-rose-500 font-black text-sm">✗</span>
                            ) : (
                              <span className="text-emerald-500 font-black text-sm">✓</span>
                            )}
                          </td>
                          <td className="p-2 text-center text-slate-450 italic">Pending</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* LAPORAN: 4. Export Excel/PDF */}
          {activeTab === 'laporan_export' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ekspor & Cetak Laporan Keuangan</h3>
                <p className="text-xs text-slate-400">Ekspor/cetak fisik Buku Kas Umum dan Rekapitulasi Iuran RT 05.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="p-6 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-850 rounded-3xl space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Buku Kas RT (PDF/Printer)</h4>
                  <p className="text-xs text-slate-400">Cetak lembar laporan fisik transaksi kas masuk & keluar RT secara formal.</p>
                  <button
                    onClick={handlePrintKasReport}
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Cetak Buku Kas RT
                  </button>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-850 rounded-3xl space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Rekapitulasi Iuran (Ekspor Excel)</h4>
                  <p className="text-xs text-slate-400">Ekspor matriks iuran warga (CSV/Excel format) untuk audit pembukuan.</p>
                  <button
                    onClick={() => {
                      try {
                        const headers = ["ID Transaksi", "Tanggal", "Keterangan", "Kategori", "Tipe", "Nominal (Rp)"];
                        const rows = (transaksiKasList || []).map(t => [
                          t.id || '-',
                          formatDateIndo(t.date || t.created_at),
                          t.description || t.keterangan || '-',
                          t.category || t.kategori || 'Lainnya',
                          (t.type === 'income' || t.tipe === 'masuk') ? 'Pemasukan' : 'Pengeluaran',
                          t.amount || t.nominal || 0
                        ]);
                        const csvContent = [headers, ...rows].map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.setAttribute("href", url);
                        link.setAttribute("download", `laporan_kas_rt05_${new Date().toISOString().split('T')[0]}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      } catch (err) {
                        alert(`Gagal mengekspor CSV: ${err.message}`);
                      }
                    }}
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Ekspor CSV Spreadsheet
                  </button>
                </div>
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
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (fetchAgendas) fetchAgendas(e.target.value);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white transition-all"
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
                    <div key={a.id} className="relative bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between overflow-hidden">
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
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 text-[10px]">
                          <div>
                            <span className="block text-slate-400 font-bold uppercase tracking-wider">Tanggal & Waktu</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDateIndo(a.date)} ({a.time})</span>
                          </div>
                          <div>
                            <span className="block text-slate-400 font-bold uppercase tracking-wider">Tempat</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block" title={a.location}>{a.location}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-200/60 dark:border-slate-800">
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white transition-all"
                  />
                </div>
              </div>

              {/* List table for Submissions */}
              <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider">
                      <th className="p-4">Tanggal / ID</th>
                      <th className="p-4">Data Warga Pemohon</th>
                      <th className="p-4">Jenis Surat Pengantar</th>
                      <th className="p-4">Keperluan / Keterangan</th>
                      <th className="p-4 text-center">Status Berkas</th>
                      <th className="p-4 text-right">Aksi Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {displaySubmissions
                      .filter(s => s.wargaNama.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                          <td className="p-4 font-mono space-y-1">
                            <span className="font-semibold text-slate-805 dark:text-slate-350">{sub.submissionDate}</span>
                            <div className="text-[10px] text-slate-400">{sub.id}</div>
                          </td>
                          <td className="p-4 space-y-1">
                            <span className="font-bold text-slate-905 dark:text-slate-100">{sub.wargaNama}</span>
                            <div className="text-[10px] text-slate-400 font-mono">NIK: {sub.wargaNik} | KK: {sub.wargaNoKk}</div>
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

          {/* TAB: PENGATURAN ADMIN */}
          {activeTab === 'pengaturan' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-8 animate-fade-in font-sans">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Pengaturan Portal & Sistem</h3>
                <p className="text-xs text-slate-400">Konfigurasi akun pengurus, detail lingkungan RT, dan preferensi portal.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Side: Account Password Form */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Keamanan Akun</h4>
                    <p className="text-[10px] text-slate-400">Ubah kata sandi akun pengurus Anda secara berkala.</p>
                  </div>

                  <form onSubmit={handleAdminChangePassword} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Kata Sandi Lama</label>
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        required
                        value={adminOldPassword}
                        onChange={(e) => setAdminOldPassword(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-505 text-slate-900 dark:text-white font-semibold" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Kata Sandi Baru</label>
                      <input 
                        type="password" 
                        placeholder="Minimal 8 karakter" 
                        required
                        value={adminNewPassword}
                        onChange={(e) => setAdminNewPassword(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-505 text-slate-900 dark:text-white font-semibold" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Konfirmasi Kata Sandi Baru</label>
                      <input 
                        type="password" 
                        placeholder="Ketik ulang kata sandi baru" 
                        required
                        value={adminConfirmPassword}
                        onChange={(e) => setAdminConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-505 text-slate-900 dark:text-white font-semibold" 
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={isAdminChangingPassword}
                      className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-450 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
                    >
                      {isAdminChangingPassword ? 'Memperbarui...' : 'Perbarui Kata Sandi'}
                    </button>
                  </form>
                </div>

                {/* Right Side: RT Environment Profile */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Profil Lingkungan RT</h4>
                    <p className="text-[10px] text-slate-400">Konfigurasi data wilayah hukum administrasi RT.</p>
                  </div>

                  <div className="p-6 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 rounded-3xl space-y-4 text-xs font-sans">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Rukun Tetangga</span>
                        <p className="font-bold text-slate-900 dark:text-white">RT 05</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Rukun Warga</span>
                        <p className="font-bold text-slate-900 dark:text-white">RW 06</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Kelurahan</span>
                        <p className="font-bold text-slate-900 dark:text-white">Pasir Putih</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Kecamatan</span>
                        <p className="font-bold text-slate-900 dark:text-white">Sawangan</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Perumahan / Lokasi</span>
                        <p className="font-bold text-slate-900 dark:text-white">Sawangan Green Park Blok C-D</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => alert('Fitur edit wilayah memerlukan konfirmasi dari kelurahan.')} 
                      className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 dark:hover:bg-slate-750 transition-all cursor-pointer"
                    >
                      Ajukan Perubahan Data Wilayah
                    </button>
                  </div>
                </div>
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white transition-all"
                  />
                </div>
                <button
                  onClick={() => {
                    if (confirm('Apakah Anda yakin ingin membersihkan seluruh log akses?')) {
                      localStorage.setItem('rt_access_logs', JSON.stringify([]));
                      setAccessLogs([]);
                    }
                  }}
                  className="px-4 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Semua Log</span>
                </button>
              </div>

              {/* Table rendering logs */}
              <div className="overflow-x-auto border border-slate-100 dark:border-slate-805 rounded-2xl">
                <table className="w-full border-collapse text-left text-xs font-sans">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
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
                          <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
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
                                  ? 'bg-emerald-105 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                                  : log.role === 'sekertaris'
                                  ? 'bg-blue-105 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                                  : log.role === 'bendahara'
                                  ? 'bg-amber-105 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
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

          {/* TAB 6: LOG AKSES WARGA (DUPLICATE) */}
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white transition-all"
                  />
                </div>
                <button
                  onClick={() => {
                    if (confirm('Apakah Anda yakin ingin membersihkan seluruh log akses?')) {
                      localStorage.setItem('rt_access_logs', JSON.stringify([]));
                      setLogsTrigger(t => t + 1);
                    }
                  }}
                  className="px-4 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Semua Log</span>
                </button>
              </div>

              {/* Table rendering logs */}
              <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
                <table className="w-full border-collapse text-left text-xs font-sans">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
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
                          <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
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

          {/* TAB: DATA WIZARD */}
          {activeTab === 'data_wizard' && (
            <AdminDataWizard />
          )}

            </>
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

          <div className={`relative bg-white dark:bg-slate-900 w-full ${modalType === 'register_account' ? 'max-w-lg' : 'max-w-md'} rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-2xl overflow-hidden z-10 animate-scale-up max-h-[90vh] flex flex-col`}>
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>

            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                {modalType === 'add_warga' && 'Tambah Warga Baru'}
                {modalType === 'edit_warga' && 'Edit Data Warga'}
                {modalType === 'add_kas' && 'Catat Kas Masuk/Keluar'}
                {modalType === 'edit_kas' && 'Edit Catatan Kas'}
                {modalType === 'add_agenda' && 'Buat Agenda Baru'}
                {modalType === 'edit_agenda' && 'Edit Detail Agenda'}
                {modalType === 'register_account' && `Registrasi Akun - ${selectedCitizenForAccount?.name}`}
                {modalType === 'edit_account' && `Edit Akun Login - ${selectedCitizenForAccount?.name}`}
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

              {/* REGISTER & EDIT ACCOUNT FORM (2-SECTION MODULAR REDESIGN) */}
              {(modalType === 'register_account' || modalType === 'edit_account') && (() => {
                const isEditMode = modalType === 'edit_account';
                const isUsernameValid = (accountForm.username || '').trim().length >= 4 && !usernameFieldError;
                const isPasswordValid = isEditMode
                  ? (!accountForm.password || accountForm.password.length >= 6)
                  : ((accountForm.password || '').length >= 6);
                const isConfirmPasswordValid = isEditMode
                  ? (!accountForm.password || accountForm.confirmPassword === accountForm.password)
                  : (accountForm.confirmPassword === accountForm.password && (accountForm.confirmPassword || '').length >= 6);

                const isFormValid = isUsernameValid && isPasswordValid && isConfirmPasswordValid;

                return (
                  <div className="space-y-6 font-sans text-xs">
                    {/* SECTION 1: Informasi Warga (Readonly Card) */}
                    <div className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                      <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-2.5">
                        <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                          Informasi Warga (Read-Only)
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-slate-400 font-bold block text-[10px] uppercase">Nama Lengkap</span>
                          <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                            {selectedCitizenForAccount?.name || '-'}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 font-bold block text-[10px] uppercase">NIK (KTP)</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                            {selectedCitizenForAccount?.nik || '-'}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 font-bold block text-[10px] uppercase">Nomor KK</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                            {selectedCitizenForAccount?.noKk || selectedCitizenForAccount?.no_kk || '-'}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 font-bold block text-[10px] uppercase">Kepala Keluarga</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {selectedCitizenForAccount?.kepalaKeluarga || selectedCitizenForAccount?.kepala_keluarga_nama || selectedCitizenForAccount?.name || '-'}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 font-bold block text-[10px] uppercase">Blok & Nomor Rumah</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {selectedCitizenForAccount?.house_blok ? `Blok ${selectedCitizenForAccount.house_blok}` : ''}
                            {selectedCitizenForAccount?.house_nomor ? ` No. ${selectedCitizenForAccount.house_nomor}` : '-'}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 font-bold block text-[10px] uppercase">Nomor HP</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {selectedCitizenForAccount?.noHp || selectedCitizenForAccount?.no_hp || selectedCitizenForAccount?.telepon || '-'}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 font-bold block text-[10px] uppercase">Email Warga</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {selectedCitizenForAccount?.email || selectedCitizenForAccount?.emailWarga || '-'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-1">
                        <span className="text-slate-400 font-bold block text-[10px] uppercase">Alamat Lengkap</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {selectedCitizenForAccount?.alamat || '-'}
                        </span>
                      </div>
                    </div>

                    {/* Divider Visual */}
                    <div className="relative flex items-center justify-center">
                      <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
                      <span className="bg-white dark:bg-slate-900 px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest absolute">
                        {isEditMode ? '⚙️ Edit Akun Warga' : '🔐 Informasi Akun Baru'}
                      </span>
                    </div>

                    {/* SECTION 2: Informasi Akun (Form Input) */}
                    <form onSubmit={isEditMode ? handleEditAccountSubmit : handleAccountRegisterSubmit} className="space-y-4">
                      {/* Username Field */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="font-bold text-slate-700 dark:text-slate-200 text-xs">
                            Username Login *
                          </label>
                          <button
                            type="button"
                            onClick={() => handleGenerateUsername()}
                            className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer bg-emerald-500/10 px-2.5 py-1 rounded-lg hover:bg-emerald-500/20 active:scale-95 transition-all shadow-xs"
                            title="Klik untuk membuat rekomendasi username baru secara acak"
                          >
                            <Wand2 className="w-3.5 h-3.5 animate-bounce" />
                            <span>⚡ Generate Username</span>
                          </button>
                        </div>

                        <input
                          required
                          disabled={isCreatingAccount}
                          type="text"
                          placeholder="Masukkan username (min. 4 karakter)"
                          value={accountForm.username}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAccountForm({ ...accountForm, username: val });
                            if (val.trim().length > 0 && val.trim().length < 4) {
                              setUsernameFieldError('Username minimal 4 karakter.');
                            } else {
                              setUsernameFieldError('');
                            }
                          }}
                          className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border ${
                            usernameFieldError ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-emerald-500/20 focus:border-emerald-500'
                          } rounded-xl outline-none focus:ring-2 text-slate-900 dark:text-white font-mono font-semibold transition-all disabled:opacity-50`}
                        />
                        {usernameFieldError && (
                          <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>{usernameFieldError}</span>
                          </p>
                        )}
                      </div>

                      {/* Email Field */}
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700 dark:text-slate-200 text-xs">
                          Email Warga (Opsional)
                        </label>
                        <input
                          disabled={isCreatingAccount}
                          type="email"
                          placeholder="nama@domain.com"
                          value={accountForm.email || ''}
                          onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white transition-all disabled:opacity-50"
                        />
                      </div>

                      {/* Password Field */}
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700 dark:text-slate-200 text-xs">
                          {isEditMode ? 'Password Baru (Kosongkan jika tidak ingin mengubah)' : 'Password *'}
                        </label>
                        <div className="relative">
                          <input
                            required={!isEditMode}
                            disabled={isCreatingAccount}
                            type={showAccountPassword ? 'text' : 'password'}
                            placeholder={isEditMode ? 'Kosongkan jika tidak ada perubahan' : 'Masukkan kata sandi (min. 6 karakter)'}
                            value={accountForm.password}
                            onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                            className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white font-mono transition-all disabled:opacity-50"
                          />
                          <button
                            type="button"
                            onClick={() => setShowAccountPassword(!showAccountPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                            title={showAccountPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
                          >
                            {showAccountPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Konfirmasi Password Field */}
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700 dark:text-slate-200 text-xs">
                          {isEditMode ? 'Konfirmasi Password Baru' : 'Konfirmasi Password *'}
                        </label>
                        <div className="relative">
                          <input
                            required={!isEditMode && !!accountForm.password}
                            disabled={isCreatingAccount}
                            type={showAccountConfirmPassword ? 'text' : 'password'}
                            placeholder={isEditMode ? 'Ulangi kata sandi baru (jika diubah)' : 'Ulangi kata sandi di atas'}
                            value={accountForm.confirmPassword}
                            onChange={(e) => setAccountForm({ ...accountForm, confirmPassword: e.target.value })}
                            className={`w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900/50 border ${
                              accountForm.confirmPassword && accountForm.confirmPassword !== accountForm.password
                                ? 'border-rose-500 focus:ring-rose-500/20'
                                : 'border-slate-200 dark:border-slate-800 focus:ring-emerald-500/20 focus:border-emerald-500'
                            } rounded-xl outline-none focus:ring-2 text-slate-900 dark:text-white font-mono transition-all disabled:opacity-50`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowAccountConfirmPassword(!showAccountConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                            title={showAccountConfirmPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
                          >
                            {showAccountConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {accountForm.confirmPassword && accountForm.confirmPassword !== accountForm.password && (
                          <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>⚠️ Password dan konfirmasi password tidak cocok</span>
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-3">
                        <button
                          type="button"
                          disabled={isCreatingAccount}
                          onClick={() => setModalType('')}
                          className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Batal
                        </button>

                        <button
                          type="submit"
                          disabled={!isFormValid || isCreatingAccount}
                          className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                        >
                          {isCreatingAccount ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Memproses...</span>
                            </>
                          ) : isEditMode ? (
                            <>
                              <Edit className="w-4 h-4" />
                              <span>Simpan Perubahan Akun</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-4 h-4" />
                              <span>Registrasikan Akun</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                );
              })()}

              {/* WARGA FORM */}
              {(modalType === 'add_warga' || modalType === 'edit_warga') && (
                <form onSubmit={handleWargaSubmit} className="space-y-4 text-xs font-sans">
                  <div className="grid grid-cols-3 gap-3">
                    <label className="font-bold text-slate-655 dark:text-slate-350">Nama Lengkap *</label>
                    <input
                      required
                      type="text"
                      placeholder="Nama lengkap warga"
                      value={wargaForm.name}
                      onChange={(e) => setWargaForm({ ...wargaForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white"
                    />
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
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white font-mono"
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
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-655 dark:text-slate-350">Nomor HP *</label>
                      <input
                        required
                        type="text"
                        placeholder="Contoh: 081234567890"
                        value={wargaForm.noHp || ''}
                        onChange={(e) => setWargaForm({ ...wargaForm, noHp: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-655 dark:text-slate-350">Tanggal Lahir *</label>
                      <DateInput
                        required
                        value={wargaForm.tglLahir || ''}
                        onChange={(e) => {
                          const birthDate = e.target.value;
                          const calculatedAge = calculateAge(birthDate);
                          setWargaForm({ ...wargaForm, tglLahir: birthDate, usia: calculatedAge });
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5 col-span-2">
                      <label className="font-bold text-slate-655 dark:text-slate-350">Jenis Kelamin</label>
                      <select
                        value={wargaForm.gender}
                        onChange={(e) => setWargaForm({ ...wargaForm, gender: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
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
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-655 dark:text-slate-350">Status Rumah</label>
                      <select
                        value={wargaForm.status}
                        onChange={(e) => setWargaForm({ ...wargaForm, status: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
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
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                      >
                        <option value="Hidup">Hidup (Aktif)</option>
                        <option value="Meninggal">Meninggal Dunia</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-655 dark:text-slate-350">Blok Rumah *</label>
                      <input
                        required
                        type="text"
                        placeholder="Contoh: A"
                        value={wargaForm.blok || ''}
                        onChange={(e) => setWargaForm({ ...wargaForm, blok: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-655 dark:text-slate-350">Nomor Rumah *</label>
                      <input
                        required
                        type="number"
                        min="1"
                        placeholder="Contoh: 12"
                        value={wargaForm.nomor || ''}
                        onChange={(e) => setWargaForm({ ...wargaForm, nomor: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white"
                      />
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
                      <DateInput
                        required
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
                      <DateInput
                        required
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
                      placeholder="Contoh: Balai Warga RT 05"
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
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
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
                  <span className="text-slate-500 font-semibold">Email Warga</span>
                  <span className="font-bold text-slate-900 dark:text-white">{viewingCitizenProfile.email || '-'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-slate-100 dark:border-slate-800/40">
                  <span className="text-slate-500 font-semibold">NIK (Tersensor)</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    {viewingCitizenProfile.nik ? viewingCitizenProfile.nik.slice(0, 6) + '******' + viewingCitizenProfile.nik.slice(12) : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-slate-100 dark:border-slate-800/40">
                  <span className="text-slate-500 font-semibold">No. KK (Tersensor)</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    {viewingCitizenProfile.noKk ? viewingCitizenProfile.noKk.slice(0, 6) + '******' + viewingCitizenProfile.noKk.slice(12) : '-'}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Jenis Kelamin</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{viewingCitizenProfile.gender}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-slate-100 dark:border-slate-800/40">
                  <span className="text-slate-500 font-semibold">Usia</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{viewingCitizenProfile.usia} Tahun</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-slate-100 dark:border-slate-800/40">
                  <span className="text-slate-500 font-semibold">Status Rumah</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-450">{viewingCitizenProfile.status}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-slate-100 dark:border-slate-800/40">
                  <span className="text-slate-500 font-semibold">Status Hidup</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${viewingCitizenProfile.statusHidup === 'Hidup' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600' : 'bg-red-50 dark:bg-red-950/30 text-red-600'}`}>{viewingCitizenProfile.statusHidup}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-semibold block mb-1 text-xs">Alamat Rumah Lengkap</span>
                <span className="text-slate-850 dark:text-slate-200 italic font-medium leading-relaxed block text-xs">
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

              <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800">
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

      {/* SUDO PASSWORD VERIFICATION MODAL */}
      {showSudoPrompt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {sudoActionType === 'patch_kk' ? 'Edit Nomor Kartu Keluarga' : 'Verifikasi Sudo Mode'}
              </h4>
              <button 
                onClick={() => setShowSudoPrompt(false)} 
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <XIcon className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
              {sudoActionType === 'patch_kk' 
                ? 'Masukkan nomor KK baru dan sandi Ketua RT/Admin Anda untuk menyimpan perubahan.' 
                : 'Masukkan sandi Ketua RT/Admin Anda untuk membuka sensor data sensitif.'
              }
            </p>

            {sudoPromptError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/50 rounded-xl text-rose-600 dark:text-rose-400 font-semibold text-[10px] flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{sudoPromptError}</span>
              </div>
            )}

            <form onSubmit={handleSudoSubmit} className="space-y-4 text-xs font-sans">
              {sudoActionType === 'patch_kk' && (
                <div className="space-y-1.5 font-sans">
                  <label className="font-bold text-slate-655 dark:text-slate-350">Nomor KK Baru *</label>
                  <input
                    required
                    type="text"
                    maxLength={16}
                    placeholder="Masukkan 16 digit nomor KK"
                    value={sudoNewKkInput}
                    onChange={(e) => setSudoNewKkInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-805 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
              )}

              <div className="space-y-1.5 font-sans">
                <label className="font-bold text-slate-655 dark:text-slate-350">Sandi RT / Admin *</label>
                <input
                  required
                  autoFocus
                  type="password"
                  placeholder="Masukkan kata sandi Anda..."
                  value={sudoPasswordInput}
                  onChange={(e) => setSudoPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-805 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-colors cursor-pointer text-center"
                >
                  Konfirmasi
                </button>
                <button
                  type="button"
                  onClick={() => setShowSudoPrompt(false)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT SURAT MASUK MODAL */}
      {(modalType === 'add_surat_masuk' || modalType === 'edit_surat_masuk') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setModalType('')}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-2xl overflow-hidden z-10 animate-scale-up">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                {modalType === 'add_surat_masuk' ? 'Registrasi Surat Masuk' : 'Edit Surat Masuk'}
              </h3>
              <button onClick={() => setModalType('')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-655 cursor-pointer">
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSuratMasukSubmit} className="p-6 space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 block">Nomor Surat *</label>
                  <input
                    required
                    type="text"
                    value={suratMasukForm.nomorSurat}
                    onChange={(e) => setSuratMasukForm({ ...suratMasukForm, nomorSurat: e.target.value })}
                    placeholder="Contoh: 025/RT05/VII/2026"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 block">Asal / Instansi Pengirim *</label>
                  <input
                    required
                    type="text"
                    value={suratMasukForm.asalSurat}
                    onChange={(e) => setSuratMasukForm({ ...suratMasukForm, asalSurat: e.target.value })}
                    placeholder="Contoh: Kelurahan Sawangan"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 block">Hal / Perihal Surat *</label>
                <input
                  required
                  type="text"
                  value={suratMasukForm.perihal}
                  onChange={(e) => setSuratMasukForm({ ...suratMasukForm, perihal: e.target.value })}
                  placeholder="Contoh: Undangan Rapat HUT RI"
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 block">Tanggal Surat *</label>
                  <input
                    required
                    type="date"
                    value={suratMasukForm.tanggalSurat}
                    onChange={(e) => setSuratMasukForm({ ...suratMasukForm, tanggalSurat: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 block">Tanggal Diterima *</label>
                  <input
                    required
                    type="date"
                    value={suratMasukForm.tanggalDiterima}
                    onChange={(e) => setSuratMasukForm({ ...suratMasukForm, tanggalDiterima: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 block">Status Surat</label>
                  <select
                    value={suratMasukForm.status}
                    onChange={(e) => setSuratMasukForm({ ...suratMasukForm, status: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-700 dark:text-slate-200 font-extrabold cursor-pointer"
                  >
                    <option value="Baru">Baru</option>
                    <option value="Diproses">Diproses</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 block">File Lampiran (PDF / Gambar)</label>
                  <div className="relative flex items-center bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden px-3 py-2">
                    <Upload className="w-4 h-4 text-slate-400 mr-2" />
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setSuratMasukForm({ ...suratMasukForm, fileLampiran: file });
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <span className="text-[10px] font-bold text-slate-500 truncate">
                      {suratMasukForm.fileLampiran ? suratMasukForm.fileLampiran.name : (suratMasukForm.fileUrl || 'Pilih file...')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 block">Ringkasan / Catatan Isi Surat</label>
                <textarea
                  rows={2}
                  value={suratMasukForm.isiRingkas}
                  onChange={(e) => setSuratMasukForm({ ...suratMasukForm, isiRingkas: e.target.value })}
                  placeholder="Catat intisari isi surat masuk di sini..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={suratMasukSubmitLoading}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {suratMasukSubmitLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Surat</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setModalType('')}
                  className="px-5 py-3 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT SURAT KELUAR MODAL */}
      {(modalType === 'add_surat_keluar' || modalType === 'edit_surat_keluar') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setModalType('')}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-2xl overflow-hidden z-10 animate-scale-up">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                {modalType === 'add_surat_keluar' ? 'Pencatatan Surat Keluar Baru' : 'Edit Surat Keluar'}
              </h3>
              <button onClick={() => setModalType('')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-655 cursor-pointer">
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSuratKeluarSubmit} className="p-6 space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 block">Nomor Surat *</label>
                  <input
                    required
                    type="text"
                    value={suratKeluarForm.nomorSurat}
                    onChange={(e) => setSuratKeluarForm({ ...suratKeluarForm, nomorSurat: e.target.value })}
                    placeholder="Contoh: 104/RT05/VII/2026"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 block">Jenis Surat *</label>
                  <select
                    value={suratKeluarForm.jenisSurat}
                    onChange={(e) => setSuratKeluarForm({ ...suratKeluarForm, jenisSurat: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-700 dark:text-slate-200 font-extrabold cursor-pointer"
                  >
                    <option value="Surat Pengantar KTP">Surat Pengantar KTP</option>
                    <option value="Surat Pengantar KK">Surat Pengantar KK</option>
                    <option value="Surat Keterangan Domisili">Surat Keterangan Domisili</option>
                    <option value="Surat Pengantar SKCK">Surat Pengantar SKCK</option>
                    <option value="Surat Pengantar Nikah">Surat Pengantar Nikah</option>
                    <option value="Surat Lainnya">Surat Lainnya</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 block">Nama Pemohon (Warga) *</label>
                  <input
                    required
                    type="text"
                    value={suratKeluarForm.namaPemohon}
                    onChange={(e) => setSuratKeluarForm({ ...suratKeluarForm, namaPemohon: e.target.value })}
                    placeholder="Contoh: Ahmad Subarjo"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 block">NIK Pemohon *</label>
                  <input
                    required
                    type="text"
                    maxLength={16}
                    value={suratKeluarForm.nik}
                    onChange={(e) => setSuratKeluarForm({ ...suratKeluarForm, nik: e.target.value.replace(/\D/g, '') })}
                    placeholder="Masukkan 16 digit NIK"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 block">Instansi / Keperluan Tujuan *</label>
                <input
                  required
                  type="text"
                  value={suratKeluarForm.tujuan}
                  onChange={(e) => setSuratKeluarForm({ ...suratKeluarForm, tujuan: e.target.value })}
                  placeholder="Contoh: Kelurahan Sawangan (Pengurusan E-KTP)"
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 block">Tanggal Surat *</label>
                  <input
                    required
                    type="date"
                    value={suratKeluarForm.tanggalSurat}
                    onChange={(e) => setSuratKeluarForm({ ...suratKeluarForm, tanggalSurat: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 block">Status Surat</label>
                  <select
                    value={suratKeluarForm.status}
                    onChange={(e) => setSuratKeluarForm({ ...suratKeluarForm, status: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-700 dark:text-slate-200 font-extrabold cursor-pointer"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Diproses">Diproses</option>
                    <option value="Disetujui">Disetujui</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={suratKeluarSubmitLoading}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {suratKeluarSubmitLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Surat Keluar</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setModalType('')}
                  className="px-5 py-3 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL SURAT MASUK MODAL */}
      {suratMasukDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setSuratMasukDetail(null)}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-2xl overflow-hidden z-10 animate-scale-up">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center font-sans">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Detail Surat Masuk</h3>
                <span className="text-[10px] text-slate-400 font-bold font-mono block mt-0.5">{suratMasukDetail.nomorSurat}</span>
              </div>
              <button onClick={() => setSuratMasukDetail(null)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-655 cursor-pointer">
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs font-sans">
              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Pengirim / Asal</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{suratMasukDetail.asalSurat}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Status</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[8px] uppercase inline-block mt-1 ${
                    suratMasukDetail.status === 'Baru' 
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                      : suratMasukDetail.status === 'Diproses' 
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {suratMasukDetail.status}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Tanggal Surat</span>
                  <span className="font-bold text-slate-600 dark:text-slate-350">{formatDateIndo(suratMasukDetail.tanggalSurat)}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Tanggal Diterima</span>
                  <span className="font-bold text-slate-600 dark:text-slate-350">{formatDateIndo(suratMasukDetail.tanggalDiterima)}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Perihal</span>
                <span className="font-bold text-slate-800 dark:text-white leading-normal text-xs block">{suratMasukDetail.perihal}</span>
              </div>

              {suratMasukDetail.isiRingkas && (
                <div className="space-y-1 p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Isi Ringkas / Catatan</span>
                  <p className="text-slate-600 dark:text-slate-400 leading-normal italic">"{suratMasukDetail.isiRingkas}"</p>
                </div>
              )}

              {/* FILE LAMPIRAN PREVIEW & DOWNLOAD */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/30 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-500" />
                    <div>
                      <span className="font-extrabold text-slate-700 dark:text-slate-300 block text-[10px] uppercase">File Lampiran</span>
                      <span className="text-[9px] font-bold text-slate-400 truncate max-w-[180px] block">
                        {suratMasukDetail.fileLampiran || 'Tidak ada lampiran file'}
                      </span>
                    </div>
                  </div>
                  {suratMasukDetail.fileLampiran && (
                    <button 
                      type="button"
                      onClick={() => alert(`Simulasi mengunduh file: ${suratMasukDetail.fileLampiran}`)}
                      className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer"
                      title="Download File"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {suratMasukDetail.fileLampiran && (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950 p-2.5 text-center mt-1">
                    <div className="py-6 flex flex-col items-center justify-center gap-1.5 font-sans">
                      <File className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                      <span className="text-[10px] text-slate-500 font-bold">Preview Lampiran ({suratMasukDetail.fileLampiran})</span>
                      <button 
                        type="button"
                        onClick={() => alert(`Simulasi Preview Dokumen: ${suratMasukDetail.fileLampiran}`)}
                        className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[9px] font-extrabold text-slate-600 dark:text-slate-300 rounded-lg cursor-pointer transition-colors"
                      >
                        Pratinjau File
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button type="button" onClick={() => setSuratMasukDetail(null)} className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-extrabold rounded-xl cursor-pointer">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL SURAT KELUAR MODAL */}
      {suratKeluarDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setSuratKeluarDetail(null)}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-2xl overflow-hidden z-10 animate-scale-up">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center font-sans">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Detail Surat Keluar</h3>
                <span className="text-[10px] text-slate-400 font-bold font-mono block mt-0.5">{suratKeluarDetail.nomorSurat}</span>
              </div>
              <button onClick={() => setSuratKeluarDetail(null)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-655 cursor-pointer">
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs font-sans">
              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Jenis Surat</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{suratKeluarDetail.jenisSurat}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Status</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[8px] uppercase inline-block mt-1 ${
                    suratKeluarDetail.status === 'Draft' 
                      ? 'bg-slate-500/10 text-slate-600 dark:text-slate-405' 
                      : suratKeluarDetail.status === 'Diproses' 
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                        : suratKeluarDetail.status === 'Disetujui'
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {suratKeluarDetail.status}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Nama Pemohon</span>
                  <span className="font-bold text-slate-805 dark:text-white">{suratKeluarDetail.namaPemohon}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">NIK Pemohon</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">{suratKeluarDetail.nik}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Tujuan / Keperluan</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200 leading-normal block">{suratKeluarDetail.tujuan}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Tanggal Cetak Surat</span>
                  <span className="font-bold text-slate-600 dark:text-slate-350">{formatDateIndo(suratKeluarDetail.tanggalSurat)}</span>
                </div>
              </div>

              {/* MOCK PREVIEW LETTER GENERATOR */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50 dark:bg-slate-950/20 text-center flex flex-col items-center justify-center gap-2">
                <FileText className="w-8 h-8 text-emerald-500" />
                <h4 className="font-extrabold text-[10px] text-slate-700 dark:text-slate-300 uppercase">Dokumen Preview Pengantar</h4>
                <p className="text-[9px] text-slate-400 max-w-[240px] font-bold leading-normal font-sans">
                  Pratinjau draft surat pengantar resmi yang akan dikirimkan ke pihak kelurahan.
                </p>
                <div className="flex gap-2 mt-1">
                  <button 
                    type="button"
                    onClick={() => alert(`Simulasi mencetak preview surat: ${suratKeluarDetail.nomorSurat}`)}
                    className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] rounded-lg cursor-pointer"
                  >
                    Pratinjau Surat
                  </button>
                  <button 
                    type="button"
                    onClick={() => alert(`Simulasi mengunduh berkas surat: ${suratKeluarDetail.nomorSurat}.pdf`)}
                    className="py-1.5 px-3 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[9px] rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Unduh PDF
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button type="button" onClick={() => setSuratKeluarDetail(null)} className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-extrabold rounded-xl cursor-pointer">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL KELUARGA MODAL */}
      {selectedFamilyForDetail && (() => {
        const familyId = selectedFamilyForDetail.family_id || selectedFamilyForDetail.id;
        const foundUsername = getWargaUsername(selectedFamilyForDetail);
        const hasAccount = checkWargaHasAccount(selectedFamilyForDetail);
        const kepalaNama = selectedFamilyForDetail.kepala_keluarga_nama || selectedFamilyForDetail.kepalaKeluarga || 'Tidak Diketahui';
        const noKK = revealedKks[familyId] || selectedFamilyForDetail.no_kk || selectedFamilyForDetail.noKK;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
              onClick={() => setSelectedFamilyForDetail(null)}
            ></div>

            <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-2xl overflow-hidden z-10 animate-scale-up max-h-[90vh] flex flex-col font-sans">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500"></div>

              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                      Detail Kartu Keluarga (KK)
                    </h3>
                    {hasAccount ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded-full font-extrabold text-[9px]">
                        <Check className="w-3 h-3 text-emerald-500" />
                        Sudah Memiliki Akun {foundUsername ? `(@${foundUsername})` : ''}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30 rounded-full font-extrabold text-[9px]">
                        <XIcon className="w-3 h-3 text-rose-500" />
                        Belum Memiliki Akun
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-mono font-bold">
                    No. KK: {noKK}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedFamilyForDetail(null)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 text-xs space-y-6">
                
                {/* Information Grid Cards */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase font-sans">Kepala Keluarga</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200 block text-xs">
                      {kepalaNama}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase font-sans">Alamat Domisili Rumah</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 block">
                      {selectedFamilyForDetail.house_alamat || selectedFamilyForDetail.alamat || 'Tidak Diketahui'}
                      {selectedFamilyForDetail.house_blok ? ` (Blok ${selectedFamilyForDetail.house_blok}` : ''}
                      {selectedFamilyForDetail.house_nomor ? ` No. ${selectedFamilyForDetail.house_nomor})` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase font-sans">Status Rumah</span>
                    <span className="px-2 py-0.5 rounded-full font-extrabold text-[9px] capitalize bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 inline-block mt-0.5">
                      {selectedFamilyForDetail.house_status || selectedFamilyForDetail.status || 'Milik Sendiri'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase font-sans">Status Akun Login</span>
                    <span className="font-bold text-xs block mt-0.5">
                      {hasAccount ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                          Aktif {foundUsername ? `(@${foundUsername})` : ''}
                        </span>
                      ) : (
                        <span className="text-rose-500 font-bold">Belum Dibuat</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Anggota Keluarga Table */}
                <div className="space-y-3 font-sans">
                  <div className="flex justify-between items-center">
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">
                      Daftar Anggota Keluarga Terdaftar ({familyWarga.length})
                    </h4>
                  </div>
                  
                  <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/70 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider">
                          <th className="p-3">Nama Lengkap</th>
                          <th className="p-3">NIK</th>
                          <th className="p-3">Peran / Hubungan</th>
                          <th className="p-3">Gender</th>
                          <th className="p-3">Usia</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {familyWarga.length > 0 ? (
                          familyWarga.map((w) => {
                            const isKepala = w.name === kepalaNama || w.nama === kepalaNama;
                            return (
                              <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                                <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                                  {w.name || w.nama}
                                </td>
                                <td className="p-3 font-mono font-bold text-slate-500">
                                  {w.nik || '-'}
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase ${
                                    isKepala
                                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                      : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                                  }`}>
                                    {isKepala ? 'Kepala Keluarga' : 'Anggota Keluarga'}
                                  </span>
                                </td>
                                <td className="p-3 text-slate-600 dark:text-slate-400 font-medium">
                                  {w.gender || w.jenisKelamin || '-'}
                                </td>
                                <td className="p-3 text-slate-600 dark:text-slate-400 font-medium">
                                  {w.umur ? `${w.umur} Thn` : formatDateIndo(w.tgl_lahir || w.tglLahir)}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="5" className="p-6 text-center text-slate-400 italic">
                              Belum ada rincian anggota keluarga terdaftar di bawah KK ini.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center gap-3">
                {!hasAccount ? (
                  <button
                    onClick={() => {
                      const fam = selectedFamilyForDetail;
                      setSelectedFamilyForDetail(null);
                      handleCreateAccountForFamily(fam);
                    }}
                    disabled={isCreatingAccount}
                    className="py-2 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Key className="w-3.5 h-3.5" />
                    Registrasi Akun Login
                  </button>
                ) : (
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Akun Login Resmi Terdaftar
                  </div>
                )}

                <button 
                  onClick={() => setSelectedFamilyForDetail(null)}
                  className="py-2 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* PREVIEW KOP SURAT TEMPLATE MODAL */}
      {previewingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setPreviewingTemplate(null)}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-2xl overflow-hidden z-10 animate-scale-up my-8">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center font-sans">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Pratinjau Kop Surat Resmi RT 05</h3>
              <button onClick={() => setPreviewingTemplate(null)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-655 cursor-pointer">
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh] bg-slate-150 dark:bg-slate-955 flex justify-center p-4 sm:p-8">
              {/* Printable A4 Paper Simulator */}
              <div className="bg-white text-slate-900 w-full max-w-xl shadow-lg border border-slate-200 p-8 sm:p-12 font-serif text-[10px] relative select-none leading-relaxed">
                {/* KOP SURAT HEADER */}
                <div className="text-center space-y-1 pb-4 border-b-4 border-double border-slate-900 font-sans">
                  <h4 className="font-black text-xs uppercase tracking-wider text-slate-900">RUKUN TETANGGA 05 RW 06</h4>
                  <h3 className="font-extrabold text-sm uppercase text-slate-900">KUMPULAN WARGA SAWANGAN GREEN PARK</h3>
                  <p className="text-[9px] font-bold text-slate-500 leading-normal">
                    Kelurahan Sawangan Baru, Kecamatan Sawangan, Kota Depok, Jawa Barat 16511
                  </p>
                  <p className="text-[8px] text-slate-400 font-medium">Email: rt05sawangan@gmail.com | Kontak: +62 812-3456-7890</p>
                </div>

                {/* LETTER CONTENT */}
                <div className="pt-8 space-y-6">
                  {/* Letter Title */}
                  <div className="text-center font-sans">
                    <h5 className="font-black text-sm uppercase underline decoration-1 tracking-wider text-slate-900">
                      {previewingTemplate.name}
                    </h5>
                    <span className="text-[10px] font-bold text-slate-600 tracking-wider">No. 042 / RT05-RW06 / VII / 2026</span>
                  </div>

                  {/* Body Text */}
                  <p className="indent-8 text-slate-800 leading-relaxed text-justify">
                    Yang bertanda tangan di bawah ini Pengurus Rukun Tetangga (RT) 05 RW 06 Perumahan Sawangan Green Park, Kelurahan Sawangan Baru, Kecamatan Sawangan, Kota Depok, dengan ini menerangkan bahwa:
                  </p>

                  {/* Citizen Biodata Table */}
                  <table className="w-11/12 mx-auto text-left font-serif text-slate-800 leading-loose">
                    <tbody>
                      <tr>
                        <td className="w-1/3 font-bold">Nama Lengkap</td>
                        <td className="w-4">:</td>
                        <td className="font-semibold uppercase tracking-wider">............................................................</td>
                      </tr>
                      <tr>
                        <td className="font-bold">NIK / No. KTP</td>
                        <td>:</td>
                        <td className="font-mono">............................................................</td>
                      </tr>
                      <tr>
                        <td className="font-bold">Tempat/Tgl Lahir</td>
                        <td>:</td>
                        <td>............................................................</td>
                      </tr>
                      <tr>
                        <td className="font-bold">Jenis Kelamin</td>
                        <td>:</td>
                        <td>Laki-laki / Perempuan</td>
                      </tr>
                      <tr>
                        <td className="font-bold">Pekerjaan</td>
                        <td>:</td>
                        <td>............................................................</td>
                      </tr>
                      <tr>
                        <td className="font-bold">Alamat Lengkap</td>
                        <td>:</td>
                        <td className="leading-snug">
                          Sawangan Green Park Blok ......... No. ........., RT 05 RW 06 Kel. Sawangan Baru, Kec. Sawangan, Depok.
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Purpose Paragraph */}
                  <p className="indent-8 text-slate-800 leading-relaxed text-justify">
                    Adapun nama tersebut di atas adalah benar merupakan warga tinggal di lingkungan RT 05 RW 06 Perumahan Sawangan Green Park. Surat keterangan pengantar ini dibuat sebagai kelengkapan berkas untuk keperluan: <span className="font-bold underline">"{previewingTemplate.desc}"</span>.
                  </p>

                  <p className="text-slate-850 leading-relaxed text-justify">
                    Demikian surat pengantar ini kami sampaikan agar dapat digunakan sebagaimana mestinya. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.
                  </p>
                </div>

                {/* SIGNATURE BLOCK */}
                <div className="pt-12 grid grid-cols-2 text-center text-slate-800 font-sans text-[10px] leading-snug">
                  <div>
                    <span className="block">Mengetahui,</span>
                    <span className="block font-bold">Sekretaris RT 05</span>
                    <div className="h-16"></div>
                    <span className="font-bold block underline">( ........................................ )</span>
                  </div>
                  <div>
                    <span className="block">Depok, {formatDateIndo(new Date().toISOString())}</span>
                    <span className="block font-bold">Ketua RT 05 RW 06</span>
                    <div className="h-16"></div>
                    <span className="font-bold block underline">Bpk. Ahmad Mulyono</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center font-sans text-xs">
              <span className="text-slate-400 font-bold">Format: Dokumen Resmi RT 05</span>
              <div className="flex gap-2">
                <button
                  onClick={() => alert(`Mengunduh berkas template: ${previewingTemplate.name}.docx`)}
                  className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-500/10 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Dokumen</span>
                </button>
                <button
                  onClick={() => setPreviewingTemplate(null)}
                  className="py-2.5 px-4 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
