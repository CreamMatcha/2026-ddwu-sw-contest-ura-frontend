import type { ClassBlock, DayOfWeek } from '../types';

/** 1시간 = 64px */
export const HOUR_PX = 64;
/** 09:00 시작 (분) */
export const DAY_START_MIN = 9 * 60;
/** 18:00 끝 (분) */
export const DAY_END_MIN = 18 * 60;
export const GRID_HEIGHT_PX = ((DAY_END_MIN - DAY_START_MIN) / 60) * HOUR_PX; // 576

export interface Period {
  n: number;
  start: string;
  end: string;
}

export const PERIODS: Period[] = [
  { n: 1, start: '09:00', end: '10:15' },
  { n: 2, start: '10:30', end: '11:45' },
  { n: 3, start: '12:00', end: '13:15' },
  { n: 4, start: '13:30', end: '14:45' },
  { n: 5, start: '15:00', end: '16:15' },
  { n: 6, start: '16:30', end: '17:45' },
];

/** "10:30" → 630 */
export function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** 시작 시각 → 그리드 top(px) */
export function topPx(start: string): number {
  return ((toMinutes(start) - DAY_START_MIN) / 60) * HOUR_PX;
}

/** 길이 → 높이(px) */
export function heightPx(start: string, end: string): number {
  return ((toMinutes(end) - toMinutes(start)) / 60) * HOUR_PX;
}

export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(aEnd) > toMinutes(bStart);
}

/** 해당 요일에 수업과 겹치지 않는 교시 */
export function freePeriods(classes: ClassBlock[], day: DayOfWeek): Period[] {
  const mine = classes.filter((c) => c.dayOfWeek === day);
  return PERIODS.filter((p) => !mine.some((c) => overlaps(c.start, c.end, p.start, p.end)));
}

/** 오늘 요일 → DayOfWeek (주말이면 월요일) */
export function todayDayOfWeek(jsDay: number): DayOfWeek {
  return (jsDay >= 1 && jsDay <= 5 ? jsDay - 1 : 0) as DayOfWeek;
}
