import { useEffect, useId, useRef } from 'react';
import { Button } from './Button';
import s from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '삭제',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className={s.backdrop} onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal
        aria-labelledby={titleId}
        className={s.dialog}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className={s.title}>
          {title}
        </h2>
        {message && <p className={s.message}>{message}</p>}
        <div className={s.actions}>
          <button ref={cancelRef} type="button" className={s.cancel} onClick={onCancel}>
            취소
          </button>
          <Button size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
