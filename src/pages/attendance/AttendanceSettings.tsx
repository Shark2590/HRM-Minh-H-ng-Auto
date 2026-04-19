import React, { useState, useEffect } from 'react';
import { Plus, Clock, Trash2, LayoutDashboard, Users, Calendar, Download, ChevronLeft, ChevronRight, X, AlertTriangle } from 'lucide-react';
import { 
  employeeService, 
  attendanceService, 
  shiftService 
} from '../../lib/services';
import { Employee, Shift, Attendance, AttendanceStatus } from '../../types';
import { cn } from '../../lib/utils';

export default function AttendanceSettings() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [newShift, setNewShift] = useState({ name: '', startTime: '08:00', endTime: '17:00', bufferMinutes: 30 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    const data = await shiftService.getAll();
    setShifts(data);
  };

  const handleAddOrUpdate = async () => {
    if (!newShift.name) return;
    
    if (editingId) {
      await shiftService.update(editingId, { ...newShift } as Shift);
      setEditingId(null);
    } else {
      await shiftService.create({ ...newShift } as Shift);
    }
    
    setNewShift({ name: '', startTime: '08:00', endTime: '17:00', bufferMinutes: 30 });
    fetchShifts();
  };

  const handleEdit = (shift: Shift) => {
    setNewShift({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      bufferMinutes: shift.bufferMinutes || 30
    });
    setEditingId(shift.id);
  };

  const handleDelete = async () => {
    if (deleteConfirmId) {
      await shiftService.delete(deleteConfirmId);
      setDeleteConfirmId(null);
      fetchShifts();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl border border-border-main shadow-sm flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b border-dashed border-border-main pb-4">
           <div className="p-2 bg-primary rounded-lg">
              <Clock className="text-white w-5 h-5" />
           </div>
           <h3 className="text-sm font-bold text-primary uppercase">Thiết lập ca làm việc</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-text-sub uppercase ml-1">Tên ca làm việc</label>
            <input 
              placeholder="VD: Ca sáng"
              value={newShift.name}
              onChange={e => setNewShift({ ...newShift, name: e.target.value })}
              className="w-full bg-slate-50 border border-border-main rounded-md px-4 py-2 focus:bg-white focus:ring-1 focus:ring-accent outline-none transition-all text-sm font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-text-sub uppercase ml-1">Giờ vào ca</label>
            <input 
              type="time"
              value={newShift.startTime}
              onChange={e => setNewShift({ ...newShift, startTime: e.target.value })}
              className="w-full bg-slate-50 border border-border-main rounded-md px-4 py-2 focus:bg-white focus:ring-1 focus:ring-accent outline-none transition-all text-sm font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-text-sub uppercase ml-1">Giờ tan ca</label>
            <input 
              type="time"
              value={newShift.endTime}
              onChange={e => setNewShift({ ...newShift, endTime: e.target.value })}
              className="w-full bg-slate-50 border border-border-main rounded-md px-4 py-2 focus:bg-white focus:ring-1 focus:ring-accent outline-none transition-all text-sm font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-text-sub uppercase ml-1">Vào ca trước (phút)</label>
            <input 
              type="number"
              value={newShift.bufferMinutes}
              onChange={e => setNewShift({ ...newShift, bufferMinutes: Number(e.target.value) })}
              className="w-full bg-slate-50 border border-border-main rounded-md px-4 py-2 focus:bg-white focus:ring-1 focus:ring-accent outline-none transition-all text-sm font-medium"
            />
          </div>
        </div>
        <div className="flex gap-4">
          {editingId && (
            <button 
              onClick={() => {
                setEditingId(null);
                setNewShift({ name: '', startTime: '08:00', endTime: '17:00', bufferMinutes: 30 });
              }}
              className="flex-1 py-3 border-2 border-border-main text-text-sub font-bold rounded-md hover:bg-slate-50 transition-all text-xs uppercase tracking-widest"
            >
              Hủy sửa
            </button>
          )}
          <button 
            onClick={handleAddOrUpdate}
            className="flex-[2] py-3 bg-primary text-white font-bold rounded-md hover:bg-slate-800 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest shadow-sm"
          >
            <Plus className="w-4 h-4" /> {editingId ? 'Cập nhật ca làm việc' : 'Thêm ca làm việc mới'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shifts.map(shift => (
          <div key={shift.id} className="bg-white p-5 rounded-xl border border-border-main shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center gap-4 relative group cursor-pointer" onClick={() => handleEdit(shift)}>
             <button 
               onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(shift.id); }}
               className="absolute top-3 right-3 p-1.5 text-text-sub hover:text-danger transition-colors opacity-0 group-hover:opacity-100"
             >
                <Trash2 className="w-4 h-4" />
             </button>
             <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center border border-border-main transition-colors", editingId === shift.id ? "bg-primary" : "bg-slate-100 group-hover:bg-primary")}>
                <Clock className={cn("w-6 h-6 transition-colors", editingId === shift.id ? "text-white" : "text-text-sub group-hover:text-white")} />
             </div>
             <div>
                <h4 className="font-bold text-primary text-sm uppercase">{shift.name}</h4>
                <p className="text-[11px] font-bold text-text-sub mt-1"> {shift.startTime} - {shift.endTime}</p>
                <p className="text-[9px] font-bold text-accent mt-0.5 uppercase">Vào trước: {shift.bufferMinutes || 30}p</p>
             </div>
          </div>
        ))}
        {shifts.length === 0 && (
          <div className="col-span-full py-12 text-center text-text-sub font-medium italic">
            Chưa có ca làm việc nào.
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-danger" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary">Xác nhận xóa</h3>
                <p className="text-sm text-text-sub mt-1">
                  Bạn có chắc chắn muốn xóa ca làm việc này không? Hành động này không thể hoàn tác.
                </p>
              </div>
              <div className="flex gap-3 w-full mt-2">
                <button 
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-4 py-2.5 border border-border-main rounded-xl text-sm font-bold text-text-sub hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2.5 bg-danger text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-sm"
                >
                  Xóa ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
