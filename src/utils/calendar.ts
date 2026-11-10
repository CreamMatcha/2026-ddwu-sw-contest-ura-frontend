import type { Dayjs } from 'dayjs';

/**
 * 월 그리드 날짜 목록 (일요일 시작).
 * 해당 월 1일의 요일부터 채우고, 필요한 만큼(보통 5~6주) 주 단위로 채운다.
 */
export function buildMonthGrid(month: Dayjs): Dayjs[] {
  const first = month.startOf('month');
  const start = first.subtract(first.day(), 'day');
  const weeks = Math.ceil((first.day() + first.daysInMonth()) / 7);
  return Array.from({ length: weeks * 7 }, (_, i) => start.add(i, 'day'));
}
