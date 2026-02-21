
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Course, Session, User } from '../types';

const getEndTime = (startTime: string, duration: number) => {
  const [h, m] = startTime.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m + duration);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const formatICalDate = (date: Date) => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

export const generateICalContent = (courses: Course[], instructorId?: string) => {
  let ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SwimAdmin//NONSGML v1.0//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:SwimAdmin Einsätze',
    'X-WR-TIMEZONE:Europe/Berlin'
  ];

  courses.forEach(course => {
    const sortedSessions = [...course.sessions].sort((a,b) => a.date.localeCompare(b.date));
    const regularSessions = sortedSessions.filter(s => !s.isReplacement);
    
    const filteredSessions = instructorId 
      ? sortedSessions.filter(s => s.instructorIds.includes(instructorId))
      : sortedSessions;
    
    filteredSessions.forEach(session => {
      const start = new Date(`${session.date}T${session.startTime}:00`);
      const end = new Date(start.getTime() + session.durationMinutes * 60000);
      
      const regIdx = regularSessions.findIndex(s => s.id === session.id);
      const numbering = session.isReplacement ? "ERSATZ" : `Einheit ${regIdx + 1}/${regularSessions.length}`;

      ical.push('BEGIN:VEVENT');
      ical.push(`UID:${session.id}@swimadmin.local`);
      ical.push(`DTSTAMP:${formatICalDate(new Date())}`);
      ical.push(`DTSTART:${formatICalDate(start)}`);
      ical.push(`DTEND:${formatICalDate(end)}`);
      ical.push(`SUMMARY:Schwimmkurs: ${course.title} (${numbering})`);
      ical.push(`LOCATION:${course.location}`);
      ical.push(`DESCRIPTION:Kategorie: ${course.category}\\nOrt: ${course.location}\\nNotizen: ${course.notes || 'Keine'}`);
      ical.push('STATUS:CONFIRMED');
      ical.push('END:VEVENT');
    });
  });

  ical.push('END:VCALENDAR');
  return ical.join('\r\n');
};

export const downloadICalFile = (courses: Course[], instructorId?: string) => {
  const content = generateICalContent(courses, instructorId);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `swim_termine_${instructorId || 'all'}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadSingleSessionICal = (course: Course, session: Session) => {
  let ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SwimAdmin//NONSGML v1.0//EN',
    'BEGIN:VEVENT',
    `UID:${session.id}@swimadmin.local`,
    `DTSTAMP:${formatICalDate(new Date())}`,
    `DTSTART:${formatICalDate(new Date(`${session.date}T${session.startTime}:00`))}`,
    `DTEND:${formatICalDate(new Date(new Date(`${session.date}T${session.startTime}:00`).getTime() + session.durationMinutes * 60000))}`,
    `SUMMARY:Bestätigter Termin: ${course.title}`,
    `LOCATION:${course.location}`,
    `DESCRIPTION:Kategorie: ${course.category}\\nOrt: ${course.location}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([ical], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Termin_${session.date}_${course.title.replace(/\s/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportAttendancePDF = (course: Course, instructors: User[]) => {
  const doc = new jsPDF('l', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(course.title, 14, 15);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  doc.text(`Kategorie: ${course.category} | Ort: ${course.location} | Preis: ${course.price} EUR`, 14, 22);
  if (course.notes) {
    doc.setFontSize(9); doc.setFont('helvetica', 'italic'); doc.setTextColor(100);
    const splitNotes = doc.splitTextToSize(`Kurs-Notizen: ${course.notes}`, pageWidth - 28);
    doc.text(splitNotes, 14, 28);
  }
  const sessions = [...course.sessions].sort((a, b) => a.date.localeCompare(b.date));
  const regularSessions = sessions.filter(s => !s.isReplacement);
  const teamHeader = [['Einheit', 'Datum / Uhrzeit', 'Eingeteiltes Team']];
  const teamBody = sessions.map(s => {
    const dateStr = new Date(s.date).toLocaleDateString('de-DE');
    const numbering = s.isReplacement ? "ERSATZ" : `Einheit ${regularSessions.findIndex(reg => reg.id === s.id) + 1}`;
    const staffNames = s.instructorIds.map(id => {
      const inst = instructors.find(i => i.id === id);
      return inst ? `${inst.name} (${inst.category === 'Schwimmlehrer:in' ? 'L' : 'H'})` : '?';
    }).join(', ');
    return [numbering, `${dateStr}, ${s.startTime} Uhr`, staffNames || 'Noch niemand eingeteilt'];
  });
  autoTable(doc, {
    startY: course.notes ? 38 : 30, head: teamHeader, body: teamBody, theme: 'grid',
    headStyles: { fillColor: [241, 245, 249] as [number, number, number], textColor: [71, 85, 105] as [number, number, number], fontSize: 8, fontStyle: 'bold' as const },
    styles: { fontSize: 8, cellPadding: 2 }, margin: { left: 14, right: 14 }
  });
  const headers = [
    [{ content: 'Teilnehmer-Details', colSpan: 4, styles: { halign: 'center' as const, fillColor: [51, 65, 85] as [number, number, number] } }, { content: 'Anwesenheit', colSpan: sessions.length, styles: { halign: 'center' as const, fillColor: [30, 41, 59] as [number, number, number] } }],
    ['Name / EB', 'Geburtstag', 'Kontakt', 'Zahl.', ...sessions.map(s => new Date(s.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }))]
  ];
  const body = course.participants.map(p => [
    { content: `${p.name}\nEB: ${p.guardianName || '-'}`, styles: { fontStyle: 'bold' as const } },
    p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString('de-DE') : '-',
    `${p.phone || '-'}\n${p.email || '-'}`, p.paid ? 'JA' : 'NEIN', ...sessions.map(() => '')
  ]);
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10, head: headers as any, body: body as any, theme: 'grid',
    headStyles: { fillColor: [71, 85, 105] as [number, number, number], fontSize: 7, halign: 'center' as const },
    styles: { fontSize: 7, cellPadding: 2 }, columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 18 }, 2: { cellWidth: 35 }, 3: { cellWidth: 10 } },
    margin: { left: 14, right: 14 }
  });
  doc.save(`Anwesenheit_${course.title.replace(/\s/g, '_')}.pdf`);
};

export const exportAttendanceExcel = (course: Course, instructors: User[]) => {
  const sessions = [...course.sessions].sort((a, b) => a.date.localeCompare(b.date));
  const data = course.participants.map(p => {
    const row: any = { 'Name': p.name, 'Geburtstag': p.dateOfBirth, 'EB': p.guardianName, 'Bezahlt': p.paid ? 'Ja' : 'Nein' };
    sessions.forEach(s => { row[new Date(s.date).toLocaleDateString('de-DE')] = ''; });
    return row;
  });
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Anwesenheit');
  XLSX.writeFile(wb, `Kurs_${course.title.replace(/\s/g, '_')}.xlsx`);
};
