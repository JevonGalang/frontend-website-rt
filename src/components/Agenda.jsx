import { useState } from 'react';
import { Calendar as CalendarIcon, MapPin, Clock, Users, ArrowRight } from 'lucide-react';

export default function Agenda({ agendas }) {
  const [selectedAgenda, setSelectedAgenda] = useState(agendas[0] || null);
  
  // Hardcoded calendar display for July 2026 (based on meta-date)
  const daysInMonth = 31;
  const startDayOffset = 3; // July 2026 starts on a Wednesday (0=Sun, 1=Mon, 2=Tue, 3=Wed...)
  
  const getEventForDay = (day) => {
    // July is month 7
    return agendas.find(agenda => {
      const date = new Date(agenda.date);
      return date.getDate() === day && date.getMonth() === 6 && date.getFullYear() === 2026;
    });
  };

  const getCalendarCells = () => {
    const cells = [];
    // Empty cells for offset
    for (let i = 0; i < startDayOffset; i++) {
      cells.push({ day: null, event: null });
    }
    // Days in July
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ day, event: getEventForDay(day) });
    }
    return cells;
  };

  const formatLongDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <section
      id="agenda"
      className="py-20 bg-white dark:bg-slate-950"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
            Agenda Kegiatan
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Kalender & Jadwal Acara Warga
          </p>
          <div className="w-12 h-1 bg-emerald-500 mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          
          {/* Column 1: Kalender Acara (Left Side) */}
          <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="font-extrabold text-lg text-slate-900 dark:text-white">
                  Juli 2026
                </span>
                <span className="text-xs font-semibold px-3 py-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-full">
                  Agenda Aktif
                </span>
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2 text-center text-xs mb-4">
                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day, i) => (
                  <span key={i} className="font-bold text-slate-400 uppercase">{day}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {getCalendarCells().map((cell, index) => {
                  const isEvent = cell.event;
                  const isSelected = selectedAgenda && cell.event && selectedAgenda.id === cell.event.id;

                  return (
                    <button
                      key={index}
                      disabled={!cell.day || !isEvent}
                      onClick={() => cell.event && setSelectedAgenda(cell.event)}
                      className={`relative aspect-square flex items-center justify-center rounded-xl text-xs font-semibold transition-all ${
                        !cell.day
                          ? 'bg-transparent text-transparent pointer-events-none'
                          : isSelected
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 scale-105'
                          : isEvent
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white cursor-pointer'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cell.day}
                      {/* Event Dot */}
                      {isEvent && !isSelected && (
                        <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Calendar Footer Tip */}
            <div className="mt-8 pt-4 border-t border-slate-200/60 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white dark:border-slate-900 inline-block"></span>
              <span>Tanggal dengan lingkaran menunjukkan adanya agenda warga. Klik untuk detail.</span>
            </div>
          </div>

          {/* Column 2: Event Details & Card List (Right Side) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Active Details Box */}
            {selectedAgenda && (
              <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/10 animate-fade-in">
                <div className="absolute top-6 right-6 p-2 bg-white/10 rounded-2xl">
                  <CalendarIcon className="w-6 h-6 text-white" />
                </div>
                
                <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-100">
                  Detail Kegiatan Terpilih
                </span>
                
                <h3 className="text-2xl font-extrabold mt-2 leading-tight">
                  {selectedAgenda.title}
                </h3>
                
                <p className="text-sm text-emerald-50/90 mt-3 leading-relaxed">
                  {selectedAgenda.description}
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/20 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-200 flex-shrink-0" />
                    <span>{formatLongDate(selectedAgenda.date)} ({selectedAgenda.time})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-200 flex-shrink-0" />
                    <span>{selectedAgenda.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-200 flex-shrink-0" />
                    <span>Peserta: {selectedAgenda.participants}</span>
                  </div>
                </div>
              </div>
            )}

            {/* List of All Agendas */}
            <div className="space-y-4 flex-1">
              <h4 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center justify-between">
                <span>Daftar Agenda Mendatang</span>
                <span className="text-xs font-semibold text-slate-500">Total: {agendas.length}</span>
              </h4>

              <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1">
                {agendas.map((agenda) => (
                  <div
                    key={agenda.id}
                    onClick={() => setSelectedAgenda(agenda)}
                    className={`flex items-start justify-between p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      selectedAgenda && selectedAgenda.id === agenda.id
                        ? 'bg-slate-100 dark:bg-slate-800 border-emerald-500/40 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="space-y-1.5 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase">
                          {agenda.category}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                          {new Date(agenda.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <h5 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug">
                        {agenda.title}
                      </h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{agenda.location}</span>
                      </p>
                    </div>

                    <div className="flex-shrink-0 self-center">
                      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500" />
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
