import { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, User, Users, Volume2, Calendar, Phone, Wallet, History, Upload, 
  FileText, Send, AlertTriangle, FolderOpen, Bell, Settings, 
  CheckCircle2, AlertCircle, Trash2, Eye, EyeOff, Lock, 
  Landmark, LogOut, Sun, Moon, Sparkles, ChevronDown, ChevronRight, X, Edit2, Save,
  Loader2, Search
} from 'lucide-react';
import Swal from 'sweetalert2';
import { io } from 'socket.io-client';
import DateInput from './DateInput';

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
    try {
      const saved = localStorage.getItem('rt_warga_bukti_bayar');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn('localStorage is blocked or unavailable:', e);
      return [];
    }
  });
  const [paymentType, setPaymentType] = useState('ipl'); // 'ipl' | 'kas'
  const [iplForm, setIplForm] = useState({ months: [], year: 2026, file: null });
  const [kasForm, setKasForm] = useState({ amount: '', category: 'sosial', description: '', file: null });
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Complaint States
  const [pengaduanList, setPengaduanList] = useState(() => {
    try {
      const saved = localStorage.getItem('rt_warga_pengaduan_list');
      return saved ? JSON.parse(saved) : [
        { id: 'COM-101', date: '2026-07-01', category: 'Keamanan', description: 'Lampu penerangan jalan dekat gapura padam, mohon ditinjau.', status: 'Selesai' }
      ];
    } catch (e) {
      console.warn('localStorage is blocked or unavailable:', e);
      return [
        { id: 'COM-101', date: '2026-07-01', category: 'Keamanan', description: 'Lampu penerangan jalan dekat gapura padam, mohon ditinjau.', status: 'Selesai' }
      ];
    }
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
  const [uploadedDocsList, setUploadedDocsList] = useState(() => {
    try {
      const saved = localStorage.getItem('rt_uploaded_docs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn('localStorage is blocked or unavailable:', e);
      return [];
    }
  });

  // Socket.IO for real-time updates
  useEffect(() => {
    let token = null;
    try {
      token = localStorage.getItem('rt_token');
    } catch (e) {
      console.warn('localStorage is blocked or unavailable:', e);
    }
    if (!token) return;

    const socketConnection = io('http://172.20.32.62:3333', {
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
      Swal.fire({
        title: 'Pembaruan Pembayaran!',
        text: `Bukti transfer iuran ${data.type === 'ipl' ? 'IPL' : 'Uang Kas'} Anda telah di-update menjadi: ${data.status === 'diterima' ? 'DISETUJUI' : 'DITOLAK'}.`,
        icon: data.status === 'diterima' ? 'success' : 'error',
        confirmButtonColor: '#10b981'
      });
    });

    socketConnection.on('sync', (data) => {
      console.log(`⚡ Menerima request sinkronisasi di ProfilWarga untuk: ${data.type}`);
      if (data.type === 'finance') {
        fetchWargaPayments();
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
  const [iplPaymentForm, setIplPaymentForm] = useState({
    year: new Date().getFullYear(),
    months: [], // e.g. [7] for Juli
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
  const [wargaDocuments, setWargaDocuments] = useState(() => {
    try {
      const saved = localStorage.getItem('rt_warga_documents');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn('localStorage is blocked or unavailable:', e);
      return [];
    }
  });
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedResidentForDoc, setSelectedResidentForDoc] = useState(null);
  const [docUploadType, setDocUploadType] = useState('ktp');
  const [docUploadFile, setDocUploadFile] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem('rt_warga_documents', JSON.stringify(wargaDocuments));
    } catch (e) {}
  }, [wargaDocuments]);

  // Voting Karyawan Terbaik States
  const [karyawanList, setKaryawanList] = useState([]);
  const [voteResults, setVoteResults] = useState([]);
  const [isLoadingVoting, setIsLoadingVoting] = useState(false);
  const [votingError, setVotingError] = useState('');

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
      const response = await fetch(`http://172.20.32.62:3333/resident/getmyfamily/${famId}`, {
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
      const response = await fetch('http://172.20.32.62:3333/resident/pengaduan', {
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
      const res = await fetch('http://172.20.32.62:3333/resident/announcement', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWargaAnnouncements(parseArrayResponse(data));
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
      const response = await fetch('http://172.20.32.62:3333/resident/pengajuan', {
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
      const response = await fetch('http://172.20.32.62:3333/resident/my-payments', {
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

  useEffect(() => {
    fetchFamilyMembers();
    fetchCitizenComplaints();
    fetchWargaAnnouncements();
    fetchCitizenSubmissions();
    fetchWargaPayments();
    if (activeTab === 'voting_karyawan') {
      fetchKaryawanList();
      fetchVoteResults();
    }
    if (activeTab === 'informasi_jadwal' && fetchAgendas) {
      fetchAgendas();
    }
  }, [activeTab]);

  // Save changes helper
  useEffect(() => {
    localStorage.setItem('rt_warga_bukti_bayar', JSON.stringify(buktiBayarList));
  }, [buktiBayarList]);

  useEffect(() => {
    localStorage.setItem('rt_warga_pengaduan_list', JSON.stringify(pengaduanList));
  }, [pengaduanList]);

  useEffect(() => {
    if (currentUser) {
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
        status: currentUser.status || prev.status
      }));
    }
  }, [currentUser]);

  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
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
      const response = await fetch('http://172.20.32.62:3333/resident/pengajuan', {
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

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('rt_token');
    if (!token) {
      alert('Token tidak ditemukan. Harap login kembali.');
      return;
    }

    setIsSubmittingPayment(true);

    try {
      if (paymentType === 'ipl') {
        if (iplForm.months.length === 0) {
          alert('Silakan pilih minimal satu bulan iuran IPL yang ingin dibayar.');
          setIsSubmittingPayment(false);
          return;
        }
        if (!iplForm.file) {
          alert('Silakan unggah berkas bukti transfer.');
          setIsSubmittingPayment(false);
          return;
        }

        const formData = new FormData();
        formData.append('months', JSON.stringify(iplForm.months));
        formData.append('year', iplForm.year);
        formData.append('amount', iplForm.months.length * 200000);
        formData.append('file', iplForm.file);

        console.log('--- WARGA: Sending pay-ipl ---');
        console.log('Target URL/Endpoint: POST http://172.20.32.62:3333/resident/pay-ipl');
        console.log('Payload months:', JSON.stringify(iplForm.months));
        console.log('Payload year:', iplForm.year);
        console.log('Payload amount:', iplForm.months.length * 200000);
        console.log('Payload file name:', iplForm.file ? iplForm.file.name : 'None');

        const response = await fetch('http://172.20.32.62:3333/resident/pay-ipl', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        console.log('Response pay-ipl status:', response.status);
        const data = await response.json();
        console.log('Response pay-ipl data:', data);

        if (response.ok) {
          alert(data.message || 'Bukti pembayaran IPL berhasil diunggah, menunggu persetujuan Bendahara!');
          setIplForm({ months: [], year: 2026, file: null });
          fetchWargaPayments();
          setActiveTab('iuran_riwayat');
        } else {
          alert(data.message || data.pesan || 'Gagal mengunggah bukti pembayaran IPL.');
        }
      } else {
        if (!kasForm.amount || isNaN(kasForm.amount) || parseInt(kasForm.amount) <= 0) {
          alert('Silakan masukkan nominal sumbangan kas yang valid.');
          setIsSubmittingPayment(false);
          return;
        }
        if (!kasForm.description.trim()) {
          alert('Silakan masukkan keterangan atau nama kegiatan.');
          setIsSubmittingPayment(false);
          return;
        }
        if (!kasForm.file) {
          alert('Silakan unggah berkas bukti transfer.');
          setIsSubmittingPayment(false);
          return;
        }

        const formData = new FormData();
        formData.append('amount', parseInt(kasForm.amount));
        formData.append('category', kasForm.category);
        formData.append('description', kasForm.description.trim());
        formData.append('file', kasForm.file);

        console.log('--- WARGA: Sending pay-kas ---');
        console.log('Target URL/Endpoint: POST http://172.20.32.62:3333/resident/pay-kas');
        console.log('Payload amount:', parseInt(kasForm.amount));
        console.log('Payload category:', kasForm.category);
        console.log('Payload description:', kasForm.description.trim());
        console.log('Payload file name:', kasForm.file ? kasForm.file.name : 'None');

        const response = await fetch('http://172.20.32.62:3333/resident/pay-kas', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        console.log('Response pay-kas status:', response.status);
        const data = await response.json();
        console.log('Response pay-kas data:', data);

        if (response.ok) {
          alert(data.message || 'Bukti pembayaran Kas berhasil diunggah, menunggu persetujuan Bendahara!');
          setKasForm({ amount: '', category: 'sosial', description: '', file: null });
          fetchWargaPayments();
          setActiveTab('iuran_riwayat');
        } else {
          alert(data.message || data.pesan || 'Gagal mengunggah bukti pembayaran Kas.');
        }
      }
    } catch (err) {
      console.error('Error occurred in handleUploadSubmit:', err);
      alert(`Gagal mengirim bukti pembayaran: ${err.message}`);
    } finally {
      setIsSubmittingPayment(false);
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

      const response = await fetch(`http://172.20.32.62:3333/resident/uploadsensitifdata/${idWarga}`, {
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
      const response = await fetch(`http://172.20.32.62:3333/resident/sensitifdata/file/${documentId}`, {
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
    setVotingError('');
    const token = localStorage.getItem('rt_token');
    if (!token) return;
    try {
      const response = await fetch('http://172.20.32.62:3333/resident/karyawan', {
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
      const response = await fetch('http://172.20.32.62:3333/resident/vote/results', {
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
      const response = await fetch('http://172.20.32.62:3333/resident/vote', {
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
      const response = await fetch('http://172.20.32.62:3333/resident/pengaduan', {
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

    const token = localStorage.getItem('rt_token');
    if (!token) {
      alert('Token otentikasi tidak ditemukan. Harap login kembali.');
      return;
    }

    try {
      const response = await fetch('http://172.20.32.62:3333/resident/password', {
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
      const data = await response.json();
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
      const response = await fetch('http://172.20.32.62:3333/resident/datawarga', {
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
      const response = await fetch(`http://172.20.32.62:3333/resident/warga/${editingMember.warga_id}`, {
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
      const response = await fetch(`http://172.20.32.62:3333/resident/uploadsensitifdata/${uploadDocForm.wargaId}`, {
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
        localStorage.setItem('rt_uploaded_docs', JSON.stringify(updatedDocs));
        
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
      const response = await fetch(`http://172.20.32.62:3333/resident/sensitifdata/file/${documentId}`, {
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
      if (iplPaymentForm.months.length === 0) {
        setPaymentError('Silakan pilih minimal satu bulan iuran.');
        setIsSubmittingPayment(false);
        return;
      }
      if (!iplPaymentForm.file) {
        setPaymentError('Silakan unggah bukti transfer pembayaran IPL.');
        setIsSubmittingPayment(false);
        return;
      }
      
      const totalAmount = iplPaymentForm.months.length * 200000;
      formData.append('file', iplPaymentForm.file);
      formData.append('year', iplPaymentForm.year);
      formData.append('amount', totalAmount);
      formData.append('months', JSON.stringify(iplPaymentForm.months));

      console.log('--- WARGA: Sending pay-ipl (Form) ---');
      console.log('Target URL/Endpoint: POST http://172.20.32.62:3333/resident/pay-ipl');
      console.log('Payload months:', JSON.stringify(iplPaymentForm.months));
      console.log('Payload year:', iplPaymentForm.year);
      console.log('Payload amount:', totalAmount);
      console.log('Payload file name:', iplPaymentForm.file ? iplPaymentForm.file.name : 'None');

      try {
        const response = await fetch('http://172.20.32.62:3333/resident/pay-ipl', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const data = await response.json();
        if (response.ok) {
          setPaymentSuccess('Pembayaran IPL berhasil dikirim! Tunggu verifikasi oleh Bendahara.');
          setIplPaymentForm({
            year: new Date().getFullYear(),
            months: [],
            file: null
          });
          if (fileInputRef.current) fileInputRef.current.value = '';
          
          const newUpload = {
            id: 'PAY-IPL-' + Math.floor(Math.random() * 9000 + 1000),
            date: new Date().toISOString().split('T')[0],
            nominal: totalAmount,
            bulan: 'Multi-Bulan',
            catatan: `Pembayaran IPL Tahun ${iplPaymentForm.year}`,
            status: 'Menunggu Verifikasi',
            wargaId: currentUser.id,
            wargaNama: currentUser.name || currentUser.username
          };
          const newList = [newUpload, ...buktiBayarList];
          setBuktiBayarList(newList);
          localStorage.setItem('rt_warga_bukti_bayar', JSON.stringify(newList));
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

      console.log('--- WARGA: Sending pay-kas (Form) ---');
      console.log('Target URL/Endpoint: POST http://172.20.32.62:3333/resident/pay-kas');
      console.log('Payload amount:', parseInt(kasPaymentForm.amount));
      console.log('Payload category:', kasPaymentForm.category);
      console.log('Payload description:', description);
      console.log('Payload file name:', kasPaymentForm.file ? kasPaymentForm.file.name : 'None');

      try {
        const response = await fetch('http://172.20.32.62:3333/resident/pay-kas', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const data = await response.json();
        if (response.ok) {
          setPaymentSuccess('Pembayaran Uang Kas berhasil dikirim! Tunggu verifikasi oleh Bendahara.');
          setKasPaymentForm({
            amount: '',
            category: 'sosial',
            activitySelect: 'Santunan Warga Sakit / Wafat',
            customDescription: '',
            file: null
          });
          if (fileInputRef.current) fileInputRef.current.value = '';

          const newUpload = {
            id: 'PAY-KAS-' + Math.floor(Math.random() * 9000 + 1000),
            date: new Date().toISOString().split('T')[0],
            nominal: parseInt(kasPaymentForm.amount),
            bulan: 'Insidental',
            catatan: `Kas ${kasPaymentForm.category.toUpperCase()}: ${description}`,
            status: 'Menunggu Verifikasi',
            wargaId: currentUser.id,
            wargaNama: currentUser.name || currentUser.username
          };
          const newList = [newUpload, ...buktiBayarList];
          setBuktiBayarList(newList);
          localStorage.setItem('rt_warga_bukti_bayar', JSON.stringify(newList));
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
      localStorage.setItem('rt_wargalist', JSON.stringify(updatedW));
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
      localStorage.setItem('rt_kaslist', JSON.stringify(updatedKas));
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
  const myPayments = transaksiKasList.filter(t => t.description.includes(currentUser.name));

  const familyHead = familyMembers[0] || null;

  // Resolved dynamic values for mock alignment
  const rtRw = currentUser.rtRw || '04 / 09';
  const displayNama = currentUser.name && currentUser.name !== currentUser.username ? currentUser.name : (familyHead ? familyHead.nama : (currentUser.name || 'Warga'));
  const displayNik = currentUser.nik || (familyHead ? familyHead.nik : '');
  const displayGender = currentUser.gender || (familyHead ? familyHead.jenis_kelamin : 'Laki-laki');
  const displayAlamat = currentUser.alamat || (familyHead ? familyHead.house_alamat : '');
  const displayNoHp = currentUser.noHp || (familyHead ? familyHead.no_hp : '');
  const displayEmail = currentUser.email || '';
  const tanggalLahir = currentUser.tglLahir || currentUser.tanggalLahir || (familyHead ? familyHead.tgl_lahir : (currentUser.name === 'Budi Santoso' ? '11 November 1990' : '20 Januari 2004'));
  const pekerjaan = currentUser.pekerjaan || (familyHead ? familyHead.pekerjaan : (currentUser.name === 'Budi Santoso' ? 'Wiraswasta' : 'Mahasiswa'));
  const statusRumah = currentUser.statusRumah || (familyHead && familyHead.house_status ? (familyHead.house_status === 'kontrak' ? 'Sewa / Kontrak' : 'Milik Sendiri') : (currentUser.status === 'Kontrak' ? 'Sewa / Kontrak' : 'Milik Sendiri'));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row text-slate-800 dark:text-slate-100 font-sans antialiased relative overflow-hidden">
      {/* Premium ambient glows */}
      <div className="absolute top-1/4 left-10 w-[500px] h-[500px] bg-emerald-500/5 dark:bg-emerald-500/[0.02] rounded-full blur-3xl -z-10 pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-10 w-[500px] h-[500px] bg-teal-500/5 dark:bg-teal-500/[0.02] rounded-full blur-3xl -z-10 pointer-events-none animate-pulse-slow" style={{ animationDelay: '3s' }}></div>
      
      {/* 1. SIDEBAR */}
      <aside className="w-full md:w-64 bg-[var(--color-accent-green)]/10 dark:bg-[var(--color-accent-green)]/25 text-slate-900 dark:text-white border-r border-[var(--color-accent-green)]/20 dark:border-[var(--color-accent-green)]/40 flex flex-col flex-shrink-0">
        
        {/* Logo/Brand Header */}
        <div className="p-6 border-b border-[var(--color-accent-green)]/20 dark:border-[var(--color-accent-green)]/50 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-[var(--color-accent-green)] to-teal-400 rounded-xl text-white">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-white tracking-tight leading-tight">Warga Portal</h1>
            <span className="text-[9px] text-white/80 uppercase font-bold tracking-widest leading-none">RT 05 / RW 06</span>
          </div>
        </div>

        {/* Citizen Profile Card in Sidebar */}
        <div className="p-4 mx-4 my-3 bg-[var(--color-accent-green)]/10 dark:bg-[var(--color-accent-green)]/20 rounded-2xl border border-[var(--color-accent-green)]/20 dark:border-[var(--color-accent-green)]/40 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[var(--color-accent-green)]/10 border border-[var(--color-accent-green)]/20 text-white font-bold flex items-center justify-center text-xs uppercase">
            {displayNama.charAt(0) || 'W'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">{displayNama}</p>
            <p className="text-[9px] text-white/80 font-semibold uppercase tracking-wider">Warga Portal</p>
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

          {/* Upload Berkas Mandiri Button (Only for Tetap/Milik Warga) */}
          {isPermanentResident && (
            <button
              onClick={() => { setActiveTab('warga_upload_berkas'); handleCancel(); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'warga_upload_berkas'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                  : 'text-white/90 hover:bg-white/10 dark:hover:bg-white/10 hover:text-white'
              }`}
            >
              <Upload className="w-4 h-4 text-emerald-500" />
              <span>Upload Berkas Mandiri</span>
            </button>
          )}

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
            onClick={async () => {
              const result = await Swal.fire({
                title: 'Keluar Portal',
                text: 'Apakah Anda ingin keluar dari portal warga?',
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
        <div className="p-6 md:p-8 flex-1 max-w-5xl w-full mx-auto">
          
          {/* TAB 1: Dashboard View */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fade-in font-sans">
              
              {/* Welcome banner card */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
                <div className="space-y-2 z-10">
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">Selamat datang kembali, {currentUser.name}! 👋</h3>
                  <p className="text-xs text-slate-400 max-w-lg leading-relaxed">Pantau iuran bulanan Anda secara transparan, ajukan surat pengantar mandiri, dan dapatkan pengumuman RT 05 terupdate dalam satu dasbor.</p>
                </div>
                <div className="px-5 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/10 flex items-center gap-2">
                  <Landmark className="w-4 h-4" />
                  <span>Blok: {currentUser.alamat ? (currentUser.alamat.split('Blok ').pop() || currentUser.alamat) : 'Belum diisi'}</span>
                </div>
              </div>

              {/* Quick statistics widgets grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex items-center gap-4 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
                  <div className={`p-4 rounded-2xl ${currentUser.statusIuran?.includes('Menunggak') ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider">Iuran Kas RT</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white leading-tight block mt-0.5">{currentUser.statusIuran || 'Lunas'}</span>
                  </div>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex items-center gap-4 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
                  <div className="p-4 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-2xl">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider">Surat Pengantar</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white leading-tight block mt-0.5">{mySubmissions.length} Diajukan</span>
                  </div>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex items-center gap-4 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
                  <div className="p-4 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider">Kegiatan RT</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white leading-tight block mt-0.5">{agendaList.length} Terjadwal</span>
                  </div>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex items-center gap-4 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
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

          {/* TAB 2: Profil Saya (MOCKUP ALIGNED) */}
          {activeTab === 'profil_saya' && (
            <div className="space-y-6 animate-fade-in font-sans">
              
              {/* Header Visual               <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col items-center text-center space-y-4">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-extrabold flex items-center justify-center text-3xl shadow-lg border-4 border-white dark:border-slate-800">
                    {displayNama.charAt(0) || 'W'}
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/40 text-white text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    👤 FOTO PROFIL
                  </div>
                </div>
                
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{displayNama}</h3>
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
                    <span className="text-slate-805 dark:text-slate-200 font-bold">{displayNama}</span>
                  </div>
                  <div className="flex justify-between sm:justify-start items-center">
                    <span className="w-32 text-slate-400 font-bold">NIK</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold font-mono">
                      {displayNik ? `${displayNik.slice(0, 4)}********${displayNik.slice(-4)}` : '3276********1234'}
                    </span>
                  </div>
                  <div className="flex justify-between sm:justify-start items-center">
                    <span className="w-32 text-slate-400 font-bold">Jenis Kelamin</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">{displayGender}</span>
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
                    <span className="text-slate-800 dark:text-slate-200 font-bold">{displayAlamat || 'Belum diisi'}</span>
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
                      <span className="text-slate-800 dark:text-slate-200 font-bold">{displayNoHp || '-'}</span>
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
                      <span className="text-slate-800 dark:text-slate-200 font-bold">{displayEmail || '-'}</span>
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
          {activeTab === 'iuran_tagihan' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="border-b border-slate-200/60 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tagihan Iuran Kas Bulanan Saya</h3>
                <p className="text-xs text-slate-400">Rincian status pembayaran iuran wajib bulanan komplek RT 05.</p>
              </div>

              {(currentUser.statusIuran?.includes('Menunggak') || currentUser.tagihNotification) ? (
                <div className="p-6 bg-rose-500/10 border border-rose-500/25 rounded-3xl space-y-4">
                   <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl flex-shrink-0">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Status Iuran: Menunggak</h4>
                      <p className="text-[11px] text-slate-400 mt-1">Anda terdeteksi memiliki tunggakan iuran bulanan kas RT 05 sebesar <span className="font-black text-rose-500">{currentUser.statusIuran || 'Rp 50.000'}</span>.</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800 rounded-2xl text-[11px] grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-slate-400 font-bold block text-[9px] uppercase tracking-wider">REKENING BANK MANDIRI RT</span>
                      <p className="font-mono font-black text-slate-800 dark:text-slate-200">157-00-98234-04-1</p>
                      <p className="text-[9px] text-slate-500 font-semibold">a.n. KAS RT 05 SAWANGAN GREEN PARK</p>
                    </div>
                    <div className="space-y-1 leading-relaxed">
                      <span className="text-slate-400 font-bold block text-[9px] uppercase tracking-wider">PILIHAN PEMBAYARAN</span>
                      <p className="text-slate-500 text-[10px]">Silakan pilih opsi pembayaran instan otomatis (Payment Gateway) di bawah ini, atau transfer secara manual ke rekening kas RT dan upload bukti transfer Anda.</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={handleInitiatePg}
                      className="py-2.5 px-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-500/15 cursor-pointer flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Bayar via Payment Gateway (Instan & Otomatis)</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('iuran_upload')}
                      className="py-2.5 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-slate-700 dark:text-slate-350 font-extrabold text-xs rounded-xl cursor-pointer transition-all"
                    >
                      Kirim Bukti Bayar Manual (Transfer Bank)
                    </button>
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
              <div className="border-b border-slate-200/60 dark:border-slate-800 pb-4 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Riwayat Setoran Uang Saya</h3>
                  <p className="text-xs text-slate-400">Bukti catatan pembayaran iuran bulanan (IPL) dan kas sosial keluarga Anda.</p>
                </div>
                <button
                  onClick={fetchWargaPayments}
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
                  {/* IPL History Table */}
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider block mb-3 font-sans">1. Iuran Bulanan (IPL)</h4>
                    <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                      <table className="w-full text-left text-xs border-collapse font-sans">
                        <thead>
                          <tr className="bg-slate-50/70 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider">
                            <th className="p-4">Tahun / Bulan</th>
                            <th className="p-4">Tanggal Pembayaran</th>
                            <th className="p-4">Bukti Struk</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-right">Jumlah Setor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {wargaPayments.ipl && wargaPayments.ipl.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                              <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                                Tahun {t.year} - Bulan {t.month}
                              </td>
                              <td className="p-4 text-slate-500 font-mono">{formatDateIndo(t.payment_date)}</td>
                              <td className="p-4 max-w-xs truncate text-slate-400 font-mono" title={t.payment_proof}>
                                {t.payment_proof || '-'}
                              </td>
                              <td className="p-4 text-center">
                                <span className="px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-450">
                                  {t.status}
                                </span>
                              </td>
                              <td className="p-4 text-right font-black text-emerald-600 dark:text-emerald-400 font-mono">+{formatRupiah(t.amount)}</td>
                            </tr>
                          ))}
                          {(!wargaPayments.ipl || wargaPayments.ipl.length === 0) && (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-slate-400 font-bold italic">Belum ada riwayat pembayaran IPL.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* KAS History Table */}
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider block mb-3 font-sans">2. Sumbangan & Kas Insidental</h4>
                    <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                      <table className="w-full text-left text-xs border-collapse font-sans">
                        <thead>
                          <tr className="bg-slate-50/70 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 font-extrabold uppercase text-slate-400 tracking-wider">
                            <th className="p-4">Kategori / Keterangan</th>
                            <th className="p-4">Tanggal Pembayaran</th>
                            <th className="p-4">Bukti Struk</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-right">Jumlah Setor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {wargaPayments.kas && wargaPayments.kas.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                              <td className="p-4 space-y-0.5">
                                <span className="font-bold text-slate-850 dark:text-slate-200 block capitalize">{t.category}</span>
                                <span className="text-[10px] text-slate-400 block italic">"{t.description}"</span>
                              </td>
                              <td className="p-4 text-slate-500 font-mono">{formatDateIndo(t.payment_date)}</td>
                              <td className="p-4 max-w-xs truncate text-slate-400 font-mono" title={t.payment_proof}>
                                {t.payment_proof || '-'}
                              </td>
                              <td className="p-4 text-center">
                                <span className="px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-450">
                                  {t.status}
                                </span>
                              </td>
                              <td className="p-4 text-right font-black text-emerald-600 dark:text-emerald-400 font-mono">+{formatRupiah(t.amount)}</td>
                            </tr>
                          ))}
                          {(!wargaPayments.kas || wargaPayments.kas.length === 0) && (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-slate-400 font-bold italic">Belum ada riwayat pembayaran Kas.</td>
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

          {/* TAB 8: Iuran -> Upload Bukti Bayar */}
          {activeTab === 'iuran_upload' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in font-sans">
              <div className="border-b border-slate-200/60 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Kirim Bukti Transaksi Iuran / Kas</h3>
                <p className="text-xs text-slate-400">Setor laporan pembayaran IPL bulanan atau iuran sosial/insidental warga Anda.</p>
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
                  /* IPL FORM FIELDS */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-600 dark:text-slate-400">Tahun Dues *</label>
                        <input
                          required
                          type="number"
                          value={iplPaymentForm.year}
                          onChange={(e) => setIplPaymentForm({ ...iplPaymentForm, year: parseInt(e.target.value) || new Date().getFullYear() })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-600 dark:text-slate-400">Total Nominal Dues</label>
                        <div className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 font-mono text-sm font-black flex items-center">
                          Rp {new Intl.NumberFormat('id-ID').format(iplPaymentForm.months.length * 200000)}
                        </div>
                        <p className="text-[10px] text-slate-400">Akumulasi otomatis Rp 200.000 / bulan</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-655 dark:text-slate-350">Pilih Bulan Yang Dibayar (Multi-select) *</label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1.5">
                        {[
                          { val: 1, label: 'Januari' }, { val: 2, label: 'Februari' }, { val: 3, label: 'Maret' },
                          { val: 4, label: 'April' }, { val: 5, label: 'Mei' }, { val: 6, label: 'Juni' },
                          { val: 7, label: 'Juli' }, { val: 8, label: 'Agustus' }, { val: 9, label: 'September' },
                          { val: 10, label: 'Oktober' }, { val: 11, label: 'November' }, { val: 12, label: 'Desember' }
                        ].map((m) => {
                          const isChecked = iplPaymentForm.months.includes(m.val);
                          return (
                            <button
                              key={m.val}
                              type="button"
                              onClick={() => {
                                const newMonths = isChecked
                                  ? iplPaymentForm.months.filter(v => v !== m.val)
                                  : [...iplPaymentForm.months, m.val].sort((a, b) => a - b);
                                setIplPaymentForm({ ...iplPaymentForm, months: newMonths });
                              }}
                              className={`py-2 px-3 border rounded-xl font-bold text-[10px] sm:text-xs text-center transition-all cursor-pointer ${
                                isChecked
                                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                  : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                              }`}
                            >
                              {m.label}
                            </button>
                          );
                        })}
                      </div>
                      <div className="pt-2 flex justify-between">
                        <button
                          type="button"
                          onClick={() => setIplPaymentForm({ ...iplPaymentForm, months: [1,2,3,4,5,6,7,8,9,10,11,12] })}
                          className="text-[10px] text-emerald-500 hover:underline font-bold"
                        >
                          Pilih Semua Bulan (Rapel 1 Tahun)
                        </button>
                        <button
                          type="button"
                          onClick={() => setIplPaymentForm({ ...iplPaymentForm, months: [] })}
                          className="text-[10px] text-slate-400 hover:underline font-bold"
                        >
                          Bersihkan Pilihan
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-600 dark:text-slate-400">Bukti Transfer Bank (.jpg, .png, .pdf) *</label>
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
                          {iplPaymentForm.file ? `Terpilih: ${iplPaymentForm.file.name}` : 'Pilih berkas struk pembayaran...'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-sans">Mendukung format JPG, PNG, atau PDF (Maks 3MB)</span>
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
                          {kasPaymentForm.file ? `Terpilih: ${kasPaymentForm.file.name}` : 'Pilih berkas struk pembayaran...'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-sans">Mendukung format JPG, PNG, atau PDF (Maks 3MB)</span>
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
                    disabled={isSubmittingPayment}
                    className="py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-extrabold rounded-xl hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {isSubmittingPayment ? 'Mengirim Data...' : 'Kirim Bukti Pembayaran'}
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
                      <p className="text-[10px] text-slate-500 mt-0.5 font-sans">Bendahara RT 05 mengirimkan tagihan resmi pembayaran iuran kas Anda. Harap segera lakukan pembayaran.</p>
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
    </div>
  );
}
