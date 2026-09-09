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
            Peta Wilayah RT 05 / RW 11
          </p>
          <div className="w-12 h-1 bg-orange-500 mx-auto rounded-full"></div>
          <p className="text-xs text-slate-500 max-w-xl mx-auto leading-relaxed">
            Perumahan Villa Mutiara Mas Cinere, Kelurahan Cinere, Kecamatan Limo, Kota Depok, Jawa Barat
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
                  Peta Navigasi Komplek Villa Mutiara Mas Cinere
                </h3>
                <p className="text-xs text-slate-500">
                  Akses gerbang utama, pos satpam, dan denah perumahan
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
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3965.168300825565!2d106.79056851144544!3d-6.3722609935913415!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69eec81b529bb3%3A0x2c0fae0ccf7d3e88!2sJl.%20Vila%20Mutiara%20Cinere%2C%20Grogol%2C%20Kec.%20Limo%2C%20Kota%20Depok%2C%20Jawa%20Barat%2016514!5e0!3m2!1sid!2sid!4v1788915724162!5m2!1sid!2sid"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              title="Peta Wilayah RT Villa Mutiara Mas Cinere"
              className="w-full h-full rounded-2xl"
            />
          </div>

          <div className="pt-4 mt-4 border-t border-slate-200/60 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Jl. Vila Mutiara Cinere, Grogol, Kec. Limo, Kota Depok, Jawa Barat 16514</span>
            <span className="font-bold text-orange-600">Pos Keamanan & Pengurus RT 05</span>
          </div>
        </div>

      </div>
    </section>
  );
}
