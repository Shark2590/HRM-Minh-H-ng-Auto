import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'md'
}: ModalProps) {
  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
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
          className={cn(
            "relative bg-white rounded-[2rem] shadow-2xl w-full overflow-hidden border border-border-main flex flex-col max-h-[90vh]",
            maxWidthClasses[maxWidth]
          )}
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-border-main flex items-center justify-between bg-slate-50/50">
            <h3 className="text-xl font-bold text-primary uppercase tracking-tight">{title}</h3>
            <button 
              onClick={onClose}
              className="p-2 text-text-sub hover:text-primary hover:bg-slate-200/50 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-8 overflow-y-auto">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="px-8 py-6 border-t border-border-main flex gap-3 bg-slate-50/50">
              {footer}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
