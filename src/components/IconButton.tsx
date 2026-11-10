import type { ButtonHTMLAttributes } from 'react';
import { Icon, type IconName } from './Icon';
import s from './IconButton.module.css';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: IconName;
  'aria-label': string;
  iconSize?: number;
  tone?: 'default' | 'muted';
}

/** 44×44 투명 아이콘 버튼 */
export function IconButton({
  icon,
  iconSize = 22,
  tone = 'default',
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={[s.button, tone === 'muted' && s.muted, className].filter(Boolean).join(' ')}
      {...rest}
    >
      <Icon name={icon} size={iconSize} />
    </button>
  );
}
