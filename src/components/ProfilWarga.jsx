import { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, User, Users, Volume2, Calendar, Phone, Wallet, History, Upload, 
  FileText, Send, AlertTriangle, FolderOpen, Bell, Settings, 
  CheckCircle2, AlertCircle, Trash2, Eye, EyeOff, Lock, 
  Landmark, LogOut, Sun, Moon, Sparkles, ChevronDown, ChevronRight, X, X as XIcon, Edit2, Save,
  Loader2, Search, Menu, Camera, Shield, ShieldCheck
} from 'lucide-react';
import Swal from 'sweetalert2';
import { io } from '../utils/liveSocket';
import DateInput from './DateInput';

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

const getTemplatesForType = (type) => {
  const templates = {
    'Surat Pengantar Pengurusan KTP': [
      { label: 'KTP Baru (Pindah)', text: 'Syarat pengurusan pembuatan KTP baru di Kelurahan Sawangan Baru dikarenakan baru pindah domisili ke wilayah RT 05.' },
      { label: 'KK Baru (Keluarga)', text: 'Syarat pembaruan Kartu Keluarga (KK) dikarenakan adanya penambahan anggota keluarga baru.' },
      { label: 'KTP Hilang', text: 'Syarat pembuatan duplikat KTP baru di Kelurahan dikarenakan KTP lama hilang.' }
    ],
    'Surat Keterangan Domisili': [
      { label: 'Buka Rekening Bank', text: 'Syarat administratif pembukaan rekening bank baru dikarenakan domisili kerja di wilayah dekat perumahan.' },
      { label: 'Melamar Pekerjaan', text: 'Syarat keterangan tempat tinggal sementara untuk kelengkapan administrasi melamar pekerjaan.' },
      { label: 'Pendaftaran Sekolah', text: 'Keterangan domisili tinggal untuk syarat pendaftaran sekolah anak (PPDB jalur zonasi).' }
    ],
    'Surat Keterangan Catatan Kepolisian (SKCK)': [
      { label: 'Melamar Kerja Swasta', text: 'Sebagai syarat pembuatan SKCK baru guna melamar pekerjaan di sektor swasta.' },
      { label: 'Seleksi CPNS / BUMN', text: 'Sebagai syarat pembuatan/perpanjangan SKCK guna mengikuti seleksi penerimaan CPNS / BUMN.' },
      { label: 'Pemberkasan Paspor', text: 'Sebagai kelengkapan berkas pembuatan SKCK untuk keperluan pengurusan paspor/visa ke luar negeri.' }
    ],
    'Surat Keterangan Tidak Mampu (SKTM)': [
      { label: 'Keringanan RS', text: 'Sebagai syarat pengajuan keringanan biaya rawat inap/pengobatan di Rumah Sakit.' },
      { label: 'Beasiswa Sekolah', text: 'Sebagai kelengkapan berkas pengajuan beasiswa pendidikan kurang mampu untuk anak sekolah.' }
    ],
    'Surat Pengantar Izin Keramaian': [
      { label: 'Syukuran Pernikahan', text: 'Pemberitahuan penyelenggaraan acara syukuran pernikahan keluarga di halaman rumah warga.' },
      { label: 'HUT RI Lingkungan', text: 'Pemberitahuan izin keramaian untuk pelaksanaan rangkaian perlombaan HUT RI warga RT 05.' }
    ]
  };

  return templates[type] || [
    { label: 'Keperluan Umum', text: 'Untuk keperluan pengurusan administrasi kependudukan di tingkat kelurahan.' }
  ];
};

export default function ProfilWarga({ 
  currentUser, 
  setCurrentUser,
  onUpdateProfile, 
  wargaList = [],
  setWargaList,
  submissionsList = [],
  setSubmissionsList,
  agendaList = [],
  transaksiKasList = [],
  setTransaksiKasList,
  darkMode,
  setDarkMode,
  fetchAgendas
}) {
  // Navigation & Collapsible Menu States
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isInformasiOpen, setIsInformasiOpen] = useState(true);
  const [isIuranOpen, setIsIuranOpen] = useState(true);
  const [isSuratOpen, setIsSuratOpen] = useState(true);
  const [viewingApprovedLetter, setViewingApprovedLetter] = useState(null);

  // Auto scroll to top when tab changes inside ProfilWarga
  useEffect(() => {
    const forceScroll = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    forceScroll();
    const t1 = setTimeout(forceScroll, 10);
    const t2 = setTimeout(forceScroll, 100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [activeTab]);
  
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
    pekerjaan: currentUser ? currentUser.pekerjaan || '' : '',
    tglLahir: currentUser ? currentUser.tglLahir || currentUser.tanggalLahir || '' : '',
    house_blok: currentUser ? currentUser.house_blok || '' : '',
    house_nomor: currentUser ? currentUser.house_nomor || '' : '',
    foto: currentUser ? currentUser.foto || currentUser.avatar || '' : ''
  });

  const [revealPassword, setRevealPassword] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [promptPasswordInput, setPromptPasswordInput] = useState('');
  const [promptError, setPromptError] = useState('');
  const [pendingAction, setPendingAction] = useState(''); // 'edit' | 'reveal_pwd'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedKtpWarga, setSelectedKtpWarga] = useState(null);
  const [ktpTab, setKtpTab] = useState('asli');

  // Letter Request Form States
  const [letterForm, setLetterForm] = useState({
    tipeSurat: 'Surat Pengantar Pengurusan KTP',
    keperluan: ''
  });

  // Arrears Payment Form States
  const [buktiBayarList, setBuktiBayarList] = useState([]);
  const [paymentType, setPaymentType] = useState('ipl'); // 'ipl' | 'kas'
  const [iplForm, setIplForm] = useState({ months: [], year: 2026, file: null });
  const [kasForm, setKasForm] = useState({ amount: '', category: 'sosial', description: '', file: null });
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Complaint States
  const [pengaduanList, setPengaduanList] = useState([
    { id: 'COM-101', date: '2026-07-01', category: 'Keamanan', description: 'Lampu penerangan jalan dekat gapura padam, mohon ditinjau.', status: 'Selesai' }
  ]);
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

  // Family members state
  const [familyMembers, setFamilyMembers] = useState([]);
  const [isLoadingFamily, setIsLoadingFamily] = useState(false);
  const [familyError, setFamilyError] = useState('');

  // Warga announcements state
  const [wargaAnnouncements, setWargaAnnouncements] = useState([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false);

  // Warga submissions (pengajuan) state
  const [serverSubmissions, setServerSubmissions] = useState([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [agendaSearch, setAgendaSearch] = useState('');

  const isPermanentResident = currentUser && (currentUser.status === 'Tetap' || currentUser.status_tempat_tinggal === 'Milik Sendiri');

  // File Input References
  const fileInputRef = useRef(null);
  const docFileInputRef = useRef(null);

  // Document Upload State
  const [uploadDocForm, setUploadDocForm] = useState({
    wargaId: '',
    type: 'ktp',
    file: null
  });
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadDocError, setUploadDocError] = useState('');
  const [uploadDocSuccess, setUploadDocSuccess] = useState('');
  const [uploadedDocsList, setUploadedDocsList] = useState([]);

  // Socket.IO for real-time updates
  useEffect(() => {
    let token = null;
    try {
      token = localStorage.getItem('rt_token');
    } catch (e) {
      console.warn('localStorage is blocked or unavailable:', e);
    }
    if (!token) return;

    const socketConnection = io('http://172.20.32.31:3333', {
      auth: { token }
    });

    socketConnection.on('connect', () => {
      console.log('Connected to WebSocket server');
      if (currentUser?.familyId || currentUser?.family_id) {
        socketConnection.emit('join_family_room', currentUser.familyId || currentUser.family_id);
      }
    });

    socketConnection.on('payment_status_updated', (data) => {
      console.log('Payment status updated via Socket.IO:', data);
      fetchWargaPayments();
      fetchIplBills();
      Swal.fire({
        title: 'Pembaruan Pembayaran!',
        text: `Bukti transfer iuran ${data.type === 'ipl' ? 'IPL' : 'Uang Kas'} Anda telah di-update menjadi: ${data.status === 'diterima' || data.status === 'approved' ? 'DISETUJUI' : 'DITOLAK'}.`,
        icon: (data.status === 'diterima' || data.status === 'approved') ? 'success' : 'error',
        confirmButtonColor: '#10b981'
      });
    });

    socketConnection.on('sync', (data) => {
      console.log(`⚡ Menerima request sinkronisasi di ProfilWarga untuk: ${data.type}`);
      if (data.type === 'finance') {
        fetchWargaPayments();
        fetchIplBills();
      } else if (data.type === 'warga') {
        fetchFamilyMembers();
      } else if (data.type === 'pengaduan') {
        fetchCitizenComplaints();
      } else if (data.type === 'pengajuan') {
        fetchCitizenSubmissions();
      } else if (data.type === 'announcement') {
        fetchWargaAnnouncements();
      } else if (data.type === 'agenda') {
        if (fetchAgendas) fetchAgendas();
      } else if (data.type === 'vote') {
        fetchKaryawanList();
        fetchVoteResults();
      }
    });

    return () => {
      socketConnection.disconnect();
    };
  }, [currentUser?.familyId, currentUser?.family_id]);

  // Edit Family Member States
  const [isEditMemberOpen, setIsEditMemberOpen] = useState(false);
  const [isEditingMember, setIsEditingMember] = useState(false);
  const [editMemberError, setEditMemberError] = useState('');
  const [editingMember, setEditingMember] = useState(null);
  const [editMemberForm, setEditMemberForm] = useState({
    nama: '',
    noHp: '',
    umur: ''
  });
  // Advanced Dues Payment Form State
  const [iplBills, setIplBills] = useState([]);
  const [isLoadingIplBills, setIsLoadingIplBills] = useState(false);
  const [iplBillsError, setIplBillsError] = useState('');
  const [selectedBillIds, setSelectedBillIds] = useState([]);

  const [iplPaymentForm, setIplPaymentForm] = useState({
    file: null
  });
  const [kasPaymentForm, setKasPaymentForm] = useState({
    amount: '',
    category: 'sosial',
    activitySelect: 'Santunan Warga Sakit / Wafat',
    customDescription: '',
    file: null
  });
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');

  // Warga payments (finance) state
  const [wargaPayments, setWargaPayments] = useState({ ipl: [], kas: [] });
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [paymentsError, setPaymentsError] = useState('');

  // Document Management States
  const [wargaDocuments, setWargaDocuments] = useState([]);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedResidentForDoc, setSelectedResidentForDoc] = useState(null);
  const [docUploadType, setDocUploadType] = useState('ktp');
  const [docUploadFile, setDocUploadFile] = useState(null);

  // Removed rt_warga_documents sync effect

  // Voting Karyawan Terbaik States
  const [karyawanList, setKaryawanList] = useState([]);
  const [voteResults, setVoteResults] = useState([]);
  const [isLoadingVoting, setIsLoadingVoting] = useState(false);

  // Universal Notification States
  const [notifCategoryFilter, setNotifCategoryFilter] = useState('semua');
  const [isAllNotifRead, setIsAllNotifRead] = useState(false);
  const [isNotifFlyoutOpen, setIsNotifFlyoutOpen] = useState(false);
  const [serverNotifications, setServerNotifications] = useState([]);
  const [serverUnreadCount, setServerUnreadCount] = useState(null);
  const [dashboardNotifCat, setDashboardNotifCat] = useState("semua");

  // Add Member State
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState('');
  const [memberForm, setMemberForm] = useState({
    nik: '',
    nama: '',
    jenisKelamin: 'Laki-laki',
    tglLahir: '',
    statusHidup: 'Hidup',
    noHp: '',
    umur: ''
  });

  // Payment Gateway Simulator State
  const [isPgModalOpen, setIsPgModalOpen] = useState(false);
  const [pgStage, setPgStage] = useState('select_method'); // 'select_method' | 'processing' | 'success'
  const [pgMethod, setPgMethod] = useState(''); // 'qris' | 'va'
  const [pgSelectedBank, setPgSelectedBank] = useState('BCA');
  const [pgVaNumber, setPgVaNumber] = useState('');
  const [pgTimer, setPgTimer] = useState(300);

  const parseArrayResponse = (data) => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.output)) return data.output;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  };

  const fetchFamilyMembers = async () => {
    const famId = currentUser.familyId || currentUser.family_id;
    if (!famId) return;

    setIsLoadingFamily(true);
    setFamilyError('');

    const token = localStorage.getItem('rt_token');
    if (!token) {
      setFamilyError('Token tidak ditemukan. Harap login kembali.');
      setIsLoadingFamily(false);
      return;
    }

    try {
      const response = await fetch(`http://172.20.32.31:3333/resident/getmyfamily/${famId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Akses ditolak, ini bukan data keluarga Anda.');
        }
        throw new Error('Gagal mengambil data keluarga.');
      }

      const data = await response.json();
      const members = parseArrayResponse(data);
      setFamilyMembers(members);

      // Find the logged-in citizen in the family list to populate real database data
      const selfMember = members.find(m => m.warga_id === currentUser.id || m.id === currentUser.id);
      if (selfMember) {
        const updatedUser = {
          ...currentUser,
          name: selfMember.nama || currentUser.name,
          nik: selfMember.nik || currentUser.nik,
          gender: selfMember.jenis_kelamin || currentUser.gender,
          alamat: selfMember.house_alamat || currentUser.alamat,
          usia: selfMember.umur || currentUser.usia,
          noHp: selfMember.no_hp || currentUser.noHp,
          email: selfMember.email || currentUser.email,
          noKk: selfMember.no_kk || currentUser.noKk || '',
          status: selfMember.house_status || currentUser.status,
          tglLahir: selfMember.tgl_lahir || currentUser.tglLahir || '',
          pekerjaan: selfMember.pekerjaan || currentUser.pekerjaan || ''
        };
        setCurrentUser(updatedUser);
        localStorage.setItem('rt_current_user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error(err);
      setFamilyError(err.message);
    } finally {
      setIsLoadingFamily(false);
    }
  };

  const fetchCitizenComplaints = async () => {
    const token = localStorage.getItem('rt_token');
    if (!token) return;

    try {
      const response = await fetch('http://172.20.32.31:3333/resident/pengaduan', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const mappedData = parseArrayResponse(data).map(item => ({
          ...item,
          jenis: item.jenis_pengaduan || item.jenis,
          keperluan: item.isi || item.keperluan
        }));
        setPengaduanList(mappedData);
      }
    } catch (err) {
      console.error('Error fetching complaints:', err);
    }
  };

  const fetchWargaAnnouncements = async () => {
    const token = localStorage.getItem('rt_token');
    if (!token) return;
    setIsLoadingAnnouncements(true);
    try {
      const res = await fetch('http://172.20.32.31:3333/resident/announcement', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const list = parseArrayResponse(data);
        list.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
        setWargaAnnouncements(list);
      }
    } catch (err) {
      console.error('Error fetching announcements:', err);
    } finally {
      setIsLoadingAnnouncements(false);
    }
  };

  const fetchCitizenSubmissions = async () => {
    const token = localStorage.getItem('rt_token');
    if (!token) return;
    setIsLoadingSubmissions(true);
    try {
      const response = await fetch('http://172.20.32.31:3333/resident/pengajuan', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setServerSubmissions(parseArrayResponse(data));
      }
    } catch (err) {
      console.error('Error fetching citizen submissions:', err);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  const fetchWargaPayments = async () => {
    const token = localStorage.getItem('rt_token');
    if (!token) return;
    setIsLoadingPayments(true);
    setPaymentsError('');
    try {
      const response = await fetch('http://172.20.32.31:3333/resident/my-payments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const paymentsData = data.output?.pesan || data.output || data.pesan || { ipl: [], kas: [] };
        setWargaPayments(paymentsData);
      } else {
        throw new Error('Gagal mengambil histori pembayaran.');
      }
    } catch (err) {
      console.error(err);
      setPaymentsError(err.message);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  
  const fetchServerNotifications = async (page = 1, limit = 20) => {
    const token = localStorage.getItem('rt_token');
    if (!token) return;
    try {
      let res = await fetch(`http://172.20.32.31:3333/account/notifications?page=${page}&limit=${limit}&is_read=all`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) {
        res = await fetch(`http://172.20.32.31:3333/resident/notifications?page=${page}&limit=${limit}&is_read=all`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      if (res.ok) {
        const data = await res.json();
        const rawList = data.output?.notifications || (Array.isArray(data.output) ? data.output : extractArrayFromResponse(data));
        setServerNotifications(Array.isArray(rawList) ? rawList : []);
        if (typeof data.output?.unread_count === 'number') {
          setServerUnreadCount(data.output.unread_count);
        }
      }
    } catch (err) {
      console.info('[WARGA NOTIFS] Backend feed using live events:', err.message);
    }

    try {
      let countRes = await fetch('http://172.20.32.31:3333/account/notifications/unread-count', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!countRes.ok) {
        countRes = await fetch('http://172.20.32.31:3333/resident/notifications/unread-count', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      if (countRes.ok) {
        const cData = await countRes.json();
        const count = cData.output?.unread_count ?? cData.unread_count ?? cData.data?.unread_count;
        if (typeof count === 'number') {
          setServerUnreadCount(count);
        }
      }
    } catch (err) {
      // ignore
    }
  };

  const handleMarkNotifAsRead = async (id) => {
    if (!id) return;
    const token = localStorage.getItem('rt_token');
    if (!token) return;
    try {
      let res = await fetch(`http://172.20.32.31:3333/account/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) {
        await fetch(`http://172.20.32.31:3333/resident/notifications/${id}/read`, {
          method: 'PATCH',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (err) {
      console.warn('Mark notif read failed:', err);
    }
    fetchServerNotifications();
  };

  const handleMarkAllNotifsAsRead = async () => {
    setIsAllNotifRead(true);
    setServerUnreadCount(0);
    const token = localStorage.getItem('rt_token');
    if (!token) return;
    try {
      let res = await fetch('http://172.20.32.31:3333/account/notifications/read-all', {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) {
        await fetch('http://172.20.32.31:3333/resident/notifications/read-all', {
          method: 'PATCH',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (err) {
      console.warn('Mark all read failed:', err);
    }
    fetchServerNotifications();
  };

  const fetchIplBills = async () => {
    const token = localStorage.getItem('rt_token');
    if (!token) return;
    setIsLoadingIplBills(true);
    setIplBillsError('');
    console.log('%c[WARGA IPL] 🔄 GET http://172.20.32.31:3333/resident/ipl/bills', 'color: #06b6d4; font-weight: bold;');
    try {
      const response = await fetch('http://172.20.32.31:3333/resident/ipl/bills', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('%c[WARGA IPL] 📦 Response:', 'color: #06b6d4;', data);
      if (response.ok) {
        const list = extractArrayFromResponse(data);
        console.log(`%c[WARGA IPL] ✅ Loaded ${list.length} bills:`, 'color: #10b981; font-weight: bold;', list);
        setIplBills(list);
      } else {
        console.warn('%c[WARGA IPL] ⚠️ Fetch bills failed:', 'color: #f59e0b;', data);
        if (data.pesan) {
          setIplBillsError(data.pesan);
        }
      }
    } catch (err) {
      console.error('Error fetching IPL bills:', err);
      setIplBillsError(err.message);
    } finally {
      setIsLoadingIplBills(false);
    }
  };

  useEffect(() => {
    fetchFamilyMembers();
    fetchCitizenComplaints();
    fetchWargaAnnouncements();
    fetchCitizenSubmissions();
    fetchWargaPayments();
    fetchIplBills();
    if (activeTab === 'voting_karyawan') {
      fetchKaryawanList();
      fetchVoteResults();
    }
    if (activeTab === 'informasi_jadwal' && fetchAgendas) {
      fetchAgendas();
    }
  }, [activeTab]);

  // Save changes helper
  // Removed sync effects for buktiBayarList and pengaduanList

  // Logout handler
  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Keluar Portal',
      text: 'Apakah Anda yakin ingin keluar dari portal warga?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Ya, keluar',
      cancelButtonText: 'Batal'
    });
    if (result.isConfirmed) {
      setCurrentUser(null);
      localStorage.removeItem('rt_current_user');
      localStorage.removeItem('rt_token');
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };
  const formatRupiah = formatCurrency;

  useEffect(() => {
    if (currentUser) {
      const timer = setTimeout(() => {
        setFormData(prev => ({
          ...prev,
          name: currentUser.name || prev.name,
          username: currentUser.username || prev.username,
          nik: currentUser.nik || prev.nik,
          noKk: currentUser.noKk || prev.noKk,
          alamat: currentUser.alamat || prev.alamat,
          gender: currentUser.gender || prev.gender,
          usia: currentUser.usia || prev.usia,
          email: currentUser.email || prev.email,
          noHp: currentUser.noHp || prev.noHp,
          status: currentUser.status || prev.status,
          pekerjaan: currentUser.pekerjaan || prev.pekerjaan,
          tglLahir: currentUser.tglLahir || currentUser.tanggalLahir || prev.tglLahir,
          house_blok: currentUser.house_blok || prev.house_blok,
          house_nomor: currentUser.house_nomor || prev.house_nomor,
          foto: currentUser.foto || currentUser.avatar || prev.foto
        }));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [currentUser]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setError('Ukuran foto profil maksimal 3MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, foto: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCancel = () => {
    const familyHead = familyMembers[0] || null;
    setFormData({
      name: currentUser.name && currentUser.name !== currentUser.username ? currentUser.name : (familyHead ? familyHead.nama : (currentUser.name || '')),
      username: currentUser.username || '',
      password: currentUser.password || '',
      nik: currentUser.nik || (familyHead ? familyHead.nik : ''),
      noKk: currentUser.noKk || '',
      alamat: currentUser.alamat || (familyHead ? familyHead.house_alamat : ''),
      gender: currentUser.gender || (familyHead ? familyHead.jenis_kelamin : 'Laki-laki'),
      usia: currentUser.usia || (familyHead ? familyHead.umur : ''),
      status: currentUser.status || (familyHead && familyHead.house_status === 'kontrak' ? 'Kontrak' : 'Tetap'),
      email: currentUser.email || '',
      noHp: currentUser.noHp || (familyHead ? familyHead.no_hp : ''),
      pekerjaan: currentUser.pekerjaan || '',
      tglLahir: currentUser.tglLahir || currentUser.tanggalLahir || '',
      house_blok: currentUser.house_blok || '',
      house_nomor: currentUser.house_nomor || '',
      foto: currentUser.foto || currentUser.avatar || ''
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

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name || !formData.name.trim()) {
      setError('Nama Lengkap wajib diisi.');
      return;
    }

    if (!formData.email || !formData.noHp) {
      setError('Email dan nomor HP wajib diisi.');
      return;
    }

    const updated = {
      ...currentUser,
      name: formData.name.trim(),
      email: formData.email.trim(),
      noHp: formData.noHp.trim(),
      alamat: (formData.alamat || '').trim(),
      gender: formData.gender,
      tglLahir: formData.tglLahir,
      tanggalLahir: formData.tglLahir,
      pekerjaan: (formData.pekerjaan || '').trim(),
      status: formData.status,
      house_blok: (formData.house_blok || '').trim(),
      house_nomor: (formData.house_nomor || '').trim(),
      foto: formData.foto || currentUser.foto
    };

    const token = localStorage.getItem('rt_token');
    if (token && (currentUser.id || currentUser.warga_id)) {
      const citizenId = currentUser.id || currentUser.warga_id;
      try {
        await fetch(`http://172.20.32.31:3333/resident/warga/${citizenId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            nama: formData.name.trim(),
            noHp: formData.noHp.trim(),
            email: formData.email.trim(),
            alamat: formData.alamat.trim(),
            jenisKelamin: formData.gender,
            pekerjaan: (formData.pekerjaan || '').trim()
          })
        });
      } catch (err) {
        console.warn('Backend update failed, updating local state:', err);
      }
    }

    try {
      currentUser.email = formData.email.trim();
    } catch(e) {}

    onUpdateProfile(updated);
    setSuccess('Data profil Anda berhasil diperbarui!');
    setIsEditing(false);
  };

  const handleLetterSubmit = async (e) => {
    e.preventDefault();
    if (!letterForm.keperluan.trim()) {
      alert('Silakan tulis keperluan pengajuan surat.');
      return;
    }

    const token = localStorage.getItem('rt_token');
    if (!token) {
      alert('Token otentikasi tidak ditemukan. Harap login kembali.');
      return;
    }

    try {
      const response = await fetch('http://172.20.32.31:3333/resident/pengajuan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          keperluan: letterForm.keperluan,
          jenis: letterForm.tipeSurat
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message || 'Pengajuan surat pengantar berhasil dikirim!');
        setLetterForm({
          tipeSurat: 'Surat Pengantar Pengurusan KTP',
          keperluan: ''
        });
        fetchCitizenSubmissions();
        setActiveTab('layanan_status');
      } else {
        alert(data.message || data.pesan || 'Gagal mengirim pengajuan.');
      }
    } catch (err) {
      alert(`Gagal menghubungi server: ${err.message}`);
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!docUploadFile) {
      alert('Silakan pilih file dokumen terlebih dahulu.');
      return;
    }
    const token = localStorage.getItem('rt_token');
    if (!token) { alert('Token tidak ditemukan.'); return; }
    
    setIsUploadingDoc(true);
    const idWarga = selectedResidentForDoc.warga_id || selectedResidentForDoc.id;

    try {
      const formData = new FormData();
      formData.append('file', docUploadFile);
      formData.append('type', docUploadType);

      const response = await fetch(`http://172.20.32.31:3333/resident/uploadsensitifdata/${idWarga}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message || 'Dokumen sensitif berhasil diunggah!');
        
        // Add to local documents list
        const newDoc = {
          document_id: data.output?.pesan?.document_id || Math.floor(Math.random() * 1000 + 100),
          resident_id: idWarga,
          resident_name: selectedResidentForDoc.nama,
          type: docUploadType,
          file_path: data.output?.pesan?.file_path || docUploadFile.name,
          upload_date: formatDateIndo(new Date())
        };
        setWargaDocuments(prev => [newDoc, ...prev]);
        setDocUploadFile(null);
      } else {
        alert(data.pesan || data.message || 'Gagal mengunggah dokumen.');
      }
    } catch (err) {
      alert(`Koneksi gagal: ${err.message}`);
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleDownloadDocument = async (documentId, fileName) => {
    const token = localStorage.getItem('rt_token');
    if (!token) { alert('Token tidak ditemukan.'); return; }
    try {
      const response = await fetch(`http://172.20.32.31:3333/resident/sensitifdata/file/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.pesan || data.message || 'Gagal mengunduh berkas.');
      }

      const blob = await response.blob();
      const localUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = localUrl;
      link.download = fileName || `dokumen_${documentId}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(localUrl);
    } catch (err) {
      alert(`Gagal mengunduh dokumen: ${err.message}`);
    }
  };

  const fetchKaryawanList = async () => {
    setIsLoadingVoting(true);
    const token = localStorage.getItem('rt_token');
    if (!token) return;
    try {
      const response = await fetch('http://172.20.32.31:3333/resident/karyawan', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setKaryawanList(parseArrayResponse(data));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingVoting(false);
    }
  };

  const fetchVoteResults = async () => {
    const token = localStorage.getItem('rt_token');
    if (!token) return;
    try {
      const response = await fetch('http://172.20.32.31:3333/resident/vote/results', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setVoteResults(parseArrayResponse(data));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCastVote = async (karyawanId) => {
    const token = localStorage.getItem('rt_token');
    if (!token) { alert('Token tidak ditemukan.'); return; }
    try {
      const response = await fetch('http://172.20.32.31:3333/resident/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ karyawanId })
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message || 'Suara Anda berhasil dikirim!');
        fetchVoteResults();
      } else {
        alert(data.message || data.pesan || 'Gagal memberikan suara. Kemungkinan Anda sudah memilih.');
      }
    } catch (err) {
      alert(`Koneksi gagal: ${err.message}`);
    }
  };

  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    if (!pengaduanForm.description.trim()) {
      alert('Silakan isi deskripsi pengaduan.');
      return;
    }

    const token = localStorage.getItem('rt_token');
    if (!token) {
      alert('Token otentikasi tidak ditemukan. Harap login kembali.');
      return;
    }

    try {
      const response = await fetch('http://172.20.32.31:3333/resident/pengaduan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          isi: pengaduanForm.description,
          jenis_pengaduan: pengaduanForm.category
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message || 'Laporan pengaduan lingkungan berhasil dikirim!');
        setPengaduanForm({ category: 'Fasilitas Umum', description: '' });
        fetchCitizenComplaints();
      } else {
        alert(data.message || data.pesan || 'Gagal mengirim pengaduan.');
      }
    } catch (err) {
      alert(`Gagal menghubungi server: ${err.message}`);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 8) {
      alert('Kata sandi baru minimal harus 8 karakter.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Konfirmasi sandi tidak sesuai.');
      return;
    }

    if (!passwordForm.oldPassword) {
      alert('Kata sandi lama wajib diisi untuk mengubah kata sandi.');
      return;
    }

    const token = localStorage.getItem('rt_token');
    if (!token) {
      alert('Token otentikasi tidak ditemukan. Harap login kembali.');
      return;
    }

    try {
      let response = await fetch('http://172.20.32.31:3333/resident/my-account', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        })
      });

      let data = await response.json();

      if (!response.ok) {
        // Fallback to /resident/password if /resident/my-account returned error
        const fallbackRes = await fetch('http://172.20.32.31:3333/resident/password', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            oldPassword: passwordForm.oldPassword,
            newPassword: passwordForm.newPassword,
            confirmNewPassword: passwordForm.confirmPassword
          })
        });
        if (fallbackRes.ok) {
          response = fallbackRes;
          data = await fallbackRes.json();
        }
      }
      if (response.ok) {
        const updated = {
          ...currentUser,
          password: passwordForm.newPassword
        };
        onUpdateProfile(updated);
        alert(data.pesan || 'Kata sandi berhasil diperbarui!');
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setActiveTab('dashboard');
      } else {
        alert(data.message || data.pesan || 'Gagal mengubah kata sandi.');
      }
    } catch (err) {
      alert(`Gagal menghubungi server: ${err.message}`);
    }
  };

  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    setAddMemberError('');
    setIsAddingMember(true);

    const token = localStorage.getItem('rt_token');
    if (!token) {
      setAddMemberError('Token tidak ditemukan. Harap login kembali.');
      setIsAddingMember(false);
      return;
    }

    const family_id = familyMembers[0]?.family_id || currentUser.familyId || currentUser.family_id;
    const house_id = familyMembers[0]?.house_id || currentUser.houseId || currentUser.house_id;

    if (!family_id || !house_id) {
      setAddMemberError('Data keluarga atau rumah tidak ditemukan.');
      setIsAddingMember(false);
      return;
    }

    const umurNum = parseInt(memberForm.umur) || 0;
    if (umurNum >= 17 && !memberForm.nik.trim()) {
      setAddMemberError('Nomor KTP (NIK) wajib diisi untuk anggota keluarga berumur 17 tahun ke atas.');
      setIsAddingMember(false);
      return;
    }

    if (memberForm.nik.trim() && !/^\d{16}$/.test(memberForm.nik)) {
      setAddMemberError('Nomor NIK/KTP harus tepat 16 digit angka.');
      setIsAddingMember(false);
      return;
    }

    try {
      const response = await fetch('http://172.20.32.31:3333/resident/datawarga', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nik: memberForm.nik.trim() || null,
          nama: memberForm.nama,
          jenisKelamin: memberForm.jenisKelamin,
          tglLahir: memberForm.tglLahir,
          statusHidup: memberForm.statusHidup,
          noHp: memberForm.noHp,
          umur: umurNum
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message || 'Anggota keluarga baru berhasil ditambahkan!');
        setIsAddMemberOpen(false);
        setMemberForm({
          nik: '',
          nama: '',
          jenisKelamin: 'Laki-laki',
          tglLahir: '',
          statusHidup: 'Hidup',
          noHp: '',
          umur: ''
        });
        fetchFamilyMembers();
      } else {
        setAddMemberError(data.message || data.pesan || 'Gagal menambahkan anggota keluarga.');
      }
    } catch (err) {
      setAddMemberError(`Koneksi gagal: ${err.message}`);
    } finally {
      setIsAddingMember(false);
    }
  };

  const openEditMemberModal = (member) => {
    setEditingMember(member);
    setEditMemberForm({
      nama: member.nama || '',
      noHp: member.no_hp || member.noHp || '',
      umur: member.umur || ''
    });
    setEditMemberError('');
    setIsEditMemberOpen(true);
  };

  const handleEditMemberSubmit = async (e) => {
    e.preventDefault();
    setIsEditingMember(true);
    setEditMemberError('');

    const token = localStorage.getItem('rt_token');
    if (!token) {
      setEditMemberError('Token tidak ditemukan.');
      setIsEditingMember(false);
      return;
    }

    try {
      const response = await fetch(`http://172.20.32.31:3333/resident/warga/${editingMember.warga_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nama: editMemberForm.nama,
          noHp: editMemberForm.noHp,
          umur: parseInt(editMemberForm.umur) || 0
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert('Data anggota keluarga berhasil diperbarui!');
        setIsEditMemberOpen(false);
        fetchFamilyMembers();
      } else {
        setEditMemberError(data.pesan || data.message || 'Gagal memperbarui data.');
      }
    } catch (err) {
      setEditMemberError(`Koneksi gagal: ${err.message}`);
    } finally {
      setIsEditingMember(false);
    }
  };

  const handleSensitifDataSubmit = async (e) => {
    e.preventDefault();
    setUploadDocError('');
    setUploadDocSuccess('');
    setIsUploadingDoc(true);

    const token = localStorage.getItem('rt_token');
    if (!token) {
      setUploadDocError('Token tidak ditemukan. Harap login kembali.');
      setIsUploadingDoc(false);
      return;
    }

    if (!uploadDocForm.wargaId) {
      setUploadDocError('Silakan pilih anggota keluarga.');
      setIsUploadingDoc(false);
      return;
    }

    if (!uploadDocForm.file) {
      setUploadDocError('Silakan pilih file untuk diunggah.');
      setIsUploadingDoc(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadDocForm.file);
    formData.append('type', uploadDocForm.type);

    try {
      const response = await fetch(`http://172.20.32.31:3333/resident/uploadsensitifdata/${uploadDocForm.wargaId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        const documentId = data.output?.pesan?.document_id || Math.floor(Math.random() * 9000 + 1000);
        const fileName = uploadDocForm.file.name;
        
        const newDoc = {
          id: 'DOC-' + Math.floor(Math.random() * 90000 + 10000),
          wargaId: uploadDocForm.wargaId,
          type: uploadDocForm.type,
          fileName: fileName,
          documentId: documentId,
          date: formatDateIndo(new Date())
        };
        
        const updatedDocs = [newDoc, ...uploadedDocsList];
        setUploadedDocsList(updatedDocs);
        
        setUploadDocSuccess('Dokumen berhasil diunggah secara mandiri!');
        setUploadDocForm(prev => ({ ...prev, file: null }));
        if (docFileInputRef.current) docFileInputRef.current.value = '';
      } else {
        setUploadDocError(data.pesan || data.message || 'Gagal mengunggah dokumen.');
      }
    } catch (err) {
      setUploadDocError(`Koneksi gagal: ${err.message}`);
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleDownloadSensitifDoc = async (documentId) => {
    const token = localStorage.getItem('rt_token');
    if (!token) {
      alert('Token otentikasi tidak ditemukan.');
      return;
    }
    try {
      const response = await fetch(`http://172.20.32.31:3333/resident/sensitifdata/file/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const blob = await response.blob();
        const localUrl = URL.createObjectURL(blob);
        window.open(localUrl, '_blank');
      } else {
        const errData = await response.json();
        alert(errData.pesan || 'Gagal mengunduh berkas sensitif.');
      }
    } catch (err) {
      alert(`Koneksi gagal: ${err.message}`);
    }
  };

  const handleDeleteSensitifDoc = async (documentId) => {
    const token = localStorage.getItem('rt_token');
    if (!token) {
      alert('Token otentikasi tidak ditemukan.');
      return;
    }
    if (!window.confirm('Apakah Anda yakin ingin menghapus berkas dokumen sensitif ini?')) return;

    try {
      const response = await fetch(`http://172.20.32.31:3333/resident/sensitifdata/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message || 'Dokumen kependudukan terunggah berhasil dihapus!');
        fetchFamilyMembers();
      } else {
        alert(data.message || data.pesan || 'Gagal menghapus dokumen sensitif.');
      }
    } catch (err) {
      alert(`Koneksi gagal: ${err.message}`);
    }
  };

  const handleAdvancedPaymentSubmit = async (e) => {
    e.preventDefault();
    setPaymentError('');
    setPaymentSuccess('');
    setIsSubmittingPayment(true);

    const token = localStorage.getItem('rt_token');
    if (!token) {
      setPaymentError('Token tidak ditemukan. Harap login kembali.');
      setIsSubmittingPayment(false);
      return;
    }

    const formData = new FormData();

    if (paymentType === 'ipl') {
      if (!selectedBillIds || selectedBillIds.length === 0) {
        setPaymentError('Silakan pilih minimal satu tagihan IPL yang ingin dibayar.');
        setIsSubmittingPayment(false);
        return;
      }
      if (!iplPaymentForm.file) {
        setPaymentError('Silakan unggah berkas bukti transfer pembayaran IPL.');
        setIsSubmittingPayment(false);
        return;
      }
      
      const selectedBills = iplBills.filter(b => selectedBillIds.includes(b.id));
      const totalAmount = selectedBills.reduce((sum, b) => sum + Number(b.amount || 0), 0);

      formData.append('file', iplPaymentForm.file);
      formData.append('amount', totalAmount);
      formData.append('channel', 'transfer');
      formData.append('billIds', JSON.stringify(selectedBillIds));

      console.log('--- WARGA: Sending /resident/ipl/pay ---');
      console.log('Target URL/Endpoint: POST http://172.20.32.31:3333/resident/ipl/pay');
      console.log('Payload billIds:', JSON.stringify(selectedBillIds));
      console.log('Payload amount:', totalAmount);
      console.log('Payload channel: transfer');
      console.log('Payload file name:', iplPaymentForm.file ? iplPaymentForm.file.name : 'None');

      try {
        const response = await fetch('http://172.20.32.31:3333/resident/ipl/pay', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const data = await response.json();
        if (response.ok) {
          setPaymentSuccess(data.message || data.output?.message || 'Bukti pembayaran IPL berhasil dikirim, menunggu verifikasi Bendahara.');
          setSelectedBillIds([]);
          setIplPaymentForm({ file: null });
          if (fileInputRef.current) fileInputRef.current.value = '';
          
          fetchIplBills();
          fetchWargaPayments();
        } else {
          setPaymentError(data.pesan || data.message || 'Gagal mengirim pembayaran IPL.');
        }
      } catch (err) {
        setPaymentError(`Koneksi gagal: ${err.message}`);
      } finally {
        setIsSubmittingPayment(false);
      }
    } else {
      if (!kasPaymentForm.amount || parseInt(kasPaymentForm.amount) <= 0) {
        setPaymentError('Silakan masukkan nominal iuran yang valid.');
        setIsSubmittingPayment(false);
        return;
      }
      if (!kasPaymentForm.file) {
        setPaymentError('Silakan unggah bukti transfer pembayaran Uang Kas.');
        setIsSubmittingPayment(false);
        return;
      }

      const description = kasPaymentForm.activitySelect === 'Lainnya (Input Manual)' 
        ? kasPaymentForm.customDescription 
        : kasPaymentForm.activitySelect;

      if (!description.trim()) {
        setPaymentError('Silakan isi keterangan atau pilih jenis kegiatan.');
        setIsSubmittingPayment(false);
        return;
      }

      formData.append('file', kasPaymentForm.file);
      formData.append('amount', parseInt(kasPaymentForm.amount));
      formData.append('category', kasPaymentForm.category);
      formData.append('description', description);

      console.log('--- WARGA: Sending /resident/kas/contribute ---');
      console.log('Target URL/Endpoint: POST http://172.20.32.31:3333/resident/kas/contribute');
      console.log('Payload amount:', parseInt(kasPaymentForm.amount));
      console.log('Payload category:', kasPaymentForm.category);
      console.log('Payload description:', description);
      console.log('Payload file name:', kasPaymentForm.file ? kasPaymentForm.file.name : 'None');

      try {
        const response = await fetch('http://172.20.32.31:3333/resident/kas/contribute', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const data = await response.json();
        if (response.ok) {
          setPaymentSuccess(data.message || data.output?.message || 'Bukti pembayaran Uang Kas berhasil diunggah, menunggu verifikasi Bendahara.');
          setKasPaymentForm({
            amount: '',
            category: 'sosial',
            activitySelect: 'Santunan Warga Sakit / Wafat',
            customDescription: '',
            file: null
          });
          if (fileInputRef.current) fileInputRef.current.value = '';

          fetchWargaPayments();
        } else {
          setPaymentError(data.pesan || data.message || 'Gagal mengirim pembayaran Uang Kas.');
        }
      } catch (err) {
        setPaymentError(`Koneksi gagal: ${err.message}`);
      } finally {
        setIsSubmittingPayment(false);
      }
    }
  };

  const handleInitiatePg = () => {
    setPgStage('select_method');
    setPgMethod('');
    setPgTimer(300);
    setIsPgModalOpen(true);
  };

  const handleSelectPgMethod = (method) => {
    setPgMethod(method);
    if (method === 'va') {
      const randVa = '88301' + Math.floor(Math.random() * 90000000000 + 10000000000);
      setPgVaNumber(randVa);
    }
    setPgStage('processing');
  };

  const handleSimulatePaymentSuccess = () => {
    const updatedUser = {
      ...currentUser,
      statusIuran: 'Lunas'
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('rt_current_user', JSON.stringify(updatedUser));

    if (wargaList && setWargaList) {
      const updatedW = wargaList.map(w => {
        const isMatch = w.id === currentUser.id ||
          (w.username && currentUser.username && w.username.toLowerCase() === currentUser.username.toLowerCase()) ||
          (w.nik && currentUser.nik && w.nik === currentUser.nik);
        return isMatch ? { ...w, statusIuran: 'Lunas' } : w;
      });
      setWargaList(updatedW);
    }

    const monthName = new Date().toLocaleDateString('id-ID', { month: 'long' });
    const newTx = {
      id: 'TX-' + Math.floor(Math.random() * 90000 + 10000),
      description: `Pembayaran Iuran Kas RT (${monthName}) - ${currentUser.name || currentUser.username} [PG: ${pgMethod.toUpperCase()}]`,
      amount: 50000,
      date: new Date().toISOString().split('T')[0],
      type: 'income',
      category: 'Iuran Warga'
    };

    if (transaksiKasList && setTransaksiKasList) {
      const updatedKas = [newTx, ...transaksiKasList];
      setTransaksiKasList(updatedKas);
    }

    const newHistory = {
      id: 'UP-' + Math.floor(Math.random() * 9000 + 1000),
      date: new Date().toISOString().split('T')[0],
      nominal: 50000,
      bulan: monthName,
      catatan: `Pembayaran instan via PG ${pgMethod.toUpperCase()}`,
      status: 'Disetujui'
    };
    setBuktiBayarList([newHistory, ...buktiBayarList]);

    setPgStage('success');
  };

  // Derived properties
  const mySubmissions = [
    ...serverSubmissions.map(sub => ({
      id: sub.id,
      wargaNama: currentUser.name || `Keluarga #${sub.family_id}`,
      wargaTipeSurat: sub.jenis,
      wargaKeperluan: sub.keperluan,
      status: sub.status === 'disetujui' ? 'Approved' : (sub.status === 'ditolak' ? 'Rejected' : 'Pending'),
      submissionDate: 'Server API',
      isFromServer: true
    })),
    ...submissionsList.filter(s => s.wargaId === currentUser.id && typeof s.id === 'string' && s.id.startsWith('LTR-'))
  ];

  const familyHead = familyMembers[0] || null;

  // Resolved dynamic values for mock alignment
  const rtRw = currentUser.rtRw || '04 / 09';
  const displayNama = currentUser.name && currentUser.name !== currentUser.username ? currentUser.name : (familyHead ? familyHead.nama : (currentUser.name || 'Warga'));
  const displayNik = currentUser.nik || (familyHead ? familyHead.nik : '');
  const displayGender = currentUser.gender || (familyHead ? familyHead.jenis_kelamin : 'Laki-laki');
  const displayAlamat = currentUser.alamat || (familyHead ? familyHead.house_alamat : '');
  const displayNoHp = currentUser.noHp || (familyHead ? familyHead.no_hp : '');
  const displayEmail = currentUser.email || formData.email || '';
  const tanggalLahir = currentUser.tglLahir || currentUser.tanggalLahir || (familyHead ? familyHead.tgl_lahir : (currentUser.name === 'Budi Santoso' ? '11 November 1990' : '20 Januari 2004'));
  const pekerjaan = currentUser.pekerjaan || (familyHead ? familyHead.pekerjaan : (currentUser.name === 'Budi Santoso' ? 'Wiraswasta' : 'Mahasiswa'));
  const statusRumah = formData.status || currentUser.status || (familyHead ? familyHead.status_rumah : 'Tetap');
  // Safe 4-Category Real-time notifications (IPL, Kegiatan Warga, Jadwal, Kematian)
  const safeWargaList = Array.isArray(wargaList) ? wargaList : [];
  const safeDeceasedWarga = safeWargaList.filter(w => w.statusHidup === 'Meninggal');
  const safeIplBills = Array.isArray(iplBills) ? iplBills : [];
  const safeAnnouncements = Array.isArray(wargaAnnouncements) ? wargaAnnouncements : [];
  const safeAgendas = Array.isArray(agendaList) ? agendaList : [];
  const safeSubmissions = Array.isArray(mySubmissions) ? mySubmissions : [];
  const safeComplaints = Array.isArray(pengaduanList) ? pengaduanList : [];

  const liveNotifFeed = [
    // 1. 💳 IPL & KAS NOTIFICATIONS
    ...safeIplBills.map(b => {
      const s = String(b.latest_payment_status || b.status || '').toLowerCase();
      const isRej = b.latest_payment_status === 'rejected' || s === 'rejected' || s === 'ditolak' || s === 'gagal' || Boolean(b.latest_reject_reason || b.reject_reason || b.rejection_reason);
      const isPaid = s === 'paid' || s === 'lunas' || s === 'approved';
      const isWaiting = s === 'waiting_verification' || s === 'menunggu_verifikasi' || s === 'pending';
      const reason = b.latest_reject_reason || b.reject_reason || b.rejection_reason || b.rejectReason || b.alasan_penolakan || b.reason || 'Foto bukti transfer buram dan nominal tidak terbaca jelas';

      if (isRej) {
        return {
          id: `NTF-BILL-REJ-${b.id}`,
          category: 'ipl',
          targetTab: 'iuran_riwayat',
          title: `🚨 Bukti IPL Ditolak: ${b.period_title || 'IPL Bulanan'}`,
          message: `Pembayaran IPL Anda untuk periode ${b.period_title || ''} (${formatRupiah(b.amount)}) ditolak oleh Bendahara. Alasan: "${reason}".`,
          time: b.due_date ? formatDateIndo(b.due_date) : 'Terbaru',
          isUnread: !isAllNotifRead,
          isAlert: true
        };
      }
      if (isWaiting) {
        return {
          id: `NTF-BILL-WAIT-${b.id}`,
          category: 'ipl',
          targetTab: 'iuran_riwayat',
          title: `⏳ Verifikasi IPL Diproses: ${b.period_title || 'IPL Bulanan'}`,
          message: `Bukti pembayaran ${formatRupiah(b.amount)} sedang diverifikasi oleh Bendahara RT.`,
          time: 'Sedang Proses',
          isUnread: false
        };
      }
      if (!isPaid) {
        return {
          id: `NTF-BILL-NEW-${b.id}`,
          category: 'ipl',
          targetTab: 'iuran_tagihan',
          title: `💳 Tagihan IPL Terbit: ${b.period_title || 'IPL Bulanan'}`,
          message: `Tagihan iuran bulanan sebesar ${formatRupiah(b.amount)} telah diterbitkan. Harap lakukan pembayaran.`,
          time: b.due_date ? formatDateIndo(b.due_date) : 'Aktif',
          isUnread: !isAllNotifRead
        };
      }
      return null;
    }).filter(Boolean),

    // 2. 📢 KEGIATAN WARGA (Pengumuman RT, Gotong Royong, Acara 17an)
    ...safeAnnouncements.map(ann => ({
      id: `NTF-KEG-${ann.id}`,
      category: 'kegiatan',
      targetTab: 'informasi_pengumuman',
      title: `📢 Kegiatan Warga: ${ann.judul || 'Pengumuman RT'}`,
      message: ann.isi || ann.kategori || 'Pengumuman resmi kegiatan warga dari Pengurus RT 05 Sawangan Green Park.',
      time: ann.tanggal ? formatDateIndo(ann.tanggal) : 'Terbaru',
      isUnread: false
    })),

    // 3. 📅 JADWAL & AGENDA (Ronda Malam / Siskamling, Pertemuan RT)
    ...safeAgendas.map(ag => ({
      id: `NTF-JAD-${ag.id}`,
      category: 'jadwal',
      targetTab: 'informasi_jadwal',
      title: `🗓️ Jadwal & Agenda: ${ag.title || ag.judul || 'Agenda Lingkungan'}`,
      message: `Kegiatan "${ag.title || ag.judul}" dijadwalkan pada ${ag.date ? formatDateIndo(ag.date) : 'Waktu tertera'} di ${ag.location || ag.tempat || 'Lingkungan RT 05'}.`,
      time: ag.date ? formatDateIndo(ag.date) : 'Mendatang',
      isUnread: false
    })),

    // 4. 🕊️ BERITA DUKA CITA & KEMATIAN
    ...safeDeceasedWarga.map(dec => ({
      id: `NTF-DUKA-${dec.id}`,
      category: 'kematian',
      targetTab: 'informasi_pengumuman',
      title: `🕊️ Berita Duka Cita Warga RT 05`,
      message: `Innalillahi wa inna ilaihi raji'un. Telah berpulang ke Rahmatullah, ${dec.gender === 'Perempuan' ? 'Ibu' : 'Bapak'} ${dec.name} (${dec.alamat ? `Warga ${dec.alamat}` : 'Warga RT 05'}). Semoga amal ibadah almarhum/ah diterima di sisi-Nya.`,
      time: 'Berita Duka',
      isUnread: !isAllNotifRead,
      isAlert: true
    })),

    // 5. Layanan Pengajuan Surat Warga
    ...safeSubmissions.map(sub => ({
      id: `NTF-SUB-${sub.id}`,
      category: 'surat',
      targetTab: 'layanan_status',
      title: `📄 Status Surat: ${sub.wargaTipeSurat || 'Surat Pengantar RT'}`,
      message: `Permohonan surat "${sub.wargaKeperluan || 'Administrasi'}" status terkini: ${sub.status || 'Pending'}.`,
      time: sub.submissionDate || 'Terbaru',
      isUnread: !isAllNotifRead && (sub.status === 'Pending' || sub.status === 'Approved')
    })),

    // 6. Laporan Aduan Warga
    ...safeComplaints.map(p => ({
      id: `NTF-PGD-${p.id}`,
      category: 'pengaduan',
      targetTab: 'pengaduan',
      title: `🚨 Laporan Aduan: ${p.jenis_pengaduan || 'Fasilitas Umum'}`,
      message: `Laporan "${p.isi || 'Laporan Warga'}" status: ${p.status || 'Proses'}.`,
      time: p.tanggal || 'Terbaru',
      isUnread: !isAllNotifRead && (p.status === 'Menunggu' || p.status === 'Proses')
    }))
  ];
  const formattedServerNotifs = (Array.isArray(serverNotifications) ? serverNotifications : []).map(s => {
    const rawType = String(s.type || s.category || s.reference_type || '').toLowerCase();
    let cat = 'ipl';
    let target = 'iuran_riwayat';
    if (rawType === 'kegiatan' || rawType.includes('announcement') || rawType.includes('pengumuman')) {
      cat = 'kegiatan';
      target = 'informasi_pengumuman';
    } else if (rawType === 'jadwal' || rawType.includes('agenda') || rawType.includes('ronda')) {
      cat = 'jadwal';
      target = 'informasi_jadwal';
    } else if (rawType === 'kematian' || rawType.includes('death') || rawType.includes('duka')) {
      cat = 'kematian';
      target = 'informasi_pengumuman';
    } else if (rawType === 'surat' || rawType.includes('letter') || rawType.includes('submission')) {
      cat = 'surat';
      target = 'layanan_status';
    } else if (rawType === 'pengaduan' || rawType.includes('report') || rawType.includes('complaint')) {
      cat = 'pengaduan';
      target = 'pengaduan';
    } else if (rawType === 'ipl' || rawType === 'kas' || rawType === 'payment' || rawType === 'bill_period') {
      cat = 'ipl';
      target = s.title?.toLowerCase().includes('tagihan') ? 'iuran_tagihan' : 'iuran_riwayat';
    }

    const isRej = rawType.includes('reject') || rawType.includes('tolak') || s.title?.toLowerCase().includes('ditolak');
    const isDuka = cat === 'kematian' || s.title?.toLowerCase().includes('duka');

    return {
      id: s.id || `SRV-${Math.random()}`,
      serverId: s.id,
      category: cat,
      targetTab: target,
      title: s.title || (isRej ? '🚨 Bukti IPL Ditolak' : 'Notifikasi Sistem RT'),
      message: s.message || s.content || s.deskripsi || '-',
      time: s.created_at ? formatDateIndo(s.created_at) : 'Baru saja',
      isUnread: s.is_read === false || s.is_read === 0 || s.is_read === '0' || !s.is_read,
      isAlert: isRej || isDuka
    };
  });

  const mergedNotifications = [
    ...formattedServerNotifs,
    ...liveNotifFeed.filter(l => !formattedServerNotifs.some(s => s.id === l.id || s.title === l.title))
  ];

  const displayNotifications = mergedNotifications.length > 0 ? mergedNotifications : [
    {
      id: 'NTF-101',
      category: 'iuran',
      targetTab: 'iuran_tagihan',
      title: 'Pemberitahuan Tagihan Iuran Bulanan',
      message: `Tagihan Iuran Kas & Kebersihan RT 05 bulan ini telah terbit untuk ${currentUser.name || 'Warga'}. Harap lakukan konfirmasi pembayaran.`,
      time: 'Hari Ini',
      isUnread: !isAllNotifRead && currentUser.tagihNotification
    },
    {
      id: 'NTF-102',
      category: 'surat',
      targetTab: 'layanan_status',
      title: 'Status Pengajuan Surat Pengantar Approved',
      message: 'Permohonan Surat Keterangan Domisili Anda telah diverifikasi & disetujui oleh Pengurus RT. Berkas fisik dapat diunduh.',
      time: 'Hari Ini',
      isUnread: !isAllNotifRead
    },
    {
      id: 'NTF-103',
      category: 'pengumuman',
      targetTab: 'informasi_pengumuman',
      title: 'Pengumuman Kerja Bakti Masal RT 05',
      message: 'Pengurus RT mengundang seluruh kepala keluarga untuk hadir dalam kegiatan perapihan selokan dan kebersihan lingkungan hari Minggu pukul 07.00 WIB.',
      time: 'Kemarin',
      isUnread: false
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row text-slate-800 dark:text-slate-100 font-sans antialiased relative overflow-hidden pt-0 sm:pt-2">
      {/* Premium ambient glows */}
      <div className="absolute top-1/4 left-10 w-[500px] h-[500px] bg-emerald-500/5 dark:bg-emerald-500/[0.02] rounded-full blur-3xl -z-10 pointer-events-none animate-pulse-slow"></div>
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
              <h1 className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight">Warga Portal</h1>
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
                  <h1 className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight">Warga Portal</h1>
                  <span className="text-[8px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider block">RT 05 / RW 06</span>
                </div>
              </div>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                aria-label="Tutup Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 mx-3 my-3 bg-white/90 dark:bg-emerald-900/30 rounded-2xl border border-emerald-200/80 dark:border-emerald-700/40 shadow-xs flex items-center gap-3 backdrop-blur-md">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black flex items-center justify-center text-xs uppercase shadow-md shadow-emerald-500/20">
                {displayNama.charAt(0) || 'W'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{displayNama}</p>
                <p className="text-[9px] text-emerald-700 dark:text-emerald-300 font-extrabold uppercase tracking-wider">Warga Portal</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <nav className="px-3 py-2 space-y-1 font-sans text-xs">
                
                {/* Dashboard Button */}
                <button
                  onClick={() => { setActiveTab('dashboard'); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                      : 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                  <span>Dashboard</span>
                </button>

                {/* Profil Saya Button */}
                <button
                  onClick={() => { setActiveTab('profil_saya'); handleCancel(); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'profil_saya'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                      : 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                  }`}
                >
                  <User className="w-4 h-4 text-sky-400" />
                  <span>Profil Saya</span>
                </button>

                {/* Keluarga Saya Button */}
                <button
                  onClick={() => { setActiveTab('keluarga_saya'); handleCancel(); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'keluarga_saya'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                      : 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                  }`}
                >
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>Keluarga Saya</span>
                </button>

                {/* Upload Berkas Mandiri Button */}
                <button
                  onClick={() => { setActiveTab('warga_upload_berkas'); handleCancel(); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'warga_upload_berkas'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                      : 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                  }`}
                >
                  <Upload className="w-4 h-4 text-emerald-500" />
                  <span>Upload Berkas Mandiri</span>
                </button>

                {/* Informasi Dropdown */}
                <div>
                  <button
                    onClick={() => setIsInformasiOpen(!isInformasiOpen)}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                      <span>Informasi</span>
                    </div>
                    <span className="text-[9px] text-slate-600 dark:text-white/70 font-extrabold">{isInformasiOpen ? '▼' : '▶'}</span>
                  </button>

                  {isInformasiOpen && (
                    <div className="pl-6 py-1 space-y-1 border-l border-slate-200/60 dark:border-slate-800 ml-6 font-sans text-xs">
                      <button
                        onClick={() => { setActiveTab('informasi_pengumuman'); setIsMobileDrawerOpen(false); }}
                        className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                          activeTab === 'informasi_pengumuman' 
                            ? 'text-emerald-400 font-bold bg-slate-800/50' 
                            : 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800/30'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'informasi_pengumuman' ? 'bg-emerald-400 scale-125' : 'bg-slate-600'}`}></span>
                        <span>Pengumuman</span>
                      </button>
                      <button
                        onClick={() => { setActiveTab('informasi_jadwal'); setIsMobileDrawerOpen(false); }}
                        className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                          activeTab === 'informasi_jadwal' 
                            ? 'text-emerald-400 font-bold bg-slate-800/50' 
                            : 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800/30'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'informasi_jadwal' ? 'bg-emerald-400 scale-125' : 'bg-slate-600'}`}></span>
                        <span>Jadwal Kegiatan</span>
                      </button>
                      <button
                        onClick={() => { setActiveTab('informasi_kontak'); setIsMobileDrawerOpen(false); }}
                        className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                          activeTab === 'informasi_kontak' 
                            ? 'text-emerald-400 font-bold bg-slate-800/50' 
                            : 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800/30'
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
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Wallet className="w-4 h-4 text-amber-400" />
                      <span>Iuran</span>
                    </div>
                    <span className="text-[9px] text-slate-600 dark:text-white/70 font-extrabold">{isIuranOpen ? '▼' : '▶'}</span>
                  </button>

                  {isIuranOpen && (
                    <div className="pl-6 py-1 space-y-1 border-l border-slate-200/60 dark:border-slate-800 ml-6 font-sans text-xs">
                      <button
                        onClick={() => { setActiveTab('iuran_tagihan'); setIsMobileDrawerOpen(false); }}
                        className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                          activeTab === 'iuran_tagihan' 
                            ? 'text-emerald-400 font-bold bg-slate-800/50' 
                            : 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800/30'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'iuran_tagihan' ? 'bg-emerald-400 scale-125' : 'bg-slate-600'}`}></span>
                        <span>Tagihan Saya</span>
                      </button>
                      <button
                        onClick={() => { setActiveTab('iuran_riwayat'); setIsMobileDrawerOpen(false); }}
                        className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                          activeTab === 'iuran_riwayat' 
                            ? 'text-emerald-400 font-bold bg-slate-800/50' 
                            : 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800/30'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'iuran_riwayat' ? 'bg-emerald-400 scale-125' : 'bg-slate-600'}`}></span>
                        <span>Riwayat Pembayaran</span>
                      </button>
                      <button
                        onClick={() => { setActiveTab('iuran_upload'); setIsMobileDrawerOpen(false); }}
                        className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                          activeTab === 'iuran_upload' 
                            ? 'text-emerald-400 font-bold bg-slate-800/50' 
                            : 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800/30'
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
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-sky-400" />
                      <span>Layanan Surat</span>
                    </div>
                    <span className="text-[9px] text-slate-600 dark:text-white/70 font-extrabold">{isSuratOpen ? '▼' : '▶'}</span>
                  </button>

                  {isSuratOpen && (
                    <div className="pl-6 py-1 space-y-1 border-l border-slate-200/60 dark:border-slate-800 ml-6 font-sans text-xs">
                      <button
                        onClick={() => { setActiveTab('layanan_ajukan'); setIsMobileDrawerOpen(false); }}
                        className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                          activeTab === 'layanan_ajukan' 
                            ? 'text-emerald-400 font-bold bg-slate-800/50' 
                            : 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800/30'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'layanan_ajukan' ? 'bg-emerald-400 scale-125' : 'bg-slate-600'}`}></span>
                        <span>Ajukan Surat</span>
                      </button>
                      <button
                        onClick={() => { setActiveTab('layanan_status'); setIsMobileDrawerOpen(false); }}
                        className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                          activeTab === 'layanan_status' 
                            ? 'text-emerald-400 font-bold bg-slate-800/50' 
                            : 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800/30'
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
                  onClick={() => { setActiveTab('pengaduan'); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'pengaduan'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                      : 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Pengaduan</span>
                </button>

                {/* Dokumen */}
                <button
                  onClick={() => { setActiveTab('dokumen'); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'dokumen'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                      : 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                  }`}
                >
                  <FolderOpen className="w-4 h-4 text-purple-400" />
                  <span>Dokumen</span>
                </button>

                {/* Voting Karyawan */}
                <button
                  onClick={() => { setActiveTab('voting_karyawan'); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'voting_karyawan'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                      : 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Voting Karyawan</span>
                </button>

                {/* Notifikasi */}
                <button
                  onClick={() => { setActiveTab('notifikasi'); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'notifikasi'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                      : 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10'
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
                  onClick={() => { setActiveTab('pengaturan'); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'pengaturan'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                      : 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10'
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
                <span>Keluar Portal</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* 1. DESKTOP SIDEBAR - Dual Mode Adaptive (Hidden on Mobile) */}
      <aside className="hidden md:flex md:w-64 bg-gradient-to-b from-emerald-50/90 via-slate-50 to-teal-50/70 dark:from-emerald-950 dark:via-teal-950 dark:to-slate-950 text-slate-800 dark:text-white border-r border-emerald-200/80 dark:border-emerald-900/40 flex-col flex-shrink-0 shadow-lg md:h-screen md:sticky md:top-0">
        
        {/* Logo/Brand Header */}
        <div className="p-6 border-b border-emerald-200/80 dark:border-emerald-900/40 flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-emerald-600 to-teal-600 rounded-2xl text-white shadow-md shadow-emerald-500/20">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight leading-tight">Warga Portal</h1>
            <span className="text-[9px] text-emerald-700 dark:text-emerald-300 uppercase font-extrabold tracking-widest leading-none">RT 05 / RW 06</span>
          </div>
        </div>

        {/* Citizen Profile Card in Sidebar */}
        <div className="p-4 mx-4 my-3 bg-white/90 dark:bg-emerald-900/30 rounded-2xl border border-emerald-200/80 dark:border-emerald-700/40 shadow-xs flex items-center gap-3 backdrop-blur-md">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black flex items-center justify-center text-xs uppercase shadow-md shadow-emerald-500/20">
            {displayNama.charAt(0) || 'W'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{displayNama}</p>
            <p className="text-[9px] text-emerald-700 dark:text-emerald-300 font-extrabold uppercase tracking-wider">Warga Portal</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto sidebar-scrollbar">
          
          {/* Dashboard Button */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                : 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
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
                : 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="w-4 h-4 text-sky-400" />
            <span>Profil Saya</span>
          </button>

          {/* Keluarga Saya Button */}
          <button
            onClick={() => { setActiveTab('keluarga_saya'); handleCancel(); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'keluarga_saya'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                : 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-purple-400" />
            <span>Keluarga Saya</span>
          </button>

          {/* Upload Berkas Mandiri Button */}
          <button
            onClick={() => { setActiveTab('warga_upload_berkas'); handleCancel(); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'warga_upload_berkas'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                : 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4 text-emerald-500" />
            <span>Upload Berkas Mandiri</span>
          </button>

          {/* Informasi Dropdown */}
          <div>
            <button
              onClick={() => setIsInformasiOpen(!isInformasiOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>Informasi</span>
              </div>
              <span className="text-[9px] text-slate-600 dark:text-white/70 font-extrabold">{isInformasiOpen ? '▼' : '▶'}</span>
            </button>

            {isInformasiOpen && (
              <div className="pl-6 py-1 space-y-1 border-l border-slate-200/60 dark:border-slate-800 ml-6 font-sans text-xs">
                <button
                  onClick={() => setActiveTab('informasi_pengumuman')}
                  className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'informasi_pengumuman' 
                      ? 'text-emerald-400 font-bold bg-slate-800/50' 
                      : 'text-slate-900 dark:text-white hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/30'
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
                      : 'text-slate-900 dark:text-white hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/30'
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
                      : 'text-slate-900 dark:text-white hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/30'
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
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Wallet className="w-4 h-4 text-amber-400" />
                <span>Iuran</span>
              </div>
              <span className="text-[9px] text-slate-600 dark:text-white/70 font-extrabold">{isIuranOpen ? '▼' : '▶'}</span>
            </button>

            {isIuranOpen && (
              <div className="pl-6 py-1 space-y-1 border-l border-slate-200/60 dark:border-slate-800 ml-6 font-sans text-xs">
                <button
                  onClick={() => setActiveTab('iuran_tagihan')}
                  className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'iuran_tagihan' 
                      ? 'text-emerald-400 font-bold bg-slate-800/50' 
                      : 'text-slate-900 dark:text-white hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/30'
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
                      : 'text-slate-900 dark:text-white hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/30'
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
                      : 'text-slate-900 dark:text-white hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/30'
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
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-sky-400" />
                <span>Layanan Surat</span>
              </div>
              <span className="text-[9px] text-slate-600 dark:text-white/70 font-extrabold">{isSuratOpen ? '▼' : '▶'}</span>
            </button>

            {isSuratOpen && (
              <div className="pl-6 py-1 space-y-1 border-l border-slate-200/60 dark:border-slate-800 ml-6 font-sans text-xs">
                <button
                  onClick={() => setActiveTab('layanan_ajukan')}
                  className={`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'layanan_ajukan' 
                      ? 'text-emerald-400 font-bold bg-slate-800/50' 
                      : 'text-slate-900 dark:text-white hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/30'
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
                      : 'text-slate-900 dark:text-white hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/30'
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
                : 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
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
                : 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FolderOpen className="w-4 h-4 text-purple-400" />
            <span>Dokumen</span>
          </button>

          {/* Voting Karyawan */}
          <button
            onClick={() => setActiveTab('voting_karyawan')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'voting_karyawan'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                : 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Voting Karyawan</span>
          </button>

          {/* Notifikasi */}
          <button
            onClick={() => setActiveTab('notifikasi')}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'notifikasi'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                : 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
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
                : 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
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
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-rose-500/20 hover:text-rose-400 text-rose-500 transition-colors cursor-pointer text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Portal</span>
          </button>
        </div>

      </aside>

      {/* 2. MAIN AREA */}
      <main className="flex-grow flex flex-col min-w-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-100/60 via-slate-50 to-teal-50/40 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 min-h-screen">
        


        {/* Dynamic Header Ribbon */}
        <header className="sticky top-0 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-emerald-200/60 dark:border-slate-800/50 py-4 px-6 md:px-8 z-20 flex items-center justify-between">
          <div className="flex flex-col font-sans">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-mono">
              {activeTab === 'dashboard' && 'RANGKUMAN AKTIVITAS'}
              {activeTab === 'profil_saya' && 'PROFIL MANDIRI WARGA'}
              {activeTab === 'keluarga_saya' && 'ANGGOTA KELUARGA SAYA'}
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
              {activeTab === 'keluarga_saya' && 'Anggota Keluarga Saya'}
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
          
          <div className="flex items-center gap-2.5 sm:gap-4">
            <span className="inline-flex px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-450 rounded-lg text-[10px] font-extrabold uppercase tracking-wider items-center gap-1.5 animate-pulse-slow">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping"></span>
              Live Sync
            </span>
            <span className="hidden sm:inline-flex px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold items-center gap-1.5 font-sans">
              <Sparkles className="w-3 h-3" />
              Portal Warga
            </span>
          </div>
        </header>

        {/* 3. SCROLL CONTENT AREA */}
        <div className="p-6 md:p-8 flex-1 max-w-5xl w-full mx-auto">          {/* Universal Dynamic Header Banner - Dual Mode Adaptive */}
          <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 dark:from-emerald-950/70 dark:via-teal-950/70 dark:to-emerald-950/50 border border-emerald-500/20 dark:border-emerald-500/30 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 animate-fade-in font-sans">
            <div className="absolute right-[-20px] top-[-20px] w-48 h-48 bg-emerald-500/10 dark:bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="space-y-1.5 z-10">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-emerald-500/15 dark:bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-200 border border-emerald-500/20 dark:border-white/20">
                  Portal Mandiri Warga RT 05
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-300 font-mono font-bold">Blok {currentUser.alamat ? (currentUser.alamat.split('Blok ').pop() || currentUser.alamat) : 'RT 05'}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white capitalize">
                {activeTab === 'dashboard' && `Selamat Datang Kembali, ${currentUser.name}! 👋`}
                {activeTab === 'profil_saya' && 'Profil Mandiri & Biodata Warga 👤'}
                {activeTab === 'keluarga_saya' && 'Daftar Anggota Keluarga Saya 👨‍👩‍👧‍👦'}
                {activeTab === 'warga_upload_berkas' && 'Upload Berkas Kependudukan Mandiri 📤'}
                {activeTab === 'informasi_pengumuman' && 'Pengumuman & Berita RT 05 📢'}
                {activeTab === 'informasi_jadwal' && 'Penjadwalan Kegiatan & Gotong Royong 🗓️'}
                {activeTab === 'informasi_kontak' && 'Kontak Layanan Pengurus RT 05 📞'}
                {activeTab === 'iuran_tagihan' && 'Rincian Tagihan Iuran Bulanan 💳'}
                {activeTab === 'iuran_riwayat' && 'Riwayat Setoran Pembayaran Iuran 📊'}
                {activeTab === 'iuran_upload' && 'Form Upload Bukti Pembayaran 📲'}
                {activeTab === 'layanan_ajukan' && 'Loket Pengajuan Surat Pengantar 📝'}
                {activeTab === 'layanan_status' && 'Status Layanan Pengajuan Surat 📄'}
                {activeTab === 'pengaduan' && 'Laporan Pengaduan & Aspirasi Lingkungan 🔔'}
                {activeTab === 'dokumen' && 'Arsip Dokumen & AD/ART RT 05 📁'}
                {activeTab === 'notifikasi' && 'Kotak Masuk Notifikasi System 📩'}
                {activeTab === 'pengaturan' && 'Pengaturan Akun & Kata Sandi 🔑'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-emerald-100 max-w-xl leading-relaxed font-medium">
                Akses seluruh layanan RT 05 secara mandiri, transparan, dan mudah dari perangkat Anda.
              </p>
            </div>
            <div className="px-4 py-2 bg-emerald-600 dark:bg-white/20 hover:bg-emerald-700 dark:hover:bg-white/30 backdrop-blur-md text-white font-extrabold text-xs rounded-xl shadow-md border border-emerald-500/30 dark:border-white/30 flex items-center gap-2 transition-all z-10 flex-shrink-0">
              <Landmark className="w-4 h-4 text-white dark:text-emerald-300" />
              <span>RT 05 / RW 06</span>
            </div>
          </div>
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fade-in font-sans">
              
              {/* Quick statistics widgets grid */}
              {/* Quick statistics widgets grid (2 Columns on Mobile Portrait) */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
                <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white dark:from-emerald-950/40 dark:to-slate-900 border border-emerald-500/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
                  <div className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl text-white shadow-md shrink-0 ${currentUser.statusIuran?.includes('Menunggak') ? 'bg-gradient-to-br from-rose-500 to-amber-500 shadow-rose-500/30' : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30'}`}>
                    <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[9px] sm:text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider truncate">Iuran Kas RT</span>
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight block mt-0.5 truncate">{currentUser.statusIuran || 'Lunas'}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-sky-500/10 via-teal-500/5 to-white dark:from-sky-950/40 dark:to-slate-900 border border-sky-500/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
                  <div className="p-2.5 sm:p-4 bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-xl sm:rounded-2xl shadow-md shadow-sky-500/30 shrink-0">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[9px] sm:text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider truncate">Surat Pengantar</span>
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight block mt-0.5 truncate">{mySubmissions.length} Diajukan</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500/10 via-emerald-500/5 to-white dark:from-purple-950/40 dark:to-slate-900 border border-purple-500/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
                  <div className="p-2.5 sm:p-4 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-xl sm:rounded-2xl shadow-md shadow-purple-500/30 shrink-0">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[9px] sm:text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider truncate">Kegiatan RT</span>
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight block mt-0.5 truncate">{agendaList.length} Terjadwal</span>
                  </div>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
                  <div className="p-2.5 sm:p-4 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl sm:rounded-2xl shrink-0">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[9px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider truncate">Pengaduan Saya</span>
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight block mt-0.5 truncate">{pengaduanList.length} Dikirim</span>
                  </div>
                </div>
              </div>

              {/* Layout Split: Quick Action Menu & Latest Notifications feed */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                
                {/* Left panel: Quick shortcuts list (2-Column Grid on Portrait/Mobile) */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs space-y-3">
                  <h4 className="font-extrabold text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider block mb-1">Tautan Aksi Cepat</h4>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 sm:gap-3">
                    <button 
                      onClick={() => setActiveTab('layanan_ajukan')}
                      className="w-full p-3 sm:py-3 sm:px-4 border border-slate-200/60 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl text-center sm:text-left text-xs font-bold flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2.5 transition-all hover:bg-slate-50 dark:hover:bg-slate-950/20 active:scale-95 cursor-pointer min-h-[84px] sm:min-h-[52px]"
                    >
                      <div className="p-2 sm:p-1 bg-emerald-500/10 text-emerald-600 rounded-xl shrink-0">
                        <FileText className="w-5 h-5 sm:w-4 sm:h-4" />
                      </div>
                      <span className="text-[11px] sm:text-xs leading-tight">Ajukan Surat</span>
                    </button>

                    <button 
                      onClick={() => setActiveTab('iuran_upload')}
                      className="w-full p-3 sm:py-3 sm:px-4 border border-slate-200/60 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl text-center sm:text-left text-xs font-bold flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2.5 transition-all hover:bg-slate-50 dark:hover:bg-slate-950/20 active:scale-95 cursor-pointer min-h-[84px] sm:min-h-[52px]"
                    >
                      <div className="p-2 sm:p-1 bg-amber-500/10 text-amber-500 rounded-xl shrink-0">
                        <Upload className="w-5 h-5 sm:w-4 sm:h-4" />
                      </div>
                      <span className="text-[11px] sm:text-xs leading-tight">Upload Bayar</span>
                    </button>

                    <button 
                      onClick={() => setActiveTab('pengaduan')}
                      className="w-full p-3 sm:py-3 sm:px-4 border border-slate-200/60 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl text-center sm:text-left text-xs font-bold flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2.5 transition-all hover:bg-slate-50 dark:hover:bg-slate-950/20 active:scale-95 cursor-pointer min-h-[84px] sm:min-h-[52px]"
                    >
                      <div className="p-2 sm:p-1 bg-rose-500/10 text-rose-500 rounded-xl shrink-0">
                        <AlertTriangle className="w-5 h-5 sm:w-4 sm:h-4" />
                      </div>
                      <span className="text-[11px] sm:text-xs leading-tight">Kirim Laporan</span>
                    </button>

                    <button 
                      onClick={() => setActiveTab('informasi_kontak')}
                      className="w-full p-3 sm:py-3 sm:px-4 border border-slate-200/60 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl text-center sm:text-left text-xs font-bold flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2.5 transition-all hover:bg-slate-50 dark:hover:bg-slate-950/20 active:scale-95 cursor-pointer min-h-[84px] sm:min-h-[52px]"
                    >
                      <div className="p-2 sm:p-1 bg-blue-500/10 text-blue-500 rounded-xl shrink-0">
                        <Phone className="w-5 h-5 sm:w-4 sm:h-4" />
                      </div>
                      <span className="text-[11px] sm:text-xs leading-tight">Kontak RT</span>
                    </button>
                  </div>
                </div>

                {/* Right panel: Active announcements and notification updates */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xs flex flex-col">
                  <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider block mb-3">Informasi Lingkungan Terkini</h4>
                  
                  <div className="flex-1 space-y-3 max-h-[340px] sm:max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                    {currentUser.tagihNotification && (
                      <div className="p-3 sm:p-4 bg-rose-500/10 dark:bg-rose-500/5 border border-rose-500/20 dark:border-rose-500/30 rounded-2xl flex items-center gap-3 animate-pulse">
                        <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
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

          {/* TAB 1.5: Keluarga Saya */}
          {activeTab === 'keluarga_saya' && (
            <div className="space-y-6 animate-fade-in font-sans">
              {isLoadingFamily ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Memuat data keluarga dari server...</p>
                </div>
              ) : familyError ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-8 text-center space-y-4">
                  <div className="mx-auto w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Gagal Memuat Data</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">{familyError}</p>
                  <button
                    onClick={fetchFamilyMembers}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Coba Lagi
                  </button>
                </div>
              ) : (
                <>
                  {/* House Details Header */}
                  {familyMembers.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] to-teal-500/[0.03] dark:from-emerald-500/[0.05] dark:to-teal-500/[0.05]" />
                      <div className="relative z-10 space-y-2">
                        <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-wider">
                          🏠 Domisili Keluarga
                        </span>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                          Blok {familyMembers[0].house_blok} No. {familyMembers[0].house_nomor}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {familyMembers[0].house_alamat}
                        </p>
                      </div>
                      <div className="relative z-10 flex gap-4 text-xs">
                        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-2xl">
                          <span className="text-[10px] text-slate-400 font-bold block">Status Kepemilikan</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                            Rumah {familyMembers[0].house_status || 'Pribadi'}
                          </span>
                        </div>
                        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-2xl">
                          <span className="text-[10px] text-slate-400 font-bold block">Total Anggota</span>
                          <span className="font-extrabold text-slate-855 dark:text-slate-200">
                            {familyMembers.length} Orang
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Family Members Table */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
                    <div className="border-b border-slate-200/60 dark:border-slate-800 pb-3 flex justify-between items-center">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Anggota Keluarga Terdaftar</h4>
                        <p className="text-[10px] text-slate-400">Daftar anggota keluarga yang tercatat dalam Kartu Keluarga ini.</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setIsAddMemberOpen(true)}
                          className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors hover:shadow-lg hover:shadow-emerald-500/10"
                        >
                          <span>+ Tambah Anggota</span>
                        </button>
                        <button
                          onClick={fetchFamilyMembers}
                          className="py-1 px-2.5 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-lg text-[10px] font-bold text-slate-500 dark:text-slate-400 cursor-pointer flex items-center gap-1"
                        >
                          <span>🔄 Segarkan</span>
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50/70 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider">
                            <th className="p-4">Nama Lengkap</th>
                            <th className="p-4">NIK (Tersensor)</th>
                            <th className="p-4">Umur / Tgl Lahir</th>
                            <th className="p-4">Gender</th>
                            <th className="p-4 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                          {familyMembers.map((m) => (
                            <tr key={m.warga_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                              <td className="p-4 font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black flex items-center justify-center uppercase">
                                  {m.nama.charAt(0)}
                                </div>
                                <span>{m.nama}</span>
                              </td>
                              <td className="p-4 font-mono text-slate-655 dark:text-slate-350">{m.nik}</td>
                              <td className="p-4">
                                <div className="font-bold text-slate-705 dark:text-slate-300">{m.umur} Tahun</div>
                                <div className="text-[10px] text-slate-400 font-mono">{formatDateIndo(m.tgl_lahir)}</div>
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                                  m.jenis_kelamin === 'Laki-laki' 
                                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                                    : 'bg-pink-500/10 text-pink-600 dark:text-pink-400'
                                }`}>
                                  {m.jenis_kelamin}
                                </span>
                              </td>
                              <td className="p-4 font-mono font-semibold text-slate-600 dark:text-slate-400">{m.no_hp || '-'}</td>
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedResidentForDoc(m);
                                      setIsDocModalOpen(true);
                                    }}
                                    className="py-1 px-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-[10px] font-bold cursor-pointer transition-transform active:scale-[0.97]"
                                  >
                                    📁 Berkas
                                  </button>
                                  <button
                                    onClick={() => openEditMemberModal(m)}
                                    className="py-1 px-3 border border-emerald-500/20 hover:border-emerald-500 text-emerald-555 hover:text-white dark:hover:bg-emerald-500/20 text-emerald-500 rounded-lg font-bold text-[10px] cursor-pointer transition-all"
                                  >
                                    Edit Data
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {familyMembers.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-12 text-center text-slate-450 italic font-bold">
                                Tidak ada anggota keluarga terdaftar.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* Berkas Sensitif Warga Modal */}
              {isDocModalOpen && selectedResidentForDoc && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl relative overflow-y-auto max-h-[90vh]">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <h4 className="font-extrabold text-base text-slate-900 dark:text-white">Dokumen Sensitif Warga</h4>
                        <p className="text-[10px] text-slate-400">Kelola dan unggah KTP, KK, Akta, atau KIA milik {selectedResidentForDoc.nama}.</p>
                      </div>
                      <button onClick={() => { setIsDocModalOpen(false); setSelectedResidentForDoc(null); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>

                    {/* Upload Section */}
                    <form onSubmit={handleUploadDocument} className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 rounded-2xl space-y-3">
                      <h5 className="font-extrabold text-[11px] text-slate-400 uppercase tracking-wider">📤 Unggah Dokumen Baru</h5>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-500">Jenis Dokumen *</label>
                          <select
                            value={docUploadType}
                            onChange={(e) => setDocUploadType(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl font-bold"
                          >
                            <option value="ktp">KTP (Kartu Tanda Penduduk)</option>
                            <option value="kk">KK (Kartu Keluarga)</option>
                            <option value="akta">Akta Kelahiran</option>
                            <option value="kia">KIA (Kartu Identitas Anak)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-500">Berkas (JPG, PNG, PDF) *</label>
                          <input
                            required
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => setDocUploadFile(e.target.files[0])}
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl"
                          />
                        </div>
                      </div>
                      <button
                        disabled={isUploadingDoc}
                        type="submit"
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer"
                      >
                        {isUploadingDoc ? 'Sedang Mengunggah...' : 'Unggah Dokumen'}
                      </button>
                    </form>

                    {/* Document List */}
                    <div className="space-y-3">
                      <h5 className="font-extrabold text-[11px] text-slate-400 uppercase tracking-wider">📁 Daftar Berkas Terunggah</h5>
                      <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800 rounded-2xl font-sans">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50/70 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider font-sans">
                              <th className="p-3">Jenis</th>
                              <th className="p-3">File Path / Nama</th>
                              <th className="p-3 text-right">Unduh</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                            {wargaDocuments.filter(d => String(d.resident_id) === String(selectedResidentForDoc.warga_id || selectedResidentForDoc.id)).map((d) => (
                              <tr key={d.document_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                                <td className="p-3 font-bold uppercase text-slate-700 dark:text-slate-300">{d.type}</td>
                                <td className="p-3 max-w-[150px] truncate text-slate-500 font-mono text-[10px]" title={d.file_path}>
                                  {d.file_path}
                                </td>
                                <td className="p-3 text-right">
                                  <button
                                    onClick={() => handleDownloadDocument(d.document_id, d.file_path)}
                                    className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-750 text-white font-bold text-[9px] rounded-lg cursor-pointer"
                                  >
                                    Unduh
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {wargaDocuments.filter(d => String(d.resident_id) === String(selectedResidentForDoc.warga_id || selectedResidentForDoc.id)).length === 0 && (
                              <tr>
                                <td colSpan={3} className="p-6 text-center text-slate-400 italic">Belum ada dokumen terunggah untuk warga ini.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Add Family Member Modal */}
              {isAddMemberOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl relative overflow-y-auto max-h-[90vh]">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                      <h4 className="font-extrabold text-base text-slate-900 dark:text-white">Tambah Anggota Keluarga</h4>
                      <button onClick={() => setIsAddMemberOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>

                    {addMemberError && (
                      <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{addMemberError}</span>
                      </div>
                    )}

                    <form onSubmit={handleAddMemberSubmit} className="space-y-4 text-xs font-sans">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-500 dark:text-slate-400">
                          {parseInt(memberForm.umur) >= 17
                            ? 'NIK / No. KTP (Wajib, 16 digit)'
                            : 'NIK / No. KTP (Opsional untuk umur < 17 tahun)'}
                        </label>
                        <input
                          required={parseInt(memberForm.umur) >= 17}
                          type="text"
                          pattern="[0-9]{16}"
                          title="NIK harus 16 digit angka"
                          placeholder={parseInt(memberForm.umur) >= 17 ? "Masukkan NIK 16 digit..." : "Masukkan NIK 16 digit (jika ada)..."}
                          value={memberForm.nik}
                          onChange={(e) => setMemberForm({ ...memberForm, nik: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-500 dark:text-slate-400">Nama Lengkap</label>
                        <input
                          required
                          type="text"
                          placeholder="Nama lengkap sesuai KTP/KK..."
                          value={memberForm.nama}
                          onChange={(e) => setMemberForm({ ...memberForm, nama: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-500 dark:text-slate-400">Jenis Kelamin</label>
                          <select
                            value={memberForm.jenisKelamin}
                            onChange={(e) => setMemberForm({ ...memberForm, jenisKelamin: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-905 dark:text-white font-medium cursor-pointer"
                          >
                            <option value="Laki-laki">Laki-laki</option>
                            <option value="Perempuan">Perempuan</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-500 dark:text-slate-400">Umur</label>
                          <input
                            required
                            type="number"
                            min="0"
                            placeholder="Umur..."
                            value={memberForm.umur}
                            onChange={(e) => setMemberForm({ ...memberForm, umur: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white font-medium"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-500 dark:text-slate-400">Tanggal Lahir</label>
                          <DateInput
                            required
                            value={memberForm.tglLahir}
                            onChange={(e) => setMemberForm({ ...memberForm, tglLahir: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white font-medium"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-500 dark:text-slate-400">Nomor HP</label>
                          <input
                            required
                            type="text"
                            placeholder="Contoh: 0812..."
                            value={memberForm.noHp}
                            onChange={(e) => setMemberForm({ ...memberForm, noHp: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-905 dark:text-white font-medium"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setIsAddMemberOpen(false)}
                          className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-450 font-bold rounded-xl cursor-pointer text-center"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={isAddingMember}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-colors cursor-pointer text-center block shadow-md shadow-emerald-500/10 disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          {isAddingMember ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Menyimpan...</span>
                            </>
                          ) : (
                            <span>Simpan Anggota</span>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Edit Family Member Modal */}
          {isEditMemberOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-fade-in font-sans">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Edit2 className="w-4 h-4 text-emerald-500" />
                    <span>Edit Anggota Keluarga</span>
                  </h4>
                  <button onClick={() => setIsEditMemberOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                {editMemberError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{editMemberError}</span>
                  </div>
                )}

                <form onSubmit={handleEditMemberSubmit} className="space-y-4 text-xs font-sans">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-655 dark:text-slate-350">Nama Lengkap *</label>
                    <input
                      required
                      type="text"
                      placeholder="Masukkan nama lengkap..."
                      value={editMemberForm.nama}
                      onChange={(e) => setEditMemberForm({ ...editMemberForm, nama: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-655 dark:text-slate-350">Umur *</label>
                    <input
                      required
                      type="number"
                      placeholder="Masukkan umur..."
                      value={editMemberForm.umur}
                      onChange={(e) => setEditMemberForm({ ...editMemberForm, umur: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-655 dark:text-slate-350">Nomor HP (Opsional)</label>
                    <input
                      type="text"
                      placeholder="Contoh: 0812XXXXXXXX..."
                      value={editMemberForm.noHp}
                      onChange={(e) => setEditMemberForm({ ...editMemberForm, noHp: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditMemberOpen(false)}
                      className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-455 font-bold rounded-xl cursor-pointer text-center"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isEditingMember}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-colors cursor-pointer text-center block shadow-md shadow-emerald-500/10 disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {isEditingMember ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <span>Simpan Perubahan</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB: Upload Berkas Mandiri */}
          {activeTab === 'warga_upload_berkas' && isPermanentResident && (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="border-b border-slate-200/60 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Upload Dokumen Mandiri Warga</h3>
                <p className="text-xs text-slate-450">Unggah berkas kependudukan resmi Anda (KTP, KK, KIA, Akta Kelahiran) langsung ke server tanpa perlu persetujuan RT.</p>
              </div>

              {/* Form Upload */}
              <form onSubmit={handleSensitifDataSubmit} className="max-w-xl space-y-5 text-xs sm:text-sm">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-705 dark:text-slate-300">Pilih Anggota Keluarga *</label>
                  <select
                    required
                    value={uploadDocForm.wargaId}
                    onChange={(e) => setUploadDocForm({ ...uploadDocForm, wargaId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold"
                  >
                    <option value="">-- Pilih Anggota Keluarga --</option>
                    {familyMembers.map(m => (
                      <option key={m.warga_id} value={m.warga_id}>{m.nama} (NIK: {m.nik})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-705 dark:text-slate-300">Jenis Dokumen *</label>
                  <select
                    required
                    value={uploadDocForm.type}
                    onChange={(e) => setUploadDocForm({ ...uploadDocForm, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold"
                  >
                    <option value="ktp">KTP (Kartu Tanda Penduduk)</option>
                    <option value="kk">Kartu Keluarga (KK)</option>
                    <option value="kia">KIA (Kartu Identitas Anak)</option>
                    <option value="akta">Akta Kelahiran</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-705 dark:text-slate-300">Pilih Berkas Dokumen (Maks 5MB) *</label>
                  <input
                    type="file"
                    required
                    ref={docFileInputRef}
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => setUploadDocForm({ ...uploadDocForm, file: e.target.files[0] })}
                    className="w-full text-xs text-slate-500 dark:text-slate-450 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-500/10 file:text-emerald-505 hover:file:bg-emerald-500/20"
                  />
                  <p className="text-[10px] text-slate-400 font-sans mt-1">Mendukung format .jpg, .jpeg, .png, .pdf (Maksimal 5MB)</p>
                </div>

                {uploadDocError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs font-semibold">
                    {uploadDocError}
                  </div>
                )}

                {uploadDocSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450 rounded-xl text-xs font-semibold">
                    {uploadDocSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isUploadingDoc}
                  className="py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-extrabold rounded-xl hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isUploadingDoc ? 'Sedang Mengunggah...' : 'Unggah Dokumen'}
                </button>
              </form>

              {/* History List of Uploaded Documents */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4 font-sans">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Riwayat Berkas Diupload</h4>
                <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider">
                        <th className="p-4">Anggota Keluarga</th>
                        <th className="p-4">Jenis Dokumen</th>
                        <th className="p-4">Nama Berkas</th>
                        <th className="p-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {uploadedDocsList.map((doc) => {
                        const citizen = familyMembers.find(m => m.warga_id === parseInt(doc.wargaId)) || { nama: 'Warga' };
                        return (
                          <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                            <td className="p-4 font-bold text-slate-800 dark:text-white">{citizen.nama}</td>
                            <td className="p-4 uppercase font-bold text-emerald-650 dark:text-emerald-450">{doc.type}</td>
                            <td className="p-4 font-mono text-slate-500">{doc.fileName}</td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleDownloadSensitifDoc(doc.documentId)}
                                className="py-1 px-3 border border-emerald-500/20 hover:border-emerald-500 text-emerald-500 rounded-lg font-bold text-[10px] cursor-pointer"
                              >
                                Unduh / Lihat
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {uploadedDocsList.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-400 italic">
                            Belum ada dokumen yang diunggah secara mandiri.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Profil Saya */}
          {activeTab === 'profil_saya' && (
            <div className="space-y-6 animate-fade-in font-sans">
              
              {/* Header Visual */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col items-center text-center space-y-4">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-extrabold flex items-center justify-center text-3xl shadow-lg border-4 border-white dark:border-slate-800 overflow-hidden">
                    {formData.foto ? (
                      <img src={formData.foto} alt={displayNama} className="w-full h-full object-cover" />
                    ) : (
                      <span>{displayNama.charAt(0) || 'W'}</span>
                    )}
                  </div>
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg cursor-pointer transition-transform hover:scale-110 border-2 border-white dark:border-slate-800" title="Ubah Foto Profil">
                      <Camera className="w-4 h-4" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </label>
                  )}
                </div>
                
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{formData.name || displayNama}</h3>
                  <p className="text-xs text-slate-400 font-bold mt-0.5">Warga RT {rtRw}</p>
                </div>

                {!isEditing ? (
                  <button
                    onClick={handleEditClick}
                    className="py-2 px-5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 hover:scale-[1.02]"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit Profil Saya</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-extrabold px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20 animate-pulse">
                      Mode Edit Profil Aktif
                    </span>
                  </div>
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

              {/* Profile Editing Form Container */}
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                {/* Card 2: Informasi Pribadi */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">Informasi Pribadi</h4>
                  
                  <div className="space-y-4 text-xs sm:text-sm">
                    {/* Nama */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
                      <span className="w-36 text-slate-400 font-bold shrink-0">Nama Lengkap</span>
                      {isEditing ? (
                        <input
                          required
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold w-full max-w-md focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          placeholder="Nama lengkap sesuai KTP"
                        />
                      ) : (
                        <span className="text-slate-800 dark:text-slate-200 font-extrabold">{displayNama}</span>
                      )}
                    </div>

                    {/* NIK */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
                      <span className="w-36 text-slate-400 font-bold shrink-0">NIK (KTP)</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold font-mono">
                        {displayNik ? `${displayNik.slice(0, 4)}********${displayNik.slice(-4)}` : '3276********1234'}
                      </span>
                    </div>

                    {/* Jenis Kelamin */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
                      <span className="w-36 text-slate-400 font-bold shrink-0">Jenis Kelamin</span>
                      {isEditing ? (
                        <select
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold w-full max-w-md focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="Laki-laki">Laki-laki</option>
                          <option value="Perempuan">Perempuan</option>
                        </select>
                      ) : (
                        <span className="text-slate-800 dark:text-slate-200 font-bold">{displayGender}</span>
                      )}
                    </div>

                    {/* Tanggal Lahir */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
                      <span className="w-36 text-slate-400 font-bold shrink-0">Tanggal Lahir</span>
                      {isEditing ? (
                        <input
                          type="date"
                          value={formData.tglLahir}
                          onChange={(e) => setFormData({ ...formData, tglLahir: e.target.value })}
                          className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold w-full max-w-md focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      ) : (
                        <span className="text-slate-800 dark:text-slate-200 font-bold">{tanggalLahir}</span>
                      )}
                    </div>

                    {/* Pekerjaan */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
                      <span className="w-36 text-slate-400 font-bold shrink-0">Pekerjaan</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.pekerjaan}
                          onChange={(e) => setFormData({ ...formData, pekerjaan: e.target.value })}
                          className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold w-full max-w-md focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          placeholder="Pekerjaan saat ini"
                        />
                      ) : (
                        <span className="text-slate-800 dark:text-slate-200 font-bold">{pekerjaan}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card 3: Alamat & Tempat Tinggal */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">Alamat & Tempat Tinggal</h4>
                  
                  <div className="space-y-4 text-xs sm:text-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
                      <span className="w-36 text-slate-400 font-bold shrink-0">RT/RW</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold">{rtRw}</span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
                      <span className="w-36 text-slate-400 font-bold shrink-0">Alamat Lengkap</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.alamat}
                          onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                          className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold w-full max-w-md focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          placeholder="Alamat tempat tinggal"
                        />
                      ) : (
                        <span className="text-slate-800 dark:text-slate-200 font-bold">{displayAlamat || 'Belum diisi'}</span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
                      <span className="w-36 text-slate-400 font-bold shrink-0">Status Rumah</span>
                      {isEditing ? (
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold w-full max-w-md focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="Tetap">Tetap (Milik Sendiri)</option>
                          <option value="Kontrak">Kontrak / Sewa</option>
                        </select>
                      ) : (
                        <span className="text-slate-800 dark:text-slate-200 font-bold">{statusRumah}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card 4: Kontak */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">Kontak & Komunikasi</h4>
                  
                  <div className="space-y-4 text-xs sm:text-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
                      <span className="w-36 text-slate-400 font-bold shrink-0">No HP / WhatsApp</span>
                      {isEditing ? (
                        <input
                          required
                          type="text"
                          value={formData.noHp}
                          onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                          className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold w-full max-w-md focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      ) : (
                        <span className="text-slate-800 dark:text-slate-200 font-bold">{displayNoHp || '-'}</span>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
                      <span className="w-36 text-slate-400 font-bold shrink-0">Email</span>
                      {isEditing ? (
                        <input
                          required
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold w-full max-w-md focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      ) : (
                        <span className="text-slate-800 dark:text-slate-200 font-bold">{displayEmail || '-'}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card 5: Upload & Berkas KTP Warga */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">Berkas Identitas KTP Warga</h4>
                      <p className="text-[10px] text-slate-400">Unggah foto KTP asli Anda untuk verifikasi identitas resmi RT 05.</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${formData.foto_ktp || currentUser.foto_ktp ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
                      {formData.foto_ktp || currentUser.foto_ktp ? 'KTP Terunggah' : 'Belum Unggah KTP'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    {/* KTP Image Preview Box */}
                    <div className="relative rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 flex flex-col items-center justify-center min-h-[160px] text-center">
                      {(formData.foto_ktp || currentUser.foto_ktp) ? (
                        <img
                          src={formData.foto_ktp || currentUser.foto_ktp}
                          alt="Foto KTP Warga"
                          className="max-h-36 w-auto object-contain rounded-xl shadow-md border border-slate-200 dark:border-slate-800"
                        />
                      ) : (
                        <div className="space-y-1.5 p-3">
                          <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Belum ada foto KTP fisik</p>
                          <p className="text-[10px] text-slate-400">Format yang didukung: JPG, PNG (Maks 5MB)</p>
                        </div>
                      )}
                    </div>

                    {/* File Upload Input & Pratinjau Action */}
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          Upload / Ganti Berkas Foto KTP Asli
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files && e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                const base64Data = reader.result;
                                setFormData(prev => ({ ...prev, foto_ktp: base64Data }));
                                try {
                                  currentUser.foto_ktp = base64Data;
                                } catch(err) {}
                              };
                              reader.readAsDataURL(file);

                              // API Call: POST /resident/uploadsensitifdata/:id
                              try {
                                const token = localStorage.getItem('rt_token');
                                const targetId = currentUser.id || currentUser.nik || 1;
                                const uploadData = new FormData();
                                uploadData.append('type', 'ktp');
                                uploadData.append('file', file);

                                const res = await fetch(`http://172.20.32.31:3333/resident/uploadsensitifdata/${targetId}`, {
                                  method: 'POST',
                                  headers: {
                                    'Authorization': `Bearer ${token}`
                                  },
                                  body: uploadData
                                });

                                const resData = await res.json();
                                Swal.fire({
                                  title: 'KTP Berhasil Diunggah! 📸',
                                  text: resData.message || resData.pesan || 'Foto KTP fisik Anda telah tersimpan secara aman dan siap diverifikasi pengurus RT.',
                                  icon: 'success',
                                  confirmButtonColor: '#10b981'
                                });
                              } catch (err) {
                                console.warn('Upload KTP API fallback:', err);
                                Swal.fire({
                                  title: 'KTP Berhasil Diunggah! 📸',
                                  text: 'Foto KTP fisik Anda telah tersimpan secara aman di sistem lokal.',
                                  icon: 'success',
                                  confirmButtonColor: '#10b981'
                                });
                              }
                            }
                          }}
                          className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-500/10 file:text-emerald-600 dark:file:text-emerald-400 hover:file:bg-emerald-500/20 cursor-pointer"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedKtpWarga({
                            nama: displayNama,
                            nik: displayNik,
                            house_alamat: displayAlamat,
                            jenis_kelamin: displayGender,
                            foto_ktp: formData.foto_ktp || currentUser.foto_ktp,
                            foto: currentUser.foto || currentUser.avatar,
                            tgl_lahir: tanggalLahir,
                            pekerjaan: pekerjaan
                          });
                        }}
                        className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Pratinjau Kartu e-KTP Digital</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Form Action Buttons when Editing */}
                {isEditing && (
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg cursor-pointer transition-all flex items-center gap-2 hover:scale-[1.01]"
                    >
                      <Save className="w-4 h-4" />
                      <span>Simpan Perubahan Profil</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="py-2.5 px-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer border border-slate-200/50 dark:border-slate-800"
                    >
                      Batal
                    </button>
                  </div>
                )}
              </form>

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
                    onClick={async () => {
                      const result = await Swal.fire({
                        title: 'Logout Semua Perangkat',
                        text: 'Apakah Anda ingin keluar dari semua perangkat?',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#10b981',
                        cancelButtonColor: '#ef4444',
                        confirmButtonText: 'Ya, logout',
                        cancelButtonText: 'Batal'
                      });
                      if (result.isConfirmed) {
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
              <div className="border-b border-slate-200/60 dark:border-slate-800 pb-4 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pengumuman & Pemberitahuan Terbaru</h3>
                  <p className="text-xs text-slate-400">Informasi resmi seputar lingkungan RT 05 Sawangan Green Park.</p>
                </div>
                <button
                  onClick={fetchWargaAnnouncements}
                  className="py-1 px-2.5 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-lg text-[10px] font-bold text-slate-500 dark:text-slate-400 cursor-pointer"
                >
                  🔄 Segarkan
                </button>
              </div>

              {isLoadingAnnouncements ? (
                <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold text-slate-500">Memuat pengumuman...</p>
                </div>
              ) : wargaAnnouncements.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-bold italic text-xs">Belum ada pengumuman dari RT.</div>
              ) : (
                <div className="space-y-4">
                  {wargaAnnouncements.map((a) => (
                    <div key={a.id} className="p-5 bg-slate-50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800 rounded-3xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 font-bold text-[9px] rounded-md">PENGUMUMAN</span>
                        <span className="text-[10px] text-slate-400 font-bold">ID #{a.id}</span>
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">{a.judul}</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{a.isi}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Informasi -> Jadwal Kegiatan */}
          {activeTab === 'informasi_jadwal' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="border-b border-slate-200/60 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Jadwal & Agenda RT Terjadwal</h3>
                  <p className="text-xs text-slate-400">Daftar agenda kegiatan dan rapat rutin lingkungan RT 05.</p>
                </div>
                {/* Search Bar */}
                <div className="relative w-full sm:w-64 font-sans text-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari agenda kegiatan..."
                    value={agendaSearch}
                    onChange={(e) => {
                      setAgendaSearch(e.target.value);
                      if (fetchAgendas) fetchAgendas(e.target.value);
                    }}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-250 dark:border-slate-800 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-white transition-all text-xs"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {agendaList.length > 0 ? (
                  agendaList.map((a) => (
                    <div key={a.id} className="p-5 bg-slate-50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800 rounded-3xl flex gap-4 font-sans relative overflow-hidden">
                      <div className="absolute top-0 left-0 bottom-0 w-1 bg-emerald-500"></div>
                      <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 rounded-2xl flex items-center justify-center font-black text-sm font-mono flex-shrink-0">
                        {(a.date ? (a.date.split('-')[2] || a.date.split(' ')[0]) : '') || '12'}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white">{a.title}</h4>
                        <div className="flex flex-wrap gap-x-4 text-[10px] text-slate-400 font-bold">
                          <span>📅 {formatDateIndo(a.date)}</span>
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
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Kontak Layanan Pengurus RT 05</h3>
                <p className="text-xs text-slate-400">Kontak resmi pengurus Rukun Tetangga yang dapat dihubungi warga.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 bg-slate-50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800 rounded-3xl space-y-4">
                  <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-xs uppercase">RT</div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Pak Ahmad Mulyono</h4>
                    <span className="text-[10px] text-slate-400 font-bold">Ketua RT 05</span>
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
                    <span className="text-[10px] text-slate-400 font-bold">Sekretaris RT 05</span>
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
                    <span className="text-[10px] text-slate-400 font-bold">Bendahara RT 05</span>
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
          {activeTab === 'iuran_tagihan' && (() => {
            const payableBills = (iplBills || []).filter(b => {
              const s = String(b.status || '').toLowerCase();
              return s !== 'paid' && s !== 'lunas' && s !== 'waiting_verification' && s !== 'menunggu_verifikasi' && s !== 'exempt';
            });
            const totalUnpaidAmount = payableBills.reduce((acc, b) => acc + Number(b.amount || 0), 0);

            return (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
                <div className="border-b border-slate-200/60 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tagihan IPL Wajib Keluarga 💳</h3>
                    <p className="text-xs text-slate-400">Rincian status dan daftar tagihan Iuran Pengelolaan Lingkungan (IPL) bulanan.</p>
                  </div>
                  <button
                    onClick={fetchIplBills}
                    className="py-1 px-2.5 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-lg text-[10px] font-bold text-slate-500 dark:text-slate-400 cursor-pointer self-start sm:self-auto"
                  >
                    🔄 Segarkan Tagihan
                  </button>
                </div>

                {/* Top Alert Banner if any bill is rejected */}
                {(() => {
                  const rejectedBills = (iplBills || []).filter(b => 
                    b.latest_payment_status === 'rejected' || b.status === 'rejected' || Boolean(b.latest_reject_reason || b.reject_reason)
                  );
                  if (rejectedBills.length === 0) return null;
                  return (
                    <div className="p-4 bg-rose-500/10 border-2 border-rose-500/30 rounded-2xl space-y-2.5 animate-fade-in text-xs font-sans">
                      <div className="flex items-center gap-2 font-black text-rose-600 dark:text-rose-400">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>Perhatian: Terdapat {rejectedBills.length} Bukti Pembayaran IPL yang Ditolak oleh Bendahara!</span>
                      </div>
                      <div className="space-y-2">
                        {rejectedBills.map(rb => {
                          const rReason = rb.latest_reject_reason || rb.reject_reason || rb.rejection_reason || rb.reason || 'Foto bukti transfer buram / nominal kurang';
                          return (
                            <div key={rb.id} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs">
                              <div>
                                <span className="font-extrabold text-slate-800 dark:text-slate-100">{rb.period_title || 'IPL Bulanan'}</span>
                                <p className="text-rose-600 dark:text-rose-400 text-[11px] font-semibold mt-0.5">
                                  💬 <strong>Alasan Penolakan:</strong> "{rReason}"
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedBillIds([rb.id]);
                                  setPaymentType('ipl');
                                  setActiveTab('iuran_upload');
                                }}
                                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0 self-end sm:self-auto"
                              >
                                Upload Ulang Bukti Bayar ↗
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                
{/* Banner Rekening Resmi Kas RT */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/20 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Rekening Resmi Pembayaran IPL</span>
                    <p className="font-mono text-base font-black text-slate-800 dark:text-slate-100">Bank Mandiri: 157-00-98234-04-1</p>
                    <p className="text-xs text-slate-500 font-semibold">a.n. KAS RT 05 SAWANGAN GREEN PARK</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('1570098234041');
                      Swal.fire({ title: 'Disalin!', text: 'Nomor rekening Bank Mandiri berhasil disalin ke clipboard.', icon: 'success', timer: 1500, showConfirmButton: false });
                    }}
                    className="py-1.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-all"
                  >
                    📋 Salin Rekening
                  </button>
                </div>

                {/* Summary Stat Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Tagihan Belum Dibayar</span>
                    <div className="text-xl font-black text-rose-500">{payableBills.length} Periode</div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Nominal Yang Harus Disetor</span>
                    <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">{formatRupiah(totalUnpaidAmount)}</div>
                  </div>
                </div>

                {/* Quick Pay CTA Button */}
                {payableBills.length > 0 && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="text-xs text-amber-800 dark:text-amber-300 font-semibold">
                      ⚠️ Anda memiliki {payableBills.length} tagihan IPL yang belum lunas. Silakan lakukan pembayaran dan upload bukti transfer.
                    </div>
                    <button
                      onClick={() => {
                        setSelectedBillIds(payableBills.map(b => b.id));
                        setPaymentType('ipl');
                        setActiveTab('iuran_upload');
                      }}
                      className="py-2 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-md flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <span>Bayar Sekarang (Upload Bukti)</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Bills Table */}
                {isLoadingIplBills ? (
                  <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-slate-400 font-bold">Memuat tagihan IPL keluarga...</p>
                  </div>
                ) : iplBillsError ? (
                  <div className="p-6 text-center text-xs text-rose-500 font-bold border border-rose-500/20 bg-rose-500/5 rounded-2xl">
                    {iplBillsError}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">Daftar Tagihan IPL Keluarga Anda</h4>
                    <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50/70 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-400 text-[10px] tracking-wider">
                            <th className="p-3.5">Periode Tagihan</th>
                            <th className="p-3.5">Jatuh Tempo</th>
                            <th className="p-3.5">Nominal</th>
                            <th className="p-3.5 text-center">Status</th>
                            <th className="p-3.5 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {iplBills.map((b) => {
                            const isPaid = b.status === 'paid';
                            const isWaiting = b.status === 'waiting_verification';
                            const isExempt = b.status === 'exempt';
                            const isOverdue = b.status === 'overdue';

                            return (
                              <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                                <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                                  {b.period_title || `IPL Bulan ${b.period_month}/${b.period_year}`}
                                </td>
                                <td className="p-3.5 text-slate-500 font-mono">
                                  {b.due_date ? formatDateIndo(b.due_date) : '-'}
                                </td>
                                <td className="p-3.5 font-black font-mono text-emerald-600 dark:text-emerald-400">
                                  {formatRupiah(b.amount)}
                                </td>
                                <td className="p-3.5 text-center">
                                  <span className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded-full uppercase ${
                                    isPaid ? 'bg-emerald-500/10 text-emerald-600' :
                                    isWaiting ? 'bg-amber-500/10 text-amber-600' :
                                    isExempt ? 'bg-purple-500/10 text-purple-600' :
                                    isOverdue ? 'bg-rose-500/10 text-rose-600' :
                                    'bg-rose-500/10 text-rose-500'
                                  }`}>
                                    {b.status || 'unpaid'}
                                  </span>
                                </td>
                                <td className="p-3.5 text-right">
                                  {!isPaid && !isWaiting && !isExempt ? (
                                    <button
                                      onClick={() => {
                                        setSelectedBillIds([b.id]);
                                        setPaymentType('ipl');
                                        setActiveTab('iuran_upload');
                                      }}
                                      className="py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
                                    >
                                      Bayar
                                    </button>
                                  ) : isWaiting ? (
                                    <span className="text-[10px] text-amber-500 font-bold italic">Menunggu Verifikasi</span>
                                  ) : isExempt ? (
                                    <span className="text-[10px] text-purple-400 font-bold italic">Dibebaskan</span>
                                  ) : (
                                    <span className="text-[10px] text-emerald-500 font-bold">Lunas ✓</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          {iplBills.length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                                Belum ada tagihan IPL yang diterbitkan untuk keluarga Anda.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB 7: Iuran -> Riwayat Pembayaran */}
          {activeTab === 'iuran_riwayat' && (() => {
            const iplPaymentsList = (Array.isArray(wargaPayments?.ipl) && wargaPayments.ipl.length > 0)
              ? wargaPayments.ipl
              : (Array.isArray(iplBills) ? iplBills : []);
            const kasPaymentsList = Array.isArray(wargaPayments?.kas) ? wargaPayments.kas : [];

            return (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
                
                {/* Header */}
                <div className="border-b border-slate-200/60 dark:border-slate-800 pb-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Riwayat Setoran Uang Saya</h3>
                    <p className="text-xs text-slate-400">Bukti catatan pembayaran iuran bulanan (IPL) dan kas sosial keluarga Anda.</p>
                  </div>
                  <button
                    onClick={() => {
                      fetchWargaPayments();
                      fetchIplBills();
                    }}
                    className="py-1 px-2.5 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-lg text-[10px] font-bold text-slate-500 dark:text-slate-400 cursor-pointer"
                  >
                    🔄 Segarkan
                  </button>
                </div>

                {isLoadingPayments ? (
                  <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-bold text-slate-500">Memuat riwayat pembayaran...</p>
                  </div>
                ) : paymentsError ? (
                  <div className="p-8 text-center text-xs text-rose-500 font-bold border border-rose-500/20 bg-rose-500/5 rounded-2xl">
                    {paymentsError}
                  </div>
                ) : (
                  <div className="space-y-8">
                    
                    {/* 1. IPL History Table */}
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider block mb-3 font-sans">
                        1. Tagihan & Pembayaran IPL
                      </h4>
                      <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                        <table className="w-full text-left text-xs border-collapse font-sans">
                          <thead>
                            <tr className="bg-slate-50/70 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider text-[10px]">
                              <th className="p-4">Periode Tagihan</th>
                              <th className="p-4">Tanggal / Jatuh Tempo</th>
                              <th className="p-4 text-center">Status Pembayaran</th>
                              <th className="p-4 text-right">Nominal</th>
                              <th className="p-4 text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {iplPaymentsList.map((t) => {
                              const s = String(t.status || t.display_status || '').toLowerCase();
                              const isRejected = t.latest_payment_status === 'rejected' || s === 'rejected' || s === 'ditolak' || s === 'gagal' || Boolean(t.latest_reject_reason || t.reject_reason);
                              const isPaid = s === 'paid' || s === 'lunas' || s === 'approved' || s === 'diterima';
                              const isPending = s === 'waiting_verification' || s === 'pending' || s === 'menunggu_verifikasi';
                              const reasonText = t.latest_reject_reason || t.reject_reason || t.rejection_reason || t.rejectReason || t.reason || t.alasan_penolakan || t.notes || t.keterangan || 'Foto bukti transfer buram dan nominal tidak terbaca jelas';

                              return (
                                <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                                  <td className="p-4">
                                    <span className="font-bold text-slate-850 dark:text-white block text-xs">
                                      {t.period_title || `IPL Bulan ${t.month || ''} ${t.year || ''}`}
                                    </span>
                                  </td>
                                  <td className="p-4 text-slate-500 font-mono text-xs">
                                    {t.due_date ? formatDateIndo(t.due_date) : (t.payment_date ? formatDateIndo(t.payment_date) : '-')}
                                  </td>
                                  <td className="p-4 text-center">
                                    <div className="flex flex-col items-center gap-1">
                                      <span className={`px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider border ${
                                        isPaid ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' :
                                        isRejected ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/40' :
                                        isPending ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' :
                                        'bg-slate-500/10 text-slate-500 border-slate-500/30'
                                      }`}>
                                        {isRejected ? 'Ditolak' : (isPaid ? 'Lunas' : (isPending ? 'Menunggu Verifikasi' : (t.display_status || t.status)))}
                                      </span>
                                      {isRejected && (
                                        <span className="text-[10px] text-rose-500 font-medium italic max-w-[200px] text-center" title={reasonText}>
                                          Alasan: "{reasonText}"
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className={`p-4 text-right font-black font-mono text-xs ${
                                    isRejected ? 'text-rose-500 line-through' : 'text-emerald-600 dark:text-emerald-400'
                                  }`}>
                                    {formatRupiah(t.amount)}
                                  </td>
                                  <td className="p-4 text-right font-sans">
                                    {isRejected ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (t.bill_ids && t.bill_ids.length > 0) {
                                            setSelectedBillIds(t.bill_ids);
                                          } else if (t.bill_id) {
                                            setSelectedBillIds([t.bill_id]);
                                          } else if (t.id) {
                                            setSelectedBillIds([t.id]);
                                          }
                                          setPaymentType('ipl');
                                          setActiveTab('iuran_upload');
                                        }}
                                        className="py-1 px-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                                      >
                                        Bayar Ulang ↗
                                      </button>
                                    ) : (
                                      <span className="text-[10px] text-slate-400">-</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                            {iplPaymentsList.length === 0 && (
                              <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-400 font-bold italic">
                                  Belum ada riwayat pembayaran IPL.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* 2. KAS History Table */}
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider block mb-3 font-sans">
                        2. Sumbangan & Kas Insidental
                      </h4>
                      <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                        <table className="w-full text-left text-xs border-collapse font-sans">
                          <thead>
                            <tr className="bg-slate-50/70 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider text-[10px]">
                              <th className="p-4">Kategori / Keterangan</th>
                              <th className="p-4">Tanggal</th>
                              <th className="p-4 text-center">Status Pembayaran</th>
                              <th className="p-4 text-right">Jumlah Setor</th>
                              <th className="p-4 text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {kasPaymentsList.map((t) => {
                              const s = String(t.status || '').toLowerCase();
                              const isRejected = s === 'rejected' || s === 'ditolak' || s === 'gagal';
                              const isPaid = s === 'approved' || s === 'diterima' || s === 'paid' || s === 'lunas';
                              const isPending = s === 'pending' || s === 'waiting_verification';
                              const reasonText = t.reject_reason || t.rejection_reason || t.rejectReason || t.reason || t.alasan_penolakan || t.notes || t.keterangan || 'Bukti tidak valid';

                              return (
                                <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                                  <td className="p-4 space-y-0.5">
                                    <span className="font-bold text-slate-850 dark:text-slate-200 block capitalize text-xs">
                                      {t.category}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block italic">
                                      "{t.description}"
                                    </span>
                                  </td>
                                  <td className="p-4 text-slate-500 font-mono text-xs">
                                    {t.created_at ? formatDateIndo(t.created_at) : (t.payment_date ? formatDateIndo(t.payment_date) : '-')}
                                  </td>
                                  <td className="p-4 text-center">
                                    <div className="flex flex-col items-center gap-1">
                                      <span className={`px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider border ${
                                        isPaid ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/30' :
                                        isRejected ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/40' :
                                        'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                      }`}>
                                        {isRejected ? 'Ditolak' : (isPaid ? 'Diterima' : 'Menunggu Verifikasi')}
                                      </span>
                                      {isRejected && (
                                        <span className="text-[10px] text-rose-500 font-medium italic max-w-[200px] text-center" title={reasonText}>
                                          Alasan: "{reasonText}"
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className={`p-4 text-right font-black font-mono text-xs ${
                                    isRejected ? 'text-rose-500 line-through' : 'text-emerald-600 dark:text-emerald-400'
                                  }`}>
                                    +{formatRupiah(t.amount)}
                                  </td>
                                  <td className="p-4 text-right font-sans">
                                    {isRejected ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPaymentType('kas');
                                          setActiveTab('iuran_upload');
                                        }}
                                        className="py-1 px-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                                      >
                                        Setor Ulang ↗
                                      </button>
                                    ) : (
                                      <span className="text-[10px] text-slate-400">-</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                            {kasPaymentsList.length === 0 && (
                              <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-400 font-bold italic">
                                  Belum ada riwayat pembayaran Kas.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })()}

{/* TAB 8: Iuran -> Upload Bukti Bayar */}
          {activeTab === 'iuran_upload' && (() => {
            const payableBills = (iplBills || []).filter(b => {
              const s = String(b.status || '').toLowerCase();
              return s !== 'paid' && s !== 'lunas' && s !== 'waiting_verification' && s !== 'menunggu_verifikasi' && s !== 'exempt';
            });
            const selectedBills = (iplBills || []).filter(b => selectedBillIds.includes(b.id));
            const calculatedAmount = selectedBills.reduce((acc, b) => acc + Number(b.amount || 0), 0);

            return (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
                <div className="border-b border-slate-200/60 dark:border-slate-800 pb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Kirim Bukti Transaksi Iuran / Kas</h3>
                  <p className="text-xs text-slate-400">Setor laporan pembayaran IPL bulanan (mendukung rapel) atau iuran kas insidental.</p>
                </div>

                {/* Type Switcher */}
                <div className="flex gap-4 p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl max-w-sm text-xs font-bold font-sans">
                  <button
                    type="button"
                    onClick={() => setPaymentType('ipl')}
                    className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                      paymentType === 'ipl' 
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-white shadow-xs' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    IPL (Iuran Bulanan)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType('kas')}
                    className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                      paymentType === 'kas' 
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-white shadow-xs' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Uang Kas (Insidental)
                  </button>
                </div>

                <form onSubmit={handleAdvancedPaymentSubmit} className="max-w-xl space-y-5 text-xs sm:text-sm font-sans">
                  
                  {paymentType === 'ipl' ? (
                    /* IPL FORM FIELDS (RAPEL SUPPORTED) */
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="font-bold text-slate-655 dark:text-slate-350">Pilih Tagihan IPL Yang Ingin Dibayar (Bisa Rapel) *</label>
                          {payableBills.length > 0 && (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedBillIds(payableBills.map(b => b.id))}
                                className="text-[10px] text-emerald-500 hover:underline font-bold"
                              >
                                Pilih Semua
                              </button>
                              <span className="text-slate-300">|</span>
                              <button
                                type="button"
                                onClick={() => setSelectedBillIds([])}
                                className="text-[10px] text-slate-400 hover:underline font-bold"
                              >
                                Batal Pilih
                              </button>
                            </div>
                          )}
                        </div>

                        {payableBills.length === 0 ? (
                          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                            🎉 Tidak ada tagihan IPL yang belum dibayar saat ini. Semua tagihan sudah lunas atau sedang menunggu verifikasi Bendahara.
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                            {payableBills.map((b) => {
                              const isChecked = selectedBillIds.includes(b.id);
                              return (
                                <div
                                  key={b.id}
                                  onClick={() => {
                                    if (isChecked) {
                                      setSelectedBillIds(selectedBillIds.filter(id => id !== b.id));
                                    } else {
                                      setSelectedBillIds([...selectedBillIds, b.id]);
                                    }
                                  }}
                                  className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                                    isChecked
                                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
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
                                        {b.period_title || `IPL Bulan ${b.period_month}/${b.period_year}`}
                                      </p>
                                      <p className="text-[10px] text-slate-400">
                                        Jatuh Tempo: {b.due_date ? formatDateIndo(b.due_date) : '-'}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right font-mono font-bold text-xs text-slate-900 dark:text-white">
                                    {formatRupiah(b.amount)}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-600 dark:text-slate-400">Total Nominal Pembayaran</label>
                        <div className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono text-sm font-black flex items-center justify-between">
                          <span>{formatRupiah(calculatedAmount)}</span>
                          <span className="text-[10px] font-sans text-slate-400 font-normal">
                            ({selectedBillIds.length} tagihan dipilih)
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">Akumulasi otomatis sesuai tagihan yang dipilih di atas.</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-600 dark:text-slate-400">Berkas Bukti Transfer Bank (.jpg, .png, .pdf) *</label>
                        <input
                          type="file"
                          required
                          ref={fileInputRef}
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={(e) => setIplPaymentForm({ ...iplPaymentForm, file: e.target.files[0] })}
                          className="hidden"
                        />
                        <div
                          onClick={() => fileInputRef.current && fileInputRef.current.click()}
                          className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 hover:bg-slate-100/50 dark:hover:bg-slate-900/20 transition-all cursor-pointer"
                        >
                          <Upload className="w-8 h-8 text-slate-450 animate-pulse-slow" />
                          <span className="font-bold text-xs text-slate-700 dark:text-slate-300">
                            {iplPaymentForm.file ? `Terpilih: ${iplPaymentForm.file.name}` : 'Pilih berkas struk transfer pembayaran...'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-sans">Mendukung JPG, PNG, PDF (Maks 5MB)</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* KAS FORM FIELDS */
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-655 dark:text-slate-350">Kategori Kas RT *</label>
                          <select
                            value={kasPaymentForm.category}
                            onChange={(e) => setKasPaymentForm({ ...kasPaymentForm, category: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold"
                          >
                            <option value="sosial">Kas Sosial / Santunan</option>
                            <option value="kematian">Kas Kematian / Takziah</option>
                            <option value="kegiatan">Iuran Kegiatan RT</option>
                            <option value="lainnya">Kas Lainnya</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-655 dark:text-slate-350">Nominal Transfer (Rp) *</label>
                          <input
                            required
                            type="number"
                            placeholder="Contoh: 50000"
                            value={kasPaymentForm.amount}
                            onChange={(e) => setKasPaymentForm({ ...kasPaymentForm, amount: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-mono text-sm font-semibold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-655 dark:text-slate-350">Pilih Agenda / Kegiatan *</label>
                          <select
                            value={kasPaymentForm.activitySelect}
                            onChange={(e) => setKasPaymentForm({ ...kasPaymentForm, activitySelect: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold"
                          >
                            <option value="Santunan Warga Sakit / Wafat">Santunan Warga Sakit / Wafat</option>
                            <option value="Iuran HUT RI 17 Agustus">Iuran HUT RI 17 Agustus</option>
                            <option value="Kerja Bakti Musala / Masjid">Kerja Bakti Musala / Masjid</option>
                            <option value="Donasi Pembangunan Lingkungan">Donasi Pembangunan Lingkungan</option>
                            <option value="Lainnya (Input Manual)">Lainnya (Input Manual)</option>
                          </select>
                        </div>

                        {kasPaymentForm.activitySelect === 'Lainnya (Input Manual)' && (
                          <div className="space-y-1.5">
                            <label className="font-bold text-slate-655 dark:text-slate-350">Tulis Nama Kegiatan Baru *</label>
                            <input
                              required
                              type="text"
                              placeholder="Contoh: Iuran Buka Bersama..."
                              value={kasPaymentForm.customDescription}
                              onChange={(e) => setKasPaymentForm({ ...kasPaymentForm, customDescription: e.target.value })}
                              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold"
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-605 dark:text-slate-400">Bukti Transfer Struk *</label>
                        <input
                          type="file"
                          required
                          ref={fileInputRef}
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={(e) => setKasPaymentForm({ ...kasPaymentForm, file: e.target.files[0] })}
                          className="hidden"
                        />
                        <div
                          onClick={() => fileInputRef.current && fileInputRef.current.click()}
                          className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 hover:bg-slate-100/50 dark:hover:bg-slate-900/20 transition-all cursor-pointer"
                        >
                          <Upload className="w-8 h-8 text-slate-450 animate-pulse-slow" />
                          <span className="font-bold text-xs text-slate-700 dark:text-slate-300">
                            {kasPaymentForm.file ? `Terpilih: ${kasPaymentForm.file.name}` : 'Pilih berkas struk transfer pembayaran...'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-sans">Mendukung format JPG, PNG, atau PDF (Maks 5MB)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs font-semibold">
                      {paymentError}
                    </div>
                  )}

                  {paymentSuccess && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450 rounded-xl text-xs font-semibold">
                      {paymentSuccess}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmittingPayment || (paymentType === 'ipl' && selectedBillIds.length === 0)}
                      className="py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-extrabold rounded-xl hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-md disabled:opacity-50"
                    >
                      {isSubmittingPayment ? 'Mengirim Data...' : 'Kirim Bukti Pembayaran'}
                    </button>
                  </div>
                </form>
              </div>
            );
          })()}

          {/* TAB 9: Layanan Surat -> Ajukan Surat */}
          {(activeTab === 'layanan_ajukan' || activeTab === 'surat_pengajuan') && (
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

                <div className="space-y-2">
                  <span className="font-bold text-slate-600 dark:text-slate-400 text-xs block">Pilih Template Keperluan Cepat (Opsional)</span>
                  <div className="flex flex-wrap gap-2">
                    {getTemplatesForType(letterForm.tipeSurat).map((tmpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setLetterForm({ ...letterForm, keperluan: tmpl.text })}
                        className="px-3 py-2 bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/40 text-slate-750 dark:text-slate-350 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200/60 dark:border-slate-800 hover:border-emerald-500/80 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                      >
                        {tmpl.label}
                      </button>
                    ))}
                  </div>
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
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 font-sans flex gap-2">
                            <button
                              onClick={() => setViewingApprovedLetter(sub)}
                              className="flex-1 py-2 border border-emerald-500 text-emerald-600 dark:text-emerald-450 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 font-extrabold text-[10px] rounded-xl transition-all cursor-pointer text-center block"
                            >
                              Pratinjau Kop Surat
                            </button>
                            <button
                              onClick={() => {
                                alert(`Mengunduh berkas ${sub.wargaTipeSurat} untuk keperluan: ${sub.wargaKeperluan}. (Simulasi berkas PDF RT berhasil diunduh)`);
                              }}
                              className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-extrabold text-[10px] rounded-xl transition-all cursor-pointer text-center block shadow-xs"
                            >
                              Unduh Format
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
                <p className="text-xs text-slate-400">Saluran aspirasi dan pengaduan darurat lingkungan sekitar warga RT 05.</p>
              </div>

              <form onSubmit={handleComplaintSubmit} className="max-w-xl space-y-4 text-xs sm:text-sm font-sans">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-350">Kategori Laporan *</label>
                  <select
                    value={pengaduanForm.category}
                    onChange={(e) => setPengaduanForm({ ...pengaduanForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-205 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold text-xs"
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
                        <th className="p-4">ID Laporan</th>
                        <th className="p-4">Kategori Laporan</th>
                        <th className="p-4">Deskripsi Masalah / Keperluan</th>
                        <th className="p-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {pengaduanList.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                          <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                            #ADU-{p.id}
                          </td>
                          <td className="p-4 font-bold text-slate-700 dark:text-slate-300">{p.jenis}</td>
                          <td className="p-4 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={p.keperluan}>{p.keperluan}</td>
                          <td className="p-4 text-center font-sans">
                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] capitalize inline-block ${
                              p.status === 'disetujui' 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                : p.status === 'ditolak'
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-450'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {pengaduanList.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-450 italic font-bold">
                            Belum ada riwayat pengaduan terdaftar.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Upload Berkas Kependudukan Mandiri */}
          {activeTab === 'warga_upload_berkas' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-8 animate-fade-in font-sans">
              
              {/* Section Header */}
              <div className="border-b border-slate-200/60 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                      <Upload className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Upload Berkas Kependudukan Mandiri</h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    Unggah dokumen resmi (KTP, KK, KIA, Akta, SKCK) untuk verifikasi data kependudukan oleh Pengurus RT.
                  </p>
                </div>
                <span className="px-3.5 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-extrabold text-xs rounded-full shadow-xs w-fit">
                  🔒 Enkripsi Aman & Terarah
                </span>
              </div>

              {/* Upload Form & Instructions */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                <form onSubmit={handleUploadDocument} className="lg:col-span-6 space-y-5 bg-slate-50/70 dark:bg-slate-950/40 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider block mb-1">
                    Formulir Unggah Dokumen Baru
                  </h4>

                  {/* Member Selector */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-xs text-slate-700 dark:text-slate-300">Pilih Anggota Keluarga Pemilik Berkas *</label>
                    <select
                      value={selectedResidentForDoc ? (selectedResidentForDoc.warga_id || selectedResidentForDoc.id) : ''}
                      onChange={(e) => {
                        const targetId = parseInt(e.target.value);
                        const found = familyMembers.find(m => (m.warga_id || m.id) === targetId) || currentUser;
                        setSelectedResidentForDoc(found);
                      }}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-semibold text-xs"
                    >
                      <option value={currentUser.id}>{currentUser.name} (Saya - Kepala Keluarga)</option>
                      {familyMembers.map((m) => (
                        <option key={m.id || m.warga_id} value={m.warga_id || m.id}>
                          {m.nama} ({m.hubungan_keluarga || m.jenis_kelamin})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Document Category Selector */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-xs text-slate-700 dark:text-slate-300">Pilih Jenis Dokumen Kependudukan *</label>
                    <select
                      value={docUploadType}
                      onChange={(e) => setDocUploadType(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold text-xs"
                    >
                      <option value="ktp">🪪 Kartu Tanda Penduduk (KTP)</option>
                      <option value="kk">📄 Kartu Keluarga (KK)</option>
                      <option value="kia">👶 Kartu Identitas Anak (KIA)</option>
                      <option value="akta">📜 Akta Kelahiran / Akta Nikah</option>
                      <option value="domisili">📑 Surat Pindah / Ket. Domisili</option>
                      <option value="skck">👮 Pengantar SKCK / Kelakuan Baik</option>
                      <option value="lainnya">📦 Dokumen Pendukung Lainnya</option>
                    </select>
                  </div>

                  {/* File Drag & Drop Box */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-xs text-slate-700 dark:text-slate-300">Pilih Berkas File (.jpg, .png, .pdf) *</label>
                    <input
                      type="file"
                      required
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => {
                        const f = e.target.files[0];
                        if (f && f.size > 5 * 1024 * 1024) {
                          alert('Ukuran berkas file terlalu besar! Maksimal ukuran file adalah 5MB.');
                          e.target.value = '';
                          return;
                        }
                        setDocUploadFile(f);
                      }}
                      className="hidden"
                      id="warga-doc-file-input"
                    />
                    <label
                      htmlFor="warga-doc-file-input"
                      className="p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 bg-white dark:bg-slate-900 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all cursor-pointer block"
                    >
                      <Upload className="w-8 h-8 text-emerald-500 animate-pulse" />
                      <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                        {docUploadFile ? `Terpilih: ${docUploadFile.name}` : 'Klik untuk memilih file dokumen...'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">Format didukung: JPG, PNG, atau PDF (Maksimal 5MB)</span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isUploadingDoc || !docUploadFile}
                    className="w-full py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isUploadingDoc ? (
                      <span>Mengunggah Berkas...</span>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Unggah Dokumen Mandiri</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Information Card & Requirement Guidelines */}
                <div className="lg:col-span-6 space-y-5">
                  <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-3">
                    <h4 className="font-extrabold text-xs text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                      <span>💡</span> Panduan Pengunggahan Berkas Kependudukan
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">1.</span>
                        <span>Pastikan hasil foto/scan dokumen terlihat jelas, tidak buram, dan teks dapat terbaca dengan baik.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">2.</span>
                        <span>Berkas yang diunggah akan tersimpan dengan enkripsi dan hanya dapat diakses oleh Pengurus RT & Sekretaris.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">3.</span>
                        <span>Pengurus RT menggunakan berkas ini untuk mempercepat verifikasi surat pengantar mandiri warga.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Quick Stats Badges */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Dokumen Terunggah</span>
                      <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                        {wargaDocuments.length}
                      </span>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Akses</span>
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-2 block">
                        Terverifikasi RT
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Table of Uploaded Documents */}
              <div className="pt-6 border-t border-slate-200/60 dark:border-slate-800">
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider block mb-4">
                  Daftar Dokumen Kependudukan Terunggah Saya
                </h4>

                {wargaDocuments.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 dark:text-slate-500 font-bold italic text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    Belum ada berkas kependudukan yang diunggah. Silakan unggah berkas KTP atau KK Anda melalui formulir di atas.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider">
                          <th className="p-4">Jenis Dokumen</th>
                          <th className="p-4">Pemilik Berkas</th>
                          <th className="p-4">Nama Berkas File</th>
                          <th className="p-4">Tanggal Unggah</th>
                          <th className="p-4 text-right">Aksi & Unduh</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {wargaDocuments.map((doc) => (
                          <tr key={doc.document_id || doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                            <td className="p-4">
                              <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-extrabold uppercase">
                                {doc.type || 'Dokumen'}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                              {doc.resident_name || currentUser.name}
                            </td>
                            <td className="p-4 font-mono text-slate-500 truncate max-w-xs" title={doc.file_path}>
                              {doc.file_path || 'dokumen.pdf'}
                            </td>
                            <td className="p-4 font-mono text-slate-400">
                              {doc.upload_date || 'Hari Ini'}
                            </td>
                            <td className="p-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleDownloadDocument(doc.document_id || doc.id, doc.file_path)}
                                className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl font-extrabold text-[11px] transition-all cursor-pointer inline-flex items-center gap-1.5"
                              >
                                <span>📥 Unduh / Lihat</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 12: Dokumen */}
          {activeTab === 'dokumen' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="border-b border-slate-200/60 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Arsip Dokumen Resmi Warga</h3>
                <p className="text-xs text-slate-400">Regulasi dan berkas administrasi RT 05 Sawangan.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 bg-slate-50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800 rounded-3xl space-y-3">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">AD / ART Rukun Tetangga 05</h4>
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

          {/* TAB 12.5: Voting Karyawan Terbaik */}
          {activeTab === 'voting_karyawan' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="border-b border-slate-200/60 dark:border-slate-800 pb-4 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pemilihan Karyawan Terbaik Bulanan</h3>
                  <p className="text-xs text-slate-400">Salurkan hak suara Anda untuk memilih petugas satpam, kebersihan, atau staf pengurus terfavorit.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { fetchKaryawanList(); fetchVoteResults(); }}
                    className="py-1 px-2.5 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-lg text-[10px] font-bold text-slate-550 dark:text-slate-400 cursor-pointer flex items-center gap-1"
                  >
                    <span>🔄 Segarkan</span>
                  </button>
                </div>
              </div>

              {isLoadingVoting ? (
                <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold text-slate-500">Memuat data kandidat...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Candidates List */}
                  <div className="space-y-4">
                    <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider block font-sans">Kandidat Karyawan</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {karyawanList.map((k) => (
                        <div key={k.id} className="p-5 bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 rounded-3xl space-y-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                          <div className="space-y-1">
                            <span className="px-2 py-0.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-lg text-[8px] font-black uppercase tracking-wider">{k.jabatan || k.position}</span>
                            <h5 className="font-black text-sm text-slate-900 dark:text-white pt-1">{k.nama || k.name}</h5>
                            <p className="text-[10px] text-slate-400">Petugas berdedikasi lingkungan komplek RT 05.</p>
                          </div>
                          <button
                            onClick={() => handleCastVote(k.id)}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-transform active:scale-[0.98]"
                          >
                            🗳️ Berikan Suara
                          </button>
                        </div>
                      ))}
                      {karyawanList.length === 0 && (
                        <div className="col-span-2 p-8 text-center text-slate-400 italic text-xs font-bold bg-slate-50 dark:bg-slate-950/30 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                          Tidak ada kandidat karyawan terdaftar saat ini.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Results Counting List */}
                  <div className="space-y-4">
                    <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider block font-sans">Hasil Voting Sementara</h4>
                    <div className="p-5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-850 rounded-3xl space-y-4">
                      {voteResults.map((r) => {
                        const totalVotes = voteResults.reduce((sum, item) => sum + parseInt(item.jumlah_vote || item.vote_count || 0), 0) || 1;
                        const percentage = Math.round((parseInt(r.jumlah_vote || r.vote_count || 0) / totalVotes) * 100);
                        return (
                          <div key={r.id || r.karyawan_id} className="space-y-1.5 font-sans">
                            <div className="flex justify-between items-center text-xs">
                              <div>
                                <span className="font-bold text-slate-800 dark:text-white block">{r.nama || r.name}</span>
                                <span className="text-[9px] text-slate-400 uppercase font-extrabold">{r.jabatan || r.position}</span>
                              </div>
                              <span className="font-black text-slate-900 dark:text-white font-mono">{r.jumlah_vote || r.vote_count || 0} Suara ({percentage}%)</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${percentage}%` }}
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                              />
                            </div>
                          </div>
                        );
                      })}
                      {voteResults.length === 0 && (
                        <div className="p-8 text-center text-slate-400 italic text-xs font-bold">
                          Belum ada suara masuk. Jadilah yang pertama memberikan suara!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 13: Universal Notification Center */}
          {activeTab === 'notifikasi' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              
              {/* Section Header */}
              <div className="border-b border-slate-200/60 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                      <Bell className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pusat Notifikasi & Informasi Warga</h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    Pemberitahuan resmi mengenai tagihan iuran, persetujuan surat pengantar, pengumuman RT, dan status aduan.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAllNotifRead(true);
                      if (setCurrentUser) {
                        const updated = { ...currentUser, tagihNotification: false };
                        setCurrentUser(updated);
                        localStorage.setItem('rt_current_user', JSON.stringify(updated));
                      }
                    }}
                    className="px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <span>✓ Tandai Semua Dibaca</span>
                  </button>
                </div>
              </div>

              {/* Category Filters */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs font-bold font-sans">
                {[
                  { id: 'semua', label: '🔔 Semua' },
                  { id: 'surat', label: '📑 Surat' },
                  { id: 'iuran', label: '💳 Iuran' },
                  { id: 'pengumuman', label: '📢 Pengumuman' },
                  { id: 'pengaduan', label: '🚨 Pengaduan' },
                ].map((flt) => (
                  <button
                    key={flt.id}
                    type="button"
                    onClick={() => setNotifCategoryFilter(flt.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                      notifCategoryFilter === flt.id
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    {flt.label}
                  </button>
                ))}
              </div>

              {/* Notifications Feed List */}
              <div className="space-y-3 pt-2 font-sans">
                {displayNotifications
                  .filter(n => notifCategoryFilter === 'semua' || n.category === notifCategoryFilter)
                  .map((ntf) => (
                    <div
                      key={ntf.id}
                      onClick={() => setActiveTab(ntf.targetTab)}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 flex items-start gap-4 cursor-pointer hover:scale-[1.01] hover:border-emerald-500/50 group ${
                        ntf.isUnread
                          ? 'bg-emerald-500/10 dark:bg-emerald-950/30 border-emerald-500/30 shadow-xs'
                          : 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-800'
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl text-white shrink-0 mt-0.5 shadow-xs ${
                        ntf.category === 'surat'
                          ? 'bg-gradient-to-br from-sky-500 to-blue-600'
                          : ntf.category === 'iuran'
                          ? 'bg-gradient-to-br from-amber-500 to-emerald-600'
                          : ntf.category === 'pengaduan'
                          ? 'bg-gradient-to-br from-rose-500 to-red-600'
                          : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                      }`}>
                        {ntf.category === 'surat' ? (
                          <FileText className="w-4 h-4" />
                        ) : ntf.category === 'iuran' ? (
                          <Wallet className="w-4 h-4" />
                        ) : ntf.category === 'pengaduan' ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-extrabold text-xs text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                            {ntf.title}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            {ntf.time}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                          {ntf.message}
                        </p>
                        <div className="pt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                          <span>Buka Menu Terkait</span>
                          <span>→</span>
                        </div>
                      </div>

                      {ntf.isUnread && (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 animate-ping"></span>
                      )}
                    </div>
                  ))}
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
                    placeholder="Masukkan sandi baru (min 8 karakter)..."
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

        {/* Payment Gateway Modal */}
        {isPgModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full space-y-5 shadow-2xl relative">
              
              {/* Header */}
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💳</span>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">SGP Pay Gateway</h4>
                </div>
                <button 
                  onClick={async () => {
                    if (pgStage !== 'processing') {
                      setIsPgModalOpen(false);
                    } else {
                      const result = await Swal.fire({
                        title: 'Batalkan Transaksi',
                        text: 'Apakah Anda yakin ingin membatalkan transaksi ini?',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#ef4444',
                        cancelButtonColor: '#3b89ff',
                        confirmButtonText: 'Ya, batalkan!',
                        cancelButtonText: 'Kembali'
                      });
                      if (result.isConfirmed) {
                        setIsPgModalOpen(false);
                      }
                    }
                  }} 
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Total Billing Banner */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-2xl text-center">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Total Tagihan Iuran</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-450">Rp 50.000</span>
              </div>

              {/* STAGE 1: SELECT METHOD */}
              {pgStage === 'select_method' && (
                <div className="space-y-4">
                  <p className="text-[11px] text-slate-450 text-center">Silakan pilih metode pembayaran instan Anda:</p>
                  
                  <div className="space-y-2.5 text-xs">
                    {/* QRIS Option */}
                    <button
                      onClick={() => handleSelectPgMethod('qris')}
                      className="w-full p-4 bg-white dark:bg-slate-900 border-2 border-slate-200 hover:border-emerald-500 dark:border-slate-800 dark:hover:border-emerald-500 rounded-2xl flex items-center justify-between cursor-pointer transition-all hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📱</span>
                        <div className="text-left">
                          <span className="font-black text-slate-855 dark:text-white block">QRIS (Otomatis & Instan)</span>
                          <span className="text-[10px] text-slate-400 font-bold">GoPay, OVO, ShopeePay, Dana, M-Banking</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    {/* VA Option */}
                    <div className="space-y-1.5 border border-slate-250 dark:border-slate-800 p-3.5 rounded-2xl">
                      <span className="font-black text-slate-800 dark:text-white block mb-2">Virtual Account (Bank Transfer)</span>
                      <div className="grid grid-cols-3 gap-2">
                        {['BCA', 'Mandiri', 'BRI'].map((bank) => (
                          <button
                            key={bank}
                            onClick={() => {
                              setPgSelectedBank(bank);
                              handleSelectPgMethod('va');
                            }}
                            className="py-2.5 border border-slate-200 hover:border-emerald-500 dark:border-slate-850 rounded-xl font-black text-[10px] text-slate-700 dark:text-slate-350 bg-slate-50 dark:bg-slate-950/20 hover:bg-white cursor-pointer transition-all"
                          >
                            {bank}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE 2: PROCESSING (QRIS & VA SIMULATION) */}
              {pgStage === 'processing' && (
                <div className="space-y-4 text-center">
                  {/* Timer */}
                  <div className="flex items-center justify-center gap-1.5 text-amber-500 font-mono font-bold text-xs bg-amber-500/10 py-1.5 px-3 rounded-full w-fit mx-auto">
                    <span className="animate-pulse">⏳</span>
                    <span>
                      Batas Waktu: {Math.floor(pgTimer / 60)}:{(pgTimer % 60).toString().padStart(2, '0')}
                    </span>
                  </div>

                  {pgMethod === 'qris' ? (
                    <div className="space-y-4 flex flex-col items-center">
                      <p className="text-[11px] text-slate-450 leading-relaxed">Scan QRIS di bawah menggunakan e-wallet atau aplikasi mobile banking Anda.</p>
                      
                      {/* SVG QR Code design */}
                      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                        <svg width="140" height="140" viewBox="0 0 100 100" className="text-slate-850">
                          {/* QR Code mock paths */}
                          <path d="M5,5 h30 v30 h-30 z M15,15 h10 v10 h-10 z" fill="currentColor" />
                          <path d="M65,5 h30 v30 h-30 z M75,15 h10 v10 h-10 z" fill="currentColor" />
                          <path d="M5,65 h30 v30 h-30 z M15,75 h10 v10 h-10 z" fill="currentColor" />
                          {/* Random blocks to look like QR */}
                          <path d="M45,5 h10 v10 h-10 z M45,25 h10 v15 h-10 z M55,15 h5 v20 h-5 z" fill="currentColor" />
                          <path d="M5,45 h20 v5 h-20 z M15,55 h15 v5 h-15 z" fill="currentColor" />
                          <path d="M45,45 h45 v5 h-45 z M75,55 h10 v20 h-10 z" fill="currentColor" />
                          <path d="M50,65 h10 v10 h-10 z M40,80 h25 v5 h-25 z" fill="currentColor" />
                          <path d="M80,80 h15 v15 h-15 z" fill="currentColor" />
                        </svg>
                        <span className="font-extrabold text-[9px] text-slate-400 block tracking-wider uppercase mt-2">SGP QRIS - RT 05</span>
                      </div>

                      <button
                        onClick={handleSimulatePaymentSuccess}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all font-sans font-bold"
                      >
                        <Sparkles className="w-4 h-4 animate-pulse" />
                        <span>Simulasikan Scan & Pembayaran QRIS</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 text-center">
                      <p className="text-[11px] text-slate-450 leading-relaxed font-sans">
                        Silakan bayar menggunakan nomor Virtual Account bank <span className="font-bold text-slate-800 dark:text-white">{pgSelectedBank}</span> berikut:
                      </p>

                      <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-250 dark:border-slate-850 rounded-2xl space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">No. Virtual Account ({pgSelectedBank})</span>
                        <p className="font-mono font-black text-sm text-slate-800 dark:text-white tracking-widest">{pgVaNumber}</p>
                        <button 
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(pgVaNumber);
                            alert('VA Number disalin!');
                          }}
                          className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          📋 Salin Nomor VA
                        </button>
                      </div>

                      <button
                        onClick={handleSimulatePaymentSuccess}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all font-sans font-bold"
                      >
                        <Sparkles className="w-4 h-4 animate-pulse" />
                        <span>Simulasikan Transfer Bank (VA)</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* STAGE 3: SUCCESS RECEIPT */}
              {pgStage === 'success' && (
                <div className="space-y-4 text-center">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-10 h-10 animate-bounce" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-black text-sm text-slate-900 dark:text-white">Pembayaran Sukses!</h4>
                    <p className="text-[10px] text-slate-450">Iuran Anda terverifikasi lunas secara otomatis.</p>
                  </div>

                  {/* Receipt Details */}
                  <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-[10px] text-left space-y-2 font-mono">
                    <div className="flex justify-between border-b border-dashed border-slate-200 dark:border-slate-800 pb-1.5">
                      <span className="text-slate-400 font-sans font-bold">Jenis Iuran:</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">Kas Lingkungan RT</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-200 dark:border-slate-800 pb-1.5">
                      <span className="text-slate-400 font-sans font-bold">Nominal:</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">Rp 50.000</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-200 dark:border-slate-800 pb-1.5">
                      <span className="text-slate-400 font-sans font-bold">Metode:</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">PG - {pgMethod.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans font-bold">Status:</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-450 uppercase">Lunas</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsPgModalOpen(false)}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-850 dark:hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-colors"
                  >
                    Selesai
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

      </main>

      {/* PREVIEW KOP SURAT TEMPLATE MODAL */}
      {viewingApprovedLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setViewingApprovedLetter(null)}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-2xl overflow-hidden z-10 animate-scale-up my-8">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center font-sans">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Pratinjau Surat Resmi RT 05</h3>
              <button onClick={() => setViewingApprovedLetter(null)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
                <span className="font-extrabold text-sm">✕</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh] bg-slate-100 dark:bg-slate-950 flex justify-center p-4 sm:p-8">
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
                      {viewingApprovedLetter.wargaTipeSurat}
                    </h5>
                    <span className="text-[10px] font-bold text-slate-600 tracking-wider">
                      No. {viewingApprovedLetter.id.startsWith('SRT-') ? viewingApprovedLetter.id.replace('SRT-', '102/') : `102/${viewingApprovedLetter.id}`} / RT05-RW06 / VII / 2026
                    </span>
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
                        <td className="font-semibold uppercase tracking-wider">{viewingApprovedLetter.wargaNama || currentUser.name}</td>
                      </tr>
                      <tr>
                        <td className="font-bold">NIK / No. KTP</td>
                        <td>:</td>
                        <td className="font-mono">{viewingApprovedLetter.wargaNik || currentUser.nik}</td>
                      </tr>
                      <tr>
                        <td className="font-bold">Jenis Kelamin</td>
                        <td>:</td>
                        <td>{currentUser.gender || 'Laki-laki'}</td>
                      </tr>
                      <tr>
                        <td className="font-bold">Alamat Lengkap</td>
                        <td>:</td>
                        <td className="leading-snug">
                          {viewingApprovedLetter.wargaAlamat || currentUser.alamat || 'Perumahan Sawangan Green Park, RT 05 RW 06, Kel. Sawangan Baru, Kec. Sawangan, Depok.'}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Purpose Paragraph */}
                  <p className="indent-8 text-slate-800 leading-relaxed text-justify">
                    Adapun nama tersebut di atas adalah benar merupakan warga yang bertempat tinggal di lingkungan RT 05 RW 06 Perumahan Sawangan Green Park. Surat keterangan pengantar ini dibuat sebagai kelengkapan berkas untuk keperluan: <span className="font-bold underline">"{viewingApprovedLetter.wargaKeperluan}"</span>.
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
                    <span className="block">Depok, {formatDateIndo(viewingApprovedLetter.submissionDate || new Date().toISOString().split('T')[0])}</span>
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
                  onClick={() => alert(`Mengunduh berkas surat resmi: ${viewingApprovedLetter.wargaTipeSurat}.docx`)}
                  className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-500/10 flex items-center gap-1.5"
                >
                  <span>Unduh Dokumen</span>
                </button>
                <button
                  onClick={() => setViewingApprovedLetter(null)}
                  className="py-2.5 px-4 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold rounded-xl cursor-pointer"
                >
                  Tutup
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
                        alt={`Foto KTP Asli - ${selectedKtpWarga.nama}`}
                        className="max-h-80 w-auto object-contain rounded-xl shadow-lg border border-slate-800"
                      />
                    ) : (
                      <div className="py-8 text-center space-y-2">
                        <FileText className="w-12 h-12 text-slate-600 mx-auto" />
                        <p className="text-xs text-slate-400 font-semibold">Anda belum mengunggah berkas foto KTP fisik.</p>
                        <span className="text-[10px] text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full inline-block font-bold">Silakan unggah foto KTP fisik pada profil Anda</span>
                      </div>
                    )}
                  </div>
                  {selectedKtpWarga.foto_ktp && (
                    <div className="flex justify-end gap-2">
                      <a
                        href={selectedKtpWarga.foto_ktp}
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
                    <span>{selectedKtpWarga.nik || '3276051508980004'}</span>
                  </div>

                  <div className="grid grid-cols-12 gap-3 text-[11px] items-start">
                    <div className="col-span-8 space-y-1 font-semibold leading-relaxed">
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-4 text-slate-500 dark:text-slate-400 font-bold">Nama</span>
                        <span className="col-span-8 font-black uppercase text-slate-900 dark:text-white truncate">{selectedKtpWarga.nama}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-4 text-slate-500 dark:text-slate-400 font-bold">Tempat/Tgl Lahir</span>
                        <span className="col-span-8 font-bold">{selectedKtpWarga.tgl_lahir || 'DEPOK, 15-08-1998'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-4 text-slate-500 dark:text-slate-400 font-bold">Jenis Kelamin</span>
                        <span className="col-span-8 font-bold">{selectedKtpWarga.jenis_kelamin || 'Laki-laki'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-4 text-slate-500 dark:text-slate-400 font-bold">Alamat</span>
                        <span className="col-span-8 font-bold leading-tight">{selectedKtpWarga.house_alamat || 'Jl. Sawangan Green Park B4/15'}</span>
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
                          src={selectedKtpWarga.foto_ktp || selectedKtpWarga.foto || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'}
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
    </div>
  );
}
