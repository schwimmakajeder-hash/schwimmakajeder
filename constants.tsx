
export const COURSE_CATEGORIES = [
  'Stufe 1',
  'Stufe 2',
  'Stufe 3',
  'Auffrischung',
  'Schule',
  'Kindergarten',
  'Familienverband',
  'Kindertraining',
  'Kraulkurs'
];

export const INITIAL_COURSE_TITLES = [
  'Anfängerschwimmkurs 4 bis 6 Jahre',
  'Anfängerschwimmkurs 5 bis 6 Jahre',
  'Anfängerschwimmkurs ab 6 Jahren',
  'Fortgeschrittenenschwimmkurs',
  'Kraulkurs',
  'Erwachsenenschwimmkurs',
  'Kraulkurs für Fortgeschrittene'
];

export const LOCATIONS = [
  'Jupident',
  'Walgaubad',
  'Sonstiger'
];

export const COURSE_COLORS = [
  { name: 'Blau', value: '#3b82f6' },
  { name: 'Grün', value: '#22c55e' },
  { name: 'Rot', value: '#ef4444' },
  { name: 'Gelb', value: '#eab308' },
  { name: 'Lila', value: '#a855f7' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Türkis', value: '#14b8a6' },
];

export const DEFAULT_INSTRUCTORS = [
  { id: 'inst-oliver', name: 'Oliver Tschabrun', email: 'oliver@swim.de', role: 'INSTRUCTOR' as const, isAdmin: true, category: 'Schwimmlehrer:in' as const, wagePerUnit: 35, wagePerUnit7: 45, password: 'OliTsc' },
  { id: 'inst-cinzia', name: 'Cinzia Arena', email: 'cinzia@swim.de', role: 'LEADER' as const, category: 'Schwimmlehrer:in' as const, wagePerUnit: 30, wagePerUnit7: 40, password: 'CinAre' },
  { id: 'inst-enya', name: 'Enya Lins', email: 'enya@swim.de', role: 'INSTRUCTOR' as const, category: 'Helfer:in' as const, wagePerUnit: 20, wagePerUnit7: 25, password: 'EnyLin' },
  { id: 'inst-1', name: 'Max Mustermann', email: 'max@swim.de', role: 'INSTRUCTOR' as const, category: 'Schwimmlehrer:in' as const, wagePerUnit: 25, wagePerUnit7: 35, password: 'MaxMus' },
  { id: 'admin-1', name: 'Admin User', email: 'admin@swim.de', role: 'ADMIN' as const, isAdmin: true, category: 'Schwimmlehrer:in' as const, wagePerUnit: 30, wagePerUnit7: 40, password: 'AdmUse' },
];

export const DEFAULT_COURSES = [
  {
    id: 'course-1',
    title: 'Anfängerkurs Stufe 1',
    location: 'Jupident',
    price: 149,
    notes: 'Bitte Schwimmbrille und Handtuch mitbringen.',
    color: '#3b82f6',
    category: 'Stufe 1',
    requiredInstructors: 1,
    requiredHelpers: 1,
    poolRent: 0,
    leaderId: 'inst-oliver',
    courseNumber: 'OT202501',
    participants: [
      { id: 'p1', name: 'Lukas Müller', dateOfBirth: '2018-05-12', phone: '01511234567', email: 'mueller@example.com', guardianName: 'Stefan Müller', paid: true, notes: 'Anfänger ohne Vorerfahrung' },
      { id: 'p2', name: 'Emma Schmidt', dateOfBirth: '2018-09-20', phone: '01529876543', email: 'schmidt@example.com', guardianName: 'Maria Schmidt', paid: false, notes: '' },
    ],
    sessions: [
      { id: 's1-1', date: '2025-06-02', startTime: '15:00', durationMinutes: 45, instructorIds: ['inst-1'], isReplacement: false },
      { id: 's1-2', date: '2025-06-09', startTime: '15:00', durationMinutes: 45, instructorIds: ['inst-1'], isReplacement: false },
      { id: 's1-3', date: '2025-06-16', startTime: '15:00', durationMinutes: 45, instructorIds: ['inst-1', 'inst-2'], isReplacement: true },
    ]
  },
  {
    id: 'course-2',
    title: 'Kraulkurs Technik',
    location: 'Walgaubad',
    price: 149,
    notes: 'Voraussetzung: 100m am Stück schwimmen.',
    color: '#22c55e',
    category: 'Kraulkurs',
    requiredInstructors: 1,
    requiredHelpers: 1,
    poolRent: 0,
    leaderId: 'inst-cinzia',
    courseNumber: 'CA202501',
    participants: [
      { id: 'p4', name: 'Sophie Weber', dateOfBirth: '2010-03-15', phone: '01602233445', email: 'weber@example.com', guardianName: 'Anja Weber', paid: true },
    ],
    sessions: [
      { id: 's2-1', date: '2025-06-03', startTime: '17:30', durationMinutes: 60, instructorIds: ['inst-2'], isReplacement: false },
    ]
  }
];
