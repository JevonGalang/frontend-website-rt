import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, Search, Filter, Calendar } from 'lucide-react';

export default function Kas({ totalPemasukan, totalPengeluaran, sisaKas, transaksiKas }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('Semua'); // 'Semua', 'Pemasukan', 'Pengeluaran'

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredTransactions = transaksiKas.filter((transaksi) => {
    const matchesSearch = transaksi.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          transaksi.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeFilter === 'Semua') return matchesSearch;
    if (activeFilter === 'Pemasukan') return matchesSearch && transaksi.type === 'income';
    if (activeFilter === 'Pengeluaran') return matchesSearch && transaksi.type === 'expense';
    return matchesSearch;
  });

  return (
    <section
      id="kas"
      className="py-20 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/60 dark:border-slate-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
            Transparansi Kas
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Laporan Keuangan & Kas RT
          </p>
          <div className="w-12 h-1 bg-emerald-500 mx-auto rounded-full"></div>
        </div>

        {/* 3 Core Kas Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          
          {/* Card 1: Total Pemasukan */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-sm flex items-center gap-5">
            <div className="p-4 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Pemasukan</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                {formatCurrency(totalPemasukan)}
              </span>
            </div>
          </div>

          {/* Card 2: Total Pengeluaran */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-sm flex items-center gap-5">
            <div className="p-4 bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl">
              <TrendingDown className="w-8 h-8" />
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Pengeluaran</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                {formatCurrency(totalPengeluaran)}
              </span>
            </div>
          </div>

          {/* Card 3: Sisa Kas (Balance) */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-md flex items-center gap-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
            <div className="p-4 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl">
              <Wallet className="w-8 h-8" />
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Sisa Saldo Kas</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                {formatCurrency(sisaKas)}
              </span>
            </div>
          </div>

        </div>

        {/* Transaction Table Controls */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-lg">
          
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
              Rincian Transaksi Kas Terbaru
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  placeholder="Cari transaksi..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              {/* Filter tabs */}
              <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl gap-1">
                {['Semua', 'Pemasukan', 'Pengeluaran'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeFilter === filter
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-4">Tanggal</th>
                  <th className="py-4 px-4">Deskripsi Transaksi</th>
                  <th className="py-4 px-4">Kategori</th>
                  <th className="py-4 px-4 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                      <td className="py-4 px-4 font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(item.date).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-800 dark:text-white">
                        {item.description}
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase">
                          {item.category}
                        </span>
                      </td>
                      <td className={`py-4 px-4 text-right font-black ${
                        item.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-400 dark:text-slate-500">
                      Tidak ada transaksi kas ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </section>
  );
}
