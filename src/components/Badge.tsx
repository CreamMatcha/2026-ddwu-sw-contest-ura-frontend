import type { CSSProperties, ReactNode } from 'react';
import type { CongestionLevel } from '../types';
import { CourseDot } from './CourseDot';
import s from './Badge.module.css';

export const LEVEL_LABEL: Record<CongestionLevel, string> = {
  RELAXED: '여유',
  NORMAL: '보통',
  CROWDED: '혼잡',
  UNKNOWN: '정보 없음',
};

export const LEVEL_VAR: Record<CongestionLevel, { fg: string; bg: string }> = {
  RELAXED: { fg: 'var(--color-relaxed)', bg: 'var(--color-relaxed-bg)' },
  NORMAL: { fg: 'var(--color-normal)', bg: 'var(--color-normal-bg)' },
  CROWDED: { fg: 'var(--color-crowded)', bg: 'var(--color-crowded-bg)' },
  UNKNOWN: { fg: 'var(--color-unknown)', bg: 'var(--color-unknown-bg)' },
};

type BadgeProps =
  | { variant: 'dday'; urgent: boolean; children: ReactNode }
  | { variant: 'status'; level: CongestionLevel }
  | {
      /** 과목·시험 태그. size sm = 작은 사각 배지, md = 28px 알약 */
      variant: 'tag';
      fg: string;
      bg: string;
      dot?: string;
      size?: 'sm' | 'md';
      children: ReactNode;
    };

export function Badge(props: BadgeProps) {
  if (props.variant === 'dday') {
    return <span className={[s.dday, props.urgent && s.urgent].filter(Boolean).join(' ')}>{props.children}</span>;
  }
  if (props.variant === 'status') {
    const c = LEVEL_VAR[props.level];
    return (
      <span className={s.status} style={{ color: c.fg, background: c.bg }}>
        {LEVEL_LABEL[props.level]}
      </span>
    );
  }
  const { fg, bg, dot, size = 'md', children } = props;
  const style: CSSProperties = { color: fg, background: bg };
  return (
    <span className={size === 'sm' ? s.tagSm : s.tag} style={style}>
      {dot && <CourseDot color={dot} size={8} />}
      {children}
    </span>
  );
}
