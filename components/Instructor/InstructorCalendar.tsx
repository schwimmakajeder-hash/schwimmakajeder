
import React, { useMemo } from 'react';
import { useStore } from '../../store';
import CalendarView from '../Common/CalendarView';
import { Course, Session } from '../../types';
import { Calendar as CalendarIcon, Download, ShieldCheck } from 'lucide-react';
import { downloadICalFile } from '../../utils/export';

const InstructorCalendar: React.FC = () => {
  const { currentUser, courses, instructors } = useStore();

  const mySessionsData = useMemo(() => {
    if (!currentUser) return [];
    const sessions: { course: Course; session: Session }[] = [];
    courses.forEach(course => {
      course.sessions.forEach(session => {
        if (session.instructorIds.includes(currentUser.id)) {
          sessions.push({ course, session });
        }
      });
    });
    return sessions;
  }, [courses, currentUser]);

  const handleManualExport = () => {
    downloadICalFile(courses, currentUser?.id);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Vereinfachter Header für Trainer */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-blue-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-blue-100">
            <CalendarIcon className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 leading-tight">Mein Terminkalender</h1>
            <p className="text-slate-500 text-sm font-medium flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-500" /> 
              Alle deine Einsätze in der Übersicht
            </p>
          </div>
        </div>
        
        <button 
          onClick={handleManualExport}
          className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-lg shadow-slate-200"
        >
          <Download className="w-4 h-4" /> Kalender exportieren (.ics)
        </button>
      </div>

      <CalendarView 
        title="Monatsübersicht"
        sessions={mySessionsData}
        allInstructors={instructors}
        isGlobal={false}
      />
      
      <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100 flex items-start gap-4">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
          <Download className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest mb-1">Tipp für dein Handy</h4>
          <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
            Nutze den Button "Kalender exportieren", um deine Termine als Datei herunterzuladen. Diese Datei kannst du in Apple Calendar oder Google Calendar öffnen, um deine Schwimmkurse direkt in deinem persönlichen Handy-Kalender zu sehen.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InstructorCalendar;
