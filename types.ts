
export type Role = 'ADMIN' | 'INSTRUCTOR' | 'LEADER';
export type UserCategory = 'Schwimmlehrer:in' | 'Helfer:in';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isAdmin?: boolean;
  category?: UserCategory;
  wagePerUnit?: number;     // KPE5
  wagePerUnit7?: number;    // KPE7
  password?: string;        // Passwort (3+3 Logik)
}

export interface Participant {
  id: string;
  name: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  guardianName: string;
  paid: boolean;
  notes?: string;
}

export interface Session {
  id: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  instructorIds: string[];
  isReplacement?: boolean;
  is5er?: boolean;
  is7er?: boolean;
  isConfirmed?: boolean;
}

export interface Course {
  id: string;
  title: string;
  location: string;
  price: number;
  notes: string;
  color: string;
  category: string;
  participants: Participant[];
  sessions: Session[];
  requiredInstructors: number;
  requiredHelpers: number;
  billedDate?: string;
  poolRent: number;
  leaderId?: string;
  courseNumber?: string;
  attendanceListSent?: boolean;
}

export interface SwapRequest {
  id: string;
  courseId: string;
  sessionId: string;
  requestingInstructorId: string;
  targetInstructorId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface AppState {
  currentUser: User | null;
  courses: Course[];
  instructors: User[];
  swapRequests: SwapRequest[];
  courseTitles: string[];
  isHydrated: boolean;
}
