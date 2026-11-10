import type { CSSProperties } from 'react';
import { Icon } from './Icon';
import s from './Check.module.css';

interface CheckProps {
  checked: boolean;
  onToggle: () => void;
  label: string;
  /** 체크 색 (기본 primary) */
  color?: string;
  className?: string;
}

/** 원형 체크 (과제 완료) — 44×44 터치 영역 안에 22px 원 */
export function CheckCircle({ checked, onToggle, label, color, className }: CheckProps) {
  return <CheckBase shape="circle" {...{ checked, onToggle, label, color, className }} />;
}

/** 사각 체크 (캡처 저장 선택) */
export function CheckBox({ checked, onToggle, label, color, className }: CheckProps) {
  return <CheckBase shape="box" {...{ checked, onToggle, label, color, className }} />;
}

function CheckBase({ shape, checked, onToggle, label, color, className }: CheckProps & { shape: 'circle' | 'box' }) {
  const style = color ? ({ '--check-color': color } as CSSProperties) : undefined;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      className={[s.hit, className].filter(Boolean).join(' ')}
      style={style}
      onClick={onToggle}
    >
      <span className={[s.mark, shape === 'circle' ? s.circle : s.box, checked && s.on].filter(Boolean).join(' ')}>
        {checked && <Icon name="check" size={13} strokeWidth={3} />}
      </span>
    </button>
  );
}
