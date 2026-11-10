import dayjs from 'dayjs';
import type { DayOfWeek, EmptyRoom, RoomSchedule } from '../types';
import { overlaps, toMinutes } from './timetable';

/** 조회 조건 시간에 수업이 없는 강의실 + 그 이후 다음 수업 */
export function findEmptyRooms(
  rooms: RoomSchedule[],
  day: DayOfWeek,
  from: string,
  to: string,
): EmptyRoom[] {
  return rooms
    .filter((r) =>
      !r.classes.some((c) => c.days.includes(day) && overlaps(c.start, c.end, from, to)),
    )
    .map((r) => {
      const next = r.classes
        .filter((c) => c.days.includes(day) && toMinutes(c.start) >= toMinutes(to))
        .map((c) => c.start)
        .sort((a, b) => toMinutes(a) - toMinutes(b))[0];
      return { building: r.building, name: r.name, nextClassAt: next, registeredAt: r.registeredAt };
    });
}

/** "26.09" */
export function formatRegistered(iso: string): string {
  return dayjs(iso).format('YY.MM');
}

export function isValidTime(t: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
}
