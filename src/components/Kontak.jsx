import { MapPin } from 'lucide-react';

export default function Kontak() {
  return (
    <section
      id="kontak"
      className="pt-24 sm:pt-28 pb-16 bg-white"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-xs font-bold text-orange-600 uppercase tracking-widest">
            Lokasi & Wilayah
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Peta Wilayah RT 006 / RW 011 — Blok F1
          </p>
          <div className="w-12 h-1 bg-orange-500 mx-auto rounded-full"></div>
          <p className="text-xs text-slate-500 max-w-xl mx-auto leading-relaxed">
            Perumahan Vila Mutiara Cinere Blok F1, Kelurahan Grogol, Kecamatan Limo, Kota Depok, Jawa Barat 16512
          </p>
        </div>

        {/* Maps Location Frame */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-orange-500/10 text-orange-600 rounded-xl">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                  Peta Navigasi Komplek Vila Mutiara Cinere (Spesifik Blok F1)
                </h3>
                <p className="text-xs text-slate-500">
                  Akses gerbang utama, pos keamanan, dan denah perumahan Blok F1 RT 006 / RW 011
                </p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full border border-emerald-500/20 w-fit">
              🔒 One Gate System • 24 Jam
            </span>
          </div>
          
          {/* Visual Google Map Frame */}
          <div className="w-full h-80 sm:h-[480px] rounded-2xl overflow-hidden bg-slate-200 relative border border-slate-200/70 shadow-inner">
            <iframe
              src="https://maps.google.com/maps?q=Vila+Mutiara+Cinere+Blok+F1,+Grogol,+Kecamatan+Limo,+Kota+Depok,+Jawa+Barat&t=&z=19&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              title="Peta Wilayah RT 006 / RW 011 Vila Mutiara Cinere Blok F1"
              className="w-full h-full rounded-2xl"
            />
          </div>

          <div className="pt-4 mt-4 border-t border-slate-200/60 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Jl. Vila Mutiara Cinere Blok F1, RT 006 / RW 011, Grogol, Kec. Limo, Kota Depok, Jawa Barat 16512</span>
            <span className="font-bold text-orange-600">Pos Keamanan & Wilayah Blok F1 RT 006 / RW 011</span>
          </div>
        </div>

      </div>
    </section>
  );
}
