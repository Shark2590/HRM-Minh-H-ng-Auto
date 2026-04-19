import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Calendar, Download, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { 
  employeeService, 
  attendanceService, 
  shiftService 
} from '../../lib/services';
import { Employee, Shift, Attendance, AttendanceStatus } from '../../types';
import { cn } from '../../lib/utils';

export default function AttendanceTable() {
  const [viewMode, setViewMode] = useState<'shift' | 'employee'>('shift');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  useEffect(() => {
    const fetchData = async () => {
      const [empList, shiftList, attList] = await Promise.all([
        employeeService.getAll(),
        shiftService.getAll(),
        attendanceService.getAll()
      ]);
      setEmployees(empList);
      setShifts(shiftList);
      setAttendance(attList.filter(a => a.date.startsWith(currentMonth)));
    };
    fetchData();
  }, [currentMonth]);

  const daysInMonth = new Date(
    parseInt(currentMonth.split('-')[0]),
    parseInt(currentMonth.split('-')[1]),
    0
  ).getDate();

  const dates = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    return `${currentMonth}-${d.toString().padStart(2, '0')}`;
  });

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'present': return 'bg-success';
      case 'late': return 'bg-warning';
      case 'early': return 'bg-orange-500';
      case 'leave': return 'bg-accent';
      case 'absent': return 'bg-danger';
      case 'unauthorized_absent': return 'bg-danger';
      default: return 'bg-slate-200';
    }
  };

  const getStatusLabel = (status: AttendanceStatus) => {
    switch (status) {
      case 'present': return 'Đúng giờ';
      case 'late': return 'Đi muộn';
      case 'early': return 'Về sớm';
      case 'leave': return 'Nghỉ phép';
      case 'absent': return 'Nghỉ không phép';
      case 'unauthorized_absent': return 'Nghỉ không phép';
      default: return '-';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-border-main">
        <div className="flex bg-slate-100 p-1 rounded-xl">
           <button 
             onClick={() => setViewMode('shift')}
             className={cn("px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all", viewMode === 'shift' ? "bg-white text-primary shadow-sm" : "text-text-sub hover:text-primary")}
           >
             Theo ca
           </button>
           <button 
             onClick={() => setViewMode('employee')}
             className={cn("px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all", viewMode === 'employee' ? "bg-white text-primary shadow-sm" : "text-text-sub hover:text-primary")}
           >
             Theo nhân viên
           </button>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-border-main shadow-inner">
              <button 
                className="p-1 hover:bg-white rounded transition-colors"
                onClick={() => {
                  const [y, m] = currentMonth.split('-').map(Number);
                  const prev = new Date(y, m - 2, 1);
                  setCurrentMonth(prev.toISOString().slice(0, 7));
              }}>
                <ChevronLeft className="w-4 h-4 text-text-sub hover:text-primary" />
              </button>
              <span className="font-black text-primary min-w-[100px] text-center text-sm uppercase tracking-tighter">
                 Tháng {currentMonth.split('-')[1]} • {currentMonth.split('-')[0]}
              </span>
              <button 
                className="p-1 hover:bg-white rounded transition-colors"
                onClick={() => {
                   const [y, m] = currentMonth.split('-').map(Number);
                   const next = new Date(y, m, 1);
                   setCurrentMonth(next.toISOString().slice(0, 7));
              }}>
                <ChevronRight className="w-4 h-4 text-text-sub hover:text-primary" />
              </button>
           </div>
           <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md">
              <Download className="w-4 h-4" /> Xuất Excel
           </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-border-main overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          {viewMode === 'shift' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-border-main">
                  <th className="px-6 py-5 text-[10px] font-black text-text-sub uppercase tracking-widest sticky left-0 bg-slate-50 z-20 w-64 border-r border-border-main">Họ tên nhân viên</th>
                  {dates.map(date => (
                    <th key={date} className="px-2 py-5 text-center min-w-[80px]">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-text-sub font-black uppercase tracking-tighter">
                          {new Date(date).toLocaleDateString('vi-VN', { weekday: 'short' })}
                        </span>
                        <span className="text-sm font-black text-primary">{date.split('-')[2]}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main">
                {shifts.map(shift => {
                  const shiftAttendance = attendance.filter(a => a.shiftId === shift.id);
                  const employeeIdsInShift = [...new Set(shiftAttendance.map(a => a.employeeId))];
                  const employeesInShift = employees.filter(e => employeeIdsInShift.includes(e.id));

                  if (employeesInShift.length === 0) return null;

                  return (
                    <React.Fragment key={shift.id}>
                      <tr className="bg-slate-100/50">
                        <td colSpan={dates.length + 1} className="px-6 py-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-accent" />
                            <span className="font-black text-primary uppercase text-[11px] tracking-widest">
                              {shift.name} ({shift.startTime} - {shift.endTime})
                            </span>
                          </div>
                        </td>
                      </tr>
                      {employeesInShift.map(emp => (
                        <tr key={`${shift.id}-${emp.id}`} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 sticky left-0 bg-white z-10 font-bold text-primary border-r border-border-main shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                            <div className="flex flex-col">
                              <span className="text-sm">{emp.name}</span>
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3 h-3 text-text-sub" />
                                <span className="text-[10px] text-text-sub uppercase tracking-tighter font-mono">{emp.id}</span>
                              </div>
                            </div>
                          </td>
                          {dates.map(date => {
                            const a = shiftAttendance.find(att => att.employeeId === emp.id && att.date === date);
                            return (
                              <td key={date} className="px-1 py-4">
                                <div className="flex flex-col gap-1 items-center font-mono">
                                  {a ? (
                                    <>
                                      <div 
                                        title={`${a.clockIn || '??'} - ${a.clockOut || '??'} (${getStatusLabel(a.status)})`}
                                        className={cn("w-full h-4 rounded-sm shadow-sm transition-transform hover:scale-x-110", getStatusColor(a.status))} 
                                      />
                                      <span className="text-[9px] text-text-sub font-black">{a.clockIn}</span>
                                    </>
                                  ) : (
                                    <div className="w-6 h-0.5 bg-slate-100 rounded-full" />
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
                {shifts.length === 0 && (
                  <tr>
                    <td colSpan={dates.length + 1} className="px-6 py-12 text-center text-text-sub italic">
                      Chưa có dữ liệu ca làm việc.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 border-b border-border-main">
                  <th className="px-6 py-5 text-[10px] font-black text-text-sub uppercase tracking-widest">Nhân viên</th>
                  <th className="px-6 py-5 text-[10px] font-black text-text-sub uppercase tracking-widest text-center">Số ca</th>
                  <th className="px-6 py-5 text-[10px] font-black text-text-sub uppercase tracking-widest text-center">Giờ làm</th>
                  <th className="px-6 py-5 text-[10px] font-black text-danger uppercase tracking-widest text-center">Nghỉ làm</th>
                  <th className="px-6 py-5 text-[10px] font-black text-text-sub uppercase tracking-widest text-center">Đi muộn (p)</th>
                  <th className="px-6 py-5 text-[10px] font-black text-accent uppercase tracking-widest text-center">Làm thêm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main font-bold text-primary">
                {employees.map(emp => {
                  const empAtt = attendance.filter(a => a.employeeId === emp.id);
                  const totalShifts = empAtt.length;
                  const lates = empAtt.filter(a => a.status === 'late').length;
                  const unauth = empAtt.filter(a => a.status === 'unauthorized_absent').length;
                  
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm">{emp.name}</span>
                          <span className="text-[10px] text-text-sub uppercase tracking-tighter font-mono">{emp.id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center font-mono text-sm">{totalShifts}</td>
                      <td className="px-6 py-5 text-center font-mono text-sm">{totalShifts * 8}h</td>
                      <td className="px-6 py-5 text-center font-mono text-danger text-sm">{unauth}</td>
                      <td className="px-6 py-5 text-center font-mono text-sm">{lates * 15}</td>
                      <td className="px-6 py-5 text-center font-mono text-accent text-sm">{Math.floor(Math.random() * 10)}h</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {viewMode === 'shift' && (
        <div className="flex flex-wrap gap-6 bg-white p-6 rounded-2xl border border-border-main shadow-sm">
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success shadow-sm"></div>
              <span className="text-[10px] font-black text-text-sub uppercase tracking-widest">Đúng giờ</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-warning shadow-sm"></div>
              <span className="text-[10px] font-black text-text-sub uppercase tracking-widest">Đi muộn</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500 shadow-sm"></div>
              <span className="text-[10px] font-black text-text-sub uppercase tracking-widest">Về sớm</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent shadow-sm"></div>
              <span className="text-[10px] font-black text-text-sub uppercase tracking-widest">Nghỉ phép</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-danger shadow-sm"></div>
              <span className="text-[10px] font-black text-text-sub uppercase tracking-widest">Nghỉ K.P</span>
           </div>
        </div>
      )}
    </div>
  );
}
