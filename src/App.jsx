import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Profil from './components/Profil';
import Agenda from './components/Agenda';
import Layanan from './components/Layanan';
import DataWarga from './components/DataWarga';
import Kas from './components/Kas';
import Kontak from './components/Kontak';

export default function App() {
  // Theme Dark/Light Mode state
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('rt_theme');
    return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // Kependudukan Data States (Clean variables, ready for Backend API Integration)
  const [totalKeluarga, setTotalKeluarga] = useState(120); // 120 KK
  const [totalHidup, setTotalHidup] = useState(420); // Total living residents
  const [totalMeninggal, setTotalMeninggal] = useState(12); // Total deceased residents

  // Keuangan Kas States (Clean variables, ready for Backend API Integration)
  const [totalPemasukan, setTotalPemasukan] = useState(15000000); // Rp15.000.000
  const [totalPengeluaran, setTotalPengeluaran] = useState(6000000); // Rp6.000.000
  const [sisaKasRT, setSisaKasRT] = useState(9000000); // Rp9.000.000 (Sisa kas)

  // Kas Transactions List (Dummy local data, easy to fetch from backend)
  const [transaksiKasList, setTransaksiKasList] = useState([
    {
      id: 'TX-001',
      description: 'Iuran Kebersihan & Keamanan Bulanan Warga (Juni)',
      amount: 10000000,
      date: '2026-06-30',
      type: 'income',
      category: 'Iuran Warga',
    },
    {
      id: 'TX-002',
      description: 'Honor Satpam Klaster Sawangan Green Park (2 Petugas)',
      amount: 3500000,
      date: '2026-07-01',
      type: 'expense',
      category: 'Keamanan',
    },
    {
      id: 'TX-003',
      description: 'Sumbangan Warga untuk Pembelian Alat Fogging Mandiri',
      amount: 5000000,
      date: '2026-07-02',
      type: 'income',
      category: 'Donasi',
    },
    {
      id: 'TX-004',
      description: 'Biaya Pengangkutan Sampah Mandiri Ke TPA',
      amount: 1500000,
      date: '2026-07-03',
      type: 'expense',
      category: 'Kebersihan',
    },
    {
      id: 'TX-005',
      description: 'Konsumsi & Pembelian Obat Abate Kerja Bakti',
      amount: 1000000,
      date: '2026-07-05',
      type: 'expense',
      category: 'Kebersihan',
    },
  ]);

  // Agenda List (July & August 2026 dummy data)
  const [agendaList, setAgendaList] = useState([
    {
      id: 'AGD-001',
      title: 'Kerja Bakti & Fogging Nyamuk DBD',
      date: '2026-07-12',
      time: '07:00 - 11:00 WIB',
      location: 'Area Fasos, Fasum, & Selokan Klaster',
      category: 'Kerja Bakti',
      participants: 'Seluruh Warga Blok A - E',
      description: 'Kegiatan gotong royong membersihkan saluran air tersumbat serta pelaksanaan pengasapan (fogging nyamuk) untuk mencegah penyebaran demam berdarah.',
    },
    {
      id: 'AGD-002',
      title: 'Rapat Rutin Bulanan Warga SGP',
      date: '2026-07-25',
      time: '19:30 WIB - Selesai',
      location: 'Balai Warga / Lapangan Serbaguna',
      category: 'Rapat Warga',
      participants: 'Perwakilan 1 Orang per KK',
      description: 'Musyawarah bulanan guna membahas evaluasi kinerja satpam, perbaikan CCTV komplek, serta perencanaan perayaan Hari Kemerdekaan 17 Agustus.',
    },
    {
      id: 'AGD-003',
      title: 'Layanan Posyandu Balita & Senam Lansia',
      date: '2026-08-05',
      time: '08:00 - 11:30 WIB',
      location: 'Pos Satpam Utama Sawangan Green Park',
      category: 'Kesehatan',
      participants: 'Ibu Hamil, Balita, & Warga Lansia',
      description: 'Pemberian imunisasi dasar anak, penimbangan berat badan balita, penyuluhan gizi, dilanjutkan dengan olahraga senam sehat bersama warga lanjut usia.',
    },
  ]);

  // Count active agenda for July 2026 (this month)
  const [activeAgendasCount, setActiveAgendasCount] = useState(0);

  useEffect(() => {
    // July is index 6 in JS Date (0-11)
    const count = agendaList.filter(agenda => {
      const date = new Date(agenda.date);
      return date.getMonth() === 6 && date.getFullYear() === 2026;
    }).length;
    setActiveAgendasCount(count);
  }, [agendaList]);

  // Toggle dark/light theme class on document element
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('rt_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('rt_theme', 'light');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans antialiased">
      {/* Navigation bar */}
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />

      {/* Main Content Layout */}
      <main>
        {/* Beranda Section */}
        <Hero
          totalKK={totalKeluarga}
          totalAgendaBulanIni={activeAgendasCount}
          sisaKasRT={sisaKasRT}
        />

        {/* Profil Section */}
        <Profil />

        {/* Agenda Section */}
        <Agenda agendas={agendaList} />

        {/* Layanan Section */}
        <Layanan />

        {/* Data Warga Section */}
        <DataWarga
          totalKK={totalKeluarga}
          totalHidup={totalHidup}
          totalMeninggal={totalMeninggal}
        />

        {/* Kas RT Section */}
        <Kas
          totalPemasukan={totalPemasukan}
          totalPengeluaran={totalPengeluaran}
          sisaKas={sisaKasRT}
          transaksiKas={transaksiKasList}
        />

        {/* Kontak Section */}
        <Kontak />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <p className="font-semibold text-slate-300">
            © {new Date().getFullYear()} RT 04 / RW 09 - Perumahan Sawangan Green Park. All Rights Reserved.
          </p>
          <p className="max-w-md mx-auto text-[10px] text-slate-500">
            Website portal informasi ini dirancang khusus untuk mempermudah pelayanan administrasi warga klaster Sawangan Green Park secara mandiri, cepat, dan transparan.
          </p>
        </div>
      </footer>
    </div>
  );
}