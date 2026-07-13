import { useState, useEffect } from 'react';
import {
  Home, Users, UserPlus, ChevronRight, Check, AlertCircle,
  Loader2, RotateCcw, ClipboardList, ChevronDown, ChevronUp,
  Sparkles, Building2, CreditCard, ArrowRight, CheckCircle2, XCircle,
  Key, Copy
} from 'lucide-react';

const API_BASE = 'http://172.20.32.62:3333';

const STEPS = [
  { id: 1, title: 'Data Rumah', subtitle: 'Buat data rumah baru', icon: Home, endpoint: '/admin/house' },
  { id: 2, title: 'Kartu Keluarga', subtitle: 'Daftarkan KK pada rumah', icon: CreditCard, endpoint: '/admin/resident' },
  { id: 3, title: 'Data Warga', subtitle: 'Input data warga lengkap', icon: UserPlus, endpoint: '/admin/datawarga' },
];

// Toast notification component
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-bold animate-slide-in-right max-w-md
      ${type === 'success'
        ? 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
        : 'bg-red-50 dark:bg-red-950/90 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
      }`}
    >
      {type === 'success'
        ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
        : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
      }
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">✕</button>
    </div>
  );
}

export default function AdminDataWizard() {
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Stored IDs from API responses
  const [houseId, setHouseId] = useState(null);
  const [familyId, setFamilyId] = useState(null);

  // Warga account credentials states
  const [createdAccount, setCreatedAccount] = useState(null);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  // Residents list from GET /admin/resident
  const [residentsList, setResidentsList] = useState([]);
  const [isResidentsOpen, setIsResidentsOpen] = useState(false);
  const [isLoadingResidents, setIsLoadingResidents] = useState(false);

  // Step 1 — House form
  const [houseForm, setHouseForm] = useState({
    blok: '',
    nomor: '',
    alamat: '',
    status: 'pribadi',
  });

  // Step 2 — Resident form
  const [residentForm, setResidentForm] = useState({
    noKK: '',
    KepalaKeluarga: '',
  });

  // Step 3 — Warga form
  const [wargaForm, setWargaForm] = useState({
    nik: '',
    nama: '',
    jenisKelamin: 'Laki-laki',
    tglLahir: '',
    statusHidup: 'Hidup',
    noHp: '',
    umur: '',
  });

  // Form errors per field
  const [fieldErrors, setFieldErrors] = useState({});

  // Wizard completed state (all 3 steps done)
  const [wizardComplete, setWizardComplete] = useState(false);

  // Summary data
  const [summaryData, setSummaryData] = useState({});

  // Fetch residents list
  const fetchResidents = async () => {
    setIsLoadingResidents(true);
    const token = localStorage.getItem('rt_token');
    try {
      const res = await fetch(`${API_BASE}/admin/resident`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      setResidentsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Gagal mengambil data resident:', err);
    } finally {
      setIsLoadingResidents(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchResidents();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Validation
  const validateStep1 = () => {
    const errs = {};
    if (!houseForm.blok.trim()) errs.blok = 'Blok rumah wajib diisi';
    if (!houseForm.nomor || isNaN(houseForm.nomor) || parseInt(houseForm.nomor) <= 0)
      errs.nomor = 'Nomor rumah harus angka positif';
    if (!houseForm.alamat.trim()) errs.alamat = 'Alamat wajib diisi';
    if (!['kontrak', 'pribadi'].includes(houseForm.status))
      errs.status = 'Status harus "kontrak" atau "pribadi"';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs = {};
    if (!residentForm.noKK || residentForm.noKK.trim().length < 5)
      errs.noKK = 'No KK minimal 5 karakter';
    if (!residentForm.KepalaKeluarga || isNaN(residentForm.KepalaKeluarga) || parseInt(residentForm.KepalaKeluarga) <= 0)
      errs.KepalaKeluarga = 'ID Kepala Keluarga harus angka positif';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = () => {
    const errs = {};
    if (!wargaForm.nik.trim()) errs.nik = 'NIK wajib diisi';
    if (!wargaForm.nama.trim()) errs.nama = 'Nama lengkap wajib diisi';
    if (!wargaForm.tglLahir) errs.tglLahir = 'Tanggal lahir wajib diisi';
    if (!wargaForm.noHp.trim()) errs.noHp = 'Nomor HP wajib diisi';
    if (!wargaForm.umur || isNaN(wargaForm.umur) || parseInt(wargaForm.umur) <= 0)
      errs.umur = 'Umur harus angka positif';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Step 1 — POST /admin/house
  const handleSubmitStep1 = async () => {
    if (!validateStep1()) return;
    setIsLoading(true);
    const token = localStorage.getItem('rt_token');
    try {
      const res = await fetch(`${API_BASE}/admin/house`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          blok: houseForm.blok,
          nomor: parseInt(houseForm.nomor),
          alamat: houseForm.alamat,
          status: houseForm.status,
        }),
      });
      const data = await res.json();
      if (res.ok && data.output?.pesan?.insertId !== undefined) {
        const insertedId = data.output.pesan.insertId;
        setHouseId(insertedId);
        setCompletedSteps(prev => [...prev, 1]);
        setCurrentStep(2);
        setSummaryData(prev => ({ ...prev, house: { ...houseForm, id: insertedId } }));
        setToast({ type: 'success', message: `Rumah berhasil dibuat! (ID: ${insertedId})` });
        setFieldErrors({});
      } else {
        const errMsg = data.message || data.errors?.map(e => e.message).join(', ') || 'Gagal membuat data rumah';
        setToast({ type: 'error', message: errMsg });
      }
    } catch (err) {
      setToast({ type: 'error', message: `Koneksi gagal: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Step 2 — POST /admin/resident
  const handleSubmitStep2 = async () => {
    if (!validateStep2()) return;
    setIsLoading(true);
    const token = localStorage.getItem('rt_token');
    try {
      const res = await fetch(`${API_BASE}/admin/resident`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          noKK: residentForm.noKK,
          home: houseId,
          KepalaKeluarga: parseInt(residentForm.KepalaKeluarga),
        }),
      });
      const data = await res.json();
      if (res.ok && data.output?.pesan?.insertId !== undefined) {
        const insertedId = data.output.pesan.insertId;
        setFamilyId(insertedId);
        setCompletedSteps(prev => [...prev, 2]);
        setCurrentStep(3);
        setSummaryData(prev => ({ ...prev, resident: { ...residentForm, id: insertedId, home: houseId } }));
        setToast({ type: 'success', message: `Kartu Keluarga berhasil dibuat! (ID: ${insertedId})` });
        setFieldErrors({});
        fetchResidents(); // refresh list
      } else {
        const errMsg = data.message || data.errors?.map(e => e.message).join(', ') || 'Gagal membuat data KK';
        setToast({ type: 'error', message: errMsg });
      }
    } catch (err) {
      setToast({ type: 'error', message: `Koneksi gagal: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Step 3 — POST /admin/datawarga
  const handleSubmitStep3 = async () => {
    if (!validateStep3()) return;
    setIsLoading(true);
    const token = localStorage.getItem('rt_token');
    try {
      const res = await fetch(`${API_BASE}/admin/datawarga`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nik: wargaForm.nik,
          nama: wargaForm.nama,
          jenisKelamin: wargaForm.jenisKelamin,
          tglLahir: wargaForm.tglLahir,
          statusHidup: wargaForm.statusHidup,
          noHp: wargaForm.noHp,
          umur: parseInt(wargaForm.umur),
          fammilyId: familyId,
          houseId: houseId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCompletedSteps(prev => [...prev, 3]);
        setSummaryData(prev => ({ ...prev, warga: { ...wargaForm, fammilyId: familyId, houseId } }));
        setWizardComplete(true);
        setToast({ type: 'success', message: 'Data warga berhasil tersimpan! 🎉' });
        setFieldErrors({});
      } else {
        const errMsg = data.message || data.errors?.map(e => e.message).join(', ') || 'Gagal menyimpan data warga';
        setToast({ type: 'error', message: errMsg });
      }
    } catch (err) {
      setToast({ type: 'error', message: `Koneksi gagal: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Step 4 — POST /admin/create-account
  const handleCreateWargaAccount = async () => {
    if (!familyId) return;
    setIsCreatingAccount(true);
    const token = localStorage.getItem('rt_token');
    try {
      const res = await fetch(`${API_BASE}/admin/create-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ familyId })
      });
      const data = await res.json();
      if (res.ok && data.output?.username) {
        setCreatedAccount({
          username: data.output.username,
          temporaryPassword: data.output.temporaryPassword
        });
        setToast({ type: 'success', message: 'Akun warga berhasil dibuat! 🔑' });
      } else {
        const errMsg = data.message || 'Gagal membuat akun warga';
        setToast({ type: 'error', message: errMsg });
      }
    } catch (err) {
      setToast({ type: 'error', message: `Koneksi gagal: ${err.message}` });
    } finally {
      setIsCreatingAccount(false);
    }
  };

  // Reset wizard
  const handleReset = () => {
    setCurrentStep(1);
    setCompletedSteps([]);
    setHouseId(null);
    setFamilyId(null);
    setHouseForm({ blok: '', nomor: '', alamat: '', status: 'pribadi' });
    setResidentForm({ noKK: '', KepalaKeluarga: '' });
    setWargaForm({ nik: '', nama: '', jenisKelamin: 'Laki-laki', tglLahir: '', statusHidup: 'Hidup', noHp: '', umur: '' });
    setFieldErrors({});
    setWizardComplete(false);
    setSummaryData({});
    setCreatedAccount(null);
    setIsCreatingAccount(false);
  };

  // Helper: input classes
  const inputClass = (field) =>
    `w-full px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-200 outline-none
     bg-white dark:bg-slate-800/60 
     ${fieldErrors[field]
       ? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-300 dark:focus:ring-red-800'
       : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-900'
     }
     text-slate-800 dark:text-slate-100 placeholder:text-slate-350 dark:placeholder:text-slate-500`;

  const labelClass = 'block text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5';

  const cardClass = 'bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl shadow-xs';

  // ── RENDER: WIZARD COMPLETE ──
  if (wizardComplete) {
    return (
      <div className="space-y-6 animate-fade-in">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        {/* Success hero */}
        <div className={`${cardClass} p-8 sm:p-12 text-center relative overflow-hidden`}>
          {/* Decorative bg */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/10" />
          <div className="relative z-10">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/25 animate-bounce-slow">
              <Check className="w-10 h-10 text-white" strokeWidth={3} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2">
              Semua Data Berhasil Tersimpan!
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
              Data Rumah, Kartu Keluarga, dan Warga telah berhasil dikirim ke server dan tersimpan di database.
            </p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* House summary */}
          <div className={`${cardClass} p-6`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl">
                <Home className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Data Rumah</h3>
                <span className="text-[10px] font-bold text-blue-500 font-mono">ID: {summaryData.house?.id}</span>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-slate-400 font-semibold">Blok</span><span className="font-bold text-slate-700 dark:text-slate-200">{summaryData.house?.blok}</span></div>
              <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-2"><span className="text-slate-400 font-semibold">Nomor</span><span className="font-bold text-slate-700 dark:text-slate-200">{summaryData.house?.nomor}</span></div>
              <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-2"><span className="text-slate-400 font-semibold">Alamat</span><span className="font-bold text-slate-700 dark:text-slate-200 text-right max-w-[60%]">{summaryData.house?.alamat}</span></div>
              <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-2"><span className="text-slate-400 font-semibold">Status</span><span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${summaryData.house?.status === 'pribadi' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600' : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600'}`}>{summaryData.house?.status}</span></div>
            </div>
          </div>

          {/* Resident summary */}
          <div className={`${cardClass} p-6`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-purple-500/10 dark:bg-purple-500/20 rounded-xl">
                <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Kartu Keluarga</h3>
                <span className="text-[10px] font-bold text-purple-500 font-mono">Family ID: {summaryData.resident?.id}</span>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-slate-400 font-semibold">No. KK</span><span className="font-bold text-slate-700 dark:text-slate-200 font-mono">{summaryData.resident?.noKK}</span></div>
              <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-2"><span className="text-slate-400 font-semibold">Rumah (ID)</span><span className="font-bold text-slate-700 dark:text-slate-200">{summaryData.resident?.home}</span></div>
              <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-2"><span className="text-slate-400 font-semibold">Kepala Keluarga (ID)</span><span className="font-bold text-slate-700 dark:text-slate-200">{summaryData.resident?.KepalaKeluarga}</span></div>
            </div>
          </div>

          {/* Warga summary */}
          <div className={`${cardClass} p-6`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl">
                <UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Data Warga</h3>
                <span className="text-[10px] font-bold text-emerald-500">Tersimpan</span>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-slate-400 font-semibold">Nama</span><span className="font-bold text-slate-700 dark:text-slate-200">{summaryData.warga?.nama}</span></div>
              <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-2"><span className="text-slate-400 font-semibold">NIK</span><span className="font-bold text-slate-700 dark:text-slate-200 font-mono text-[10px]">{summaryData.warga?.nik}</span></div>
              <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-2"><span className="text-slate-400 font-semibold">Gender</span><span className="font-bold text-slate-700 dark:text-slate-200">{summaryData.warga?.jenisKelamin}</span></div>
              <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-2"><span className="text-slate-400 font-semibold">Tgl Lahir</span><span className="font-bold text-slate-700 dark:text-slate-200">{summaryData.warga?.tglLahir}</span></div>
              <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-2"><span className="text-slate-400 font-semibold">No HP</span><span className="font-bold text-slate-700 dark:text-slate-200">{summaryData.warga?.noHp}</span></div>
            </div>
          </div>
        </div>

        {createdAccount ? (
          <div className={`${cardClass} p-6 border-emerald-500/30 dark:border-emerald-500/20 bg-emerald-500/[0.02] max-w-xl mx-auto space-y-4`}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 rounded-xl">
                <Key className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Kredensial Akun Login Warga</h3>
                <p className="text-[10px] text-slate-400">Bagikan akun sementara ini kepada Kepala Keluarga untuk login pertama kali.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs space-y-3 font-mono">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-sans font-bold">Username</span>
                  <span className="font-black text-slate-800 dark:text-slate-200">{createdAccount.username}</span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(createdAccount.username);
                    setToast({ type: 'success', message: 'Username disalin!' });
                  }}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 cursor-pointer transition-colors"
                  title="Salin Username"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-3">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-sans font-bold">Sandi Sementara</span>
                  <span className="font-black text-slate-800 dark:text-slate-200">{createdAccount.temporaryPassword}</span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(createdAccount.temporaryPassword);
                    setToast({ type: 'success', message: 'Sandi sementara disalin!' });
                  }}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 cursor-pointer transition-colors"
                  title="Salin Sandi"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className={`${cardClass} p-6 bg-slate-50/50 dark:bg-slate-950/20 max-w-xl mx-auto text-center space-y-4`}>
            <div className="space-y-1">
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">Langkah Akhir: Buat Akses Akun Warga</h4>
              <p className="text-[11px] text-slate-400">Buat kredensial login portal warga secara otomatis untuk keluarga baru ini.</p>
            </div>
            <button
              onClick={handleCreateWargaAccount}
              disabled={isCreatingAccount}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-650 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {isCreatingAccount ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Membuat Akun...</span>
                </>
              ) : (
                <>
                  <Key className="w-3.5 h-3.5" />
                  <span>Buat Akun Login Warga</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Reset button */}
        <div className="flex justify-center">
          <button
            onClick={handleReset}
            className="flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl text-sm shadow-lg shadow-emerald-500/20 transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            Input Data Baru Lagi
          </button>
        </div>
      </div>
    );
  }

  // ── RENDER: WIZARD FORM ──
  return (
    <div className="space-y-6 animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── STEP INDICATOR ── */}
      <div className={`${cardClass} p-6 sm:p-8`}>
        <div className="flex items-center justify-between relative">
          {/* Connector lines */}
          <div className="absolute top-6 left-0 right-0 h-[2px] bg-slate-200 dark:bg-slate-800 mx-16 sm:mx-24" />
          <div
            className="absolute top-6 left-0 h-[2px] bg-gradient-to-r from-emerald-500 to-teal-500 mx-16 sm:mx-24 transition-all duration-700 ease-out"
            style={{
              width: currentStep === 1 ? '0%' : currentStep === 2 ? 'calc(50% - 3rem)' : 'calc(100% - 6rem)',
            }}
          />

          {STEPS.map((step) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = currentStep === step.id;
            const StepIcon = step.icon;

            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center text-center">
                {/* Circle */}
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 
                    ${isCompleted
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 scale-100'
                      : isCurrent
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 animate-pulse-slow scale-110'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                    }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" strokeWidth={3} /> : <StepIcon className="w-5 h-5" />}
                </div>
                {/* Label */}
                <span className={`mt-2.5 text-xs font-extrabold transition-colors duration-300
                  ${isCurrent || isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}
                >
                  {step.title}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium hidden sm:block max-w-[120px]">
                  {step.subtitle}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── FORM AREA ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Form Card */}
        <div className="lg:col-span-2">
          <div className={`${cardClass} p-6 sm:p-8 relative overflow-hidden`}>
            {/* Decorative gradient corner */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-emerald-500/5 to-transparent dark:from-emerald-500/10 rounded-bl-full" />

            <div className="relative z-10">
              {/* Form Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl text-white shadow-md shadow-emerald-500/20">
                  {currentStep === 1 && <Home className="w-5 h-5" />}
                  {currentStep === 2 && <CreditCard className="w-5 h-5" />}
                  {currentStep === 3 && <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white">
                    Step {currentStep}: {STEPS[currentStep - 1].title}
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold">
                    {currentStep === 1 && 'Isi data rumah terlebih dahulu sebagai entitas dasar'}
                    {currentStep === 2 && `Daftarkan Kartu Keluarga untuk Rumah ID: ${houseId}`}
                    {currentStep === 3 && `Input data warga — Rumah ID: ${houseId}, Family ID: ${familyId}`}
                  </p>
                </div>
              </div>

              {/* ── STEP 1 FORM ── */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className={labelClass}>Blok / Cluster <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        value={houseForm.blok}
                        onChange={e => setHouseForm({ ...houseForm, blok: e.target.value })}
                        placeholder="Contoh: A, B1, C3"
                        className={inputClass('blok')}
                      />
                      {fieldErrors.blok && <p className="text-red-500 text-[11px] font-semibold mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.blok}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Nomor Rumah <span className="text-red-400">*</span></label>
                      <input
                        type="number"
                        value={houseForm.nomor}
                        onChange={e => setHouseForm({ ...houseForm, nomor: e.target.value })}
                        placeholder="Contoh: 12"
                        className={inputClass('nomor')}
                        min="1"
                      />
                      {fieldErrors.nomor && <p className="text-red-500 text-[11px] font-semibold mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.nomor}</p>}
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Alamat Lengkap <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={houseForm.alamat}
                      onChange={e => setHouseForm({ ...houseForm, alamat: e.target.value })}
                      placeholder="Contoh: Jl. Melati No. 12, Sawangan Green Park"
                      className={inputClass('alamat')}
                    />
                    {fieldErrors.alamat && <p className="text-red-500 text-[11px] font-semibold mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.alamat}</p>}
                  </div>

                  <div>
                    <label className={labelClass}>Status Kepemilikan <span className="text-red-400">*</span></label>
                    <div className="flex gap-3">
                      {['pribadi', 'kontrak'].map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setHouseForm({ ...houseForm, status: opt })}
                          className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold border-2 transition-all duration-200 cursor-pointer capitalize
                            ${houseForm.status === opt
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 shadow-sm'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                        >
                          {opt === 'pribadi' ? '🏠 Pribadi' : '🔑 Kontrak'}
                        </button>
                      ))}
                    </div>
                    {fieldErrors.status && <p className="text-red-500 text-[11px] font-semibold mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.status}</p>}
                  </div>
                </div>
              )}

              {/* ── STEP 2 FORM ── */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  {/* Auto-filled house ID badge */}
                  <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <Building2 className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                      ID Rumah (otomatis): <span className="font-mono bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-lg">{houseId}</span>
                    </span>
                  </div>

                  <div>
                    <label className={labelClass}>Nomor Kartu Keluarga (No. KK) <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={residentForm.noKK}
                      onChange={e => setResidentForm({ ...residentForm, noKK: e.target.value })}
                      placeholder="Contoh: 3201234567890001 (min 5 karakter)"
                      className={inputClass('noKK')}
                    />
                    {fieldErrors.noKK && <p className="text-red-500 text-[11px] font-semibold mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.noKK}</p>}
                  </div>

                  <div>
                    <label className={labelClass}>ID Kepala Keluarga <span className="text-red-400">*</span></label>
                    <input
                      type="number"
                      value={residentForm.KepalaKeluarga}
                      onChange={e => setResidentForm({ ...residentForm, KepalaKeluarga: e.target.value })}
                      placeholder="Contoh: 1 (angka positif)"
                      className={inputClass('KepalaKeluarga')}
                      min="1"
                    />
                    {fieldErrors.KepalaKeluarga && <p className="text-red-500 text-[11px] font-semibold mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.KepalaKeluarga}</p>}
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">⚠️ Perhatikan: field ini case-sensitive (<code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-emerald-600 dark:text-emerald-400 font-bold">KepalaKeluarga</code> — huruf K besar)</p>
                  </div>
                </div>
              )}

              {/* ── STEP 3 FORM ── */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  {/* Auto-filled badges */}
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-2 p-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl">
                      <Building2 className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300">houseId: <span className="font-mono">{houseId}</span></span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-xl">
                      <Users className="w-3.5 h-3.5 text-purple-500" />
                      <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300">fammilyId: <span className="font-mono">{familyId}</span></span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className={labelClass}>NIK <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        value={wargaForm.nik}
                        onChange={e => setWargaForm({ ...wargaForm, nik: e.target.value })}
                        placeholder="3201234501010001"
                        className={inputClass('nik')}
                      />
                      {fieldErrors.nik && <p className="text-red-500 text-[11px] font-semibold mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.nik}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Nama Lengkap <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        value={wargaForm.nama}
                        onChange={e => setWargaForm({ ...wargaForm, nama: e.target.value })}
                        placeholder="Budi Santoso"
                        className={inputClass('nama')}
                      />
                      {fieldErrors.nama && <p className="text-red-500 text-[11px] font-semibold mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.nama}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className={labelClass}>Jenis Kelamin <span className="text-red-400">*</span></label>
                      <div className="flex gap-3">
                        {['Laki-laki', 'Perempuan'].map(g => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setWargaForm({ ...wargaForm, jenisKelamin: g })}
                            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold border-2 transition-all duration-200 cursor-pointer
                              ${wargaForm.jenisKelamin === g
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 shadow-sm'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 text-slate-500 hover:border-slate-300'
                              }`}
                          >
                            {g === 'Laki-laki' ? '👨 Laki-laki' : '👩 Perempuan'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Tanggal Lahir <span className="text-red-400">*</span></label>
                      <input
                        type="date"
                        value={wargaForm.tglLahir}
                        onChange={e => setWargaForm({ ...wargaForm, tglLahir: e.target.value })}
                        className={inputClass('tglLahir')}
                      />
                      {fieldErrors.tglLahir && <p className="text-red-500 text-[11px] font-semibold mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.tglLahir}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <label className={labelClass}>Status Hidup <span className="text-red-400">*</span></label>
                      <select
                        value={wargaForm.statusHidup}
                        onChange={e => setWargaForm({ ...wargaForm, statusHidup: e.target.value })}
                        className={inputClass('statusHidup')}
                      >
                        <option value="Hidup">Hidup</option>
                        <option value="Meninggal">Meninggal</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>No. HP <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        value={wargaForm.noHp}
                        onChange={e => setWargaForm({ ...wargaForm, noHp: e.target.value })}
                        placeholder="081234567890"
                        className={inputClass('noHp')}
                      />
                      {fieldErrors.noHp && <p className="text-red-500 text-[11px] font-semibold mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.noHp}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Umur <span className="text-red-400">*</span></label>
                      <input
                        type="number"
                        value={wargaForm.umur}
                        onChange={e => setWargaForm({ ...wargaForm, umur: e.target.value })}
                        placeholder="34"
                        className={inputClass('umur')}
                        min="1"
                      />
                      {fieldErrors.umur && <p className="text-red-500 text-[11px] font-semibold mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.umur}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="mt-8 flex items-center justify-between">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Wizard
                </button>

                <button
                  onClick={() => {
                    if (currentStep === 1) handleSubmitStep1();
                    else if (currentStep === 2) handleSubmitStep2();
                    else if (currentStep === 3) handleSubmitStep3();
                  }}
                  disabled={isLoading}
                  className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-200 cursor-pointer shadow-lg
                    ${isLoading
                      ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-500/20 hover:scale-[1.02] active:scale-95'
                    }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      {currentStep < 3 ? (
                        <>
                          Simpan & Lanjut
                          <ArrowRight className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Simpan Data Warga
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Info Panel & Residents Table */}
        <div className="space-y-6">
          {/* Current IDs */}
          <div className={`${cardClass} p-5`}>
            <h4 className="flex items-center gap-2 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              ID yang Tersimpan
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500">🏠 House ID</span>
                <span className={`text-sm font-black font-mono ${houseId !== null ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-600'}`}>
                  {houseId !== null ? houseId : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500">👨‍👩‍👧 Family ID</span>
                <span className={`text-sm font-black font-mono ${familyId !== null ? 'text-purple-600 dark:text-purple-400' : 'text-slate-300 dark:text-slate-600'}`}>
                  {familyId !== null ? familyId : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* API Flow Info */}
          <div className={`${cardClass} p-5`}>
            <h4 className="flex items-center gap-2 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
              <ClipboardList className="w-3.5 h-3.5 text-blue-500" />
              Alur Relasi Data
            </h4>
            <div className="space-y-2">
              {STEPS.map((step, idx) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-bold transition-all duration-300
                    ${completedSteps.includes(step.id)
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      : currentStep === step.id
                        ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                        : 'bg-slate-50 dark:bg-slate-800/30 border-slate-150 dark:border-slate-800 text-slate-400'
                    }`}
                >
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black
                    ${completedSteps.includes(step.id)
                      ? 'bg-emerald-500 text-white'
                      : currentStep === step.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                    }`}
                  >
                    {completedSteps.includes(step.id) ? '✓' : step.id}
                  </span>
                  <span className="flex-1">{step.endpoint}</span>
                  {idx < STEPS.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />}
                </div>
              ))}
            </div>
          </div>

          {/* Residents reference table (collapsible) */}
          <div className={`${cardClass} overflow-hidden`}>
            <button
              onClick={() => {
                setIsResidentsOpen(!isResidentsOpen);
                if (!isResidentsOpen) fetchResidents();
              }}
              className="w-full p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
            >
              <h4 className="flex items-center gap-2 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                Data KK Terdaftar ({residentsList.length})
              </h4>
              {isResidentsOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {isResidentsOpen && (
              <div className="border-t border-slate-100 dark:border-slate-800">
                {isLoadingResidents ? (
                  <div className="p-6 text-center">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-400 mx-auto mb-2" />
                    <span className="text-xs text-slate-400 font-semibold">Memuat data...</span>
                  </div>
                ) : residentsList.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 font-semibold">
                    Belum ada data KK terdaftar.
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-[11px]">
                      <thead className="sticky top-0 bg-slate-50 dark:bg-slate-950">
                        <tr className="text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                          <th className="px-4 py-2.5 text-left">ID</th>
                          <th className="px-4 py-2.5 text-left">No. KK</th>
                          <th className="px-4 py-2.5 text-left">Rumah</th>
                          <th className="px-4 py-2.5 text-left">Kepala</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {residentsList.map(r => (
                          <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                            <td className="px-4 py-2.5 font-mono font-bold text-slate-600 dark:text-slate-300">{r.id}</td>
                            <td className="px-4 py-2.5 font-mono text-slate-500">{r.no_kk}</td>
                            <td className="px-4 py-2.5 font-bold text-slate-500">{r.house_id}</td>
                            <td className="px-4 py-2.5 font-bold text-slate-500">{r.kepala_keluarga_id}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
