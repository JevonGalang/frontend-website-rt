import { useState } from 'react';
import { 
  Edit2, Save, X, Eye, EyeOff, 
  CheckCircle2, AlertCircle,
  Grid, FileText, Lock, Settings,
  Heart, MessageCircle, Send, Key
} from 'lucide-react';

export default function ProfilWarga({ 
  currentUser, 
  onUpdateProfile, 
  wargaList = [],
  submissionsList = []
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [profileTab, setProfileTab] = useState('biodata'); // 'biodata' | 'surat' | 'keamanan'
  
  const [formData, setFormData] = useState(() => ({
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
  }));

  const [revealPassword, setRevealPassword] = useState(false);

  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [promptPasswordInput, setPromptPasswordInput] = useState('');
  const [promptError, setPromptError] = useState('');
  const [pendingAction, setPendingAction] = useState(''); // 'edit' | 'reveal_pwd'

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCancel = () => {
    if (currentUser) {
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
      });
    }
    setIsEditing(false);
  };

  const handleEditClick = () => {
    setPendingAction('edit');
    setPromptPasswordInput('');
    setPromptError('');
    setShowPasswordPrompt(true);
  };

  const handleRevealToggle = (field) => {
    if (field === 'password') {
      if (revealPassword) {
        setRevealPassword(false);
      } else {
        setPendingAction('reveal_pwd');
        setPromptPasswordInput('');
        setPromptError('');
        setShowPasswordPrompt(true);
      }
    }
  };

  const handleConfirmPassword = (e) => {
    e.preventDefault();
    if (promptPasswordInput === currentUser.password) {
      setShowPasswordPrompt(false);
      if (pendingAction === 'edit') {
        setIsEditing(true);
      } else if (pendingAction === 'reveal_pwd') {
        setRevealPassword(true);
      }
    } else {
      setPromptError('Sandi akun salah.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      setError('Kolom Email wajib diisi.');
      return;
    }
    if (!emailRegex.test(formData.email)) {
      setError('Format email tidak valid (contoh: nama@domain.com).');
      return;
    }
    if (formData.username.length < 3) {
      setError('Username minimal harus 3 karakter.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password minimal harus 8 karakter.');
      return;
    }
    if (!formData.name || !formData.username || !formData.password || !formData.alamat || !formData.usia) {
      setError('Semua kolom wajib diisi.');
      return;
    }

    // Check username uniqueness
    const usernameExists = wargaList.some(
      (w) => w.id !== currentUser.id && (w.username.toLowerCase() === formData.username.toLowerCase() || formData.username.toLowerCase() === 'admin')
    );
    if (usernameExists) {
      setError('Username sudah digunakan oleh warga lain.');
      return;
    }

    // Save changes
    const updatedCitizen = {
      ...currentUser,
      name: formData.name,
      username: formData.username,
      password: formData.password,
      nik: currentUser.nik,
      noKk: currentUser.noKk,
      alamat: formData.alamat,
      gender: formData.gender,
      usia: parseInt(formData.usia) || 30,
      status: formData.status,
      email: formData.email,
    };

    onUpdateProfile(updatedCitizen);
    setIsEditing(false);
    setSuccess('Biodata profil Anda berhasil diperbarui!');
    setTimeout(() => setSuccess(''), 2505);
  };

  const getDisplayPassword = (fullPassword) => {
    if (revealPassword || isEditing) return fullPassword;
    return '******';
  };

  if (!currentUser || currentUser.role !== 'warga') return null;

  // Filter submissions by this citizen
  const mySubmissions = submissionsList.filter(
    (sub) => sub.wargaNama?.toLowerCase() === currentUser.name?.toLowerCase() ||
             sub.wargaNik === currentUser.nik
  );

  return (
    <section
      id="profil-saya"
      className="py-12 bg-white dark:bg-slate-950 relative border-b border-slate-200 dark:border-slate-800"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* IG Header Section */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-center md:items-start pb-8 border-b border-slate-200 dark:border-slate-800">
          
          {/* Avatar with Story Gradient Ring */}
          <div className="relative flex-shrink-0">
            <div className="p-[3.5px] bg-gradient-to-tr from-yellow-500 via-red-505 via-pink-500 to-purple-600 rounded-full shadow-md animate-pulse-slow">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white dark:border-slate-950 bg-slate-100 dark:bg-slate-900 flex items-center justify-center font-black text-slate-800 dark:text-white text-3xl sm:text-4xl shadow-inner select-none">
                {currentUser.name ? currentUser.name.charAt(0) : 'W'}
              </div>
            </div>
            <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-4 border-white dark:border-slate-955 rounded-full" title="Sesi Warga Aktif"></span>
          </div>

          {/* User Details & IG actions */}
          <div className="flex-1 space-y-4.5 text-center md:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                @{currentUser.username}
              </h2>
              
              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <button
                    onClick={handleEditClick}
                    className="px-5 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit Profil</span>
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      form="ig-profile-form"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Save className="w-3 h-3" />
                      <span>Simpan</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-850 dark:text-slate-200 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      <span>Batal</span>
                    </button>
                  </div>
                )}
                <button className="p-2 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors cursor-pointer">
                  <Settings className="w-4 h-4 animate-spin-slow" />
                </button>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center justify-center md:justify-start gap-5 sm:gap-7 border-y border-slate-100 dark:border-slate-800/80 py-3 text-xs sm:text-sm">
              <div>
                <span className="font-extrabold text-slate-900 dark:text-white mr-1">
                  {mySubmissions.length}
                </span>
                <span className="text-slate-500 dark:text-slate-400">Pengajuan</span>
              </div>
              <div>
                <span className="font-extrabold text-slate-900 dark:text-white mr-1">
                  {currentUser.status || 'Tetap'}
                </span>
                <span className="text-slate-500 dark:text-slate-400">Tinggal</span>
              </div>
              <div>
                <span className="font-extrabold text-slate-900 dark:text-white mr-1">
                  RT 04
                </span>
                <span className="text-slate-500 dark:text-slate-400">Wilayah</span>
              </div>
              <div>
                <span className={`font-extrabold mr-1 ${currentUser.statusIuran?.includes('Menunggak') ? 'text-rose-500 dark:text-rose-450' : 'text-emerald-600 dark:text-emerald-450'}`}>
                  {currentUser.statusIuran || 'Lunas'}
                </span>
                <span className="text-slate-500 dark:text-slate-400">Iuran</span>
              </div>
            </div>

            {/* Bio info */}
            <div className="space-y-1 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-350">
              <p className="font-black text-slate-900 dark:text-white text-base">
                {currentUser.name}
              </p>
              <p className="text-slate-400 dark:text-slate-500 italic">
                Warga Mandiri Sawangan Green Park • ID #{currentUser.id}
              </p>
              <p className="pt-1.5 flex items-center justify-center md:justify-start gap-1">
                <span>🏠</span>
                <span>{currentUser.alamat}</span>
              </p>
              <p className="flex items-center justify-center md:justify-start gap-3 text-slate-500 text-xs">
                <span>🎂 {currentUser.usia} Tahun</span>
                <span>•</span>
                <span>{currentUser.gender === 'Laki-laki' ? '♂️ Laki-laki' : '♀️ Perempuan'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* IG-style Tabs Navbar */}
        <div className="flex justify-center border-t border-slate-200 dark:border-slate-800 mt-6 font-sans">
          <div className="flex gap-12 sm:gap-16">
            <button
              onClick={() => setProfileTab('biodata')}
              className={`flex items-center gap-1.5 py-4 border-t-2 transition-all cursor-pointer text-xs uppercase tracking-widest font-extrabold ${
                profileTab === 'biodata'
                  ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white opacity-100'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 opacity-60'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Biodata</span>
            </button>

            <button
              onClick={() => setProfileTab('surat')}
              className={`flex items-center gap-1.5 py-4 border-t-2 transition-all cursor-pointer text-xs uppercase tracking-widest font-extrabold ${
                profileTab === 'surat'
                  ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white opacity-100'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 opacity-60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Surat Saya</span>
            </button>

            <button
              onClick={() => setProfileTab('keamanan')}
              className={`flex items-center gap-1.5 py-4 border-t-2 transition-all cursor-pointer text-xs uppercase tracking-widest font-extrabold ${
                profileTab === 'keamanan'
                  ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white opacity-100'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 opacity-60'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Keamanan</span>
            </button>
          </div>
        </div>

        {/* Tab content area */}
        <div className="mt-2">
          
          {/* Feedback alerts */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* TAB 1: BIODATA */}
          {profileTab === 'biodata' && (
            isEditing ? (
              <form id="ig-profile-form" onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm font-sans pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 dark:text-slate-400">Nama Lengkap *</label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-905 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-emerald-500 text-slate-900 dark:text-white font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 dark:text-slate-400">Status Tempat Tinggal</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-905 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-emerald-500 text-slate-900 dark:text-white font-bold text-xs"
                    >
                      <option value="Tetap">Tetap</option>
                      <option value="Kontrak">Kontrak</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <label className="font-bold text-slate-655 dark:text-slate-400">Jenis Kelamin</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-905 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-emerald-500 text-slate-900 dark:text-white font-semibold text-xs"
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-655 dark:text-slate-400">Usia (Thn) *</label>
                    <input
                      required
                      type="number"
                      min="1"
                      max="120"
                      value={formData.usia}
                      onChange={(e) => setFormData({ ...formData, usia: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-905 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-emerald-500 text-slate-900 dark:text-white font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-655 dark:text-slate-400">Alamat Rumah Lengkap *</label>
                  <textarea
                    required
                    rows={2}
                    value={formData.alamat}
                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-905 border border-slate-200 dark:border-slate-800 rounded-xl outline-none resize-none focus:border-emerald-500 text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans text-xs sm:text-sm pt-6">
                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Nama Lengkap</span>
                  <span className="font-extrabold text-slate-950 dark:text-white">{currentUser.name}</span>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Status Rumah</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-450">{currentUser.status}</span>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 sm:col-span-2 rounded-2xl space-y-1.5">
                  <span className="text-slate-500 font-semibold block text-xs">Alamat Domisili Rumah</span>
                  <p className="text-slate-800 dark:text-slate-200 italic font-medium leading-relaxed">
                    "{currentUser.alamat}"
                  </p>
                </div>
              </div>
            )
          )}

          {/* TAB 2: SURAT SAYA (Submissions Grid like IG posts) */}
          {profileTab === 'surat' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-6 font-sans">
              {mySubmissions.length === 0 ? (
                <div className="col-span-full py-16 text-center text-slate-400 dark:text-slate-550 font-bold italic text-xs">
                  Belum ada riwayat pengajuan surat pengantar dari Anda.
                </div>
              ) : (
                mySubmissions.map((sub) => (
                  <div key={sub.id} className="bg-slate-50 dark:bg-slate-900/20 border border-slate-200/60 dark:border-slate-850 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300">
                    
                    {/* IG Post Header */}
                    <div className="p-3 border-b border-slate-150 dark:border-slate-850 flex justify-between items-center bg-white dark:bg-slate-900/50">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-[9px] font-black text-white uppercase">
                          {currentUser.username.charAt(0)}
                        </div>
                        <span className="text-[10.5px] font-extrabold text-slate-800 dark:text-slate-200">
                          {sub.wargaNama}
                        </span>
                      </div>
                      <span className="text-[8px] font-mono text-slate-400 font-bold bg-slate-100 dark:bg-slate-855 px-2 py-0.5 rounded-full">
                        {sub.id}
                      </span>
                    </div>

                    {/* IG Post Image Area: Document Visual */}
                    <div className="aspect-square bg-slate-100/70 dark:bg-slate-950/70 flex flex-col justify-center items-center p-6 text-center relative select-none">
                      <FileText className="w-12 h-12 text-slate-300 dark:text-slate-800 animate-pulse-slow mb-3.5" />
                      <h5 className="font-extrabold text-slate-800 dark:text-white text-[11px] leading-snug px-2">
                        {sub.wargaTipeSurat}
                      </h5>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 max-w-[150px] line-clamp-2">
                        {sub.wargaKeperluan}
                      </p>
                    </div>

                    {/* IG Post Interaction Details */}
                    <div className="p-3 bg-white dark:bg-slate-900/50 space-y-2">
                      <div className="flex items-center gap-3.5 text-slate-600 dark:text-slate-400">
                        <Heart className={`w-4.5 h-4.5 cursor-pointer hover:scale-110 active:scale-95 transition-transform ${sub.status === 'Completed' || sub.status === 'Approved' ? 'fill-rose-500 text-rose-500 animate-bounce' : 'text-slate-400'}`} />
                        <MessageCircle className="w-4.5 h-4.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" />
                        <Send className="w-4.5 h-4.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" />
                      </div>

                      <div className="text-[11px] font-bold text-slate-850 dark:text-slate-200">
                        Status: {' '}
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold inline-block ${
                          sub.status === 'Completed'
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                            : sub.status === 'Approved'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                            : sub.status === 'Rejected'
                            ? 'bg-red-50 dark:bg-red-950/40 text-red-600'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 animate-pulse'
                        }`}>
                          {sub.status || 'Pending'}
                        </span>
                      </div>
                      
                      <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                        Diajukan: {sub.submissionDate || '12 Juni 2026'}
                      </div>
                    </div>

                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: KEAMANAN (Credentials) */}
          {profileTab === 'keamanan' && (
            isEditing ? (
              <form id="ig-profile-form" onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm font-sans pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-655 dark:text-slate-400">Username Login *</label>
                    <input
                      required
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-905 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-emerald-500 text-slate-900 dark:text-white font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-655 dark:text-slate-400">Email Warga *</label>
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-905 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-emerald-500 text-slate-900 dark:text-white font-semibold"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-655 dark:text-slate-400">Kata Sandi Baru * (Min 8 karakter)</label>
                  <input
                    required
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-905 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-emerald-500 text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans text-xs sm:text-sm pt-6">
                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Username Login</span>
                  <span className="font-extrabold text-slate-950 dark:text-white font-mono">@{currentUser.username}</span>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Email Terdaftar</span>
                  <span className="font-extrabold text-slate-955 dark:text-white font-medium">{currentUser.email || '-'}</span>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 sm:col-span-2 rounded-2xl flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Sandi Akun (Tersensor)</span>
                  <div className="font-bold text-slate-955 dark:text-white font-mono flex items-center gap-1.5">
                    <span>{getDisplayPassword(currentUser.password)}</span>
                    <button
                      onClick={() => handleRevealToggle('password')}
                      className="text-slate-400 hover:text-emerald-500 transition-colors p-0.5 cursor-pointer"
                      title={revealPassword ? "Sembunyikan Sandi" : "Tampilkan Sandi (Masukkan Password)"}
                    >
                      {revealPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            )
          )}

        </div>

      </div>

      {/* PASSWORD GATE PROMPT MODAL */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setShowPasswordPrompt(false)}
          ></div>

          <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-2xl overflow-hidden z-10 animate-scale-up">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>

            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                <Key className="w-4 h-4 text-emerald-500" />
                <span>Verifikasi Sandi Akun</span>
              </h3>
              <button 
                onClick={() => setShowPasswordPrompt(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPassword} className="p-5 space-y-4 font-sans text-xs">
              <p className="text-slate-500 dark:text-slate-400">
                Demi keamanan data kependudukan, silakan masukkan kata sandi akun Anda untuk melanjutkan tindakan ini.
              </p>
              
              <div className="space-y-1.5">
                <input
                  required
                  autoFocus
                  type="password"
                  placeholder="Masukkan sandi akun Anda"
                  value={promptPasswordInput}
                  onChange={(e) => {
                    setPromptPasswordInput(e.target.value);
                    setPromptError('');
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                />
                {promptError && (
                  <span className="text-red-500 font-semibold block">{promptError}</span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors cursor-pointer text-xs"
                >
                  Verifikasi
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordPrompt(false)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-bold cursor-pointer text-xs text-slate-700 dark:text-slate-350"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </section>
  );
}
