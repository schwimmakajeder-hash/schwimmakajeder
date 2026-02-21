
import React, { useState } from 'react';
import { useStore } from '../../store';
import { FileText, Table, MapPin, Users, Calendar, ChevronDown, ChevronUp, UserCircle, Phone, Mail, User, Info, Repeat, ShieldCheck, AlertCircle, Clock, CheckCircle2, Circle } from 'lucide-react';
import { exportAttendancePDF, exportAttendanceExcel } from '../../utils/export';
import { Course, Participant } from '../../types';

const MyCourses: React.FC = () => {
  const { currentUser, courses, instructors, updateCourse } = useStore();
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);

  const myCoursesList = courses.filter(course => 
    course.sessions.some(session => currentUser && session.instructorIds.includes(currentUser.id))
  );

  const toggleExpand = (id: string) => {
    setExpandedCourseId(expandedCourseId === id ? null : id);
  };

  const getInstructorNames = (ids: string[]) => {
    return ids.map(id => {
      const inst = instructors.find(i => i.id === id);
      return inst ? { name: inst.name, label: inst.category === 'Schwimmlehrer:in' ? 'L' : 'H' } : null;
    }).filter(Boolean);
  };

  const getEndTime = (startTime: string, duration: number) => {
    const [h, m] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m + duration);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const togglePaidStatus = (course: Course, participantId: string) => {
    const updatedParticipants = course.participants.map(p => 
      p.id === participantId ? { ...p, paid: !p.paid } : p
    );
    updateCourse({ ...course, participants: updatedParticipants });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 leading-tight">Meine Kurse</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1 opacity-60">Deine aktive Kursübersicht & Team-Einsätze</p>
        </div>
        <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5" />
          <span className="text-xs font-black uppercase tracking-wider">{myCoursesList.length} Kurse zugeteilt</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {myCoursesList.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
            <Calendar className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-black uppercase tracking-widest">Du bist aktuell keinem Kurs zugeteilt.</p>
          </div>
        ) : (
          myCoursesList.map(course => {
            const isExpanded = expandedCourseId === course.id;
            const regularSessions = course.sessions.filter(s => !s.isReplacement).sort((a,b) => a.date.localeCompare(b.date));
            
            return (
              <div key={course.id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-500 group">
                <div className="flex flex-col">
                  <div className="h-3 w-full" style={{ backgroundColor: course.color }}></div>
                  
                  <div 
                    className="p-8 cursor-pointer hover:bg-slate-50/50 transition-colors"
                    onClick={() => toggleExpand(course.id)}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] rounded-full">{course.category}</span>
                          <div className="flex items-center gap-1.5 text-slate-400 font-black text-[9px] uppercase">
                            <MapPin className="w-3.5 h-3.5" /> {course.location}
                          </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">{course.title}</h3>
                        
                        <div className="flex flex-wrap items-center gap-6 mt-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                              <Users className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900">{course.participants.length}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Teilnehmer</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                              <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900">{course.sessions.length}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Einheiten</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button 
                            onClick={(e) => { e.stopPropagation(); exportAttendancePDF(course, instructors); }}
                            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-100"
                          >
                            <FileText className="w-4 h-4" /> Anwesenheit PDF
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); exportAttendanceExcel(course, instructors); }}
                            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-slate-900 border-2 border-slate-100 rounded-2xl hover:bg-slate-50 transition-all font-black text-[10px] uppercase tracking-widest"
                          >
                            <Table className="w-4 h-4" /> Excel
                          </button>
                        </div>
                        <div className={`p-3 rounded-2xl transition-all ${isExpanded ? 'bg-blue-600 text-white rotate-180' : 'bg-slate-100 text-slate-400'}`}>
                          <ChevronDown className="w-6 h-6" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-10 bg-slate-50/50 border-t border-slate-100 animate-in slide-in-from-top-4 duration-500">
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                        
                        {/* Termine */}
                        <div className="space-y-6">
                          <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-600" /> Detaillierte Terminplanung
                          </h4>
                          <div className="space-y-4">
                            {course.sessions.sort((a,b) => a.date.localeCompare(b.date)).map((session, idx) => {
                              const regularIdx = regularSessions.findIndex(s => s.id === session.id);
                              const numbering = session.isReplacement ? "Ersatz" : `Einheit ${regularIdx + 1}`;
                              const staff = getInstructorNames(session.instructorIds);

                              return (
                                <div key={session.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-200 transition-colors">
                                  <div className="flex items-center gap-5">
                                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 border-2 ${session.isReplacement ? 'bg-orange-50 border-orange-100 text-orange-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                                      <span className="text-[14px] font-black leading-none mb-1">{new Date(session.date).getDate()}</span>
                                      <span className="text-[8px] font-black uppercase tracking-tighter opacity-60">{new Date(session.date).toLocaleDateString('de-DE', { month: 'short' })}</span>
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2 mb-0.5">
                                        <p className="font-black text-slate-900 text-sm">{new Date(session.date).toLocaleDateString('de-DE', { weekday: 'long' })}</p>
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${session.isReplacement ? 'bg-orange-100 border-orange-200 text-orange-700' : 'bg-blue-100 border-blue-200 text-blue-700'}`}>
                                          {numbering}
                                        </span>
                                      </div>
                                      <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wide">
                                        <Clock className="w-3.5 h-3.5" /> {session.startTime} - {getEndTime(session.startTime, session.durationMinutes)} Uhr
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 justify-end">
                                    {staff.map((inst, i) => (
                                      <span key={i} className="px-3 py-1.5 bg-slate-50 text-slate-600 text-[10px] font-black rounded-xl border border-slate-100 flex items-center gap-1.5">
                                        <span className={`w-4 h-4 flex items-center justify-center rounded text-[8px] text-white font-black ${inst?.label === 'L' ? 'bg-blue-500' : 'bg-purple-500'}`}>{inst?.label}</span>
                                        {inst?.name.split(' ')[0]}
                                      </span>
                                    ))}
                                    {staff.length === 0 && <span className="text-[10px] text-red-400 font-bold italic">Unbesetzt</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Teilnehmer */}
                        <div className="space-y-6">
                          <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Users className="w-4 h-4 text-green-600" /> Teilnehmer & Kontaktdaten
                          </h4>
                          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                  <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest">Name / Geb.</th>
                                  <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest">Kontakt (EB)</th>
                                  <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest">Zahlung</th>
                                  <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-right">Infos</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {course.participants.map(p => (
                                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-5">
                                      <p className="font-black text-slate-900 mb-1">{p.name}</p>
                                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString('de-DE') : 'k.A.'}</p>
                                    </td>
                                    <td className="px-6 py-5">
                                      <p className="font-bold text-slate-600 mb-2 text-[11px]">{p.guardianName || 'Kein EB angegeben'}</p>
                                      <div className="flex flex-col gap-1.5">
                                        {p.phone && (
                                          <a href={`tel:${p.phone}`} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors font-bold">
                                            <Phone className="w-3.5 h-3.5" /> <span className="underline underline-offset-2">{p.phone}</span>
                                          </a>
                                        )}
                                        {p.email && (
                                          <a href={`mailto:${p.email}`} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-medium">
                                            <Mail className="w-3.5 h-3.5" /> <span className="truncate max-w-[120px]">{p.email}</span>
                                          </a>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-6 py-5">
                                      <button 
                                        onClick={() => togglePaidStatus(course, p.id)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all font-black text-[9px] uppercase tracking-widest ${
                                          p.paid 
                                          ? 'bg-green-50 border-green-200 text-green-600 shadow-sm' 
                                          : 'bg-white border-slate-100 text-slate-300 hover:border-slate-200'
                                        }`}
                                      >
                                        {p.paid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                                        BEZAHLT
                                      </button>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                      {p.notes ? (
                                        <div className="inline-flex items-start gap-2 p-2 bg-blue-50/50 rounded-lg border border-blue-100 text-left max-w-[150px]">
                                          <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                                          <p className="text-[9px] text-blue-800 leading-tight italic">{p.notes}</p>
                                        </div>
                                      ) : (
                                        <span className="text-slate-300 text-[10px] italic">Keine Notizen</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                                {course.participants.length === 0 && (
                                  <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400 font-bold italic">Noch keine Teilnehmer angemeldet.</td></tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  );
};

export default MyCourses;
