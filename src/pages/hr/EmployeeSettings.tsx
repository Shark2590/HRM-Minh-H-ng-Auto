import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Filter, Briefcase, Phone, Calendar, Trash2 } from 'lucide-react';
import { 
  employeeService, 
  departmentService, 
  jobTitleService 
} from '../../lib/services';
import { Employee, Department, JobTitle } from '../../types';
import { cn } from '../../lib/utils';

export default function EmployeeSettings() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [empList, deptList, jobList] = await Promise.all([
      employeeService.getAll(),
      departmentService.getAll(),
      jobTitleService.getAll()
    ]);
    setEmployees(empList);
    setDepartments(deptList);
    setJobTitles(jobList);
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         emp.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = !filterDept || emp.departmentId === filterDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
       <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-5 rounded-xl border border-border-main shadow-sm">
          <div className="relative w-full md:w-96 group">
             <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub group-focus-within:text-accent transition-colors" />
             <input 
               type="text" 
               placeholder="Tìm kiếm mã NV, tên..." 
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               className="w-full bg-slate-50 border border-border-main rounded-md pl-10 pr-4 py-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-accent transition-all"
             />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="relative flex-1 md:flex-none group">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-sub group-focus-within:text-accent transition-colors" />
                <select 
                   value={filterDept}
                   onChange={e => setFilterDept(e.target.value)}
                   className="pl-9 pr-8 py-2 bg-slate-50 border border-border-main rounded-md text-sm font-bold text-text-sub focus:outline-none focus:ring-1 focus:ring-accent transition-all appearance-none cursor-pointer"
                >
                   <option value="">Tất cả phòng ban</option>
                   {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
             </div>
             <a 
               href="/hr/add-employee"
               className="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-md text-xs font-bold uppercase transition-all hover:bg-slate-800 shadow-sm"
             >
                <UserPlus className="w-4 h-4" /> Thêm mới
             </a>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredEmployees.map(emp => (
             <div key={emp.id} className="bg-white p-6 rounded-xl border border-border-main shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:bg-primary/10"></div>
                
                <div className="flex flex-col gap-5">
                   <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-lg bg-slate-50 border border-border-main flex items-center justify-center text-primary font-black text-xs shadow-sm group-hover:bg-primary group-hover:text-white transition-all duration-300 uppercase">
                         {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="px-2 py-0.5 bg-slate-100 rounded border border-border-main text-[9px] font-bold text-text-sub uppercase tracking-wider">
                         {emp.id}
                      </span>
                   </div>

                   <div className="space-y-1">
                      <h4 className="text-sm font-bold text-primary truncate leading-tight uppercase">{emp.name}</h4>
                      <p className="text-[10px] font-bold text-text-sub uppercase tracking-widest">
                         {departments.find(d => d.id === emp.departmentId)?.name || '---'}
                      </p>
                   </div>

                   <div className="pt-4 border-t border-dashed border-border-main flex items-center justify-between text-[10px] font-bold text-text-sub">
                      <div className="flex items-center gap-1.5 uppercase">
                         <Briefcase className="w-3.5 h-3.5 opacity-50" />
                         {jobTitles.find(j => j.id === emp.jobTitleId)?.name || '---'}
                      </div>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[8px] uppercase",
                        emp.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                      )}>
                        {emp.status === 'active' ? 'Đang làm' : 'Đã nghỉ'}
                      </span>
                   </div>

                   <div className="flex gap-2 pt-1">
                       <div className="flex-1 bg-slate-50 p-2 rounded-lg text-center border border-border-main/50">
                          <p className="text-[8px] uppercase font-bold text-text-sub">Ngày vào</p>
                          <p className="text-[10px] font-bold text-primary">{new Date(emp.startDate).toLocaleDateString('vi-VN')}</p>
                       </div>
                       <div className="flex-1 bg-slate-50 p-2 rounded-lg text-center border border-border-main/50">
                          <p className="text-[8px] uppercase font-bold text-text-sub">SĐT</p>
                          <p className="text-[10px] font-bold text-primary">{emp.phone}</p>
                       </div>
                   </div>
                </div>
             </div>
          ))}
       </div>
    </div>
  );
}
