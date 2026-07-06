import { Users, Calendar, Wallet, ChevronDown, CheckCircle2 } from 'lucide-react';

export default function Hero({ totalKK, totalAgendaBulanIni, sisaKasRT }) {
  const scrollToProfil = () => {
    const el = document.getElementById('profil');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

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
                onClick={() => document.getElementById('layanan')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center justify-center px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 dark:from-emerald-500 dark:to-teal-400 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-sm"
              >
                Ajukan Surat Pengantar
              </button>
              <button
                onClick={scrollToProfil}
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
              <div className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/80 rounded-3xl shadow-xl p-8 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Ringkasan Informasi RT
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Data terkini wilayah RT Sawangan Green Park
                  </p>
                </div>
                
                {/* Stats Items */}
                <div className="space-y-4">
                  {/* Item 1: Total KK */}
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 hover:bg-emerald-500/5 dark:hover:bg-emerald-500/5 border border-slate-100 dark:border-slate-800/50 transition-colors">
                    <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Keluarga</span>
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">{totalKK} KK</span>
                    </div>
                  </div>

                  {/* Item 2: Agenda Bulan Ini */}
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 hover:bg-teal-500/5 dark:hover:bg-teal-500/5 border border-slate-100 dark:border-slate-800/50 transition-colors">
                    <div className="p-3 bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 rounded-xl">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Agenda Bulan Ini</span>
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">{totalAgendaBulanIni} Kegiatan</span>
                    </div>
                  </div>

                  {/* Item 3: Sisa Kas */}
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 hover:bg-amber-500/5 dark:hover:bg-amber-500/5 border border-slate-100 dark:border-slate-800/50 transition-colors">
                    <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl">
                      <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Sisa Kas RT</span>
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(sisaKasRT)}</span>
                    </div>
                  </div>
                </div>
                
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

        {/* Floating Indicator */}
        <div className="flex justify-center mt-12 lg:mt-20">
          <button
            onClick={scrollToProfil}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-emerald-500 dark:text-slate-500 dark:hover:text-emerald-400 transition-colors cursor-pointer animate-bounce"
          >
            <span className="text-xs uppercase tracking-widest font-bold">Scroll Ke Bawah</span>
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
