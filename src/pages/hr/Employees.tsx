import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit2,
  Trash2, 
  Mail, 
  Phone, 
  Building2, 
  UserPlus
} from 'lucide-react';
import { employeeService, departmentService, jobTitleService } from '../../lib/services';
import { Employee, Department, JobTitle } from '../../types';
import { cn } from '../../lib/utils';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function Employees({ onAddEmployee, onEditEmployee }: { onAddEmployee: () => void, onEditEmployee: (id: string) => void }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [emps, depts, jobs] = await Promise.all([
        employeeService.getAll(),
        departmentService.getAll(),
        jobTitleService.getAll()
      ]);
      setEmployees(emps);
      setDepartments(depts);
      setJobTitles(jobs);
    } catch (error) {
      console.error('Error fetching employee list:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await employeeService.delete(deleteId);
        setDeleteId(null);
        fetchData();
      } catch (error) {
        console.error('Error deleting employee:', error);
        alert('Lỗi khi xóa nhân viên');
      }
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-border-main shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-primary rounded-lg text-white">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-primary uppercase">Danh sách nhân viên</h1>
            <p className="text-[11px] font-bold text-text-sub uppercase">Tổng số {employees.length} nhân sự</p>
          </div>
        </div>
        <button 
          onClick={onAddEmployee}
          className="bg-accent text-white px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-bold uppercase transition-all hover:bg-blue-600 shadow-sm active:scale-95"
        >
          <UserPlus className="w-4 h-4" /> Thêm nhân viên
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-border-main shadow-sm flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub" />
          <input 
            type="text"
            placeholder="Tìm theo tên, mã NV, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-border-main rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-accent transition-all"
          />
        </div>
      </div>

      {/* Employees Grid/List */}
      <div className="bg-white rounded-xl border border-border-main shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-50 border-b border-border-main">
              <tr>
                <th className="px-6 py-4 text-[10px] font-extrabold text-text-sub uppercase tracking-wider">Mã NV</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-text-sub uppercase tracking-wider">Họ tên</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-text-sub uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-text-sub uppercase tracking-wider">Số điện thoại</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-text-sub uppercase tracking-wider">Phòng ban</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-text-sub uppercase tracking-wider">Chức vụ</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-text-sub uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-text-sub uppercase tracking-wider text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-text-sub italic">Đang tải danh sách...</td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-text-sub italic">Không tìm thấy nhân viên nào.</td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const dept = departments.find(d => d.id === emp.departmentId);
                  const job = jobTitles.find(j => j.id === emp.jobTitleId);
                  
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="text-[10px] font-bold text-text-sub uppercase font-mono">{emp.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-primary whitespace-nowrap">{emp.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-text-sub whitespace-nowrap">
                          {emp.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-text-sub whitespace-nowrap">
                          {emp.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-bold text-primary italic whitespace-nowrap">
                          {dept?.name || 'Chưa phân phòng'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="text-xs text-text-sub font-medium whitespace-nowrap">
                            {job?.name || 'Chưa xét'}
                         </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase whitespace-nowrap",
                          emp.status === 'active' 
                            ? "bg-green-50 text-green-600 border border-green-100" 
                            : "bg-red-50 text-red-600 border border-red-100"
                        )}>
                          {emp.status === 'active' ? 'Đang làm' : 'Đã nghỉ'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                           <button 
                             onClick={() => onEditEmployee(emp.id)}
                             className="p-2 text-text-sub hover:text-accent hover:bg-blue-50 rounded-lg transition-all active:scale-95"
                           >
                             <Edit2 className="w-3.5 h-3.5" />
                           </button>
                           <button 
                             onClick={() => setDeleteId(emp.id)}
                             className="p-2 text-text-sub hover:text-danger hover:bg-red-50 rounded-lg transition-all active:scale-95"
                           >
                             <Trash2 className="w-3.5 h-3.5" />
                           </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa nhân viên này? Dữ liệu chấm công và lương liên quan sẽ không bị xóa nhưng nhân viên sẽ không còn xuất hiện trong danh sách."
        confirmText="Xác nhận xóa"
        cancelText="Hủy"
      />
    </div>
  );
}
