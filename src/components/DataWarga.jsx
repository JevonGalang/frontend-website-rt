import { Users, FileText, HeartCrack, TrendingUp } from 'lucide-react';

export default function DataWarga({ totalKK, totalHidup, totalMeninggal, wargaList = [] }) {
  // Calculated stats
  const totalPenduduk = totalHidup; // Living residents
  const rataRataAnggotaKK = (totalPenduduk / totalKK).toFixed(1);

  // Dynamic calculations based on wargaList
  const livingWarga = wargaList.filter(w => w.statusHidup !== 'Meninggal');
  
  // Calculate Gender Breakdown
  const countLaki = livingWarga.filter(w => w.gender === 'Laki-laki').length;
  const countPerempuan = livingWarga.filter(w => w.gender === 'Perempuan').length;
  
  const lakiLakiVal = livingWarga.length > 0 ? countLaki : 215;
  const perempuanVal = livingWarga.length > 0 ? countPerempuan : 205;
  const sumGender = lakiLakiVal + perempuanVal;
  const pctLaki = sumGender > 0 ? ((lakiLakiVal / sumGender) * 100).toFixed(1) : '51.2';
  const pctPerempuan = sumGender > 0 ? ((perempuanVal / sumGender) * 100).toFixed(1) : '48.8';

  const dataDemografiGender = {
    lakiLaki: lakiLakiVal,
    perempuan: perempuanVal,
  };
  
  // Calculate Age Breakdown
  const childCount = livingWarga.filter(w => w.usia >= 0 && w.usia <= 14).length;
  const activeCount = livingWarga.filter(w => w.usia >= 15 && w.usia <= 64).length;
  const elderlyCount = livingWarga.filter(w => w.usia >= 65).length;
  
  const cCount = livingWarga.length > 0 ? childCount : 92;
  const aCount = livingWarga.length > 0 ? activeCount : 286;
  const eCount = livingWarga.length > 0 ? elderlyCount : 42;
  const sumAge = cCount + aCount + eCount;
  
  const pctChild = sumAge > 0 ? Math.round((cCount / sumAge) * 100) : 22;
  const pctActive = sumAge > 0 ? Math.round((aCount / sumAge) * 100) : 68;
  const pctElderly = sumAge > 0 ? Math.round((eCount / sumAge) * 100) : 10;
  
  const dataDemografiUsia = [
    { label: 'Anak-anak (0-14 thn)', count: cCount, percentage: pctChild, color: 'bg-teal-500' },
    { label: 'Usia Produktif (15-64 thn)', count: aCount, percentage: pctActive, color: 'bg-emerald-500' },
    { label: 'Lansia (65+ thn)', count: eCount, percentage: pctElderly, color: 'bg-amber-500' },
  ];

  return (
    <section
      id="data-warga"
      className="py-20 bg-white dark:bg-slate-950"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
            Statistik Kependudukan
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Data Demografi & Jumlah Warga
          </p>
          <div className="w-12 h-1 bg-emerald-500 mx-auto rounded-full"></div>
        </div>

        {/* 3 Core Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          
          {/* Card 1: Total KK */}
          <div className="group relative bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-8 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Kartu Keluarga</span>
                <span className="block text-4xl font-black text-slate-900 dark:text-white">{totalKK}</span>
                <p className="text-xs text-slate-500 dark:text-slate-400">Terdaftar di wilayah Sawangan Green Park</p>
              </div>
              <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                <FileText className="w-6 h-6" />
              </div>
            </div>
            {/* Average members per family badge */}
            <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Rata-rata Anggota per KK</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">± {rataRataAnggotaKK} Orang</span>
            </div>
          </div>

          {/* Card 2: Penduduk Hidup */}
          <div className="group relative bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-8 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Penduduk Hidup</span>
                <span className="block text-4xl font-black text-emerald-600 dark:text-emerald-400">{totalPenduduk}</span>
                <p className="text-xs text-slate-500 dark:text-slate-400">Warga berstatus aktif tinggal menetap/kontrak</p>
              </div>
              <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                <Users className="w-6 h-6" />
              </div>
            </div>
            {/* Laki vs Perempuan breakdown */}
            <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Laki-Laki : Perempuan</span>
              <span className="font-bold text-slate-800 dark:text-slate-300">
                {dataDemografiGender.lakiLaki} L : {dataDemografiGender.perempuan} P
              </span>
            </div>
          </div>

          {/* Card 3: Penduduk Meninggal */}
          <div className="group relative bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-8 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Penduduk Meninggal</span>
                <span className="block text-4xl font-black text-slate-600 dark:text-slate-400">{totalMeninggal}</span>
                <p className="text-xs text-slate-500 dark:text-slate-400">Kumulatif data kematian warga (arsip RT)</p>
              </div>
              <div className="p-3 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl">
                <HeartCrack className="w-6 h-6" />
              </div>
            </div>
            {/* Death status info */}
            <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Status Pelaporan</span>
              <span className="font-bold text-slate-500 dark:text-slate-400">Tercatat di Kelurahan</span>
            </div>
          </div>

        </div>

        {/* Visual Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Visual 1: Gender Distribution Donut Chart (Left Side) */}
          <div className="lg:col-span-6 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-8 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Distribusi Jenis Kelamin</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pembagian total penduduk hidup berdasarkan gender</p>
            </div>

            {/* Custom SVG Circle Donut Chart */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-6 my-auto">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  {/* Background Track */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e2e8f0" strokeWidth="3" className="dark:stroke-slate-800" />
                  
                  {/* Segment 1: Laki-laki */}
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3.2"
                    strokeDasharray={`${pctLaki} ${100 - parseFloat(pctLaki)}`}
                    strokeDashoffset="0"
                  />
                  
                  {/* Segment 2: Perempuan */}
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke="#0ea5e9"
                    strokeWidth="3.2"
                    strokeDasharray={`${pctPerempuan} ${100 - parseFloat(pctPerempuan)}`}
                    strokeDashoffset={`-${pctLaki}`}
                  />
                </svg>
                
                {/* Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-slate-800 dark:text-white">{totalPenduduk}</span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Warga</span>
                </div>
              </div>

              {/* Legends */}
              <div className="space-y-3 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-md bg-emerald-500"></div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Laki-Laki ({pctLaki}%)</span>
                    <span className="block text-sm font-bold text-slate-900 dark:text-white">{dataDemografiGender.lakiLaki} Jiwa</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-md bg-sky-500"></div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Perempuan ({pctPerempuan}%)</span>
                    <span className="block text-sm font-bold text-slate-900 dark:text-white">{dataDemografiGender.perempuan} Jiwa</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>Rasio gender seimbang mendukung kerukunan sosial klaster.</span>
            </div>
          </div>

          {/* Visual 2: Age Ranges (Right Side) */}
          <div className="lg:col-span-6 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-8 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Kelompok Rentang Usia</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Komposisi penduduk berdasarkan tahapan usia</p>
            </div>

            {/* Progress Bars for demographics */}
            <div className="space-y-6 py-6 my-auto">
              {dataDemografiUsia.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                    <span className="text-slate-900 dark:text-white font-bold">{item.count} Warga ({item.percentage}%)</span>
                  </div>
                  {/* Track */}
                  <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    {/* Bar Fill */}
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${item.color}`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Info */}
            <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 text-[11px] text-slate-400 flex items-center gap-1.5">
              <span>* Data dihimpun dari lampiran sensus KK RT Sawangan Green Park terakhir.</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
