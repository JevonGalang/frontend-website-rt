import { useState } from 'react';
import { Send, FileText, CheckCircle2, ChevronRight, Printer, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function Layanan({ currentUser, submissionsList = [], setSubmissionsList }) {
  // Form State initialized from currentUser if logged in (dynamic key resets this state)
  const [formData, setFormData] = useState(() => ({
    wargaNama: currentUser && currentUser.role === 'warga' ? currentUser.name : '',
    wargaNik: currentUser && currentUser.role === 'warga' ? currentUser.nik : '',
    wargaNoKk: currentUser && currentUser.role === 'warga' ? currentUser.noKk : '',
    wargaAlamat: currentUser && currentUser.role === 'warga' ? currentUser.alamat : '',
    wargaKeperluan: '',
    wargaTipeSurat: 'Surat Pengantar Pembuatan KTP',
  }));

  const [submittedData, setSubmittedData] = useState(null);

  // Security Password Verification States for NIK & KK mask
  const [revealNik, setRevealNik] = useState(false);
  const [revealKk, setRevealKk] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [promptPasswordInput, setPromptPasswordInput] = useState('');
  const [promptError, setPromptError] = useState('');
  const [targetField, setTargetField] = useState(''); // 'nik' | 'kk'

  const handleRevealClick = (field) => {
    setTargetField(field);
    setPromptPasswordInput('');
    setPromptError('');
    setShowPasswordPrompt(true);
  };

  const handleConfirmPassword = (e) => {
    e.preventDefault();
    if (promptPasswordInput === currentUser.password) {
      if (targetField === 'nik') {
        setRevealNik(true);
      } else if (targetField === 'kk') {
        setRevealKk(true);
      }
      setShowPasswordPrompt(false);
    } else {
      setPromptError('Sandi akun salah.');
    }
  };

  const getDisplayNik = (fullNik) => {
    if (revealNik) return fullNik;
    if (!fullNik || fullNik.length < 12) return '****************';
    return fullNik.slice(0, 6) + '******' + fullNik.slice(12);
  };

  const getDisplayKk = (fullKk) => {
    if (revealKk) return fullKk;
    if (!fullKk || fullKk.length < 12) return '****************';
    return fullKk.slice(0, 6) + '******' + fullKk.slice(12);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const tipeSuratOptions = [
    'Surat Pengantar Pembuatan KTP',
    'Surat Pengantar Pembuatan Kartu Keluarga (KK)',
    'Surat Pengantar Pembuatan SKCK',
    'Surat Pengantar Domisili Tinggal',
    'Surat Keterangan Tidak Mampu (SKTM)',
    'Surat Pengantar Nikah',
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate submission delay
    setTimeout(() => {
      const newSubmission = {
        id: 'SRT-' + Math.floor(Math.random() * 90000 + 10000),
        wargaNama: formData.wargaNama,
        wargaNik: currentUser && currentUser.role === 'warga' ? currentUser.nik : formData.wargaNik,
        wargaNoKk: currentUser && currentUser.role === 'warga' ? currentUser.noKk : formData.wargaNoKk,
        wargaAlamat: formData.wargaAlamat,
        wargaTipeSurat: formData.wargaTipeSurat,
        wargaKeperluan: formData.wargaKeperluan,
        status: 'Pending',
        submissionDate: new Date().toISOString().split('T')[0],
      };

      const updatedSubmissions = [...submissionsList, newSubmission];
      setSubmissionsList(updatedSubmissions);
      localStorage.setItem('rt_submissions', JSON.stringify(updatedSubmissions));

      setSubmittedData(newSubmission);
      setIsSubmitting(false);
      
      // Clear form keperluan
      setFormData((prev) => ({
        ...prev,
        wargaKeperluan: '',
      }));
    }, 1200);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <section
      id="layanan"
      className="py-20 bg-slate-50 dark:bg-slate-900/40 relative border-b border-slate-100 dark:border-slate-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 font-sans">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl tracking-tight">
            Layanan Surat Pengantar Mandiri
          </h2>
          <p className="mt-4 text-base text-slate-655 dark:text-slate-400">
            Warga dapat mengajukan berkas surat pengantar RT secara online tanpa harus mengantre. Silakan lengkapi formulir di bawah ini dan pantau status persetujuannya.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {!submittedData ? (
            /* Form Mode */
            <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
              {/* Top Accent Bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500"></div>

              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Formulir Layanan Surat</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Isi data Anda untuk pengajuan yang akan diverifikasi oleh RT</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* NIK Input */}
                  <div className="space-y-2">
                    <label htmlFor="wargaNik" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Nomor Induk Kependudukan (NIK)
                    </label>
                    <div className="relative">
                      <input
                        required
                        disabled
                        type="text"
                        id="wargaNik"
                        name="wargaNik"
                        value={getDisplayNik(formData.wargaNik)}
                        placeholder="Masukkan NIK 16 digit"
                        maxLength={16}
                        className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-0 transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => revealNik ? setRevealNik(false) : handleRevealClick('nik')}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors p-0.5 cursor-pointer"
                        title={revealNik ? "Sembunyikan NIK" : "Tampilkan NIK (Perlu Sandi)"}
                      >
                        {revealNik ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* No KK Input */}
                  <div className="space-y-2">
                    <label htmlFor="wargaNoKk" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Nomor Kartu Keluarga (KK)
                    </label>
                    <div className="relative">
                      <input
                        required
                        disabled
                        type="text"
                        id="wargaNoKk"
                        name="wargaNoKk"
                        value={getDisplayKk(formData.wargaNoKk)}
                        placeholder="Masukkan No. KK 16 digit"
                        maxLength={16}
                        className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-0 transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => revealKk ? setRevealKk(false) : handleRevealClick('kk')}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors p-0.5 cursor-pointer"
                        title={revealKk ? "Sembunyikan KK" : "Tampilkan KK (Perlu Sandi)"}
                      >
                        {revealKk ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Nama Input */}
                <div className="space-y-2">
                  <label htmlFor="wargaNama" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Nama Lengkap (Sesuai KTP)
                  </label>
                  <input
                    required
                    type="text"
                    id="wargaNama"
                    name="wargaNama"
                    value={formData.wargaNama}
                    onChange={handleInputChange}
                    placeholder="Masukkan nama lengkap Anda"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>

                {/* Tipe Surat Select */}
                <div className="space-y-2">
                  <label htmlFor="wargaTipeSurat" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Pilih Keperluan Dokumen / Tipe Surat
                  </label>
                  <select
                    id="wargaTipeSurat"
                    name="wargaTipeSurat"
                    value={formData.wargaTipeSurat}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-semibold text-xs"
                  >
                    {tipeSuratOptions.map((option, idx) => (
                      <option key={idx} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                {/* Alamat Input */}
                <div className="space-y-2">
                  <label htmlFor="wargaAlamat" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Alamat Lengkap Rumah
                  </label>
                  <input
                    required
                    type="text"
                    id="wargaAlamat"
                    name="wargaAlamat"
                    value={formData.wargaAlamat}
                    onChange={handleInputChange}
                    placeholder="Contoh: Perumahan Sawangan Green Park Blok B3 No. 12"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>

                {/* Keperluan Textarea */}
                <div className="space-y-2">
                  <label htmlFor="wargaKeperluan" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Keperluan Pengajuan / Alasan Keterangan Lengkap
                  </label>
                  <textarea
                    required
                    rows={3}
                    id="wargaKeperluan"
                    name="wargaKeperluan"
                    value={formData.wargaKeperluan}
                    onChange={handleInputChange}
                    placeholder="Contoh: Mengurus kelengkapan dokumen pernikahan anak kandung pertama."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-500 dark:to-teal-400 text-white font-bold flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] hover:shadow-lg hover:shadow-emerald-500/15 cursor-pointer transition-all ${
                    isSubmitting ? 'opacity-70 pointer-events-none' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                      <span>Sedang Mengirim...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Kirim Pengajuan Surat</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* Success State & Receipt Preview (Best UX) */
            <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-8 sm:p-10 shadow-xl space-y-6 relative overflow-hidden print:p-0 print:border-none print:shadow-none animate-scale-up">
              {/* Success Info */}
              <div className="flex flex-col items-center text-center space-y-3 pb-6 border-b border-slate-100 dark:border-slate-700 print:hidden">
                <div className="p-4 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full text-emerald-500 animate-bounce">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">Pengajuan Berhasil Dikirim!</h3>
                <p className="text-slate-655 dark:text-slate-300 text-sm max-w-md">
                  Data pengisian Anda sudah tercatat di sistem RT Sawangan Green Park. Ketua RT (Pak Bambang Mulyono) akan segera memproses dokumen Anda.
                </p>
              </div>

              {/* Receipt Visual / Preview */}
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-6 border border-slate-150 dark:border-slate-800 font-sans print:bg-white print:border-slate-300">
                <div className="text-center pb-4 mb-4 border-b border-dashed border-slate-300 dark:border-slate-700">
                  <h4 className="font-extrabold text-slate-800 dark:text-white text-base">BUKTI PENGAJUAN SURAT PENGANTAR</h4>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-1">
                    RT 05 / RW 06 - Sawangan Green Park
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Tanggal Pengajuan: {submittedData.submissionDate}
                  </span>
                </div>

                <div className="space-y-3.5 text-sm">
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Nama Lengkap</span>
                    <span className="col-span-2 text-slate-905 dark:text-white font-bold">{submittedData.wargaNama}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">NIK</span>
                    <span className="col-span-2 text-slate-905 dark:text-white font-semibold font-mono flex items-center gap-1.5 animate-fade-in">
                      <span>{getDisplayNik(submittedData.wargaNik)}</span>
                      <button
                        onClick={() => revealNik ? setRevealNik(false) : handleRevealClick('nik')}
                        className="text-slate-400 hover:text-emerald-500 transition-colors p-0.5 cursor-pointer"
                        title={revealNik ? "Sembunyikan NIK" : "Tampilkan NIK (Perlu Sandi)"}
                      >
                        {revealNik ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Nomor KK</span>
                    <span className="col-span-2 text-slate-905 dark:text-white font-semibold font-mono flex items-center gap-1.5 animate-fade-in">
                      <span>{getDisplayKk(submittedData.wargaNoKk)}</span>
                      <button
                        onClick={() => revealKk ? setRevealKk(false) : handleRevealClick('kk')}
                        className="text-slate-450 hover:text-emerald-500 transition-colors p-0.5 cursor-pointer"
                        title={revealKk ? "Sembunyikan KK" : "Tampilkan KK (Perlu Sandi)"}
                      >
                        {revealKk ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Jenis Surat</span>
                    <span className="col-span-2 text-emerald-600 dark:text-emerald-450 font-bold">{submittedData.wargaTipeSurat}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Alamat Rumah</span>
                    <span className="col-span-2 text-slate-905 dark:text-white">{submittedData.wargaAlamat}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Keperluan</span>
                    <span className="col-span-2 text-slate-700 dark:text-slate-300 italic">"{submittedData.wargaKeperluan}"</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
                  <p>Harap bawa KTP asli Anda saat pengambilan surat fisik ke kediaman Ketua RT.</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2 print:hidden">
                <button
                  onClick={handlePrint}
                  className="flex-1 py-3 px-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Printer className="w-5 h-5" />
                  <span>Cetak / Simpan PDF</span>
                </button>
                <button
                  onClick={() => setSubmittedData(null)}
                  className="flex-1 py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-850 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <span>Ajukan Surat Baru</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Riwayat Pengajuan Surat (Only visible for logged-in citizens) */}
        {currentUser && currentUser.role === 'warga' && (
          <div className="max-w-3xl mx-auto mt-16 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-xl print:hidden animate-fade-in font-sans">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-905 dark:text-white">Riwayat Pengajuan Surat Anda</h3>
              <p className="text-xs text-slate-555 dark:text-slate-400">Pantau status persetujuan berkas pengantar yang telah Anda kirimkan.</p>
            </div>
            
            <div className="overflow-x-auto border border-slate-150 dark:border-slate-700 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-150 dark:border-slate-700 font-extrabold uppercase text-slate-400 tracking-wider">
                    <th className="p-4">ID / Tanggal</th>
                    <th className="p-4">Tipe Surat</th>
                    <th className="p-4">Keperluan</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-700 text-slate-700 dark:text-slate-200">
                  {submissionsList.filter(s => s.wargaNik === currentUser.nik).length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-400 dark:text-slate-500 font-bold">
                        Belum ada riwayat pengajuan surat pengantar.
                      </td>
                    </tr>
                  ) : (
                    submissionsList
                      .filter(s => s.wargaNik === currentUser.nik)
                      .slice().reverse()
                      .map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                          <td className="p-4 font-mono">
                            <span className="font-bold block">{sub.id}</span>
                            <span className="text-[10px] text-slate-450">{sub.submissionDate}</span>
                          </td>
                          <td className="p-4 font-bold text-emerald-600 dark:text-emerald-450">{sub.wargaTipeSurat}</td>
                          <td className="p-4 italic max-w-[200px] truncate" title={sub.wargaKeperluan}>
                            "{sub.wargaKeperluan}"
                          </td>
                          <td className="p-4 text-center">
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
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => setSubmittedData(sub)}
                              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-bold text-[10px] rounded-xl transition-colors cursor-pointer"
                            >
                              Lihat Bukti
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PASSWORD PROMPT MODAL FOR REVEALING NIK & KK */}
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
                <p className="text-[11px] text-slate-550 dark:text-slate-400 mt-1">
                  Masukkan sandi akun Anda untuk membuka {targetField === 'nik' ? 'data NIK lengkap.' : 'data nomor KK lengkap.'}
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
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-805 rounded-xl outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
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
                    className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 font-bold rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
