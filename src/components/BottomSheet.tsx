import { useEffect, useId, type ReactNode } from 'react';
import { IconButton } from './IconButton';
import s from './BottomSheet.module.css';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** 하단 탭바 위에 붙일지 */
  aboveTabBar?: boolean;
  /** 뒤쪽 화면을 어둡게 가리고 바깥을 누르면 닫기 */
  backdrop?: boolean;
  children: ReactNode;
}

export function BottomSheet({
  open,
  onClose,
  title,
  subtitle,
  aboveTabBar,
  backdrop,
  children,
}: BottomSheetProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {backdrop && <div className={s.backdrop} onClick={onClose} aria-hidden />}
      <section
        role="dialog"
        aria-modal={backdrop || undefined}
        aria-labelledby={titleId}
        className={[s.sheet, aboveTabBar ? s.aboveTab : s.bottom].join(' ')}
      >
        <div className={s.head}>
          <div>
            <h2 id={titleId} className={s.title}>
              {title}
            </h2>
            {subtitle && <p className={s.subtitle}>{subtitle}</p>}
          </div>
          <IconButton icon="close" aria-label="닫기" tone="muted" iconSize={20} className={s.close} onClick={onClose} />
        </div>
        {children}
      </section>
    </>
  );
}
