import { useState } from 'react';
import { Users, Calendar, Wallet, CheckCircle2, BarChart2, BookOpen, Layers } from 'lucide-react';

export default function Hero({ totalKK, totalAgendaBulanIni, sisaKasRT, setCurrentPage, publicStats, publicLedger = [] }) {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'chart' | 'ledger'

  const navigateToProfil = () => {
    if (setCurrentPage) setCurrentPage('profil');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Infographic statistics fallback calculation
  const income = publicStats?.total_income || 14800000;
  const expense = publicStats?.total_expense || 5200000;
  const balance = publicStats?.current_balance || sisaKasRT || 9600000;
  const prevBalance = publicStats?.previous_balance || 7500000;
  const totalWarga = publicStats?.total_warga || 128;

  const totalArus = income + expense || 1;
  const incomePct = Math.round((income / totalArus) * 100);
  const expensePct = Math.round((expense / totalArus) * 100);

  // Mock ledger data if API falls back to empty
  const displayLedger = publicLedger.length > 0 ? publicLedger.slice(0, 3) : [
    { id: 1, type: 'in', amount: 4800000, source_type: 'ipl', description: 'Iuran Bulanan Warga (IPL Juli)', transaction_date: '2026-07-05' },
    { id: 2, type: 'out', amount: 1500000, source_type: 'kebersihan', description: 'Pengangkutan Sampah TPA Sawangan', transaction_date: '2026-07-04' },
    { id: 3, type: 'in', amount: 2000000, source_type: 'donasi', description: 'Donasi Pembelian Mesin Fogging', transaction_date: '2026-07-02' }
  ];

  return (
    <section
      id="beranda"
      className="relative min-h-screen pt-24 pb-16 flex items-center justify-center overflow-hidden bg-gradient-to-b from-emerald-50/40 via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900"
    >
      {/* Decorative background shapes */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-emerald-300/10 dark:bg-emerald-500/5 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-teal-300/10 dark:bg-teal-500/5 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Welcoming Text Column */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Selamat Datang Warga Sawangan Green Park
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
              Portal Resmi <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
                Rukun Tetangga
              </span>
            </h1>
            
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Mewujudkan lingkungan hunian yang asri, aman, rukun, dan berteknologi demi kenyamanan bersama. Akses layanan persuratan, agenda warga, dan transparansi kas RT dalam satu tempat.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button
                onClick={() => setCurrentPage && setCurrentPage('layanan')}
                className="inline-flex items-center justify-center px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 dark:from-emerald-500 dark:to-teal-400 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-sm"
              >
                Ajukan Surat Pengantar
              </button>
              <button
                onClick={navigateToProfil}
                className="inline-flex items-center justify-center px-6 py-3.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 font-semibold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-sm"
              >
                Kenali Pengurus RT
              </button>
            </div>

            {/* Quick trust badges */}
            <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-slate-500 dark:text-slate-400 text-sm">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Pelayanan Cepat</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Kas Transparan</span>
              </div>
            </div>
          </div>
          
          {/* Summary Card Column (Right Side) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative group w-full max-w-md">
              {/* Outer gradient glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              
              {/* Core Glass Card */}
              <div className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/80 rounded-3xl shadow-xl p-6 sm:p-8 space-y-6">
                
                {/* Tab controls */}
                <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl text-[10px] font-bold">
                  <button
                    onClick={() => setActiveTab('summary')}
                    className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeTab === 'summary' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Ringkasan</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('chart')}
                    className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeTab === 'chart' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>Grafik Kas</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('ledger')}
                    className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeTab === 'ledger' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Buku Kas</span>
                  </button>
                </div>

                {activeTab === 'summary' && (
                  <div className="space-y-5 animate-fade-in">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                        Informasi Umum RT 04
                      </h3>
                      <p className="text-[10px] text-slate-450 dark:text-slate-400">
                        Statistik terkini kependudukan dan keuangan wilayah komplek.
                      </p>
                    </div>

                    <div className="space-y-3.5">
                      {/* KK Count */}
                      <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50">
                        <div className="p-2.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Keluarga</span>
                          <span className="text-xl font-black text-slate-900 dark:text-white">{totalKK || Math.round(totalWarga / 4)} KK ({totalWarga} Jiwa)</span>
                        </div>
                      </div>

                      {/* Agendas count */}
                      <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50">
                        <div className="p-2.5 bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 rounded-xl">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Agenda Kegiatan</span>
                          <span className="text-xl font-black text-slate-900 dark:text-white">{totalAgendaBulanIni} Terjadwal</span>
                        </div>
                      </div>

                      {/* Cash Balance */}
                      <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50">
                        <div className="p-2.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl">
                          <Wallet className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Saldo Kas RT Aktif</span>
                          <span className="text-xl font-black text-slate-900 dark:text-white">{formatCurrency(balance)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'chart' && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                        Infografis Transparansi Kas
                      </h3>
                      <p className="text-[10px] text-slate-450 dark:text-slate-400">
                        Saldo Awal Kepengurusan Sebelumnya: <span className="font-extrabold text-slate-800 dark:text-white">{formatCurrency(prevBalance)}</span>
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Income Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400">
                          <span>TOTAL ARUS MASUK (PEMASUKAN)</span>
                          <span className="text-emerald-500 font-extrabold">{incomePct}% ({formatCurrency(income)})</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: `${incomePct}%` }}></div>
                        </div>
                      </div>

                      {/* Expense Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400">
                          <span>TOTAL ARUS KELUAR (PENGELUARAN)</span>
                          <span className="text-rose-500 font-extrabold">{expensePct}% ({formatCurrency(expense)})</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-rose-500 to-orange-400 rounded-full" style={{ width: `${expensePct}%` }}></div>
                        </div>
                      </div>

                      {/* Center SVG Circle gauge */}
                      <div className="flex flex-col items-center justify-center pt-2 relative">
                        <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="9" className="dark:stroke-slate-800" />
                          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="9"
                            strokeDasharray={`${2.51 * incomePct} ${251 - 2.51 * incomePct}`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute text-center flex flex-col justify-center">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">SALDO AKHIR</span>
                          <span className="text-xs font-black text-slate-900 dark:text-white mt-1">{formatCurrency(balance)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'ledger' && (
                  <div className="space-y-5 animate-fade-in">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                        Laporan Transaksi Umum
                      </h3>
                      <p className="text-[10px] text-slate-450 dark:text-slate-400">
                        Catatan mutasi kas RT 04 yang dipublikasikan secara transparan.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {displayLedger.map((item) => (
                        <div key={item.id} className="p-3 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 rounded-2xl flex items-center justify-between text-xs transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-800/60">
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-slate-800 dark:text-white block truncate max-w-[200px]">{item.description}</span>
                            <span className="text-[9px] text-slate-400 font-mono block">{item.transaction_date ? item.transaction_date.substring(0, 10) : ''} • {item.source_type?.toUpperCase()}</span>
                          </div>
                          <span className={`font-black font-mono text-right shrink-0 ${item.type === 'in' ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {item.type === 'in' ? '+' : '-'}{formatCurrency(item.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Decorative border bottom note */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                    Diperbarui Secara Berkala
                  </span>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}

