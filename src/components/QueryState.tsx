import { errorMessage } from '../api/client';
import s from './QueryState.module.css';

interface QueryStateProps {
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  loadingText?: string;
}

/** 서버 데이터 로딩·오류 안내. 둘 다 아니면 아무것도 그리지 않는다 */
export function QueryState({ loading, error, onRetry, loadingText = '불러오는 중이에요' }: QueryStateProps) {
  if (error) {
    return (
      <div className={s.box} role="alert">
        <p className={s.text}>{errorMessage(error, '정보를 불러오지 못했어요')}</p>
        {onRetry && (
          <button type="button" className={s.retry} onClick={onRetry}>
            다시 시도
          </button>
        )}
      </div>
    );
  }
  if (loading) {
    return (
      <div className={s.box} role="status" aria-live="polite">
        <span className={s.spinner} aria-hidden />
        <p className={s.text}>{loadingText}</p>
      </div>
    );
  }
  return null;
}
