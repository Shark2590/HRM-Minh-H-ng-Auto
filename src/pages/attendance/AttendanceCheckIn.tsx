import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, AlertCircle, User, Globe } from 'lucide-react';
import { employeeService, shiftService, attendanceService } from '../../lib/services';
import { Employee, Shift, Attendance, AttendanceStatus } from '../../types';
import { cn, formatCurrency } from '../../lib/utils';
import { motion } from 'framer-motion';

export default function AttendanceCheckIn() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedShift, setSelectedShift] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lateMessage, setLateMessage] = useState('');
  
  // Location States
  const [checkingLoc, setCheckingLoc] = useState(true);
  const [locError, setLocError] = useState('');
  const [isLocValid, setIsLocValid] = useState(false);
  const [companyLoc, setCompanyLoc] = useState<{lat: number, lng: number, radius: number} | null>(null);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const p1 = lat1 * Math.PI/180;
    const p2 = lat2 * Math.PI/180;
    const dp = (lat2-lat1) * Math.PI/180;
    const dl = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(dp/2) * Math.sin(dp/2) +
              Math.cos(p1) * Math.cos(p2) *
              Math.sin(dl/2) * Math.sin(dl/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const checkLocation = (targetLoc: {lat: number, lng: number, radius: number}) => {
     if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition((pos) => {
           const dist = getDistance(pos.coords.latitude, pos.coords.longitude, targetLoc.lat, targetLoc.lng);
           if (dist <= (targetLoc.radius || 200)) {
              setIsLocValid(true);
           } else {
              setIsLocValid(false);
              setLocError('Bạn đang ở ngoài phạm vi chấm công');
           }
           setCheckingLoc(false);
        }, (err) => {
           setLocError('Không thể lấy vị trí. Vui lòng cho phép trình duyệt truy cập định vị.');
           setCheckingLoc(false);
        }, { enableHighAccuracy: true });
     } else {
        setLocError('Trình duyệt không hỗ trợ Geolocation.');
        setCheckingLoc(false);
     }
  };

  useEffect(() => {
    const fetchData = async () => {
      const empId = localStorage.getItem('loggedInEmpId');
      const [empList, shiftList] = await Promise.all([
        employeeService.getAll(),
        shiftService.getAll()
      ]);
      const actives = empList.filter(e => e.status === 'active');
      setEmployees(actives);
      setShifts(shiftList);

      if (empId && empId !== 'ADMIN_GOOGLE' && empId !== '0706919999') {
         setSelectedEmployee(empId);
      }
      
      // Load settings
      import('../../lib/services').then(mod => {
        mod.companySettingsService.getById('general').then((set) => {
          if (set && set.lateCheckInMessage) {
            setLateMessage(set.lateCheckInMessage);
          }
          if (set && set.allowedLocation && set.allowedLocation.lat && set.allowedLocation.lng) {
             setCompanyLoc(set.allowedLocation);
             checkLocation(set.allowedLocation);
          } else {
             // Location feature is ignored
             setCheckingLoc(false);
             setIsLocValid(true);
          }
        });
      });
    };
    fetchData();

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentEmp = employees.find(e => e.id === selectedEmployee);

  const availableShifts = shifts.filter(shift => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sunday

    if (selectedEmployee && currentEmp) {
       const assignedShift = currentEmp.assignedShifts?.find(s => s.shiftId === shift.id);
       if (!assignedShift || !assignedShift.daysOfWeek.includes(currentDay)) {
          return false;
       }
    } else if (selectedEmployee) {
       return false;
    }
    const [hours, minutes] = shift.startTime.split(':').map(Number);
    const shiftStartTime = new Date();
    shiftStartTime.setHours(hours, minutes, 0, 0);
    
    const bufferMs = (shift.bufferMinutes || 0) * 60 * 1000;
    const startTimeWithBuffer = shiftStartTime.getTime() - bufferMs;
    
    const [endHours, endMinutes] = shift.endTime.split(':').map(Number);
    const shiftEndTime = new Date();
    shiftEndTime.setHours(endHours, endMinutes, 0, 0);
    if (shiftEndTime < shiftStartTime) shiftEndTime.setDate(shiftEndTime.getDate() + 1);

    return now.getTime() >= startTimeWithBuffer && now.getTime() <= shiftEndTime.getTime();
  });

  const handleCheckIn = async () => {
    if (!selectedEmployee || !selectedShift) return;
    
    const today = new Date().toISOString().split('T')[0];
    const time = currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    
    const shift = shifts.find(s => s.id === selectedShift);
    let status: AttendanceStatus = 'present';
    
    if (shift) {
      // Convert to minutes for easier comparison
      const [nowH, nowM] = time.split(':').map(Number);
      const [startH, startM] = shift.startTime.split(':').map(Number);
      const nowTotal = nowH * 60 + nowM;
      const startTotal = startH * 60 + startM;
      
      if (nowTotal > startTotal + 5) {
        status = 'late';
      }
    }

    const attendance: Attendance = {
      id: `${today}_${selectedEmployee}_${selectedShift}`,
      employeeId: selectedEmployee,
      date: today,
      shiftId: selectedShift,
      clockIn: time,
      status,
      isOvertime: false
    };

    try {
      await attendanceService.create(attendance, attendance.id);
      if (status === 'late') {
        alert('Chấm công vào thành công!\n\n❌ BẠN ĐÃ ĐI MUỘN:\n' + (lateMessage || 'Vui lòng liên hệ quản lý để giải trình.'));
      } else {
        alert('Chấm công vào thành công!');
      }
    } catch (e) {
      alert('Đã xảy ra lỗi hoặc bạn đã chấm công cho ca này rồi.');
    }
  };

  const handleCheckOut = async () => {
    if (!selectedEmployee || !selectedShift) return;
    const today = new Date().toISOString().split('T')[0];
    const id = `${today}_${selectedEmployee}_${selectedShift}`;
    const time = currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    try {
      await attendanceService.update(id, { clockOut: time });
      alert('Chấm công ra thành công!');
    } catch (e) {
      alert('Không tìm thấy bản ghi chấm công vào cho ca này.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      <div className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-border-main text-center space-y-8 md:space-y-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-accent to-primary"></div>
        
        <div className="space-y-2">
          <h2 className="text-4xl md:text-6xl font-black text-primary tracking-tighter tabular-nums drop-shadow-sm">
            {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </h2>
          <p className="text-text-sub font-black uppercase tracking-[0.2em] text-[9px] md:text-[10px]">
            {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {checkingLoc ? (
           <div className="py-10 text-center animate-pulse">
              <Globe className="w-12 h-12 text-accent mx-auto mb-4 opacity-50" />
              <p className="text-sm font-bold text-primary uppercase tracking-tight">Đang định vị vị trí của bạn...</p>
           </div>
        ) : !isLocValid ? (
           <div className="py-10 text-center space-y-4">
              <AlertCircle className="w-16 h-16 text-danger mx-auto" />
              <h3 className="text-xl font-black text-danger uppercase tracking-tight">{locError}</h3>
              <p className="text-xs text-text-sub max-w-sm mx-auto font-medium leading-relaxed">
                Hệ thống nhận diện bạn đang không nằm trong bán kính {(companyLoc?.radius || 200)}m so với công ty. Vui lòng di chuyển lại gần hơn hoặc tải lại trang nếu bị sai lệch GPS.
              </p>
           </div>
        ) : (
          <>
            <div className="space-y-8 text-left max-w-md mx-auto">
               {(!localStorage.getItem('loggedInEmpId') || localStorage.getItem('loggedInEmpId') === 'ADMIN_GOOGLE' || localStorage.getItem('loggedInEmpId') === '0706919999') && (
                 <div className="space-y-2">
                    <label className="block text-[10px] font-black text-primary uppercase tracking-widest mb-1 ml-1 opacity-70">Nhân viên thực hiện</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub group-focus-within:text-accent transition-colors" />
                      <select 
                        value={selectedEmployee}
                        onChange={e => setSelectedEmployee(e.target.value)}
                        className="w-full bg-slate-50 border border-border-main rounded-xl pl-11 pr-4 py-4 outline-none transition-all focus:bg-white focus:ring-4 focus:ring-accent/5 focus:border-accent font-bold text-sm appearance-none shadow-sm"
                      >
                        <option value="">-- Click để chọn danh tính --</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.id} - {e.name}</option>)}
                      </select>
                    </div>
                 </div>
               )}

               {(!localStorage.getItem('loggedInEmpId') || localStorage.getItem('loggedInEmpId') === 'ADMIN_GOOGLE' || localStorage.getItem('loggedInEmpId') === '0706919999') && currentEmp && (
                 <motion.div 
                   initial={{ opacity: 0, height: 0 }}
                   animate={{ opacity: 1, height: 'auto' }}
                   className="bg-slate-50 p-4 rounded-xl border border-dashed border-border-main flex items-center gap-4"
                 >
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-black text-lg">
                      {currentEmp.name.charAt(0)}
                    </div>
                    <div>
                       <p className="text-sm font-black text-primary uppercase">{currentEmp.name}</p>
                       <p className="text-[10px] font-bold text-text-sub uppercase tracking-tight">Mã NV: {currentEmp.id}</p>
                    </div>
                 </motion.div>
               )}

               <div className="space-y-3">
                  <label className="block text-[10px] font-black text-primary uppercase tracking-widest mb-1 ml-1 opacity-70">Lựa chọn ca trực</label>
                  <div className="grid grid-cols-2 gap-4">
                     {availableShifts.length > 0 ? (
                       availableShifts.map(s => (
                         <button
                          key={s.id}
                          onClick={() => setSelectedShift(s.id)}
                          className={cn(
                            "p-5 rounded-2xl border-2 transition-all flex flex-col gap-1 items-center text-center shadow-sm relative overflow-hidden group",
                            selectedShift === s.id ? "border-accent bg-blue-50/50 ring-4 ring-accent/5" : "border-slate-100 hover:border-accent/30 hover:bg-slate-50"
                          )}
                         >
                           {selectedShift === s.id && <div className="absolute top-0 right-0 p-1 bg-accent text-white rounded-bl-lg"><CheckCircle2 className="w-3 h-3" /></div>}
                           <span className={cn("text-xs font-black uppercase tracking-tight transition-colors", selectedShift === s.id ? "text-accent" : "text-primary")}>{s.name}</span>
                           <span className="text-[10px] font-black text-text-sub uppercase tabular-nums">{s.startTime} - {s.endTime}</span>
                         </button>
                       ))
                     ) : (
                       <div className="col-span-2 p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-border-main">
                          <Clock className="w-8 h-8 text-text-sub mx-auto mb-2 opacity-50" />
                          {selectedEmployee && (!currentEmp?.assignedShifts || currentEmp.assignedShifts.length === 0) ? (
                             <p className="text-[11px] font-bold text-text-sub uppercase text-danger">Bạn chưa có ca làm việc, vui lòng liên hệ Admin.</p>
                          ) : selectedEmployee ? (
                             <p className="text-[11px] font-bold text-text-sub uppercase text-danger">Bạn không có ca làm việc vào ngày hôm nay.</p>
                          ) : (
                             <p className="text-[11px] font-bold text-text-sub uppercase">Hiện không có ca làm việc nào đang diễn ra</p>
                          )}
                       </div>
                     )}
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4 max-w-md mx-auto">
               <button 
                 onClick={handleCheckIn}
                 className="bg-primary text-white font-black py-4 rounded-2xl hover:bg-slate-800 transition-all shadow-lg active:scale-95 flex flex-col items-center justify-center gap-1 text-[11px] uppercase tracking-widest"
               >
                 <CheckCircle2 className="w-6 h-6 mb-1" />
                 Chấm công vào
               </button>
               <button 
                 onClick={handleCheckOut}
                 className="bg-white border-2 border-primary text-primary font-black py-4 rounded-2xl hover:bg-slate-50 transition-all active:scale-95 flex flex-col items-center justify-center gap-1 text-[11px] uppercase tracking-widest"
               >
                 <Clock className="w-6 h-6 mb-1" />
                 Chấm công ra
               </button>
            </div>
          </>
        )}

        <div className="bg-slate-50 border border-border-main p-4 rounded-2xl flex gap-4 max-w-sm mx-auto items-center">
           <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
              <AlertCircle className="text-accent w-4 h-4" />
           </div>
           <p className="text-[10px] text-text-sub font-bold leading-tight text-left">
             <span className="text-primary font-black">QUY ĐỊNH:</span> Đi muộn {'>'} 5 phút ghi nhận là "Muộn". Vui lòng trung thực trong chấm công.
           </p>
        </div>
      </div>
    </div>
  );
}
