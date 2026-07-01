import React from 'react';
import Modal from './Modal';
import { AlertTriangle, Loader2 } from 'lucide-react';

const ConfirmDialog = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Are you sure?", 
    message = "This action cannot be undone.",
    confirmText = "Delete",
    variant = "destructive",
    isLoading = false
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <div className="space-y-6">
                <div className="flex items-start gap-4">
                    <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${variant === 'destructive' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <p className="text-muted-foreground leading-relaxed">
                            {message}
                        </p>
                    </div>
                </div>
                
                <div className="flex gap-3 justify-end">
                    <button 
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-xl font-semibold bg-secondary hover:bg-secondary/80 transition-all text-sm"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold text-white shadow-lg transition-all text-sm ${variant === 'destructive' ? 'bg-destructive shadow-destructive/20 hover:bg-destructive/90' : 'bg-primary shadow-primary/20 hover:bg-primary/90'}`}
                    >
                        {isLoading && <Loader2 className="animate-spin" size={16} />}
                        {confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmDialog;
