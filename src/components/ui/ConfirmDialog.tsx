import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  variant = 'danger'
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variantClasses = {
    danger: 'bg-danger hover:bg-red-600',
    warning: 'bg-amber-500 hover:bg-amber-600',
    primary: 'bg-primary hover:bg-slate-800'
  };

  const iconClasses = {
    danger: 'text-danger bg-red-50',
    warning: 'text-amber-500 bg-amber-50',
    primary: 'text-primary bg-slate-50'
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-border-main"
        >
          <div className="p-8">
            <div className="flex items-start gap-4">
              <div className={cn("p-3 rounded-2xl shrink-0", iconClasses[variant])}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-primary mb-2">{title}</h3>
                <p className="text-sm text-text-sub font-medium leading-relaxed">
                  {message}
                </p>
              </div>
              <button 
                onClick={onClose}
                className="text-text-sub hover:text-primary transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 h-12 rounded-xl border-2 border-border-main text-sm font-bold text-primary hover:bg-slate-50 transition-all active:scale-95 uppercase tracking-tight"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={cn(
                  "flex-1 h-12 rounded-xl text-sm font-bold text-white transition-all active:scale-95 shadow-lg shadow-black/5 uppercase tracking-tight",
                  variantClasses[variant]
                )}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
