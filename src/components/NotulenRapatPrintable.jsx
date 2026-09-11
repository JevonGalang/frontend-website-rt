import React from 'react';
import logoDepok from '../assets/logo_depok.png';
import { getRomanMonth, getRealtimeIndoDate } from './SuratPengantarPrintable';

export const formatNotulenNumber = (id, date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const romanMonth = getRomanMonth(d);
  const numId = String(id || '001').replace(/\D/g, '') || '001';
  const paddedId = String(numId).padStart(3, '0');
  return `${paddedId}/NOT-RT006/RW011/${romanMonth}/${year}`;
};

export const getDayNameIndo = (dateStr) => {
  if (!dateStr) return 'Minggu';
  try {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Minggu';
    return days[d.getDay()] || 'Minggu';
  } catch (e) {
    return 'Minggu';
  }
};

export default function NotulenRapatPrintable({ notulen }) {
  if (!notulen) return null;

  const rawDate = notulen.created_at || notulen.tanggal_rapat || notulen.tanggal || notulen.date || new Date().toISOString().split('T')[0];
  const formattedMeetingDate = getRealtimeIndoDate(new Date(rawDate));
  const dayName = getDayNameIndo(rawDate);
  const meetingNumber = formatNotulenNumber(notulen.id, new Date(rawDate));

  const topik = notulen.judul || notulen.topik || notulen.title || notulen.agenda || 'Musyawarah Rutin Lingkungan Warga';
  const waktu = notulen.waktu_rapat || notulen.waktu || '19:30 WIB — 22:00 WIB';
  const tempat = notulen.tempat_rapat || notulen.tempat || notulen.location || 'Balai Pertemuan Warga RT 006';
  const pemimpinRapat = notulen.pemimpin_rapat || notulen.leader || 'Bpk. Wartono SE (Ketua RT 006)';
  const notulis = notulen.notulis || 'Ibu Yulia Sutianti (Sekretaris RT 006)';
  const peserta = notulen.peserta || notulen.jumlah_peserta || notulen.attendees || 'Pengurus RT 006 & Perwakilan Warga (18 Orang)';
  const pembahasan = notulen.pembahasan || notulen.discussion || '';
  const hasilKeputusan = notulen.isi || notulen.hasil_keputusan || notulen.decisions || notulen.isiRingkas || 'Musyawarah menyepakati seluruh agenda kerja lingkungan dan penugasan PIC terkait.';
  const tindakLanjut = notulen.tindak_lanjut || notulen.action_items || '';

  return (
    <div
      id="printable-notulen-container"
      className="bg-white text-black w-full max-w-3xl shadow-2xl border border-slate-200 pt-3 sm:pt-4 md:pt-4 px-8 sm:px-12 pb-8 sm:pb-12 font-sans text-sm sm:text-base relative leading-relaxed mx-auto overflow-hidden"
      style={{ color: '#000000', backgroundColor: '#ffffff' }}
    >
      {/* 1. KOP SURAT RESMI RT 006 / RW 011 (PERSIS IDENTIK SURAT PENGANTAR) */}
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

        {/* Tulisan Resmi Kop Surat (Centered) - Warna Abu-abu Elegan / Grey #737373 */}
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
            RUKUN WARGA 011
          </h1>
          <p className="text-[10px] sm:text-[12px] font-sans font-normal mt-2 leading-tight" style={{ color: '#737373' }}>
            Sekretariat: Jl. Boulevard Vila Mutiara Cinere No. 1, RT 006/RW 011, Kel. Grogol, Kec. Limo, Kota Depok 16512
          </p>
        </div>
      </div>

      {/* Garis Pembatas Ganda (Double Line Border) */}
      <div
        className="w-full mb-6"
        style={{
          borderBottom: '3.5px double #737373',
          borderColor: '#737373'
        }}
      ></div>

      {/* 2. JUDUL DAN NOMOR NOTULEN RAPAT */}
      <div className="text-center mb-6">
        <h4 className="font-bold text-base sm:text-lg md:text-xl uppercase tracking-wider text-black">
          BERITA ACARA & NOTULEN RAPAT
        </h4>
        <p className="text-sm sm:text-base text-black mt-1 font-normal">
          Nomor: {meetingNumber}
        </p>
      </div>

      {/* 3. PARAGRAF PEMBUKA */}
      <p className="text-justify leading-relaxed text-black mb-4 text-xs sm:text-sm">
        Pada hari ini, <strong>{dayName}</strong> tanggal <strong>{formattedMeetingDate}</strong>, telah diselenggarakan Musyawarah / Rapat Koordinasi Pengurus & Warga Lingkungan RT 006/RW 011 Kelurahan Grogol, Kecamatan Limo, Kota Depok dengan rincian pelaksanaan sebagai berikut:
      </p>

      {/* 4. TABEL / RINCIAN PELAKSANAAN RAPAT */}
      <div className="my-4 p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2 text-xs sm:text-sm text-black">
        <div className="grid grid-cols-3 gap-2">
          <span className="font-semibold text-slate-700">Hari / Tanggal</span>
          <span className="col-span-2 font-medium">: {dayName}, {formattedMeetingDate}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <span className="font-semibold text-slate-700">Waktu Pelaksanaan</span>
          <span className="col-span-2 font-medium">: {waktu}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <span className="font-semibold text-slate-700">Tempat Pelaksanaan</span>
          <span className="col-span-2 font-medium">: {tempat}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <span className="font-semibold text-slate-700">Pemimpin Musyawarah</span>
          <span className="col-span-2 font-medium">: {pemimpinRapat}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <span className="font-semibold text-slate-700">Notulis / Pencatat</span>
          <span className="col-span-2 font-medium">: {notulis}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <span className="font-semibold text-slate-700">Peserta yang Hadir</span>
          <span className="col-span-2 font-medium">: {peserta}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <span className="font-semibold text-slate-700">Agenda / Topik Utama</span>
          <span className="col-span-2 font-bold text-slate-900">: {topik}</span>
        </div>
      </div>

      {/* 5. POIN-POIN PEMBAHASAN MUSYAWARAH (Jika ada) */}
      {pembahasan && (
        <div className="my-5 space-y-1.5 text-xs sm:text-sm text-black">
          <h5 className="font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            I. Poin Pembahasan Musyawarah
          </h5>
          <div className="whitespace-pre-wrap text-justify leading-relaxed pt-1 pl-2 text-slate-800">
            {pembahasan}
          </div>
        </div>
      )}

      {/* 6. HASIL KEPUTUSAN & KESEPAKATAN RAPAT */}
      <div className="my-5 space-y-1.5 text-xs sm:text-sm text-black">
        <h5 className="font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
          {pembahasan ? 'II. Hasil Keputusan & Kesepakatan Bersama' : 'I. Hasil Keputusan & Kesepakatan Bersama'}
        </h5>
        <div className="whitespace-pre-wrap text-justify leading-relaxed pt-1 pl-2 text-slate-900 font-medium">
          {hasilKeputusan}
        </div>
      </div>

      {/* 7. RENCANA TINDAK LANJUT / PENUGASAN (Jika ada) */}
      {tindakLanjut && (
        <div className="my-5 space-y-1.5 text-xs sm:text-sm text-black">
          <h5 className="font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            {pembahasan ? 'III. Rencana Tindak Lanjut & Penanggung Jawab (PIC)' : 'II. Rencana Tindak Lanjut & Penanggung Jawab (PIC)'}
          </h5>
          <div className="whitespace-pre-wrap text-justify leading-relaxed pt-1 pl-2 text-slate-800">
            {tindakLanjut}
          </div>
        </div>
      )}

      {/* 8. PARAGRAF PENUTUP */}
      <p className="text-justify leading-relaxed text-black mt-6 mb-8 text-xs sm:text-sm">
        Demikian Berita Acara dan Notulen Rapat ini dibuat dengan sebenarnya dengan penuh rasa tanggung jawab untuk dapat dipergunakan sebagai pedoman pelaksanaan keputusan bersama warga RT 006/RW 011.
      </p>

      {/* 9. TANDA TANGAN RESMI GANDA (NOTULIS / SEKRETARIS & KETUA RT) */}
      <div className="grid grid-cols-2 text-center text-black font-sans pt-6 text-xs sm:text-sm items-start">
        {/* Kolom Kiri: Notulis / Sekretaris RT 006 */}
        <div className="flex flex-col items-center justify-center">
          <span className="block font-normal">Notulis Rapat,</span>
          <span className="block font-semibold">Sekretaris RT 006</span>
          <div className="h-20 sm:h-24 flex items-center justify-center">
            {/* Ruang Tanda Tangan */}
          </div>
          <span className="block font-semibold underline">( Ibu Yulia Sutianti )</span>
        </div>

        {/* Kolom Kanan: Mengetahui, Ketua RT 006 */}
        <div className="flex flex-col items-center justify-center">
          <span className="block font-normal">Depok, {formattedMeetingDate}</span>
          <span className="block font-semibold">Ketua RT 006</span>
          <div className="h-20 sm:h-24 flex items-center justify-center">
            {/* Ruang Tanda Tangan */}
          </div>
          <span className="block font-semibold underline">( Bpk. Wartono SE )</span>
        </div>
      </div>
    </div>
  );
}
