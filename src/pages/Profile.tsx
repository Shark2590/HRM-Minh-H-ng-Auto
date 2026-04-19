import React, { useState, useEffect } from 'react';
import { User as UserIcon, Lock, Save, Mail, Phone, MapPin, Briefcase, Calendar, ShieldCheck } from 'lucide-react';
import { employeeService, departmentService, jobTitleService } from '../lib/services';
import { Employee } from '../types';

export default function Profile() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [departmentName, setDepartmentName] = useState('Chưa xếp phòng ban');
  const [jobTitleName, setJobTitleName] = useState('Chưa có chức danh');
  const [loading, setLoading] = useState(true);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const empId = localStorage.getItem('loggedInEmpId');
      if (!empId) {
        setLoading(false);
        return;
      }

      try {
        const emp = await employeeService.getById(empId);
        if (emp) {
          setEmployee(emp);
          if (emp.departmentId) {
            const dp = await departmentService.getById(emp.departmentId);
            if (dp) setDepartmentName(dp.name);
          }
          if (emp.jobTitleId) {
            const jt = await jobTitleService.getById(emp.jobTitleId);
            if (jt) setJobTitleName(jt.name);
          }
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!employee) return;
    if (employee.id === 'ADMIN_GOOGLE') {
        setPasswordError('Tài khoản Google không thể đổi mật khẩu qua hệ thống này.');
        return;
    }

    if (currentPassword !== employee.password) {
      setPasswordError('Mật khẩu hiện tại không chính xác.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setSavingPassword(true);
    try {
      await employeeService.update(employee.id, { password: newPassword });
      setEmployee({ ...employee, password: newPassword });
      setPasswordSuccess('Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError('Lỗi cập nhật mật khẩu, vui lòng thử lại.');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="bg-rose-50 text-rose-500 p-6 rounded-2xl text-center font-bold">
        Không tìm thấy thông tin tài khoản của bạn.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-primary rounded-2xl shadow-lg">
           <UserIcon className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-primary tracking-tight uppercase">Thông tin tài khoản</h1>
          <p className="text-sm text-text-sub font-medium">Quản lý chi tiết cá nhân & bảo mật</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="md:col-span-1 space-y-8">
          <div className="bg-white p-6 rounded-[2rem] border border-border-main shadow-sm flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-lg">
               <span className="text-3xl font-black text-accent">{employee.name.charAt(0)}</span>
            </div>
            <h2 className="text-xl font-bold text-primary">{employee.name}</h2>
            <p className="text-xs font-bold font-mono text-text-sub mt-1">{employee.id}</p>
            
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-100">
               <ShieldCheck className="w-3.5 h-3.5" />
               {employee.role === 'admin' ? 'Quản trị hệ thống' : employee.role === 'manager' ? 'Quản lý' : 'Nhân viên'}
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-border-main shadow-sm space-y-4">
             <h3 className="text-sm font-bold text-primary border-b border-border-main pb-3 mb-4 uppercase tracking-wider">Chi tiết làm việc</h3>
             <div className="space-y-4">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                    <Briefcase className="w-4 h-4 text-text-sub" />
                 </div>
                 <div className="overflow-hidden">
                   <p className="text-[10px] text-text-sub font-bold uppercase tracking-wider">Chức danh</p>
                   <p className="text-sm font-medium text-primary truncate">{jobTitleName}</p>
                 </div>
               </div>
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                    <Briefcase className="w-4 h-4 text-text-sub" />
                 </div>
                 <div className="overflow-hidden">
                   <p className="text-[10px] text-text-sub font-bold uppercase tracking-wider">Bộ phận</p>
                   <p className="text-sm font-medium text-primary truncate">{departmentName}</p>
                 </div>
               </div>
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-text-sub" />
                 </div>
                 <div className="overflow-hidden">
                   <p className="text-[10px] text-text-sub font-bold uppercase tracking-wider">Ngày bắt đầu</p>
                   <p className="text-sm font-medium text-primary truncate">
                     {new Date(employee.startDate).toLocaleDateString('vi-VN')}
                   </p>
                 </div>
               </div>
             </div>
          </div>
        </div>

        {/* Info & Security */}
        <div className="md:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[2rem] border border-border-main shadow-sm">
             <h3 className="text-sm font-bold text-primary border-b border-border-main pb-4 mb-6 uppercase tracking-wider">Thông tin liên hệ</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-text-sub uppercase tracking-wider flex items-center gap-1.5">
                   <Phone className="w-3 h-3" /> Số điện thoại
                 </label>
                 <div className="px-4 py-3 bg-slate-50 rounded-xl font-medium text-primary text-sm border border-transparent">
                   {employee.phone || 'Chưa cập nhật'}
                 </div>
               </div>
               <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-text-sub uppercase tracking-wider flex items-center gap-1.5">
                   <Mail className="w-3 h-3" /> Email
                 </label>
                 <div className="px-4 py-3 bg-slate-50 rounded-xl font-medium text-primary text-sm border border-transparent truncate">
                   {employee.email || 'Chưa cập nhật'}
                 </div>
               </div>
               <div className="space-y-1.5 sm:col-span-2">
                 <label className="text-[10px] font-bold text-text-sub uppercase tracking-wider flex items-center gap-1.5">
                   <MapPin className="w-3 h-3" /> Địa chỉ
                 </label>
                 <div className="px-4 py-3 bg-slate-50 rounded-xl font-medium text-primary text-sm border border-transparent relative">
                   {employee.address || 'Chưa cập nhật'}
                 </div>
               </div>
             </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-border-main shadow-sm">
             <div className="flex items-center gap-2 mb-6 border-b border-border-main pb-4">
               <Lock className="w-4 h-4 text-primary" />
               <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Đổi mật khẩu</h3>
             </div>

             {employee.id === 'ADMIN_GOOGLE' ? (
               <div className="bg-amber-50 text-amber-600 p-4 rounded-xl text-sm font-semibold border border-amber-100 flex items-center gap-3">
                 <ShieldCheck className="w-5 h-5 shrink-0" />
                 Tài khoản của bạn được liên kết với Google. Mật khẩu được quản lý bởi tài khoản Google.
               </div>
             ) : (
               <form onSubmit={handleChangePassword} className="space-y-5">
                 {passwordError && (
                   <div className="bg-rose-50 text-rose-500 p-3 rounded-lg text-xs font-bold border border-rose-100 text-center">
                     {passwordError}
                   </div>
                 )}
                 {passwordSuccess && (
                   <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg text-xs font-bold border border-emerald-100 text-center">
                     {passwordSuccess}
                   </div>
                 )}
                 
                 <div className="space-y-1.5">
                   <label className="text-[11px] font-bold text-text-sub uppercase ml-1">Mật khẩu hiện tại</label>
                   <input 
                     type="password"
                     value={currentPassword}
                     onChange={e => setCurrentPassword(e.target.value)}
                     className="w-full border border-border-main rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent bg-slate-50 focus:bg-white transition-all font-medium text-primary"
                   />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[11px] font-bold text-text-sub uppercase ml-1">Mật khẩu mới</label>
                   <input 
                     type="password"
                     value={newPassword}
                     onChange={e => setNewPassword(e.target.value)}
                     className="w-full border border-border-main rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent bg-slate-50 focus:bg-white transition-all font-medium text-primary"
                   />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[11px] font-bold text-text-sub uppercase ml-1">Xác nhận mật khẩu mới</label>
                   <input 
                     type="password"
                     value={confirmPassword}
                     onChange={e => setConfirmPassword(e.target.value)}
                     className="w-full border border-border-main rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent bg-slate-50 focus:bg-white transition-all font-medium text-primary"
                   />
                 </div>

                 <button 
                   type="submit"
                   disabled={savingPassword}
                   className="mt-6 flex items-center justify-center gap-2 bg-primary hover:bg-slate-800 text-white w-full py-3.5 rounded-xl font-bold transition-all disabled:opacity-50"
                 >
                   <Save className="w-4 h-4" /> 
                   {savingPassword ? 'Đang lưu...' : 'Cập nhật mật khẩu'}
                 </button>
               </form>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
