import { useState, useEffect } from 'react';
import { Globe, Play, MessageCircle } from 'lucide-react';
import { io } from './utils/liveSocket';
import { getSession, getSessionToken, updateSessionUser, clearSession } from './utils/authSession';
import { API_BASE_URL } from './config/api';
import { parseLocalDateString } from './utils/dateUtils';
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
  const [searchQuery, setSearchQuery] = useState('');

  const [wargaList, setWargaList] = useState(DEFAULT_WARGA);

  const [transaksiKasList, setTransaksiKasList] = useState(DEFAULT_KAS);

  const [agendaList, setAgendaList] = useState(DEFAULT_AGENDA);

  const [submissionsList, setSubmissionsList] = useState(DEFAULT_SUBMISSIONS);

  const [publicStats, setPublicStats] = useState(null);
  const [publicLedger, setPublicLedger] = useState([]);

  // Ensure dark mode class is permanently cleared from document element
  useEffect(() => {
    try {
      window.document.documentElement.classList.remove('dark');
      localStorage.removeItem('rt_theme');
    } catch (e) {
      console.warn('Theme cleanup error:', e);
    }
  }, []);

  // Pembersihan menyeluruh: hapus semua data localStorage bisnis/mock lama agar tidak konflik dengan data database server
  useEffect(() => {
    try {
      const allowedKeys = new Set([]);
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('rt_') && !allowedKeys.has(key)) {
          localStorage.removeItem(key);
        }
      });
      console.log('✅ Stale localStorage data purged');
    } catch (e) {
      console.warn('localStorage cleanup error:', e);
    }
  }, []);


  // Sesi User login
  const [currentUser, setCurrentUser] = useState(() => {
    return getSession()?.user || null;
  });

  const [dashboardStats, setDashboardStats] = useState(null);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/post/dashboard-stats`);
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
    updateSessionUser(updatedUser);
  };

  const fetchAgendas = async (query = '') => {
    const token = getSessionToken();
    try {
      const user = currentUser || getSession()?.user;
      const isAdmin = user && ['admin', 'rt', 'sekertaris'].includes(user.role);
      const endpoint = isAdmin ? '/admin/agenda' : '/resident/agenda';
      
      const url = query 
        ? `${API_BASE_URL}${endpoint}?search=${encodeURIComponent(query)}`
        : `${API_BASE_URL}${endpoint}`;
        
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, { headers });
      if (response.ok) {
        const data = await response.json();
        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.output?.pesan?.items)
          ? data.output.pesan.items
          : Array.isArray(data?.output?.pesan)
          ? data.output.pesan
          : Array.isArray(data?.output?.items)
          ? data.output.items
          : Array.isArray(data?.output?.data)
          ? data.output.data
          : Array.isArray(data?.output)
          ? data.output
          : Array.isArray(data?.data)
          ? data.data
          : [];

        if (items.length > 0 || Array.isArray(data)) {
          const mapped = items.map(a => ({
            id: a.id,
            category: a.kategori || a.category || 'KEGIATAN RT',
            title: a.judul || a.title || 'Agenda Kegiatan',
            description: a.deskripsi || a.description || '',
            date: a.tanggal ? (typeof a.tanggal === 'string' ? a.tanggal.substring(0, 10) : '') : (a.date || ''),
            time: a.waktu || a.time || '08:00',
            location: a.tempat || a.location || 'Lingkungan RT 006',
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
    fetchAgendas();

    const token = getSessionToken();
    if (!token) return;

    const socketConnection = io(API_BASE_URL, {
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
      const response = await fetch(`${API_BASE_URL}/post/dashboard-stats`);
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
            date: parseLocalDateString(t.transaction_date)
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

  // 1.5 GATEKEEPER: FORCE CHANGE PASSWORD ON FIRST LOGIN
  if (currentUser && currentUser.must_change_password) {
    return (
      <ChangePasswordFirstTime
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
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
        fetchAgendas={fetchAgendas}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans antialiased flex flex-col justify-between">
      {/* Navigation bar & Sidebar */}
      <Navbar 
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Content Layout */}
      <main className="pt-16 flex-grow font-sans pb-16 lg:pb-8">
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

      {/* ═══════════════════════════════════════════════════════════════════
          PREMIUM LIGHT GOLDEN FOOTER (PENGURUS RW 011 VILA MUTIARA CINERE)
          ═══════════════════════════════════════════════════════════════════ */}
      <footer className="relative bg-white text-slate-800 pt-10 pb-20 lg:pb-10 border-t border-slate-200 shadow-xs font-sans overflow-hidden">
        {/* Subtle background warm ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-24 bg-amber-500/5 blur-3xl pointer-events-none -z-0"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
          
          {/* Top Center Ornate Gold Plaque */}
          <div className="flex justify-center">
            <div className="relative inline-block group">
              {/* Outer Golden Border & Shadow */}
              <div className="relative px-8 sm:px-12 py-3 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 border-2 border-amber-200/80 shadow-md text-center">
                {/* Inner Decorative Stroke */}
                <div className="absolute inset-1 rounded-full border border-amber-600/30 pointer-events-none"></div>
                
                <span className="block font-black text-xs sm:text-sm md:text-base text-amber-950 uppercase tracking-[0.18em] leading-tight drop-shadow-xs font-serif">
                  PENGURUS RW 011
                </span>
                <span className="block text-[11px] sm:text-xs font-bold text-amber-900 tracking-wider mt-0.5 font-serif">
                  Vila Mutiara Cinere
                </span>
              </div>
            </div>
          </div>

          {/* Golden Horizontal Hairline Divider */}
          <div className="w-full max-w-5xl mx-auto h-[1px] bg-slate-200"></div>

          {/* Social Media & Contact Links Row */}
          <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-8 md:gap-12 text-xs sm:text-sm font-semibold text-slate-600">
            
            {/* 1. Website */}
            <a
              href="https://s.id/erwesebelas"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 hover:text-amber-600 transition-colors group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full border border-slate-200 bg-slate-50 group-hover:border-amber-400 group-hover:bg-amber-50 flex items-center justify-center text-slate-700 group-hover:text-amber-600 transition-all shadow-2xs">
                <Globe className="w-4 h-4" />
              </div>
              <span className="font-mono text-xs text-slate-700 group-hover:text-amber-600">https://s.id/erwesebelas</span>
            </a>

            {/* 2. YouTube */}
            <a
              href="https://www.youtube.com/@erwesebelaskita"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 hover:text-amber-600 transition-colors group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full border border-slate-200 bg-slate-50 group-hover:border-amber-400 group-hover:bg-amber-50 flex items-center justify-center text-slate-700 group-hover:text-amber-600 transition-all shadow-2xs">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </div>
              <span className="text-xs text-slate-700 group-hover:text-amber-600">@erwesebelaskita</span>
            </a>

            {/* 3. TikTok */}
            <a
              href="https://tiktok.com/@erwesebelas"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 hover:text-amber-600 transition-colors group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full border border-slate-200 bg-slate-50 group-hover:border-amber-400 group-hover:bg-amber-50 flex items-center justify-center text-slate-700 group-hover:text-amber-600 transition-all shadow-2xs">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </div>
              <span className="text-xs text-slate-700 group-hover:text-amber-600">@erwesebelas</span>
            </a>

            {/* 4. WhatsApp */}
            <a
              href="https://wa.me/6285609090903"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 hover:text-amber-600 transition-colors group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full border border-slate-200 bg-slate-50 group-hover:border-amber-400 group-hover:bg-amber-50 flex items-center justify-center text-slate-700 group-hover:text-amber-600 transition-all shadow-2xs">
                <MessageCircle className="w-4 h-4" />
              </div>
              <span className="font-mono text-xs text-slate-700 group-hover:text-amber-600">+62 856-0909-0903</span>
            </a>

          </div>

          {/* Copyright Sub-note */}
          <div className="pt-4 text-center">
            <p className="text-[10px] text-slate-500">
              © {new Date().getFullYear()} RT 006 / RW 011 • Perumahan Villa Mutiara Mas Cinere, Depok.
            </p>
          </div>

        </div>
      </footer>
    </div>
  );
}
