import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Award } from 'lucide-react';
import { salesBonusService } from '../../lib/services';
import { SalesBonusConfig } from '../../types';
import { formatCurrency } from '../../lib/utils';

export default function SalesBonus() {
  const [configs, setConfigs] = useState<SalesBonusConfig[]>([]);
  const [newConfig, setNewConfig] = useState<Partial<SalesBonusConfig>>({
    minSales: 0,
    maxSales: 0,
    bonusRate: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const data = await salesBonusService.getAll();
    setConfigs(data);
  };

  const handleAdd = async () => {
    if (!newConfig.maxSales || (newConfig.maxSales <= (newConfig.minSales || 0))) {
      alert('Doanh số tối đa phải lớn hơn doanh số tối thiểu');
      return;
    }
    await salesBonusService.create(newConfig as SalesBonusConfig);
    setNewConfig({ minSales: 0, maxSales: 0, bonusRate: 0 });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa mức thưởng này?')) {
      await salesBonusService.delete(id);
      fetchData();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl border border-border-main shadow-sm flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b border-dashed border-border-main pb-4">
           <div className="p-2 bg-primary rounded-lg">
              <Award className="text-white w-5 h-5" />
           </div>
           <h3 className="text-sm font-bold text-primary uppercase">Thiết lập thưởng doanh số</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-text-sub uppercase ml-1">Doanh số tối thiểu (VNĐ)</label>
            <input 
              type="number"
              placeholder="0"
              value={newConfig.minSales}
              onChange={e => setNewConfig({ ...newConfig, minSales: Number(e.target.value) })}
              className="w-full bg-slate-50 border border-border-main rounded-md px-4 py-2 focus:bg-white focus:ring-1 focus:ring-accent outline-none transition-all text-sm font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-text-sub uppercase ml-1">Doanh số tối đa (VNĐ)</label>
            <input 
              type="number"
              placeholder="999,999,999"
              value={newConfig.maxSales}
              onChange={e => setNewConfig({ ...newConfig, maxSales: Number(e.target.value) })}
              className="w-full bg-slate-50 border border-border-main rounded-md px-4 py-2 focus:bg-white focus:ring-1 focus:ring-accent outline-none transition-all text-sm font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-text-sub uppercase ml-1">Tỷ lệ thưởng (%)</label>
            <input 
              type="number"
              step="0.01"
              placeholder="0.00"
              value={newConfig.bonusRate}
              onChange={e => setNewConfig({ ...newConfig, bonusRate: Number(e.target.value) })}
              className="w-full bg-slate-50 border border-border-main rounded-md px-4 py-2 focus:bg-white focus:ring-1 focus:ring-accent outline-none transition-all text-sm font-medium"
            />
          </div>
          <div className="flex items-end">
            <button 
              onClick={handleAdd}
              className="w-full py-2.5 bg-primary text-white font-bold rounded-md hover:bg-slate-800 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest shadow-sm"
            >
              <Plus className="w-4 h-4" /> Thêm mức
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border-main overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-border-main">
            <tr>
              <th className="px-6 py-4 text-[11px] font-extrabold text-text-sub uppercase tracking-wider">Từ (VNĐ)</th>
              <th className="px-6 py-4 text-[11px] font-extrabold text-text-sub uppercase tracking-wider">Đến (VNĐ)</th>
              <th className="px-6 py-4 text-[11px] font-extrabold text-text-sub uppercase tracking-wider text-center">Tỷ lệ (%)</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-main text-sm font-medium">
            {configs.sort((a,b) => a.minSales - b.minSales).map(config => (
              <tr key={config.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4 text-primary font-bold">{formatCurrency(config.minSales)}</td>
                <td className="px-6 py-4 text-primary font-bold">{formatCurrency(config.maxSales)}</td>
                <td className="px-6 py-4 text-center">
                   <span className="px-2 py-0.5 bg-blue-50 text-accent rounded border border-blue-100 text-[10px] font-bold">
                      {config.bonusRate}%
                   </span>
                </td>
                <td className="px-6 py-4 text-right">
                   <button 
                     onClick={() => handleDelete(config.id)}
                     className="p-1.5 text-text-sub hover:text-danger transition-colors"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </td>
              </tr>
            ))}
            {configs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-text-sub font-medium italic">
                  Chưa có thiết lập thưởng doanh số nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
