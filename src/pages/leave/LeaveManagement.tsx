import React, { useState, useEffect } from 'react';
import { Calendar, UserCheck, UserX, Clock, Plus, Inbox, X } from 'lucide-react';
import { 
  employeeService, 
  leaveService, 
  shiftService 
} from '../../lib/services';
import { Employee, LeaveRequest, Shift, LeaveStatus } from '../../types';
import { cn } from '../../lib/utils';

export default function LeaveManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>('employee');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [newRequest, setNewRequest] = useState<Partial<LeaveRequest>>({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    shiftIds: [],
    status: 'pending',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const empId = localStorage.getItem('loggedInEmpId');
    let uRole = 'employee';
    let uId = '';
    if (empId === 'ADMIN_GOOGLE' || empId === '0706919999') {
       uRole = 'admin';
       uId = empId;
    } else if (empId) {
       uId = empId;
       const dbUser = await employeeService.getById(empId);
       if (dbUser) uRole = dbUser.role;
    }
    setCurrentUserId(uId);
    setCurrentUserRole(uRole);

    const [empList, shiftList, reqList] = await Promise.all([
      employeeService.getAll(),
      shiftService.getAll(),
      leaveService.getAll()
    ]);
    
    setEmployees(empList);
    setShifts(shiftList);

    const sortedReqs = reqList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    if (uRole !== 'admin' && uRole !== 'manager' && uId) {
       setRequests(sortedReqs.filter(r => r.employeeId === uId));
    } else {
       setRequests(sortedReqs);
    }
  };

  const handleCreate = async () => {
    if (!newRequest.employeeId || !newRequest.shiftIds?.length) return;
    await leaveService.create({
      ...newRequest,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      status: 'pending'
    } as LeaveRequest);
    setShowAdd(false);
    setNewRequest({ employeeId: '', date: new Date().toISOString().split('T')[0], shiftIds: [], status: 'pending', notes: '' });
    fetchData();
  };

  const handleUpdateStatus = async (id: string, status: LeaveStatus) => {
    await leaveService.update(id, { status });
    fetchData();
  };

  const isManagerOrAdmin = currentUserRole === 'admin' || currentUserRole === 'manager';

  const statusMap = {
    pending: { label: 'Chờ duyệt', color: 'bg-amber-50 text-warning border-warning/20', icon: Clock },
    approved: { label: 'Đã đồng ý', color: 'bg-emerald-50 text-success border-success/20', icon: UserCheck },
    rejected: { label: 'Đã từ chối', color: 'bg-rose-50 text-danger border-danger/20', icon: UserX },
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-border-main">
         <div className="flex items-center gap-4">
            <div className="p-2.5 bg-primary rounded-lg">
               <Calendar className="text-white w-5 h-5" />
            </div>
            <div>
               <h2 className="text-base font-bold text-primary uppercase">Quản lý nghỉ phép</h2>
               <p className="text-[11px] font-bold text-text-sub uppercase border-none">
                  {isManagerOrAdmin ? 'Xét duyệt yêu cầu nghỉ phép nhân viên' : 'Theo dõi yêu cầu nghỉ phép của bạn'}
               </p>
            </div>
         </div>
         <button 
           onClick={() => {
             setNewRequest({ 
               employeeId: (!isManagerOrAdmin && currentUserId !== 'ADMIN_GOOGLE') ? currentUserId : '', 
               date: new Date().toISOString().split('T')[0], 
               shiftIds: [], 
               status: 'pending', 
               notes: '' 
             });
             setShowAdd(true);
           }}
           className="bg-accent text-white font-bold px-6 py-2.5 rounded-md hover:bg-blue-600 transition-all flex items-center gap-2 text-xs uppercase tracking-tight shadow-sm"
         >
           <Plus className="w-4 h-4" /> Đăng ký nghỉ
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requests.map(req => {
          const emp = employees.find(e => e.id === req.employeeId);
          const Stat = statusMap[req.status];
          return (
            <div key={req.id} className="bg-white rounded-xl border border-border-main shadow-sm hover:shadow-md transition-all group overflow-hidden">
               <div className="p-6 space-y-6">
                  <div className="flex justify-between items-start">
                     <div className="space-y-1">
                        <h4 className="text-sm font-black text-primary truncate leading-tight uppercase tracking-tight">{emp?.name || '---'}</h4>
                        <p className="text-[10px] font-bold text-text-sub uppercase tracking-widest">{new Date(req.date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
                     </div>
                     <span className={cn("px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm", Stat.color)}>
                        <Stat.icon className="w-3 h-3" />
                        {Stat.label}
                     </span>
                  </div>

                  <div className="space-y-4">
                     <div className="flex flex-wrap gap-1.5">
                        {req.shiftIds.map(sid => (
                          <span key={sid} className="px-2 py-0.5 bg-slate-50 border border-border-main rounded text-[9px] font-bold text-text-sub uppercase">
                             {shifts.find(s => s.id === sid)?.name || sid}
                          </span>
                        ))}
                     </div>
                     <div className="bg-slate-50 p-3 rounded-lg border border-border-main/50">
                        <p className="text-xs text-text-main line-clamp-3 italic">
                          "{req.notes || "Không có ghi chú"}"
                        </p>
                     </div>
                  </div>

                  {req.status === 'pending' && isManagerOrAdmin && (
                    <div className="pt-4 border-t border-dashed border-border-main grid grid-cols-2 gap-2">
                       <button 
                         onClick={() => handleUpdateStatus(req.id, 'rejected')}
                         className="py-2 px-3 border border-border-main text-text-sub font-bold rounded text-[10px] uppercase hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all flex items-center justify-center gap-1.5"
                       >
                          <UserX className="w-3.5 h-3.5" /> Từ chối
                       </button>
                       <button 
                         onClick={() => handleUpdateStatus(req.id, 'approved')}
                         className="py-2 px-3 bg-primary text-white font-bold rounded text-[10px] uppercase hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5"
                       >
                          <UserCheck className="w-3.5 h-3.5" /> Đồng ý
                       </button>
                    </div>
                  )}
               </div>
            </div>
          );
        })}
        {requests.length === 0 && (
          <div className="col-span-full py-16 bg-white rounded-xl border border-dashed border-border-main flex flex-col items-center justify-center text-text-sub gap-3">
             <Inbox className="w-12 h-12 opacity-20" />
             <p className="font-bold uppercase tracking-widest text-[10px]">Chưa có yêu cầu nghỉ phép nào</p>
          </div>
        )}
      </div>

      {/* Modal Add */}
      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-lg rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-300 border border-border-main">
              <div className="p-8 space-y-6">
                 <div className="flex justify-between items-center border-b border-dashed border-border-main pb-4">
                    <h3 className="text-sm font-bold text-primary uppercase">Đăng ký nghỉ phép</h3>
                    <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-text-sub"><X className="w-5 h-5" /></button>
                 </div>

                 <div className="space-y-4">
                    {isManagerOrAdmin ? (
                      <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-text-sub uppercase ml-1">Nhân viên đăng ký</label>
                          <select 
                            value={newRequest.employeeId}
                            onChange={e => setNewRequest({ ...newRequest, employeeId: e.target.value })}
                            className="w-full bg-slate-50 border border-border-main rounded-md px-4 py-2.5 focus:bg-white focus:ring-1 focus:ring-accent outline-none transition-all text-sm font-medium"
                          >
                            <option value="">-- Chọn nhân viên --</option>
                            {employees.map(e => <option key={e.id} value={e.id}>{e.id} - {e.name}</option>)}
                          </select>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-text-sub uppercase ml-1">Nhân viên đăng ký</label>
                          <input 
                            disabled
                            value={employees.find(e => e.id === currentUserId)?.name || currentUserId}
                            className="w-full bg-slate-100 border text-text-sub border-border-main rounded-md px-4 py-2.5 outline-none text-sm font-bold cursor-not-allowed"
                          />
                      </div>
                    )}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-text-sub uppercase ml-1">Ngày nghỉ</label>
                        <input 
                          type="date"
                          value={newRequest.date}
                          onChange={e => setNewRequest({ ...newRequest, date: e.target.value })}
                          className="w-full bg-slate-50 border border-border-main rounded-md px-4 py-2.5 focus:bg-white focus:ring-1 focus:ring-accent outline-none transition-all text-sm font-medium"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-text-sub uppercase ml-1">Chọn ca nghỉ</label>
                        <div className="flex flex-wrap gap-2">
                           {shifts.map(s => (
                             <button
                               key={s.id}
                               onClick={() => {
                                 const current = newRequest.shiftIds || [];
                                 setNewRequest({ 
                                   ...newRequest, 
                                   shiftIds: current.includes(s.id) ? current.filter(id => id !== s.id) : [...current, s.id] 
                                 });
                               }}
                               className={cn(
                                 "px-4 py-1.5 rounded-md text-[10px] font-bold transition-all border-2",
                                 newRequest.shiftIds?.includes(s.id) ? "bg-accent border-accent text-white" : "bg-white border-border-main text-text-sub hover:border-accent/40"
                               )}
                             >
                                {s.name}
                             </button>
                           ))}
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-text-sub uppercase ml-1">Lý do/Ghi chú</label>
                        <textarea 
                          placeholder="Nhập lý do nghỉ của bạn..."
                          value={newRequest.notes}
                          onChange={e => setNewRequest({ ...newRequest, notes: e.target.value })}
                          className="w-full bg-slate-50 border border-border-main rounded-md px-4 py-2 focus:bg-white focus:ring-1 focus:ring-accent outline-none transition-all text-sm font-medium h-24 resize-none"
                        />
                    </div>
                 </div>

                 <button 
                   onClick={handleCreate}
                   className="w-full py-4 bg-primary text-white font-bold rounded-md hover:bg-slate-800 transition-all text-xs uppercase tracking-widest shadow-sm"
                 >
                    Gửi yêu cầu xét duyệt
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
