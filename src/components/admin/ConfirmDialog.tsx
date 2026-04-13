"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message }: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="border border-[var(--cyber-border)] bg-[var(--cyber-panel-dark)] text-[var(--cyber-text)] sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="font-mono text-sm uppercase tracking-[2px] text-[var(--cyber-danger)]">
            {title}
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[var(--cyber-muted)] leading-relaxed">
            {message}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-row justify-end gap-3 border-t border-[var(--cyber-border)] bg-transparent pt-4">
          <button type="button" className="cyber-btn-sm accent" onClick={onClose}>
            CANCEL
          </button>
          <button type="button" className="cyber-btn-sm danger" onClick={onConfirm}>
            CONFIRM
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
