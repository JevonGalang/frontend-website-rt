import { useState } from 'react';
import { 
  Edit2, Save, X, Eye, EyeOff, 
  CheckCircle2, AlertCircle, Info
} from 'lucide-react';

export default function ProfilWarga({ currentUser, onUpdateProfile, wargaList = [] }) {
  const [isEditing, setIsEditing] = useState(false);
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
  }));

  const [revealNik, setRevealNik] = useState(false);
  const [revealKk, setRevealKk] = useState(false);
  const [revealPassword, setRevealPassword] = useState(false);

  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [promptPasswordInput, setPromptPasswordInput] = useState('');
  const [promptError, setPromptError] = useState('');
  const [pendingAction, setPendingAction] = useState(''); // 'edit' | 'reveal_nik' | 'reveal_kk' | 'reveal_pwd'

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
      });
    }
    setIsEditing(false);
  };

  const handleRevealToggle = (field) => {
    if (field === 'nik') {
      if (revealNik) {
        setRevealNik(false);
      } else {
        setPendingAction('reveal_nik');
        setPromptPasswordInput('');
        setPromptError('');
        setShowPasswordPrompt(true);
      }
    } else if (field === 'kk') {
      if (revealKk) {
        setRevealKk(false);
      } else {
        setPendingAction('reveal_kk');
        setPromptPasswordInput('');
        setPromptError('');
        setShowPasswordPrompt(true);
      }
    } else if (field === 'password') {
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
      } else if (pendingAction === 'reveal_nik') {
        setRevealNik(true);
      } else if (pendingAction === 'reveal_kk') {
        setRevealKk(true);
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
    if (formData.nik.length !== 16 || isNaN(formData.nik)) {
      setError('NIK harus berupa 16 digit angka.');
      return;
    }
    if (formData.noKk.length !== 16 || isNaN(formData.noKk)) {
      setError('Nomor KK harus berupa 16 digit angka.');
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

    // Check NIK uniqueness
    const nikExists = wargaList.some((w) => w.id !== currentUser.id && w.nik === formData.nik);
    if (nikExists) {
      setError('NIK sudah terdaftar pada warga lain.');
      return;
    }

    // Save changes
    const updatedCitizen = {
      ...currentUser,
      name: formData.name,
      username: formData.username,
      password: formData.password,
      nik: formData.nik,
      noKk: formData.noKk,
      alamat: formData.alamat,
      gender: formData.gender,
      usia: parseInt(formData.usia) || 30,
      status: formData.status,
    };

    onUpdateProfile(updatedCitizen);
    setIsEditing(false);
    setSuccess('Biodata profil Anda berhasil diperbarui!');
    setTimeout(() => setSuccess(''), 2500);
  };

  const getDisplayNik = (fullNik) => {
    if (revealNik || isEditing) return fullNik;
    if (!fullNik || fullNik.length < 12) return '****************';
    return fullNik.slice(0, 6) + '******' + fullNik.slice(12);
  };

  const getDisplayKk = (fullKk) => {
    if (revealKk || isEditing) return fullKk;
    if (!fullKk || fullKk.length < 12) return '****************';
    return fullKk.slice(0, 6) + '******' + fullKk.slice(12);
  };

  const getDisplayPassword = (fullPassword) => {
    if (revealPassword || isEditing) return fullPassword;
    return '******';
  };

  if (!currentUser || currentUser.role !== 'warga') return null;

  return (
    <section
      id="profil-saya"
      className="py-20 bg-white dark:bg-slate-950 relative border-b border-slate-100 dark:border-slate-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 font-sans">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl tracking-tight">
            Profil & Biodata Saya
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
            Kelola data administrasi kependudukan Anda secara mandiri. Pastikan data terisi dengan benar untuk keperluan pengurusan berkas.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="relative group w-full">
            {/* Ambient outer glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur opacity-15 group-hover:opacity-20 transition duration-1000"></div>

            <div className="relative bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8">
              
              {/* Card top branding */}
              <div className="flex flex-col sm:flex-row justify-between items-center pb-6 border-b border-slate-100 dark:border-slate-800 gap-4">
                <div className="flex items-center gap-3.5 text-center sm:text-left">
                  <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450 font-black flex items-center justify-center rounded-2xl text-xl shadow-inner">
                    {currentUser.name ? currentUser.name.charAt(0) : 'W'}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                      {currentUser.name}
                    </h3>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider px-2 py-0.5 rounded mt-1.5 inline-block">
                      ID Warga: {currentUser.id}
                    </span>
                  </div>
                </div>

                {!isEditing && (
                  <button
                    onClick={handleEditClick}
                    className="px-4.5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white dark:text-emerald-450 dark:hover:text-white font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Biodata</span>
                  </button>
                )}
              </div>

              {/* Feedback Messages */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2 animate-pulse">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-emerald-600 dark:text-emerald-450 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 animate-bounce" />
                  <span>{success}</span>
                </div>
              )}

              {isEditing ? (
                /* EDITING PROFILE FORM */
                <form onSubmit={handleSubmit} className="space-y-6 text-xs sm:text-sm font-sans">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-600 dark:text-slate-400">Nama Lengkap *</label>
                      <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-600 dark:text-slate-400">Username Login *</label>
                      <input
                        required
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-600 dark:text-slate-400">NIK (16 Digit) *</label>
                      <input
                        required
                        type="text"
                        maxLength={16}
                        value={formData.nik}
                        onChange={(e) => setFormData({ ...formData, nik: e.target.value.replace(/\D/g, '') })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-emerald-500 text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-600 dark:text-slate-400">No. Kartu Keluarga (16 Digit) *</label>
                      <input
                        required
                        type="text"
                        maxLength={16}
                        value={formData.noKk}
                        onChange={(e) => setFormData({ ...formData, noKk: e.target.value.replace(/\D/g, '') })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-emerald-500 text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5 col-span-2">
                      <label className="font-bold text-slate-600 dark:text-slate-400">Jenis Kelamin</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-emerald-500 text-slate-900 dark:text-white font-semibold"
                      >
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-600 dark:text-slate-400">Usia (Thn) *</label>
                      <input
                        required
                        type="number"
                        min="1"
                        max="120"
                        value={formData.usia}
                        onChange={(e) => setFormData({ ...formData, usia: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-600 dark:text-slate-400">Status Tempat Tinggal</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-emerald-500 text-slate-900 dark:text-white font-semibold"
                      >
                        <option value="Tetap">Tetap</option>
                        <option value="Kontrak">Kontrak</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-600 dark:text-slate-400">Password Sandi Akun *</label>
                      <input
                        required
                        type="text"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 dark:text-slate-400">Alamat Rumah Lengkap *</label>
                    <textarea
                      required
                      rows={2}
                      value={formData.alamat}
                      onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none resize-none focus:border-emerald-500 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-bold rounded-xl cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      <span>Simpan Perubahan</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-6 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      <span>Batal</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* READ-ONLY PROFILE DETAIL VIEW */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs sm:text-sm font-sans">
                  {/* Left stats/visual column */}
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-4">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
                        Dokumen Administrasi
                      </span>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">NIK Penduduk</span>
                        <div className="font-semibold text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
                          <span>{getDisplayNik(currentUser.nik)}</span>
                          <button
                            onClick={() => handleRevealToggle('nik')}
                            className="text-slate-400 hover:text-emerald-500 transition-colors p-0.5 cursor-pointer"
                            title={revealNik ? "Sembunyikan NIK" : "Tampilkan NIK (Perlu Sandi)"}
                          >
                            {revealNik ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Nomor KK</span>
                        <div className="font-semibold text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
                          <span>{getDisplayKk(currentUser.noKk)}</span>
                          <button
                            onClick={() => handleRevealToggle('kk')}
                            className="text-slate-400 hover:text-emerald-500 transition-colors p-0.5 cursor-pointer"
                            title={revealKk ? "Sembunyikan KK" : "Tampilkan KK (Perlu Sandi)"}
                          >
                            {revealKk ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-4">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
                        Akun & Keamanan
                      </span>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Username Login</span>
                        <span className="font-bold text-slate-900 dark:text-white">{currentUser.username}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Sandi Akun</span>
                        <div className="font-semibold text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
                          <span>{getDisplayPassword(currentUser.password)}</span>
                          <button
                            onClick={() => handleRevealToggle('password')}
                            className="text-slate-400 hover:text-emerald-500 transition-colors p-0.5 cursor-pointer"
                            title={revealPassword ? "Sembunyikan Sandi" : "Tampilkan Sandi (Perlu Sandi)"}
                          >
                            {revealPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Personal Data Column */}
                  <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-4">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
                      Biodata Warga
                    </span>

                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Jenis Kelamin</span>
                      <span className="font-bold text-slate-850 dark:text-slate-200">{currentUser.gender}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Usia</span>
                      <span className="font-bold text-slate-850 dark:text-slate-200">{currentUser.usia} Tahun</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Status Rumah</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-450">{currentUser.status}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/50">
                      <span className="text-slate-500 font-semibold block mb-1 text-xs">Alamat Rumah Lengkap</span>
                      <span className="text-slate-800 dark:text-slate-200 italic font-medium leading-relaxed block text-xs">
                        "{currentUser.alamat}"
                      </span>
                    </div>

                    {/* Notice bar */}
                    <div className="mt-4 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-[10px] text-slate-450 dark:text-slate-400 leading-snug flex gap-2">
                      <Info className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>Data ini sinkron langsung ke database RT. Pastikan data valid karena akan digunakan otomatis untuk form persuratan.</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>

      {/* PASSWORD VERIFICATION MODAL */}
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
                Masukkan sandi akun Anda untuk {pendingAction === 'edit' ? 'mengedit data profil.' : pendingAction === 'reveal_nik' ? 'membuka data NIK.' : pendingAction === 'reveal_kk' ? 'membuka data No. KK.' : 'membuka sandi akun.'}
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
                placeholder="Masukkan Sandi Akun Anda"
                value={promptPasswordInput}
                onChange={(e) => setPromptPasswordInput(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
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
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl cursor-pointer"
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
