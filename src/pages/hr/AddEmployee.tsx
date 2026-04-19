import React, { useState, useEffect } from 'react';
import { UserPlus, Save, Briefcase, Contact, Phone, MapPin, Mail, Calendar, CreditCard, Percent, DollarSign, Wallet, Plus } from 'lucide-react';
import { employeeService, departmentService, jobTitleService } from '../../lib/services';
import { Department, JobTitle, SalaryType, EmployeeAllowance, EmployeeDeduction } from '../../types';
import Modal from '../../components/ui/Modal';

export default function AddEmployee({ onSaved, editingEmployeeId }: { onSaved?: () => void, editingEmployeeId?: string | null }) {
  const [activeTab, setActiveTab] = useState<'info' | 'salary'>('info');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newJobName, setNewJobName] = useState('');

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    password: '',
    status: 'active' as 'active' | 'inactive',
    startDate: new Date().toISOString().split('T')[0],
    departmentId: '',
    jobTitleId: '',
    salary: {
      type: 'standard' as SalaryType,
      shiftValue: 0,
      hourlyValue: 0,
      standardValue: 0,
      departmentBonusCoef: 1,
      allowanceEnabled: false,
      deductionEnabled: false,
      allowances: [],
      deductions: [],
    }
  });

  const loadData = async () => {
    const [depts, titles, count] = await Promise.all([
      departmentService.getAll(),
      jobTitleService.getAll(),
      employeeService.getCount()
    ]);
    setDepartments(depts);
    setJobTitles(titles);

    if (editingEmployeeId) {
      setIsEditMode(true);
      const emp = await employeeService.getById(editingEmployeeId);
      if (emp) {
        setFormData({
          id: emp.id,
          name: emp.name,
          phone: emp.phone,
          email: emp.email,
          address: emp.address,
          password: emp.password || '',
          status: emp.status || 'active',
          startDate: emp.startDate,
          departmentId: emp.departmentId,
          jobTitleId: emp.jobTitleId,
          salary: emp.salary || {
            type: 'standard',
            shiftValue: 0,
            hourlyValue: 0,
            standardValue: 0,
            departmentBonusCoef: 1,
            allowanceEnabled: false,
            deductionEnabled: false,
            allowances: [],
            deductions: [],
          }
        });
      }
    } else {
      setIsEditMode(false);
      // Auto-generate ID: MH100001
      const nextId = `MH${(100001 + count).toString()}`;
      setFormData(prev => ({ ...prev, id: nextId }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickAddDept = async () => {
    if (!newDeptName) return;
    try {
      const id = await departmentService.create({ name: newDeptName, kpiBonus: 0 } as Department);
      await loadData();
      setFormData(prev => ({ ...prev, departmentId: id }));
      setIsDeptModalOpen(false);
      setNewDeptName('');
    } catch (err) {
      console.error(err);
      alert('Lỗi khi thêm phòng ban');
    }
  };

  const handleQuickAddJob = async () => {
    if (!newJobName) return;
    try {
      const id = await jobTitleService.create({ name: newJobName, responsibilityBonus: 0 } as JobTitle);
      await loadData();
      setFormData(prev => ({ ...prev, jobTitleId: id }));
      setIsJobModalOpen(false);
      setNewJobName('');
    } catch (err) {
      console.error(err);
      alert('Lỗi khi thêm chức danh');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await employeeService.update(formData.id, formData as any);
        alert('Cập nhật nhân viên thành công!');
      } else {
        await employeeService.create(formData as any, formData.id);
        alert('Thêm nhân viên thành công!');
      }
      if (onSaved) onSaved();
    } catch (error) {
       console.error(error);
       alert(isEditMode ? 'Lỗi khi cập nhật nhân viên' : 'Lỗi khi thêm nhân viên');
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary rounded-2xl shadow-lg">
             <UserPlus className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-primary tracking-tight uppercase">
              {isEditMode ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
            </h1>
            <p className="text-sm text-text-sub font-medium">
              {isEditMode ? 'Cập nhật thông tin chi tiết và thiết lập lương' : 'Nhập thông tin chi tiết và thiết lập lương cho nhân sự'}
            </p>
          </div>
        </div>
        <button 
          onClick={handleSubmit}
          className="bg-accent hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-accent/20 transition-all uppercase tracking-widest text-xs"
        >
          <Save className="w-4 h-4" /> Lưu nhân sự
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-border-main shadow-sm overflow-hidden min-h-[500px] flex flex-col">
        {/* Tabs */}
        <div className="flex bg-slate-50 border-b border-border-main p-2">
           <button 
             onClick={() => setActiveTab('info')}
             className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all rounded-xl flex items-center justify-center gap-2 ${activeTab === 'info' ? 'bg-white shadow-sm text-primary' : 'text-text-sub hover:text-primary'}`}
           >
              <Contact className="w-4 h-4" /> Thông tin cơ bản
           </button>
           <button 
             onClick={() => setActiveTab('salary')}
             className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all rounded-xl flex items-center justify-center gap-2 ${activeTab === 'salary' ? 'bg-white shadow-sm text-primary' : 'text-text-sub hover:text-primary'}`}
           >
              <Wallet className="w-4 h-4" /> Thiết lập lương & thưởng
           </button>
        </div>

        <form className="p-10 flex-1">
          {activeTab === 'info' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-8">
                 <div className="flex items-center gap-2 text-primary border-l-4 border-accent pl-4">
                    <h3 className="text-xs font-black uppercase tracking-tight">Thông tin khởi tạo</h3>
                 </div>
                 
                 <div className="space-y-6">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-text-sub uppercase ml-1">Mã nhân viên (Username)</label>
                      <input 
                        readOnly
                        value={formData.id}
                        className="w-full bg-slate-100 border border-border-main rounded-md px-4 py-2.5 font-mono text-primary font-bold focus:outline-none cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-text-sub uppercase ml-1">Họ và tên</label>
                      <input 
                        placeholder="VD: Nguyễn Văn An"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full border border-border-main rounded-md px-4 py-2.5 outline-none focus:ring-1 focus:ring-accent bg-slate-50 focus:bg-white transition-all font-medium text-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-text-sub uppercase ml-1">Số điện thoại</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub" />
                        <input 
                          type="tel"
                          placeholder="09xx xxx xxx"
                          value={formData.phone}
                          onChange={e => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full border border-border-main rounded-md pl-10 pr-4 py-2.5 outline-none focus:ring-1 focus:ring-accent bg-slate-50 focus:bg-white transition-all font-medium text-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-text-sub uppercase ml-1">Mật khẩu đăng nhập</label>
                      <input 
                         type="text"
                         placeholder="Nhập mật khẩu (VD: 123456)"
                         value={formData.password}
                         onChange={e => setFormData({ ...formData, password: e.target.value })}
                         className="w-full border border-border-main rounded-md px-4 py-2.5 outline-none focus:ring-1 focus:ring-accent bg-slate-50 focus:bg-white transition-all font-medium text-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-text-sub uppercase ml-1">Trạng thái làm việc</label>
                      <select 
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full border border-border-main rounded-md px-4 py-2.5 outline-none focus:ring-1 focus:ring-accent bg-slate-50 font-medium text-primary"
                      >
                         <option value="active">Đang làm việc</option>
                         <option value="inactive">Đã nghỉ việc</option>
                      </select>
                    </div>
                 </div>
              </div>

              <div className="space-y-8">
                 <div className="flex items-center gap-2 text-primary border-l-4 border-accent pl-4">
                    <h3 className="text-xs font-black uppercase tracking-tight">Thông tin công việc</h3>
                 </div>

                 <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <div className="flex items-center justify-between ml-1">
                             <label className="text-[11px] font-bold text-text-sub uppercase">Phòng ban</label>
                             <button 
                               type="button"
                               onClick={() => setIsDeptModalOpen(true)}
                               className="text-[10px] font-bold text-accent hover:underline flex items-center gap-1"
                             >
                               <Plus className="w-3 h-3" /> Thêm nhanh
                             </button>
                          </div>
                          <select 
                            value={formData.departmentId}
                            onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
                            className="w-full border border-border-main rounded-md px-4 py-2.5 outline-none focus:ring-1 focus:ring-accent bg-slate-50 font-medium text-primary"
                          >
                             <option value="">Chọn phòng ban</option>
                             {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                       </div>
                       <div className="space-y-1.5">
                          <div className="flex items-center justify-between ml-1">
                             <label className="text-[11px] font-bold text-text-sub uppercase">Chức danh</label>
                             <button 
                               type="button"
                               onClick={() => setIsJobModalOpen(true)}
                               className="text-[10px] font-bold text-accent hover:underline flex items-center gap-1"
                             >
                               <Plus className="w-3 h-3" /> Thêm nhanh
                             </button>
                          </div>
                          <select 
                            value={formData.jobTitleId}
                            onChange={e => setFormData({ ...formData, jobTitleId: e.target.value })}
                            className="w-full border border-border-main rounded-md px-4 py-2.5 outline-none focus:ring-1 focus:ring-accent bg-slate-50 font-medium text-primary"
                          >
                             <option value="">Chọn chức danh</option>
                             {jobTitles.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                       </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-text-sub uppercase ml-1">Ngày bắt đầu làm việc</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub" />
                        <input 
                          type="date"
                          value={formData.startDate}
                          onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                          className="w-full border border-border-main rounded-md pl-10 pr-4 py-2.5 outline-none focus:ring-1 focus:ring-accent bg-slate-50 font-medium text-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-text-sub uppercase ml-1">Địa chỉ liên hệ</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-text-sub" />
                        <textarea 
                          rows={2}
                          placeholder="Số nhà, đường, phường/xã..."
                          value={formData.address}
                          onChange={e => setFormData({ ...formData, address: e.target.value })}
                          className="w-full border border-border-main rounded-md pl-10 pr-4 py-2 outline-none focus:ring-1 focus:ring-accent bg-slate-50 focus:bg-white transition-all font-medium text-primary resize-none"
                        />
                      </div>
                    </div>
                 </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-10">
               <div className="bg-slate-50 p-6 rounded-2xl border border-border-main flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
                        <CreditCard className="w-5 h-5" />
                     </div>
                     <div>
                        <h4 className="text-sm font-bold text-primary">Hình thức tính lương</h4>
                        <p className="text-[10px] uppercase font-bold text-text-sub leading-tight">Xác định cách chi trả thu nhập</p>
                     </div>
                  </div>
                  <div className="flex gap-2 p-1 bg-white rounded-lg border border-border-main shadow-sm">
                     {(['standard', 'hourly', 'shift'] as SalaryType[]).map(type => (
                       <button
                         key={type}
                         type="button"
                         onClick={() => setFormData({ ...formData, salary: { ...formData.salary, type } })}
                         className={`px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${formData.salary.type === type ? 'bg-primary text-white shadow-md' : 'text-text-sub hover:bg-slate-50'}`}
                       >
                         {type === 'standard' ? 'Cố định' : type === 'hourly' ? 'Theo giờ' : 'Theo ca'}
                       </button>
                     ))}
                  </div>
               </div>

               <div className="grid grid-cols-1 gap-8">
                  <div className="space-y-1.5">
                     <label className="text-[11px] font-bold text-text-sub uppercase ml-1">
                        {formData.salary.type === 'standard' ? 'Lương cơ bản tháng' : 
                         formData.salary.type === 'hourly' ? 'Mức lương theo giờ' : 'Mức lương theo ca'} (VNĐ)
                     </label>
                     <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub" />
                        <input 
                           type="number"
                           placeholder="0"
                           value={formData.salary.type === 'standard' ? formData.salary.standardValue : 
                                  formData.salary.type === 'hourly' ? formData.salary.hourlyValue : formData.salary.shiftValue}
                           onChange={e => {
                             const val = Number(e.target.value);
                             const key = formData.salary.type === 'standard' ? 'standardValue' : 
                                         formData.salary.type === 'hourly' ? 'hourlyValue' : 'shiftValue';
                             setFormData({ ...formData, salary: { ...formData.salary, [key]: val } });
                           }}
                           className="w-full border border-border-main rounded-md pl-10 pr-4 py-2.5 outline-none focus:ring-1 focus:ring-accent bg-slate-50 font-bold text-primary"
                        />
                     </div>
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[11px] font-bold text-text-sub uppercase ml-1">Hệ số % thưởng (1-10%)</label>
                     <div className="relative">
                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub" />
                        <input 
                           type="number"
                           min="1"
                           max="10"
                           value={formData.salary.departmentBonusCoef}
                           onChange={e => setFormData({ ...formData, salary: { ...formData.salary, departmentBonusCoef: Number(e.target.value) } })}
                           className="w-full border border-border-main rounded-md pl-10 pr-4 py-2.5 outline-none focus:ring-1 focus:ring-accent bg-slate-50 font-bold text-primary"
                        />
                     </div>
                  </div>
               </div>

               {/* Allowances Section */}
               <div className="space-y-4 pt-6 border-t border-dashed border-border-main">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4 text-emerald-500" />
                        <h4 className="text-xs font-black text-primary uppercase tracking-tight">Phụ cấp</h4>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-text-sub uppercase">{formData.salary.allowanceEnabled ? 'Bật' : 'Tắt'}</span>
                        <button
                           type="button"
                           onClick={() => setFormData({
                              ...formData,
                              salary: { ...formData.salary, allowanceEnabled: !formData.salary.allowanceEnabled }
                           })}
                           className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${formData.salary.allowanceEnabled ? "bg-emerald-500" : "bg-slate-300"}`}
                        >
                           <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 ${formData.salary.allowanceEnabled ? "left-6" : "left-1"}`} />
                        </button>
                     </div>
                  </div>

                  {formData.salary.allowanceEnabled && (
                    <div className="space-y-3">
                       {formData.salary.allowances.map((allowance, index) => (
                         <div key={index} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-3 rounded-xl border border-border-main">
                            <div className="col-span-4">
                               <select
                                 value={allowance.name}
                                 onChange={(e) => {
                                   const newAllowances = [...formData.salary.allowances];
                                   newAllowances[index].name = e.target.value;
                                   setFormData({ ...formData, salary: { ...formData.salary, allowances: newAllowances } });
                                 }}
                                 className="w-full bg-white border border-border-main rounded-md px-2 py-1.5 text-[11px] font-bold outline-none"
                               >
                                  <option value="">Chọn loại</option>
                                  <option value="Ăn trưa">Ăn trưa</option>
                               </select>
                            </div>
                            <div className="col-span-3">
                               <select
                                 value={allowance.type}
                                 onChange={(e) => {
                                   const newAllowances = [...formData.salary.allowances];
                                   newAllowances[index].type = e.target.value as any;
                                   setFormData({ ...formData, salary: { ...formData.salary, allowances: newAllowances } });
                                 }}
                                 className="w-full bg-white border border-border-main rounded-md px-2 py-1.5 text-[11px] font-bold outline-none"
                               >
                                  <option value="daily">Theo ngày</option>
                                  <option value="monthly">Theo tháng</option>
                               </select>
                            </div>
                            <div className="col-span-4">
                               <input
                                 type="number"
                                 placeholder="Số tiền"
                                 value={allowance.amount}
                                 onChange={(e) => {
                                   const newAllowances = [...formData.salary.allowances];
                                   newAllowances[index].amount = Number(e.target.value);
                                   setFormData({ ...formData, salary: { ...formData.salary, allowances: newAllowances } });
                                 }}
                                 className="w-full bg-white border border-border-main rounded-md px-2 py-1.5 text-[11px] font-bold outline-none"
                               />
                            </div>
                            <div className="col-span-1 flex justify-end">
                               <button
                                 type="button"
                                 onClick={() => {
                                   const newAllowances = formData.salary.allowances.filter((_, i) => i !== index);
                                   setFormData({ ...formData, salary: { ...formData.salary, allowances: newAllowances } });
                                 }}
                                 className="text-red-500 hover:scale-110 transition-transform"
                               >
                                  <Plus className="w-4 h-4 rotate-45" />
                               </button>
                            </div>
                         </div>
                       ))}
                       <button
                         type="button"
                         onClick={() => {
                           const newAllowance: EmployeeAllowance = { id: crypto.randomUUID(), name: '', type: 'daily', amount: 0 };
                           setFormData({ ...formData, salary: { ...formData.salary, allowances: [...formData.salary.allowances, newAllowance] } });
                         }}
                         className="w-full py-2 border-2 border-dashed border-border-main rounded-xl text-[10px] font-black uppercase text-text-sub hover:border-emerald-500 hover:text-emerald-500 transition-all flex items-center justify-center gap-2"
                       >
                          <Plus className="w-3 h-3" /> Thêm phụ cấp
                       </button>
                    </div>
                  )}
               </div>

               {/* Deductions Section */}
               <div className="space-y-4 pt-6 border-t border-dashed border-border-main">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4 text-rose-500" />
                        <h4 className="text-xs font-black text-primary uppercase tracking-tight">Giảm trừ</h4>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-text-sub uppercase">{formData.salary.deductionEnabled ? 'Bật' : 'Tắt'}</span>
                        <button
                           type="button"
                           onClick={() => setFormData({
                              ...formData,
                              salary: { ...formData.salary, deductionEnabled: !formData.salary.deductionEnabled }
                           })}
                           className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${formData.salary.deductionEnabled ? "bg-rose-500" : "bg-slate-300"}`}
                        >
                           <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 ${formData.salary.deductionEnabled ? "left-6" : "left-1"}`} />
                        </button>
                     </div>
                  </div>

                  {formData.salary.deductionEnabled && (
                    <div className="space-y-3">
                       {formData.salary.deductions.map((deduction, index) => (
                         <div key={index} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-3 rounded-xl border border-border-main">
                            <div className="col-span-4">
                               <select
                                 value={deduction.name}
                                 onChange={(e) => {
                                   const newDeductions = [...formData.salary.deductions];
                                   newDeductions[index].name = e.target.value;
                                   setFormData({ ...formData, salary: { ...formData.salary, deductions: newDeductions } });
                                 }}
                                 className="w-full bg-white border border-border-main rounded-md px-2 py-1.5 text-[11px] font-bold outline-none"
                               >
                                  <option value="">Chọn loại</option>
                                  <option value="Đi muộn">Đi muộn</option>
                                  <option value="BHXH">BHXH</option>
                                  <option value="Không mặc đồng phục">Không mặc đồng phục</option>
                               </select>
                            </div>
                            <div className="col-span-3">
                               <select
                                 value={deduction.type}
                                 onChange={(e) => {
                                   const newDeductions = [...formData.salary.deductions];
                                   newDeductions[index].type = e.target.value as any;
                                   setFormData({ ...formData, salary: { ...formData.salary, deductions: newDeductions } });
                                 }}
                                 className="w-full bg-white border border-border-main rounded-md px-2 py-1.5 text-[11px] font-bold outline-none"
                               >
                                  <option value="per_time">Theo lần</option>
                                  <option value="monthly">Theo tháng</option>
                               </select>
                            </div>
                            <div className="col-span-4">
                               <input
                                 type="number"
                                 placeholder="Số tiền"
                                 value={deduction.amount}
                                 onChange={(e) => {
                                   const newDeductions = [...formData.salary.deductions];
                                   newDeductions[index].amount = Number(e.target.value);
                                   setFormData({ ...formData, salary: { ...formData.salary, deductions: newDeductions } });
                                 }}
                                 className="w-full bg-white border border-border-main rounded-md px-2 py-1.5 text-[11px] font-bold outline-none"
                               />
                            </div>
                            <div className="col-span-1 flex justify-end">
                               <button
                                 type="button"
                                 onClick={() => {
                                   const newDeductions = formData.salary.deductions.filter((_, i) => i !== index);
                                   setFormData({ ...formData, salary: { ...formData.salary, deductions: newDeductions } });
                                 }}
                                 className="text-red-500 hover:scale-110 transition-transform"
                               >
                                  <Plus className="w-4 h-4 rotate-45" />
                               </button>
                            </div>
                         </div>
                       ))}
                       <button
                         type="button"
                         onClick={() => {
                           const newDeduction: EmployeeDeduction = { id: crypto.randomUUID(), name: '', type: 'per_time', amount: 0 };
                           setFormData({ ...formData, salary: { ...formData.salary, deductions: [...formData.salary.deductions, newDeduction] } });
                         }}
                         className="w-full py-2 border-2 border-dashed border-border-main rounded-xl text-[10px] font-black uppercase text-text-sub hover:border-rose-500 hover:text-rose-500 transition-all flex items-center justify-center gap-2"
                       >
                          <Plus className="w-3 h-3" /> Thêm giảm trừ
                       </button>
                    </div>
                  )}
               </div>

            </div>
          )}
        </form>
      </div>

      {/* Quick Add Modals */}
      <Modal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        title="Thêm nhanh phòng ban"
        footer={
          <>
            <button onClick={() => setIsDeptModalOpen(false)} className="flex-1 h-12 rounded-xl border-2 border-border-main text-sm font-bold text-primary hover:bg-slate-50">Hủy</button>
            <button onClick={handleQuickAddDept} className="flex-1 h-12 rounded-xl bg-accent text-white text-sm font-bold shadow-lg shadow-accent/20">Lưu</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-text-sub uppercase ml-1">Tên phòng ban</label>
            <input 
              autoFocus
              value={newDeptName}
              onChange={e => setNewDeptName(e.target.value)}
              placeholder="Nhập tên phòng ban..."
              className="w-full border border-border-main rounded-md px-4 py-2.5 outline-none focus:ring-1 focus:ring-accent bg-slate-50 transition-all font-medium text-primary"
            />
          </div>
          <p className="text-xs text-text-sub italic">* Bạn có thể thiết lập KPI sau trong phần Cấu hình Phòng Ban.</p>
        </div>
      </Modal>

      <Modal
        isOpen={isJobModalOpen}
        onClose={() => setIsJobModalOpen(false)}
        title="Thêm nhanh chức danh"
        footer={
          <>
            <button onClick={() => setIsJobModalOpen(false)} className="flex-1 h-12 rounded-xl border-2 border-border-main text-sm font-bold text-primary hover:bg-slate-50">Hủy</button>
            <button onClick={handleQuickAddJob} className="flex-1 h-12 rounded-xl bg-accent text-white text-sm font-bold shadow-lg shadow-accent/20">Lưu</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-text-sub uppercase ml-1">Tên chức danh</label>
            <input 
              autoFocus
              value={newJobName}
              onChange={e => setNewJobName(e.target.value)}
              placeholder="Nhập tên chức danh..."
              className="w-full border border-border-main rounded-md px-4 py-2.5 outline-none focus:ring-1 focus:ring-accent bg-slate-50 transition-all font-medium text-primary"
            />
          </div>
          <p className="text-xs text-text-sub italic">* Bạn có thể thiết lập phụ cấp sau trong phần Cấu hình Chức danh.</p>
        </div>
      </Modal>
    </div>
  );
}
