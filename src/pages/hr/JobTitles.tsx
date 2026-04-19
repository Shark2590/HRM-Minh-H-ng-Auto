import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, Briefcase } from 'lucide-react';
import { jobTitleService } from '../../lib/services';
import { JobTitle } from '../../types';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function JobTitles() {
  const [items, setItems] = useState<JobTitle[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({ name: '', responsibilityBonus: 0 });
  const [editBuffer, setEditBuffer] = useState<Partial<JobTitle>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const data = await jobTitleService.getAll();
    setItems(data);
  };

  const handleAdd = async () => {
    if (!newItem.name) return;
    await jobTitleService.create({ ...newItem } as JobTitle);
    setNewItem({ name: '', responsibilityBonus: 0 });
    fetchItems();
  };

  const handleUpdate = async (id: string) => {
    await jobTitleService.update(id, editBuffer);
    setEditingId(null);
    fetchItems();
  };

  const handleDelete = async () => {
    if (deleteId) {
      await jobTitleService.delete(deleteId);
      setDeleteId(null);
      fetchItems();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-border-main shadow-sm flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b border-dashed border-border-main pb-4">
           <div className="p-2 bg-primary rounded-lg">
              <Briefcase className="text-white w-5 h-5" />
           </div>
           <h3 className="text-sm font-bold text-primary uppercase">Thêm chức danh mới</h3>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[240px] space-y-1.5">
            <label className="text-[11px] font-bold text-text-sub uppercase ml-1">Tên chức danh</label>
            <input 
              placeholder="VD: Trưởng phòng"
              value={newItem.name}
              onChange={e => setNewItem({ ...newItem, name: e.target.value })}
              className="w-full border border-border-main rounded-md px-4 py-2 focus:ring-1 focus:ring-accent outline-none text-sm bg-slate-50 transition-all font-medium"
            />
          </div>
          <div className="w-40 space-y-1.5">
            <label className="text-[11px] font-bold text-text-sub uppercase ml-1">Phụ cấp (%)</label>
            <input 
              type="number"
              placeholder="5"
              value={newItem.responsibilityBonus}
              onChange={e => setNewItem({ ...newItem, responsibilityBonus: Number(e.target.value) })}
              className="w-full border border-border-main rounded-md px-4 py-2 focus:ring-1 focus:ring-accent outline-none text-sm bg-slate-50 transition-all font-medium"
            />
          </div>
          <div className="flex items-end">
            <button 
              onClick={handleAdd}
              className="bg-accent text-white font-bold h-[38px] px-6 rounded-md hover:bg-blue-600 transition-all flex items-center gap-2 text-xs uppercase tracking-tight shadow-sm"
            >
              <Plus className="w-4 h-4" /> Thêm mới
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border-main shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-border-main">
            <tr>
              <th className="px-6 py-4 text-[11px] font-extrabold text-text-sub uppercase tracking-wider">Tên chức danh</th>
              <th className="px-6 py-4 text-[11px] font-extrabold text-text-sub uppercase tracking-wider">Phụ cấp trách nhiệm</th>
              <th className="px-6 py-4 text-[11px] font-extrabold text-text-sub uppercase tracking-wider text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-main text-sm font-medium">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4 font-bold text-primary">
                  {editingId === item.id ? (
                    <input 
                      value={editBuffer.name || item.name}
                      onChange={e => setEditBuffer({ ...editBuffer, name: e.target.value })}
                      className="border border-accent rounded px-3 py-1 outline-none bg-white text-sm font-normal"
                    />
                  ) : (
                    item.name
                  )}
                </td>
                <td className="px-6 py-4 text-text-sub font-mono font-bold">
                  {editingId === item.id ? (
                    <input 
                      type="number"
                      value={editBuffer.responsibilityBonus ?? item.responsibilityBonus}
                      onChange={e => setEditBuffer({ ...editBuffer, responsibilityBonus: Number(e.target.value) })}
                      className="w-full border border-accent rounded px-3 py-1 outline-none bg-white text-sm font-normal"
                    />
                  ) : (
                    `${item.responsibilityBonus || 0}% doanh thu`
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {editingId === item.id ? (
                    <div className="flex justify-end gap-2">
                       <button onClick={() => handleUpdate(item.id)} className="p-2 border border-green-200 text-green-600 rounded-md hover:bg-green-50 transition-all active:scale-95"><Check className="w-4 h-4" /></button>
                       <button onClick={() => setEditingId(null)} className="p-2 border border-gray-200 text-gray-400 rounded-md hover:bg-gray-50 transition-all active:scale-95"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setEditingId(item.id); setEditBuffer(item); }} className="p-2 text-text-sub hover:text-accent hover:bg-blue-50 rounded-lg transition-all active:scale-95"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteId(item.id)} className="p-2 text-text-sub hover:text-danger hover:bg-red-50 rounded-lg transition-all active:scale-95"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-text-sub font-medium italic">
                  Chưa có chức danh nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa chức danh này? Hành động này không thể hoàn tác và có thể ảnh hưởng đến thông tin của các nhân viên đang giữ chức danh này."
        confirmText="Xác nhận xóa"
        cancelText="Quay lại"
      />
    </div>
  );
}
