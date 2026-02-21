
import React, { useState, useMemo } from 'react';
import { Course, Session, User } from '../../types';
import { useStore } from '../../store';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  List, 
  MapPin, 
  Clock, 
  Users, 
  Info, 
  X,
  FileText,
  Table,
  Download,
  Repeat,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { exportAttendancePDF, exportAttendanceExcel, downloadICalFile } from '../../utils/export';

interface CalendarViewProps {
  sessions: { course: Course; session: Session }[];
  allInstructors: User[];
  title: string;
  isGlobal?: boolean;
}

const CalendarView: React.FC<CalendarViewProps> = ({ sessions, allInstructors, title, isGlobal }) => {
  const { currentUser, swapSessionInstructor, requestSwap, swapRequests } = useStore();
  // Geändert: Standardmäßig auf 'list' gesetzt
  const [viewMode, setViewMode] = useState<'month' | 'list'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedItem, setSelectedItem] = useState<{ course: Course; session: Session } | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);
  const [selectedReplacementId, setSelectedReplacementId] = useState<string | null>(null);

  const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const startingDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleSwap = async () => {
    if (!selectedItem || !currentUser || !selectedReplacementId) return;
    
    await requestSwap(
      selectedItem.course.id,
      selectedItem.session.id,
      currentUser.id,
      selectedReplacementId
    );
    closeDetails();
    alert('Tauschanfrage wurde an den Kursleiter gesendet.');
  };

  const closeDetails = () => {
    setSelectedItem(null);
    setIsSwapping(false);
    setSelectedReplacementId(null);
  };

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < startingDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }
    return days;
  }, [currentDate, startingDay, daysInMonth]);

  const getEndTime = (startTime: string, duration: number) => {
    const [h, m] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m + duration);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const checkStaffing = (item: { course: Course; session: Session }) => {
    const staffInSession = item.session.instructorIds.map(id => allInstructors.find(i => i.id === id)).filter(Boolean);
    const countL = staffInSession.filter(i => i?.category === 'Schwimmlehrer:in').length;
    const countH = staffInSession.filter(i => i?.category === 'Helfer:in').length;
    return {
      isUnderstaffed: countL < item.course.requiredInstructors || countH < item.course.requiredHelpers,
      countL,
      countH
    };
  };

  const getSessionsForDay = (day: Date) => {
    const y = day.getFullYear();
    const m = String(day.getMonth() + 1).padStart(2, '0');
    const d = String(day.getDate()).padStart(2, '0');
    const dayStr = `${y}-${m}-${d}`;
    return sessions.filter(s => s.session.date === dayStr);
  };

  const getInstructorDetails = (ids: string[]) => {
    return ids.map(id => {
      const inst = allInstructors.find(i => i.id === id);
      return inst ? { name: inst.name, label: inst.category === 'Schwimmlehrer:in' ? 'L' : 'H' } : null;
    }).filter(Boolean);
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">{title}</h1>
          <p className="text-slate-500 text-sm font-medium">
            {viewMode === 'month' ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}` : 'Chronologische Übersicht'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl">
            <button onClick={() => setViewMode('month')} className={`px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${viewMode === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
              <CalendarIcon className="w-4 h-4" /> Monat
            </button>
            <button onClick={() => setViewMode('list')} className={`px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
              <List className="w-4 h-4" /> Liste
            </button>
          </div>

          {viewMode === 'month' && (
            <div className="flex gap-1.5">
              <button onClick={prevMonth} className="p-2.5 hover:bg-slate-100 rounded-xl border border-slate-200"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 hover:bg-slate-100 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest">Heute</button>
              <button onClick={nextMonth} className="p-2.5 hover:bg-slate-100 rounded-xl border border-slate-200"><ChevronRight className="w-4 h-4" /></button>
            </div>
          )}

          <button onClick={() => downloadICalFile(sessions.map(s => s.course))} className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 text-xs font-black">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
        {viewMode === 'month' ? (
          <div className="p-4 md:p-10">
            <div className="grid grid-cols-7 mb-6">
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
                <div key={d} className="py-2 text-center text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 auto-rows-[110px] md:auto-rows-[160px] border-l border-t border-slate-100 rounded-2xl overflow-hidden">
              {calendarDays.map((day, idx) => {
                const daySessions = day ? getSessionsForDay(day) : [];
                const isToday = day && day.toDateString() === new Date().toDateString();

                return (
                  <div key={idx} className={`border-r border-b border-slate-100 p-2 transition-colors flex flex-col ${day ? 'bg-white hover:bg-slate-50/50' : 'bg-slate-50/10'}`}>
                    {day && (
                      <div className="h-full flex flex-col">
                        <span className={`text-[11px] font-black w-7 h-7 flex items-center justify-center rounded-xl mb-2 shrink-0 ${isToday ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400'}`}>
                          {day.getDate()}
                        </span>
                        <div className="flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden custom-scrollbar">
                          {daySessions.map((item, sIdx) => {
                            const { isUnderstaffed } = checkStaffing(item);
                            return (
                              <button
                                key={sIdx}
                                onClick={() => setSelectedItem(item)}
                                className={`w-full text-left px-2 py-1.5 rounded-lg text-[9px] font-black text-white truncate shadow-sm transition-all hover:scale-105 flex items-center justify-between group relative ${isUnderstaffed ? 'ring-2 ring-red-400 ring-offset-1' : ''}`}
                                style={{ backgroundColor: item.course.color }}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="opacity-80 tabular-nums shrink-0">{item.session.startTime}</span>
                                  <span className="truncate">{item.course.title}</span>
                                </div>
                                {isUnderstaffed && <AlertTriangle className="w-3 h-3 text-white fill-red-500 shrink-0 animate-pulse" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Datum & Zeit</th>
                  <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Kurs / Ort</th>
                  <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Team-Status</th>
                  <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Info</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.length > 0 ? (
                  sessions.sort((a,b) => {
                    const dateComp = a.session.date.localeCompare(b.session.date);
                    if (dateComp !== 0) return dateComp;
                    return a.session.startTime.localeCompare(b.session.startTime);
                  }).map((item, idx) => {
                    const { isUnderstaffed, countL, countH } = checkStaffing(item);
                    return (
                      <tr key={idx} onClick={() => setSelectedItem(item)} className="hover:bg-slate-50/80 cursor-pointer transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                              <Clock className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-black text-slate-900">{new Date(item.session.date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}</p>
                              <p className="text-xs text-slate-500 font-bold tabular-nums">
                                {item.session.startTime} - {getEndTime(item.session.startTime, item.session.durationMinutes)} Uhr
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-2.5 h-12 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: item.course.color }}></div>
                            <div className="min-w-0">
                              <p className="font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate">{item.course.title}</p>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-black uppercase truncate mt-0.5">
                                <MapPin className="w-3.5 h-3.5 shrink-0" /> {item.course.location}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="flex flex-wrap gap-1.5 max-w-[180px]">
                              {getInstructorDetails(item.session.instructorIds).map((inst, i) => (
                                <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 text-[9px] font-black rounded-lg border border-slate-200 flex items-center gap-1.5">
                                  <span className={`w-3.5 h-3.5 flex items-center justify-center rounded-sm text-[7px] text-white shrink-0 ${inst?.label === 'L' ? 'bg-blue-500' : 'bg-purple-500'}`}>
                                    {inst?.label}
                                  </span>
                                  {inst?.name.split(' ')[0]}
                                </span>
                              ))}
                            </div>
                            {isUnderstaffed ? (
                              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-xl border border-red-100 shrink-0">
                                <AlertTriangle className="w-4 h-4 animate-pulse" />
                                <span className="text-[10px] font-black uppercase">{countL}/{item.course.requiredInstructors} L | {countH}/{item.course.requiredHelpers} H</span>
                              </div>
                            ) : (
                              <div className="p-2 bg-green-50 text-green-600 rounded-full border border-green-100">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <div className="inline-flex items-center justify-center w-10 h-10 bg-slate-100 rounded-2xl text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm group-hover:shadow-blue-100">
                            <ChevronRight className="w-5 h-5" />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan={4} className="px-8 py-32 text-center text-slate-300 font-black uppercase tracking-widest text-lg">Keine Termine</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md" onClick={closeDetails}></div>
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
            <div className="h-4 w-full" style={{ backgroundColor: selectedItem.course.color }}></div>
            <button onClick={closeDetails} className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-2xl text-slate-400 transition-colors z-10"><X className="w-6 h-6" /></button>

            <div className="p-10">
              <div className="mb-10">
                <span className="px-4 py-1.5 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-4 inline-block">{selectedItem.course.category}</span>
                <h2 className="text-3xl font-black text-slate-900 leading-tight mb-2">{selectedItem.course.title}</h2>
                <div className="flex items-center gap-2 text-slate-400 font-bold text-sm"><MapPin className="w-4 h-4" /> {selectedItem.course.location}</div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-10">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-400 mb-2">
                    <CalendarIcon className="w-4 h-4 shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Datum & Zeit</span>
                  </div>
                  <p className="font-black text-slate-800 text-base">{new Date(selectedItem.session.date).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', weekday: 'short' })}</p>
                  <p className="font-bold text-blue-600 text-sm mt-1">{selectedItem.session.startTime} - {getEndTime(selectedItem.session.startTime, selectedItem.session.durationMinutes)} Uhr</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-400 mb-2">
                    <Users className="w-4 h-4 shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Teilnehmer</span>
                  </div>
                  <p className="font-black text-slate-800 text-base">{selectedItem.course.participants.length} Personen</p>
                  <p className="font-bold text-slate-400 text-xs mt-1">Soll: {selectedItem.course.requiredInstructors}L + {selectedItem.course.requiredHelpers}H</p>
                </div>
              </div>

              <div className="mb-10">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                  <span>Eingeteiltes Team</span>
                  {checkStaffing(selectedItem).isUnderstaffed && <span className="text-red-500">Personalmangel!</span>}
                </h4>
                <div className="space-y-3">
                  {getInstructorDetails(selectedItem.session.instructorIds).map((inst, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white border-2 border-slate-50 rounded-2xl hover:border-slate-100 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 flex items-center justify-center rounded-xl text-xs text-white font-black shrink-0 ${inst?.label === 'L' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                          {inst?.label}
                        </div>
                        <span className="font-black text-slate-700">{inst?.name}</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        {inst?.label === 'Lehrer:in' ? 'Lehrer:in' : 'Helfer:in'}
                      </span>
                    </div>
                  ))}
                  {selectedItem.session.instructorIds.length === 0 && <p className="text-sm text-red-400 italic font-bold py-4 border-2 border-dashed border-red-50 rounded-2xl text-center">Noch niemand eingeteilt!</p>}
                </div>

                {/* Pending Swaps */}
                {swapRequests.filter(r => r.sessionId === selectedItem.session.id && r.status === 'PENDING').map(req => {
                  const fromInst = allInstructors.find(i => i.id === req.requestingInstructorId);
                  const toInst = allInstructors.find(i => i.id === req.targetInstructorId);
                  return (
                    <div key={req.id} className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
                      <Repeat className="w-4 h-4 text-amber-600 shrink-0" />
                      <p className="text-[10px] font-bold text-amber-800 uppercase tracking-tight">
                        Tausch angefragt: {fromInst?.name} → {toInst?.name}
                      </p>
                      <span className="ml-auto text-[9px] font-black bg-amber-200 text-amber-700 px-2 py-1 rounded-lg">WARTEND</span>
                    </div>
                  );
                })}

                {currentUser && selectedItem.session.instructorIds.includes(currentUser.id) && !isSwapping && !swapRequests.some(r => r.sessionId === selectedItem.session.id && r.status === 'PENDING' && r.requestingInstructorId === currentUser.id) && (
                  <button 
                    onClick={() => setIsSwapping(true)}
                    className="mt-4 w-full py-4 bg-amber-50 text-amber-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-amber-200 flex items-center justify-center gap-2 hover:bg-amber-100 transition-all shadow-sm"
                  >
                    <Repeat className="w-4 h-4" /> Termin Tauschen / Ersatz finden
                  </button>
                )}

                {isSwapping && (
                  <div className="mt-6 p-6 bg-amber-50 rounded-[2.5rem] border border-amber-100 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <Repeat className="w-4 h-4 text-amber-600" />
                        <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-widest">Ersatz auswählen</h4>
                      </div>
                      <button onClick={() => setIsSwapping(false)} className="p-2 hover:bg-amber-100 rounded-xl text-amber-500 transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                      {allInstructors
                        .filter(inst => inst.id !== currentUser?.id)
                        .map(inst => (
                          <button
                            key={inst.id}
                            onClick={() => setSelectedReplacementId(inst.id)}
                            className={`flex items-center justify-between p-4 border rounded-2xl transition-all text-left group ${
                              selectedReplacementId === inst.id 
                                ? 'bg-blue-50 border-blue-300 shadow-md' 
                                : 'bg-white border-amber-100 hover:border-amber-300'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs text-white font-black ${inst.category === 'Schwimmlehrer:in' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                                {inst.category === 'Schwimmlehrer:in' ? 'L' : 'H'}
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-800">{inst.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{inst.category}</p>
                              </div>
                            </div>
                            {selectedReplacementId === inst.id && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                          </button>
                        ))}
                    </div>

                    {selectedReplacementId && (
                      <button
                        onClick={handleSwap}
                        className="mt-6 w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 animate-in zoom-in-95"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Tausch mit OK bestätigen
                      </button>
                    )}

                    <p className="mt-4 text-[10px] text-amber-700 font-medium leading-relaxed italic">
                      Hinweis: Der Kursleiter muss diesen Tausch bestätigen. Danach wird der Termin automatisch in deinen Kalender ausgetragen und beim Kollegen eingetragen.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button onClick={() => exportAttendancePDF(selectedItem.course, allInstructors)} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-100 uppercase tracking-widest">
                  <FileText className="w-4 h-4" /> PDF Liste
                </button>
                <button onClick={() => exportAttendanceExcel(selectedItem.course, allInstructors)} className="flex-1 py-4 bg-white text-slate-900 border-2 border-slate-100 rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition-all uppercase tracking-widest">
                  <Table className="w-4 h-4" /> Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
