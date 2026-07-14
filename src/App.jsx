import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Profil from './components/Profil';
import Agenda from './components/Agenda';
import Layanan from './components/Layanan';
import DataWarga from './components/DataWarga';
import Kas from './components/Kas';
import Kontak from './components/Kontak';
import LoginPage from './components/LoginPage';
import AdminDashboard from './components/AdminDashboard';
import ProfilWarga from './components/ProfilWarga';

import ChangePasswordFirstTime from './components/ChangePasswordFirstTime';

// Predefined Demo Data (Outstanding UX/Developer Experience)
const DEFAULT_WARGA = [
  { id: 'WRG-001', name: 'Budi Santoso', username: 'warga', password: 'warga', email: 'budi@gmail.com', role: 'warga', nik: '3275081102900001', noKk: '3275081212080001', noHp: '081234567890', alamat: 'Sawangan Green Park Blok A1 No. 5', status: 'Tetap', gender: 'Laki-laki', usia: 36, statusHidup: 'Hidup', statusIuran: 'Lunas' },
  { id: 'WRG-002', name: 'Siti Aminah', username: 'siti', password: 'warga', email: 'siti@gmail.com', role: 'warga', nik: '3275084506920002', noKk: '3275081212080001', noHp: '081234567891', alamat: 'Sawangan Green Park Blok A1 No. 5', status: 'Tetap', gender: 'Perempuan', usia: 34, statusHidup: 'Hidup', statusIuran: 'Lunas' },
  { id: 'WRG-003', name: 'Andi Wijaya', username: 'andi', password: 'warga', email: 'andi@gmail.com', role: 'warga', nik: '3275080203850003', noKk: '3275081212080002', noHp: '081234567892', alamat: 'Sawangan Green Park Blok B3 No. 12', status: 'Tetap', gender: 'Laki-laki', usia: 41, statusHidup: 'Hidup', statusIuran: 'Menunggak (Rp 50.000)' },
  { id: 'WRG-004', name: 'Rina Herawati', username: 'rina', password: 'warga', email: 'rina@gmail.com', role: 'warga', nik: '3275085208880004', noKk: '3275081212080002', noHp: '081234567893', alamat: 'Sawangan Green Park Blok B3 No. 12', status: 'Tetap', gender: 'Perempuan', usia: 38, statusHidup: 'Hidup', statusIuran: 'Menunggak (Rp 50.000)' },
  { id: 'WRG-005', name: 'Joko Susilo', username: 'joko', password: 'warga', email: 'joko@gmail.com', role: 'warga', nik: '3275081510950005', noKk: '3275081212080003', noHp: '081234567894', alamat: 'Sawangan Green Park Blok C2 No. 8', status: 'Kontrak', gender: 'Laki-laki', usia: 31, statusHidup: 'Hidup', statusIuran: 'Lunas' },
  { id: 'WRG-006', name: 'Dewi Lestari', username: 'dewi', password: 'warga', email: 'dewi@gmail.com', role: 'warga', nik: '3275086111970006', noKk: '3275081212080003', noHp: '081234567895', alamat: 'Sawangan Green Park Blok C2 No. 8', status: 'Kontrak', gender: 'Perempuan', usia: 29, statusHidup: 'Hidup', statusIuran: 'Lunas' },
  { id: 'WRG-007', name: 'Mbah Slamet', username: 'slamet', password: 'warga', email: 'slamet@gmail.com', role: 'warga', nik: '3275081512450007', noKk: '3275081212080004', noHp: '081234567896', alamat: 'Sawangan Green Park Blok D4 No. 2', status: 'Tetap', gender: 'Laki-laki', usia: 72, statusHidup: 'Hidup', statusIuran: 'Lunas' },
  { id: 'WRG-008', name: 'Alm. Pak Subarkah', username: 'subarkah', password: 'warga', email: 'subarkah@gmail.com', role: 'warga', nik: '3275081203500008', noKk: '3275081212080005', noHp: '081234567897', alamat: 'Sawangan Green Park Blok E5 No. 15', status: 'Tetap', gender: 'Laki-laki', usia: 68, statusHidup: 'Meninggal', statusIuran: 'Lunas' }
];

const DEFAULT_KAS = [
  { id: 'TX-001', description: 'Iuran Kebersihan & Keamanan Bulanan Warga (Juni)', amount: 10000000, date: '2026-06-30', type: 'income', category: 'Iuran Warga' },
  { id: 'TX-002', description: 'Honor Satpam Klaster Sawangan Green Park (2 Petugas)', amount: 3500000, date: '2026-07-01', type: 'expense', category: 'Keamanan' },
  { id: 'TX-003', description: 'Sumbangan Warga untuk Pembelian Alat Fogging Mandiri', amount: 5000000, date: '2026-07-02', type: 'income', category: 'Donasi' },
  { id: 'TX-004', description: 'Biaya Pengangkutan Sampah Mandiri Ke TPA', amount: 1500000, date: '2026-07-03', type: 'expense', category: 'Kebersihan' },
  { id: 'TX-005', description: 'Konsumsi & Pembelian Obat Abate Kerja Bakti', amount: 1000000, date: '2026-07-05', type: 'expense', category: 'Kebersihan' },
  { id: 'TX-050', description: 'Pembayaran Iuran Budi Santoso', amount: 50000, date: '2026-07-06', type: 'income', category: 'Iuran Warga' }
];

const DEFAULT_AGENDA = [
  { id: 'AGD-001', title: 'Kerja Bakti & Fogging Nyamuk DBD', date: '2026-07-12', time: '07:00 - 11:00 WIB', location: 'Area Fasos, Fasum, & Selokan Klaster', category: 'Kerja Bakti', participants: 'Seluruh Warga Blok A - E', description: 'Kegiatan gotong royong membersihkan saluran air tersumbat serta pelaksanaan pengasapan (fogging nyamuk) untuk mencegah penyebaran demam berdarah.' },
  { id: 'AGD-002', title: 'Rapat Rutin Bulanan Warga SGP', date: '2026-07-25', time: '19:30 WIB - Selesai', location: 'Balai Warga / Lapangan Serbaguna', category: 'Rapat Warga', participants: 'Perwakilan 1 Orang per KK', description: 'Musyawarah bulanan guna membahas evaluasi kinerja satpam, perbaikan CCTV komplek, serta perencanaan perayaan Hari Kemerdekaan 17 Agustus.' },
  { id: 'AGD-003', title: 'Layanan Posyandu Balita & Senam Lansia', date: '2026-08-05', time: '08:00 - 11:30 WIB', location: 'Pos Satpam Utama Sawangan Green Park', category: 'Kesehatan', participants: 'Ibu Hamil, Balita, & Warga Lansia', description: 'Pemberian imunisasi dasar anak, penimbangan berat badan balita, penyuluhan gizi, dilanjutkan dengan olahraga senam sehat bersama warga lanjut usia.' }
];

const DEFAULT_SUBMISSIONS = [
  { id: 'SRT-739102', wargaNama: 'Budi Santoso', wargaNik: '3275081102900001', wargaNoKk: '3275081212080001', wargaAlamat: 'Sawangan Green Park Blok A1 No. 5', wargaKeperluan: 'Persyaratan perpanjangan KTP Elektronik', wargaTipeSurat: 'Surat Pengantar Pembuatan KTP', status: 'Pending', submissionDate: '12 Juni 2026' },
  { id: 'SRT-945201', wargaNama: 'Andi Wijaya', wargaNik: '3275080203850003', wargaNoKk: '3275081212080002', wargaAlamat: 'Sawangan Green Park Blok B3 No. 12', wargaKeperluan: 'Pengurusan surat nikah di KUA Kecamatan Sawangan', wargaTipeSurat: 'Surat Pengantar Nikah', status: 'Completed', submissionDate: '20 Juni 2026', processedDate: '21 Juni 2026' }
];

export default function App() {
  const [currentPage, setCurrentPage] = useState('beranda');

  // Theme Dark/Light Mode state
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('rt_theme');
    return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // State inisialisasi dari localStorage dengan fallback data demo
  const [wargaList, setWargaList] = useState(() => {
    const data = localStorage.getItem('rt_wargalist');
    if (data) {
      const parsed = JSON.parse(data);
      return parsed.map((w, idx) => ({
        ...w,
        noHp: w.noHp || `08123456789${idx}`
      }));
    }
    localStorage.setItem('rt_wargalist', JSON.stringify(DEFAULT_WARGA));
    return DEFAULT_WARGA;
  });

  const [transaksiKasList, setTransaksiKasList] = useState(() => {
    const data = localStorage.getItem('rt_kaslist');
    if (data) return JSON.parse(data);
    localStorage.setItem('rt_kaslist', JSON.stringify(DEFAULT_KAS));
    return DEFAULT_KAS;
  });

  const [agendaList, setAgendaList] = useState(() => {
    const data = localStorage.getItem('rt_agendalist');
    if (data) return JSON.parse(data);
    localStorage.setItem('rt_agendalist', JSON.stringify(DEFAULT_AGENDA));
    return DEFAULT_AGENDA;
  });

  const [submissionsList, setSubmissionsList] = useState(() => {
    const data = localStorage.getItem('rt_submissions');
    if (data) return JSON.parse(data);
    localStorage.setItem('rt_submissions', JSON.stringify(DEFAULT_SUBMISSIONS));
    return DEFAULT_SUBMISSIONS;
  });

  // Sesi User login
  const [currentUser, setCurrentUser] = useState(() => {
    const data = localStorage.getItem('rt_current_user');
    const token = localStorage.getItem('rt_token');
    const tokenTime = localStorage.getItem('rt_token_time');
    
    if (token && tokenTime) {
      const now = new Date().getTime();
      const oneDay = 24 * 60 * 60 * 1000; // 24 hours
      if (now - parseInt(tokenTime) > oneDay) {
        localStorage.removeItem('rt_current_user');
        localStorage.removeItem('rt_token');
        localStorage.removeItem('rt_token_time');
        return null;
      }
    }
    return data ? JSON.parse(data) : null;
  });

  const [dashboardStats, setDashboardStats] = useState(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await fetch('http://172.20.32.62:3333/post/dashboard-stats');
        if (response.ok) {
          const data = await response.json();
          if (data.response === 200) {
            setDashboardStats(data.output.stats);
          }
        }
      } catch (err) {
        console.warn('Gagal memuat statistik dashboard:', err);
      }
    };
    fetchDashboardStats();
  }, []);


  const handleUpdateWargaProfile = (updatedCitizen) => {
    const newList = wargaList.map(w => {
      const isMatch = w.id === updatedCitizen.id || 
        (w.username && updatedCitizen.username && w.username.toLowerCase() === updatedCitizen.username.toLowerCase()) ||
        (w.nik && updatedCitizen.nik && w.nik === updatedCitizen.nik);
      return isMatch ? { ...w, ...updatedCitizen, id: w.id } : w;
    });
    setWargaList(newList);
    localStorage.setItem('rt_wargalist', JSON.stringify(newList));
    
    const updatedUser = {
      ...currentUser,
      ...updatedCitizen,
      role: 'warga'
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('rt_current_user', JSON.stringify(updatedUser));
  };



  // Dynamic calculations for Warga Statistics
  const livingWarga = wargaList.filter(w => w.statusHidup !== 'Meninggal');
  const deceasedWarga = wargaList.filter(w => w.statusHidup === 'Meninggal');
  
  const totalHidup = livingWarga.length;
  const totalMeninggal = deceasedWarga.length;
  // Count unique No. KK in living warga
  const totalKeluarga = new Set(livingWarga.map(w => w.noKk)).size;

  // Dynamic calculations for Financial Statistics
  const totalPemasukan = transaksiKasList
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalPengeluaran = transaksiKasList
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const sisaKasRT = totalPemasukan - totalPengeluaran;

  // Count active agenda for July 2026 (this month)
  const activeAgendasCount = agendaList.filter(agenda => {
    const date = new Date(agenda.date);
    return date.getMonth() === 6 && date.getFullYear() === 2026;
  }).length;

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

  // 1. GATEKEEPER: RENDER LOGIN PAGE IF NOT LOGGED IN
  if (!currentUser) {
    return (
      <LoginPage
        wargaList={wargaList}
        setWargaList={setWargaList}
        setCurrentUser={setCurrentUser}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    );
  }

  // 1.5 GATEKEEPER: FORCE CHANGE PASSWORD ON FIRST LOGIN
  if (currentUser && currentUser.must_change_password) {
    return (
      <ChangePasswordFirstTime
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    );
  }

  // 2. ADMIN ROLE: RENDER ADMIN DASHBOARD IF LOGGED IN AS ADMIN
  if (currentUser.role === 'admin' || currentUser.role === 'rt' || currentUser.role === 'sekertaris' || currentUser.role === 'bendahara') {
    return (
      <AdminDashboard
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        wargaList={wargaList}
        setWargaList={setWargaList}
        transaksiKasList={transaksiKasList}
        setTransaksiKasList={setTransaksiKasList}
        agendaList={agendaList}
        setAgendaList={setAgendaList}
        submissionsList={submissionsList}
        setSubmissionsList={setSubmissionsList}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    );
  }

  // 3. WARGA ROLE: RENDER RESIDENT PORTAL IF LOGGED IN AS CITIZEN
  if (currentUser && currentUser.role === 'warga') {
    const foundWarga = wargaList.find(w => 
      w.id === currentUser.id || 
      (w.username && currentUser.username && w.username.toLowerCase() === currentUser.username.toLowerCase()) ||
      (w.nik && currentUser.nik && w.nik === currentUser.nik)
    );
    const mergedUser = foundWarga ? { ...foundWarga, ...currentUser } : currentUser;
    return (
      <ProfilWarga
        key={currentUser.id}
        currentUser={mergedUser}
        setCurrentUser={setCurrentUser}
        onUpdateProfile={handleUpdateWargaProfile}
        wargaList={wargaList}
        setWargaList={setWargaList}
        submissionsList={submissionsList}
        setSubmissionsList={setSubmissionsList}
        agendaList={agendaList}
        transaksiKasList={transaksiKasList}
        setTransaksiKasList={setTransaksiKasList}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans antialiased flex flex-col justify-between">
      {/* Navigation bar */}
      <Navbar 
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

      {/* Main Content Layout */}
      <main className="pt-24 sm:pt-28 flex-grow">
        {/* Beranda Section */}
        {currentPage === 'beranda' && (
          <Hero
            totalKK={dashboardStats ? dashboardStats.total_warga : totalKeluarga}
            totalAgendaBulanIni={activeAgendasCount}
            sisaKasRT={dashboardStats ? dashboardStats.current_balance : sisaKasRT}
            setCurrentPage={setCurrentPage}
            isWargaLabel={!!dashboardStats}
          />
        )}

        {/* Profil Saya Warga Section */}
        {currentPage === 'profil-saya' && (
          <ProfilWarga
            key={currentUser.id}
            currentUser={wargaList.find(w => w.id === currentUser.id) || currentUser}
            setCurrentUser={setCurrentUser}
            onUpdateProfile={handleUpdateWargaProfile}
            wargaList={wargaList}
            setWargaList={setWargaList}
            submissionsList={submissionsList}
            setSubmissionsList={setSubmissionsList}
            agendaList={agendaList}
            transaksiKasList={transaksiKasList}
            setTransaksiKasList={setTransaksiKasList}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
          />
        )}

        {/* Profil Section */}
        {currentPage === 'profil' && <Profil />}

        {/* Agenda Section */}
        {currentPage === 'agenda' && <Agenda agendas={agendaList} />}

        {/* Layanan Section */}
        {currentPage === 'layanan' && (
          <Layanan 
            key={currentUser.id}
            currentUser={currentUser}
            submissionsList={submissionsList}
            setSubmissionsList={setSubmissionsList}
          />
        )}

        {/* Data Warga Section */}
        {currentPage === 'data-warga' && (
          <DataWarga
            totalKK={totalKeluarga}
            totalHidup={totalHidup}
            totalMeninggal={totalMeninggal}
            wargaList={wargaList}
          />
        )}

        {/* Kas RT Section */}
        {currentPage === 'kas' && (
          <Kas
            totalPemasukan={totalPemasukan}
            totalPengeluaran={totalPengeluaran}
            sisaKas={sisaKasRT}
            transaksiKas={transaksiKasList}
          />
        )}

        {/* Kontak Section */}
        {currentPage === 'kontak' && <Kontak />}
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