import dayjs, { type Dayjs } from 'dayjs';
import type { Term } from './endpoints';

/**
 * 오늘 날짜 기준 학기.
 * 3~6월 1학기, 7~8월 여름학기, 9~12월 2학기, 1~2월 (전년도) 겨울학기
 */
export function currentTerm(now: Dayjs = dayjs()): Term {
  const m = now.month() + 1;
  if (m >= 3 && m <= 6) return { academicYear: now.year(), semester: '1' };
  if (m >= 7 && m <= 8) return { academicYear: now.year(), semester: 'summer' };
  if (m >= 9) return { academicYear: now.year(), semester: '2' };
  return { academicYear: now.year() - 1, semester: 'winter' };
}

/** "2026년 2학기" */
export function termLabel(term: Term): string {
  const name = { '1': '1학기', summer: '여름학기', '2': '2학기', winter: '겨울학기' }[term.semester];
  return `${term.academicYear}년 ${name}`;
}
