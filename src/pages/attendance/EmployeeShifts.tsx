import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Search, CheckCircle2 } from 'lucide-react';
import { employeeService, shiftService } from '../../lib/services';
import { Employee, Shift } from '../../types';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// Helpers
const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getWeekOfMonth = (date: Date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const dayOfWeek = firstDay.getDay() === 0 ? 7 : firstDay.getDay(); 
  return Math.ceil((date.getDate() + dayOfWeek - 1) / 7);
};

const DAYS_OF_WEEK = [
  { id: 1, label: 'Thứ hai' },
  { id: 2, label: 'Thứ ba' },
  { id: 3, label: 'Thứ tư' },
  { id: 4, label: 'Thứ năm' },
  { id: 5, label: 'Thứ sáu' },
  { id: 6, label: 'Thứ bảy' },
  { id: 0, label: 'Chủ nhật' },
];

export default function EmployeeShifts() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));
  const [currentUserRole, setCurrentUserRole] = useState<string>('employee');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  // Modal State
  const [editingSlot, setEditingSlot] = useState<{ shift: Shift, day: {id: number, label: string}, dateObj: Date } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const empId = localStorage.getItem('loggedInEmpId');
      let uRole = 'employee';
      if (empId === 'ADMIN_GOOGLE' || empId === '0706919999') {
         uRole = 'admin';
         setCurrentUserRole('admin');
         setCurrentUserId(empId);
      } else if (empId) {
         setCurrentUserId(empId);
         const dbUser = await employeeService.getById(empId);
         if (dbUser) {
            uRole = dbUser.role;
            setCurrentUserRole(uRole);
         }
      }

      const [empList, shiftList] = await Promise.all([
        employeeService.getAll(),
        shiftService.getAll()
      ]);
      
      let sortedEmps = empList.filter(e => e.status === 'active').sort((a,b) => a.name.localeCompare(b.name));
      
      // If regular employee, only show their own shift assignments
      if (uRole !== 'admin' && uRole !== 'manager' && empId) {
         sortedEmps = sortedEmps.filter(e => e.id === empId);
      }

      setEmployees(sortedEmps);
      setShifts(shiftList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const prevWeek = () => setCurrentWeekStart(new Date(currentWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000));
  const nextWeek = () => setCurrentWeekStart(new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000));

  const weekHeading = `Tuần ${getWeekOfMonth(currentWeekStart)} - Th. ${currentWeekStart.getMonth() + 1} ${currentWeekStart.getFullYear()}`;

  const openEditModal = (shift: Shift, day: {id: number, label: string}, dateObj: Date) => {
    const preselected = employees.filter(e => e.assignedShifts?.some(s => s.shiftId === shift.id && s.daysOfWeek.includes(day.id))).map(e => e.id);
    setSelectedEmpIds(preselected);
    setSearchTerm('');
    setEditingSlot({ shift, day, dateObj });
  };

  const toggleEmpSelection = (id: string) => {
    setSelectedEmpIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSaveSlot = async () => {
    if (!editingSlot) return;
    setSaving(true);
    try {
      const promises = employees.map(async (emp) => {
        const isSelected = selectedEmpIds.includes(emp.id);
        const currentAssignedShifts = emp.assignedShifts ? [...emp.assignedShifts] : [];
        const shiftIndex = currentAssignedShifts.findIndex(s => s.shiftId === editingSlot.shift.id);
        
        let hasChanges = false;

        if (isSelected) {
          if (shiftIndex >= 0) {
            if (!currentAssignedShifts[shiftIndex].daysOfWeek.includes(editingSlot.day.id)) {
              currentAssignedShifts[shiftIndex].daysOfWeek.push(editingSlot.day.id);
              hasChanges = true;
            }
          } else {
            currentAssignedShifts.push({
              shiftId: editingSlot.shift.id,
              daysOfWeek: [editingSlot.day.id]
            });
            hasChanges = true;
          }
        } else {
          if (shiftIndex >= 0) {
            const dayIndex = currentAssignedShifts[shiftIndex].daysOfWeek.indexOf(editingSlot.day.id);
            if (dayIndex >= 0) {
              currentAssignedShifts[shiftIndex].daysOfWeek.splice(dayIndex, 1);
              if (currentAssignedShifts[shiftIndex].daysOfWeek.length === 0) {
                currentAssignedShifts.splice(shiftIndex, 1);
              }
              hasChanges = true;
            }
          }
        }

        if (hasChanges) {
          await employeeService.update(emp.id, { assignedShifts: currentAssignedShifts });
        }
      });

      await Promise.all(promises);
      await fetchData();
      setEditingSlot(null);
    } catch (e) {
      console.error(e);
      alert('Đã có lỗi xảy ra.');
    } finally {
      setSaving(false);
    }
  };

  const today = new Date();
  today.setHours(0,0,0,0);

  const isManagerOrAdmin = currentUserRole === 'admin' || currentUserRole === 'manager';

  return (
    <div className="bg-white min-h-[calc(100vh-100px)] rounded-2xl border border-border-main shadow-sm flex flex-col relative animate-in fade-in duration-500 overflow-hidden">
      
      {/* Header controls */}
      <div className="p-5 border-b border-border-main flex items-center justify-between sticky top-0 bg-white z-20">
        <h1 className="text-xl font-black text-primary">
           {isManagerOrAdmin ? 'Xếp lịch làm việc' : 'Lịch làm việc của tôi'}
        </h1>
      </div>

      <div className="p-4 flex items-center sticky top-0 bg-white z-20">
        <div className="flex items-center rounded-lg border border-border-main shadow-sm overflow-hidden bg-white">
          <button onClick={prevWeek} className="p-2.5 hover:bg-slate-50 border-r border-border-main transition-colors text-text-sub hover:text-primary">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-5 py-2.5 font-bold text-sm text-primary min-w-[200px] text-center bg-white">
            {weekHeading}
          </div>
          <button onClick={nextWeek} className="p-2.5 hover:bg-slate-50 border-l border-border-main transition-colors text-text-sub hover:text-primary">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Matrix Table */}
      <div className="flex-1 overflow-auto custom-scrollbar relative">
        {loading ? (
          <div className="text-center py-20 text-slate-400">Đang tải lịch...</div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead className="sticky top-0 z-10 bg-white shadow-sm ring-1 ring-border-main">
              <tr>
                <th className="bg-white border-r border-border-main p-4 font-bold text-primary w-48 sticky left-0 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                  <span className="text-sm">Ca làm việc</span>
                </th>
                {DAYS_OF_WEEK.map((day, idx) => {
                  const theDate = new Date(currentWeekStart);
                  theDate.setDate(currentWeekStart.getDate() + idx);
                  const isToday = theDate.getTime() === today.getTime();

                  return (
                    <th key={day.id} className="bg-white border-r border-border-main p-4 font-bold text-center min-w-[180px] last:border-r-0">
                      <div className={cn(
                        "flex items-center justify-center gap-2",
                        isToday ? "text-accent" : "text-text-sub"
                      )}>
                        <span className="text-sm font-medium">{day.label}</span>
                        <span className={cn(
                          "w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold",
                          isToday ? "bg-accent text-white shadow-sm" : "text-primary"
                        )}>
                          {theDate.getDate()}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {shifts.map((shift, rowIndex) => (
                <tr key={shift.id} className="border-b border-border-main last:border-b-0">
                  {/* Shift Column */}
                  <td className={cn(
                    "border-r border-border-main p-4 align-top sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]",
                    rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                  )}>
                    <div className="font-bold text-primary text-sm mb-1">{shift.name}</div>
                    <div className="text-xs text-text-sub">{shift.startTime} - {shift.endTime}</div>
                  </td>
                  
                  {/* Days Columns */}
                  {DAYS_OF_WEEK.map((day, idx) => {
                    const theDate = new Date(currentWeekStart);
                    theDate.setDate(currentWeekStart.getDate() + idx);
                    
                    const empsInSlot = employees.filter(e => e.assignedShifts?.some(s => s.shiftId === shift.id && s.daysOfWeek.includes(day.id)));
                    
                    return (
                      <td 
                        key={`${shift.id}-${day.id}`} 
                        className={cn(
                          "border-r border-border-main p-3 align-top group transition-colors relative min-h-[120px] last:border-r-0",
                          rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/30",
                          isManagerOrAdmin ? "cursor-pointer hover:bg-blue-50/40" : ""
                        )}
                        onClick={() => {
                           if (isManagerOrAdmin) openEditModal(shift, day, theDate);
                        }}
                      >
                         <div className="flex flex-col gap-2 relative z-0">
                           {empsInSlot.map(emp => (
                             <div key={emp.id} className="px-3 py-2 bg-[#E8F2FC] text-[#0057B7] text-xs font-bold rounded-lg truncate shadow-sm">
                               {emp.name}
                             </div>
                           ))}
                           
                           {/* Empty placeholder for easier clicking/visual cues */}
                           {isManagerOrAdmin && (
                             <div className="w-full min-h-[40px] rounded-lg border-2 border-transparent group-hover:border-dashed group-hover:border-accent/40 flex items-center justify-center transition-all bg-transparent">
                                <span className="text-xs font-bold text-accent opacity-0 group-hover:opacity-100 uppercase tracking-wider">
                                  {empsInSlot.length > 0 ? '+ Thêm' : '+ Thêm nhân viên'}
                                </span>
                             </div>
                           )}
                           
                           {!isManagerOrAdmin && empsInSlot.length === 0 && (
                             <div className="w-full min-h-[40px] flex items-center justify-center">
                               <span className="text-[10px] font-medium text-text-sub uppercase">Trống</span>
                             </div>
                           )}
                         </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isManagerOrAdmin && (
        <div className="p-4 border-t border-border-main bg-white sticky bottom-0 text-right shrink-0">
           <button className="px-8 py-2.5 bg-white border border-border-main rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors">
              Xong
           </button>
        </div>
      )}

      {/* Right Drawer / Modal for Editing a Slot */}
      <AnimatePresence>
        {editingSlot && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setEditingSlot(null)}
            />
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-white h-full shadow-2xl relative z-10 flex flex-col border-l border-border-main"
            >
              <div className="p-6 border-b border-border-main flex items-center justify-between bg-slate-50/80">
                <div>
                  <h2 className="text-sm font-black text-primary uppercase tracking-wider">{editingSlot.shift.name}</h2>
                  <p className="text-xs font-medium text-text-sub mt-1">
                    {editingSlot.day.label}, {editingSlot.dateObj.toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <button onClick={() => setEditingSlot(null)} className="p-2 bg-white rounded-lg border border-border-main text-text-sub hover:text-danger hover:border-danger transition-colors shadow-sm">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 border-b border-border-main">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm nhân viên..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-slate-100 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-accent outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase())).map(emp => {
                  const isSelected = selectedEmpIds.includes(emp.id);
                   
                  return (
                    <button
                      key={emp.id}
                      onClick={() => toggleEmpSelection(emp.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left group",
                        isSelected ? "border-accent bg-blue-50/50" : "border-slate-100 hover:border-border-main"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors border",
                        isSelected ? "bg-accent border-accent text-white" : "bg-white border-slate-300"
                      )}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-bold truncate transition-colors", isSelected ? "text-accent" : "text-primary")}>
                          {emp.name}
                        </p>
                        <p className="text-[11px] text-text-sub font-mono truncate">{emp.email}</p>
                      </div>
                    </button>
                  );
                })}
                
                {employees.length > 0 && employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                   <p className="text-center text-sm text-text-sub italic py-10">Không tìm thấy nhân viên.</p>
                )}
              </div>

              <div className="p-5 border-t border-border-main bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                <button
                  onClick={handleSaveSlot}
                  disabled={saving}
                  className="w-full py-4 bg-primary text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-lg disabled:opacity-50"
                 >
                   {saving ? 'Đang lưu...' : 'Lưu danh sách'}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
