import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  Calendar, 
  TrendingUp, 
  ChevronRight,
  UserCheck,
  UserX,
  Plus,
  FileSpreadsheet,
  X as CloseIcon
} from 'lucide-react';
import { employeeService, attendanceService, shiftService } from '../lib/services';
import { formatCurrency } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Attendance, Employee, Shift } from '../types';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    lateToday: 0,
    monthlyRevenue: 0,
  });
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportRange, setReportRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const empId = localStorage.getItem('loggedInEmpId');
      if (empId) {
        if (empId === 'ADMIN_GOOGLE') {
           setCurrentUser({ name: 'Quản trị viên', role: 'admin' } as Employee);
        } else {
           const emp = await employeeService.getById(empId);
           if (emp) setCurrentUser(emp);
        }
      }

      const [empList, shiftList] = await Promise.all([
        employeeService.getAll(),
        shiftService.getAll()
      ]);
      setEmployees(empList);
      setShifts(shiftList);

      const today = new Date().toISOString().split('T')[0];
      const attendance = await attendanceService.getByDate(today);
      
      setStats({
        totalEmployees: empList.length,
        presentToday: attendance.filter(a => a.status === 'present').length,
        lateToday: attendance.filter(a => a.status === 'late').length,
        monthlyRevenue: 1250000000, // Mock value for visual
      });
    };
    fetchStats();
  }, []);

  const handleGenerateReport = async () => {
    const allAttendance = await attendanceService.getAll();
    const filtered = allAttendance.filter(a => a.date >= reportRange.start && a.date <= reportRange.end);
    
    const csvRows = [
      ['Ngày', 'Mã NV', 'Tên NV', 'Ca', 'Giờ vào', 'Giờ ra', 'Trạng thái'].join(',')
    ];

    filtered.forEach(a => {
      const emp = employees.find(e => e.id === a.employeeId);
      const shift = shifts.find(s => s.id === a.shiftId);
      const row = [
        a.date,
        a.employeeId,
        emp?.name || 'N/A',
        shift?.name || 'N/A',
        a.clockIn || '-',
        a.clockOut || '-',
        a.status
      ].join(',');
      csvRows.push(row);
    });

    const csvContent = "\uFEFF" + csvRows.join("\n"); // Include BOM for Vietnamese characters
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao_cao_cham_cong_${reportRange.start}_den_${reportRange.end}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowReportModal(false);
  };

  const isManagerOrAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  const cards = [
    { title: 'Tổng nhân sự', value: stats.totalEmployees, icon: Users, color: 'bg-primary' },
    { title: 'Có mặt hôm nay', value: stats.presentToday, icon: UserCheck, color: 'bg-success' },
    { title: 'Đi muộn', value: stats.lateToday, icon: UserX, color: 'bg-danger' },
    { title: 'Doanh thu tháng', value: formatCurrency(stats.monthlyRevenue), icon: TrendingUp, color: 'bg-accent' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-primary tracking-tight uppercase">Bảng điều khiển</h1>
          <p className="text-sm text-text-sub font-medium">Chào mừng bạn trở lại, {currentUser?.name || 'Nhân viên'}</p>
        </div>
        {isManagerOrAdmin && (
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <button 
              onClick={() => setShowReportModal(true)}
              className="flex-1 sm:flex-none justify-center px-4 py-3 sm:py-2 bg-white border border-border-main rounded-lg text-xs font-bold text-text-main shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2 uppercase tracking-wide"
            >
              <FileSpreadsheet className="w-4 h-4 text-success" />
              Tạo báo cáo
            </button>
            <button className="flex-1 sm:flex-none justify-center px-4 py-3 sm:py-2 bg-primary text-white rounded-lg text-xs font-bold shadow-md hover:bg-slate-800 transition-all flex items-center gap-2 uppercase tracking-wide">
              <Plus className="w-4 h-4" /> Tuyển dụng
            </button>
          </div>
        )}
      </div>

      {/* Modals... */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="bg-white rounded-3xl shadow-2xl border border-border-main w-full max-w-md overflow-hidden"
             >
                <div className="p-6 border-b border-border-main flex justify-between items-center bg-slate-50">
                   <h3 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-success" />
                      Xuất báo cáo chấm công
                   </h3>
                   <button onClick={() => setShowReportModal(false)} className="text-text-sub hover:text-danger transition-colors">
                      <CloseIcon className="w-5 h-5" />
                   </button>
                </div>
                <div className="p-8 space-y-6">
                   <div className="space-y-4">
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-text-sub uppercase tracking-wider ml-1">Từ ngày</label>
                         <input 
                           type="date"
                           value={reportRange.start}
                           onChange={e => setReportRange(prev => ({ ...prev, start: e.target.value }))}
                           className="w-full border border-border-main rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-accent/5 focus:border-accent font-bold text-sm bg-slate-50"
                         />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-text-sub uppercase tracking-wider ml-1">Đến ngày</label>
                         <input 
                           type="date"
                           value={reportRange.end}
                           onChange={e => setReportRange(prev => ({ ...prev, end: e.target.value }))}
                           className="w-full border border-border-main rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-accent/5 focus:border-accent font-bold text-sm bg-slate-50"
                         />
                      </div>
                   </div>
                   <button 
                     onClick={handleGenerateReport}
                     className="w-full bg-primary text-white font-black py-4 rounded-2xl hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest mt-4"
                   >
                      Tạo & Tải xuống CSV
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {isManagerOrAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-2xl border border-border-main shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${card.color} text-white shadow-lg shadow-${card.color.split('-')[1]}/20`}>
                  <card.icon size={24} />
                </div>
                <span className="text-xs font-bold text-success bg-success/10 px-2 py-1 rounded-full">+12%</span>
              </div>
              <div>
                <p className="text-[11px] font-bold text-text-sub uppercase tracking-wider mb-1">{card.title}</p>
                <h3 className="text-2xl font-black text-primary">{card.value}</h3>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {isManagerOrAdmin && (
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-border-main shadow-sm">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-primary uppercase tracking-tight flex items-center gap-2">
                   <Clock className="w-4 h-4 text-accent" />
                   Hoạt động chấm công gần đây
                </h3>
                <button className="text-xs font-bold text-accent hover:underline flex items-center gap-1">
                  Tất cả <ChevronRight className="w-3 h-3" />
                </button>
             </div>
             <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-border-main last:border-0 hover:bg-slate-50 px-2 rounded-lg transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-primary border border-white shadow-sm ring-1 ring-slate-100">
                         MH
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary">Nguyễn Văn A</p>
                        <p className="text-[10px] font-medium text-text-sub uppercase tracking-wide">Phòng Kỹ thuật • 08:0{i} AM</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${i % 3 === 0 ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-emerald-600'}`}>
                      {i % 3 === 0 ? 'Đi muộn' : 'Đúng giờ'}
                    </span>
                  </div>
                ))}
             </div>
          </div>
        )}

        <div className={`bg-white p-6 rounded-2xl border border-border-main shadow-sm ${!isManagerOrAdmin ? 'lg:col-span-3' : ''}`}>
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black text-primary uppercase tracking-tight flex items-center gap-2">
                 <Calendar className="w-4 h-4 text-accent" />
                 Sắp tới
              </h3>
           </div>
           <div className="space-y-6">
              <div className="relative pl-6 border-l-2 border-accent/20 space-y-4">
                <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-accent ring-4 ring-accent/10"></div>
                <div>
                   <p className="text-[10px] font-bold text-accent uppercase tracking-widest">Hôm nay</p>
                   <p className="text-sm font-bold text-primary mt-1">Review lương quý 2</p>
                   <p className="text-xs text-text-sub mt-1">14:00 - Phòng họp lớn</p>
                </div>
              </div>
              <div className="relative pl-6 border-l-2 border-slate-100 space-y-4">
                <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-slate-300"></div>
                <div>
                   <p className="text-[10px] font-bold text-text-sub uppercase tracking-widest text-opacity-70">22 Tháng 4</p>
                   <p className="text-sm font-bold text-primary mt-1">Sinh nhật Lê Thị B</p>
                   <p className="text-xs text-text-sub mt-1">Phòng kinh doanh</p>
                </div>
              </div>
              <div className="relative pl-6 border-l-2 border-slate-100 space-y-4">
                <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-slate-300"></div>
                <div>
                   <p className="text-[10px] font-bold text-text-sub uppercase tracking-widest text-opacity-70">30 Tháng 4</p>
                   <p className="text-sm font-bold text-primary mt-1">Lễ Giải Phóng</p>
                   <p className="text-xs text-text-sub mt-1">Nghỉ lễ toàn công ty</p>
                </div>
              </div>
           </div>
           
           <div className="mt-8 p-4 bg-primary rounded-xl text-white">
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">Thông báo</p>
              <p className="text-xs leading-relaxed italic">"Tất cả nhân viên cần hoàn thành bản tự đánh giá KPI trước ngày 25 hàng tháng."</p>
           </div>
        </div>
      </div>
    </div>
  );
}
