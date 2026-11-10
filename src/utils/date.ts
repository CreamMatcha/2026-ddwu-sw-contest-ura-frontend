import dayjs, { type Dayjs } from 'dayjs';

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;
/** 월~금 (DayOfWeek 0~4) */
export const WEEKDAY_NAMES = ['월요일', '화요일', '수요일', '목요일', '금요일'] as const;

/** "11월 7일 (토)" */
export function formatMonthDay(d: Dayjs): string {
  return `${d.month() + 1}월 ${d.date()}일 (${WEEKDAYS[d.day()]})`;
}

/** "11월 20일 (금) 10:30" — 시각이 없는 날짜(YYYY-MM-DD)는 날짜만 */
export function formatMentionedDate(at: string): string {
  const d = dayjs(at);
  return at.includes('T') ? `${formatMonthDay(d)} ${d.format('HH:mm')}` : formatMonthDay(d);
}

/** 오늘 0시 기준 남은 일수 */
export function daysUntil(dueAt: string, today: Dayjs = dayjs()): number {
  return dayjs(dueAt).startOf('day').diff(today.startOf('day'), 'day');
}

export interface DdayInfo {
  label: string;
  urgent: boolean;
}

/** D-day 배지: 0일 D-DAY / 양수 D-n / 음수 D+n / 완료. 0~2일 남고 미완료면 urgent */
export function dday(dueAt: string, done: boolean, today: Dayjs = dayjs()): DdayInfo {
  if (done) return { label: '완료', urgent: false };
  const diff = daysUntil(dueAt, today);
  const label = diff === 0 ? 'D-DAY' : diff > 0 ? `D-${diff}` : `D+${-diff}`;
  return { label, urgent: diff >= 0 && diff <= 2 };
}

/** 저장 시점: 오늘 / 어제 / n일 전 / n주 전 / YYYY.MM.DD */
export function relativeDay(iso: string, now: Dayjs = dayjs()): string {
  const diff = now.startOf('day').diff(dayjs(iso).startOf('day'), 'day');
  if (diff <= 0) return '오늘';
  if (diff === 1) return '어제';
  if (diff < 7) return `${diff}일 전`;
  if (diff < 35) return `${Math.floor(diff / 7)}주 전`;
  return dayjs(iso).format('YYYY.MM.DD');
}

/** 마지막 투표 n분 전 */
export function minutesAgo(iso: string, now: Dayjs = dayjs()): string {
  const m = Math.max(0, now.diff(dayjs(iso), 'minute'));
  return m === 0 ? '방금' : `${m}분 전`;
}

/** <input type="datetime-local"> 값 형식 */
export function toLocalInput(d: Dayjs): string {
  return d.format('YYYY-MM-DDTHH:mm');
}
