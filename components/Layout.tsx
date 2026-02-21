import React, { useState } from 'react';
import { useStore } from '../store';
import Logo from './Common/Logo';
import { 
  LogOut, 
  Calendar, 
  Users, 
  LayoutDashboard, 
  Waves, 
  UserCircle, 
  Briefcase, 
  List,
  Menu,
  X,
  MoreHorizontal,
  Cloud,
  CloudOff,
  FlaskConical
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { currentUser, logout, isOnline, isDemoMode } = useStore();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  if (!currentUser) return <>{children}</>;

  const isAdmin = currentUser.role === 'ADMIN' || currentUser.isAdmin;

  const allItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard, roles: ['ADMIN', 'INSTRUCTOR', 'LEADER'], adminOnly: false },
    { id: 'my-courses', label: 'Kurse', icon: Briefcase, roles: ['INSTRUCTOR', 'LEADER'], adminOnly: false },
    { id: 'calendar', label: 'Termine', icon: Calendar, roles: ['INSTRUCTOR', 'LEADER'], adminOnly: false },
    { id: 'all-sessions', label: 'Planer', icon: Calendar, roles: ['ADMIN', 'LEADER'], adminOnly: true },
    { id: 'courses', label: 'Kurse', icon: Waves, roles: ['ADMIN', 'LEADER'], adminOnly: true },
    { id: 'instructors', label: 'Team', icon: UserCircle, roles: ['ADMIN'], adminOnly: true },
  ];

  const menuItems = allItems.filter(item => {
    if (isAdmin) return true;
    if (item.adminOnly) return false;
    return item.roles.includes(currentUser.role);
  });

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setIsMoreMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex h-screen bg-slate-50 flex-col md:flex-row overflow-hidden">
      
      {/* Mobile Top Header */}
      <header className="md:hidden bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="w-10"></div>
        <Logo size="sm" />
        <div className="w-10 flex justify-end">
           {isDemoMode ? <FlaskConical className="w-4 h-4 text-amber-500" /> : isOnline ? <Cloud className="w-4 h-4 text-emerald-500" /> : <CloudOff className="w-4 h-4 text-slate-400" />}
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-72 bg-white border-r border-slate-200 flex-col shrink-0">
        <div className="p-10 flex flex-col items-center justify-center border-b border-slate-100 relative">
          <Logo size="md" />
          <div className="absolute top-4 right-4 group">
            {isDemoMode ? (
              <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                <FlaskConical className="w-3 h-3 text-amber-500" />
                <span className="text-[8px] font-black text-amber-600 uppercase tracking-tighter">Demo</span>
              </div>
            ) : isOnline ? (
              <Cloud className="w-4 h-4 text-emerald-500 cursor-help" />
            ) : (
              <CloudOff className="w-4 h-4 text-slate-400 cursor-help" />
            )}
            
            {!isDemoMode && (
              <div className="absolute top-6 right-0 bg-slate-800 text-white text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest whitespace-nowrap z-50">
                {isOnline ? 'Cloud Synced' : 'Offline Mode'}
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white font-black shadow-xl shadow-blue-100' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-bold'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-slate-400'}`} />
              <span className="uppercase text-[11px] tracking-widest">{item.label === 'Home' ? 'Dashboard' : item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-4 mb-6 px-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-lg font-black border-4 border-white shadow-xl shadow-blue-100 shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-slate-900 truncate uppercase tracking-tighter">{currentUser.name}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">
                {isAdmin ? 'System Administrator' : currentUser.role === 'LEADER' ? 'Kursleiter:in' : 'Schwimmlehrer:in'}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-red-600 hover:bg-red-50 rounded-2xl transition-all text-[11px] font-black uppercase tracking-[0.2em] border-2 border-red-50"
          >
            <LogOut className="w-4 h-4" />
            Abmelden
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white/90 backdrop-blur-xl border-t border-slate-100 px-4 pt-2 pb-safe shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] rounded-t-[2.5rem]">
        <div className="flex items-center justify-around">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`flex flex-col items-center gap-1.5 py-3 px-4 rounded-2xl transition-all ${
                activeTab === item.id 
                  ? 'text-blue-600' 
                  : 'text-slate-400'
              }`}
            >
              <div className={`p-2 rounded-xl transition-all ${activeTab === item.id ? 'bg-blue-100' : 'bg-transparent'}`}>
                <item.icon className="w-6 h-6" />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${activeTab === item.id ? 'opacity-100' : 'opacity-60'}`}>
                {item.label}
              </span>
            </button>
          ))}
          <button
            onClick={() => setIsMoreMenuOpen(true)}
            className="flex flex-col items-center gap-1.5 py-3 px-4 rounded-2xl text-slate-400"
          >
            <div className="p-2 rounded-xl">
              <MoreHorizontal className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
              Mehr
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile More Overlay */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMoreMenuOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[3rem] p-10 animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
            
            <div className="flex items-center gap-5 mb-10 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
              <div className="w-16 h-16 rounded-[1.5rem] bg-blue-600 text-white flex items-center justify-center text-2xl font-black border-4 border-white shadow-xl">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <p className="text-lg font-black text-slate-900">{currentUser.name}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {isAdmin ? 'System Administrator' : currentUser.role === 'LEADER' ? 'Kursleiter:in' : 'Schwimmlehrer:in'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Status</span>
                <div className="flex items-center gap-2">
                   {isDemoMode ? (
                     <div className="flex items-center gap-2 text-amber-500 font-black uppercase text-[10px]">
                        Demo-Modus (Keine DB) <FlaskConical className="w-5 h-5" />
                     </div>
                   ) : (
                     <div className="flex items-center gap-2">
                       <span className={`text-[10px] font-black uppercase ${isOnline ? 'text-emerald-500' : 'text-slate-400'}`}>
                         {isOnline ? 'Synchronisiert' : 'Offline'}
                       </span>
                       {isOnline ? <Cloud className="w-5 h-5 text-emerald-500" /> : <CloudOff className="w-5 h-5 text-slate-400" />}
                     </div>
                   )}
                </div>
              </div>

              <button
                onClick={logout}
                className="w-full flex items-center justify-between p-6 bg-red-50 text-red-600 rounded-[2rem] border border-red-100 font-black uppercase tracking-widest text-sm"
              >
                <span>Abmelden</span>
                <LogOut className="w-6 h-6" />
              </button>
              
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="w-full py-5 text-slate-400 font-black uppercase tracking-widest text-xs"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto relative pb-24 md:pb-0">
        <div className="max-w-7xl mx-auto p-4 md:p-10">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;