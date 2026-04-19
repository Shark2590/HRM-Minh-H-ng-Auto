import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  Wallet, 
  CalendarOff, 
  Settings, 
  LayoutDashboard,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  LogOut,
  UserPlus,
  Building2,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { cn } from '../lib/utils';
import { employeeService } from '../lib/services';
import { Employee } from '../types';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path?: string;
  allowedRoles?: string[];
  children?: { id: string; label: string; icon: React.ElementType; path: string; allowedRoles?: string[] }[];
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard, path: '/' },
  { 
    id: 'hr', 
    label: 'Quản lý nhân sự', 
    icon: Users,
    allowedRoles: ['admin', 'manager'],
    children: [
      { id: 'employee-list', label: 'Danh sách nhân viên', icon: Users, path: '/hr/employees' },
      { id: 'departments', label: 'Phòng ban', icon: Building2, path: '/hr/departments' },
      { id: 'job-titles', label: 'Chức danh', icon: Briefcase, path: '/hr/job-titles' },
      { id: 'employee-settings', label: 'Thiết lập Nhân viên', icon: Settings, path: '/hr/settings' },
    ]
  },
  { 
    id: 'attendance', 
    label: 'Chấm công', 
    icon: Clock,
    children: [
      { id: 'check-in', label: 'Chấm công', icon: Clock, path: '/attendance/check-in' }, // All
      { id: 'attendance-table', label: 'Bảng chấm công', icon: LayoutDashboard, path: '/attendance/table', allowedRoles: ['admin', 'manager'] },
      { id: 'employee-shifts', label: 'Ca làm việc', icon: Clock, path: '/attendance/employee-shifts' }, // All
      { id: 'attendance-settings', label: 'Thiết lập chấm công', icon: Settings, path: '/attendance/settings', allowedRoles: ['admin', 'manager'] },
    ]
  },
  { 
    id: 'payroll', 
    label: 'Lương & Thưởng', 
    icon: Wallet,
    children: [
      { id: 'payslips', label: 'Phiếu lương', icon: Wallet, path: '/payroll/payslips' }, // All
      { id: 'sales-bonus', label: 'Thưởng doanh số', icon: Briefcase, path: '/payroll/sales-bonus', allowedRoles: ['admin', 'manager'] },
      { id: 'payroll-settings', label: 'Thiết lập lương', icon: Settings, path: '/payroll/settings', allowedRoles: ['admin', 'manager'] },
    ]
  },
  { id: 'leave', label: 'Nghỉ phép', icon: CalendarOff, path: '/leave' }, // All
  { id: 'settings', label: 'Thiết lập chung', icon: Settings, path: '/settings', allowedRoles: ['admin', 'manager'] },
];

export default function Layout({ children, currentPath, onNavigate }: { children: React.ReactNode, currentPath: string, onNavigate: (path: string) => void }) {
  // Mobile defaults to closed, desktop to open
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [isGoogleAdmin, setIsGoogleAdmin] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
         setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      const empId = localStorage.getItem('loggedInEmpId');
      if (empId) {
        if (empId === 'ADMIN_GOOGLE') {
          setIsGoogleAdmin(true);
          setCurrentUser({
            id: 'ADMIN_GOOGLE',
            name: auth.currentUser?.displayName || 'Quản trị viên (Google)',
            email: auth.currentUser?.email || '',
            role: 'admin',
          } as Employee);
        } else {
          try {
            const emp = await employeeService.getById(empId);
            if (emp) setCurrentUser(emp);
          } catch (e) {
            console.error('Failed to load user', e);
          }
        }
      }
    };
    
    const unsubscribe = auth.onAuthStateChanged(() => {
      loadUser();
    });
    
    loadUser();
    return () => unsubscribe();
  }, []);

  const toggleMenu = (id: string) => {
    setExpandedMenus(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleNavigate = (path: string) => {
    onNavigate(path);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('loggedInEmpId');
      await signOut(auth);
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
    }
  };

  return (
    <div className="flex h-screen bg-bg-main overflow-hidden font-sans relative">
      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
         <div 
           className="fixed inset-0 bg-black/50 z-40" 
           onClick={() => setIsSidebarOpen(false)}
         />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          width: isSidebarOpen ? 240 : (isMobile ? 0 : 80),
          x: isMobile && !isSidebarOpen ? -240 : 0
        }}
        className={cn(
          "bg-primary text-slate-400 flex flex-col relative z-50 shadow-2xl h-full shrink-0",
          isMobile && "fixed left-0 top-0 bottom-0"
        )}
      >
        <div className="p-6 flex items-center gap-3 border-b border-white/10 h-[60px]">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <Users className="text-white w-4 h-4" />
          </div>
          {isSidebarOpen && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-extrabold text-lg text-white tracking-tighter whitespace-nowrap"
            >
              HR CORE STUDIO
            </motion.span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-0 custom-scrollbar">
          {navItems.map((item) => {
            const itemAllowed = !item.allowedRoles || item.allowedRoles.includes(currentUser?.role || 'employee');
            if (!itemAllowed) return null;

            return (
            <div key={item.id} className="mb-0">
              {item.children ? (
                <div>
                  <button
                    onClick={() => toggleMenu(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-6 py-3 transition-all hover:bg-white/5 hover:text-white group",
                      expandedMenus.includes(item.id) && "text-white"
                    )}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {isSidebarOpen && (
                      <>
                        <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                        {expandedMenus.includes(item.id) ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                      </>
                    )}
                  </button>
                  <AnimatePresence>
                    {expandedMenus.includes(item.id) && isSidebarOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-black/20 overflow-hidden"
                      >
                        {item.children.map((child) => {
                          const childAllowed = !child.allowedRoles || child.allowedRoles.includes(currentUser?.role || 'employee');
                          if (!childAllowed) return null;
                          return (
                          <button
                            key={child.id}
                            onClick={() => handleNavigate(child.path)}
                            className={cn(
                              "w-full flex items-center gap-3 pl-12 pr-6 py-2.5 text-xs transition-all hover:text-white hover:bg-white/5",
                              currentPath === child.path ? "text-accent font-semibold" : "text-slate-500"
                            )}
                          >
                            <span>{child.label}</span>
                          </button>
                        )})}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  onClick={() => handleNavigate(item.path!)}
                  className={cn(
                    "w-full flex items-center gap-3 px-6 py-3 transition-all hover:bg-white/5 hover:text-white group border-l-4 border-transparent",
                    currentPath === item.path && "bg-white/10 text-white border-accent"
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {isSidebarOpen && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </button>
              )}
            </div>
          )})}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors text-slate-500"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {isSidebarOpen && <span className="text-sm font-medium">Đăng xuất</span>}
          </button>
        </div>

        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-20 bg-white text-primary rounded-full p-1 shadow-md hover:bg-bg-main transition-colors border border-border-main hidden md:block"
        >
          {isSidebarOpen ? <X className="w-3 h-3" /> : <Menu className="w-3 h-3" />}
        </button>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-[60px] bg-white border-b border-border-main flex items-center justify-between px-4 md:px-6 shrink-0 shadow-sm">
          <div className="flex items-center gap-2 text-text-sub text-xs">
             <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 mr-2 -ml-2 rounded-lg hover:bg-slate-100 md:hidden text-primary"
             >
                <Menu className="w-5 h-5" />
             </button>
             <span className="hidden sm:inline">Quản trị</span>
             <ChevronRight className="w-3 h-3 hidden sm:inline" />
             <span className="font-semibold text-text-main truncate max-w-[120px] sm:max-w-none">
               {navItems.find(i => i.path === currentPath)?.label || 
                navItems.flatMap(i => i.children || []).find(c => c.path === currentPath)?.label || 
                "Bảng điều khiển"}
             </span>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
             <button 
                onClick={() => handleNavigate('/profile')}
                className="flex items-center gap-3 md:gap-4 hover:bg-slate-50 p-2 rounded-xl border border-transparent hover:border-border-main transition-all text-left"
             >
               <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-sm font-bold text-text-main pr-1">{currentUser?.name || 'Đang tải...'}</span>
                  <span className="text-[10px] text-text-sub font-medium pr-1">{currentUser?.role === 'admin' ? 'Quản trị viên' : currentUser?.email || currentUser?.id}</span>
               </div>
               <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'AQ'}
               </div>
             </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
