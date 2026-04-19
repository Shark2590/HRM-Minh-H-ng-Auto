import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Database, Shield, Globe, Users, Save, CheckCircle2, ChevronRight, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { Employee, Role } from '../types';
import { employeeService } from '../lib/services';
import { motion, AnimatePresence } from 'motion/react';

const PERMISSIONS_LIST = [
  { id: 'view_dashboard', name: 'Xem Báo cáo Tổng quan' },
  { id: 'manage_employees', name: 'Quản lý Nhân sự', desc: 'Thêm, sửa, xóa hồ sơ nhân viên, chức vụ, bộ phận' },
  { id: 'manage_attendance', name: 'Quản lý Điểm danh', desc: 'Kiểm duyệt chấm công, xếp ca, quản lý ngày phép' },
  { id: 'manage_payroll', name: 'Quản lý Lương', desc: 'Chốt lương, thưởng phạt, bảng lương' },
  { id: 'manage_settings', name: 'Thiết lập Hệ thống', desc: 'Toàn quyền thay đổi cài đặt hệ thống' }
];

const ROLES: { id: Role, label: string, color: string }[] = [
  { id: 'admin', label: 'Quản trị viên (Admin)', color: 'bg-danger text-white border-danger' },
  { id: 'manager', label: 'Trưởng bộ phận (Manager)', color: 'bg-accent text-white border-accent' },
  { id: 'staff', label: 'Nhân viên (Staff)', color: 'bg-slate-100 text-text-sub border-slate-200' },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'general' | 'permissions'>('general');

  // Permission State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [tempRole, setTempRole] = useState<Role>('staff');
  const [tempPerms, setTempPerms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // General Settings State
  const [lateMessage, setLateMessage] = useState('');
  const [locLat, setLocLat] = useState<number | ''>('');
  const [locLng, setLocLng] = useState<number | ''>('');
  const [locRadius, setLocRadius] = useState<number>(200);
  const [savingGeneral, setSavingGeneral] = useState(false);

  useEffect(() => {
    if (activeTab === 'permissions') {
      fetchData();
    } else if (activeTab === 'general') {
      import('../lib/services').then(mod => {
        mod.companySettingsService.getById('general').then((set) => {
          if (set) {
            setLateMessage(set.lateCheckInMessage || '');
            if (set.allowedLocation) {
              setLocLat(set.allowedLocation.lat);
              setLocLng(set.allowedLocation.lng);
              setLocRadius(set.allowedLocation.radius);
            }
          }
        });
      });
    }
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const emps = await employeeService.getAll();
      setEmployees(emps);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEmployee = (emp: Employee) => {
    setSelectedEmp(emp);
    setTempRole(emp.role || 'staff');
    setTempPerms(emp.permissions || []);
  };

  const handleTogglePerm = (permId: string) => {
    setTempPerms(prev => prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]);
  };

  const handleRoleChange = (r: Role) => {
    setTempRole(r);
    // Auto preset permissions based on role
    if (r === 'admin') {
      setTempPerms(PERMISSIONS_LIST.map(p => p.id));
    } else if (r === 'staff') {
      setTempPerms([]);
    } else if (r === 'manager') {
      setTempPerms(['view_dashboard', 'manage_employees', 'manage_attendance']);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedEmp) return;
    setSaving(true);
    try {
      await employeeService.update(selectedEmp.id, {
        role: tempRole,
        permissions: tempPerms
      });
      alert('Đã cập nhật phân quyền thành công!');
      await fetchData();
    } catch (e) {
      alert('Có lỗi xảy ra.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGeneralSettings = async () => {
    setSavingGeneral(true);
    try {
      const { companySettingsService } = await import('../lib/services');
      const data: any = { id: 'general', lateCheckInMessage: lateMessage };
      if (locLat !== '' && locLng !== '') {
         data.allowedLocation = { lat: Number(locLat), lng: Number(locLng), radius: Number(locRadius) || 200 };
      }
      await companySettingsService.create(data, 'general');
      alert('Đã lưu thiết lập chung thành công!');
    } catch (e) {
      alert('Có lỗi xảy ra khi lưu thiết lập chung.');
    } finally {
      setSavingGeneral(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-border-main shadow-sm overflow-hidden animate-in fade-in duration-500">
      {/* Header & Tabs */}
      <div className="border-b border-border-main">
         <div className="p-6 pb-4">
            <h1 className="text-xl font-black text-primary uppercase">Thiết lập chung</h1>
            <p className="text-sm text-text-sub mt-1">Cấu hình hệ thống và quản lý phân quyền</p>
         </div>
         <div className="flex px-6 gap-6">
            <button
               onClick={() => setActiveTab('general')}
               className={cn(
                  "py-3 font-bold uppercase text-xs tracking-wider border-b-2 transition-all",
                  activeTab === 'general' ? "border-accent text-accent" : "border-transparent text-text-sub hover:text-primary"
               )}
            >
               Hệ thống & Chung
            </button>
            <button
               onClick={() => setActiveTab('permissions')}
               className={cn(
                  "py-3 font-bold uppercase text-xs tracking-wider border-b-2 transition-all flex items-center gap-2",
                  activeTab === 'permissions' ? "border-accent text-accent" : "border-transparent text-text-sub hover:text-primary"
               )}
            >
               <Shield className="w-4 h-4" />
               Phân quyền User
            </button>
         </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-50 relative p-6">
         {activeTab === 'general' ? (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-primary p-10 rounded-2xl text-white text-center space-y-4 shadow-xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
                 <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/20 rounded-full -ml-16 -mb-16"></div>
                 
                 <SettingsIcon className="w-10 h-10 mx-auto text-accent mb-4 relative z-10" />
                 <h2 className="text-2xl font-black uppercase tracking-tighter relative z-10">Phiên bản 1.2.0 (Stable)</h2>
                 <p className="text-slate-400 max-w-md mx-auto italic font-medium relative z-10 text-sm">
                   HR Studio Dashboard hiện đang hoạt động bình thường.
                 </p>
              </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-white p-6 rounded-xl border border-border-main shadow-sm flex flex-col justify-between col-span-1 md:col-span-2 space-y-8">
                    {/* Setup Late Message */}
                    <div>
                       <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                             <CheckCircle2 className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                             <h4 className="text-base font-bold text-primary">Thông báo đi muộn</h4>
                             <p className="text-[11px] text-text-sub font-medium">Hiển thị khi nhân viên chấm công muộn hơn giờ quy định.</p>
                          </div>
                       </div>
                       <textarea
                         value={lateMessage}
                         onChange={(e) => setLateMessage(e.target.value)}
                         placeholder="Nhập thông báo đi muộn... VD: Bạn đã chấm công muộn, vui lòng liên hệ quản lý để trình bày lý do."
                         className="w-full bg-slate-50 border border-border-main rounded-md px-4 py-3 focus:bg-white focus:ring-1 focus:ring-accent outline-none transition-all text-sm font-medium h-24 resize-none"
                       />
                    </div>

                    {/* Setup Location */}
                    <div className="pt-6 border-t border-border-main">
                       <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                             <Globe className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                             <h4 className="text-base font-bold text-primary">Tọa độ công ty (Chấm công GPS)</h4>
                             <p className="text-[11px] text-text-sub font-medium">Nếu thiết lập, nhân viên phải ở phạm vi quy định mới chấm công được.</p>
                          </div>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                             <label className="block text-[10px] font-black uppercase text-text-sub mb-1">Vĩ độ (Latitude)</label>
                             <input 
                               type="number"
                               value={locLat}
                               onChange={e => setLocLat(e.target.value ? Number(e.target.value) : '')}
                               placeholder="VD: 21.028511"
                               className="w-full bg-slate-50 border border-border-main rounded-md px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-accent"
                             />
                          </div>
                          <div>
                             <label className="block text-[10px] font-black uppercase text-text-sub mb-1">Kinh độ (Longitude)</label>
                             <input 
                               type="number"
                               value={locLng}
                               onChange={e => setLocLng(e.target.value ? Number(e.target.value) : '')}
                               placeholder="VD: 105.804817"
                               className="w-full bg-slate-50 border border-border-main rounded-md px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-accent"
                             />
                          </div>
                          <div>
                             <label className="block text-[10px] font-black uppercase text-text-sub mb-1">Thiết lập lấy vị trí hiện tại</label>
                             <button
                               onClick={() => {
                                  if ('geolocation' in navigator) {
                                     navigator.geolocation.getCurrentPosition((pos) => {
                                        setLocLat(pos.coords.latitude);
                                        setLocLng(pos.coords.longitude);
                                     }, () => alert('Lỗi lấy vị trí. Vui lòng cho phép trình duyệt truy cập định vị.'));
                                  }
                               }}
                               className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2.5 rounded-md transition-colors text-xs"
                             >
                                Lấy tọa độ hiện tại
                             </button>
                          </div>
                       </div>
                    </div>

                    <div className="mt-4 text-right pt-6">
                       <button
                         onClick={handleSaveGeneralSettings}
                         disabled={savingGeneral}
                         className="bg-accent text-white font-bold px-6 py-2.5 rounded-md hover:bg-blue-600 transition-all text-xs uppercase tracking-tight shadow-sm disabled:opacity-50"
                       >
                         {savingGeneral ? 'Đang lưu...' : 'Lưu lại tất cả'}
                       </button>
                    </div>
                 </div>

                 <div className="bg-white p-6 rounded-xl border border-border-main shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                       <Database className="w-6 h-6 text-accent" />
                    </div>
                    <h4 className="text-base font-bold text-primary mb-1">Dữ liệu & Đồng bộ</h4>
                    <p className="text-xs text-text-sub font-medium mb-4">Cấu hình kết nối Firebase và backup dữ liệu định kỳ mỗi tháng.</p>
                    <button className="text-accent text-xs font-bold uppercase hover:underline">Thiết lập ngay</button>
                 </div>

                 <div className="bg-white p-6 rounded-xl border border-border-main shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-4">
                       <Globe className="w-6 h-6 text-warning" />
                    </div>
                    <h4 className="text-base font-bold text-primary mb-1">Thiết lập vùng</h4>
                    <p className="text-xs text-text-sub font-medium mb-4">Ngôn ngữ hiển thị (Đang chọn: Tiếng Việt), định dạng tiền tệ và múi giờ.</p>
                    <button className="text-accent text-xs font-bold uppercase hover:underline">Thiết lập ngay</button>
                 </div>
               </div>
            </div>
         ) : (
            <div className="max-w-6xl mx-auto h-full flex flex-col lg:flex-row gap-6">
               
               {/* Left: User List */}
               <div className="w-full lg:w-1/3 bg-white border border-border-main rounded-xl flex flex-col h-[600px] shadow-sm">
                  <div className="p-4 border-b border-border-main bg-slate-50 rounded-t-xl">
                     <h3 className="font-bold text-primary uppercase text-sm flex items-center gap-2">
                        <Users className="w-4 h-4 text-text-sub" /> Danh sách nhân sự
                     </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                     {loading ? (
                        <p className="text-center text-sm text-slate-400 py-10">Đang tải...</p>
                     ) : employees.map(emp => (
                        <button
                           key={emp.id}
                           onClick={() => handleSelectEmployee(emp)}
                           className={cn(
                              "w-full text-left p-3 rounded-lg border-2 transition-all flex items-center justify-between group",
                              selectedEmp?.id === emp.id ? "border-accent bg-blue-50/50" : "border-transparent hover:border-slate-200"
                           )}
                        >
                           <div>
                              <div className={cn("text-sm font-bold", selectedEmp?.id === emp.id ? "text-accent" : "text-primary")}>{emp.name}</div>
                              <div className="text-[10px] uppercase font-mono text-text-sub mt-0.5">{emp.email || emp.id}</div>
                           </div>
                           {emp.role === 'admin' && <Shield className="w-4 h-4 text-danger" />}
                           {emp.role === 'manager' && <Shield className="w-4 h-4 text-warning" />}
                        </button>
                     ))}
                  </div>
               </div>

               {/* Right: Permissions Config */}
               <div className="flex-1 bg-white border border-border-main rounded-xl flex flex-col h-[600px] shadow-sm">
                  {selectedEmp ? (
                     <div className="flex flex-col h-full">
                        <div className="p-6 border-b border-border-main flex justify-between items-start">
                           <div>
                              <h2 className="text-lg font-black text-primary mb-1">Cấu hình: {selectedEmp.name}</h2>
                              <p className="text-xs text-text-sub">Thay đổi vai trò và phân quyền tương ứng của tài khoản này trên hệ thống.</p>
                           </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                           
                           {/* Role Selection */}
                           <div className="space-y-4">
                              <h3 className="text-xs font-black text-primary uppercase tracking-widest">1. Vai trò tài khoản (Role)</h3>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                 {ROLES.map(role => (
                                    <button
                                       key={role.id}
                                       onClick={() => handleRoleChange(role.id)}
                                       className={cn(
                                          "p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden group",
                                          tempRole === role.id ? "border-accent ring-2 ring-accent/20 bg-blue-50/30" : "border-slate-100 hover:border-slate-300"
                                       )}
                                    >
                                       {tempRole === role.id && <div className="absolute top-0 right-0 p-1.5 bg-accent text-white rounded-bl-lg"><CheckCircle2 className="w-4 h-4" /></div>}
                                       <div className={cn(
                                          "inline-block px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider mb-2",
                                          role.color
                                       )}>
                                          {role.id}
                                       </div>
                                       <div className="font-bold text-sm text-primary">{role.label}</div>
                                    </button>
                                 ))}
                              </div>
                           </div>

                           {/* Permissions Detail */}
                           <div className="space-y-4">
                              <div className="flex justify-between items-end">
                                 <h3 className="text-xs font-black text-primary uppercase tracking-widest">2. Chi tiết quyền hạn (Permissions)</h3>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                 {PERMISSIONS_LIST.map(perm => {
                                    const hasPerm = tempPerms.includes(perm.id);
                                    const disabled = tempRole === 'admin'; // Admin gets all by default
                                    return (
                                       <button
                                          key={perm.id}
                                          onClick={() => !disabled && handleTogglePerm(perm.id)}
                                          disabled={disabled}
                                          className={cn(
                                             "p-4 rounded-xl border-2 text-left flex items-start gap-3 transition-all",
                                             disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-accent/40",
                                             hasPerm ? "border-accent bg-blue-50/50" : "border-slate-100"
                                          )}
                                       >
                                          <div className={cn(
                                             "w-5 h-5 rounded border mt-0.5 flex items-center justify-center shrink-0 transition-colors",
                                             hasPerm ? "bg-accent border-accent text-white" : "bg-white border-slate-300"
                                          )}>
                                             {hasPerm && <Check className="w-3.5 h-3.5" />}
                                          </div>
                                          <div>
                                             <div className="text-sm font-bold text-primary">{perm.name}</div>
                                             {perm.desc && <div className="text-[11px] text-text-sub mt-1">{perm.desc}</div>}
                                          </div>
                                       </button>
                                    );
                                 })}
                              </div>
                              {tempRole === 'admin' && (
                                 <p className="text-xs text-danger font-medium flex items-center gap-1 mt-2">
                                    <Shield className="w-3.5 h-3.5" /> Quản trị viên mặc định có tất cả quyền.
                                 </p>
                              )}
                           </div>
                        </div>

                        {/* Save Actions */}
                        <div className="p-4 border-t border-border-main bg-slate-50 flex justify-end gap-3">
                           <button 
                             onClick={handleSavePermissions}
                             disabled={saving}
                             className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
                           >
                              <Save className="w-4 h-4" />
                              {saving ? 'Đang lưu...' : 'Lưu quyền hạn'}
                           </button>
                        </div>
                     </div>
                  ) : (
                     <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center space-y-4">
                        <Shield className="w-12 h-12 text-slate-200" />
                        <div>
                           <div className="font-bold text-primary mb-1">Thiết lập quyền</div>
                           <div className="text-sm">Vui lòng chọn nhân sự bên trái để điều chỉnh phân quyền</div>
                        </div>
                     </div>
                  )}
               </div>
            </div>
         )}
      </div>
    </div>
  );
}
