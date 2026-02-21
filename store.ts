import { create } from 'zustand';
import { AppState, Course, User, Participant, Session } from './types';
import { DEFAULT_INSTRUCTORS, DEFAULT_COURSES, INITIAL_COURSE_TITLES } from './constants';
import { supabase } from './supabase';

interface AppStore extends AppState {
  isOnline: boolean;
  isDemoMode: boolean;
  login: (email: string, password?: string) => void;
  logout: () => void;
  addCourse: (course: Course) => void;
  updateCourse: (course: Course) => void;
  deleteCourse: (id: string) => void;
  addInstructor: (user: User) => void;
  updateInstructor: (user: User) => void;
  deleteInstructor: (id: string) => void;
  resetInstructorPassword: (id: string) => void;
  requestSwap: (courseId: string, sessionId: string, requestingInstructorId: string, targetInstructorId: string) => Promise<void>;
  approveSwap: (requestId: string) => Promise<void>;
  rejectSwap: (requestId: string) => Promise<void>;
  addCourseTitle: (title: string) => void;
  swapSessionInstructor: (courseId: string, sessionId: string, oldInstructorId: string, newInstructorId: string) => Promise<void>;
  hydrate: () => void;
  refreshData: () => Promise<void>;
}

export const generateDefaultPassword = (name: string) => {
  if (!name) return 'PW1234';
  const parts = name.trim().split(/\s+/);
  const firstPart = parts[0] || '';
  const lastPart = parts.length > 1 ? parts[parts.length - 1] : 'X';
  return (firstPart.substring(0, 3) + lastPart.substring(0, 3));
};

// Hilfsfunktion zur Prüfung ob Supabase konfiguriert ist
const isSupabaseConfigured = () => {
  try {
    const url = (supabase as any).supabaseUrl;
    return url && !url.includes('dein-projekt.supabase.co');
  } catch {
    return false;
  }
};

export const useStore = create<AppStore>((set, get) => ({
  currentUser: null,
  courses: [],
  instructors: [],
  swapRequests: [],
  courseTitles: [],
  isHydrated: false,
  isOnline: true,
  isDemoMode: !isSupabaseConfigured(),

  refreshData: async () => {
    if (get().isDemoMode) {
      // Im Demo-Modus laden wir nur die Konstanten, falls noch nichts im State ist
      if (get().courses.length === 0) {
        set({ 
          instructors: DEFAULT_INSTRUCTORS,
          courses: DEFAULT_COURSES,
          courseTitles: INITIAL_COURSE_TITLES,
          isHydrated: true,
          isOnline: false
        });
      }
      return;
    }

    try {
      const { data: instructorsData, error: instError } = await supabase
        .from('instructors')
        .select('*');
      
      if (instError) throw instError;

      const mappedInstructors: User[] = (instructorsData || []).map(i => ({
        id: i.id,
        name: i.name,
        email: i.email,
        role: i.role,
        category: i.category,
        isAdmin: i.is_admin,
        wagePerUnit: i.wage_per_unit,
        wagePerUnit7: i.wage_per_unit_7,
        password: i.password
      }));

      const { data: coursesData, error: courseError } = await supabase
        .from('courses')
        .select(`
          *,
          participants (*),
          sessions (
            *,
            session_instructors (instructor_id)
          )
        `);

      if (courseError) throw courseError;

      const mappedCourses: Course[] = (coursesData || []).map(c => ({
        id: c.id,
        title: c.title,
        location: c.location,
        price: c.price,
        notes: c.notes || '',
        color: c.color,
        category: c.category,
        requiredInstructors: c.required_instructors,
        requiredHelpers: c.required_helpers,
        billedDate: c.billed_date,
        poolRent: c.pool_rent,
        leaderId: c.leader_id,
        attendanceListSent: c.attendance_list_sent,
        participants: (c.participants || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          dateOfBirth: p.date_of_birth,
          phone: p.phone,
          email: p.email,
          guardianName: p.guardian_name,
          paid: p.paid,
          notes: p.notes
        })),
        sessions: (c.sessions || []).map((s: any) => ({
          id: s.id,
          date: s.date,
          startTime: s.start_time,
          duration_minutes: s.duration_minutes,
          isReplacement: s.is_replacement,
          is5er: s.is_5er,
          is7er: s.is_7er,
          isConfirmed: s.is_confirmed,
          instructorIds: s.session_instructors?.map((si: any) => si.instructor_id) || []
        }))
      }));

      set({ 
        instructors: mappedInstructors.length > 0 ? mappedInstructors : DEFAULT_INSTRUCTORS,
        courses: mappedCourses.length > 0 ? mappedCourses : DEFAULT_COURSES,
        swapRequests: [], // Fallback for now if no table exists
        isHydrated: true,
        isOnline: true
      });
    } catch (err) {
      console.warn("Supabase Sync Error, switching to Demo Mode:", err);
      set({ 
        isOnline: false, 
        isDemoMode: true, 
        isHydrated: true,
        instructors: get().instructors.length > 0 ? get().instructors : DEFAULT_INSTRUCTORS,
        courses: get().courses.length > 0 ? get().courses : DEFAULT_COURSES,
        swapRequests: get().swapRequests
      });
    }
  },

  login: async (email: string, password?: string) => {
    const user = get().instructors.find(i => i.email.toLowerCase() === email.toLowerCase());
    if (user) {
      if (user.password === password) {
        set({ currentUser: user });
        localStorage.setItem('swim_current_user_id', user.id);
      } else {
        alert('Falsches Passwort. Bitte versuche es erneut.');
      }
    } else {
      alert('Benutzer mit dieser E-Mail wurde nicht gefunden.');
    }
  },

  logout: () => {
    set({ currentUser: null });
    localStorage.removeItem('swim_current_user_id');
  },

  addCourse: async (course: Course) => {
    if (get().isDemoMode) {
      set(state => ({ courses: [...state.courses, course] }));
      return;
    }
    try {
      const { error: courseError } = await supabase.from('courses').insert({
        id: course.id,
        title: course.title,
        location: course.location,
        price: course.price,
        notes: course.notes,
        color: course.color,
        category: course.category,
        required_instructors: course.requiredInstructors,
        required_helpers: course.requiredHelpers,
        pool_rent: course.poolRent,
        leader_id: course.leaderId
      });
      if (courseError) throw courseError;
      if (course.participants.length > 0) {
        await supabase.from('participants').insert(
          course.participants.map(p => ({
            id: p.id,
            course_id: course.id,
            name: p.name,
            date_of_birth: p.dateOfBirth,
            phone: p.phone,
            email: p.email,
            guardian_name: p.guardianName,
            paid: p.paid,
            notes: p.notes
          }))
        );
      }
      for (const s of course.sessions) {
        await supabase.from('sessions').insert({
          id: s.id,
          course_id: course.id,
          date: s.date,
          start_time: s.startTime,
          duration_minutes: s.durationMinutes,
          is_replacement: s.isReplacement,
          is_5er: s.is5er,
          is_7er: s.is7er,
          is_confirmed: s.isConfirmed
        });
        if (s.instructorIds.length > 0) {
          await supabase.from('session_instructors').insert(
            s.instructorIds.map(instId => ({
              session_id: s.id,
              instructor_id: instId
            }))
          );
        }
      }
      await get().refreshData();
    } catch (e) {
      console.error("Add Course Error:", e);
    }
  },

  updateCourse: async (course: Course) => {
    if (get().isDemoMode) {
      set(state => ({ 
        courses: state.courses.map(c => c.id === course.id ? course : c) 
      }));
      return;
    }
    try {
      await supabase.from('courses').upsert({
        id: course.id,
        title: course.title,
        location: course.location,
        price: course.price,
        notes: course.notes,
        color: course.color,
        category: course.category,
        required_instructors: course.requiredInstructors,
        required_helpers: course.requiredHelpers,
        pool_rent: course.poolRent,
        leader_id: course.leaderId,
        billed_date: course.billedDate,
        attendance_list_sent: course.attendanceListSent
      });
      await supabase.from('participants').delete().eq('course_id', course.id);
      if (course.participants.length > 0) {
        await supabase.from('participants').insert(
          course.participants.map(p => ({
            id: p.id,
            course_id: course.id,
            name: p.name,
            date_of_birth: p.dateOfBirth,
            phone: p.phone,
            email: p.email,
            guardian_name: p.guardianName,
            paid: p.paid,
            notes: p.notes
          }))
        );
      }
      await supabase.from('sessions').delete().eq('course_id', course.id);
      for (const s of course.sessions) {
        await supabase.from('sessions').insert({
          id: s.id,
          course_id: course.id,
          date: s.date,
          start_time: s.startTime,
          duration_minutes: s.durationMinutes,
          is_replacement: s.isReplacement,
          is_5er: s.is5er,
          is_7er: s.is7er,
          is_confirmed: s.isConfirmed
        });
        if (s.instructorIds.length > 0) {
          await supabase.from('session_instructors').insert(
            s.instructorIds.map(instId => ({
              session_id: s.id,
              instructor_id: instId
            }))
          );
        }
      }
      await get().refreshData();
    } catch (e) {
      console.error("Update Course Error:", e);
    }
  },

  deleteCourse: async (id: string) => {
    if (get().isDemoMode) {
      set(state => ({ courses: state.courses.filter(c => c.id !== id) }));
      return;
    }
    try {
      await supabase.from('courses').delete().eq('id', id);
      await get().refreshData();
    } catch (e) {
      console.error("Delete Course Error:", e);
    }
  },

  addInstructor: async (user: User) => {
    const newUser = { ...user };
    if (!newUser.password) newUser.password = generateDefaultPassword(newUser.name);
    if (get().isDemoMode) {
      set(state => ({ instructors: [...state.instructors, newUser] }));
      return;
    }
    try {
      await supabase.from('instructors').insert({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        is_admin: newUser.isAdmin,
        category: newUser.category,
        wage_per_unit: newUser.wagePerUnit,
        wage_per_unit_7: newUser.wagePerUnit7,
        password: newUser.password
      });
      await get().refreshData();
    } catch (e) {
      console.error("Add Instructor Error:", e);
    }
  },

  updateInstructor: async (user: User) => {
    if (get().isDemoMode) {
      set(state => ({ 
        instructors: state.instructors.map(i => i.id === user.id ? user : i) 
      }));
      return;
    }
    try {
      await supabase.from('instructors').upsert({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_admin: user.isAdmin,
        category: user.category,
        wage_per_unit: user.wagePerUnit,
        wage_per_unit_7: user.wagePerUnit7,
        password: user.password
      });
      await get().refreshData();
    } catch (e) {
      console.error("Update Instructor Error:", e);
    }
  },

  deleteInstructor: async (id: string) => {
    if (get().isDemoMode) {
      set(state => ({ instructors: state.instructors.filter(i => i.id !== id) }));
      return;
    }
    try {
      await supabase.from('instructors').delete().eq('id', id);
      await get().refreshData();
    } catch (e) {
      console.error("Delete Instructor Error:", e);
    }
  },

  resetInstructorPassword: async (id: string) => {
    const user = get().instructors.find(i => i.id === id);
    if (!user) return;
    const newPassword = generateDefaultPassword(user.name);
    if (get().isDemoMode) {
      get().updateInstructor({ ...user, password: newPassword });
      alert(`Passwort zurückgesetzt auf: ${newPassword}`);
      return;
    }
    try {
      await supabase.from('instructors').update({ password: newPassword }).eq('id', id);
      alert(`Passwort für ${user.name} zurückgesetzt auf: ${newPassword}`);
      await get().refreshData();
    } catch (e) {
      console.error("Reset Password Error:", e);
    }
  },

  swapSessionInstructor: async (courseId, sessionId, oldInstructorId, newInstructorId) => {
    const course = get().courses.find(c => c.id === courseId);
    if (!course) return;

    const updatedSessions = course.sessions.map(s => {
      if (s.id === sessionId) {
        const instructorIds = s.instructorIds.filter(id => id !== oldInstructorId);
        if (!instructorIds.includes(newInstructorId)) {
          instructorIds.push(newInstructorId);
        }
        return { ...s, instructorIds };
      }
      return s;
    });

    await get().updateCourse({ ...course, sessions: updatedSessions });
  },

  requestSwap: async (courseId, sessionId, requestingInstructorId, targetInstructorId) => {
    const newRequest = {
      id: crypto.randomUUID(),
      courseId,
      sessionId,
      requestingInstructorId,
      targetInstructorId,
      status: 'PENDING' as const,
      createdAt: new Date().toISOString()
    };
    
    set(state => ({ swapRequests: [...state.swapRequests, newRequest] }));
    // In a real app, we would save to Supabase here
  },

  approveSwap: async (requestId) => {
    const request = get().swapRequests.find(r => r.id === requestId);
    if (!request) return;

    await get().swapSessionInstructor(
      request.courseId,
      request.sessionId,
      request.requestingInstructorId,
      request.targetInstructorId
    );

    set(state => ({
      swapRequests: state.swapRequests.map(r => 
        r.id === requestId ? { ...r, status: 'APPROVED' as const } : r
      )
    }));
  },

  rejectSwap: async (requestId) => {
    set(state => ({
      swapRequests: state.swapRequests.map(r => 
        r.id === requestId ? { ...r, status: 'REJECTED' as const } : r
      )
    }));
  },

  addCourseTitle: (title: string) => {
    if (!title) return;
    set(state => ({
      courseTitles: state.courseTitles.includes(title) ? state.courseTitles : [...state.courseTitles, title]
    }));
  },

  hydrate: async () => {
    await get().refreshData();
    const savedUserId = localStorage.getItem('swim_current_user_id');
    if (savedUserId && !get().currentUser) {
      const user = get().instructors.find(i => i.id === savedUserId);
      if (user) set({ currentUser: user });
    }
  },
}));