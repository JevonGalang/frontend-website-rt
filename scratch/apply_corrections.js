const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', '..', '..', '..', '..', 'Documents', 'web rt', 'frontend-website-rt', 'src', 'components', 'AdminDashboard.jsx');

if (!fs.existsSync(targetFile)) {
  console.log('Error: Target file not found at:', targetFile);
  process.exit(1);
}

let content = fs.readFileSync(targetFile, 'utf8');

// 1. Correct the Sekretaris isWargaOpen submenu (remove sek_warga_masuk and sek_warga_keluar)
const oldSekWargaBlock = `                {isWargaOpen && (
                  <div className="pl-6 py-1 space-y-1 border-l border-slate-200/60 dark:border-slate-800 ml-6 font-sans text-xs">
                    <button
                      onClick={() => { setActiveTab('warga'); setSearchQuery(''); }}
                      className={\`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 \${
                        activeTab === 'warga' 
                          ? 'text-emerald-400 font-bold bg-slate-800/50' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                      }\`}
                    >
                      <span className={\`w-1.5 h-1.5 rounded-full transition-all \${activeTab === 'warga' ? 'bg-emerald-450 scale-125' : 'bg-slate-600'}\`}></span>
                      <span>Data Penduduk</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('sek_warga_kk'); setSearchQuery(''); }}
                      className={\`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 \${
                        activeTab === 'sek_warga_kk' 
                          ? 'text-emerald-600 dark:text-emerald-450 font-bold bg-emerald-50/50 dark:bg-slate-850/50'
                          : 'text-slate-500 dark:text-slate-450 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/30 dark:hover:bg-slate-800/30'
                      }\`}
                    >
                      <span className={\`w-1.5 h-1.5 rounded-full transition-all \${activeTab === 'sek_warga_kk' ? 'bg-emerald-400 scale-125' : 'bg-slate-600'}\`}></span>
                      <span>Data KK</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('sek_warga_masuk'); setSearchQuery(''); }}
                      className={\`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 \${
                        activeTab === 'sek_warga_masuk' 
                          ? 'text-emerald-600 dark:text-emerald-450 font-bold bg-emerald-50/50 dark:bg-slate-850/50'
                          : 'text-slate-500 dark:text-slate-450 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/30 dark:hover:bg-slate-800/30'
                      }\`}
                    >
                      <span className={\`w-1.5 h-1.5 rounded-full transition-all \${activeTab === 'sek_warga_masuk' ? 'bg-emerald-450 scale-125' : 'bg-slate-600'}\`}></span>
                      <span>Penduduk Masuk</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('sek_warga_keluar'); setSearchQuery(''); }}
                      className={\`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 \${
                        activeTab === 'sek_warga_keluar' 
                          ? 'text-emerald-600 dark:text-emerald-450 font-bold bg-emerald-50/50 dark:bg-slate-850/50'
                          : 'text-slate-500 dark:text-slate-450 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/30 dark:hover:bg-slate-800/30'
                      }\`}
                    >
                      <span className={\`w-1.5 h-1.5 rounded-full transition-all \${activeTab === 'sek_warga_keluar' ? 'bg-emerald-450 scale-125' : 'bg-slate-600'}\`}></span>
                      <span>Penduduk Keluar</span>
                    </button>
                  </div>
                )}`;

const newSekWargaBlock = `                {isWargaOpen && (
                  <div className="pl-6 py-1 space-y-1 border-l border-slate-200/60 dark:border-slate-800 ml-6 font-sans text-xs">
                    <button
                      onClick={() => { setActiveTab('warga'); setSearchQuery(''); }}
                      className={\`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 \${
                        activeTab === 'warga' 
                          ? 'text-emerald-400 font-bold bg-slate-800/50' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                      }\`}
                    >
                      <span className={\`w-1.5 h-1.5 rounded-full transition-all \${activeTab === 'warga' ? 'bg-emerald-450 scale-125' : 'bg-slate-600'}\`}></span>
                      <span>Data Penduduk</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('sek_warga_kk'); setSearchQuery(''); }}
                      className={\`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 \${
                        activeTab === 'sek_warga_kk' 
                          ? 'text-emerald-600 dark:text-emerald-450 font-bold bg-emerald-50/50 dark:bg-slate-850/50'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/30 dark:hover:bg-slate-800/30'
                      }\`}
                    >
                      <span className={\`w-1.5 h-1.5 rounded-full transition-all \${activeTab === 'sek_warga_kk' ? 'bg-emerald-400 scale-125' : 'bg-slate-600'}\`}></span>
                      <span>Data KK</span>
                    </button>
                  </div>
                )}`;

if (content.includes(oldSekWargaBlock)) {
  content = content.replace(oldSekWargaBlock, newSekWargaBlock);
  console.log('Replaced Sekretaris Data Warga submenu successfully');
} else {
  console.log('Sekretaris Data Warga submenu block not matched! Checking sub-parts...');
}

// 2. Replace the RT/Admin sidebar with the styled light-theme, collapsible, and corrected version
const oldRtSidebarBlock = `          ) : (
            <>
              {/* ORIGINAL SIDEBAR STRUCTURE FOR RT / SEKRETARIS */}
              <button
                onClick={() => { setActiveTab('overview'); setSearchQuery(''); }}
                className={\`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer \${
                  activeTab === 'overview'
                    ? 'bg-emerald-650 text-white shadow-lg shadow-emerald-650/15'
                    : 'hover:bg-slate-800 hover:text-white'
                }\`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Ringkasan</span>
              </button>
              
              <button
                onClick={() => { setActiveTab('warga'); setSearchQuery(''); }}
                className={\`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer \${
                  activeTab === 'warga'
                    ? 'bg-emerald-655 text-white shadow-lg shadow-emerald-655/15'
                    : 'hover:bg-slate-800 hover:text-white'
                }\`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4" />
                  <span>Data Warga</span>
                </div>
                <span className="text-xs bg-slate-800 dark:bg-slate-950/60 px-2 py-0.5 rounded-full font-bold text-slate-400">{totalWarga}</span>
              </button>

              <button
                onClick={() => { setActiveTab('kas'); setSearchQuery(''); }}
                className={\`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer \${
                  activeTab === 'kas'
                    ? 'bg-emerald-655 text-white shadow-lg shadow-emerald-655/15'
                    : 'hover:bg-slate-800 hover:text-white'
                }\`}
              >
                <Wallet className="w-4 h-4" />
                <span>Kas RT Keuangan</span>
              </button>

              <button
                onClick={() => { setActiveTab('agenda'); setSearchQuery(''); }}
                className={\`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer \${
                  activeTab === 'agenda'
                    ? 'bg-emerald-655 text-white shadow-lg shadow-emerald-655/15'
                    : 'hover:bg-slate-800 hover:text-white'
                }\`}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4" />
                  <span>Agenda RT</span>
                </div>
                <span className="text-xs bg-slate-800 dark:bg-slate-950/60 px-2 py-0.5 rounded-full font-bold text-slate-400">{totalAgendas}</span>
              </button>
              <button
                onClick={() => { setActiveTab('layanan'); setSearchQuery(''); }}
                className={\`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer \${
                  activeTab === 'layanan'
                    ? 'bg-emerald-655 text-white shadow-lg shadow-emerald-655/15'
                    : 'hover:bg-slate-800 hover:text-white'
                }\`}
              >
                <div className="flex items-center gap-3">
                  <FileCheck className="w-4 h-4" />
                  <span>Pengajuan Surat</span>
                </div>
                {pendingSubmissionsCount > 0 && (
                  <span className="text-xs bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                    {pendingSubmissionsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => { setActiveTab('logs'); setSearchQuery(''); }}
                className={\`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer \${
                  activeTab === 'logs'
                    ? 'bg-emerald-655 text-white shadow-lg shadow-emerald-655/15'
                    : 'hover:bg-slate-800 hover:text-white'
                }\`}
              >
                <Activity className="w-4 h-4" />
                <span>Log Akses Warga</span>
              </button>
            </>`;

// RT/Admin layout (light theme, collapsible, without Penduduk Masuk/Keluar)
const newRtSidebarBlock = `          ) : (
            <div className="space-y-1.5 font-sans">
              {/* Admin RT Specific Sidebar Menu */}
              {/* Dashboard */}
              <button
                onClick={() => { setActiveTab('overview'); setSearchQuery(''); }}
                className={\`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer \${
                  activeTab === 'overview'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }\`}
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                <span>Dashboard</span>
              </button>

              {/* Data Warga */}
              <div>
                <button
                  onClick={() => setIsWargaOpen(!isWargaOpen)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-sky-400" />
                    <span>Data Warga</span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-extrabold">{isWargaOpen ? '▼' : '▶'}</span>
                </button>

                {isWargaOpen && (
                  <div className="pl-6 py-1 space-y-1 border-l border-slate-200/60 dark:border-slate-800 ml-6 font-sans text-xs">
                    <button
                      onClick={() => { setActiveTab('warga'); setSearchQuery(''); }}
                      className={\`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 \${
                        activeTab === 'warga' 
                          ? 'text-emerald-600 dark:text-emerald-450 font-bold bg-emerald-50/50 dark:bg-slate-850/50'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/30 dark:hover:bg-slate-800/30'
                      }\`}
                    >
                      <span className={\`w-1.5 h-1.5 rounded-full transition-all \${activeTab === 'warga' ? 'bg-emerald-450 scale-125' : 'bg-slate-600'}\`}></span>
                      <span>Data Penduduk</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('sek_warga_kk'); setSearchQuery(''); }}
                      className={\`w-full text-left py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 \${
                        activeTab === 'sek_warga_kk' 
                          ? 'text-emerald-600 dark:text-emerald-450 font-bold bg-emerald-50/50 dark:bg-slate-850/50'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/30 dark:hover:bg-slate-800/30'
                      }\`}
                    >
                      <span className={\`w-1.5 h-1.5 rounded-full transition-all \${activeTab === 'sek_warga_kk' ? 'bg-emerald-450 scale-125' : 'bg-slate-600'}\`}></span>
                      <span>Data KK</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Persetujuan Surat */}
              <button
                onClick={() => { setActiveTab('layanan'); setSearchQuery(''); }}
                className={\`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer \${
                  activeTab === 'layanan'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }\`}
              >
                <div className="flex items-center gap-3">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span>Persetujuan Surat</span>
                </div>
                {pendingSubmissionsCount > 0 && (
                  <span className="text-xs bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                    {pendingSubmissionsCount}
                  </span>
                )}
              </button>

              {/* Monitoring Keuangan */}
              <button
                onClick={() => { setActiveTab('kas'); setSearchQuery(''); }}
                className={\`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer \${
                  activeTab === 'kas'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }\`}
              >
                <Wallet className="w-4 h-4 text-amber-400" />
                <span>Monitoring Keuangan</span>
              </button>

              {/* Pengumuman */}
              <button
                onClick={() => { setActiveTab('sek_info_pengumuman'); setSearchQuery(''); }}
                className={\`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer \${
                  activeTab === 'sek_info_pengumuman'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }\`}
              >
                <Volume2 className="w-4 h-4 text-sky-400" />
                <span>Pengumuman</span>
              </button>

              {/* Agenda RT */}
              <button
                onClick={() => { setActiveTab('agenda'); setSearchQuery(''); }}
                className={\`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer \${
                  activeTab === 'agenda'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }\`}
              >
                <Calendar className="w-4 h-4 text-emerald-450" />
                <span>Agenda RT</span>
              </button>

              {/* Pengaduan */}
              <button
                onClick={() => { setActiveTab('sek_pengaduan'); setSearchQuery(''); }}
                className={\`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer \${
                  activeTab === 'sek_pengaduan'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }\`}
              >
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Pengaduan</span>
              </button>

              {/* Arsip */}
              <button
                onClick={() => { setActiveTab('sek_arsip'); setSearchQuery(''); }}
                className={\`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer \${
                  activeTab === 'sek_arsip'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }\`}
              >
                <FolderOpen className="w-4 h-4 text-purple-400" />
                <span>Arsip</span>
              </button>

              {/* Laporan */}
              <button
                onClick={() => { setActiveTab('sek_laporan'); setSearchQuery(''); }}
                className={\`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer \${
                  activeTab === 'sek_laporan'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }\`}
              >
                <BarChart3 className="w-4 h-4 text-pink-400" />
                <span>Laporan</span>
              </button>

              {/* Manajemen Akun */}
              <button
                onClick={() => { setActiveTab('sek_akun_manage'); setSearchQuery(''); }}
                className={\`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer \${
                  activeTab === 'sek_akun_manage'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }\`}
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>Manajemen Akun</span>
              </button>

              {/* Statistik */}
              <button
                onClick={() => { setActiveTab('rt_statistik'); setSearchQuery(''); }}
                className={\`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer \${
                  activeTab === 'rt_statistik'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }\`}
              >
                <TrendingUp className="w-4 h-4 text-teal-400" />
                <span>Statistik</span>
              </button>

              {/* Pengaturan */}
              <button
                onClick={() => { setActiveTab('pengaturan'); setSearchQuery(''); }}
                className={\`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer \${
                  activeTab === 'pengaturan'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }\`}
              >
                <Settings className="w-4 h-4 text-slate-500" />
                <span>Pengaturan</span>
              </button>
            </div>`;

// Check if old RT block contains the dark original sidebar layout
if (content.includes('{/* ORIGINAL SIDEBAR STRUCTURE FOR RT / SEKRETARIS */}')) {
  // Let's replace the block dynamically
  const startIdx = content.indexOf(') : (\n            <>\n              {/* ORIGINAL SIDEBAR STRUCTURE FOR RT / SEKRETARIS */}');
  const endIdx = content.indexOf('</>\n          )}\n        </nav>', startIdx);
  if (startIdx !== -1 && endIdx !== -1) {
    const rawToReplace = content.substring(startIdx, endIdx + 4); // Include '</>'
    content = content.replace(rawToReplace, ') : (\n' + newRtSidebarBlock);
    console.log('Replaced RT sidebar successfully');
  } else {
    console.log('Could not find index bounds of RT sidebar');
  }
} else {
  console.log('ORIGINAL SIDEBAR comment not found!');
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('AdminDashboard.jsx has been updated with corrections');
