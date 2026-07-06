import { useState } from 'react';
import { Award, Eye, Target, Shield, Heart, HelpCircle } from 'lucide-react';

export default function Profil() {
  const [activeTab, setActiveTab] = useState('visi-misi');

  const pengurusList = [
    {
      role: 'Ketua RT',
      name: 'Pak Bambang Mulyono',
      initials: 'BM',
      gradient: 'from-emerald-500 to-teal-500 shadow-emerald-500/20',
      description: 'Penanggung jawab utama dan pengambil kebijakan tingkat RT.',
    },
    {
      role: 'Sekretaris',
      name: 'Ibu Siti Aminah',
      initials: 'SA',
      gradient: 'from-blue-500 to-indigo-500 shadow-blue-500/20',
      description: 'Mengelola administrasi, surat menyurat, dan arsip warga.',
    },
    {
      role: 'Bendahara',
      name: 'Pak Hendra Wijaya',
      initials: 'HW',
      gradient: 'from-amber-500 to-orange-500 shadow-amber-500/20',
      description: 'Mengelola laporan keuangan, iuran warga, dan kas RT.',
    },
    {
      role: 'Seksi Keamanan',
      name: 'Pak Joko Susilo',
      initials: 'JS',
      gradient: 'from-red-500 to-rose-500 shadow-red-500/20',
      description: 'Mengoordinasi satpam, jadwal siskamling, dan ketertiban.',
    },
    {
      role: 'Seksi Kebersihan',
      name: 'Ibu Rina Lestari',
      initials: 'RL',
      gradient: 'from-teal-500 to-cyan-500 shadow-teal-500/20',
      description: 'Mengelola pengangkutan sampah rutin dan keasrian taman.',
    },
    {
      role: 'Seksi Sosial & Keagamaan',
      name: 'Pak Ahmad Fauzi',
      initials: 'AF',
      gradient: 'from-purple-500 to-pink-500 shadow-purple-500/20',
      description: 'Mengoordinasi kegiatan sosial, santunan, dan acara hari raya.',
    },
  ];

  return (
    <section
      id="profil"
      className="py-20 bg-slate-50 dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
            Profil Lingkungan
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Mengenal RT Sawangan Green Park
          </p>
          <div className="w-12 h-1 bg-emerald-500 mx-auto rounded-full"></div>
        </div>

        {/* Vision, Mission, & History Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-20">
          
          {/* Tabs Sidebar */}
          <div className="lg:col-span-4 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
            <button
              onClick={() => setActiveTab('visi-misi')}
              className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-left text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap lg:whitespace-normal w-full border ${
                activeTab === 'visi-misi'
                  ? 'bg-emerald-500/10 dark:bg-emerald-400/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-white dark:bg-slate-800 border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Eye className="w-5 h-5 flex-shrink-0" />
              <div>
                <span className="block font-bold">Visi & Misi</span>
                <span className="block text-xs font-normal opacity-80 hidden lg:block">Tujuan dan komitmen lingkungan</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('nilai')}
              className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-left text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap lg:whitespace-normal w-full border ${
                activeTab === 'nilai'
                  ? 'bg-emerald-500/10 dark:bg-emerald-400/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-white dark:bg-slate-800 border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Award className="w-5 h-5 flex-shrink-0" />
              <div>
                <span className="block font-bold">Nilai-Nilai Lingkungan</span>
                <span className="block text-xs font-normal opacity-80 hidden lg:block">Prinsip kerukunan warga</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('sejarah')}
              className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-left text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap lg:whitespace-normal w-full border ${
                activeTab === 'sejarah'
                  ? 'bg-emerald-500/10 dark:bg-emerald-400/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-white dark:bg-slate-800 border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <HelpCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <span className="block font-bold">Tentang Sawangan Green Park</span>
                <span className="block text-xs font-normal opacity-80 hidden lg:block">Informasi singkat perumahan</span>
              </div>
            </button>
          </div>

          {/* Content Pane */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-6 sm:p-10 shadow-lg min-h-[300px]">
            {activeTab === 'visi-misi' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Target className="w-6 h-6 text-emerald-500" />
                    Visi
                  </h3>
                  <p className="mt-3 text-slate-600 dark:text-slate-300 leading-relaxed italic">
                    "Menjadikan RT Sawangan Green Park sebagai hunian yang modern, ramah lingkungan, harmonis, aman, dan transparan dalam pelayanan administrasi serta keuangan."
                  </p>
                </div>
                <hr className="border-slate-100 dark:border-slate-700" />
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="w-6 h-6 text-emerald-500" />
                    Misi
                  </h3>
                  <ul className="mt-4 space-y-3 text-slate-600 dark:text-slate-300 list-disc list-inside">
                    <li>Meningkatkan sistem keamanan terpadu demi ketenteraman seluruh warga.</li>
                    <li>Menyelenggarakan program penghijauan dan kebersihan lingkungan berkala.</li>
                    <li>Mengedepankan keterbukaan informasi publik dan pengelolaan kas yang transparan.</li>
                    <li>Membina hubungan kekeluargaan antardaerah tetangga melalui kegiatan sosial dan olahraga bersama.</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'nilai' && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Heart className="w-6 h-6 text-emerald-500" />
                  Prinsip Kerukunan
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                    <h4 className="font-bold text-emerald-800 dark:text-emerald-400">Guyub Rukun</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">Menjunjung tinggi kebersamaan, saling tolong-menolong, dan empati sosial antarwarga.</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/30">
                    <h4 className="font-bold text-teal-800 dark:text-teal-400">Transparansi Keuangan</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">Setiap rupiah yang masuk dan keluar dilaporkan secara terbuka agar tidak menimbulkan kecurigaan.</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                    <h4 className="font-bold text-blue-800 dark:text-blue-400">Respons Cepat</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">Menghadirkan pelayanan administrasi dan koordinasi darurat (keamanan/kesehatan) seefisien mungkin.</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                    <h4 className="font-bold text-amber-800 dark:text-amber-400">Peduli Lingkungan</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">Mengurangi limbah, merawat taman hijau perumahan, dan melakukan pemilahan sampah berkala.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sejarah' && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-6 h-6 text-emerald-500" />
                  Profil Sawangan Green Park
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Sawangan Green Park merupakan klaster perumahan modern berasitektur minimalis asri yang terletak di kawasan Sawangan, Depok. Didirikan untuk memadukan kenyamanan kehidupan suburban dengan kemudahan akses transportasi perkotaan.
                </p>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Saat ini, kepengurusan RT di bawah pimpinan <strong>Pak Bambang Mulyono</strong> berkomitmen untuk mengadopsi teknologi digital demi melayani warganya dengan lebih responsif, transparan, dan inklusif.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Structural Organization Chart */}
        <div className="space-y-12">
          <div className="text-center space-y-3">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Bagan Struktur Kepengurusan RT
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Para pengurus yang mengabdi dan siap melayani aspirasi Anda
            </p>
          </div>

          {/* Interactive Chart Visual */}
          <div className="flex flex-col items-center justify-center space-y-8">
            
            {/* Level 1: Ketua RT */}
            <div className="relative flex flex-col items-center">
              <div className="relative group p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-lg text-center w-72 transition-all duration-300 hover:scale-[1.03] hover:shadow-emerald-500/10">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-300"></div>
                <div className="relative flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center font-extrabold text-xl shadow-lg">
                    {pengurusList[0].initials}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-950 dark:text-white text-lg">{pengurusList[0].name}</h4>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold mt-1 inline-block">
                      {pengurusList[0].role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {pengurusList[0].description}
                  </p>
                </div>
              </div>
              
              {/* Connector line down */}
              <div className="w-0.5 h-10 bg-slate-200 dark:bg-slate-700 mt-2"></div>
            </div>

            {/* Level 2: Core Admin (Sekretaris & Bendahara) */}
            <div className="relative w-full max-w-4xl">
              {/* Horizontal Connector Line */}
              <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-slate-200 dark:bg-slate-700"></div>
              {/* Vertical connector links to level 2 */}
              <div className="absolute top-0 left-1/4 w-0.5 h-6 bg-slate-200 dark:bg-slate-700"></div>
              <div className="absolute top-0 right-1/4 w-0.5 h-6 bg-slate-200 dark:bg-slate-700"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 max-w-2xl mx-auto">
                {pengurusList.slice(1, 3).map((pengurus, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div className="group p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-md text-center w-full max-w-[280px] transition-all duration-300 hover:scale-[1.02] hover:shadow-slate-500/5">
                      <div className="flex flex-col items-center space-y-3">
                        <div className={`w-14 h-14 rounded-full bg-gradient-to-tr ${pengurus.gradient} text-white flex items-center justify-center font-bold text-lg shadow`}>
                          {pengurus.initials}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white">{pengurus.name}</h4>
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold mt-1 inline-block">
                            {pengurus.role}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {pengurus.description}
                        </p>
                      </div>
                    </div>
                    {/* Line down to section */}
                    <div className="w-0.5 h-10 bg-slate-200 dark:bg-slate-700 mt-2"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Level 3: Seksi-Seksi (Divisions) */}
            <div className="relative w-full max-w-7xl pt-4">
              {/* Horizontal line covering the 3 divisions */}
              <div className="absolute top-0 left-1/6 right-1/6 md:left-[16.6%] md:right-[16.6%] h-0.5 bg-slate-200 dark:bg-slate-700"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                {pengurusList.slice(3).map((pengurus, index) => (
                  <div key={index} className="relative flex flex-col items-center">
                    {/* Vertical link connector */}
                    <div className="absolute -top-6 w-0.5 h-6 bg-slate-200 dark:bg-slate-700"></div>
                    
                    <div className="group p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-sm text-center w-full max-w-[280px] transition-all duration-300 hover:scale-[1.02] hover:shadow-slate-500/5">
                      <div className="flex flex-col items-center space-y-3">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-tr ${pengurus.gradient} text-white flex items-center justify-center font-bold shadow`}>
                          {pengurus.initials}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">{pengurus.name}</h4>
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold mt-1 inline-block">
                            {pengurus.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {pengurus.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </section>
  );
}
