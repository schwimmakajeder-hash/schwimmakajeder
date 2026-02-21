
import React, { useMemo } from 'react';
import { useStore } from '../../store';
import CalendarView from '../Common/CalendarView';
import { Course, Session } from '../../types';

const AllSessionsList: React.FC = () => {
  const { courses, instructors } = useStore();

  const allSessionsData = useMemo(() => {
    const sessions: { course: Course; session: Session }[] = [];
    courses.forEach(course => {
      course.sessions.forEach(session => {
        sessions.push({ course, session });
      });
    });
    return sessions;
  }, [courses]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CalendarView 
        title="System-Kalender"
        sessions={allSessionsData}
        allInstructors={instructors}
        isGlobal={true}
      />
    </div>
  );
};

export default AllSessionsList;
