import type { CSSProperties, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import s from './Chip.module.css';

type ChipProps =
  | {
      /** 체크박스 + 과목색 테두리/배경 */
      variant: 'filter';
      checked: boolean;
      color: string;
      tint: string;
      onClick: () => void;
      children: ReactNode;
    }
  | {
      /** 선택형: soft = tint 배경 + primary 테두리 / solid = primary 채움 */
      variant: 'select';
      selected: boolean;
      tone?: 'soft' | 'solid';
      onClick: () => void;
      children: ReactNode;
    }
  | {
      /** 점선 링크형 */
      variant: 'dashed';
      icon?: IconName;
      onClick: () => void;
      children: ReactNode;
    };

export function Chip(props: ChipProps) {
  if (props.variant === 'filter') {
    const { checked, color, tint, onClick, children } = props;
    const style = {
      '--chip-color': color,
      '--chip-tint': tint,
    } as CSSProperties;
    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        className={[s.chip, s.filter, checked && s.on].filter(Boolean).join(' ')}
        style={style}
        onClick={onClick}
      >
        <span className={s.box}>{checked && <Icon name="check" size={12} strokeWidth={3} />}</span>
        {children}
      </button>
    );
  }

  if (props.variant === 'select') {
    const { selected, tone = 'soft', onClick, children } = props;
    return (
      <button
        type="button"
        aria-pressed={selected}
        className={[s.chip, s.select, selected && (tone === 'solid' ? s.solid : s.soft)]
          .filter(Boolean)
          .join(' ')}
        onClick={onClick}
      >
        {children}
      </button>
    );
  }

  const { icon, onClick, children } = props;
  return (
    <button type="button" className={[s.chip, s.dashed].join(' ')} onClick={onClick}>
      {icon && <Icon name={icon} size={14} />}
      {children}
    </button>
  );
}
