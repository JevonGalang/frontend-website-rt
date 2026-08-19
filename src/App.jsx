import { useState, useEffect } from 'react';
import { io } from './utils/liveSocket';
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
    try {
      const savedTheme = localStorage.getItem('rt_theme');
      return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    } catch (e) {
      console.warn('localStorage is blocked or unavailable:', e);
      return false;
    }
  });

  const [wargaList, setWargaList] = useState(DEFAULT_WARGA);

  const [transaksiKasList, setTransaksiKasList] = useState(DEFAULT_KAS);

  const [agendaList, setAgendaList] = useState(DEFAULT_AGENDA);

  const [submissionsList, setSubmissionsList] = useState(DEFAULT_SUBMISSIONS);

  const [publicStats, setPublicStats] = useState(null);
  const [publicLedger, setPublicLedger] = useState([]);

  // One-time cleanup: hapus semua data localStorage lama yang sudah tidak dipakai
  // agar tidak konflik dengan data dari database
  useEffect(() => {
    if (!localStorage.getItem('rt_cleanup_v1')) {
      const staleKeys = [
        'rt_wargalist', 'rt_kaslist', 'rt_agendalist', 'rt_submissions',
        'rt_access_logs', 'rt_created_accounts', 'rt_dummy_cleared_v3',
        'rt_warga_bukti_bayar', 'rt_warga_pengaduan_list', 'rt_warga_documents',
        'rt_uploaded_docs', 'rt_user_email', 'rt_surat_masuk_mock', 'rt_surat_keluar_mock'
      ];
      // Juga hapus key dinamis rt_user_ktp_*
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('rt_user_ktp_') || staleKeys.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      localStorage.setItem('rt_cleanup_v1', 'true');
      console.log('✅ Stale localStorage data cleared');
    }
  }, []);


  // Sesi User login
  const [currentUser, setCurrentUser] = useState(() => {
    try {
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
    } catch (e) {
      console.warn('localStorage is blocked or unavailable:', e);
      return null;
    }
  });

  const [dashboardStats, setDashboardStats] = useState(null);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('http://172.20.32.31:3333/post/dashboard-stats');
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

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // Bulletproof instant scroll to top on page change (handles mobile browsers & DOM re-renders)
  useEffect(() => {
    const forceScroll = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    forceScroll();
    const t1 = setTimeout(forceScroll, 10);
    const t2 = setTimeout(forceScroll, 100);
    const t3 = setTimeout(forceScroll, 300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [currentPage]);


  const handleUpdateWargaProfile = (updatedCitizen) => {
    const newList = wargaList.map(w => {
      const isMatch = w.id === updatedCitizen.id || 
        (w.username && updatedCitizen.username && w.username.toLowerCase() === updatedCitizen.username.toLowerCase()) ||
        (w.nik && updatedCitizen.nik && w.nik === updatedCitizen.nik);
      return isMatch ? { ...w, ...updatedCitizen, id: w.id } : w;
    });
    setWargaList(newList);

    
    const updatedUser = {
      ...currentUser,
      ...updatedCitizen,
      role: 'warga'
    };
    setCurrentUser(updatedUser);
    try {
      localStorage.setItem('rt_current_user', JSON.stringify(updatedUser));
    } catch (e) {}
  };

  const fetchAgendas = async (query = '') => {
    let token = null;
    try {
      token = localStorage.getItem('rt_token');
    } catch (e) {}
    if (!token) return;

    try {
      const user = currentUser || JSON.parse(localStorage.getItem('rt_current_user') || 'null');
      if (!user) return;
      const isAdmin = ['admin', 'rt', 'sekertaris'].includes(user.role);
      const endpoint = isAdmin ? '/admin/agenda' : '/resident/agenda';
      
      const url = query 
        ? `http://172.20.32.31:3333${endpoint}?search=${encodeURIComponent(query)}`
        : `http://172.20.32.31:3333${endpoint}`;
        
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
          mapped.sort((a, b) => {
            const dateA = a.date || '';
            const dateB = b.date || '';
            if (dateA && dateB && dateA !== dateB) return dateB.localeCompare(dateA);
            return (Number(b.id) || 0) - (Number(a.id) || 0);
          });
          setAgendaList(mapped);

        }
      }
    } catch (err) {
      console.warn('Gagal memuat agenda dari server, menggunakan data lokal:', err.message);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    fetchAgendas();

    let token = null;
    try {
      token = localStorage.getItem('rt_token');
    } catch (e) {}
    if (!token) return;

    const socketConnection = io('http://172.20.32.31:3333', {
      transports: ['websocket'],
      auth: { token }
    });

    socketConnection.on('connect', () => {
      console.log('Connected to socket server in App.jsx');
    });

    socketConnection.on('sync', (data) => {
      console.log(`⚡ Menerima request sinkronisasi di App.jsx untuk: ${data.type}`);
      if (data.type === 'agenda') {
        fetchAgendas();
      }
      if (data.type === 'finance' || data.type === 'warga') {
        fetchDashboardStats();
        fetchPublicStats();
      }
    });

    socketConnection.on('disconnect', () => {
      console.log('Disconnected from socket server in App.jsx');
    });

    return () => {
      socketConnection.disconnect();
    };
  }, [currentUser]);

  const fetchPublicStats = async () => {
    try {
      const response = await fetch('http://172.20.32.31:3333/post/dashboard-stats');
      const data = await response.json();
      if (response.ok) {
        setPublicStats(data.output?.stats || null);
        setPublicLedger(data.output?.ledger || []);

        if (data.output?.ledger) {
          const mapped = data.output.ledger.map(t => ({
            id: t.id !== undefined ? t.id : `TX-${Math.floor(Math.random() * 90000 + 10000)}`,
            type: t.type === 'in' ? 'income' : 'expense',
            amount: t.amount,
            category: t.source_type ? (t.source_type.charAt(0).toUpperCase() + t.source_type.slice(1)) : 'Lainnya',
            description: t.description,
            date: t.transaction_date ? t.transaction_date.substring(0, 10) : new Date().toISOString().split('T')[0]
          }));
          setTransaksiKasList(mapped);

        }
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
  
  const totalHidup = publicStats ? publicStats.total_warga : livingWarga.length;
  const totalMeninggal = publicStats ? Math.round(publicStats.total_warga * 0.05) : deceasedWarga.length;
  // Count unique No. KK in living warga
  const totalKeluarga = publicStats ? Math.ceil(publicStats.total_warga / 3.2) : new Set(livingWarga.map(w => w.noKk)).size;

  // Dynamic calculations for Financial Statistics
  const totalPemasukan = publicStats ? publicStats.total_income : transaksiKasList
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalPengeluaran = publicStats ? publicStats.total_expense : transaksiKasList
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const sisaKasRT = publicStats ? publicStats.current_balance : (totalPemasukan - totalPengeluaran);

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
        dashboardStats={dashboardStats}
        fetchDashboardStats={fetchDashboardStats}
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
      <main className="pt-14 sm:pt-16 flex-grow">
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
            © {new Date().getFullYear()} RT 05 / RW 06 - Perumahan Sawangan Green Park. All Rights Reserved.
          </p>
          <p className="max-w-md mx-auto text-[10px] text-slate-500">
            Website portal informasi ini dirancang khusus untuk mempermudah pelayanan administrasi warga klaster Sawangan Green Park secara mandiri, cepat, dan transparan.
          </p>
        </div>
      </footer>
    </div>
  );
}
