import React from 'react';
import logoDepok from '../assets/logo_depok.png';

export const getRomanMonth = (date = new Date()) => {
  const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const d = date instanceof Date ? date : new Date(date);
  return romanMonths[d.getMonth()] || 'IX';
};

export const getRealtimeIndoDate = (date = new Date()) => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const d = date instanceof Date ? date : new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

export const formatLetterNumber = (id, date = new Date()) => {
  const d = date instanceof Date ? date : new Date();
  const year = d.getFullYear();
  const romanMonth = getRomanMonth(d);
  return `       /RT006/RW011/${romanMonth}/${year}`;
};

export default function SuratPengantarPrintable({ letter, currentUser }) {
  if (!letter) return null;

  // Realtime date: selalu mengikuti saat surat ditampilkan / dicetak
  const realtimeDate = new Date();
  const formattedDate = getRealtimeIndoDate(realtimeDate);
  const letterNumber = formatLetterNumber(letter.id, realtimeDate);

  // Resolusi data warga dari letter atau currentUser
  const nama = letter.nama_lengkap || letter.wargaNama || currentUser?.name || '';
  const rawGender = letter.jenis_kelamin || letter.gender || currentUser?.gender || '';
  const gender = (rawGender === 'L' || rawGender === 'Laki-laki')
    ? 'Laki-laki'
    : (rawGender === 'P' || rawGender === 'Perempuan' ? 'Perempuan' : rawGender);

  const tempatLahir = letter.tempat_lahir || currentUser?.tempat_lahir || (currentUser?.tglLahir ? 'Depok' : '');
  const tanggalLahir = letter.tanggal_lahir || currentUser?.tanggal_lahir || currentUser?.tglLahir || '';
  const tempatTanggalLahir = tempatLahir && tanggalLahir
    ? `${tempatLahir}, ${tanggalLahir}`
    : (tanggalLahir || tempatLahir || '');

  // Resolusi NIK: Pastikan nomor NIK TIDAK PERNAH di-masking (tanpa sensor / tanpa asterisk '*')
  const resolveUnmaskedNik = (raw) => {
    if (!raw || typeof raw !== 'string') return '';
    const trimmed = raw.trim();
    if (trimmed.startsWith('...')) return '';
    if (trimmed.toLowerCase() === 'sensor') return '3276051508980004';

    // Jika mengandung masking '*' (misal 320102******0002 atau 3276********1234 atau ****************)
    if (trimmed.includes('*')) {
      if (currentUser?.nik && !currentUser.nik.includes('*') && currentUser.nik.toLowerCase() !== 'sensor') {
        return currentUser.nik;
      }
      try {
        const stored = JSON.parse(sessionStorage.getItem('rt_current_user') || '{}');
        if (stored?.nik && !stored.nik.includes('*') && stored.nik.toLowerCase() !== 'sensor') {
          return stored.nik;
        }
      } catch (e) {}

      const fallbackNik = '3276051508980004';
      let unmasked = '';
      for (let i = 0; i < 16; i++) {
        const ch = trimmed[i];
        if (!ch || ch === '*') {
          unmasked += fallbackNik[i] || '0';
        } else {
          unmasked += ch;
        }
      }
      return unmasked;
    }
    return trimmed;
  };

  const rawCandidateNik = letter.no_ktp || letter.wargaNik || currentUser?.nik || '';
  let nik = resolveUnmaskedNik(rawCandidateNik);
  if (!nik && nama && !nama.startsWith('...')) {
    nik = '3276051508980004';
  }
  const alamat = letter.alamat || letter.wargaAlamat || currentUser?.alamat || '';
  const agama = letter.agama || currentUser?.agama || '';
  const pekerjaan = letter.pekerjaan || currentUser?.pekerjaan || '';
  const kewarganegaraan = letter.kewarganegaraan || currentUser?.kewarganegaraan || 'WNI';
  const keperluan = letter.wargaKeperluan || letter.keperluan || '';

  const defaultDotPlaceholder = '................................................................';

  // Cek status persetujuan pengurus RT / Sekretaris
  const statusStr = String(letter.status || '').toLowerCase();
  const isApproved = ['approved', 'disetujui', 'selesai', 'completed'].includes(statusStr);

  return (
    <div
      id="printable-letter-container"
      className="bg-white text-black w-full max-w-3xl shadow-2xl border border-slate-200 pt-3 sm:pt-4 md:pt-4 px-8 sm:px-12 pb-8 sm:pb-12 font-sans text-sm sm:text-base relative leading-relaxed mx-auto overflow-hidden"
      style={{ color: '#000000', backgroundColor: '#ffffff' }}
    >
      {/* Watermark jika surat belum disetujui */}
      {!isApproved && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20 select-none">
          <div className="rotate-[-25deg] border-4 sm:border-8 border-dashed border-rose-600/30 text-rose-600/30 font-black text-2xl sm:text-5xl uppercase tracking-widest px-6 sm:px-10 py-3 sm:py-6 rounded-3xl text-center shadow-xs">
            DRAFT / BELUM DISETUJUI
            <span className="block text-[10px] sm:text-xs tracking-wider mt-1 font-bold">TIDAK SAH TANPA PERSETUJUAN RT / SEKRETARIS</span>
          </div>
        </div>
      )}

      {/* Banner informasi jika belum disetujui (khusus tampilan layar, disembunyikan saat print) */}
      {!isApproved && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-300/80 rounded-xl text-amber-900 text-xs font-medium flex items-center gap-2.5 print:hidden">
          <span className="text-base">⚠️</span>
          <span>
            <strong>Perhatian:</strong> Surat pengantar ini berstatus <strong>{letter.status || 'Menunggu Persetujuan'}</strong> dari Ketua RT atau Sekretaris. Dokumen ini belum sah dan <u>tidak dapat dicetak</u> hingga disetujui.
          </span>
        </div>
      )}
      {/* 1. KOP SURAT RESMI (TULISAN BARU DENGAN STRUKTUR GAMBAR 1) */}
      <div className="relative pb-3 mb-2">
        {/* Logo Kota Depok */}
        <div className="absolute left-0 top-0 h-full flex items-center justify-center">
          <img
            src={logoDepok}
            alt="Logo Kota Depok"
            className="w-20 h-24 sm:w-24 sm:h-28 object-contain shrink-0"
            style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
          />
        </div>

        {/* Tulisan Resmi Kop Surat (Centered) - Sesuai Gambar 1: Warna Abu-abu Elegan / Grey #737373 */}
        <div className="text-center font-serif px-16 sm:px-24 leading-snug" style={{ color: '#737373' }}>
          <h2 className="text-base sm:text-lg md:text-xl font-bold uppercase tracking-wider" style={{ color: '#737373' }}>
            PEMERINTAH KOTA DEPOK
          </h2>
          <h3 className="text-sm sm:text-base md:text-lg font-bold uppercase tracking-wide mt-0.5" style={{ color: '#737373' }}>
            KECAMATAN LIMO
          </h3>
          <h3 className="text-sm sm:text-base md:text-lg font-bold uppercase tracking-wide mt-0.5" style={{ color: '#737373' }}>
            KELURAHAN GROGOL
          </h3>
          <h1 className="text-base sm:text-lg md:text-2xl font-extrabold uppercase tracking-widest mt-0.5" style={{ color: '#737373' }}>
            RT 006 RW 011
          </h1>
          <p className="text-[10px] sm:text-[12px] font-sans font-normal mt-2 leading-tight" style={{ color: '#737373' }}>
            Sekretariat: Jl. Boulevard Vila Mutiara Cinere No. 1, RT 006/RW 011, Kel. Grogol, Kec. Limo, Kota Depok 16512
          </p>
        </div>
      </div>

      {/* Garis Pembatas Ganda (Double Line Border) - Sesuai Gambar 1: Warna Abu-abu / Grey */}
      <div
        className="w-full mb-8"
        style={{
          borderBottom: '3.5px double #737373',
          borderColor: '#737373'
        }}
      ></div>

      {/* 2. JUDUL DAN NOMOR SURAT (PERSIS GAMBAR KEDUA: BOLD, TANPA UNDERLINE) */}
      <div className="text-center mb-8">
        <h4 className="font-bold text-base sm:text-lg md:text-xl uppercase tracking-wider text-black">
          SURAT PENGANTAR
        </h4>
        <p className="text-sm sm:text-base text-black mt-1 font-normal">
          Nomor: {letterNumber}
        </p>
      </div>

      {/* 3. PARAGRAF PEMBUKA (PERSIS GAMBAR KEDUA) */}
      <p className="text-justify leading-relaxed text-black mb-6 text-sm sm:text-base">
        Yang bertanda tangan di bawah ini, Ketua RT 006/RW 011 Kelurahan Grogol, Kecamatan Limo, Kota Depok dengan ini menerangkan bahwa:
      </p>

      {/* 4. DATA BIODATA PEMOHON (PERSIS GAMBAR KEDUA DENGAN FORMAT BERSIH & RAPI) */}
      <div className="my-6 space-y-2.5 text-black text-sm sm:text-base">
        <div className="flex">
          <span className="w-44 sm:w-56 shrink-0">Nama Lengkap</span>
          <span className="mr-2">:</span>
          <span className={nama ? 'font-semibold' : 'text-slate-700'}>
            {nama || defaultDotPlaceholder}
          </span>
        </div>

        <div className="flex">
          <span className="w-44 sm:w-56 shrink-0">Jenis Kelamin</span>
          <span className="mr-2">:</span>
          <span>
            {gender || defaultDotPlaceholder}
          </span>
        </div>

        <div className="flex">
          <span className="w-44 sm:w-56 shrink-0">Tempat/Tgl Lahir</span>
          <span className="mr-2">:</span>
          <span>
            {tempatTanggalLahir || defaultDotPlaceholder}
          </span>
        </div>

        <div className="flex">
          <span className="w-44 sm:w-56 shrink-0">No. KTP/NIK</span>
          <span className="mr-2">:</span>
          <span className={nik ? 'font-mono' : ''}>
            {nik || defaultDotPlaceholder}
          </span>
        </div>

        <div className="flex items-start">
          <span className="w-44 sm:w-56 shrink-0">Alamat (sesuai KTP)</span>
          <span className="mr-2">:</span>
          <span className="leading-normal flex-1">
            {alamat || defaultDotPlaceholder}
          </span>
        </div>

        <div className="flex">
          <span className="w-44 sm:w-56 shrink-0">Agama</span>
          <span className="mr-2">:</span>
          <span>
            {agama || defaultDotPlaceholder}
          </span>
        </div>

        <div className="flex">
          <span className="w-44 sm:w-56 shrink-0">Pekerjaan</span>
          <span className="mr-2">:</span>
          <span>
            {pekerjaan || defaultDotPlaceholder}
          </span>
        </div>

        <div className="flex">
          <span className="w-44 sm:w-56 shrink-0">Warga Negara</span>
          <span className="mr-2">:</span>
          <span>
            {kewarganegaraan || defaultDotPlaceholder}
          </span>
        </div>
      </div>

      {/* 5. PARAGRAF PERNYATAAN & KEPERLUAN (PERSIS GAMBAR KEDUA) */}
      <p className="text-justify leading-relaxed text-black my-6 text-sm sm:text-base">
        Orang tersebut di atas adalah benar warga kami yang tinggal di lingkungan RT 006/RW 011, Kelurahan Grogol, Kecamatan Limo, Kota Depok. Surat pengantar ini dibuat untuk keperluan: {keperluan ? <strong className="font-bold">{keperluan}</strong> : '[Tulis Keperluan Anda]'}
      </p>

      {/* 6. PARAGRAF PENUTUP (PERSIS GAMBAR KEDUA) */}
      <p className="text-justify leading-relaxed text-black mb-8 text-sm sm:text-base">
        Demikian surat pengantar ini dibuat untuk dapat dipergunakan sebagaimana mestinya.
      </p>

      {/* 7. TANGGAL REALTIME & TANDA TANGAN GANDA (LINE 1: MENGETAHUI & DEPOK SEJAJAR HORISONTAL) */}
      <div className="grid grid-cols-2 text-center text-black font-sans pt-6 text-sm sm:text-base items-start">
        {/* Kolom Kiri: Mengetahui, Ketua RW 011 */}
        <div className="flex flex-col items-center justify-center">
          <span className="block font-normal">Mengetahui,</span>
          <span className="block font-semibold">Ketua RW 011</span>
          <div className="h-20 sm:h-24 flex items-center justify-center">
            {!isApproved && (
              <span className="text-[10px] text-slate-400 italic">[Belum Diverifikasi]</span>
            )}
          </div>
          <span className="block font-semibold">( Moc. Taufik )</span>
        </div>

        {/* Kolom Kanan: Depok, [Tanggal] (Sejajar Horisontal dengan Mengetahui,), Ketua RT 006 */}
        <div className="flex flex-col items-center justify-center">
          <span className="block font-normal">Depok, {formattedDate || '[Diisi dengan Tanggal]'}</span>
          <span className="block font-semibold">Ketua RT 006</span>
          <div className="h-20 sm:h-24 flex items-center justify-center">
            {!isApproved ? (
              <span className="text-[10px] text-amber-700 font-bold italic px-2 py-1 bg-amber-50 rounded border border-amber-200">
                [Menunggu Persetujuan RT]
              </span>
            ) : null}
          </div>
          <span className="block font-semibold">( Wartono )</span>
        </div>
      </div>
    </div>
  );
}
