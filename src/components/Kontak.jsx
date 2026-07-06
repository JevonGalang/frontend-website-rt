import React, { useState } from 'react';
import { Phone, MessageSquare, MapPin, Mail, Send, ExternalLink } from 'lucide-react';

export default function Kontak() {
  const [waName, setWaName] = useState('');
  const [waMessage, setWaMessage] = useState('');

  // Dummy RT Chairman Contact Details
  const kontakRt = {
    nama: 'Pak Bambang Mulyono',
    jabatan: 'Ketua RT 04 / RW 09',
    telepon: '+62 812-3456-7890',
    whatsapp: '6281234567890', // Internasional format without '+'
    alamat: 'Perumahan Sawangan Green Park, Blok B3 No. 12, Sawangan, Depok',
    email: 'rt.sawangangreenpark@gmail.com',
  };

  const handleSendWhatsApp = (e) => {
    e.preventDefault();
    if (!waName || !waMessage) return;

    // Constructing WhatsApp message
    const formattedMessage = `Halo ${kontakRt.nama}, saya ${waName} (warga Sawangan Green Park). %0A%0A${waMessage}`;
    const waUrl = `https://wa.me/${kontakRt.whatsapp}?text=${formattedMessage}`;
    
    // Redirect to WhatsApp
    window.open(waUrl, '_blank');
    
    // Clear inputs
    setWaName('');
    setWaMessage('');
  };

  return (
    <section
      id="kontak"
      className="py-20 bg-white dark:bg-slate-950"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
            Hubungi Kami
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Kontak Pengurus & Peta RT
          </p>
          <div className="w-12 h-1 bg-emerald-500 mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          
          {/* Column 1: Contact Details & Quick WhatsApp (Left) */}
          <div className="lg:col-span-6 space-y-8 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Kontak Utama Ketua RT
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Hubungi untuk keperluan darurat atau koordinasi lingkungan
                </p>
              </div>

              {/* Contact Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Alamat */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 flex items-start gap-4">
                  <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex-shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Alamat Sekretariat</span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      {kontakRt.alamat}
                    </p>
                  </div>
                </div>

                {/* Telepon */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 flex items-start gap-4">
                  <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl flex-shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Nomor Telepon</span>
                    <a href={`tel:${kontakRt.telepon}`} className="block text-sm text-slate-700 dark:text-slate-300 font-bold hover:text-blue-500">
                      {kontakRt.telepon}
                    </a>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 flex items-start gap-4">
                  <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 rounded-xl flex-shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">WhatsApp Chat</span>
                    <a
                      href={`https://wa.me/${kontakRt.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-slate-700 dark:text-slate-300 font-bold hover:text-emerald-500 flex items-center gap-1"
                    >
                      <span>Hubungi WA</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 flex items-start gap-4">
                  <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl flex-shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Email Korespondensi</span>
                    <a href={`mailto:${kontakRt.email}`} className="block text-xs text-slate-700 dark:text-slate-300 font-bold hover:text-amber-500 break-all">
                      {kontakRt.email}
                    </a>
                  </div>
                </div>

              </div>
            </div>

            {/* Quick WhatsApp Chat Form */}
            <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
              <h4 className="font-extrabold text-slate-900 dark:text-white text-sm mb-4">
                Kirim Pesan WhatsApp Cepat ke Ketua RT
              </h4>
              <form onSubmit={handleSendWhatsApp} className="space-y-4">
                <div>
                  <input
                    required
                    type="text"
                    placeholder="Nama Anda"
                    value={waName}
                    onChange={(e) => setWaName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <textarea
                    required
                    rows={3}
                    placeholder="Tulis pesan atau pertanyaan Anda di sini..."
                    value={waMessage}
                    onChange={(e) => setWaMessage(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim via WhatsApp</span>
                </button>
              </form>
            </div>
          </div>

          {/* Column 2: Maps Location Frame Mock (Right) */}
          <div className="lg:col-span-6 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Peta Wilayah RT Sawangan Green Park
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Lokasi klaster dan pos satpam utama Sawangan Green Park
              </p>
            </div>
            
            {/* Visual Google Map Frame Mock */}
            <div className="w-full h-72 sm:h-96 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 relative flex items-center justify-center border border-slate-200/50 dark:border-slate-700/50">
              {/* Decorative grid pattern as a "Map" representation */}
              <div className="absolute inset-0 bg-slate-100 dark:bg-slate-900 opacity-30 bg-grid-pattern"></div>
              
              {/* Map mockup graphic */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-3 z-10 px-4">
                  <div className="inline-block p-4 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/30 animate-pulse">
                    <MapPin className="w-8 h-8" />
                  </div>
                  <h4 className="font-extrabold text-slate-800 dark:text-white text-base">Sawangan Green Park</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                    Kawasan RT 04 / RW 09 Kelurahan Sawangan, Kecamatan Sawangan, Kota Depok, Jawa Barat
                  </p>
                </div>
              </div>

              {/* Map overlays / streets lines mock */}
              <div className="absolute inset-0 opacity-10 border-t border-b border-l border-r border-slate-400 pointer-events-none">
                <div className="w-full h-0.5 bg-slate-400 absolute top-1/3"></div>
                <div className="w-full h-0.5 bg-slate-400 absolute top-2/3"></div>
                <div className="w-0.5 h-full bg-slate-400 absolute left-1/3"></div>
                <div className="w-0.5 h-full bg-slate-400 absolute left-2/3"></div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-200/60 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>* Akses masuk klaster satu pintu (One Gate System)</span>
              <span className="font-bold text-emerald-500">Security 24 Jam</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
