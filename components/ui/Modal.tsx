
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Content */}
      <div className="relative bg-white rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom sm:zoom-in duration-300 max-h-[92vh] flex flex-col">
        {/* Mobile Handle */}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-3 mb-1 sm:hidden" />
        
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-orange-50/50 to-white">
          <h3 className="text-lg sm:text-xl font-black text-amber-950 italic tracking-tight">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5 sm:p-8 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
