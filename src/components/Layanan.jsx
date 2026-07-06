import React, { useState } from 'react';
import { Send, FileText, CheckCircle2, ChevronRight, Download, Printer } from 'lucide-react';

export default function Layanan() {
  // Form State
  const [formData, setFormData] = useState({
    wargaNama: '',
    wargaNik: '',
    wargaNoKk: '',
    wargaAlamat: '',
    wargaKeperluan: '',
    wargaTipeSurat: 'Surat Pengantar Pembuatan KTP',
  });

  const [submittedData, setSubmittedData] = useState(null);
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

    // Simulate backend API request duration
    setTimeout(() => {
      const newSubmission = {
        id: 'SRT-' + Math.floor(Math.random() * 900000 + 100000),
        submissionDate: new Date().toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        ...formData,
      };

      setSubmittedData(newSubmission);
      setIsSubmitting(false);

      // Save to local storage for dummy persistence
      const currentSubmissions = JSON.parse(localStorage.getItem('rt_submissions') || '[]');
      currentSubmissions.push(newSubmission);
      localStorage.setItem('rt_submissions', JSON.stringify(currentSubmissions));

      // Reset form
      setFormData({
        wargaNama: '',
        wargaNik: '',
        wargaNoKk: '',
        wargaAlamat: '',
        wargaKeperluan: '',
        wargaTipeSurat: 'Surat Pengantar Pembuatan KTP',
      });
    }, 1500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <section
      id="layanan"
      className="py-20 bg-slate-50 dark:bg-slate-900"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
            Layanan Mandiri
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Pengajuan Surat Pengantar Online
          </p>
          <div className="w-12 h-1 bg-emerald-500 mx-auto rounded-full"></div>
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
                    <input
                      required
                      type="text"
                      id="wargaNik"
                      name="wargaNik"
                      value={formData.wargaNik}
                      onChange={handleInputChange}
                      placeholder="Masukkan NIK 16 digit"
                      maxLength={16}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>

                  {/* No KK Input */}
                  <div className="space-y-2">
                    <label htmlFor="wargaNoKk" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Nomor Kartu Keluarga (KK)
                    </label>
                    <input
                      required
                      type="text"
                      id="wargaNoKk"
                      name="wargaNoKk"
                      value={formData.wargaNoKk}
                      onChange={handleInputChange}
                      placeholder="Masukkan No. KK 16 digit"
                      maxLength={16}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
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
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  >
                    {tipeSuratOptions.map((option, idx) => (
                      <option key={idx} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                {/* Alamat Input */}
                <div className="space-y-2">
                  <label htmlFor="wargaAlamat" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Alamat Lengkap Rumah (No. Blok / Unit)
                  </label>
                  <textarea
                    required
                    rows={3}
                    id="wargaAlamat"
                    name="wargaAlamat"
                    value={formData.wargaAlamat}
                    onChange={handleInputChange}
                    placeholder="Sawangan Green Park Blok X No. Y"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none"
                  />
                </div>

                {/* Keperluan Text */}
                <div className="space-y-2">
                  <label htmlFor="wargaKeperluan" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Alasan / Detail Keperluan
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
                <p className="text-slate-600 dark:text-slate-300 text-sm max-w-md">
                  Data pengisian Anda sudah tercatat di sistem RT Sawangan Green Park. Ketua RT (Pak Bambang Mulyono) akan segera memproses dokumen Anda.
                </p>
              </div>

              {/* Receipt Visual / Preview */}
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-6 border border-slate-150 dark:border-slate-800 font-sans print:bg-white print:border-slate-300">
                <div className="text-center pb-4 mb-4 border-b border-dashed border-slate-300 dark:border-slate-700">
                  <h4 className="font-extrabold text-slate-800 dark:text-white text-base">BUKTI PENGAJUAN SURAT PENGANTAR</h4>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-1">
                    RT 04 / RW 09 - Sawangan Green Park
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Tanggal Pengajuan: {submittedData.submissionDate}
                  </span>
                </div>

                <div className="space-y-3.5 text-sm">
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Nama Lengkap</span>
                    <span className="col-span-2 text-slate-900 dark:text-white font-bold">{submittedData.wargaNama}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">NIK</span>
                    <span className="col-span-2 text-slate-900 dark:text-white font-semibold font-mono">{submittedData.wargaNik}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Nomor KK</span>
                    <span className="col-span-2 text-slate-900 dark:text-white font-semibold font-mono">{submittedData.wargaNoKk}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Jenis Surat</span>
                    <span className="col-span-2 text-emerald-600 dark:text-emerald-400 font-bold">{submittedData.wargaTipeSurat}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Alamat Rumah</span>
                    <span className="col-span-2 text-slate-900 dark:text-white">{submittedData.wargaAlamat}</span>
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

      </div>
    </section>
  );
}
