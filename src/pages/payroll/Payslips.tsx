import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  ChevronRight, 
  Download, 
  Printer, 
  ArrowLeft,
  Building2,
  Calendar,
  Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  employeeService, 
  attendanceService, 
  departmentService, 
  jobTitleService,
  departmentSettingsService,
  shiftService
} from '../../lib/services';
import { 
  Employee, 
  Department, 
  JobTitle, 
  Attendance, 
  DepartmentSettings,
  Shift
} from '../../types';
import { formatCurrency, cn } from '../../lib/utils';

export default function Payslips() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [deptSettings, setDeptSettings] = useState<DepartmentSettings[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);

  const [currentUserRole, setCurrentUserRole] = useState<string>('employee');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
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

      const [emps, depts, jobs, atts, settings, sfts] = await Promise.all([
        employeeService.getAll(),
        departmentService.getAll(),
        jobTitleService.getAll(),
        attendanceService.getAll(),
        departmentSettingsService.getAll(),
        shiftService.getAll()
      ]);
      
      let filteredEmps = emps;
      if (uRole !== 'admin' && uRole !== 'manager' && uId) {
         filteredEmps = emps.filter(e => e.id === uId);
      }
      
      setEmployees(filteredEmps);
      setDepartments(depts);
      setJobTitles(jobs);
      setAttendance(atts.filter(a => a.date.startsWith(currentMonth)));
      setDeptSettings(settings.filter(s => s.month === currentMonth));
      setShifts(sfts);
    };
    fetchData();
  }, [currentMonth]);

  const calculatePayslipData = (emp: Employee) => {
    const dept = departments.find(d => d.id === emp.departmentId);
    const job = jobTitles.find(j => j.id === emp.jobTitleId);
    const settings = deptSettings.find(s => s.departmentId === emp.departmentId);
    const empAtt = attendance.filter(a => a.employeeId === emp.id);
    
    // Main Salary
    let baseSalary = 0;
    if (emp.salary.type === 'shift') {
      baseSalary = empAtt.length * emp.salary.shiftValue;
    } else if (emp.salary.type === 'hourly') {
      baseSalary = (empAtt.length * 8) * emp.salary.hourlyValue; // Simplified
    } else {
      baseSalary = emp.salary.standardValue;
    }

    // Allowances
    let allowanceTotal = 0;
    if (emp.salary.allowanceEnabled && emp.salary.allowances) {
      emp.salary.allowances.forEach(al => {
        if (al.type === 'daily') {
          // Present days count
          const presentDays = empAtt.filter(a => a.status === 'present' || a.status === 'late' || a.status === 'early').length;
          allowanceTotal += presentDays * al.amount;
        } else {
          allowanceTotal += al.amount;
        }
      });
    }

    // Deductions
    let deductionTotal = 0;
    let lateMinutesTotal = 0;
    
    if (emp.salary.deductionEnabled && emp.salary.deductions) {
      emp.salary.deductions.forEach(de => {
        if (de.name === 'Đi muộn' && de.type === 'per_time') {
          // Special calculation for Late minutes
          empAtt.forEach(att => {
            if (att.clockIn && att.shiftId) {
              const shift = shifts.find(s => s.id === att.shiftId);
              if (shift) {
                const [sH, sM] = shift.startTime.split(':').map(Number);
                const [cH, cM] = att.clockIn.split(':').map(Number);
                const startMins = sH * 60 + sM;
                const clockMins = cH * 60 + cM;
                if (clockMins > startMins) {
                  lateMinutesTotal += (clockMins - startMins);
                }
              }
            }
          });
          deductionTotal += lateMinutesTotal * de.amount;
        } else if (de.type === 'monthly') {
          deductionTotal += de.amount;
        } else {
          // Other per_time deductions (like uniform) - treat as fixed per month if no other data
          deductionTotal += de.amount;
        }
      });
    }
    
    const unauthAbsenceCount = empAtt.filter(a => a.status === 'unauthorized_absent').length;
    const penaltyAmount = unauthAbsenceCount * (emp.salary.shiftValue || 100000); // Fixed penalty per missed shift

    // Seniority
    const yearsWorked = Math.floor((new Date().getTime() - new Date(emp.startDate).getTime()) / (365 * 24 * 60 * 60 * 1000));
    const seniorityBonus = yearsWorked >= 1 ? yearsWorked * 100000 : 0;

    // Tet Bonus & Bonus
    const monthsWorked = Math.floor((new Date().getTime() - new Date(emp.startDate).getTime()) / (30 * 24 * 60 * 60 * 1000));
    const tetBonusAmount = settings?.tetBonusAmount || 100000;
    const totalTetBonus = (tetBonusAmount * Math.min(12, monthsWorked)) * 2;
    const currentMonthTetBonus = monthsWorked > 0 ? (totalTetBonus / 2) : 0; // Simplified logic: pay half if lunar end month
    const monthlyBonus = yearsWorked >= 1 ? (totalTetBonus / 2) / 12 : 0;

    // KPI Bonus (Using employee-level coefficient)
    const deptEmployees = employees.filter(e => e.departmentId === emp.departmentId);
    const deptK = (settings?.revenue || 0) * ((settings?.kpiBonus || 0) / 100);
    
    // Total weight = sum of (hours * coefficient) for all employees in department
    const deptTotalWeight = deptEmployees.reduce((sum, e) => {
      const att = attendance.filter(a => a.employeeId === e.id);
      const coef = e.salary?.departmentBonusCoef || 1;
      return sum + (att.length * 8 * coef);
    }, 0);

    const empWeight = (empAtt.length * 8 * (emp.salary?.departmentBonusCoef || 1));
    const salesBonus = deptTotalWeight > 0 ? (empWeight / deptTotalWeight) * deptK : 0;

    const responsibilityBonus = (settings?.revenue || 0) * ((job?.responsibilityBonus || 0) / 100);
    const totalSalary = baseSalary + responsibilityBonus + seniorityBonus + monthlyBonus + salesBonus + allowanceTotal - penaltyAmount - deductionTotal;

    return {
      baseSalary,
      allowanceTotal,
      responsibilityBonus,
      deductionTotal,
      lateMinutesTotal,
      penaltyAmount,
      seniorityBonus,
      salesBonus,
      monthlyBonus,
      totalSalary,
      shiftCount: empAtt.length,
      unauthAbsenceCount
    };
  };

  const selectedEmployee = employees.find(e => e.id === selectedEmpId);
  const payslipData = selectedEmployee ? calculatePayslipData(selectedEmployee) : null;

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {!selectedEmpId ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="bg-white p-5 rounded-xl border border-border-main shadow-sm flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-primary rounded-lg">
                     <FileText className="text-white w-5 h-5" />
                  </div>
                  <div>
                     <h2 className="text-base font-bold text-primary uppercase">Danh sách phiếu lương</h2>
                     <p className="text-[11px] font-bold text-text-sub uppercase">Chọn nhân viên để xem chi tiết lương {currentMonth}</p>
                  </div>
               </div>
               <input 
                 type="month"
                 value={currentMonth}
                 onChange={e => setCurrentMonth(e.target.value)}
                 className="border border-border-main bg-slate-50 rounded-md px-4 py-2 font-bold text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent transition-all"
               />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-border-main overflow-hidden">
               <div className="overflow-x-auto w-full">
                 <table className="w-full text-left min-w-[500px]">
                    <thead className="bg-slate-50 border-b border-border-main">
                     <tr>
                        <th className="px-6 py-4 text-[11px] font-extrabold text-text-sub uppercase tracking-wider">Mã NV</th>
                        <th className="px-6 py-4 text-[11px] font-extrabold text-text-sub uppercase tracking-wider">Họ tên nhân viên</th>
                        <th className="px-6 py-4 text-[11px] font-extrabold text-text-sub uppercase tracking-wider">Phòng ban</th>
                        <th className="px-6 py-4 text-[11px] font-extrabold text-text-sub uppercase tracking-wider text-right">Tổng thực lĩnh</th>
                        <th className="px-6 py-4"></th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-border-main text-sm font-medium">
                     {employees.map(emp => {
                       const data = calculatePayslipData(emp);
                       const dept = departments.find(d => d.id === emp.departmentId);
                       return (
                         <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4 font-mono text-text-sub text-[10px]">{emp.id}</td>
                            <td className="px-6 py-4 font-bold text-primary">{emp.name}</td>
                            <td className="px-6 py-4">
                               <span className="px-2 py-0.5 bg-slate-100 rounded border border-border-main text-[10px] font-bold text-text-sub uppercase">{dept?.name || '---'}</span>
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-primary">{formatCurrency(data.totalSalary)}</td>
                            <td className="px-6 py-4 text-right">
                               <button 
                                 onClick={() => setSelectedEmpId(emp.id)}
                                 className="p-1.5 rounded-md text-text-sub group-hover:text-accent group-hover:bg-blue-50 transition-all"
                               >
                                  <ChevronRight className="w-4 h-4" />
                               </button>
                            </td>
                         </tr>
                       );
                     })}
                  </tbody>
               </table>
               </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
               <button 
                 onClick={() => setSelectedEmpId(null)}
                 className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
               >
                  <ArrowLeft className="w-5 h-5" />
               </button>
               <h2 className="text-xl font-bold text-slate-900">Chi tiết phiếu lương</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="lg:col-span-2 bg-white p-10 rounded-xl shadow-sm border border-border-main relative overflow-hidden">
                  {/* Payslip Header */}
                  <div className="flex justify-between items-start mb-12 relative">
                     <div className="space-y-4">
                        <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                           <Wallet className="text-white w-6 h-6" />
                        </div>
                        <div>
                           <h1 className="text-xl font-bold text-primary uppercase">Phiếu Lương</h1>
                           <p className="text-[11px] font-bold text-text-sub uppercase tracking-wider">Tháng {currentMonth} • #{selectedEmployee?.id}</p>
                        </div>
                     </div>
                     <div className="text-right space-y-1">
                        <p className="text-[10px] font-bold text-text-sub uppercase tracking-widest">Tổng thực nhận</p>
                        <h2 className="text-4xl font-black text-primary">{formatCurrency(payslipData?.totalSalary || 0)}</h2>
                     </div>
                  </div>

                  {/* Employee Meta */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 p-6 bg-slate-50 rounded-lg border border-border-main/50">
                     <div className="space-y-0.5">
                        <p className="text-[9px] font-bold text-text-sub uppercase tracking-wider">Họ và tên</p>
                        <p className="text-sm font-bold text-primary truncate">{selectedEmployee?.name}</p>
                     </div>
                     <div className="space-y-0.5">
                        <p className="text-[9px] font-bold text-text-sub uppercase tracking-wider">Mã NV</p>
                        <p className="text-sm font-bold text-primary">{selectedEmployee?.id}</p>
                     </div>
                     <div className="space-y-0.5">
                        <p className="text-[9px] font-bold text-text-sub uppercase tracking-wider">Phòng ban</p>
                        <p className="text-sm font-bold text-primary truncate">{departments.find(d => d.id === selectedEmployee?.departmentId)?.name || '---'}</p>
                     </div>
                     <div className="space-y-0.5">
                        <p className="text-[9px] font-bold text-text-sub uppercase tracking-wider">Chức danh</p>
                        <p className="text-sm font-bold text-primary truncate">{jobTitles.find(j => j.id === selectedEmployee?.jobTitleId)?.name || '---'}</p>
                     </div>
                  </div>

                  {/* Detailed breakdown */}
                  <div className="space-y-8">
                     <div className="space-y-3">
                        <h4 className="text-[11px] font-bold text-primary uppercase tracking-widest border-l-4 border-accent pl-3">I. Các khoản thu nhập (+)</h4>
                        <div className="space-y-1">
                           <div className="flex justify-between py-2 border-b border-dashed border-border-main text-sm">
                              <span className="text-text-sub">Lương chính ({payslipData?.shiftCount} ca)</span>
                              <span className="font-bold text-primary">{formatCurrency(payslipData?.baseSalary || 0)}</span>
                           </div>
                           {payslipData?.allowanceTotal ? (
                              <div className="flex justify-between py-2 border-b border-dashed border-border-main text-sm">
                                 <span className="text-text-sub">Phụ cấp (Ăn trưa...)</span>
                                 <span className="font-bold text-emerald-600">{formatCurrency(payslipData.allowanceTotal)}</span>
                              </div>
                           ) : null}
                           <div className="flex justify-between py-2 border-b border-dashed border-border-main text-sm">
                              <span className="text-text-sub">Phụ cấp trách nhiệm</span>
                              <span className="font-bold text-primary">{formatCurrency(payslipData?.responsibilityBonus || 0)}</span>
                           </div>
                           <div className="flex justify-between py-2 border-b border-dashed border-border-main text-sm">
                              <span className="text-text-sub">Thưởng KPI (Phòng ban)</span>
                              <span className="font-bold text-emerald-600">{formatCurrency(payslipData?.salesBonus || 0)}</span>
                           </div>
                           <div className="flex justify-between py-2 border-b border-dashed border-border-main text-sm">
                              <span className="text-text-sub">Thâm niên & Bonus</span>
                              <span className="font-bold text-primary">{formatCurrency((payslipData?.seniorityBonus || 0) + (payslipData?.monthlyBonus || 0))}</span>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-3">
                        <h4 className="text-[11px] font-bold text-danger uppercase tracking-widest border-l-4 border-danger pl-3">II. Các khoản giảm trừ (-)</h4>
                        <div className="space-y-1">
                           {payslipData?.lateMinutesTotal ? (
                              <div className="flex justify-between py-2 border-b border-dashed border-border-main text-sm">
                                 <span className="text-text-sub">Đi muộn ({payslipData.lateMinutesTotal} phút)</span>
                                 <span className="font-bold text-danger">({formatCurrency((payslipData.lateMinutesTotal || 0) * (selectedEmployee?.salary.deductions.find(d => d.name === 'Đi muộn')?.amount || 0))})</span>
                              </div>
                           ) : null}
                           {payslipData?.deductionTotal && (payslipData.deductionTotal - ((payslipData.lateMinutesTotal || 0) * (selectedEmployee?.salary.deductions.find(d => d.name === 'Đi muộn')?.amount || 0))) > 0 ? (
                              <div className="flex justify-between py-2 border-b border-dashed border-border-main text-sm">
                                 <span className="text-text-sub">Các khoản giảm trừ khác (BHXH...)</span>
                                 <span className="font-bold text-danger">({formatCurrency(payslipData.deductionTotal - ((payslipData.lateMinutesTotal || 0) * (selectedEmployee?.salary.deductions.find(d => d.name === 'Đi muộn')?.amount || 0)))})</span>
                              </div>
                           ) : null}
                           <div className="flex justify-between py-2 border-b border-dashed border-border-main text-sm">
                              <span className="text-text-sub">Nghỉ không phép ({payslipData?.unauthAbsenceCount} lần)</span>
                              <span className="font-bold text-danger">({formatCurrency(payslipData?.penaltyAmount || 0)})</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="mt-12 flex gap-4">
                     <button className="flex-1 py-3 px-6 bg-primary text-white rounded-md font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 text-xs uppercase shadow-sm">
                        <Printer className="w-4 h-4" /> In phiếu lương
                     </button>
                     <button className="flex-1 py-3 px-6 bg-slate-50 text-primary border border-border-main rounded-md font-bold hover:bg-slate-100 transition-all flex items-center justify-center gap-2 text-xs uppercase shadow-sm">
                        <Download className="w-4 h-4" /> Tải PDF
                     </button>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="bg-white p-6 rounded-xl border border-border-main shadow-sm space-y-4">
                     <h3 className="text-xs font-bold text-primary uppercase">Thông báo từ HRM</h3>
                     <p className="text-xs text-text-sub italic leading-relaxed">
                        "Cảm ơn bạn đã đồng hành cùng Minh Hang Auto trong tháng này. Hãy tiếp tục cố gắng nhé!"
                     </p>
                  </div>
                  <div className="bg-accent p-6 rounded-xl shadow-md text-white space-y-4">
                     <h3 className="text-xs font-bold uppercase">Hỗ trợ & Thắc mắc</h3>
                     <p className="text-[11px] text-blue-50 leading-relaxed uppercase font-bold opacity-80">Liên hệ phòng hành chính trong vòng 3 ngày nếu có thắc mắc.</p>
                     <button className="w-full py-2.5 bg-white/20 hover:bg-white/30 rounded text-[10px] uppercase font-extrabold transition-all border border-white/20">Gửi yêu cầu</button>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
