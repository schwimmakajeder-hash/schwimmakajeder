
import React, { useState, useRef } from 'react';
import { Course, Session, Participant, User } from '../../types';
import { COURSE_CATEGORIES, COURSE_COLORS, LOCATIONS } from '../../constants';
import { 
  Plus, 
  Trash2, 
  Users, 
  Calendar, 
  Info, 
  MapPin, 
  Euro, 
  Upload, 
  ShieldAlert, 
  Phone, 
  Mail, 
  FileText, 
  CheckCircle2, 
  Circle, 
  Wallet, 
  CheckSquare, 
  Square, 
  Receipt, 
  TrendingUp, 
  Home,
  User as UserIcon,
  BellRing,
  Send,
  Share2,
  X
} from 'lucide-react';
import { useStore } from '../../store';
import { downloadSingleSessionICal, exportAttendancePDF } from '../../utils/export';

interface CourseEditorProps {
  initialCourse?: Course;
  onSave: (course: Course) => void;
  onCancel: () => void;
}

const CourseEditor: React.FC<CourseEditorProps> = ({ initialCourse, onSave, onCancel }) => {
  const { instructors, courseTitles, addCourseTitle, currentUser, courses } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [newTitle, setNewTitle] = useState('');
  const [showAddTitle, setShowAddTitle] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);
  
  const availableInstructors = instructors;
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.isAdmin;

  const [course, setCourse] = useState<Course>(initialCourse || {
    id: crypto.randomUUID(),
    title: courseTitles[0] || '',
    location: LOCATIONS[0],
    price: 149,
    notes: '',
    color: COURSE_COLORS[0].value,
    category: COURSE_CATEGORIES[0],
    participants: [],
    sessions: [],
    requiredInstructors: 1,
    requiredHelpers: 1,
    poolRent: 0,
    billedDate: undefined,
    leaderId: undefined,
    courseNumber: '',
    attendanceListSent: false
  });

  const handleBulkImport = () => {
    if (!bulkInput.trim()) return;
    
    const lines = bulkInput.trim().split('\n');
    const newParticipants: Participant[] = lines.map(line => {
      const parts = line.split(',').map(p => p.trim());
      // Format: Name, Geb. Datum, Erziehungsberechtigter, telefonnummer und Email
      return {
        id: crypto.randomUUID(),
        name: parts[0] || 'Unbekannt',
        dateOfBirth: parts[1] || '',
        guardianName: parts[2] || '',
        phone: parts[3] || '',
        email: parts[4] || '',
        paid: false,
        notes: ''
      };
    });

    setCourse(prev => ({
      ...prev,
      participants: [...prev.participants, ...newParticipants]
    }));
    setBulkInput('');
    setShowBulkImport(false);
  };

  const generateCourseNumber = (leaderId: string) => {
    const leader = instructors.find(i => i.id === leaderId);
    if (!leader) return '';
    
    const names = leader.name.trim().split(/\s+/);
    const initials = names.map(n => n.charAt(0).toUpperCase()).join('');
    const year = new Date().getFullYear();
    
    // Count courses for this leader in this year
    const count = courses.filter(c => 
      c.leaderId === leaderId && 
      c.courseNumber?.includes(`${year}`)
    ).length + 1;
    
    return `${initials}${year}${String(count).padStart(2, '0')}`;
  };

  const handleLeaderChange = (leaderId: string) => {
    const courseNumber = generateCourseNumber(leaderId);
    setCourse({ ...course, leaderId, courseNumber });
  };

  const handleSave = () => {
    if (!course.leaderId) {
      alert("Kursleiter ist ein Pflichtfeld!");
      return;
    }
    if (!course.title) {
      alert("Kursname ist ein Pflichtfeld!");
      return;
    }
    onSave(course);
  };

  // Helfer für Zeitberechnung
  const calculateEndTime = (startTime: string, duration: number) => {
    if (!startTime) return '14:45';
    const [h, m] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m + duration);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return 45;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const startTotal = sh * 60 + sm;
    const endTotal = eh * 60 + em;
    const diff = endTotal - startTotal;
    return diff > 0 ? diff : 45;
  };

  const handleSendAttendanceToLeader = () => {
    if (!course.leaderId) {
      alert("Bitte weisen Sie zuerst einen KURSLEITER zu.");
      return;
    }
    const leader = instructors.find(i => i.id === course.leaderId);
    if (!leader || !leader.email) {
      alert("Der ausgewählte Kursleiter hat keine hinterlegte E-Mail-Adresse.");
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

    const subject = encodeURIComponent(`Anwesenheitsliste: ${course.title}`);
    const body = encodeURIComponent(
`Hallo ${leader.name}, 

anbei erhältst du die Anwesenheitsliste für deinen Kurs "${course.title}". 
ORT: ${course.location} 

${tableHeader}
${tableRows}

Beste Grüße, 
Deine Kursverwaltung

---
HINWEIS: Die detaillierte PDF-Liste wurde soeben heruntergeladen. Bitte füge diese dieser E-Mail als Anhang hinzu.`
    );

    window.location.href = `mailto:${leader.email}?subject=${subject}&body=${body}`;
    setCourse({ ...course, attendanceListSent: true });
  };

  const addSession = () => {
    const newSession: Session = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      startTime: '14:00',
      durationMinutes: 45,
      instructorIds: course.leaderId ? [course.leaderId] : [],
      isReplacement: false,
      is5er: true,
      is7er: false,
      isConfirmed: false
    };
    setCourse({ ...course, sessions: [...course.sessions, newSession] });
  };

  const removeSession = (id: string) => {
    setCourse({ ...course, sessions: course.sessions.filter(s => s.id !== id) });
  };

  const updateSession = (id: string, updates: Partial<Session>) => {
    setCourse({
      ...course,
      sessions: course.sessions.map(s => s.id === id ? { ...s, ...updates } : s)
    });
  };

  const handleConfirmSession = (session: Session) => {
    updateSession(session.id, { isConfirmed: true });

    const targetEmails = session.instructorIds
      .map(id => instructors.find(inst => inst.id === id)?.email)
      .filter(Boolean) as string[];

    if (targetEmails.length === 0) {
      alert("Bitte teile zuerst Personal für diesen Termin ein, bevor du ihn bestätigst.");
      return;
    }

    const subject = encodeURIComponent(`Terminbestätigung: ${course.title} am ${new Date(session.date).toLocaleDateString('de-DE')}`);
    const body = encodeURIComponent(`Hallo,\n\nder folgende Termin wurde soeben offiziell bestätigt:\n\nKurs: ${course.title}\nDatum: ${new Date(session.date).toLocaleDateString('de-DE')}\nZeit: ${session.startTime} Uhr\nOrt: ${course.location}\n\nBitte trage dir den Termin fest in deinen Kalender ein. Die Kalenderdatei (.ics) wurde soeben automatisch heruntergeladen.\n\nBeste Grüße,\ndie Kursverwaltung`);
    
    window.location.href = `mailto:${targetEmails.join(',')}?subject=${subject}&body=${body}`;
    downloadSingleSessionICal(course, session);
  };

  const handleSendPaymentConfirmation = (participant: Participant) => {
    if (!participant.email) {
      alert("Bitte gib zuerst eine E-Mail-Adresse für den Teilnehmer an.");
      return;
    }

    const firstSessionDate = course.sessions.length > 0 
      ? new Date([...course.sessions].sort((a, b) => a.date.localeCompare(b.date))[0].date).toLocaleDateString('de-DE')
      : 'wird noch bekannt gegeben';

    const subject = encodeURIComponent(`Zahlungsbestätigung - ${course.title}`);
    
    const bodyText = 
`ZAHLUNGSBESTÄTIGUNG

Wir bestätigen den Zahlungseingang wie folgt:

Schwimmkurs: ${course.title}
Name des Teilnehmers: ${participant.name}
Kursbetrag: ${course.price.toLocaleString('de-DE')} EUR

Der Kursbetrag wurde bar erhalten am ${firstSessionDate}

Wir wünschen noch viel Spaß beim Schwimmen!


Euer Team von schwimmakajede:r
[schwimmakajede:r Logo]
ZVR698175623, Sitz: SCHLINS`;

    const body = encodeURIComponent(bodyText);
    
    window.location.href = `mailto:${participant.email}?subject=${subject}&body=${body}`;
  };

  const addParticipant = (data?: Partial<Participant>) => {
    const newParticipant: Participant = {
      id: crypto.randomUUID(),
      name: data?.name || '',
      dateOfBirth: data?.dateOfBirth || '',
      phone: data?.phone || '',
      email: data?.email || '',
      guardianName: data?.guardianName || '',
      paid: data?.paid || false,
      notes: data?.notes || '',
    };
    return newParticipant;
  };

  const handleManualAddParticipant = () => {
    setCourse({ ...course, participants: [...course.participants, addParticipant()] });
  };

  const removeParticipant = (id: string) => {
    setCourse({ ...course, participants: course.participants.filter(p => p.id !== id) });
  };

  const updateParticipant = (id: string, updates: Partial<Participant>) => {
    setCourse({
      ...course,
      participants: course.participants.map(p => p.id === id ? { ...p, ...updates } : p)
    });
  };

  const toggleInstructor = (sessionId: string, instructorId: string) => {
    const session = course.sessions.find(s => s.id === sessionId);
    if (!session) return;
    const instructorIds = session.instructorIds.includes(instructorId)
      ? session.instructorIds.filter(id => id !== instructorId)
      : [...session.instructorIds, instructorId];
    updateSession(sessionId, { instructorIds });
  };

  const parseGermanDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.trim().split('.');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2].trim();
      return `${year}-${month}-${day}`;
    }
    return dateStr;
  };

  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/);
        const headerIndex = lines.findIndex(line => line.toLowerCase().startsWith('name,') || line.toLowerCase().includes('"name"'));
        if (headerIndex === -1) { setImportStatus('error'); return; }
        const headers = lines[headerIndex].split(',').map(h => h.replace(/"/g, '').trim());
        const dataLines = lines.slice(headerIndex + 1).filter(line => line.trim() !== '');
        const newParticipants: Participant[] = dataLines.map(line => {
          const values: string[] = [];
          let current = ''; let inQuotes = false;
          for (let char of line) {
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
            else { current += char; }
          }
          values.push(current.trim());
          const getVal = (search: string) => {
            const idx = headers.findIndex(h => h.toLowerCase().includes(search.toLowerCase()));
            return idx !== -1 ? values[idx]?.replace(/"/g, '') : '';
          };
          return addParticipant({
            name: getVal('name'),
            dateOfBirth: parseGermanDate(getVal('geburtsdatum')),
            email: getVal('e-mail'),
            phone: getVal('telefonnummer')?.replace(/'/g, ''),
            guardianName: getVal('erziehungsberechtigten'),
            paid: false
          });
        });
        setCourse(prev => ({ ...prev, participants: [...prev.participants, ...newParticipants] }));
        setImportStatus('success');
        setTimeout(() => setImportStatus('idle'), 3000);
      } catch (err) {
        console.error('Import Error:', err);
        setImportStatus('error');
      }
    };
    reader.readAsText(file);
    if (event.target) event.target.value = '';
  };

  const totalRevenue = (course.price * course.participants.filter(p => p.paid).length);
  const totalPersonnelCosts = course.sessions.reduce((total, session) => {
    return total + session.instructorIds.reduce((sessionTotal, instId) => {
      const instructor = instructors.find(i => i.id === instId);
      if (!instructor) return sessionTotal;
      if (session.is5er) return sessionTotal + (instructor.wagePerUnit || 0);
      if (session.is7er) return sessionTotal + (instructor.wagePerUnit7 || 0);
      return sessionTotal;
    }, 0);
  }, 0);
  const totalProfit = totalRevenue - totalPersonnelCosts;

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden max-w-5xl mx-auto flex flex-col h-[90vh] relative">
      {/* Header */}
      <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6 bg-slate-50/50 shrink-0 z-10">
        <div>
          <h2 className="text-2xl font-black text-slate-900 leading-tight">
            {initialCourse ? 'Kurs bearbeiten' : 'Neuen Kurs anlegen'}
          </h2>
          <p className="text-slate-500 text-sm font-medium">Verwalte Basisdaten, Termine und Teilnehmer an einem Ort.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button onClick={onCancel} className="flex-1 sm:flex-none px-6 py-3 text-slate-600 hover:bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all text-sm font-bold">
            Abbrechen
          </button>
          <button 
            onClick={handleSave} 
            className="flex-1 sm:flex-none px-8 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 text-sm font-black"
          >
            Kurs Speichern
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
        {/* SECTION 1: BASISDATEN */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <Info className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">1. Basisdaten & Einstellungen</h3>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100 flex items-center gap-3">
                  <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-base font-black text-emerald-900 tabular-nums">{totalRevenue.toLocaleString('de-DE')} €</span>
                </div>
                <div className="bg-red-50 px-4 py-2 rounded-2xl border border-red-100 flex items-center gap-3">
                  <Receipt className="w-3.5 h-3.5 text-red-600" />
                  <span className="text-base font-black text-red-900 tabular-nums">{totalPersonnelCosts.toLocaleString('de-DE')} €</span>
                </div>
                <div className="bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100 flex items-center gap-3 shadow-sm">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                  <span className={`text-base font-black tabular-nums ${totalProfit >= 0 ? 'text-blue-900' : 'text-red-600'}`}>{totalProfit.toLocaleString('de-DE')} €</span>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 w-full justify-end">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ABGERECHNET AM:</label>
                <input type="date" value={course.billedDate || ''} onChange={(e) => setCourse({ ...course, billedDate: e.target.value || undefined })} className="bg-transparent border-none p-0 focus:ring-0 text-xs font-bold text-sky-500 w-[120px]" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex justify-between">
                Kursname
                {isAdmin && (
                  <button 
                    onClick={() => setShowAddTitle(!showAddTitle)}
                    className="text-blue-600 hover:underline"
                  >
                    {showAddTitle ? 'Abbrechen' : '+ Neu'}
                  </button>
                )}
              </label>
              {showAddTitle ? (
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newTitle} 
                    onChange={(e) => setNewTitle(e.target.value)} 
                    className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sky-500" 
                    placeholder="Neuer Kursname..." 
                  />
                  <button 
                    onClick={() => {
                      addCourseTitle(newTitle);
                      setCourse({ ...course, title: newTitle });
                      setNewTitle('');
                      setShowAddTitle(false);
                    }}
                    className="px-4 bg-blue-600 text-white rounded-2xl font-black"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <select 
                  value={course.title} 
                  onChange={(e) => setCourse({ ...course, title: e.target.value })} 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sky-500"
                >
                  <option value="">Bitte wählen...</option>
                  {courseTitles.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kursnummer</label>
              <input 
                type="text" 
                value={course.courseNumber || ''} 
                onChange={(e) => setCourse({ ...course, courseNumber: e.target.value })} 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sky-500" 
                placeholder="z.B. OT202501" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">KURSLEITER *</label>
              <select 
                value={course.leaderId || ''} 
                onChange={(e) => handleLeaderChange(e.target.value)} 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sky-500 border-amber-200"
                required
              >
                <option value="">Bitte wählen...</option>
                {availableInstructors.map(inst => (
                  <option key={inst.id} value={inst.id}>{inst.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ort</label>
              <select value={course.location} onChange={(e) => setCourse({ ...course, location: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sky-500">
                {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preis TN (€)</label>
              <div className="relative"><Euro className="absolute left-4 top-4 w-5 h-5 text-slate-400" /><input type="number" value={course.price} onChange={(e) => setCourse({ ...course, price: parseFloat(e.target.value) || 0 })} className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sky-500" /></div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Soll-Lehrer</label>
              <input type="number" value={course.requiredInstructors} onChange={(e) => setCourse({ ...course, requiredInstructors: parseInt(e.target.value) || 0 })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sky-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Soll-Helfer</label>
              <input type="number" value={course.requiredHelpers} onChange={(e) => setCourse({ ...course, requiredHelpers: parseInt(e.target.value) || 0 })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sky-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Farbe</label>
              <div className="flex gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-2xl overflow-x-auto scrollbar-hide">
                {COURSE_COLORS.map(c => <button key={c.value} onClick={() => setCourse({ ...course, color: c.value })} className={`w-8 h-8 rounded-full border-2 shrink-0 transition-all ${course.color === c.value ? 'border-slate-900 scale-110' : 'border-white'}`} style={{ backgroundColor: c.value }} />)}
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="w-full md:w-1/3">
              <button 
                onClick={handleSendAttendanceToLeader}
                className={`w-full flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all font-black text-[10px] uppercase tracking-widest ${course.attendanceListSent ? 'bg-green-50 border-green-200 text-green-600' : 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700'}`}
              >
                {course.attendanceListSent ? <CheckCircle2 className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {course.attendanceListSent ? 'Liste & PDF Gesendet' : 'Anwesenheit & PDF senden'}
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 2: TERMINE */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center"><Calendar className="w-5 h-5" /></div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">2. Termine ({course.sessions.length})</h3>
            </div>
            <button onClick={addSession} className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all text-xs font-bold shadow-lg shadow-purple-100"><Plus className="w-4 h-4" /> Termin hinzufügen</button>
          </div>
          <div className="space-y-4">
            {course.sessions.map((session) => (
              <div key={session.id} className="p-6 bg-white border-2 border-slate-100 rounded-[2rem] hover:border-slate-200 transition-all">
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-6 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Datum</label>
                      <input type="date" value={session.date} onChange={(e) => updateSession(session.id, { date: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-sky-500" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Startzeit</label>
                      <input type="time" value={session.startTime} onChange={(e) => updateSession(session.id, { startTime: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-sky-500" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Endzeit</label>
                      <input 
                        type="time" 
                        value={calculateEndTime(session.startTime, session.durationMinutes)} 
                        onChange={(e) => updateSession(session.id, { durationMinutes: calculateDuration(session.startTime, e.target.value) })} 
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-sky-500" 
                      />
                    </div>
                    <div className="flex flex-col justify-center">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Typ</label>
                      <button onClick={() => updateSession(session.id, { is5er: true, is7er: false, isReplacement: false })} className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all ${session.is5er && !session.isReplacement ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                        {session.is5er && !session.isReplacement ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        <span className="text-[10px] font-black uppercase">5er</span>
                      </button>
                    </div>
                    <div className="flex flex-col justify-center">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 opacity-0">-</label>
                      <button onClick={() => updateSession(session.id, { is5er: false, is7er: true, isReplacement: false })} className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all ${session.is7er && !session.isReplacement ? 'bg-purple-50 border-purple-200 text-purple-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                        {session.is7er && !session.isReplacement ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        <span className="text-[10px] font-black uppercase">7er</span>
                      </button>
                    </div>
                    <div className="flex flex-col justify-center">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 opacity-0">-</label>
                      <button onClick={() => updateSession(session.id, { isReplacement: true, is5er: false, is7er: false })} className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all ${session.isReplacement ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                        {session.isReplacement ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        <span className="text-[10px] font-black uppercase">ERSATZ</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {!session.isConfirmed ? (
                      <button 
                        onClick={() => handleConfirmSession(session)}
                        className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-2xl hover:bg-amber-600 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-100"
                      >
                        <BellRing className="w-4 h-4" /> Bestätigen
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 px-6 py-3 bg-green-50 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-green-100">
                        <CheckCircle2 className="w-4 h-4" /> Bestätigt
                      </div>
                    )}
                    <button onClick={() => removeSession(session.id)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3"><Users className="w-3 h-3" /> Team-Zuweisung</label>
                  <div className="flex flex-wrap gap-2">{availableInstructors.map(inst => <button key={inst.id} onClick={() => toggleInstructor(session.id, inst.id)} className={`px-3 py-1.5 rounded-full text-[10px] font-black border transition-all flex items-center gap-2 ${session.instructorIds.includes(inst.id) ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500'}`}><span className={`w-3 h-3 rounded-full ${inst.category === 'Schwimmlehrer:in' ? 'bg-blue-300' : 'bg-purple-300'}`}></span>{inst.name}</button>)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3: TEILNEHMER */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center"><Users className="w-5 h-5" /></div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">3. Teilnehmer ({course.participants.length})</h3>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowBulkImport(!showBulkImport)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all text-xs font-bold"
              >
                <Upload className="w-4 h-4" /> Bulk Import
              </button>
              <input type="file" accept=".csv" ref={fileInputRef} onChange={handleCSVImport} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all text-xs font-bold shadow-lg shadow-slate-100 ${importStatus === 'success' ? 'bg-green-100 text-green-700' : importStatus === 'error' ? 'bg-red-100 text-red-700' : 'bg-white text-slate-600 border border-slate-200'}`}>{importStatus === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <Upload className="w-4 h-4" />}{importStatus === 'success' ? 'Importiert!' : importStatus === 'error' ? 'Fehler!' : 'CSV Import'}</button>
              <button onClick={handleManualAddParticipant} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all text-xs font-bold shadow-lg shadow-green-100"><Plus className="w-4 h-4" /> Teilnehmer hinzufügen</button>
            </div>
          </div>

          {showBulkImport && (
            <div className="bg-blue-50 p-8 rounded-[2rem] border border-blue-100 space-y-4 animate-in slide-in-from-top-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-black text-blue-900 uppercase tracking-wider mb-1">Excel Bulk Import</h4>
                  <p className="text-xs text-blue-600 font-medium">Kopiere Zeilen aus Excel. Format: Name, Geb. Datum, Erziehungsberechtigter, Telefon, Email</p>
                </div>
                <button onClick={() => setShowBulkImport(false)} className="text-blue-400 hover:text-blue-600 p-2"><X className="w-5 h-5" /></button>
              </div>
              <textarea 
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder="Max Mustermann, 01.01.2018, Maria Muster, 0123456, max@web.de"
                className="w-full h-40 p-5 bg-white border border-blue-200 rounded-3xl text-sm font-medium focus:ring-4 focus:ring-blue-100 outline-none transition-all"
              />
              <button 
                onClick={handleBulkImport}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
              >
                Daten importieren
              </button>
            </div>
          )}
          {course.participants.length > 0 && (
            <div className="bg-slate-50/80 rounded-[2rem] border border-slate-200 p-8 mb-8">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><UserIcon className="w-3.5 h-3.5" /> Aktuelle Teilnehmerliste</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {course.participants.map(p => (
                  <div key={`summary-${p.id}`} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div><p className="text-sm font-black text-slate-900">{p.name || 'Unbenannt'}</p>{p.phone && <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 mt-0.5"><Phone className="w-3 h-3 text-blue-500" /> {p.phone}</p>}</div>
                    {p.paid ? <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg uppercase">Bezahlt</span> : <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-2 py-1 rounded-lg uppercase">Offen</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-4">
            {course.participants.map((p) => (
              <div key={p.id} className="p-6 bg-slate-50/30 border border-slate-100 rounded-[2rem] relative group hover:bg-white hover:border-slate-200 transition-all">
                <button onClick={() => removeParticipant(p.id)} className="absolute top-6 right-6 text-slate-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-5 h-5" /></button>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 pr-10">
                  <div className="space-y-1.5 lg:col-span-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Name & Geb. Datum</label>
                    <div className="space-y-2">
                      <input type="text" value={p.name} onChange={(e) => updateParticipant(p.id, { name: e.target.value })} placeholder="Name" className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-sky-500" />
                      <input type="date" value={p.dateOfBirth} onChange={(e) => updateParticipant(p.id, { dateOfBirth: e.target.value })} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-sky-500" />
                    </div>
                  </div>
                  <div className="space-y-1.5 lg:col-span-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kontakt (EB)</label>
                    <div className="space-y-2">
                      <div className="relative"><Users className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" /><input type="text" value={p.guardianName} onChange={(e) => updateParticipant(p.id, { guardianName: e.target.value })} placeholder="EB Name" className="w-full p-2.5 pl-9 bg-white border border-slate-200 rounded-xl text-xs text-sky-500 font-bold" /></div>
                      <div className="relative"><Phone className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" /><input type="tel" value={p.phone} onChange={(e) => updateParticipant(p.id, { phone: e.target.value })} placeholder="Telefon" className="w-full p-2.5 pl-9 bg-white border border-slate-200 rounded-xl text-xs text-sky-500 font-bold" /></div>
                    </div>
                  </div>
                  <div className="space-y-1.5 lg:col-span-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">E-Mail</label>
                    <div className="relative"><Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" /><input type="email" value={p.email} onChange={(e) => updateParticipant(p.id, { email: e.target.value })} placeholder="E-Mail" className="w-full p-2.5 pl-9 bg-white border border-slate-200 rounded-xl text-xs text-sky-500 font-bold" /></div>
                  </div>
                  <div className="space-y-1.5 lg:col-span-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Notizen</label>
                    <div className="relative"><FileText className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400" /><textarea value={p.notes} onChange={(e) => updateParticipant(p.id, { notes: e.target.value })} placeholder="Infos..." className="w-full p-2.5 pl-9 bg-white border border-slate-200 rounded-xl text-xs h-[84px] resize-none text-sky-500 font-bold" /></div>
                  </div>
                  <div className="space-y-1.5 lg:col-span-1 flex flex-col justify-center gap-3">
                    <div className="flex flex-col">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</label>
                      <button onClick={() => updateParticipant(p.id, { paid: !p.paid })} className={`mt-2 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 transition-all font-black text-[10px] uppercase tracking-widest ${p.paid ? 'bg-green-50 border-green-200 text-green-600 shadow-sm' : 'bg-white border-slate-200 text-slate-300'}`}>{p.paid ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}BEZAHLT</button>
                    </div>
                    {p.paid && (
                      <button 
                        onClick={() => handleSendPaymentConfirmation(p)} 
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-red-400 text-white rounded-2xl hover:bg-red-500 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-100"
                      >
                        <Send className="w-4 h-4" /> Bestätigung
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default CourseEditor;
