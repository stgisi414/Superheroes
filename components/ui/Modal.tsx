
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose} // Close on backdrop click
    >
      <div 
        className="bg-slate-800 p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal content
      >
        <div className="flex justify-between items-center mb-4">
          {title && <h2 className="text-2xl font-semibold text-slate-100 font-orbitron">{title}</h2>}
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 text-2xl"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
    