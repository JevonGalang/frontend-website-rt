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
const DEFAULT_WARGA = [];
const DEFAULT_KAS = [];
const DEFAULT_AGENDA = [];
const DEFAULT_SUBMISSIONS = [];

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

  const [publicStats, setPublicStats] = useState(null);
  const [publicLedger, setPublicLedger] = useState([]);

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

  const fetchAgendas = async (query = '') => {
    const token = localStorage.getItem('rt_token');
    if (!token) return;

    try {
      const user = currentUser || JSON.parse(localStorage.getItem('rt_current_user') || 'null');
      if (!user) return;
      const isAdmin = ['admin', 'rt', 'sekertaris', 'bendahara'].includes(user.role);
      const endpoint = isAdmin ? '/admin/agenda' : '/resident/agenda';
      
      const url = query 
        ? `http://172.20.32.62:3333${endpoint}?search=${encodeURIComponent(query)}`
        : `http://172.20.32.62:3333${endpoint}`;
        
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          const mapped = data.map(a => ({
            id: a.id,
            category: a.kategori,
            title: a.judul,
            description: a.deskripsi,
            date: a.tanggal ? a.tanggal.substring(0, 10) : '',
            time: a.waktu,
            location: a.tempat,
            isFromServer: true
          }));
          setAgendaList(mapped);
          localStorage.setItem('rt_agendalist', JSON.stringify(mapped));
        }
      }
    } catch (err) {
      console.warn('Gagal memuat agenda dari server, menggunakan data lokal:', err.message);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchAgendas();
      const interval = setInterval(() => {
        fetchAgendas();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const fetchPublicStats = async () => {
    try {
      const response = await fetch('http://172.20.32.62:3333/post/dashboard-stats');
      const data = await response.json();
      if (response.ok) {
        setPublicStats(data.output?.stats || null);
        setPublicLedger(data.output?.ledger || []);
      }
    } catch (err) {
      console.warn('Gagal memuat statistik publik dari server:', err.message);
    }
  };

  useEffect(() => {
    fetchPublicStats();
  }, []);

  // Redirect guest users if they try to access restricted pages
  useEffect(() => {
    const restrictedTabs = ['profil-saya', 'layanan', 'data-warga', 'kas'];
    if (!currentUser && restrictedTabs.includes(currentPage)) {
      setCurrentPage('beranda');
    }
  }, [currentPage, currentUser]);



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

  // Login form is now embedded directly in the Hero section of beranda


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
  if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'rt' || currentUser.role === 'sekertaris' || currentUser.role === 'bendahara')) {
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
        fetchAgendas={fetchAgendas}
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
        fetchAgendas={fetchAgendas}
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
            publicStats={publicStats}
            publicLedger={publicLedger}
            wargaList={wargaList}
            setCurrentUser={setCurrentUser}
            currentUser={currentUser}
            transaksiKasList={transaksiKasList}
            totalPemasukan={totalPemasukan}
            totalPengeluaran={totalPengeluaran}
          />
        )}

        {/* Profil Saya Warga Section */}
        {currentPage === 'profil-saya' && currentUser && (
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
            fetchAgendas={fetchAgendas}
          />
        )}

        {/* Profil Section */}
        {currentPage === 'profil' && <Profil />}

        {/* Agenda Section */}
        {currentPage === 'agenda' && <Agenda agendas={agendaList} />}

        {/* Layanan Section */}
        {currentPage === 'layanan' && currentUser && (
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