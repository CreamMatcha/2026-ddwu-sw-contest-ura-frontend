import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';

/** 주기적으로 갱신되는 현재 시각 ("n분 전", 투표 제한 해제 등) */
export function useNow(intervalMs = 30_000): Dayjs {
  const [now, setNow] = useState(() => dayjs());
  useEffect(() => {
    const t = window.setInterval(() => setNow(dayjs()), intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);
  return now;
}
