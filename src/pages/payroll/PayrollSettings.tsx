import React, { useState, useEffect } from 'react';
import { Save, Wallet, Building2, TrendingUp } from 'lucide-react';
import { departmentService, departmentSettingsService } from '../../lib/services';
import { Department, DepartmentSettings } from '../../types';

export default function PayrollSettings() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [settings, setSettings] = useState<Record<string, DepartmentSettings>>({});

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

  const fetchData = async () => {
    const depts = await departmentService.getAll();
    setDepartments(depts);
    
    const loadedSettings: Record<string, DepartmentSettings> = {};
    for (const d of depts) {
      const s = await departmentSettingsService.getByMonthAndDept(currentMonth, d.id);
      if (s) {
        loadedSettings[d.id] = s;
      } else {
        loadedSettings[d.id] = {
          id: `${currentMonth}_${d.id}`,
          month: currentMonth,
          departmentId: d.id,
          revenue: 0,
          kpiBonus: d.kpiBonus || 0,
          tetBonusAmount: 0
        };
      }
    }
    setSettings(loadedSettings);
  };

  const handleSave = async (deptId: string) => {
    const s = settings[deptId];
    await departmentSettingsService.create(s, s.id);
    alert(`Đã lưu thiết lập cho phòng ${departments.find(d => d.id === deptId)?.name}`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-border-main shadow-sm flex items-center justify-between">
         <h2 className="text-sm font-bold text-primary uppercase">Thiết lập tham số lương theo tháng</h2>
         <input 
           type="month"
           value={currentMonth}
           onChange={e => setCurrentMonth(e.target.value)}
           className="border border-border-main rounded-md px-3 py-1.5 font-bold text-primary outline-none focus:ring-1 focus:ring-accent bg-slate-50 text-xs"
         />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {departments.map(dept => {
           const s = settings[dept.id] || {
             id: `${currentMonth}_${dept.id}`,
             month: currentMonth,
             departmentId: dept.id,
             revenue: 0,
             kpiBonus: dept.kpiBonus || 0,
             tetBonusAmount: 100000
           } as DepartmentSettings;
           return (
             <div key={dept.id} className="bg-white p-6 rounded-xl border border-border-main shadow-sm flex flex-col hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Building2 className="text-accent w-5 h-5" />
                   </div>
                   <div>
                      <h4 className="text-sm font-bold text-primary uppercase">{dept.name}</h4>
                      <p className="text-[10px] font-bold text-text-sub uppercase">KPI & Quỹ thưởng tháng</p>
                   </div>
                </div>

                <div className="flex-1 space-y-5 mb-8">
                   <div className="form-group">
                      <label className="block text-[11px] font-bold text-text-sub uppercase mb-1.5 ml-1">Doanh số thực tế (VNĐ)</label>
                      <input 
                        type="number"
                        value={s.revenue}
                        onChange={e => setSettings(prev => ({ ...prev, [dept.id]: { ...s, revenue: Number(e.target.value) } }))}
                        className="w-full bg-slate-50 border border-border-main rounded-md px-4 py-2.5 focus:bg-white focus:ring-1 focus:ring-accent outline-none transition-all font-mono font-bold text-sm"
                      />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="form-group">
                        <label className="block text-[11px] font-bold text-text-sub uppercase mb-1.5 ml-1">Hệ số KPI (%)</label>
                        <input 
                          type="number"
                          value={s.kpiBonus}
                          onChange={e => setSettings(prev => ({ ...prev, [dept.id]: { ...s, kpiBonus: Number(e.target.value) } }))}
                          className="w-full bg-slate-50 border border-border-main rounded-md px-4 py-2.5 focus:bg-white transition-all font-mono font-bold text-sm outline-none"
                        />
                      </div>
                      <div className="form-group">
                        <label className="block text-[11px] font-bold text-text-sub uppercase mb-1.5 ml-1">Thưởng Tết/th</label>
                        <input 
                          type="number"
                          value={s.tetBonusAmount || 100000}
                          onChange={e => setSettings(prev => ({ ...prev, [dept.id]: { ...s, tetBonusAmount: Number(e.target.value) } }))}
                          className="w-full bg-slate-50 border border-border-main rounded-md px-4 py-2.5 focus:bg-white transition-all font-mono font-bold text-sm outline-none"
                        />
                      </div>
                   </div>
                </div>

                <button 
                  onClick={() => handleSave(dept.id)}
                  className="w-full py-3 bg-accent text-white font-bold rounded-md hover:bg-blue-600 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-tight"
                >
                   <Save className="w-3.5 h-3.5" />
                   Cập nhật tham số tháng {currentMonth}
                </button>
             </div>
           );
         })}
      </div>
    </div>
  );
}
