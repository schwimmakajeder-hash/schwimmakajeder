
import React, { useEffect, useState, useMemo } from 'react';
import { useStore, generateDefaultPassword } from './store';
import Layout from './components/Layout';
import CourseEditor from './components/Admin/CourseEditor';
import InstructorCalendar from './components/Instructor/InstructorCalendar';
import MyCourses from './components/Instructor/MyCourses';
import AllSessionsList from './components/Admin/AllSessionsList';
import Logo from './components/Common/Logo';
import { Course, User, Session } from './types';
import { exportAttendancePDF } from './utils/export';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  Users, 
  UserCircle,
  Waves, 
  LogIn, 
  ChevronRight, 
  Mail, 
  MapPin, 
  AlertCircle, 
  Clock, 
  Copy, 
  X, 
  CheckCircle2,
  Info,
  FileText,
  Wallet,
  Receipt,
  TrendingUp,
  Home,
  Share2,
  Sparkles,
  Send,
  Lock,
  RotateCcw,
  Eye,
  EyeOff,
  RefreshCw,
  Bell,
  FlaskConical
} from 'lucide-react';

const App: React.FC = () => {
  const { 
    currentUser, 
    courses, 
    instructors, 
    addCourse, 
    updateCourse, 
    deleteCourse,
    addInstructor,
    updateInstructor,
    deleteInstructor,
    resetInstructorPassword,
    swapRequests,
    approveSwap,
    rejectSwap,
    login, 
    isHydrated, 
    hydrate 
  } = useStore();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  
  // Login States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [editingInstructor, setEditingInstructor] = useState<User | null>(null);
  const [isAddingInstructor, setIsAddingInstructor] = useState(false);

  const [duplicatingCourse, setDuplicatingCourse] = useState<Course | null>(null);
  const [dupTitle, setDupTitle] = useState('');
  const [dupTimeAdjust, setDupTimeAdjust] = useState(false);
  const [dupNewTime, setDupNewTime] = useState('15:00');
  const [dupWeekShift, setDupWeekShift] = useState(0);

  useEffect(() => {
    hydrate();
  }, []);

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.isAdmin;
  const isLeader = currentUser?.role === 'LEADER';
  const isManagement = isAdmin || isLeader;

  // NEU: Tauschanfragen für Kursleiter / Admin
  const pendingSwapsForLeader = useMemo(() => {
    if (!currentUser) return [];
    return swapRequests.filter(req => {
      if (req.status !== 'PENDING') return false;
      const course = courses.find(c => c.id === req.courseId);
      // Entweder man ist Admin oder der Kursleiter dieses Kurses
      return isAdmin || course?.leaderId === currentUser.id;
    });
  }, [swapRequests, courses, currentUser, isAdmin]);

  // Logik für Automatisierung: Kurse, die in 2 Tagen beginnen
  const automationCourses = useMemo(() => {
    if (!isManagement) return [];
    const today = new Date();
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(today.getDate() + 2);
    const targetDateStr = twoDaysFromNow.toISOString().split('T')[0];

    return courses.filter(course => {
      if (course.attendanceListSent) return false;
      const sortedSessions = [...course.sessions].sort((a,b) => a.date.localeCompare(b.date));
      return sortedSessions.length > 0 && sortedSessions[0].date === targetDateStr;
    });
  }, [courses, isManagement]);

  // NEU: Logik für Termine MORGEN
  const tomorrowSessions = useMemo(() => {
    if (!currentUser) return [];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const targetDateStr = tomorrow.toISOString().split('T')[0];

    const upcoming: { course: Course; session: Session }[] = [];
    courses.forEach(c => {
      c.sessions.forEach(s => {
        if (s.date === targetDateStr) {
          if (isManagement || s.instructorIds.includes(currentUser.id)) {
            upcoming.push({ course: c, session: s });
          }
        }
      });
    });
    return upcoming.sort((a, b) => a.session.startTime.localeCompare(b.session.startTime));
  }, [courses, currentUser, isManagement]);

  const handleTriggerAutomationMail = (course: Course) => {
    if (!course.leaderId) {
      alert("Diesem Kurs wurde noch kein Kursleiter zugewiesen.");
      return;
    }
    const leader = instructors.find(i => i.id === course.leaderId);
    if (!leader || !leader.email) {
      alert("Der Kursleiter hat keine hinterlegte E-Mail.");
      return;
    }

    exportAttendancePDF(course, instructors);

    const sortedSessions = [...course.sessions].sort((a, b) => a.date.localeCompare(b.date));

    let tableHeader = "(Name des Kursteilnehmers)";
    sortedSessions.forEach(s => {
      const dateStr = new Date(s.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
      const label = s.isReplacement ? `Ersatz ${dateStr}` : dateStr;
      tableHeader += `\t(${label})`;
    });

    let tableRows = "";
    if (course.participants.length > 0) {
      course.participants.forEach(p => {
        let row = `${p.name}`;
        sortedSessions.forEach(() => {
          row += "\t";
        });
        tableRows += row + "\n";
      });
    } else {
      tableRows = "(Noch keine Teilnehmer angemeldet)";
    }

    const subject = encodeURIComponent(`AUTOMATISCHE ERINNERUNG - Anwesenheitsliste: ${course.title}`);
    const body = encodeURIComponent(
`Hallo ${leader.name}, 

dein Kurs "${course.title}" beginnt in 2 Tagen. Anbei erhältst du die Anwesenheitsliste. 
ORT: ${course.location} 

${tableHeader}
${tableRows}

Beste Grüße, 
Deine Kursverwaltung (Automatischer Versand)

---
HINWEIS: Die detaillierte PDF-Liste wurde soeben heruntergeladen. Bitte füge diese dieser E-Mail als Anhang hinzu.`
    );

    window.location.href = `mailto:${leader.email}?subject=${subject}&body=${body}`;
    updateCourse({ ...course, attendanceListSent: true });
  };

  if (!isHydrated) return null;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <Logo size="lg" className="mb-8" />
            <p className="text-slate-400 mt-6 text-xs font-black uppercase tracking-[0.3em] opacity-60">Professional Swim Management</p>
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-[#5ecce5]"></div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" /> E-Mail Adresse
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold text-sky-500"
                  placeholder="name@schwimmakajeder.at"
                />
                <p className="text-[10px] text-slate-400 font-medium italic">Bitte gib die E-Mail ein, mit der du im System registriert bist.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5" /> Passwort
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold text-sky-500"
                    placeholder="Dein Passwort"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4 text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                onClick={() => login(loginEmail, loginPassword)}
                className="w-full py-5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200"
              >
                <LogIn className="w-6 h-6" />
                Anmelden
              </button>

              <div className="pt-6 border-t border-slate-100 space-y-3">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center">Schnellzugriff (Testzwecke)</p>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                  {instructors.map(inst => (
                    <button 
                      key={inst.id}
                      onClick={() => { setLoginEmail(inst.email); login(inst.email); }} 
                      className="w-full text-left p-3 hover:bg-slate-50 rounded-2xl flex items-center justify-between border border-transparent hover:border-slate-200 transition-all group"
                    >
                      <div>
                        <span className="text-xs font-black text-slate-700 block">{inst.name}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                          {inst.role} • {inst.category || 'Personal'}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <p className="text-center mt-8 text-[10px] font-bold text-slate-400">www.schwimmakajeder.at</p>
        </div>
      </div>
    );
  }

  const displayCourses = isAdmin 
    ? courses 
    : courses.filter(course => course.sessions.some(s => s.instructorIds.includes(currentUser.id)));
  
  const displayParticipantsCount = displayCourses.reduce((acc, c) => acc + c.participants.length, 0);

  const calculatePersonnelCosts = (course: Course) => {
    return course.sessions.reduce((total, session) => {
      return total + session.instructorIds.reduce((sessionTotal, instId) => {
        const instructor = instructors.find(i => i.id === instId);
        if (!instructor) return sessionTotal;
        if (session.is5er) return sessionTotal + (instructor.wagePerUnit || 0);
        if (session.is7er) return sessionTotal + (instructor.wagePerUnit7 || 0);
        return sessionTotal;
      }, 0);
    }, 0);
  };

  const handleDuplicate = () => {
    if (!duplicatingCourse) return;

    const newSessions = duplicatingCourse.sessions.map(s => {
      const date = new Date(s.date);
      date.setDate(date.getDate() + (dupWeekShift * 7));
      
      return {
        ...s,
        id: crypto.randomUUID(),
        date: date.toISOString().split('T')[0],
        startTime: dupTimeAdjust ? dupNewTime : s.startTime
      };
    });

    const newCourse: Course = {
      ...duplicatingCourse,
      id: crypto.randomUUID(),
      title: dupTitle,
      participants: [], 
      sessions: newSessions,
      poolRent: 0,
      notes: duplicatingCourse.notes,
      attendanceListSent: false
    };

    addCourse(newCourse);
    setDuplicatingCourse(null);
  };

  const getUnderstaffedSessions = () => {
    const critical: { course: Course, session: Session, missingL: number, missingH: number }[] = [];
    const today = new Date().toISOString().split('T')[0];
    
    courses.forEach(c => {
      c.sessions.forEach(s => {
        if (s.date >= today) {
          const staffInSession = s.instructorIds.map(id => instructors.find(i => i.id === id)).filter(Boolean);
          const countL = staffInSession.filter(i => i?.category === 'Schwimmlehrer:in').length;
          const countH = staffInSession.filter(i => i?.category === 'Helfer:in').length;
          
          if (countL < c.requiredInstructors || countH < c.requiredHelpers) {
            critical.push({
              course: c,
              session: s,
              missingL: Math.max(0, c.requiredInstructors - countL),
              missingH: Math.max(0, c.requiredHelpers - countH)
            });
          }
        }
      });
    });
    return critical.sort((a,b) => a.session.date.localeCompare(b.session.date));
  };

  const renderContent = () => {
    if (activeTab === 'dashboard') {
      const criticalSessions = isAdmin ? getUnderstaffedSessions() : [];

      return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">Moin, {currentUser.name}! 👋</h1>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1 opacity-60">{isAdmin ? 'Systemübersicht & Personalmonitor' : 'Deine anstehenden Einsätze.'}</p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              {isAdmin && automationCourses.length > 0 && (
                <div className="bg-blue-600 p-6 rounded-[2rem] text-white shadow-xl shadow-blue-100 flex items-center gap-6 animate-pulse border-2 border-white">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest">Automatisierung Aktiv</h4>
                    <p className="text-[10px] font-bold opacity-80">
                      {automationCourses.length} Kurs(e) beginnen in 2 Tagen!
                    </p>
                  </div>
                  <button 
                    onClick={() => automationCourses.forEach(handleTriggerAutomationMail)}
                    className="px-6 py-2 bg-white text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors"
                  >
                    Alle Listen senden
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-blue-100 transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform"></div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 relative">Aktive Kurse</p>
              <h3 className="text-4xl font-black text-slate-900 relative">{displayCourses.length}</h3>
            </div>
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-green-100 transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform"></div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 relative">Teilnehmer</p>
              <h3 className="text-4xl font-black text-slate-900 relative">{displayParticipantsCount}</h3>
            </div>
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-purple-100 transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform"></div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 relative">Nächste Termine</p>
              <h3 className="text-4xl font-black text-slate-900 relative">{displayCourses.reduce((acc,c) => acc + c.sessions.length, 0)}</h3>
            </div>
          </div>

          {tomorrowSessions.length > 0 && (
            <div className="bg-amber-50 rounded-[2.5rem] border-2 border-amber-200 p-8 shadow-sm animate-in zoom-in-95 duration-500">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-amber-500 text-white rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-amber-200 animate-bounce">
                    <Bell className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-amber-900 uppercase tracking-tight">
                      {isAdmin ? 'Termine für morgen' : 'Dein Einsatz morgen!'}
                    </h2>
                    <p className="text-amber-700 text-sm font-bold opacity-75">
                      {tomorrowSessions.length} Einheit(en) stehen am {new Date(tomorrowSessions[0].session.date).toLocaleDateString('de-DE')} an.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tomorrowSessions.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="bg-white p-5 rounded-3xl border border-amber-100 shadow-sm flex items-center justify-between group cursor-pointer hover:border-amber-400 transition-all"
                    onClick={() => { if(isAdmin) { setEditingCourse(item.course); setActiveTab('courses'); } else { setActiveTab('my-courses'); } }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-2.5 h-10 rounded-full shrink-0" style={{ backgroundColor: item.course.color }}></div>
                      <div>
                        <p className="text-sm font-black text-slate-900 truncate max-w-[150px]">{item.course.title}</p>
                        <div className="flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase tracking-widest mt-0.5">
                          <Clock className="w-3.5 h-3.5" /> {item.session.startTime} Uhr
                        </div>
                      </div>
                    </div>
                    <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {isAdmin && (
              <div className="space-y-8">
                <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-slate-100 bg-red-50/50 flex items-center justify-between">
                    <h2 className="font-black text-red-900 text-sm uppercase tracking-widest flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-500" /> Personal-Monitor
                    </h2>
                    <span className="bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">{criticalSessions.length} Offen</span>
                  </div>
                  <div className="flex-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {criticalSessions.length === 0 ? (
                      <div className="p-10 text-center space-y-3">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                          <Waves className="w-8 h-8" />
                        </div>
                        <p className="text-slate-400 font-bold">Alles bestens!</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {criticalSessions.map((crit, idx) => (
                          <div key={idx} className="p-6 hover:bg-red-50/20 transition-colors flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-white border border-red-100 rounded-2xl shadow-sm text-red-500 font-black text-center min-w-[60px]">
                                <span className="block text-lg leading-none">{new Date(crit.session.date).getDate()}</span>
                                <span className="text-[8px] uppercase tracking-tighter opacity-60">{new Date(crit.session.date).toLocaleDateString('de-DE', { month: 'short' })}</span>
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900 group-hover:text-red-600 transition-colors">{crit.course.title}</p>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                                  <Clock className="w-3 h-3" /> {crit.session.startTime} Uhr • <Users className="w-3 h-3" /> {crit.missingL > 0 ? `${crit.missingL}L` : ''} {crit.missingH > 0 ? `${crit.missingH}H` : ''}
                                </div>
                              </div>
                            </div>
                            <button onClick={() => { setEditingCourse(crit.course); setActiveTab('courses'); }} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm">
                              <Plus className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {automationCourses.length > 0 && (
                  <div className="bg-white rounded-[2.5rem] border-2 border-blue-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-blue-100 bg-blue-50/50 flex items-center justify-between">
                      <h2 className="font-black text-blue-900 text-sm uppercase tracking-widest flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-blue-600" /> Versand-Fälligkeiten (2 Tage vor Beginn)
                      </h2>
                    </div>
                    <div className="flex-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                      <div className="divide-y divide-slate-100">
                        {automationCourses.map((course) => (
                          <div key={course.id} className="p-6 hover:bg-blue-50/10 transition-colors flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100">
                                <Share2 className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900">{course.title}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                  Beginnt am: {new Date([...course.sessions].sort((a,b) => a.date.localeCompare(b.date))[0].date).toLocaleDateString('de-DE')}
                                </p>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleTriggerAutomationMail(course)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md flex items-center gap-2"
                            >
                              <Send className="w-3.5 h-3.5" /> Senden
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h2 className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2">
                  <Waves className="w-5 h-5 text-blue-600" /> {isAdmin ? 'Aktuelle Kurse' : 'Meine Kurse'}
                </h2>
                <button onClick={() => setActiveTab(isAdmin ? 'courses' : 'my-courses')} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Alle ansehen</button>
              </div>
              <div className="divide-y divide-slate-100">
                {displayCourses.slice(0, 10).map(course => (
                  <div key={course.id} onClick={() => { if(isAdmin) { setEditingCourse(course); setActiveTab('courses'); } else { setActiveTab('my-courses'); } }} className="p-5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-2.5 h-10 rounded-full shadow-sm" style={{ backgroundColor: course.color }}></div>
                      <div>
                        <p className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate max-w-[200px]">{course.title}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{course.location} • {course.participants.length} TN</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-blue-600 transition-all transform group-hover:translate-x-1" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }
    if (activeTab === 'my-courses') return <MyCourses />;
    if (activeTab === 'calendar') return <InstructorCalendar />;
    if (activeTab === 'all-sessions') return <AllSessionsList />;

    if (activeTab === 'courses' && isAdmin) {
      if (isAddingCourse || editingCourse) {
        return (
          <CourseEditor
            initialCourse={editingCourse || undefined}
            onSave={(course) => {
              if (editingCourse) updateCourse(course);
              else addCourse(course);
              setEditingCourse(null);
              setIsAddingCourse(false);
            }}
            onCancel={() => {
              setEditingCourse(null);
              setIsAddingCourse(false);
            }}
          />
        );
      }

      return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <h1 className="text-3xl font-black text-slate-900 leading-tight">Kursverwaltung</h1>
              <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mt-1 opacity-60">Erstelle und bearbeite dein Kursangebot</p>
            </div>
            <button onClick={() => setIsAddingCourse(true)} className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-[2rem] font-black shadow-xl shadow-blue-100 hover:bg-blue-700 hover:scale-105 transition-all uppercase text-xs tracking-widest">
              <Plus className="w-6 h-6" /> Kurs anlegen
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {courses.map(course => {
              const revenue = course.price * course.participants.filter(p => p.paid).length;
              const personnelCosts = calculatePersonnelCosts(course);
              const profit = revenue - personnelCosts;

              return (
                <div key={course.id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col">
                  <div className="h-3" style={{ backgroundColor: course.color }}></div>
                  <div className="p-8 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                      <div className="cursor-pointer" onClick={() => setEditingCourse(course)}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{course.category}</span>
                          {course.courseNumber && (
                            <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg border border-slate-200">
                              {course.courseNumber}
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">{course.title}</h3>
                      </div>
                    </div>
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 text-xs font-black text-slate-500 uppercase tracking-wider">
                        <div className="p-2 bg-slate-50 rounded-xl"><UserCircle className="w-4 h-4 text-amber-500" /></div>
                        {instructors.find(i => i.id === course.leaderId)?.name || 'Kein Kursleiter'}
                      </div>
                      <div className="flex items-center gap-3 text-xs font-black text-slate-500 uppercase tracking-wider">
                        <div className="p-2 bg-slate-50 rounded-xl"><Calendar className="w-4 h-4 text-blue-500" /></div>
                        {course.sessions.length} Einheiten
                      </div>
                      <div className="flex items-center gap-3 text-xs font-black text-slate-500 uppercase tracking-wider">
                        <div className="p-2 bg-slate-50 rounded-xl"><Users className="w-4 h-4 text-green-500" /></div>
                        {course.participants.length} Teilnehmer
                      </div>
                      <div className="flex items-center gap-3 text-xs font-black text-slate-500 uppercase tracking-wider">
                        <div className="p-2 bg-slate-50 rounded-xl"><MapPin className="w-4 h-4 text-purple-500" /></div>
                        {course.location}
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-100 mb-6 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Wallet className="w-3 h-3 text-emerald-600" />
                            <span className="text-[8px] font-black text-emerald-800 uppercase">Einnahmen</span>
                          </div>
                          <span className="text-[10px] font-black text-emerald-900 tabular-nums">
                            {revenue.toLocaleString('de-DE')} €
                          </span>
                        </div>
                        <div className="bg-red-50 p-2 rounded-xl border border-red-100 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Receipt className="w-3 h-3 text-red-600" />
                            <span className="text-[8px] font-black text-red-800 uppercase tracking-tighter">Personal</span>
                          </div>
                          <span className="text-[10px] font-black text-red-900 tabular-nums">
                            {personnelCosts.toLocaleString('de-DE')} €
                          </span>
                        </div>
                        <div className="bg-blue-50 p-2 rounded-xl border border-blue-100 flex items-center justify-between shadow-inner col-span-2">
                          <div className="flex items-center gap-1.5">
                            <TrendingUp className="w-3 h-3 text-blue-600" />
                            <span className="text-[8px] font-black text-blue-800 uppercase tracking-widest">GEWINN</span>
                          </div>
                          <span className={`text-[10px] font-black tabular-nums ${profit >= 0 ? 'text-blue-900' : 'text-red-600'}`}>
                            {profit.toLocaleString('de-DE')} €
                          </span>
                        </div>
                      </div>

                      {course.billedDate && (
                        <div className="mt-2 text-center py-1.5 bg-slate-50 border border-slate-100 rounded-xl">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-3 h-3 text-green-500" /> Abgerechnet am: <span className="text-slate-700">{new Date(course.billedDate).toLocaleDateString('de-DE')}</span>
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex gap-2">
                        <button onClick={() => setEditingCourse(course)} className="flex-1 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md">Edit</button>
                        <button 
                          onClick={() => { 
                            setDuplicatingCourse(course); 
                            setDupTitle(`Kopie von ${course.title}`);
                            setDupWeekShift(0);
                            setDupTimeAdjust(false);
                          }} 
                          className="p-3 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-2xl transition-all"
                          title="Kurs duplizieren"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button onClick={() => { if(confirm('Kurs wirklich löschen?')) deleteCourse(course.id); }} className="p-3 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-2xl transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <button 
                        onClick={() => exportAttendancePDF(course, instructors)}
                        className="w-full py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <FileText className="w-4 h-4" /> PDF Liste
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (activeTab === 'instructors' && isAdmin) {
      const InstructorForm = ({ initial }: { initial?: User }) => {
        const [formData, setFormData] = useState<User>(initial || {
          id: crypto.randomUUID(),
          name: '',
          email: '',
          role: 'INSTRUCTOR',
          category: 'Schwimmlehrer:in',
          wagePerUnit: 0,
          wagePerUnit7: 0,
          password: ''
        });

        const handleGeneratePassword = () => {
          setFormData({ ...formData, password: generateDefaultPassword(formData.name) });
        };

        return (
          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-2xl max-w-xl mx-auto">
            <h2 className="text-2xl font-black text-slate-900 mb-8">{initial ? 'Teammitglied bearbeiten' : 'Neues Teammitglied'}</h2>
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vollständiger Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sky-500" placeholder="Max Mustermann" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategorie</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sky-500">
                    <option value="Schwimmlehrer:in">Schwimmlehrer:in</option>
                    <option value="Helfer:in">Helfer:in</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rolle</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sky-500">
                    <option value="INSTRUCTOR">Lehrpersonal</option>
                    <option value="LEADER">Kursleiter:in</option>
                    <option value="ADMIN">System Administrator</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs font-black text-blue-900 uppercase">Admin-Rechte</p>
                    <p className="text-[9px] text-blue-600 font-bold">Zusätzlicher Zugriff auf System-Einstellungen</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={formData.isAdmin} 
                  onChange={e => setFormData({...formData, isAdmin: e.target.checked})}
                  className="w-6 h-6 rounded-lg border-blue-200 text-blue-600 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">E-Mail</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sky-500" placeholder="name@swim.de" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Passwort</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Lock className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                    <input 
                      type="text" 
                      value={formData.password} 
                      onChange={e => setFormData({...formData, password: e.target.value})} 
                      className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sky-500" 
                      placeholder="Passwort" 
                    />
                  </div>
                  <button 
                    onClick={handleGeneratePassword}
                    className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all shadow-sm"
                    title="Passwort generieren"
                  >
                    <RefreshCw className="w-6 h-6" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 italic">Vorschlag: Erste 3 Buchstaben Vor- & Nachname</p>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">KPE5 (€)</label>
                  <input type="number" step="0.5" value={formData.wagePerUnit} onChange={e => setFormData({...formData, wagePerUnit: parseFloat(e.target.value) || 0})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sky-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">KPE7 (€)</label>
                  <input type="number" step="0.5" value={formData.wagePerUnit7} onChange={e => setFormData({...formData, wagePerUnit7: parseFloat(e.target.value) || 0})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sky-500" />
                </div>
              </div>
              
              <div className="flex gap-4 pt-6">
                <button onClick={() => { if(initial) updateInstructor(formData); else addInstructor(formData); setIsAddingInstructor(false); setEditingInstructor(null); }} className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all uppercase text-xs tracking-widest">Speichern</button>
                <button onClick={() => { setIsAddingInstructor(false); setEditingInstructor(null); }} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase text-xs tracking-widest">Abbrechen</button>
              </div>
            </div>
          </div>
        );
      };

      if (isAddingInstructor || editingInstructor) return <InstructorForm initial={editingInstructor || undefined} />;

      return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <h1 className="text-3xl font-black text-slate-900 leading-tight">Personal & Team</h1>
              <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mt-1 opacity-60">Verwalte deine Schwimmlehrer und Helfer</p>
            </div>
            <button onClick={() => setIsAddingInstructor(true)} className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-[2rem] font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest">
              <Plus className="w-6 h-6" /> Hinzufügen
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {instructors.map(inst => (
              <div key={inst.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl transition-all duration-500 group">
                <div className="w-16 h-16 rounded-3xl bg-blue-600 text-white flex items-center justify-center text-2xl font-black mb-6 shadow-xl shadow-blue-100 group-hover:rotate-6 transition-transform">{inst.name.charAt(0)}</div>
                <h3 className="font-black text-slate-900 text-xl">{inst.name}</h3>
                <p className="text-sm text-slate-400 font-medium mb-1">{inst.email}</p>
                <div className="flex items-center gap-2 mb-6">
                  <Lock className="w-3 h-3 text-slate-300" />
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">PW: {inst.password}</p>
                </div>
                <div className="flex flex-wrap gap-2 mb-8">
                  <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 ${inst.role === 'ADMIN' ? 'bg-purple-50 border-purple-100 text-purple-600' : inst.role === 'LEADER' ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                    {inst.role === 'ADMIN' ? 'System Admin' : inst.role === 'LEADER' ? 'Kursleiter:in' : (inst.category || 'Lehrer')}
                  </span>
                  {inst.isAdmin && inst.role !== 'ADMIN' && (
                    <span className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 bg-slate-900 border-slate-800 text-white flex items-center gap-2">
                      <Lock className="w-3 h-3" /> Admin
                    </span>
                  )}
                  <div className="flex gap-2 w-full mt-2">
                    <span className="px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border-2 bg-emerald-50 border-emerald-100 text-emerald-600 flex items-center gap-1">
                      KPE5: {inst.wagePerUnit || 0} €
                    </span>
                    <span className="px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border-2 bg-emerald-50 border-emerald-100 text-emerald-600 flex items-center gap-1">
                      KPE7: {inst.wagePerUnit7 || 0} €
                    </span>
                  </div>
                </div>
                <div className="flex gap-4 pt-6 border-t border-slate-50 justify-between items-center">
                  <div className="flex gap-4">
                    <button onClick={() => setEditingInstructor(inst)} className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors">Edit</button>
                    <button onClick={() => { if(confirm('Teammitglied löschen?')) deleteInstructor(inst.id); }} className="text-[10px] font-black text-slate-400 hover:text-red-600 uppercase tracking-widest transition-colors">Löschen</button>
                  </div>
                  <button 
                    onClick={() => resetInstructorPassword(inst.id)}
                    className="p-2 text-amber-500 hover:bg-amber-50 rounded-xl transition-all"
                    title="Passwort zurücksetzen"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
    >
      {/* Tauschanfragen "Pushup" / Modal */}
      {pendingSwapsForLeader.length > 0 && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="h-2 w-full bg-amber-500"></div>
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight">Tauschanfrage</h3>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Bestätigung erforderlich</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {pendingSwapsForLeader.map(req => {
                  const course = courses.find(c => c.id === req.courseId);
                  const session = course?.sessions.find(s => s.id === req.sessionId);
                  const fromInst = instructors.find(i => i.id === req.requestingInstructorId);
                  const toInst = instructors.find(i => i.id === req.targetInstructorId);

                  return (
                    <div key={req.id} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">
                          {course?.title}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {session ? new Date(session.date).toLocaleDateString('de-DE') : ''}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between gap-3 pt-2">
                        <div className="text-center flex-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Von</p>
                          <p className="text-sm font-black text-slate-800">{fromInst?.name}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                        <div className="text-center flex-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">An</p>
                          <p className="text-sm font-black text-slate-800">{toInst?.name}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <button 
                          onClick={() => rejectSwap(req.id)}
                          className="flex-1 py-3 bg-white text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-all"
                        >
                          Ablehnen
                        </button>
                        <button 
                          onClick={() => approveSwap(req.id)}
                          className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
                        >
                          Bestätigen
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-[10px] text-slate-400 font-medium text-center leading-relaxed">
                Als Kursleiter musst du Personaländerungen bestätigen, damit die Abrechnung und Einsatzplanung korrekt bleibt.
              </p>
            </div>
          </div>
        </div>
      )}

      {renderContent()}

      {duplicatingCourse && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setDuplicatingCourse(null)}></div>
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="h-2 w-full bg-blue-600"></div>
            <button 
              onClick={() => setDuplicatingCourse(null)}
              className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-2xl text-slate-400 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="p-10">
              <div className="mb-8">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                  <Copy className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Kurs duplizieren</h2>
                <p className="text-slate-500 font-medium">Erstelle eine exakte Kopie von <span className="text-blue-600 font-bold">"{duplicatingCourse.title}"</span>.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Neuer Kurstitel</label>
                  <input 
                    type="text" 
                    value={dupTitle} 
                    onChange={e => setDupTitle(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-blue-100 outline-none transition-all text-sky-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Termine verschieben</label>
                    <select 
                      value={dupWeekShift} 
                      onChange={e => setDupWeekShift(parseInt(e.target.value))}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sky-500"
                    >
                      <option value={0}>Keine Verschiebung</option>
                      <option value={1}>+ 1 Woche</option>
                      <option value={2}>+ 2 Wochen</option>
                      <option value={4}>+ 4 Wochen (1 Monat)</option>
                      <option value={8}>+ 8 Wochen (2 Monate)</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Einheitliche Uhrzeit</label>
                    <div className="flex items-center gap-3 h-[58px] bg-slate-50 border border-slate-200 rounded-2xl px-4">
                      <input 
                        type="checkbox" 
                        id="timeAdj"
                        checked={dupTimeAdjust}
                        onChange={e => setDupTimeAdjust(e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="timeAdj" className="text-xs font-black text-slate-600 cursor-pointer">Alle anpassen?</label>
                    </div>
                  </div>
                </div>

                {dupTimeAdjust && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Neue Startzeit für alle Einheiten</label>
                    <input 
                      type="time" 
                      value={dupNewTime}
                      onChange={e => setDupNewTime(e.target.value)}
                      className="w-full p-4 bg-blue-50 border border-blue-100 rounded-2xl font-bold text-sky-500 outline-none"
                    />
                  </div>
                )}

                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
                  <Info className="w-5 h-5 text-amber-500 shrink-0" />
                  <p className="text-[11px] text-amber-700 font-medium">
                    Teilnehmer werden beim Duplizieren <span className="font-bold underline">nicht</span> übernommen. Das Team (Lehrer/Helfer) bleibt für die Termine eingeteilt.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setDuplicatingCourse(null)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Abbrechen
                  </button>
                  <button 
                    onClick={handleDuplicate}
                    className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Jetzt Duplizieren
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
