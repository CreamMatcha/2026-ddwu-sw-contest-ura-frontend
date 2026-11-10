import { forwardRef, type InputHTMLAttributes } from 'react';
import { Icon } from './Icon';
import s from './TextField.module.css';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  id: string;
  label: string;
  /** 경고 문구. 있으면 error 상태 (primary 테두리 + error-bg) */
  error?: string;
  /** 라벨에 "(필수)" 표시 */
  requiredMark?: boolean;
  /** md: 52px 기본 / sm: 42px (카드 안 작은 입력) */
  size?: 'md' | 'sm';
  hideLabel?: boolean;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { id, label, error, requiredMark, size = 'md', hideLabel, className, ...rest },
  ref,
) {
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={[s.field, s[size], error && s.hasError, className].filter(Boolean).join(' ')}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : s.label}>
        {label}
        {requiredMark && ' (필수)'}
      </label>
      <input
        ref={ref}
        id={id}
        className={s.input}
        aria-invalid={!!error || undefined}
        aria-describedby={errorId}
        {...rest}
      />
      {error && (
        <span id={errorId} className={s.error}>
          <Icon name="alert-circle" size={14} />
          {error}
        </span>
      )}
    </div>
  );
});
