import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton } from './IconButton';
import s from './PageHeader.module.css';

type PageHeaderProps =
  | {
      /** 탭 화면: 22px 큰 제목 + 우측 액션 */
      variant: 'title';
      title: string;
      eyebrow?: string;
      actions?: ReactNode;
      children?: ReactNode;
    }
  | {
      /** 상세 화면: 뒤로 + 18px 제목 + 부제 */
      variant: 'back';
      title: string;
      subtitle?: string;
      backTo: string;
      actions?: ReactNode;
    };

export function PageHeader(props: PageHeaderProps) {
  const navigate = useNavigate();

  if (props.variant === 'title') {
    return (
      <header className={s.titleHeader}>
        <div className={s.titleRow}>
          <div>
            {props.eyebrow && <p className={s.eyebrow}>{props.eyebrow}</p>}
            <h1 className={s.title}>{props.title}</h1>
          </div>
          {props.actions && <div className={s.actions}>{props.actions}</div>}
        </div>
        {props.children}
      </header>
    );
  }

  return (
    <header className={s.backHeader}>
      <IconButton icon="chevron-left" aria-label="뒤로" onClick={() => navigate(props.backTo)} />
      <div className={s.backText}>
        <h1 className={s.header}>{props.title}</h1>
        {props.subtitle && <p className={s.subtitle}>{props.subtitle}</p>}
      </div>
      {props.actions && <div className={s.backActions}>{props.actions}</div>}
    </header>
  );
}
