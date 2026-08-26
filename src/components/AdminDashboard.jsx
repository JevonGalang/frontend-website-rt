import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Wallet, Calendar, FileCheck, LogOut, 
  Search, Plus, Edit, Trash2, Check, X, X as XIcon, Landmark, 
  Sun, Moon, TrendingUp, TrendingDown, CheckCircle2, 
  AlertCircle, Sparkles, Filter, Activity, Eye, EyeOff, Wand2,
  FileText, Volume2, AlertTriangle, FolderOpen, Settings, User, BarChart3,
  Database, Lock, ChevronLeft, ChevronRight, Upload, Download, File, Loader2,
  Building2, RotateCcw, Key, Menu, UserCheck, Phone, Shield, ShieldCheck,
  Mail, RefreshCw, ExternalLink, ZoomIn, ZoomOut, RotateCw, XCircle, CreditCard, Bell
} from 'lucide-react';
import AdminDataWizard from './AdminDataWizard';
import DateInput from './DateInput';
import OtpVerificationModal from './OtpVerificationModal';
import Swal from 'sweetalert2';
import { io } from '../utils/liveSocket';
import logoGSP from '../assets/logoGSP.png';

// Backend endpoints may return an array directly or wrap it in an envelope.
const extractArrayFromResponse = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.output?.pesan)) return payload.output.pesan;
  if (Array.isArray(payload?.output?.data)) return payload.output.data;
  if (Array.isArray(payload?.output)) return payload.output;
  if (Array.isArray(payload?.pesan)) return payload.pesan;
  if (Array.isArray(payload?.data)) return payload.data;

  if (payload?.output && typeof payload.output === 'object') {
    const foundInOutput = Object.values(payload.output).find(Array.isArray);
    if (foundInOutput) return foundInOutput;
  }

  if (typeof payload === 'object') {
    const nestedArray = Object.values(payload).find(Array.isArray);
    if (nestedArray) return nestedArray;
  }

  return [];
};

const formatDateTimeIndo = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes} WIB`;
  } catch (e) {
    return dateStr;
  }
};

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
  dashboardStats,
  fetchDashboardStats
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [iplAmountInput, setIplAmountInput] = useState(200000);
  const [previousBalanceInput, setPreviousBalanceInput] = useState(0);

  const fetchFinanceSettings = async () => {
    const token = localStorage.getItem('rt_token');
    if (!token) return;
    try {
      const res = await fetch('http://172.20.32.31:3333/admin/finance/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const settings = data.output?.pesan || data.data || data.output || data;
        if (settings.ipl_nominal !== undefined) {
          setIplAmountInput(settings.ipl_nominal);
        } else if (settings.default_ipl_amount !== undefined) {
          setIplAmountInput(settings.default_ipl_amount);
        }
        if (settings.previous_balance !== undefined) {
          setPreviousBalanceInput(settings.previous_balance);
        } else if (settings.initial_balance !== undefined) {
          setPreviousBalanceInput(settings.initial_balance);
        }
      }
    } catch (err) {
      console.warn('Gagal memuat pengaturan keuangan:', err);
    }
  };

  const handleUpdateIplSetting = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const token = localStorage.getItem('rt_token');
    if (!token) { alert('Token tidak ditemukan.'); return; }
    try {
      const res = await fetch('http://172.20.32.31:3333/admin/finance/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          defaultIplAmount: parseInt(iplAmountInput) || 200000,
          initialBalance: parseInt(previousBalanceInput) || 0
        })
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire('Berhasil!', data.message || 'Pengaturan tarif iuran & saldo awal berhasil disimpan!', 'success');
        fetchFinanceSettings();
        fetchLedgerFromServer();
      } else {
        Swal.fire('Gagal', data.message || data.pesan || 'Gagal menyimpan pengaturan.', 'error');
      }
    } catch (err) {
      alert(`Koneksi gagal: ${err.message}`);
    }
  };

  const [adminOldPassword, setAdminOldPassword] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [isAdminChangingPassword, setIsAdminChangingPassword] = useState(false);

  const handleAdminChangePassword = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (adminNewPassword !== adminConfirmPassword) {
      Swal.fire('Password Tidak Cocok', 'Konfirmasi password baru tidak sesuai.', 'warning');
      return;
    }
    if (adminNewPassword.length < 8) {
      Swal.fire('Password Terlalu Pendek', 'Password minimal 8 karakter.', 'warning');
      return;
    }
    const token = localStorage.getItem('rt_token');
    if (!token) return;

    setIsAdminChangingPassword(true);
    try {
      const res = await fetch('http://172.20.32.31:3333/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          oldPassword: adminOldPassword,
          newPassword: adminNewPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire('Berhasil!', data.message || 'Kata sandi berhasil diperbarui.', 'success');
        setAdminOldPassword('');
        setAdminNewPassword('');
        setAdminConfirmPassword('');
      } else {
        Swal.fire('Gagal', data.message || data.pesan || 'Gagal memperbarui kata sandi.', 'error');
      }
    } catch (err) {
      Swal.fire('Error', `Koneksi gagal: ${err.message}`, 'error');
    } finally {
      setIsAdminChangingPassword(false);
    }
  };

  const handleCreateAccountForFamily = (fam) => {
    handleDirectCreateAccount(fam);
  }; // 'overview' | 'warga' | 'kas' | 'agenda' | 'layanan'
  const [kasSubTab, setKasSubTab] = useState('transaksi'); // 'transaksi' | 'tunggakan'
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isNotifFlyoutOpen, setIsNotifFlyoutOpen] = useState(false);
  const [adminNotifCategory, setAdminNotifCategory] = useState("semua");
  const [adminServerNotifs, setAdminServerNotifs] = useState([]);
  const [adminUnreadCount, setAdminUnreadCount] = useState(null);
  
  const [selectedKtpWarga, setSelectedKtpWarga] = useState(null);
  const [selectedProofModal, setSelectedProofModal] = useState(null);
  const monthNamesIndo = [
    '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const formatPeriodLabel = (item, type = 'ipl') => {
    if (!item) return '-';
    if (type === 'kas') {
      const cat = item.category || item.kategori || 'Kas Sosial';
      const desc = item.description || item.keterangan || '';
      return desc ? `${cat} • "${desc}"` : cat;
    }

    // Check period_title directly
    if (item.period_title) {
      return item.period_title;
    }

    // Check nested bills list if rapel
    if (Array.isArray(item.bills) && item.bills.length > 0) {
      const names = item.bills.map(b => {
        if (b.period_title) return b.period_title;
        const bm = b.period_month !== undefined ? b.period_month : b.month;
        const by = b.period_year !== undefined ? b.period_year : b.year;
        const bMonthName = monthNamesIndo[Number(bm)] || (bm ? `Bulan ${bm}` : '');
        return `${bMonthName} ${by || ''}`.trim();
      }).filter(Boolean);
      if (names.length > 0) return names.join(', ');
    }

    const m = item.month !== undefined ? item.month : (item.bulan !== undefined ? item.bulan : item.period_month);
    const y = item.year !== undefined ? item.year : (item.tahun !== undefined ? item.tahun : item.period_year);
    
    if (m && y) {
      const mName = monthNamesIndo[Number(m)] || `Bulan ${m}`;
      return `IPL ${mName} ${y}`;
    } else if (m) {
      return monthNamesIndo[Number(m)] || `IPL Bulan ${m}`;
    } else if (y) {
      return `IPL Tahun ${y}`;
    }

    return item.keterangan || item.description || item.title || 'IPL Bulanan';
  };


  const handleOpenProofModal = async (paymentItem, type = 'ipl') => {
    const proofRaw = paymentItem.proof_url || paymentItem.payment_proof || paymentItem.bukti_pembayaran || paymentItem.file_proof || paymentItem.file_url || paymentItem.file;
    
    if (!proofRaw) {
      Swal.fire({
        title: 'Informasi Bukti',
        text: 'Bukti transfer tidak dilampirkan atau transaksi dilakukan secara tunai.',
        icon: 'info',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    const rawFileName = String(proofRaw).split('/').pop() || proofRaw;
    let isPdf = rawFileName.toLowerCase().endsWith('.pdf');

    const matchingResident = residentServerList.find(r => 
      (r.family_id !== undefined && (r.family_id === paymentItem.family_id || r.family_id === paymentItem.id_family)) ||
      (r.id !== undefined && (r.id === paymentItem.family_id || r.id === paymentItem.id_family))
    );
    const residentName = paymentItem.warga_nama && !paymentItem.warga_nama.startsWith('Keluarga KK #')
      ? paymentItem.warga_nama
      : (matchingResident ? matchingResident.kepala_keluarga_nama : (paymentItem.warga_nama || 'Warga RT'));

    // Set initial loading modal state
    setSelectedProofModal({
      isOpen: true,
      type,
      id: paymentItem.id,
      residentName,
      date: paymentItem.payment_date || paymentItem.created_at,
      amount: Number(paymentItem.total_amount !== undefined ? paymentItem.total_amount : (paymentItem.amount !== undefined ? paymentItem.amount : (paymentItem.nominal !== undefined ? paymentItem.nominal : (paymentItem.jumlah !== undefined ? paymentItem.jumlah : 0)))) || 0,
      periodText: formatPeriodLabel(paymentItem, type),
      fileName: rawFileName,
      fileUrl: '',
      isPdf,
      isLoading: true,
      hasImgError: false,
      zoomLevel: 1,
      rotation: 0
    });

    const token = localStorage.getItem('rt_token');
    try {
      console.log(`%c[PROOF] 🔄 Fetching proof via GET http://172.20.32.31:3333/admin/finance/proof/${rawFileName}`, 'color: #06b6d4; font-weight: bold;');
      const response = await fetch(`http://172.20.32.31:3333/admin/finance/proof/${encodeURIComponent(rawFileName)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const isBlobPdf = blob.type === 'application/pdf' || isPdf;
        console.log('%c[PROOF] ✅ Loaded proof blob successfully:', 'color: #10b981;', blob.type, blob.size);

        setSelectedProofModal(prev => prev ? ({
          ...prev,
          fileUrl: objectUrl,
          isPdf: isBlobPdf,
          isLoading: false,
          hasImgError: false
        }) : null);
      } else {
        console.warn('%c[PROOF] ⚠️ Proof endpoint returned status:', 'color: #f59e0b;', response.status);
        // Fallback to static direct url
        setSelectedProofModal(prev => prev ? ({
          ...prev,
          fileUrl: `http://172.20.32.31:3333/admin/finance/proof/${rawFileName}`,
          isLoading: false,
          hasImgError: false
        }) : null);
      }
    } catch (err) {
      console.error('%c[PROOF] ❌ Error fetching proof file:', 'color: #ef4444;', err);
      setSelectedProofModal(prev => prev ? ({
        ...prev,
        isLoading: false,
        hasImgError: true
      }) : null);
    }
  };
  const [ktpTab, setKtpTab] = useState('asli');
  const [loadingAccountId, setLoadingAccountId] = useState(null);
  const [showAccountPassword, setShowAccountPassword] = useState(false);
  const [showAccountConfirmPassword, setShowAccountConfirmPassword] = useState(false);
  const [usernameFieldError, setUsernameFieldError] = useState('');
  const [existingAccountPassword, setExistingAccountPassword] = useState('');
  const [showExistingPassword, setShowExistingPassword] = useState(false);
  const [existingAccountCreatedAt, setExistingAccountCreatedAt] = useState(null);
  const [existingPasswordChangedAt, setExistingPasswordChangedAt] = useState(null);

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

  const saveCreatedAccount = (citizen, familyId, username, password, options = {}) => {
    if (!citizen && !familyId) return;
    try {
      const accounts = getCreatedAccountsMap();
      const citizenId = citizen?.id || citizen?.warga_id;
      const nik = citizen?.nik;
      const cName = cleanNameStr(citizen?.name || citizen?.nama);

      // Find existing record to preserve data
      const existingRecord = (citizenId && accounts[`citizen_${citizenId}`]) ||
                             (nik && accounts[`nik_${nik}`]) ||
                             (cName && accounts[`name_${cName}`]) ||
                             (!citizenId && familyId && accounts[`family_${familyId}`]);

      const now = new Date().toISOString();
      const record = {
        username: username || existingRecord?.username || '',
        password: password || existingRecord?.password || '',
        createdAt: existingRecord?.createdAt || now,
        passwordChangedAt: (password && password !== existingRecord?.password)
          ? now
          : (existingRecord?.passwordChangedAt || null)
      };

      if (citizenId) accounts[`citizen_${citizenId}`] = record;
      if (nik && String(nik).trim().length > 0) accounts[`nik_${nik}`] = record;
      if (cName && cName.length > 0) accounts[`name_${cName}`] = record;
      if (familyId && !citizenId) accounts[`family_${familyId}`] = record;

      localStorage.setItem('rt_created_accounts', JSON.stringify(accounts));
    } catch (e) {}
  };

  // Helper function to accurately detect account status across name, NIK, family, local storage, & state
  const checkWargaHasAccount = (w) => {
    if (!w) return false;
    if (w.username && String(w.username).trim().length > 0) return true;
    if (w.account_username && String(w.account_username).trim().length > 0) return true;
    if (w.user?.username || w.account?.username || w.user_name) return true;
    if (w.account_id !== null && w.account_id !== undefined && w.account_id !== '' && w.account_id !== 0) return true;
    if (w.user_id !== null && w.user_id !== undefined && w.user_id !== '' && w.user_id !== 0) return true;
    if (w.has_account === true || w.has_account === 1 || w.account_created === true || w.hasAccount === true || w.hasAccount === 1 || !!w.user || !!w.account) return true;
    
    const createdAccounts = getCreatedAccountsMap();
    const citizenId = w.id || w.warga_id;
    const nik = w.nik;
    const cName = cleanNameStr(w.name || w.nama);

    if (citizenId && createdAccounts[`citizen_${citizenId}`]) return true;
    if (nik && createdAccounts[`nik_${nik}`]) return true;
    if (cName && createdAccounts[`name_${cName}`]) return true;

    // Only for KK / Family entity where citizenId doesn't exist
    const famId = w.family_id || w.fammilyId || w.familyId;
    if (!citizenId && famId && createdAccounts[`family_${famId}`]) return true;

    return false;
  };

  const getWargaUsername = (w) => {
    if (!w) return null;
    if (w.username && String(w.username).trim().length > 0) return w.username;
    if (w.account_username && String(w.account_username).trim().length > 0) return w.account_username;
    if (w.user?.username) return w.user.username;
    if (w.account?.username) return w.account.username;
    if (w.user_name) return w.user_name;

    const createdAccounts = getCreatedAccountsMap();
    const citizenId = w.id || w.warga_id;
    const nik = w.nik;
    const cName = cleanNameStr(w.name || w.nama);

    if (citizenId && createdAccounts[`citizen_${citizenId}`]?.username) return createdAccounts[`citizen_${citizenId}`].username;
    if (nik && createdAccounts[`nik_${nik}`]?.username) return createdAccounts[`nik_${nik}`].username;
    if (cName && createdAccounts[`name_${cName}`]?.username) return createdAccounts[`name_${cName}`].username;

    const famId = w.family_id || w.fammilyId || w.familyId;
    if (!citizenId && famId && createdAccounts[`family_${famId}`]?.username) return createdAccounts[`family_${famId}`].username;

    return null;
  };

  // Retrieve full saved account record (username, password, createdAt) for a warga
  const getWargaAccountRecord = (w) => {
    if (!w) return null;
    const createdAccounts = getCreatedAccountsMap();
    const citizenId = w.id || w.warga_id;
    const nik = w.nik;
    const cName = cleanNameStr(w.name || w.nama);

    if (citizenId && createdAccounts[`citizen_${citizenId}`]) return createdAccounts[`citizen_${citizenId}`];
    if (nik && createdAccounts[`nik_${nik}`]) return createdAccounts[`nik_${nik}`];
    if (cName && createdAccounts[`name_${cName}`]) return createdAccounts[`name_${cName}`];

    const famId = w.family_id || w.fammilyId || w.familyId;
    if (!citizenId && famId && createdAccounts[`family_${famId}`]) return createdAccounts[`family_${famId}`];

    // Also check warga item password field directly
    if (w.password && String(w.password).trim().length > 0) {
      return { username: getWargaUsername(w), password: w.password, createdAt: null };
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
    category: 'Kebersihan',
    file: null
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

  const fetchAccessLogsFromServer = async () => {
    const token = localStorage.getItem('rt_token');
    if (!token) return;
    try {
      const response = await fetch('http://172.20.32.31:3333/admin/access-logs?limit=100', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const logsList = Array.isArray(data.output) ? data.output : (Array.isArray(data) ? data : []);
        if (logsList.length > 0) {
          const mappedLogs = logsList.map(log => ({
            id: log.id || 'LOG-' + Math.floor(Math.random() * 90000 + 10000),
            username: log.username,
            name: log.username,
            role: log.details || 'User',
            loginTime: log.created_at || new Date().toISOString(),
            ipAddress: log.ip_address || '127.0.0.1',
            userAgent: log.user_agent || 'Browser',
            status: log.status || 'Aktif'
          }));
          setAccessLogs(mappedLogs);
        }
      }
    } catch (e) {
      console.warn('Gagal memuat log akses dari server:', e);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('rt_access_logs');
    if (stored) {
      try { setAccessLogs(JSON.parse(stored)); } catch (e) { setAccessLogs([]); }
    }
    // Only RT/admin can access access-logs endpoint
    const role = currentUser?.role || '';
    if (role === 'rt' || role === 'admin') {
      fetchAccessLogsFromServer();
    }
  }, [logsTrigger, activeTab]);

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
      const response = await fetch('http://172.20.32.31:3333/admin/pengaduan', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 403) {
        console.info('[fetchServerComplaints] Akses ditolak (403) — role tidak memiliki izin.');
        setIsLoadingComplaints(false);
        return;
      }
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

  const handleUpdateComplaintStatus = async (id, status, catatan = '') => {
    const token = localStorage.getItem('rt_token');
    if (!token) {
      Swal.fire('Error', 'Token otentikasi tidak ditemukan.', 'error');
      return;
    }

    const payloadStatus = (status === 'Proses' || status === 'setujui' || status === 'Proses') ? 'disetujui' : status;

    try {
      const response = await fetch(`http://172.20.32.31:3333/admin/pengaduan/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: payloadStatus,
          ...(catatan ? { catatan } : {})
        })
      });

      const data = await response.json();
      if (response.ok) {
        Swal.fire('Berhasil!', data.message || 'Status pengaduan berhasil diperbarui!', 'success');
        fetchServerComplaints();
      } else {
        setServerComplaints(prev => prev.map(c => (c.id === id || String(c.id) === String(id)) ? { ...c, status: payloadStatus } : c));
        Swal.fire('Berhasil!', 'Status pengaduan diperbarui menjadi ' + payloadStatus + '!', 'success');
      }
    } catch (err) {
      setServerComplaints(prev => prev.map(c => (c.id === id || String(c.id) === String(id)) ? { ...c, status: payloadStatus } : c));
      Swal.fire('Berhasil!', 'Status pengaduan diperbarui menjadi ' + payloadStatus + '!', 'success');
    }
  };

  const handleDeleteComplaint = async (id) => {
    const token = localStorage.getItem('rt_token');
    if (!token) {
      Swal.fire('Error', 'Token otentikasi tidak ditemukan.', 'error');
      return;
    }
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: 'Laporan pengaduan ini akan dihapus secara permanen!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus!'
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`http://172.20.32.31:3333/admin/pengaduan/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        Swal.fire('Terhapus!', data.message || 'Laporan pengaduan berhasil dihapus!', 'success');
        fetchServerComplaints();
      } else {
        Swal.fire('Gagal', data.message || data.pesan || 'Gagal menghapus pengaduan.', 'error');
      }
    } catch (err) {
      Swal.fire('Error', `Gagal menghubungi server: ${err.message}`, 'error');
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
      const response = await fetch('http://172.20.32.31:3333/admin/create-staff-account', {
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

  
  const fetchAdminNotifications = async (page = 1, limit = 30) => {
    const token = localStorage.getItem('rt_token');
    if (!token) return;
    try {
      let res = await fetch(`http://172.20.32.31:3333/account/notifications?page=${page}&limit=${limit}&is_read=all`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        const rawList = data.output?.notifications || (Array.isArray(data.output) ? data.output : extractArrayFromResponse(data));
        setAdminServerNotifs(Array.isArray(rawList) ? rawList : []);
        if (typeof data.output?.unread_count === 'number') {
          setAdminUnreadCount(data.output.unread_count);
        }
      }
    } catch (err) {
      console.info('[ADMIN NOTIFS] Feed live sync active:', err.message);
    }
  };

  const handleAdminMarkNotifAsRead = async (id) => {
    if (!id) return;
    const token = localStorage.getItem('rt_token');
    if (!token) return;
    try {
      await fetch(`http://172.20.32.31:3333/account/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (err) {
      console.warn('Admin mark notif read failed:', err);
    }
    fetchAdminNotifications();
  };

  const handleAdminMarkAllNotifsRead = async () => {
    setAdminUnreadCount(0);
    const token = localStorage.getItem('rt_token');
    if (!token) return;
    try {
      await fetch('http://172.20.32.31:3333/account/notifications/read-all', {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (err) {
      // ignore
    }
    fetchAdminNotifications();
  };

  const fetchServerAnnouncements = async () => {
    setIsLoadingAnnouncements(true);
    setAnnouncementsError('');
    const token = localStorage.getItem('rt_token');
    if (!token) { setAnnouncementsError('Token tidak ditemukan.'); setIsLoadingAnnouncements(false); return; }
    try {
      const res = await fetch('http://172.20.32.31:3333/admin/announcement', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 403) {
        console.info('[fetchServerAnnouncements] Akses ditolak (403) — role tidak memiliki izin.');
        setIsLoadingAnnouncements(false);
        return;
      }
      if (!res.ok) throw new Error('Gagal memuat pengumuman.');
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      list.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
      setServerAnnouncements(list);
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
    if (!token) {
      Swal.fire({ title: 'Gagal!', text: 'Token tidak ditemukan.', icon: 'error', confirmButtonColor: '#ef4444' });
      return;
    }
    try {
      const res = await fetch('http://172.20.32.31:3333/admin/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ judul: announcementForm.judul, isi: announcementForm.isi })
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          title: 'Berhasil!',
          text: data.message || 'Pengumuman berhasil diterbitkan!',
          icon: 'success',
          confirmButtonColor: '#10b981'
        });
        setAnnouncementForm({ judul: '', isi: '' });
        fetchServerAnnouncements();
      } else {
        Swal.fire({
          title: 'Gagal!',
          text: data.message || 'Gagal membuat pengumuman.',
          icon: 'error',
          confirmButtonColor: '#ef4444'
        });
      }
    } catch (err) {
      Swal.fire({
        title: 'Error!',
        text: `Gagal menghubungi server: ${err.message}`,
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  const handleUpdateAnnouncement = async (e) => {
    e.preventDefault();
    if (!editingAnnouncementId) return;
    const token = localStorage.getItem('rt_token');
    if (!token) {
      Swal.fire({ title: 'Gagal!', text: 'Token tidak ditemukan.', icon: 'error', confirmButtonColor: '#ef4444' });
      return;
    }
    const body = {};
    if (announcementForm.judul.trim()) body.judul = announcementForm.judul;
    if (announcementForm.isi.trim()) body.isi = announcementForm.isi;
    if (!Object.keys(body).length) return;
    try {
      const res = await fetch(`http://172.20.32.31:3333/admin/announcement/${editingAnnouncementId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          title: 'Berhasil!',
          text: data.message || 'Pengumuman berhasil diperbarui!',
          icon: 'success',
          confirmButtonColor: '#10b981'
        });
        setEditingAnnouncementId(null);
        setAnnouncementForm({ judul: '', isi: '' });
        fetchServerAnnouncements();
      } else {
        Swal.fire({
          title: 'Gagal!',
          text: data.message || 'Gagal memperbarui pengumuman.',
          icon: 'error',
          confirmButtonColor: '#ef4444'
        });
      }
    } catch (err) {
      Swal.fire({
        title: 'Error!',
        text: `Gagal menghubungi server: ${err.message}`,
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    const confirmResult = await Swal.fire({
      title: 'Hapus Pengumuman?',
      text: 'Pengumuman yang dihapus tidak dapat dikembalikan!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });
    if (!confirmResult.isConfirmed) return;

    const token = localStorage.getItem('rt_token');
    if (!token) {
      Swal.fire({ title: 'Gagal!', text: 'Token tidak ditemukan.', icon: 'error', confirmButtonColor: '#ef4444' });
      return;
    }
    try {
      const res = await fetch(`http://172.20.32.31:3333/admin/announcement/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          title: 'Terhapus!',
          text: data.message || 'Pengumuman berhasil dihapus!',
          icon: 'success',
          confirmButtonColor: '#10b981'
        });
        fetchServerAnnouncements();
      } else {
        Swal.fire({
          title: 'Gagal!',
          text: data.message || 'Gagal menghapus pengumuman.',
          icon: 'error',
          confirmButtonColor: '#ef4444'
        });
      }
    } catch (err) {
      Swal.fire({
        title: 'Error!',
        text: `Gagal menghubungi server: ${err.message}`,
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    }
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
      const response = await fetch('http://172.20.32.31:3333/admin/pengajuan', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 403) {
        console.info('[fetchServerSubmissions] Akses ditolak (403) — role tidak memiliki izin.');
        setIsLoadingSubmissions(false);
        return;
      }
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

  const defaultMockPendingWarga = [
    {
      warga_id: 101,
      id: 101,
      nama: 'Bagas Aditya Utama',
      nik: '3276051508980004',
      family_nokk: '3276051010180007',
      family_id: 1,
      jenis_kelamin: 'Laki-laki',
      umur: 28,
      house_blok: 'B4',
      house_nomor: '15',
      house_alamat: 'Jl. Sawangan Green Park Blok B4 No. 15',
      email: 'bagas.aditya@gmail.com',
      no_hp: '081298765432',
      status: 'Pending',
      created_at: '2026-08-10',
      foto_ktp: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300'
    },
    {
      warga_id: 102,
      id: 102,
      nama: 'Dewi Lestari Indah',
      nik: '3276054211990002',
      family_nokk: '3276051010180008',
      family_id: 2,
      jenis_kelamin: 'Perempuan',
      umur: 25,
      house_blok: 'C2',
      house_nomor: '08',
      house_alamat: 'Jl. Sawangan Green Park Blok C2 No. 08',
      email: 'dewi.indahlestari@gmail.com',
      no_hp: '085712345678',
      status: 'Pending',
      created_at: '2026-08-09',
      foto_ktp: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300'
    }
  ];

  const [pendingWargaList, setPendingWargaList] = useState([]);
  const [isLoadingPendingWarga, setIsLoadingPendingWarga] = useState(false);
  const [pendingWargaError, setPendingWargaError] = useState('');

  const fetchPendingWargaList = async () => {
    setIsLoadingPendingWarga(true);
    setPendingWargaError('');
    const token = localStorage.getItem('rt_token');
    if (!token) {
      setPendingWargaList([]);
      setIsLoadingPendingWarga(false);
      return;
    }
    try {
      const response = await fetch('http://172.20.32.31:3333/admin/pending-warga', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 403) {
        console.info('[fetchPendingWargaList] Akses ditolak (403) — role tidak memiliki izin.');
        setIsLoadingPendingWarga(false);
        return;
      }
      if (!response.ok) throw new Error('Gagal mengambil daftar warga pending dari server.');
      const data = await response.json();
      let items = [];
      if (Array.isArray(data)) {
        items = data;
      } else if (data && Array.isArray(data.output)) {
        items = data.output;
      } else if (data && Array.isArray(data.data)) {
        items = data.data;
      }
      setPendingWargaList(items);
    } catch (err) {
      console.warn('Fetch pending warga error:', err);
      setPendingWargaError(err.message || 'Gagal memuat daftar warga pending.');
      setPendingWargaList([]);
    } finally {
      setIsLoadingPendingWarga(false);
    }
  };

  const handleViewKtp = async (w) => {
    const token = localStorage.getItem('rt_token');
    let ktpImage = w.foto_ktp || w.fotoKtp || w.ktp_url || null;

    const docId = w.ktp_document_id || w.warga_id || w.id;
    if (docId && token) {
      try {
        const res = await fetch(`http://172.20.32.31:3333/admin/sensitifdata/file/${docId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const blob = await res.blob();
          ktpImage = URL.createObjectURL(blob);
        }
      } catch (err) {
        console.warn('Fetch secure KTP image error:', err);
      }
    }

    setSelectedKtpWarga({
      nama: w.nama || w.name,
      nik: w.nik,
      house_alamat: w.house_alamat || w.alamat,
      jenis_kelamin: w.jenis_kelamin || w.gender,
      foto_ktp: ktpImage || w.foto_ktp || w.fotoKtp,
      foto: w.foto || w.avatar,
      tgl_lahir: w.created_at ? `Tgl Daftar: ${w.created_at}` : 'DEPOK, 15-08-1998',
      pekerjaan: w.pekerjaan || 'Wiraswasta'
    });
  };

  const handleVerifyPendingWarga = async (targetItemOrId, statusAction) => {
    const targetId = typeof targetItemOrId === 'object' ? (targetItemOrId?.warga_id || targetItemOrId?.id) : targetItemOrId;
    
    if (!targetId) {
      Swal.fire({
        title: 'Error ID Warga',
        text: 'ID warga pending tidak ditemukan.',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    const token = localStorage.getItem('rt_token');
    if (!token) {
      Swal.fire({
        title: 'Sesi Berakhir',
        text: 'Token otentikasi tidak ditemukan. Harap login kembali.',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    const targetWarga = pendingWargaList.find(w => w.warga_id === targetId || w.id === targetId || String(w.warga_id) === String(targetId) || String(w.id) === String(targetId));

    try {
      const response = await fetch(`http://172.20.32.31:3333/admin/pending-warga/${targetId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: statusAction })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || resData.pesan || `Gagal mengubah status verifikasi warga ke ${statusAction}.`);
      }

      await fetchPendingWargaList();
      if (typeof fetchResidentServerList === 'function') {
        await fetchResidentServerList();
      }

      if (statusAction === 'diterima') {
        Swal.fire({
          title: 'Verifikasi Registrasi Disetujui! 🎉',
          text: resData.message || `Data pendaftaran ${targetWarga ? targetWarga.nama : 'Warga Baru'} telah diverifikasi dan resmi terdaftar di Data Penduduk RT 05.`,
          icon: 'success',
          confirmButtonColor: '#10b981'
        });
      } else {
        Swal.fire({
          title: 'Verifikasi Registrasi Ditolak',
          text: resData.message || `Pendaftaran warga baru telah ditolak.`,
          icon: 'warning',
          confirmButtonColor: '#ef4444'
        });
      }
    } catch (err) {
      console.error('Verify pending warga error:', err);
      Swal.fire({
        title: 'Gagal Verifikasi',
        text: err.message || 'Terjadi kesalahan saat memproses verifikasi ke server.',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
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
      const response = await fetch('http://172.20.32.31:3333/admin/finance/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('HTTP Status Response:', response.status);
      if (response.status === 403) {
        console.info('[fetchPendingPayments] Akses ditolak (403) — role tidak memiliki izin.');
        return;
      }
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
      const iplMapped = rawIpl.map(item => {
        const rawAmount = item.total_amount !== undefined ? item.total_amount : (item.amount !== undefined ? item.amount : (item.nominal !== undefined ? item.nominal : (item.jumlah !== undefined ? item.jumlah : 0)));
        return {
          ...item,
          id: item.transaksi_id !== undefined ? item.transaksi_id : (item.id !== undefined ? item.id : item.transaksi_id),
          warga_nama: item.nama || item.warga_nama || item.resident_name || `Keluarga KK #${item.family_id || item.id_family || ''}`,
          payment_date: item.created_at || item.payment_date,
          period_title: item.period_title || item.title,
          year: item.tahun !== undefined ? item.tahun : (item.year !== undefined ? item.year : item.period_year),
          month: item.bulan !== undefined ? item.bulan : (item.month !== undefined ? item.month : item.period_month),
          amount: Number(rawAmount) || 0,
          payment_proof: item.proof_url || item.bukti_pembayaran || item.payment_proof || item.file_proof,
          status: item.status
        };
      });
      
      const kasMapped = rawKas.map(item => ({
        ...item,
        id: item.transaksi_id !== undefined ? item.transaksi_id : (item.id !== undefined ? item.id : item.transaksi_id),
        warga_nama: item.nama || item.warga_nama || `Keluarga KK #${item.family_id || item.id_family || ''}`,
        payment_date: item.created_at || item.payment_date,
        category: item.kategori || item.category,
        description: item.keterangan || item.description,
        payment_proof: item.proof_url || item.bukti_pembayaran || item.payment_proof || item.file_proof,
        amount: item.jumlah !== undefined ? item.jumlah : item.amount,
        status: item.status
      }));

      console.log('Mapped IPL items list:', iplMapped);
      console.log('Mapped Kas items list:', kasMapped);

      setPendingPayments({ ipl: iplMapped, kas: kasMapped });
    } catch (err) {
      console.error(err);
      setPendingPaymentsError(err.message);
    } finally {
      setIsLoadingPendingPayments(false);
    }
  };

  const handleVerifyPendingPayment = async (type, paymentId, action) => {
    const token = localStorage.getItem('rt_token');
    if (!token) { alert('Token tidak ditemukan.'); return; }

    let decision = 'approved';
    let rejectReason = '';

    if (action === 'ditolak' || action === 'rejected') {
      decision = 'rejected';
      const { value: reason } = await Swal.fire({
        title: `Tolak Pembayaran ${type.toUpperCase()}`,
        input: 'text',
        inputLabel: 'Masukkan alasan penolakan bukti transfer:',
        inputPlaceholder: 'Contoh: Nominal transfer kurang, bukti buram...',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Tolak Pembayaran',
        cancelButtonText: 'Batal',
        inputValidator: (value) => {
          if (!value || !value.trim()) return 'Alasan penolakan wajib diisi!';
        }
      });
      if (!reason) return;
      rejectReason = reason.trim();
    } else {
      const confirm = await Swal.fire({
        title: `Setujui Pembayaran ${type.toUpperCase()}?`,
        text: type === 'ipl' 
          ? 'Status tagihan warga akan otomatis LUNAS dan dana tercatat masuk ke Buku Kas.' 
          : 'Iuran kas warga akan disetujui dan tercatat masuk ke Buku Kas.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        confirmButtonText: 'Ya, Setujui',
        cancelButtonText: 'Batal'
      });
      if (!confirm.isConfirmed) return;
    }

    try {
      const endpoint = type === 'ipl' 
        ? `http://172.20.32.31:3333/admin/finance/ipl-payments/${paymentId}/verify`
        : `http://172.20.32.31:3333/admin/finance/kas-contributions/${paymentId}/verify`;

      const reqBody = { decision };
      if (decision === 'rejected' && rejectReason) {
        reqBody.rejectReason = rejectReason;
      }

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reqBody)
      });
      const data = await response.json();
      if (response.ok) {
        Swal.fire('Berhasil!', data.message || data.output?.message || `Verifikasi iuran ${type.toUpperCase()} berhasil diupdate!`, 'success');
        setPendingPayments(prev => ({
          ...prev,
          [type]: (prev[type] || []).filter(item => item.id !== paymentId && item.transaksi_id !== paymentId)
        }));
        fetchPendingPayments();
        fetchLedgerFromServer();
        fetchFinanceTracking();
      } else {
        Swal.fire('Gagal', data.message || data.pesan || `Gagal mengubah status verifikasi iuran ${type}.`, 'error');
      }
    } catch (err) {
      alert(`Koneksi gagal: ${err.message}`);
    }
  };

  // Bill Periods States (Bagian A)
  const [billPeriodsList, setBillPeriodsList] = useState([]);
  const [isLoadingBillPeriods, setIsLoadingBillPeriods] = useState(false);
  const [billPeriodForm, setBillPeriodForm] = useState({
    title: '',
    defaultAmount: 200000,
    dueDate: '',
    periodMonth: new Date().getMonth() + 1,
    periodYear: 2026
  });
  const [selectedPeriodSummary, setSelectedPeriodSummary] = useState(null);
  const [selectedPeriodBills, setSelectedPeriodBills] = useState([]);
  const [isLoadingPeriodDetails, setIsLoadingPeriodDetails] = useState(false);
  const [isPeriodDetailModalOpen, setIsPeriodDetailModalOpen] = useState(false);

  const fetchBillPeriods = async () => {
    const token = localStorage.getItem('rt_token');
    if (!token) return;
    setIsLoadingBillPeriods(true);
    console.log('%c[BILL PERIODS] 🔄 GET http://172.20.32.31:3333/admin/finance/bill-periods', 'color: #06b6d4; font-weight: bold;');
    try {
      const res = await fetch('http://172.20.32.31:3333/admin/finance/bill-periods', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      console.log('%c[BILL PERIODS] 📦 Response:', 'color: #06b6d4; font-weight: bold;', data);
      if (res.ok) {
        const list = extractArrayFromResponse(data);
        console.log(`%c[BILL PERIODS] ✅ Loaded ${list.length} bill periods:`, 'color: #10b981; font-weight: bold;', list);
        setBillPeriodsList(list);
      } else {
        console.warn('%c[BILL PERIODS] ⚠️ Fetch failed:', 'color: #f59e0b; font-weight: bold;', data);
      }
    } catch (err) {
      console.error('%c[BILL PERIODS] ❌ Error fetching bill periods:', 'color: #ef4444; font-weight: bold;', err);
    } finally {
      setIsLoadingBillPeriods(false);
    }
  };

  const handleCreateBillPeriod = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('rt_token');
    if (!token) return;

    const payload = {
      title: billPeriodForm.title,
      defaultAmount: parseInt(billPeriodForm.defaultAmount) || parseInt(iplAmountInput) || 200000,
      dueDate: billPeriodForm.dueDate,
      periodMonth: parseInt(billPeriodForm.periodMonth),
      periodYear: parseInt(billPeriodForm.periodYear)
    };

    console.log('%c[BILL PERIODS] 🚀 POST http://172.20.32.31:3333/admin/finance/bill-periods', 'color: #8b5cf6; font-weight: bold;', payload);

    try {
      const res = await fetch('http://172.20.32.31:3333/admin/finance/bill-periods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      console.log('%c[BILL PERIODS] 📩 Create Response:', 'color: #8b5cf6; font-weight: bold;', data);

      if (res.ok) {
        Swal.fire({
          title: 'Berhasil! 🎉',
          text: data.message || data.output?.message || data.pesan || 'Draft periode tagihan IPL berhasil dibuat!',
          icon: 'success',
          confirmButtonColor: '#10b981'
        });
        await fetchBillPeriods();
        setBillPeriodForm({
          title: '',
          defaultAmount: iplAmountInput || 200000,
          dueDate: '',
          periodMonth: new Date().getMonth() + 1,
          periodYear: 2026
        });
      } else {
        Swal.fire({
          title: 'Gagal Membuat Periode',
          text: data.pesan || data.message || data.output?.message || 'Gagal membuat periode tagihan.',
          icon: 'error',
          confirmButtonColor: '#ef4444'
        });
      }
    } catch (err) {
      console.error('%c[BILL PERIODS] ❌ Network error creating period:', 'color: #ef4444;', err);
      Swal.fire({
        title: 'Koneksi Gagal',
        text: err.message,
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  const handlePublishBillPeriod = async (periodId, periodTitle) => {
    const confirm = await Swal.fire({
      title: `Publish "${periodTitle}"?`,
      text: 'Tagihan IPL akan di-generate (snapshot nominal & jatuh tempo) ke seluruh warga aktif.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      confirmButtonText: 'Ya, Publish Sekarang',
      cancelButtonText: 'Batal'
    });
    if (!confirm.isConfirmed) return;
    const token = localStorage.getItem('rt_token');
    if (!token) return;

    console.log(`%c[BILL PERIODS] 📢 POST http://172.20.32.31:3333/admin/finance/bill-periods/${periodId}/publish`, 'color: #10b981; font-weight: bold;');

    try {
      const res = await fetch(`http://172.20.32.31:3333/admin/finance/bill-periods/${periodId}/publish`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      console.log('%c[BILL PERIODS] 📦 Publish Response:', 'color: #10b981; font-weight: bold;', data);
      if (res.ok) {
        Swal.fire({
          title: 'Sukses Dipublish! 🚀',
          text: data.message || data.output?.message || data.pesan || 'Tagihan berhasil dipublish untuk seluruh warga aktif!',
          icon: 'success',
          confirmButtonColor: '#10b981'
        });
        await fetchBillPeriods();
        fetchFinanceTracking();
        fetchLedgerFromServer();
      } else {
        Swal.fire('Gagal', data.message || data.pesan || 'Gagal mempublish periode tagihan.', 'error');
      }
    } catch (err) {
      alert(`Koneksi gagal: ${err.message}`);
    }
  };

  const handleViewPeriodSummary = async (periodId) => {
    const token = localStorage.getItem('rt_token');
    if (!token) return;
    setIsLoadingPeriodDetails(true);
    setIsPeriodDetailModalOpen(true);
    console.log(`%c[BILL PERIODS] 📊 GET Summary & Bills for period ID: ${periodId}`, 'color: #3b82f6; font-weight: bold;');
    try {
      const [summaryRes, billsRes] = await Promise.all([
        fetch(`http://172.20.32.31:3333/admin/finance/bill-periods/${periodId}/summary`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://172.20.32.31:3333/admin/finance/bill-periods/${periodId}/bills`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      if (summaryRes.ok) {
        const sData = await summaryRes.json();
        console.log('%c[BILL PERIODS] Summary Data:', 'color: #3b82f6;', sData);
        const envelope = sData.output?.pesan || sData.output || sData;
        const periodInfo = envelope.period || {};
        const summaryInfo = envelope.summary || {};
        setSelectedPeriodSummary({
          ...periodInfo,
          ...summaryInfo
        });
      }
      if (billsRes.ok) {
        const bData = await billsRes.json();
        console.log('%c[BILL PERIODS] Bills Data:', 'color: #3b82f6;', bData);
        const bList = extractArrayFromResponse(bData);
        setSelectedPeriodBills(bList);
      }
    } catch (err) {
      console.error('Error fetching period summary/bills:', err);
    } finally {
      setIsLoadingPeriodDetails(false);
    }
  };

  const handleExemptBill = async (billId) => {
    const { value: reason } = await Swal.fire({
      title: 'Bebaskan Tagihan Warga (Exempt)',
      input: 'text',
      inputLabel: 'Alasan Pembebasan (misal: Rumah kosong, warga tidak mampu):',
      inputPlaceholder: 'Tulis alasan pembebasan...',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      confirmButtonText: 'Bebaskan Tagihan',
      cancelButtonText: 'Batal',
      inputValidator: (value) => {
        if (!value) return 'Alasan pembebasan wajib diisi!';
      }
    });
    if (!reason) return;
    const token = localStorage.getItem('rt_token');
    if (!token) return;
    try {
      const res = await fetch(`http://172.20.32.31:3333/admin/finance/bills/${billId}/exempt`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire('Berhasil!', data.message || 'Tagihan warga berhasil dibebaskan (Exempt).', 'success');
        if (selectedPeriodSummary?.period_id || selectedPeriodSummary?.id) {
          handleViewPeriodSummary(selectedPeriodSummary.period_id || selectedPeriodSummary.id);
        }
        fetchFinanceTracking();
      } else {
        Swal.fire('Gagal', data.message || data.pesan || 'Gagal membebaskan tagihan.', 'error');
      }
    } catch (err) {
      alert(`Koneksi gagal: ${err.message}`);
    }
  };

  // Manual Payment States (Bagian C #2)
  const [manualPaymentForm, setManualPaymentForm] = useState({
    familyId: '',
    jenis_iuran: 'ipl', // 'ipl' | 'kas'
    amount: 200000,
    billIds: [],
    category: 'sosial',
    description: ''
  });
  const [familyUnpaidBills, setFamilyUnpaidBills] = useState([]);
  const [isLoadingFamilyBills, setIsLoadingFamilyBills] = useState(false);

  const fetchUnpaidBillsForFamily = async (familyId) => {
    if (!familyId) {
      setFamilyUnpaidBills([]);
      return;
    }
    const token = localStorage.getItem('rt_token');
    if (!token) return;
    setIsLoadingFamilyBills(true);
    try {
      const res = await fetch(`http://172.20.32.31:3333/admin/finance/tracking?month=${trackingMonth}&year=${trackingYear}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.output && Array.isArray(data.output) ? data.output : []);
        const matching = list.filter(item => String(item.family_id) === String(familyId) && (item.status === 'Nunggak' || item.status === 'unpaid' || item.status === 'Belum Bayar'));
        setFamilyUnpaidBills(matching);
        if (matching.length > 0) {
          const ids = matching.map(m => m.bill_id).filter(Boolean);
          setManualPaymentForm(prev => ({
            ...prev,
            billIds: ids,
            amount: matching.reduce((sum, m) => sum + (m.nominal_tagihan || 200000), 0)
          }));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingFamilyBills(false);
    }
  };

  const handleManualPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!manualPaymentForm.familyId) {
      alert('Silakan pilih Kepala Keluarga / Warga terlebih dahulu.');
      return;
    }
    if (!manualPaymentForm.amount || parseInt(manualPaymentForm.amount) <= 0) {
      alert('Nominal pembayaran harus lebih besar dari 0.');
      return;
    }
    const token = localStorage.getItem('rt_token');
    if (!token) { alert('Token tidak ditemukan.'); return; }

    const reqBody = {
      family_id: parseInt(manualPaymentForm.familyId),
      jenis_iuran: manualPaymentForm.jenis_iuran,
      amount: parseInt(manualPaymentForm.amount)
    };

    if (manualPaymentForm.jenis_iuran === 'ipl') {
      reqBody.billIds = manualPaymentForm.billIds && manualPaymentForm.billIds.length > 0
        ? manualPaymentForm.billIds.map(Number)
        : [];
    } else {
      reqBody.category = manualPaymentForm.category;
      reqBody.description = manualPaymentForm.description.trim() || 'Iuran Kas Manual';
    }

    try {
      const res = await fetch('http://172.20.32.31:3333/admin/finance/manual-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reqBody)
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          title: 'Pencatatan Berhasil! 🎉',
          text: data.message || data.output?.message || 'Pencatatan iuran warga manual berhasil disimpan!',
          icon: 'success',
          confirmButtonColor: '#10b981'
        });
        setManualPaymentForm({
          familyId: '',
          jenis_iuran: 'ipl',
          amount: iplAmountInput || 200000,
          billIds: [],
          category: 'sosial',
          description: ''
        });
        setFamilyUnpaidBills([]);
        fetchFinanceTracking();
        fetchLedgerFromServer();
      } else {
        Swal.fire('Gagal', data.message || data.pesan || 'Gagal menyimpan pencatatan manual.', 'error');
      }
    } catch (err) {
      alert(`Koneksi gagal: ${err.message}`);
    }
  };

  // Finance Audit States (Bagian B #5)
  const [auditIplList, setAuditIplList] = useState([]);
  const [auditKasList, setAuditKasList] = useState([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [auditTab, setAuditTab] = useState('ipl'); // 'ipl' | 'kas' | 'ledger'

  const fetchFinanceAudit = async () => {
    const token = localStorage.getItem('rt_token');
    if (!token) return;
    setIsLoadingAudit(true);
    try {
      const [iplRes, kasRes] = await Promise.all([
        fetch('http://172.20.32.31:3333/admin/finance/ipl-payments/audit', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://172.20.32.31:3333/admin/finance/kas-contributions/audit', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      if (iplRes.ok) {
        const iData = await iplRes.json();
        const iList = Array.isArray(iData) ? iData : (iData.output && Array.isArray(iData.output) ? iData.output : []);
        setAuditIplList(iList);
      }
      if (kasRes.ok) {
        const kData = await kasRes.json();
        const kList = Array.isArray(kData) ? kData : (kData.output && Array.isArray(kData.output) ? kData.output : []);
        setAuditKasList(kList);
      }
    } catch (err) {
      console.error('Error fetching finance audit:', err);
    } finally {
      setIsLoadingAudit(false);
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
      const response = await fetch(`http://172.20.32.31:3333/admin/finance/tracking?month=${trackingMonth}&year=${trackingYear}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 403) {
        console.info('[fetchFinanceTracking] Akses ditolak (403) — role tidak memiliki izin.');
        setIsLoadingFinanceTracking(false);
        return;
      }
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
      const response = await fetch('http://172.20.32.31:3333/admin/resident', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('rt_token');
        localStorage.removeItem('rt_current_user');
        localStorage.removeItem('rt_token_time');
        if (setCurrentUser) setCurrentUser(null);
        Swal.fire({
          title: 'Sesi Login Kadaluarsa',
          text: 'Sesi login Anda telah berakhir. Silakan login kembali.',
          icon: 'warning',
          confirmButtonColor: '#10b981'
        });
        return;
      }

      if (response.status === 403) {
        console.info('[fetchResidentServerList] Akses ditolak (403) — role tidak memiliki izin.');
        setIsLoadingResidents(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`Error ${response.status}: Gagal memuat data dari server.`);
      }

      const data = await response.json();
      const items = extractArrayFromResponse(data);
      setResidentServerList(items);
    } catch (err) {
      console.error('Failed to fetch residents:', err);
      setResidentError(err.message);
    } finally {
      setIsLoadingResidents(false);
    }
  };

  const [kepalaKeluargaList, setKepalaKeluargaList] = useState([]);
  const [isLoadingKepalaKeluarga, setIsLoadingKepalaKeluarga] = useState(false);

  const fetchKepalaKeluargaList = async () => {
    setIsLoadingKepalaKeluarga(true);
    let token = null;
    try {
      token = localStorage.getItem('rt_token');
    } catch (e) {
      console.warn('localStorage is blocked or unavailable:', e);
    }
    if (!token) {
      setIsLoadingKepalaKeluarga(false);
      return;
    }

    try {
      const response = await fetch('http://172.20.32.31:3333/admin/kepala-keluarga/list', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('rt_token');
        localStorage.removeItem('rt_current_user');
        localStorage.removeItem('rt_token_time');
        if (setCurrentUser) setCurrentUser(null);
        return;
      }

      if (response.ok) {
        const raw = await response.json();
        console.log('%c[fetchKepalaKeluargaList] Raw response:', 'color: #10b981; font-weight: bold;', raw);
        const items = extractArrayFromResponse(raw);
        
        const formatted = items.map(kk => {
          const citizenId = kk.warga_id || kk.id || kk.user_id || 0;
          const name = kk.nama || kk.name || kk.kepala_keluarga_nama || 'Kepala Keluarga';
          const alamat = kk.alamat || kk.house_alamat || (kk.blok || kk.house_blok ? `Blok ${kk.blok || kk.house_blok} No. ${kk.nomor || kk.house_nomor || ''}` : '');
          const nik = kk.nik || '';
          const noKk = kk.no_kk || kk.noKk || kk.family_nokk || '';
          
          return {
            id: citizenId,
            name: name,
            alamat: alamat,
            nik: nik,
            noKk: noKk,
            rawItem: kk
          };
        });

        console.log(`%c[fetchKepalaKeluargaList] Loaded ${formatted.length} kepala keluarga`, 'color: #10b981; font-weight: bold;');
        setKepalaKeluargaList(formatted);
      } else {
        console.warn(`[fetchKepalaKeluargaList] HTTP Error: ${response.status}`);
      }
    } catch (err) {
      console.warn('Gagal memuat kepala keluarga dari server:', err.message);
    } finally {
      setIsLoadingKepalaKeluarga(false);
    }
  };

  const fetchSuratMasuk = async () => {
    setSuratMasukLoading(true);
    const token = localStorage.getItem('rt_token');
    try {
      const response = await fetch('http://172.20.32.31:3333/admin/surat-masuk', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const items = extractArrayFromResponse(data);
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
        throw new Error('Endpoint server belum aktif atau mengembalikan error.');
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
      const response = await fetch('http://172.20.32.31:3333/admin/surat-keluar', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const items = extractArrayFromResponse(data);
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
        throw new Error('Endpoint server belum aktif atau mengembalikan error.');
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
    if (!token) {
      console.warn('[Dashboard Debug] Tidak ada rt_token; data dashboard tidak akan di-fetch.');
      return;
    }

    console.info('[Dashboard Debug] Memuat daftar warga dari server');
    console.table({
      role: currentUser?.role || 'tidak diketahui',
      username: currentUser?.username || 'tidak diketahui',
      isRtOrAdmin,
      isSekretaris,
      isBendahara,
      hasToken: Boolean(token),
    });

    try {
      const response = await fetch('http://172.20.32.31:3333/admin/datawarga', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('rt_token');
        localStorage.removeItem('rt_current_user');
        localStorage.removeItem('rt_token_time');
        if (setCurrentUser) setCurrentUser(null);
        Swal.fire({
          title: 'Sesi Login Kadaluarsa',
          text: 'Sesi login Anda telah berakhir. Silakan login kembali.',
          icon: 'warning',
          confirmButtonColor: '#10b981'
        });
        return;
      }

      if (response.status === 403) {
        console.info('[fetchWargaListFromServer] Akses ditolak (403) — role tidak memiliki izin.');
        return;
      }

      if (response.ok) {
        const raw = await response.json();
        console.log('%c[fetchWargaListFromServer] Raw response:', 'color: #f59e0b; font-weight: bold;', raw);

        const items = extractArrayFromResponse(raw);

        const createdAccounts = getCreatedAccountsMap();

        const normalized = items.map(item => {
          const citizenId = item.warga_id || item.id || 0;
          const famId = item.family_id || item.fammilyId || 0;
          const nik = item.nik || '';
          const cName = cleanNameStr(item.nama || item.name);

          const savedAcc = (citizenId && createdAccounts[`citizen_${citizenId}`]) ||
                           (nik && createdAccounts[`nik_${nik}`]) ||
                           (cName && createdAccounts[`name_${cName}`]);

          const backendUsername = item.username || item.account_username || item.user?.username || item.account?.username || item.user_name || '';
          const username = backendUsername || savedAcc?.username || '';
          const hasAccount = !!username || 
                             (item.account_id !== null && item.account_id !== undefined && item.account_id !== 0) ||
                             (item.user_id !== null && item.user_id !== undefined && item.user_id !== 0) ||
                             item.has_account === true || item.has_account === 1 || 
                             item.account_created === true || item.hasAccount === true || 
                             !!item.user || !!item.account || !!savedAcc;

          return {
            id: citizenId,
            warga_id: citizenId,
            name: item.nama || item.name || '',
            nik: nik,
            noKk: item.family_nokk || item.no_kk || item.noKk || '',
            gender: item.jenis_kelamin || item.jenisKelamin || item.gender || '',
            status: item.house_status || item.status || 'Tetap',
            statusHidup: item.status_hidup || item.statusHidup || 'Hidup',
            username: username,
            account_username: username,
            account_id: item.account_id || item.user_id || (savedAcc ? true : null),
            has_account: hasAccount,
            account_created: hasAccount,
            alamat: item.house_alamat || item.alamat || '',
            noHp: item.no_hp || item.noHp || item.telepon || '',
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
        const res = await fetch(`http://172.20.32.31:3333/admin/reveal-warga/${sudoTargetId}`, {
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
        const res = await fetch(`http://172.20.32.31:3333/admin/reveal-resident/${sudoTargetId}`, {
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
        const verifyRes = await fetch(`http://172.20.32.31:3333/admin/reveal-resident/${sudoTargetId}`, {
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

        const response = await fetch(`http://172.20.32.31:3333/admin/resident/${sudoTargetId}`, {
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
      const response = await fetch('http://172.20.32.31:3333/post/dashboard-stats');
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

  const userRole = currentUser?.role || '';
  const isRtOrAdmin = userRole === 'rt' || userRole === 'admin';
  const isBendahara = userRole === 'bendahara';
  const isSekretaris = userRole === 'sekertaris' || userRole === 'sekretaris';

  useEffect(() => {
    // Only fetch data that the current role has permission to access
    if (activeTab === 'sek_warga_kk' && residentSubTab === 'server' && !isBendahara) {
      fetchResidentServerList();
    }
    if ((activeTab === 'warga' || activeTab === 'sek_akun_manage' || activeTab === 'sek_laporan' || activeTab === 'rt_statistik' || activeTab === 'iuran_pembayaran' || activeTab === 'laporan_rekap') && !isBendahara) {
      fetchWargaListFromServer();
    }
    if (activeTab === 'sek_pengaduan' && !isBendahara) {
      fetchServerComplaints();
    }
    if (activeTab === 'sek_info_pengumuman' && !isBendahara) {
      fetchServerAnnouncements();
    }
    if (activeTab === 'sek_warga_masuk' && !isBendahara) {
      fetchPendingWargaList();
    }
    if (activeTab === 'iuran_jenis') {
      fetchBillPeriods();
      fetchFinanceSettings();
    }
    if (activeTab === 'iuran_verifikasi') {
      fetchPendingPayments();
      if (!isBendahara) fetchResidentServerList();
    }
    if (activeTab === 'iuran_tunggakan') {
      fetchFinanceTracking();
    }
    if (activeTab === 'iuran_pembayaran' || activeTab === 'keuangan_pemasukan') {
      fetchKepalaKeluargaList();
      fetchFinanceSettings();
    }
    if (activeTab === 'iuran_riwayat') {
      fetchFinanceAudit();
      fetchLedgerFromServer();
    }
    if ((activeTab === 'overview' || activeTab === 'layanan') && !isBendahara) {
      fetchServerSubmissions();
    }
    if (activeTab === 'agenda' && !isBendahara) {
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
    if (!token) {
      console.warn('[Dashboard Debug] Tidak ada rt_token; bootstrap dashboard dibatalkan.');
      return;
    }

    console.info('[Dashboard Debug] Bootstrap dashboard', {
      role: currentUser?.role,
      username: currentUser?.username,
      isRtOrAdmin,
      isSekretaris,
      isBendahara,
      hasToken: true,
    });

    // Fetch initial core data from server on mount — role-aware
    if (isRtOrAdmin || isSekretaris) {
      console.info('[Dashboard Debug] Memuat: warga, KK, pengajuan, warga pending, agenda');
      // Only RT/admin/sekretaris can access warga & resident endpoints
      fetchResidentServerList();
      fetchWargaListFromServer();
      fetchServerSubmissions();
      fetchPendingWargaList();
      if (fetchAgendas) fetchAgendas();
    }

    if (isRtOrAdmin || isBendahara) {
      console.info('[Dashboard Debug] Memuat: ledger, tunggakan, pembayaran pending, pengaturan keuangan, kepala keluarga');
      // RT/admin/bendahara can access finance endpoints
      fetchLedgerFromServer();
      fetchFinanceTracking();
      fetchPendingPayments();
      fetchFinanceSettings();
      fetchKepalaKeluargaList();
    }

    const socketConnection = io('http://172.20.32.31:3333', {
      transports: ['websocket'],
      auth: { token }
    });

    socketConnection.on('connect', () => {
      console.log('Connected to socket server in AdminDashboard');
    });

    socketConnection.on('sync', (data) => {
      console.log(`⚡ Menerima request sinkronisasi untuk: ${data.type}`);
      if (data.type === 'finance') {
        if (isRtOrAdmin || isBendahara) {
          fetchLedgerFromServer();
          fetchPendingPayments();
          fetchFinanceTracking();
        }
      } else if (data.type === 'warga') {
        if (isRtOrAdmin || isSekretaris) {
          fetchResidentServerList();
          fetchPendingWargaList();
          fetchWargaListFromServer();
        }
      } else if (data.type === 'pengaduan') {
        if (!isBendahara) fetchServerComplaints();
      } else if (data.type === 'pengajuan') {
        if (!isBendahara) fetchServerSubmissions();
      } else if (data.type === 'announcement') {
        if (!isBendahara) fetchServerAnnouncements();
      } else if (data.type === 'agenda') {
        if (!isBendahara && fetchAgendas) fetchAgendas();
      } else if (data.type === 'surat_masuk') {
        if (!isBendahara) fetchSuratMasuk();
      } else if (data.type === 'surat_keluar') {
        if (!isBendahara) fetchSuratKeluar();
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
  const [isSubmittingWarga, setIsSubmittingWarga] = useState(false);
  
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

  // Email OTP Verification Modal States (Flow 1)
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpTargetUserId, setOtpTargetUserId] = useState(null);
  const [otpTargetEmail, setOtpTargetEmail] = useState('');
  const [pendingAccountData, setPendingAccountData] = useState(null);
  const [emailFieldError, setEmailFieldError] = useState('');

  const isValidEmailFormat = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || '').trim());
  };

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
      text: 'Mengirim permintaan pembuatan akun ke server...',
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
      const response = await fetch('http://172.20.32.31:3333/admin/create-account', {
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
        const conflictText = resData.pesan || resData.message || resData.error || (resData.errors && resData.errors[0]?.message) || 'Akun untuk keluarga ini sudah tersedia.';
        Swal.fire({
          title: 'Akun Sudah Ada',
          text: conflictText,
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
        const errorText = resData.pesan || resData.message || resData.error || (resData.errors && resData.errors[0]?.message) || 'Terjadi kesalahan pada server.';
        Swal.fire({
          title: 'Gagal Membuat Akun',
          text: errorText,
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

      // Automatic State Update for targeted citizen only
      const targetCitizenId = citizen.id || citizen.warga_id;
      const targetCitizenNik = citizen.nik;
      const cleanSelectedName = cleanNameStr(citizen.name || citizen.nama);

      const updatedWargaList = wargaList.map(item => {
        const isMatch = (targetCitizenId && (item.id === targetCitizenId || item.warga_id === targetCitizenId)) || 
                        (targetCitizenNik && item.nik === targetCitizenNik) ||
                        (!targetCitizenId && !targetCitizenNik && cleanSelectedName && cleanNameStr(item.name || item.nama) === cleanSelectedName);
        if (isMatch) {
          return {
            ...item,
            username: username,
            account_username: username,
            password: tempPassword,
            has_account: true,
            account_created: true,
            account_id: output.account_id || output.id || item.account_id || true
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
    const accountRecord = getWargaAccountRecord(citizen);

    // Load existing password from saved record or from citizen object
    const savedPassword = accountRecord?.password || citizen.password || '';
    const savedCreatedAt = accountRecord?.createdAt || null;
    const savedPasswordChangedAt = accountRecord?.passwordChangedAt || null;

    setAccountForm({
      username: existingUsername,
      password: '',
      confirmPassword: '',
      email: citizen.email || citizen.emailWarga || '',
      role: 'warga'
    });
    setExistingAccountPassword(savedPassword);
    setExistingAccountCreatedAt(savedCreatedAt);
    setExistingPasswordChangedAt(savedPasswordChangedAt);
    setShowExistingPassword(false);
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

    if (accountForm.password && accountForm.password.length < 8) {
      setFormError('Password minimal 8 karakter jika ingin diubah.');
      return;
    }

    if (accountForm.password && accountForm.password !== accountForm.confirmPassword) {
      setFormError('Password dan konfirmasi password tidak cocok.');
      return;
    }

    const targetFamilyId = selectedCitizenForAccount.family_id || selectedCitizenForAccount.fammilyId || selectedCitizenForAccount.familyId || selectedCitizenForAccount.id;
    const newUsername = accountForm.username.trim();
    const newPassword = accountForm.password ? accountForm.password : ''; // empty = keep existing

    setIsCreatingAccount(true);

    try {
      // Update persistent local registry — pass empty password to preserve existing
      saveCreatedAccount(selectedCitizenForAccount, targetFamilyId, newUsername, newPassword);

      const targetCitizenId = selectedCitizenForAccount.id || selectedCitizenForAccount.warga_id;
      const targetCitizenNik = selectedCitizenForAccount.nik;
      const cleanSelectedName = cleanNameStr(selectedCitizenForAccount.name || selectedCitizenForAccount.nama);

      // Realtime state update for targeted citizen only
      const updatedWargaList = wargaList.map(item => {
        const isMatch = (targetCitizenId && (item.id === targetCitizenId || item.warga_id === targetCitizenId)) || 
                        (targetCitizenNik && item.nik === targetCitizenNik) ||
                        (!targetCitizenId && !targetCitizenNik && cleanSelectedName && cleanNameStr(item.name || item.nama) === cleanSelectedName);
        if (isMatch) {
          return {
            ...item,
            username: newUsername,
            account_username: newUsername,
            password: newPassword || item.password || existingAccountPassword,
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
    setEmailFieldError('');

    if (!selectedCitizenForAccount) return;

    // Realtime Validations
    if ((accountForm.username || '').trim().length < 4) {
      setUsernameFieldError('Username minimal 4 karakter.');
      return;
    }

    // Mandatory Email Validation
    if (!accountForm.email || !accountForm.email.trim()) {
      setEmailFieldError('Email warga wajib diisi.');
      setFormError('Alamat email warga wajib diisi.');
      return;
    }

    if (!isValidEmailFormat(accountForm.email.trim())) {
      setEmailFieldError('Format email tidak valid (contoh: nama@domain.com).');
      setFormError('Format email tidak valid.');
      return;
    }

    if ((accountForm.password || '').length < 8) {
      setFormError('Password minimal 8 karakter.');
      return;
    }

    if (accountForm.password !== accountForm.confirmPassword) {
      setFormError('Password dan konfirmasi password tidak cocok.');
      return;
    }

    const targetFamilyId = selectedCitizenForAccount.family_id || selectedCitizenForAccount.fammilyId || selectedCitizenForAccount.familyId || selectedCitizenForAccount.id;
    const citizenName = selectedCitizenForAccount.name || selectedCitizenForAccount.nama || 'Warga';

    setIsCreatingAccount(true);
    setLoadingAccountId(selectedCitizenForAccount.id);

    try {
      const token = localStorage.getItem('rt_token');
      const response = await fetch('http://172.20.32.31:3333/admin/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          familyId: parseInt(targetFamilyId),
          username: accountForm.username.trim(),
          password: accountForm.password,
          email: accountForm.email.trim()
        })
      });

      const resData = await response.json();

      // 409 Conflict / Username Taken
      if (response.status === 409) {
        const conflictMsg = (resData.pesan || resData.message || resData.error || '').toLowerCase();
        if (conflictMsg.includes('username')) {
          setUsernameFieldError('Username sudah digunakan. Silakan pilih username lain.');
        } else {
          const conflictText = resData.pesan || resData.message || resData.error || (resData.errors && resData.errors[0]?.message) || 'Akun untuk keluarga ini sudah tersedia.';
          Swal.fire({
            title: 'Akun Sudah Ada',
            text: conflictText,
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
        const errorText = resData.pesan || resData.message || resData.error || (resData.errors && resData.errors[0]?.message) || 'Terjadi kesalahan pada server.';
        Swal.fire({
          title: 'Gagal Mendaftarkan Akun',
          text: errorText,
          icon: 'error',
          confirmButtonColor: '#ef4444',
          customClass: {
            popup: 'rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white',
            title: 'text-lg font-black text-slate-900 dark:text-white'
          }
        });
        return;
      }

      // Extract userId from response
      const output = resData.output || resData;
      const createdUserId = resData.userId || output.userId || output.user?.id || output.id || resData.id || resData.user?.id;
      const createdUsername = output.username || resData.username || accountForm.username.trim();
      const createdPassword = output.temporaryPassword || output.password || resData.temporaryPassword || resData.password || accountForm.password;

      // Save pending account details for credential display and state refresh AFTER OTP succeeds
      setPendingAccountData({
        citizen: selectedCitizenForAccount,
        familyId: targetFamilyId,
        username: createdUsername,
        password: createdPassword,
        citizenName
      });

      // Close registration form modal & open OTP verification popup with userId attached
      setModalType('');
      setOtpTargetUserId(createdUserId);
      setOtpTargetEmail(accountForm.email.trim());
      setShowOtpModal(true);

    } catch (err) {
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

  const handleOtpVerificationSuccess = (verifyResData) => {
    setShowOtpModal(false);

    if (!pendingAccountData) return;

    const { citizen, familyId, username, password, citizenName } = pendingAccountData;

    // 1. Show Account Credentials Alert
    showAccountCredentialsAlert(username, password, citizenName);

    // 2. Persist to local created accounts registry AFTER OTP verified
    saveCreatedAccount(citizen, familyId, username, password);

    // 3. Refresh citizen state only after OTP is successfully verified
    const targetCitizenId = citizen.id || citizen.warga_id;
    const targetCitizenNik = citizen.nik;
    const cleanSelectedName = cleanNameStr(citizen.name || citizen.nama);

    const updatedWargaList = wargaList.map(item => {
      const isMatch = (targetCitizenId && (item.id === targetCitizenId || item.warga_id === targetCitizenId)) || 
                      (targetCitizenNik && item.nik === targetCitizenNik) ||
                      (!targetCitizenId && !targetCitizenNik && cleanSelectedName && cleanNameStr(item.name || item.nama) === cleanSelectedName);
      if (isMatch) {
        return {
          ...item,
          username: username,
          account_username: username,
          password: password,
          has_account: true,
          account_created: true,
          is_verified: 1
        };
      }
      return item;
    });

    setWargaList(updatedWargaList);
    try {
      localStorage.setItem('rt_wargalist', JSON.stringify(updatedWargaList));
    } catch (e) {}

    if (typeof fetchResidentServerList === 'function') fetchResidentServerList();
    if (typeof fetchWargaListFromServer === 'function') fetchWargaListFromServer();

    setPendingAccountData(null);
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
        status: (sub.status === 'selesai' || sub.status === 'Completed' || sub.status === 'Selesai') ? 'Completed' : ((sub.status === 'disetujui' || sub.status === 'Approved') ? 'Approved' : ((sub.status === 'ditolak' || sub.status === 'Rejected') ? 'Rejected' : 'Pending')),
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

  const calcIplLunas = typeof dashboardStats?.ipl_lunas === 'number' && dashboardStats.ipl_lunas <= uniqueKKs
    ? dashboardStats.ipl_lunas
    : (financeTrackingList.length > 0
        ? financeTrackingList.filter(f => f.status === 'Lunas').length
        : wargaList.filter(w => w.statusIuran === 'Lunas' && w.statusHidup === 'Hidup').length);

  const calcIplBelumLunas = typeof dashboardStats?.ipl_belum_lunas === 'number' && (calcIplLunas + dashboardStats.ipl_belum_lunas <= uniqueKKs)
    ? dashboardStats.ipl_belum_lunas
    : Math.max(0, uniqueKKs - calcIplLunas);

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
      const birthDateVal = item.tglLahir || item.tgl_lahir || item.tanggalLahir || '';
      const calculatedAgeVal = item.usia || item.umur || (birthDateVal ? calculateAge(birthDateVal) : '');
      setWargaForm({
        name: item.name || item.nama || '',
        username: item.username || '',
        password: item.password || '',
        nik: item.nik || '',
        noKk: item.noKk || item.no_kk || '',
        alamat: item.alamat || '',
        gender: item.gender || item.jenisKelamin || item.jenis_kelamin || 'Laki-laki',
        usia: calculatedAgeVal,
        status: item.status || 'Tetap',
        statusHidup: item.statusHidup || item.status_hidup || 'Hidup',
        email: item.email || '',
        role: item.role || 'warga',
        blok: item.blok || item.house_blok || '',
        nomor: item.nomor || item.house_nomor || '',
        tglLahir: birthDateVal,
        noHp: item.noHp || item.no_hp || ''
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
          const response = await fetch(`http://172.20.32.31:3333/admin/agenda/${id}`, {
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
    if (isSubmittingWarga) return;
    setFormError('');

    if (!wargaForm.name || !wargaForm.alamat || (wargaForm.usia === '' || wargaForm.usia === null || wargaForm.usia === undefined) || !wargaForm.blok || !wargaForm.nomor || !wargaForm.tglLahir || !wargaForm.noHp) {
      setFormError('Semua kolom bertanda wajib (*) harus diisi.');
      return;
    }

    setIsSubmittingWarga(true);

    try {
      if (modalType === 'add_warga') {
        if (wargaForm.nik.length !== 16 || isNaN(wargaForm.nik)) {
          setFormError('NIK harus berupa 16 digit angka.');
          setIsSubmittingWarga(false);
          return;
        }
        if (wargaForm.noKk.length !== 16 || isNaN(wargaForm.noKk)) {
          setFormError('Nomor KK harus berupa 16 digit angka.');
          setIsSubmittingWarga(false);
          return;
        }

        // Check duplicate NIK across both local state and server resident list
        const existingInWarga = wargaList.some(w => w.nik && String(w.nik).trim() === String(wargaForm.nik).trim());
        const existingInServer = residentServerList.some(r => {
          const serverNik = r.nik || r.no_nik || r.kepala_keluarga_nik || r.nik_kepala_keluarga;
          return serverNik && String(serverNik).trim() === String(wargaForm.nik).trim();
        });

        if (existingInWarga || existingInServer) {
          setFormError(`NIK ${wargaForm.nik} sudah terdaftar dalam sistem!`);
          Swal.fire({
            title: 'NIK Sudah Terdaftar!',
            text: `Data warga dengan NIK ${wargaForm.nik} sudah ada di database server. Silakan periksa kembali.`,
            icon: 'warning',
            confirmButtonColor: '#f59e0b'
          });
          setIsSubmittingWarga(false);
          return;
        }

        const token = localStorage.getItem('rt_token');

        if (!token) {
          setFormError('Token otentikasi tidak ditemukan. Harap login kembali.');
          setIsSubmittingWarga(false);
          return;
        }

        const genderCode = (wargaForm.gender === 'Perempuan' || wargaForm.gender === 'P') ? 'P' : 'L';
        const houseStatus = (wargaForm.status?.toLowerCase() === 'tetap' || wargaForm.status?.toLowerCase() === 'pribadi') ? 'pribadi' : 'kontrak';

        const payload = {
          house: {
            blok: wargaForm.blok.trim(),
            nomor: parseInt(wargaForm.nomor) || String(wargaForm.nomor).trim(),
            alamat: wargaForm.alamat.trim(),
            status: houseStatus
          },
          family: {
            noKK: wargaForm.noKk.trim()
          },
          warga: {
            nik: wargaForm.nik.trim(),
            nama: wargaForm.name.trim(),
            jenisKelamin: genderCode,
            tglLahir: wargaForm.tglLahir,
            statusHidup: wargaForm.statusHidup || 'Hidup',
            noHp: wargaForm.noHp.trim(),
            umur: parseInt(wargaForm.usia) || 0
          }
        };

        const res = await fetch('http://172.20.32.31:3333/admin/register-resident-only', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) {
          const errMsg = data.message || data.pesan || data.errors?.map(e => e.message).join(', ') || 'Gagal mendaftarkan data kependudukan warga ke server.';
          throw new Error(errMsg);
        }

        const output = data.output || {};
        const house_id = output.houseId || output.house_id || output.pesan?.houseId;
        const family_id = output.familyId || output.family_id || output.pesan?.familyId;
        const warga_id = output.wargaId || output.warga_id || output.kepalaKeluargaId || output.pesan?.wargaId;

        const newWarga = {
          ...wargaForm,
          id: warga_id ? ('WRG-' + warga_id) : ('WRG-' + Math.floor(Math.random() * 9000 + 1000)),
          warga_id: warga_id,
          family_id: family_id,
          house_id: house_id,
          gender: wargaForm.gender,
          usia: parseInt(wargaForm.usia) || 0,
          username: '',
          password: '',
          email: '',
          role: 'warga'
        };
        saveWarga([...wargaList, newWarga]);
        if (typeof fetchResidentServerList === 'function') fetchResidentServerList();

        Swal.fire({
          title: 'Berhasil!',
          text: data.message || 'Data kependudukan warga berhasil didaftarkan!',
          icon: 'success',
          confirmButtonColor: '#10b981'
        });
        setModalType('');
      } else {
        // edit warga
        if (wargaForm.username && wargaList.some(w => w.id !== selectedItem?.id && w.username && w.username.toLowerCase() === wargaForm.username.toLowerCase())) {
          setFormError('Username sudah digunakan.');
          setIsSubmittingWarga(false);
          return;
        }

        const token = localStorage.getItem('rt_token');
        const targetId = selectedItem?.id || selectedItem?.warga_id || selectedItem?.family_id;

        if (token && targetId) {
          const response = await fetch(`http://172.20.32.31:3333/resident/warga/${targetId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              nama: wargaForm.name,
              statusHidup: wargaForm.statusHidup,
              noHp: wargaForm.noHp,
              umur: parseInt(wargaForm.usia) || 0
            })
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || data.pesan || 'Gagal memperbarui data warga di server.');
          }
        }

        const updated = wargaList.map(w => w.id === selectedItem?.id ? { ...wargaForm, name: wargaForm.name, usia: parseInt(wargaForm.usia) || 0 } : w);
        saveWarga(updated);
        if (typeof fetchResidentServerList === 'function') fetchResidentServerList();

        Swal.fire({
          title: 'Berhasil!',
          text: 'Data warga berhasil diperbarui!',
          icon: 'success',
          confirmButtonColor: '#10b981'
        });
        setModalType('');
      }
    } catch (err) {
      console.error('Save warga error:', err);
      setFormError(err.message || 'Gagal menyimpan data warga ke server.');
      Swal.fire({
        title: 'Gagal Menyimpan!',
        text: err.message || 'Terjadi kesalahan saat menghubungi server database.',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setIsSubmittingWarga(false);
    }
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
          ? 'http://172.20.32.31:3333/admin/finance/income' 
          : 'http://172.20.32.31:3333/admin/finance/expense';
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
        const response = await fetch('http://172.20.32.31:3333/admin/agenda', {
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
        Swal.fire({
          title: 'Berhasil!',
          text: resData.message || 'Agenda kegiatan berhasil dibuat!',
          icon: 'success',
          confirmButtonColor: '#10b981'
        });
      } else {
        const response = await fetch(`http://172.20.32.31:3333/admin/agenda/${selectedItem.id}`, {
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
        Swal.fire({
          title: 'Berhasil!',
          text: resData.message || 'Agenda kegiatan berhasil diperbarui!',
          icon: 'success',
          confirmButtonColor: '#10b981'
        });
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
      const res = await fetch(`http://172.20.32.31:3333/admin/surat-masuk/${id}`, {
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
      const res = await fetch(`http://172.20.32.31:3333/admin/surat-keluar/${id}`, {
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
        ? `http://172.20.32.31:3333/admin/surat-masuk/${suratMasukForm.id}`
        : 'http://172.20.32.31:3333/admin/surat-masuk';
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
        ? `http://172.20.32.31:3333/admin/surat-keluar/${suratKeluarForm.id}`
        : 'http://172.20.32.31:3333/admin/surat-keluar';
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
    // 1. Optimistic / local state update
    const updatedSubmissionsList = submissionsList.map(sub => {
      if (sub.id === id || String(sub.id) === String(id)) {
        return {
          ...sub,
          status: nextStatus,
          processedDate: formatDateIndo(new Date())
        };
      }
      return sub;
    });
    setSubmissionsList(updatedSubmissionsList);
    saveSubmissions(updatedSubmissionsList);

    // Map nextStatus to backend status
    let apiStatus = 'pending';
    if (nextStatus === 'Approved') {
      apiStatus = 'disetujui';
    } else if (nextStatus === 'Completed') {
      apiStatus = 'selesai';
    } else if (nextStatus === 'Rejected') {
      apiStatus = 'ditolak';
    }

    // Update serverSubmissions state optimistically
    setServerSubmissions(prev => prev.map(s => (s.id === id || String(s.id) === String(id)) ? { ...s, status: apiStatus } : s));

    const token = localStorage.getItem('rt_token');
    if (token && !(typeof id === 'string' && id.startsWith('LTR-'))) {
      try {
        await fetch(`http://172.20.32.31:3333/admin/pengajuan/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: apiStatus })
        });
      } catch (err) {
        console.warn('Backend update failed, using local update:', err);
      }
    }

    const statusTitle = nextStatus === 'Approved' ? 'Disetujui! ✅' : nextStatus === 'Completed' ? 'Selesai & Diambil! 🎉' : 'Ditolak ❌';
    const statusText = nextStatus === 'Approved' 
      ? 'Pengajuan surat pengantar warga telah disetujui.' 
      : nextStatus === 'Completed' 
      ? 'Surat pengantar telah diselesaikan dan diambil oleh warga.' 
      : 'Pengajuan surat pengantar warga ditolak.';

    Swal.fire({
      title: statusTitle,
      text: statusText,
      icon: nextStatus === 'Rejected' ? 'warning' : 'success',
      confirmButtonColor: nextStatus === 'Rejected' ? '#ef4444' : '#10b981'
    });
  };

  // 4-Category Admin Live Notification Feed (IPL, Kegiatan, Jadwal, Kematian)
  const safeWargaList = Array.isArray(wargaList) ? wargaList : [];
  const deceasedWargaList = safeWargaList.filter(w => w.statusHidup === 'Meninggal');
  const safePendingIpl = Array.isArray(pendingPayments?.ipl) ? pendingPayments.ipl : [];
  const safePendingKas = Array.isArray(pendingPayments?.kas) ? pendingPayments.kas : [];
  const safeAnnouncements = Array.isArray(serverAnnouncements) ? serverAnnouncements : [];
  const safeAgendas = Array.isArray(agendaList) ? agendaList : [];

  const adminNotifications = [
    // 1. 💳 IPL & KAS NOTIFICATIONS
    ...safePendingIpl.map(item => ({
      id: `ADM-IPL-${item.id}`,
      category: 'ipl',
      targetTab: 'iuran_verifikasi',
      title: `💳 Setoran IPL: ${item.warga_nama || 'Warga RT'}`,
      message: `Setoran sebesar ${formatRupiah(item.amount)} untuk ${item.period_title || 'IPL Bulanan'} menunggu verifikasi berkas transfer.`,
      time: item.payment_date ? formatDateIndo(item.payment_date) : 'Baru Masuk',
      isUrgent: true
    })),
    ...safePendingKas.map(item => ({
      id: `ADM-KAS-${item.id}`,
      category: 'ipl',
      targetTab: 'iuran_verifikasi',
      title: `💰 Sumbangan Kas: ${item.warga_nama || 'Warga RT'}`,
      message: `Sumbangan ${item.category || 'Kas Sosial'} sebesar ${formatRupiah(item.amount)} ("${item.description || '-'}") menunggu verifikasi.`,
      time: item.payment_date ? formatDateIndo(item.payment_date) : 'Baru Masuk',
      isUrgent: true
    })),

    // 2. 📢 KEGIATAN WARGA & PENGUMUMAN
    ...safeAnnouncements.map(item => ({
      id: `ADM-ANN-${item.id}`,
      category: 'kegiatan',
      targetTab: 'sek_info_pengumuman',
      title: `📢 Kegiatan: ${item.judul || item.title || 'Pengumuman RT'}`,
      message: item.isi || item.content || 'Pengumuman resmi kegiatan lingkungan RT 05.',
      time: item.tanggal ? formatDateIndo(item.tanggal) : 'Aktif',
      isUrgent: false
    })),

    // 3. 📅 JADWAL & AGENDA KEGIATAN RT
    ...safeAgendas.map(item => ({
      id: `ADM-AGD-${item.id}`,
      category: 'jadwal',
      targetTab: 'agenda',
      title: `🗓️ Jadwal: ${item.title || item.judul || 'Agenda RT'}`,
      message: `Jadwal "${item.title || item.judul}" terlaksana pada ${item.date ? formatDateIndo(item.date) : 'Jadwal'} di ${item.location || item.tempat || 'RT 05'}.`,
      time: item.date ? formatDateIndo(item.date) : 'Mendatang',
      isUrgent: false
    })),

    // 4. 🕊️ KEMATIAN & KEPENDUDUKAN
    ...deceasedWargaList.map(item => ({
      id: `ADM-DEC-${item.id}`,
      category: 'kematian',
      targetTab: 'warga',
      title: `🕊️ Data Kematian: ${item.gender === 'Perempuan' ? 'Almh. Ibu' : 'Alm. Bpk'} ${item.name}`,
      message: `Status kependudukan terdata Meninggal Dunia (${item.alamat ? `Warga ${item.alamat}` : 'Warga RT 05'}). Dana santunan duka cita dapat disalurkan.`,
      time: 'Arsip Kematian',
      isUrgent: true
    }))
  ];

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
            <img src={logoGSP} alt="Logo Sawangan Green Park" className="h-7 w-auto object-contain drop-shadow-xs" />
            <div>
              <h1 className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight">Admin Sawangan Green Park</h1>
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
                <img src={logoGSP} alt="Logo Sawangan Green Park" className="h-8 w-auto object-contain drop-shadow-xs" />
                <div>
                  <h1 className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight">Sawangan Green Park</h1>
                  <span className="text-[8px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider block">Admin Portal • RT 05</span>
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
                  <>
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
                    <button
                      onClick={() => { setActiveTab('sek_warga_masuk'); setSearchQuery(''); }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'sek_warga_masuk'
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <UserCheck className="w-4 h-4 text-emerald-500" />
                        <span>Verifikasi Registrasi Warga</span>
                      </div>
                      {pendingWargaList.length > 0 && (
                        <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-extrabold animate-pulse">
                          {pendingWargaList.length}
                        </span>
                      )}
                    </button>
                  </>
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
          <img src={logoGSP} alt="Logo Sawangan Green Park" className="h-10 w-auto object-contain drop-shadow-md" />
          <div>
            <h1 className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight leading-tight">Sawangan Green Park</h1>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 uppercase font-extrabold tracking-widest leading-none block mt-0.5">Admin Portal • RT 05</span>
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
                      onClick={() => { setActiveTab('kas'); setSearchQuery(''); }}
                      className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'kas' 
                          ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] font-bold'
                          : 'text-slate-500 dark:text-slate-405 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/30 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'kas' ? 'bg-[var(--color-primary-wf)] scale-125' : 'bg-slate-300 dark:bg-slate-655'}`}></span>
                      <span>Monitoring Keuangan</span>
                    </button>
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
                      <span>Catat Bayaran Warga</span>
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
                      className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        activeTab === 'sek_warga_masuk' 
                          ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] font-bold'
                          : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/30 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'sek_warga_masuk' ? 'bg-[var(--color-primary-wf)] scale-125' : 'bg-slate-600'}`}></span>
                        <span>Verifikasi Warga Baru</span>
                      </div>
                      {pendingWargaList.length > 0 && (
                        <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                          {pendingWargaList.length}
                        </span>
                      )}
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
                      className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        activeTab === 'sek_warga_masuk' 
                          ? 'bg-[var(--color-primary-wf)] text-[var(--color-on-primary-wf)] font-bold'
                          : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/30 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'sek_warga_masuk' ? 'bg-[var(--color-primary-wf)] scale-125' : 'bg-slate-600'}`}></span>
                        <span>Verifikasi Warga Baru</span>
                      </div>
                      {pendingWargaList.length > 0 && (
                        <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                          {pendingWargaList.length}
                        </span>
                      )}
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
                      <span>Catat Bayaran Warga</span>
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
              {activeTab === 'data_wizard' && 'INPUT DATA PENDUDUK'}
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
                    {activeTab === 'data_wizard' && 'Pendaftaran Rumah, KK & Warga ⚡'}
                    {activeTab === 'layanan' && 'Loket Persetujuan Surat Pengantar Warga 📝'}
                    {activeTab === 'sek_surat_masuk' && 'Modul Catatan & Berkas Surat Masuk 📥'}
                    {activeTab === 'sek_surat_template' && 'Simulator & Pratinjau Kop Surat Resmi A4 📜'}
                    {activeTab === 'iuran_jenis' && 'Pengaturan Tarif & Nominal Iuran Bulanan IPL 💳'}
                    {activeTab === 'iuran_pembayaran' && 'Form Pencatatan Pembayaran Manual Warga ✍️'}
                    {activeTab === 'iuran_riwayat' && 'Riwayat & Log Setoran Pembayaran Iuran 📊'}
                    {activeTab === 'iuran_tunggakan' && 'Daftar Tunggakan Iuran Bulanan Warga ⚠️'}
                    {activeTab === 'iuran_verifikasi' && 'Verifikasi Setoran Transfer & Bukti Warga 🔍'}
                    {activeTab === 'keuangan_pemasukan' && 'Form Catat Pemasukan Kas RT Non-Iuran 📥'}
                    {activeTab === 'keuangan_pengeluaran' && 'Form Catat Pengeluaran Belanja RT 📤'}
                    {activeTab === 'keuangan_kas' && 'Buku Kas Umum & Transaksi 💰'}
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
                    {activeTab === 'logs' && 'Log Audit Akses Pengurus 🛡️'}
                    {activeTab === 'pengaturan' && 'Pengaturan Keuangan & Kata Sandi ⚙️'}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-emerald-100 max-w-2xl leading-relaxed font-medium">
                    Sistem Portal Manajemen RT 05 untuk kelancaran administrasi dan pelayanan warga.
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
                      {calcIplLunas} <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">KK</span>
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
                      {calcIplBelumLunas} <span className="text-xs text-rose-500 font-bold">KK</span>
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
                    {/* 1. Tambah Warga */}
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

                    {/* 2. Persetujuan Surat */}
                    <button
                      onClick={() => { setActiveTab('layanan'); setSearchQuery(''); }}
                      className="w-full p-3 sm:py-3 sm:px-4 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500 text-purple-600 dark:text-purple-400 font-bold text-xs rounded-2xl flex flex-col sm:flex-row items-center justify-center sm:justify-between text-center sm:text-left gap-2 group transition-all active:scale-95 cursor-pointer min-h-[84px] sm:min-h-[52px]"
                    >
                      <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
                        <div className="p-2 sm:p-1.5 bg-purple-500 text-white rounded-xl shadow-xs shrink-0">
                          <FileCheck className="w-5 h-5 sm:w-4 sm:h-4" />
                        </div>
                        <span className="text-[11px] sm:text-xs leading-tight">Persetujuan Surat</span>
                      </div>
                      <ChevronRight className="w-4 h-4 hidden sm:block transition-transform group-hover:translate-x-1" />
                    </button>

                    {/* 3. Pembayaran IPL */}
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

                    {/* 4. Pengaduan */}
                    <button
                      onClick={() => { setActiveTab('sek_pengaduan'); setSearchQuery(''); }}
                      className="w-full p-3 sm:py-3 sm:px-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-2xl flex flex-col sm:flex-row items-center justify-center sm:justify-between text-center sm:text-left gap-2 group transition-all active:scale-95 cursor-pointer min-h-[84px] sm:min-h-[52px]"
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

                {/* Right panel: Live 4-Category Notification & Changes Feed (7 Cols) */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 lg:p-7 shadow-xs flex flex-col justify-between space-y-4 font-sans">
                  
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Pusat Notifikasi & Perubahan RT</h3>
                        <p className="text-[10px] text-slate-400">Log operasional real-time IPL, Kegiatan, Jadwal, dan Data Kematian</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        {adminNotifications.length} Info Terkini
                      </span>
                    </div>
                  </div>

                  {/* 4-Category Filter Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[11px] font-bold">
                    {[
                      { id: 'semua', label: '🔔 Semua' },
                      { id: 'ipl', label: '💳 IPL & Kas' },
                      { id: 'kegiatan', label: '📢 Kegiatan' },
                      { id: 'jadwal', label: '📅 Jadwal' },
                      { id: 'kematian', label: '🕊️ Kematian' },
                    ].map((flt) => (
                      <button
                        key={flt.id}
                        type="button"
                        onClick={() => setAdminNotifCategory(flt.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          adminNotifCategory === flt.id
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {flt.label}
                      </button>
                    ))}
                  </div>

                  {/* Notification items list */}
                  <div className="space-y-2.5 flex-1 max-h-[380px] sm:max-h-[440px] overflow-y-auto pr-1 custom-scrollbar">
                    {adminNotifications
                      .filter(act => adminNotifCategory === 'semua' || act.category === adminNotifCategory)
                      .map((act) => (
                        <div
                          key={act.id}
                          onClick={() => setActiveTab(act.targetTab || 'overview')}
                          className={`p-3.5 rounded-2xl border transition-all duration-200 flex items-start justify-between gap-3 cursor-pointer hover:scale-[1.01] group ${
                            act.isUrgent
                              ? 'bg-rose-500/10 dark:bg-rose-950/20 border-rose-500/30'
                              : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-800 hover:border-emerald-500/40'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className={`p-2 rounded-xl text-white shrink-0 mt-0.5 shadow-xs ${
                              act.category === 'ipl'
                                ? 'bg-gradient-to-br from-amber-500 to-emerald-600'
                                : act.category === 'kegiatan'
                                ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                                : act.category === 'jadwal'
                                ? 'bg-gradient-to-br from-purple-500 to-pink-600'
                                : 'bg-gradient-to-br from-rose-600 to-red-700'
                            }`}>
                              {act.category === 'ipl' ? (
                                <Wallet className="w-3.5 h-3.5" />
                              ) : act.category === 'kegiatan' ? (
                                <Volume2 className="w-3.5 h-3.5" />
                              ) : act.category === 'jadwal' ? (
                                <Calendar className="w-3.5 h-3.5" />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center justify-between gap-1.5">
                                <h5 className="font-extrabold text-slate-900 dark:text-white text-xs group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                                  {act.title}
                                </h5>
                                <span className="text-[9px] font-mono text-slate-400 shrink-0">{act.time}</span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed line-clamp-2">
                                {act.message}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center self-center shrink-0">
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                              ↗
                            </span>
                          </div>
                        </div>
                      ))}

                    {adminNotifications.filter(act => adminNotifCategory === 'semua' || act.category === adminNotifCategory).length === 0 && (
                      <div className="p-8 text-center text-slate-400 text-xs italic">
                        Belum ada notifikasi pada kategori ini.
                      </div>
                    )}
                  </div>

                  <div className="pt-2 text-[10px] text-slate-400 font-bold flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
                    <span>🟢 Live Real-Time Feed</span>
                    <span>Klik item untuk menuju modul terkait</span>
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
                      onClick={fetchResidentServerList}
                      className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      title="Muat Ulang Data"
                    >
                      🔄 Refresh
                    </button>
                  </div>
                </div>

                {isLoadingResidents ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                    <span className="text-slate-500 dark:text-slate-400 font-medium text-xs">Memuat data...</span>
                  </div>
                ) : residentError ? (
                  <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl flex flex-col items-center gap-3 text-center">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                    <div className="space-y-1">
                      <h5 className="font-bold text-slate-900 dark:text-white text-xs">Gagal Memuat Data</h5>
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
                                : 'Belum ada data keluarga yang terdaftar.'}
                            </p>
                          </div>
                          {(searchQuery || accountFilter !== 'all') && (
                            <button
                              onClick={() => { setSearchQuery(''); setAccountFilter('all'); }}
                              className="py-1.5 px-4 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                            >
                              Reset Filter & Pencarian
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
                                        Sudah Ada Akun
                                        {foundUsername ? ` (@${foundUsername})` : ''}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30 rounded-full font-extrabold text-[9px]">
                                        <XIcon className="w-3 h-3 text-rose-500" />
                                        Belum Ada Akun
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

                                    {!hasAccount && (
                                      <button
                                        onClick={() => openRegisterAccountModal(r)}
                                        disabled={isCreatingAccount}
                                        className="py-1 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-[10px] font-extrabold transition-all cursor-pointer flex items-center gap-1 shadow-sm disabled:opacity-50"
                                      >
                                        Registrasi Akun
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
                            <div className="inline-flex gap-1.5 justify-end items-center">
                              <button
                                type="button"
                                onClick={() => handleViewKtp(w)}
                                className="py-1 px-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                              >
                                Lihat KTP
                              </button>
                              <button
                                onClick={() => handleVerifyPendingWarga(w.warga_id || w.id, 'diterima')}
                                className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                              >
                                Setujui
                              </button>
                              <button
                                onClick={() => handleVerifyPendingWarga(w.warga_id || w.id, 'ditolak')}
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
                            Belum ada pengaduan terdaftar.
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
                  let uploadedUrl = arsipForm.fileUrl;
                  let fileSizeStr = arsipForm.size || '1.5 MB';

                  if (arsipForm.file) {
                    uploadedUrl = URL.createObjectURL(arsipForm.file);
                    const sizeMB = (arsipForm.file.size / (1024 * 1024)).toFixed(2);
                    fileSizeStr = `${sizeMB} MB`;
                  }

                  const newEntry = {
                    id: 'ARC-' + Math.floor(Math.random() * 900 + 100),
                    name: arsipForm.name,
                    date: arsipForm.date,
                    size: fileSizeStr,
                    category: arsipForm.category,
                    fileUrl: uploadedUrl
                  };
                  setArsipFileList([newEntry, ...arsipFileList]);
                  setArsipForm({ name: '', category: 'Foto Dokumentasi', size: '1.5 MB', date: new Date().toISOString().split('T')[0], file: null, fileUrl: null });
                  Swal.fire('Berhasil!', 'Berkas media/foto/video berhasil diarsipkan!', 'success');
                }}
                className="p-5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 rounded-3xl space-y-4 max-w-xl font-sans"
              >
                <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">Arsipkan Berkas & Dokumentasi Baru</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">Judul / Nama Dokumen File *</label>
                    <input
                      required
                      type="text"
                      value={arsipForm.name}
                      onChange={(e) => setArsipForm({ ...arsipForm, name: e.target.value })}
                      placeholder="Contoh: Foto_Kerja_Bakti_Agustus.jpg"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">Kategori Arsip *</label>
                    <select
                      value={arsipForm.category}
                      onChange={(e) => setArsipForm({ ...arsipForm, category: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-bold text-xs"
                    >
                      <option value="Foto Dokumentasi">Foto Dokumentasi Kegiatan</option>
                      <option value="Video Kegiatan">Video Dokumentasi / CCTV</option>
                      <option value="Laporan Keuangan">Laporan Keuangan & Struk</option>
                      <option value="Notulen">Notulen Rapat RT</option>
                      <option value="SK Pengurus">SK & Berkas Surat</option>
                      <option value="Dokumen">Dokumen Umum</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Unggah Berkas (Foto, Video, PDF) *</label>
                  <input
                    type="file"
                    accept="image/*,video/*,application/pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setArsipForm({
                          ...arsipForm,
                          file,
                          name: arsipForm.name || file.name
                        });
                      }
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white text-xs"
                  />
                </div>

                <button type="submit" className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm">
                  Arsipkan File / Media
                </button>
              </form>

              <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider">
                      <th className="p-4">No. Arsip</th>
                      <th className="p-4">Nama Dokumen / Media</th>
                      <th className="p-4">Kategori</th>
                      <th className="p-4">Tanggal Arsip</th>
                      <th className="p-4 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {arsipFileList.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-500">{a.id}</td>
                        <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{a.name} ({a.size})</td>
                        <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">{a.category}</td>
                        <td className="p-4 text-slate-500">{formatDateIndo(a.date)}</td>
                        <td className="p-4 text-right font-sans">
                          <button 
                            type="button"
                            onClick={() => {
                              if (a.fileUrl) {
                                window.open(a.fileUrl, '_blank');
                              } else {
                                Swal.fire('Informasi', `Pratinjau/Unduh berkas ${a.name} (${a.size})`, 'info');
                              }
                            }} 
                            className="py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg cursor-pointer transition-colors"
                          >
                            Unduh / Lihat File
                          </button>
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
                        placeholder="Minimal 8 karakter"
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
                        🟢 Sudah Ada Akun
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
                        🔴 Belum Ada Akun
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
                        <option value="SudahAkun">🟢 Sudah Ada Akun ({registeredAccountCount})</option>
                        <option value="BelumAkun">🔴 Belum Ada Akun ({unregisteredAccountCount})</option>
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
                          const displayUsername = getWargaUsername(w) || w.username || w.account_username || null;

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
                                      <span>🟢 Sudah Ada Akun</span>
                                    </span>
                                    {displayUsername && (
                                      <div className="text-[10px] text-slate-600 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md inline-block max-w-full break-all">
                                        Username: <span className="font-extrabold text-slate-900 dark:text-white">@{displayUsername}</span>
                                      </div>
                                    )}

                                  </div>
                                ) : (
                                  <div className="space-y-1.5 pt-0.5">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 font-extrabold text-[10px] border border-rose-500/20 shadow-xs">
                                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                      <span>🔴 Belum Ada Akun</span>
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
                              <div className="text-[10px] text-slate-400">
                                {w.gender || w.jenisKelamin || w.jenis_kelamin || 'Warga'}
                                {(() => {
                                  const ageVal = w.usia || w.umur || ((w.tglLahir || w.tgl_lahir || w.tanggalLahir) ? calculateAge(w.tglLahir || w.tgl_lahir || w.tanggalLahir) : null);
                                  return ageVal ? `, ${ageVal} Thn` : '';
                                })()}
                              </div>
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

          {/* IURAN: 1. Jenis Iuran & Periode Tagihan */}
          {activeTab === 'iuran_jenis' && (
            <div className="space-y-8 animate-fade-in font-sans">
              {/* Bagian 1: Pengaturan Tarif & Saldo Kas */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Daftar Jenis Iuran Warga</h3>
                    <p className="text-xs text-slate-400">Pengaturan tarif iuran wajib dan sukarela RT 05 Sawangan Green Park.</p>
                  </div>

                  {(currentUser.role === 'bendahara' || currentUser.role === 'admin' || currentUser.role === 'rt') && (
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

              {/* Bagian 2: Buat Draft Periode Tagihan IPL Baru (Guideline 8 Bagian A #1) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Buat Periode Tagihan IPL Baru 📅</h3>
                  <p className="text-xs text-slate-400">Buat draft periode tagihan bulanan baru sebelum di-publish (generate invoice) ke seluruh warga.</p>
                </div>

                <form onSubmit={handleCreateBillPeriod} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs sm:text-sm">
                  <div className="space-y-1.5 sm:col-span-2 md:col-span-1">
                    <label className="font-bold text-slate-600 dark:text-slate-400">Judul Periode *</label>
                    <input
                      required
                      type="text"
                      placeholder="Contoh: IPL Periode Maret 2026"
                      value={billPeriodForm.title}
                      onChange={(e) => setBillPeriodForm({ ...billPeriodForm, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-semibold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 dark:text-slate-400">Bulan Periode *</label>
                    <select
                      value={billPeriodForm.periodMonth}
                      onChange={(e) => setBillPeriodForm({ ...billPeriodForm, periodMonth: parseInt(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-bold text-xs text-slate-900 dark:text-white"
                    >
                      {['Januari (1)', 'Februari (2)', 'Maret (3)', 'April (4)', 'Mei (5)', 'Juni (6)', 'Juli (7)', 'Agustus (8)', 'September (9)', 'Oktober (10)', 'November (11)', 'Desember (12)'].map((m, i) => (
                        <option key={i + 1} value={i + 1}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 dark:text-slate-400">Tahun Periode *</label>
                    <input
                      required
                      type="number"
                      value={billPeriodForm.periodYear}
                      onChange={(e) => setBillPeriodForm({ ...billPeriodForm, periodYear: parseInt(e.target.value) || 2026 })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-semibold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 dark:text-slate-400">Nominal Tagihan Default (Rp) *</label>
                    <input
                      required
                      type="number"
                      value={billPeriodForm.defaultAmount}
                      onChange={(e) => setBillPeriodForm({ ...billPeriodForm, defaultAmount: parseInt(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-semibold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 dark:text-slate-400">Batas Jatuh Tempo *</label>
                    <DateInput
                      required
                      value={billPeriodForm.dueDate}
                      onChange={(e) => setBillPeriodForm({ ...billPeriodForm, dueDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-semibold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Buat Draft Periode</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Bagian 3: Daftar Seluruh Periode Tagihan IPL (Guideline 8 Bagian A #2) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Daftar Periode Tagihan IPL 📋</h3>
                    <p className="text-xs text-slate-400">Kelola draft dan periode tagihan yang telah dipublish.</p>
                  </div>
                  <button
                    onClick={fetchBillPeriods}
                    className="py-1 px-3 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer"
                  >
                    🔄 Segarkan
                  </button>
                </div>

                {isLoadingBillPeriods ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center space-y-3">
                    <div className="w-7 h-7 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-slate-400 font-bold">Memuat periode tagihan...</p>
                  </div>
                ) : billPeriodsList.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 font-bold italic text-xs">Belum ada periode tagihan IPL yang dibuat.</div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/70 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider">
                          <th className="p-4">Judul Periode</th>
                          <th className="p-4">Bulan / Tahun</th>
                          <th className="p-4">Nominal Default</th>
                          <th className="p-4">Jatuh Tempo</th>
                          <th className="p-4 text-center">Status</th>
                          <th className="p-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {billPeriodsList.map((p) => {
                          const isDraft = p.status === 'draft';
                          return (
                            <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                              <td className="p-4 font-bold text-slate-900 dark:text-white">
                                {p.title || `IPL Bulan ${p.period_month}/${p.period_year}`}
                              </td>
                              <td className="p-4 font-mono text-slate-600 dark:text-slate-300">
                                {p.period_month} / {p.period_year}
                              </td>
                              <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                                {formatRupiah(p.default_amount || 200000)}
                              </td>
                              <td className="p-4 font-mono text-slate-500">
                                {p.due_date ? formatDateIndo(p.due_date) : '-'}
                              </td>
                              <td className="p-4 text-center">
                                <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg uppercase ${
                                  isDraft
                                    ? 'bg-amber-500/10 text-amber-500'
                                    : 'bg-emerald-500/10 text-emerald-500'
                                }`}>
                                  {p.status || 'draft'}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <div className="inline-flex gap-2 justify-end items-center">
                                  {isDraft && (
                                    <button
                                      onClick={() => handlePublishBillPeriod(p.id, p.title || `Bulan ${p.period_month}/${p.period_year}`)}
                                      className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded-lg transition-colors cursor-pointer"
                                      title="Publish tagihan ke seluruh warga aktif"
                                    >
                                      🚀 Publish Tagihan
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleViewPeriodSummary(p.id)}
                                    className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                                  >
                                    📊 Rekap & Tagihan
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Modal Rekap & Tagihan Detail Periode (Guideline 8 Bagian A #4 & #5) */}
              {isPeriodDetailModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in font-sans">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
                    <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          Rekap Periode: {selectedPeriodSummary?.title || 'Detail Tagihan'}
                        </h3>
                        <p className="text-xs text-slate-400">
                          Bulan: {selectedPeriodSummary?.period_month} / {selectedPeriodSummary?.period_year} | Jatuh Tempo: {selectedPeriodSummary?.due_date ? formatDateIndo(selectedPeriodSummary.due_date) : '-'}
                        </p>
                      </div>
                      <button
                        onClick={() => setIsPeriodDetailModalOpen(false)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {isLoadingPeriodDetails ? (
                      <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs text-slate-400 font-bold">Memuat rekap tagihan periode...</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Summary Cards */}
                        {selectedPeriodSummary && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Tagihan</span>
                              <div className="text-lg font-black text-slate-900 dark:text-white">{selectedPeriodSummary.total_bills || selectedPeriodBills.length || 0}</div>
                            </div>
                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Lunas (Paid)</span>
                              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">{selectedPeriodSummary.paid_bills || selectedPeriodBills.filter(b => b.status === 'paid').length || 0}</div>
                            </div>
                            <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl">
                              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">Tunggakan</span>
                              <div className="text-lg font-black text-rose-600 dark:text-rose-400">{selectedPeriodSummary.unpaid_bills || selectedPeriodBills.filter(b => b.status === 'unpaid' || b.status === 'overdue').length || 0}</div>
                            </div>
                            <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-2xl">
                              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">Bebas (Exempt)</span>
                              <div className="text-lg font-black text-purple-600 dark:text-purple-400">{selectedPeriodSummary.exempt_bills || selectedPeriodBills.filter(b => b.status === 'exempt').length || 0}</div>
                            </div>
                          </div>
                        )}

                        {/* Bills List */}
                        <div className="space-y-3">
                          <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Daftar Tagihan Per Warga</h4>
                          <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800 rounded-2xl max-h-80 overflow-y-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead className="sticky top-0 bg-slate-100 dark:bg-slate-950 z-10">
                                <tr className="border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-400 text-[10px]">
                                  <th className="p-3">Warga / KK</th>
                                  <th className="p-3">Rumah / Blok</th>
                                  <th className="p-3">Nominal</th>
                                  <th className="p-3 text-center">Status</th>
                                  <th className="p-3 text-right">Aksi</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {selectedPeriodBills.map((b) => (
                                  <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                                      {b.warga_nama || b.kepala_keluarga_nama || `Keluarga #${b.family_id || b.id_family}`}
                                    </td>
                                    <td className="p-3 text-slate-500 font-mono text-[11px]">
                                      {b.house_blok || b.blok ? `Blok ${b.house_blok || b.blok} No. ${b.house_nomor || b.nomor || ''}` : '-'}
                                    </td>
                                    <td className="p-3 font-bold font-mono text-emerald-600 dark:text-emerald-400">
                                      {formatRupiah(b.amount || 200000)}
                                    </td>
                                    <td className="p-3 text-center">
                                      <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded uppercase ${
                                        b.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600' :
                                        b.status === 'exempt' ? 'bg-purple-500/10 text-purple-600' :
                                        b.status === 'waiting_verification' ? 'bg-amber-500/10 text-amber-600' :
                                        'bg-rose-500/10 text-rose-600'
                                      }`}>
                                        {b.status || 'unpaid'}
                                      </span>
                                    </td>
                                    <td className="p-3 text-right">
                                      {b.status !== 'paid' && b.status !== 'exempt' && (
                                        <button
                                          onClick={() => handleExemptBill(b.id)}
                                          className="py-0.5 px-2 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold rounded cursor-pointer transition-colors"
                                          title="Bebaskan tagihan (rumah kosong, warga miskin, dll)"
                                        >
                                          Bebaskan (Exempt)
                                        </button>
                                      )}
                                      {b.status === 'exempt' && (
                                        <span className="text-[10px] text-purple-400 italic">Dibebaskan</span>
                                      )}
                                      {b.status === 'paid' && (
                                        <span className="text-[10px] text-emerald-500 font-bold">Lunas</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                                {selectedPeriodBills.length === 0 && (
                                  <tr>
                                    <td colSpan={5} className="p-6 text-center text-slate-400 italic">Belum ada tagihan ter-generate untuk periode ini.</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* IURAN: 2. Pembayaran Form (Manual Payment - Guideline 8 Bagian C #2) */}
          {activeTab === 'iuran_pembayaran' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              
              {/* Header */}
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center font-bold text-lg">
                    💵
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Pencatatan Setoran Tunai / Cash Warga</h3>
                    <p className="text-xs text-slate-400">Catat penerimaan uang cash dari warga yang membayar langsung ke Pak RT, Sekretaris, atau Bendahara (Offline).</p>
                  </div>
                </div>
              </div>

              {/* Informational Context Card */}
              <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-black tracking-wider text-emerald-600 dark:text-emerald-400">Petugas Penerima Setoran Cash:</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    {currentUser?.username || 'Pengurus RT'} • <span className="uppercase text-emerald-500 font-extrabold">{currentUser?.role === 'rt' ? 'Ketua RT' : currentUser?.role === 'bendahara' ? 'Bendahara' : currentUser?.role === 'sekretaris' ? 'Sekretaris' : 'Admin'}</span>
                  </p>
                </div>
                <div className="px-3 py-1.5 bg-emerald-600/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1.5">
                  <span>✓ Jalur Pembayaran Tunai Langsung</span>
                </div>
              </div>

              <form onSubmit={handleManualPaymentSubmit} className="max-w-2xl space-y-5 text-xs sm:text-sm">
                
                {/* 1. Pilih Kepala Keluarga */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Pilih Kepala Keluarga / Warga Pembayar *</label>
                    <button
                      type="button"
                      onClick={fetchKepalaKeluargaList}
                      className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      🔄 Segarkan List Warga
                    </button>
                  </div>
                  <select
                    required
                    value={manualPaymentForm.familyId}
                    onChange={(e) => {
                      const fId = e.target.value;
                      setManualPaymentForm(prev => ({ ...prev, familyId: fId }));
                      fetchUnpaidBillsForFamily(fId);
                    }}
                    className="w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold text-xs"
                  >
                    <option value="">-- {isLoadingKepalaKeluarga ? 'Memuat data warga...' : 'Pilih Nama Kepala Keluarga yang Menyerahkan Uang Cash'} --</option>
                    {(kepalaKeluargaList.length > 0 ? kepalaKeluargaList : wargaList.filter(w => w.statusHidup === 'Hidup'))
                      .map(w => (
                        <option key={w.id} value={w.rawItem?.family_id || w.rawItem?.id_family || w.id}>
                          {w.name} {w.alamat ? '(' + w.alamat + ')' : ''} {w.noKk ? '• KK: ' + w.noKk : ''}
                        </option>
                      ))}
                  </select>
                </div>

                {/* 2. Jenis Iuran & Nominal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Jenis Pembayaran Cash *</label>
                    <select
                      value={manualPaymentForm.jenis_iuran}
                      onChange={(e) => setManualPaymentForm(prev => ({ ...prev, jenis_iuran: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold text-xs"
                    >
                      <option value="ipl">IPL Bulanan (Bisa Rapel)</option>
                      <option value="kas">Uang Kas / Sumbangan Sosial</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Total Uang Cash Diterima (Rp) *</label>
                    <input
                      required
                      type="number"
                      value={manualPaymentForm.amount}
                      onChange={(e) => setManualPaymentForm(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-black font-mono text-sm"
                    />
                  </div>
                </div>

                {/* 3. Detail Tagihan IPL (Checklist Rapel) */}
                {manualPaymentForm.jenis_iuran === 'ipl' && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Pilih Periode Tagihan Yang Dibayar Tunai:</span>
                        <span className="text-[10px] text-slate-400">Centang 1 atau beberapa tagihan sekaligus jika warga membayar rapel.</span>
                      </div>
                      {isLoadingFamilyBills && <span className="text-[10px] text-emerald-500 font-bold animate-pulse">Memeriksa tagihan...</span>}
                    </div>

                    {familyUnpaidBills.length > 0 ? (
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {familyUnpaidBills.map(b => {
                          const isChecked = manualPaymentForm.billIds.includes(b.id);
                          return (
                            <div
                              key={b.id}
                              onClick={() => {
                                let newIds = [];
                                if (isChecked) {
                                  newIds = manualPaymentForm.billIds.filter(id => id !== b.id);
                                } else {
                                  newIds = [...manualPaymentForm.billIds, b.id];
                                }
                                const selectedObjs = familyUnpaidBills.filter(bill => newIds.includes(bill.id));
                                setManualPaymentForm(prev => ({
                                  ...prev,
                                  billIds: newIds,
                                  amount: selectedObjs.reduce((sum, bill) => sum + bill.amount, 0)
                                }));
                              }}
                              className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                                isChecked
                                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                                />
                                <div>
                                  <p className="font-bold text-xs text-slate-900 dark:text-white">
                                    {b.period_title}
                                  </p>
                                  <span className="text-[10px] text-slate-400">
                                    Jatuh tempo: {b.due_date ? formatDateIndo(b.due_date) : '-'}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right font-mono font-black text-xs text-slate-900 dark:text-white">
                                {formatRupiah(b.amount)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2">
                        {manualPaymentForm.familyId ? 'Keluarga ini tidak memiliki tunggakan IPL (Semua tagihan sudah lunas).' : 'Silakan pilih kepala keluarga terlebih dahulu untuk melihat tagihan.'}
                      </p>
                    )}
                  </div>
                )}

                {/* 4. Detail Kas Insidental */}
                {manualPaymentForm.jenis_iuran === 'kas' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 dark:text-slate-300">Kategori Kas Sosial *</label>
                      <select
                        value={manualPaymentForm.category}
                        onChange={(e) => setManualPaymentForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold text-xs"
                      >
                        <option value="sosial">Kas Sosial</option>
                        <option value="kematian">Kas Kematian / Duka Cita</option>
                        <option value="kegiatan">Kas Kegiatan Lingkungan / 17an</option>
                        <option value="lainnya">Kas Lainnya</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 dark:text-slate-300">Keterangan Sumbangan Cash</label>
                      <input
                        type="text"
                        placeholder="Contoh: Titipan santunan duka cita warga Blok B"
                        value={manualPaymentForm.description}
                        onChange={(e) => setManualPaymentForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-semibold text-xs"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="submit"
                    className="py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-black rounded-xl flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-lg shadow-emerald-600/20 text-xs sm:text-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Terbitkan & Simpan Setoran Tunai (Lunas)</span>
                  </button>
                </div>
              </form>
            </div>
          )}

{/* IURAN: 3. Riwayat & Audit Trail (Guideline 8 Bagian B #5) */}
          {activeTab === 'iuran_riwayat' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Riwayat & Audit Log Pembayaran 📊</h3>
                  <p className="text-xs text-slate-400">Rekam jejak seluruh transaksi pembayaran IPL, sumbangan kas, dan verifikasi.</p>
                </div>

                {/* Subtab Switcher */}
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-xs">
                  <button
                    onClick={() => setAuditTab('ipl')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      auditTab === 'ipl' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Audit IPL ({auditIplList.length})
                  </button>
                  <button
                    onClick={() => setAuditTab('kas')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      auditTab === 'kas' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Audit Kas ({auditKasList.length})
                  </button>
                  <button
                    onClick={() => setAuditTab('ledger')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      auditTab === 'ledger' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Buku Kas RT
                  </button>
                </div>
              </div>

              {isLoadingAudit ? (
                <div className="p-8 text-center flex flex-col items-center justify-center space-y-3">
                  <div className="w-7 h-7 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-400 font-bold">Memuat log audit...</p>
                </div>
              ) : auditTab === 'ipl' ? (
                <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider">
                        <th className="p-4">ID / Tanggal</th>
                        <th className="p-4">Warga / KK</th>
                        <th className="p-4">Periode & Metode</th>
                        <th className="p-4">Nominal</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4">Verifikator & Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {auditIplList.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                          <td className="p-4 font-mono space-y-1">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">#{a.id}</span>
                            <span className="text-[10px] text-slate-400">{a.payment_date ? formatDateIndo(a.payment_date) : '-'}</span>
                          </td>
                          <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                            {a.warga_nama || `Keluarga #${a.family_id || a.id_family}`}
                          </td>
                          <td className="p-4 space-y-0.5">
                            <div className="font-semibold text-slate-700 dark:text-slate-300">Bulan {a.month} / {a.year}</div>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500 uppercase">{a.payment_method || 'transfer'}</span>
                          </td>
                          <td className="p-4 font-black font-mono text-emerald-600 dark:text-emerald-400">
                            {formatRupiah(a.amount || 200000)}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg uppercase ${
                              a.status === 'approved' || a.status === 'Disetujui' ? 'bg-emerald-500/10 text-emerald-500' :
                              a.status === 'rejected' || a.status === 'Ditolak' ? 'bg-rose-500/10 text-rose-500' :
                              'bg-amber-500/10 text-amber-500'
                            }`}>
                              {a.status}
                            </span>
                          </td>
                          <td className="p-4 text-slate-600 dark:text-slate-400 space-y-0.5">
                            <div>Oleh: <span className="font-bold">{a.verified_by || a.verifiedBy || '-'}</span></div>
                            {a.rejection_reason && (
                              <div className="text-[10px] text-rose-500 italic">Alasan tolak: {a.rejection_reason}</div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {auditIplList.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400 italic font-bold">Belum ada data audit pembayaran IPL.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : auditTab === 'kas' ? (
                <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider">
                        <th className="p-4">ID / Tanggal</th>
                        <th className="p-4">Warga / KK</th>
                        <th className="p-4">Kategori & Keterangan</th>
                        <th className="p-4">Nominal</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4">Verifikator & Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {auditKasList.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                          <td className="p-4 font-mono space-y-1">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">#{a.id}</span>
                            <span className="text-[10px] text-slate-400">{a.created_at || a.payment_date ? formatDateIndo(a.created_at || a.payment_date) : '-'}</span>
                          </td>
                          <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                            {a.warga_nama || `Keluarga #${a.family_id || a.id_family}`}
                          </td>
                          <td className="p-4 space-y-0.5">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase text-[10px] tracking-wider block">[{a.category || 'Kas'}]</span>
                            <div className="text-slate-700 dark:text-slate-300 font-medium">{a.description || '-'}</div>
                          </td>
                          <td className="p-4 font-black font-mono text-emerald-600 dark:text-emerald-400">
                            {formatRupiah(a.amount || 0)}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg uppercase ${
                              a.status === 'approved' || a.status === 'Disetujui' ? 'bg-emerald-500/10 text-emerald-500' :
                              a.status === 'rejected' || a.status === 'Ditolak' ? 'bg-rose-500/10 text-rose-500' :
                              'bg-amber-500/10 text-amber-500'
                            }`}>
                              {a.status}
                            </span>
                          </td>
                          <td className="p-4 text-slate-600 dark:text-slate-400 space-y-0.5">
                            <div>Oleh: <span className="font-bold">{a.verified_by || a.verifiedBy || '-'}</span></div>
                            {a.rejection_reason && (
                              <div className="text-[10px] text-rose-500 italic">Alasan tolak: {a.rejection_reason}</div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {auditKasList.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400 italic font-bold">Belum ada data audit kontribusi kas.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
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
                        .filter(t => t.category === 'Iuran Warga' || t.type === 'income')
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
                      {transaksiKasList.length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-8 text-center text-slate-450 font-bold italic">Belum ada riwayat transaksi buku kas.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
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
                          <tr className="bg-slate-50/70 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider text-[10px]">
                            <th className="p-4">Warga / KK</th>
                            <th className="p-4">Waktu Upload</th>
                            <th className="p-4">Periode Tagihan</th>
                            <th className="p-4">Nominal</th>
                            <th className="p-4">File Struk</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {pendingPayments.ipl && pendingPayments.ipl.map((b) => {
                            const matchingResident = residentServerList.find(r => 
                              (r.family_id !== undefined && (r.family_id === b.family_id || r.family_id === b.id_family)) ||
                              (r.id !== undefined && (r.id === b.family_id || r.id === b.id_family))
                            );
                            const residentName = b.warga_nama && !b.warga_nama.startsWith('Keluarga KK #')
                              ? b.warga_nama
                              : (matchingResident ? matchingResident.kepala_keluarga_nama : (b.warga_nama || 'Warga'));

                            return (
                              <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                                <td className="p-4 space-y-0.5">
                                  <span className="font-bold text-slate-900 dark:text-white block text-xs">
                                    {residentName}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono block">ID Transaksi: #{b.id}</span>
                                </td>
                                <td className="p-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                                  {formatDateTimeIndo(b.payment_date || b.created_at)}
                                </td>
                                <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">
                                  {formatPeriodLabel(b, 'ipl')}
                                </td>
                                <td className="p-4 font-black font-mono text-slate-900 dark:text-white">
                                  {formatRupiah(b.amount)}
                                </td>
                                <td className="p-4 max-w-xs truncate text-slate-400 font-mono text-[11px]" title={b.payment_proof}>
                                  {b.payment_proof || '-'}
                                </td>
                                <td className="p-4 text-center">
                                  <span className="px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse border border-amber-500/20">
                                    {b.status || 'Pending'}
                                  </span>
                                </td>
                                <td className="p-4 text-right font-sans">
                                  <div className="inline-flex gap-1.5 justify-end items-center">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenProofModal(b, 'ipl')}
                                      className="py-1 px-2.5 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-[10px] rounded-lg transition-colors cursor-pointer"
                                    >
                                      Lihat File
                                    </button>
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
                            );
                          })}
                          {(!pendingPayments.ipl || pendingPayments.ipl.length === 0) && (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-slate-400 font-bold italic">Tidak ada pembayaran IPL yang perlu diverifikasi.</td>
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
                          <tr className="bg-slate-50/70 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider text-[10px]">
                            <th className="p-4">Warga / KK</th>
                            <th className="p-4">Waktu Upload</th>
                            <th className="p-4">Kategori & Keterangan</th>
                            <th className="p-4">Nominal</th>
                            <th className="p-4">File Struk</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {pendingPayments.kas && pendingPayments.kas.map((b) => {
                            const matchingResident = residentServerList.find(r => 
                              (r.family_id !== undefined && (r.family_id === b.family_id || r.family_id === b.id_family)) ||
                              (r.id !== undefined && (r.id === b.family_id || r.id === b.id_family))
                            );
                            const residentName = b.warga_nama && !b.warga_nama.startsWith('Keluarga KK #')
                              ? b.warga_nama
                              : (matchingResident ? matchingResident.kepala_keluarga_nama : (b.warga_nama || 'Warga'));

                            return (
                              <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                                <td className="p-4 space-y-0.5">
                                  <span className="font-bold text-slate-900 dark:text-white block text-xs">
                                    {residentName}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono block">ID Transaksi: #{b.id}</span>
                                </td>
                                <td className="p-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                                  {formatDateTimeIndo(b.payment_date || b.created_at)}
                                </td>
                                <td className="p-4">
                                  <span className="font-bold text-slate-800 dark:text-slate-200 block capitalize">{b.category}</span>
                                  <span className="text-[10px] text-slate-400 block italic">"{b.description}"</span>
                                </td>
                                <td className="p-4 font-black text-emerald-600 dark:text-emerald-400 font-mono">
                                  +{formatRupiah(b.amount)}
                                </td>
                                <td className="p-4 max-w-xs truncate text-slate-455 font-mono text-[11px]" title={b.payment_proof}>
                                  {b.payment_proof || '-'}
                                </td>
                                <td className="p-4 text-center">
                                  <span className="px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse border border-amber-500/20">
                                    {b.status || 'Pending'}
                                  </span>
                                </td>
                                <td className="p-4 text-right font-sans">
                                  <div className="inline-flex gap-1.5 justify-end items-center">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenProofModal(b, 'kas')}
                                      className="py-1 px-2.5 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-[10px] rounded-lg transition-colors cursor-pointer"
                                    >
                                      Lihat File
                                    </button>
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
                            );
                          })}
                          {(!pendingPayments.kas || pendingPayments.kas.length === 0) && (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-slate-455 font-bold italic">Tidak ada pembayaran Kas yang perlu diverifikasi.</td>
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
                    const res = await fetch('http://172.20.32.31:3333/admin/finance/income', {
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
                    let headers = { 'Authorization': `Bearer ${token}` };
                    let bodyData;

                    if (pengeluaranForm.file) {
                      const formData = new FormData();
                      formData.append('amount', parseInt(pengeluaranForm.amount));
                      formData.append('sourceType', backendCategory);
                      formData.append('description', pengeluaranForm.description.trim());
                      formData.append('file', pengeluaranForm.file);
                      bodyData = formData;
                    } else {
                      headers['Content-Type'] = 'application/json';
                      bodyData = JSON.stringify({
                        amount: parseInt(pengeluaranForm.amount),
                        sourceType: backendCategory,
                        description: pengeluaranForm.description.trim()
                      });
                    }

                    const res = await fetch('http://172.20.32.31:3333/admin/finance/expense', {
                      method: 'POST',
                      headers,
                      body: bodyData
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
                      category: 'Kebersihan',
                      file: null
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
                const isEmailValid = isEditMode
                  ? (!accountForm.email || isValidEmailFormat(accountForm.email.trim()))
                  : (!!accountForm.email && isValidEmailFormat(accountForm.email.trim()));
                const isPasswordValid = isEditMode
                  ? (!accountForm.password || accountForm.password.length >= 6)
                  : ((accountForm.password || '').length >= 6);
                const isConfirmPasswordValid = isEditMode
                  ? (!accountForm.password || accountForm.confirmPassword === accountForm.password)
                  : (accountForm.confirmPassword === accountForm.password && (accountForm.confirmPassword || '').length >= 6);

                const isFormValid = isUsernameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid;

                return (
                  <div className="space-y-6 font-sans text-xs">
                    {/* SECTION 1: Informasi Warga (Readonly Card) */}
                    <div className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                      <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-2.5">
                        <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                          Informasi Warga
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

                    {/* SECTION 1.5: Data Akun Saat Ini (Only in Edit Mode) */}
                    {isEditMode && (
                      <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                        <div className="flex items-center gap-2 border-b border-emerald-200/50 dark:border-emerald-900/30 pb-2.5">
                          <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <h4 className="font-extrabold text-emerald-800 dark:text-emerald-300 text-xs uppercase tracking-wider">
                            Data Akun Saat Ini
                          </h4>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full font-extrabold text-[9px] ml-auto">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Aktif
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {/* Username Saat Ini */}
                          <div>
                            <span className="text-emerald-600/70 dark:text-emerald-400/70 font-bold block text-[10px] uppercase">Username Saat Ini</span>
                            <span className="font-extrabold text-emerald-900 dark:text-emerald-100 text-sm font-mono">
                              @{accountForm.username || '-'}
                            </span>
                          </div>

                          {/* Tanggal Pembuatan Akun */}
                          <div>
                            <span className="text-emerald-600/70 dark:text-emerald-400/70 font-bold block text-[10px] uppercase">Tanggal Pembuatan Akun</span>
                            <span className="font-bold text-emerald-800 dark:text-emerald-200 text-xs">
                              {existingAccountCreatedAt
                                ? new Date(existingAccountCreatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                : 'Terdaftar pada registrasi'}
                            </span>
                          </div>

                          {/* Tanggal Pergantian Password Terakhir */}
                          <div className="sm:col-span-2 bg-emerald-500/5 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/10 flex items-center justify-between">
                            <div>
                              <span className="text-emerald-600/70 dark:text-emerald-400/70 font-bold block text-[10px] uppercase">Tanggal Pergantian Password Terakhir</span>
                              <span className="font-extrabold text-emerald-900 dark:text-emerald-100 text-xs font-mono">
                                {existingPasswordChangedAt
                                  ? new Date(existingPasswordChangedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                  : (existingAccountCreatedAt 
                                      ? `Belum pernah diubah (sejak ${new Date(existingAccountCreatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })})`
                                      : 'Belum ada riwayat perubahan')}
                              </span>
                            </div>
                          </div>

                          {/* Password Saat Ini */}
                          <div className="sm:col-span-2">
                            <span className="text-emerald-600/70 dark:text-emerald-400/70 font-bold block text-[10px] uppercase mb-1">Password Saat Ini</span>
                            {existingAccountPassword ? (
                              <div className="flex items-center gap-2">
                                <div className="flex-1 px-3 py-2 bg-white/80 dark:bg-slate-900/60 border border-emerald-200/60 dark:border-emerald-800/50 rounded-xl font-mono font-bold text-emerald-900 dark:text-emerald-100 text-sm select-all break-all shadow-xs">
                                  {showExistingPassword ? existingAccountPassword : '•'.repeat(Math.max(existingAccountPassword.length, 8))}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setShowExistingPassword(!showExistingPassword)}
                                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all cursor-pointer text-[10px] flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
                                  title={showExistingPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
                                >
                                  {showExistingPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  <span>{showExistingPassword ? 'Sembunyikan Password' : 'Lihat Password'}</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 italic font-semibold text-[11px]">
                                Password tersimpan di server (masukkan password baru di bawah jika ingin mengubah)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

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
                        <div className="flex justify-between items-center">
                          <label className="font-bold text-slate-700 dark:text-slate-200 text-xs">
                            Email Warga *
                          </label>
                          <span className="text-[10px] font-semibold text-rose-500 dark:text-rose-400">
                            (Wajib Diisi)
                          </span>
                        </div>
                        <input
                          required
                          disabled={isCreatingAccount}
                          type="email"
                          placeholder="nama@domain.com"
                          value={accountForm.email || ''}
                          onChange={(e) => {
                            setAccountForm({ ...accountForm, email: e.target.value });
                            if (emailFieldError) setEmailFieldError('');
                          }}
                          className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border ${
                            emailFieldError 
                              ? 'border-rose-500 focus:ring-rose-500/20' 
                              : 'border-slate-200 dark:border-slate-800 focus:ring-emerald-500/20 focus:border-emerald-500'
                          } rounded-xl outline-none focus:ring-2 text-slate-900 dark:text-white transition-all disabled:opacity-50`}
                        />
                        {emailFieldError && (
                          <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>{emailFieldError}</span>
                          </p>
                        )}
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
                            placeholder={isEditMode ? 'Kosongkan jika tidak ada perubahan' : 'Masukkan kata sandi (min. 8 karakter)'}
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
                <form onSubmit={handleWargaSubmit} className="space-y-4 text-xs font-sans" autoComplete="one-time-code">
                  <div className="grid grid-cols-3 gap-3">
                    <label className="font-bold text-slate-655 dark:text-slate-350">Nama Lengkap *</label>
                    <input
                      required
                      type="text"
                      autoComplete="one-time-code"
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
                        autoComplete="one-time-code"
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
                        autoComplete="one-time-code"
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
                        autoComplete="one-time-code"
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
                      <label className="font-bold text-slate-655 dark:text-slate-350 flex items-center justify-between">
                        <span>Usia (Thn) *</span>
                        <span className="text-[10px] text-slate-400 font-normal">(Otomatis)</span>
                      </label>
                      <input
                        readOnly
                        type="number"
                        placeholder="Otomatis"
                        value={wargaForm.usia !== undefined && wargaForm.usia !== null ? wargaForm.usia : ''}
                        className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl outline-none text-slate-500 dark:text-slate-400 font-bold cursor-not-allowed select-none"
                        title="Usia dihitung otomatis dari Tanggal Lahir"
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
                        autoComplete="one-time-code"
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
                        autoComplete="one-time-code"
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
                    disabled={isSubmittingWarga}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 dark:disabled:bg-emerald-800 text-white font-bold rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed text-xs flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isSubmittingWarga ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sedang Menyimpan Data...</span>
                      </>
                    ) : (
                      <span>{modalType === 'add_warga' ? 'Tambah Warga Baru' : 'Simpan Perubahan Data Warga'}</span>
                    )}
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
                {sudoActionType === 'patch_kk' ? 'Edit Nomor Kartu Keluarga' : 'Verifikasi Sandi Keamanan'}
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
        const noKK = (revealedKks && revealedKks[familyId]) || selectedFamilyForDetail.no_kk || selectedFamilyForDetail.noKK || '3201xxxxxxxxxxxx';
        const familyWarga = Array.isArray(selectedFamilyForDetail.members)
          ? selectedFamilyForDetail.members
          : wargaList.filter(w => (w.family_id === familyId || w.fammilyId === familyId || w.familyId === familyId || w.noKk === noKK || w.no_kk === noKK));

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
                        Sudah Ada Akun {foundUsername ? `(@${foundUsername})` : ''}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30 rounded-full font-extrabold text-[9px]">
                        <XIcon className="w-3 h-3 text-rose-500" />
                        Belum Ada Akun
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
      {/* MODAL PRATINJAU BUKTI TRANSFER & STRUK PEMBAYARAN */}
      {selectedProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in font-sans">
          <div className="relative bg-slate-900/95 border border-slate-800/90 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden z-10 font-sans text-slate-100 flex flex-col max-h-[92vh] backdrop-blur-xl">
            
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 flex items-center justify-center shadow-inner">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-black text-base text-white tracking-tight">
                      Verifikasi Bukti Transfer
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      selectedProofModal.type === 'ipl' 
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}>
                      {selectedProofModal.type === 'ipl' ? 'IPL Bulanan' : 'Uang Kas'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Periksa rincian setoran dan keaslian struk pembayaran warga
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProofModal(null)}
                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl cursor-pointer transition-all border border-transparent hover:border-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Transaction Summary 4-Grid Cards */}
            <div className="p-4 sm:p-5 bg-slate-950/40 border-b border-slate-800/80 grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs shrink-0">
              <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                  <User className="w-3.5 h-3.5 text-sky-400" />
                  <span>Warga / KK</span>
                </div>
                <p className="font-bold text-slate-100 text-xs truncate" title={selectedProofModal.residentName}>
                  {selectedProofModal.residentName}
                </p>
                <span className="text-[10px] font-mono text-slate-500 block">ID: #{selectedProofModal.id}</span>
              </div>

              <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Nominal Setor</span>
                </div>
                <p className="font-mono font-black text-emerald-400 text-sm">
                  {formatRupiah(selectedProofModal.amount)}
                </p>
                <span className="text-[10px] text-emerald-500/80 font-bold block">Menunggu Konfirmasi</span>
              </div>

              <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5 text-purple-400" />
                  <span>Periode / Kategori</span>
                </div>
                <p className="font-bold text-slate-200 text-xs truncate" title={selectedProofModal.periodText}>
                  {selectedProofModal.periodText}
                </p>
                <span className="text-[10px] text-slate-500 font-mono block">
                  {selectedProofModal.date ? formatDateIndo(selectedProofModal.date) : '-'}
                </span>
              </div>

              <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Berkas Struk</span>
                </div>
                <p className="font-mono font-bold text-slate-300 text-xs truncate" title={selectedProofModal.fileName}>
                  {selectedProofModal.fileName}
                </p>
                <span className="text-[10px] text-slate-500 uppercase font-mono block">
                  {selectedProofModal.isPdf ? 'Dokumen PDF' : 'Gambar Struk'}
                </span>
              </div>
            </div>

            {/* Center Interactive Viewer */}
            <div className="relative flex-1 bg-slate-950/90 p-4 sm:p-6 overflow-hidden flex flex-col items-center justify-center min-h-[350px]">
              
              {/* Floating Toolbar (Controls) */}
              {!selectedProofModal.isLoading && !selectedProofModal.hasImgError && (
                <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 p-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-xl">
                  {!selectedProofModal.isPdf && (
                    <>
                      <button
                        type="button"
                        onClick={() => setSelectedProofModal(prev => ({ ...prev, zoomLevel: Math.max(0.5, prev.zoomLevel - 0.25) }))}
                        className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                        title="Perkecil (-)"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] font-mono font-bold px-1.5 text-slate-400 min-w-[36px] text-center">
                        {Math.round(selectedProofModal.zoomLevel * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedProofModal(prev => ({ ...prev, zoomLevel: Math.min(3, prev.zoomLevel + 0.25) }))}
                        className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                        title="Perbesar (+)"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <div className="h-4 w-[1px] bg-slate-700 mx-1" />
                      <button
                        type="button"
                        onClick={() => setSelectedProofModal(prev => ({ ...prev, rotation: (prev.rotation + 90) % 360 }))}
                        className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                        title="Putar 90°"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedProofModal(prev => ({ ...prev, zoomLevel: 1, rotation: 0 }))}
                        className="py-1 px-2 text-[10px] font-bold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Reset Ukuran"
                      >
                        Reset
                      </button>
                      <div className="h-4 w-[1px] bg-slate-700 mx-1" />
                    </>
                  )}
                  <a
                    href={selectedProofModal.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-3 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-sky-600/20"
                    title="Buka Ukuran Asli di Tab Baru"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Tab Baru</span>
                  </a>
                </div>
              )}

              {/* Content Box */}
              <div className="w-full h-full flex items-center justify-center overflow-auto max-h-[50vh] p-2">
                {selectedProofModal.isLoading ? (
                  <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                    <div className="w-9 h-9 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-slate-300 font-bold">Mengunduh & memuat berkas bukti transfer...</p>
                    <span className="text-[10px] text-slate-500">Membuka stream berkas dari secure_uploads</span>
                  </div>
                ) : selectedProofModal.isPdf ? (
                  <iframe
                    src={selectedProofModal.fileUrl}
                    title="Pratinjau PDF Bukti Transfer"
                    className="w-full h-96 rounded-2xl border border-slate-800 bg-white shadow-2xl"
                  />
                ) : selectedProofModal.hasImgError ? (
                  <div className="p-8 text-center space-y-4 max-w-md mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl animate-fade-in">
                    <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-3xl flex items-center justify-center mx-auto border border-amber-500/20">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="font-black text-sm text-slate-100 font-mono truncate px-2" title={selectedProofModal.fileName}>
                        {selectedProofModal.fileName}
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Berkas bukti transfer tidak dapat ditampilkan langsung di viewer ini atau memerlukan izin akses khusus.
                      </p>
                    </div>
                    <div className="pt-2 flex justify-center gap-2">
                      <a
                        href={selectedProofModal.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-sky-600/25 cursor-pointer transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Buka Berkas di Tab Baru</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="transition-all duration-200 ease-out flex items-center justify-center">
                    <img
                      src={selectedProofModal.fileUrl}
                      alt="Bukti Transfer Warga"
                      style={{
                        transform: `scale(${selectedProofModal.zoomLevel}) rotate(${selectedProofModal.rotation}deg)`,
                        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                      onError={() => {
                        setSelectedProofModal(prev => prev ? ({ ...prev, hasImgError: true }) : null);
                      }}
                      className="max-h-[46vh] max-w-full object-contain rounded-2xl shadow-2xl border border-slate-800/80 ring-1 ring-white/5"
                    />
                  </div>
                )}
              </div>

            </div>

            {/* Modal Action Footer */}
            <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
              <button
                onClick={() => setSelectedProofModal(null)}
                className="w-full sm:w-auto py-2.5 px-5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-bold text-xs rounded-xl cursor-pointer transition-all border border-slate-700/60"
              >
                Tutup Pratinjau
              </button>
              <div className="flex gap-2.5 w-full sm:w-auto">
                <button
                  onClick={async () => {
                    const paymentId = selectedProofModal.id;
                    const type = selectedProofModal.type;
                    setSelectedProofModal(null);
                    await handleVerifyPendingPayment(type, paymentId, 'ditolak');
                  }}
                  className="flex-1 sm:flex-initial py-2.5 px-5 bg-rose-600/90 hover:bg-rose-600 text-white font-black text-xs rounded-xl cursor-pointer shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Tolak Bukti Transfer</span>
                </button>
                <button
                  onClick={async () => {
                    const paymentId = selectedProofModal.id;
                    const type = selectedProofModal.type;
                    setSelectedProofModal(null);
                    await handleVerifyPendingPayment(type, paymentId, 'diterima');
                  }}
                  className="flex-1 sm:flex-initial py-2.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl cursor-pointer shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Setujui Pembayaran</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL PREVIEW E-KTP RESMI */}
      {selectedKtpWarga && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-fade-in font-sans">
          <div className="relative bg-slate-900 border border-slate-700 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden z-10 font-sans text-white">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-sky-900 via-blue-900 to-indigo-950 border-b border-sky-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-500/20 text-sky-300 rounded-xl border border-sky-400/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Kartu Identitas Elektronik (e-KTP)</h3>
                  <p className="text-[10px] text-sky-200">Verifikasi Dokumen Resmi RT 05 / RW 06</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedKtpWarga(null)}
                className="p-1.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white cursor-pointer transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs: [1. Foto Berkas KTP Asli] & [2. Kartu Digital e-KTP] */}
            <div className="p-5 space-y-5">
              <div className="flex gap-2 p-1 bg-slate-800/80 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setKtpTab('asli')}
                  className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${ktpTab === 'asli' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  📸 Foto Berkas KTP Asli
                </button>
                <button
                  type="button"
                  onClick={() => setKtpTab('digital')}
                  className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${ktpTab === 'digital' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  💳 Kartu Digital e-KTP
                </button>
              </div>

              {ktpTab === 'asli' ? (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 flex flex-col items-center justify-center p-3 min-h-[220px]">
                    {selectedKtpWarga.foto_ktp || selectedKtpWarga.fotoKtp ? (
                      <img
                        src={selectedKtpWarga.foto_ktp || selectedKtpWarga.fotoKtp}
                        alt={`Foto KTP Asli - ${selectedKtpWarga.nama || selectedKtpWarga.name}`}
                        className="max-h-80 w-auto object-contain rounded-xl shadow-lg border border-slate-800"
                      />
                    ) : (
                      <div className="py-8 text-center space-y-2">
                        <FileText className="w-12 h-12 text-slate-600 mx-auto" />
                        <p className="text-xs text-slate-400 font-semibold">Warga belum mengunggah foto fisik berkas KTP.</p>
                        <span className="text-[10px] text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full inline-block font-bold">Tampilkan Kartu Digital e-KTP di tab sebelah</span>
                      </div>
                    )}
                  </div>
                  {(selectedKtpWarga.foto_ktp || selectedKtpWarga.fotoKtp) && (
                    <div className="flex justify-end gap-2">
                      <a
                        href={selectedKtpWarga.foto_ktp || selectedKtpWarga.fotoKtp}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1.5 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" /> Buka Foto Asli Ukuran Penuh
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                /* AUTHENTIC INDONESIAN e-KTP CARD UI DESIGN */
                <div className="relative rounded-2xl overflow-hidden p-5 bg-gradient-to-br from-sky-300 via-sky-200 to-cyan-300 dark:from-slate-800 dark:via-sky-950 dark:to-slate-900 text-slate-900 dark:text-slate-100 border-2 border-sky-400/50 shadow-2xl space-y-3 font-sans">
                  <div className="absolute right-4 bottom-4 opacity-10 pointer-events-none text-slate-900 dark:text-white">
                    <Landmark className="w-48 h-48" />
                  </div>

                  <div className="text-center font-bold uppercase tracking-wider space-y-0.5 border-b border-slate-400/40 pb-2">
                    <h4 className="text-xs sm:text-sm font-black text-sky-900 dark:text-sky-300">PROVINSI JAWA BARAT</h4>
                    <h5 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">KOTA DEPOK</h5>
                  </div>

                  <div className="flex items-center gap-3 bg-sky-950/80 text-emerald-400 p-2.5 rounded-xl font-mono text-sm font-black tracking-widest justify-center shadow-inner border border-sky-700/50">
                    <span className="text-sky-300 text-xs">NIK :</span>
                    <span>{selectedKtpWarga.nik || selectedKtpWarga.wargaNik || '3276051508980004'}</span>
                  </div>

                  <div className="grid grid-cols-12 gap-3 text-[11px] items-start">
                    <div className="col-span-8 space-y-1 font-semibold leading-relaxed">
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-4 text-slate-500 dark:text-slate-400 font-bold">Nama</span>
                        <span className="col-span-8 font-black uppercase text-slate-900 dark:text-white truncate">{selectedKtpWarga.nama || selectedKtpWarga.name}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-4 text-slate-500 dark:text-slate-400 font-bold">Tempat/Tgl Lahir</span>
                        <span className="col-span-8 font-bold">{selectedKtpWarga.tgl_lahir || selectedKtpWarga.tglLahir || 'DEPOK, 15-08-1998'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-4 text-slate-500 dark:text-slate-400 font-bold">Jenis Kelamin</span>
                        <span className="col-span-8 font-bold">{selectedKtpWarga.jenis_kelamin || selectedKtpWarga.gender || 'Laki-laki'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-4 text-slate-500 dark:text-slate-400 font-bold">Alamat</span>
                        <span className="col-span-8 font-bold leading-tight">{selectedKtpWarga.house_alamat || selectedKtpWarga.alamat || 'Jl. Sawangan Green Park B4/15'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1 pl-3">
                        <span className="col-span-4 text-slate-500 dark:text-slate-400">RT / RW</span>
                        <span className="col-span-8 font-bold">005 / 006</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1 pl-3">
                        <span className="col-span-4 text-slate-500 dark:text-slate-400">Kel / Desa</span>
                        <span className="col-span-8 font-bold">SAWANGAN BARU</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1 pl-3">
                        <span className="col-span-4 text-slate-500 dark:text-slate-400">Kecamatan</span>
                        <span className="col-span-8 font-bold">SAWANGAN</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-4 text-slate-500 dark:text-slate-400 font-bold">Pekerjaan</span>
                        <span className="col-span-8 font-bold capitalize">{selectedKtpWarga.pekerjaan || 'Karyawan Swasta'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-4 text-slate-500 dark:text-slate-400 font-bold">Kewarganegaraan</span>
                        <span className="col-span-8 font-bold">WNI</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-4 text-slate-500 dark:text-slate-400 font-bold">Berlaku Hingga</span>
                        <span className="col-span-8 font-black text-emerald-600 dark:text-emerald-400">SEUMUR HIDUP</span>
                      </div>
                    </div>

                    <div className="col-span-4 flex flex-col items-center gap-2">
                      <div className="w-24 h-32 rounded-xl overflow-hidden border-2 border-red-500/80 shadow-md bg-slate-200 dark:bg-slate-800">
                        <img
                          src={selectedKtpWarga.foto_ktp || selectedKtpWarga.foto || selectedKtpWarga.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'}
                          alt="Pasfoto KTP"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-center">
                        <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                          VERIFIED RT 05
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400 text-[10px]">Pemeriksaan Berkas e-KTP Terdaftar</span>
              <button
                onClick={() => setSelectedKtpWarga(null)}
                className="py-2 px-5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold rounded-xl transition-all cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. EMAIL OTP VERIFICATION POP-UP MODAL (FLOW 1) */}
      <OtpVerificationModal
        isOpen={showOtpModal}
        onClose={() => {
          setShowOtpModal(false);
          setPendingAccountData(null);
        }}
        userId={otpTargetUserId}
        email={otpTargetEmail}
        flowType="admin_registration"
        title={`Verifikasi Akun - ${pendingAccountData?.citizenName || 'Warga'}`}
        subtitle={`Masukkan 6 digit kode OTP yang telah dikirimkan ke email (${otpTargetEmail || 'terdaftar'}) untuk memverifikasi akun:`}
        onSuccess={handleOtpVerificationSuccess}
      />
    </div>
  );
}
