import dayjs from 'dayjs';
import { useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Chip } from '../../components/Chip';
import { Icon } from '../../components/Icon';
import { BUILDINGS, mockRoomSchedules } from '../../mocks';
import type { DayOfWeek } from '../../types';
import { findEmptyRooms, formatRegistered, isValidTime } from '../../utils/rooms';
import { todayDayOfWeek, toMinutes } from '../../utils/timetable';
import s from './RoomsTab.module.css';

const DAY_SHORT = ['월', '화', '수', '목', '금'];
const ALL = 'all';

function parseDay(v: string | null): DayOfWeek {
  const n = Number(v);
  return v !== null && Number.isInteger(n) && n >= 0 && n <= 4 ? (n as DayOfWeek) : todayDayOfWeek(dayjs().day());
}

export function RoomsTab() {
  const [params, setParams] = useSearchParams();

  // URL 쿼리(day, from, to)가 있으면 초기값으로 사용
  const query = {
    day: parseDay(params.get('day')),
    from: isValidTime(params.get('from') ?? '') ? params.get('from')! : '15:00',
    to: isValidTime(params.get('to') ?? '') ? params.get('to')! : '16:15',
  };

  const [day, setDay] = useState<DayOfWeek>(query.day);
  const [from, setFrom] = useState(query.from);
  const [to, setTo] = useState(query.to);
  const [error, setError] = useState<string>();
  const [building, setBuilding] = useState<string>(ALL);

  // TODO(Phase 4): 빈 강의실 조회 API
  const results = useMemo(
    () => findEmptyRooms(mockRoomSchedules, query.day, query.from, query.to),
    [query.day, query.from, query.to],
  );
  const shown = building === ALL ? results : results.filter((r) => r.building === building);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!isValidTime(from) || !isValidTime(to)) return setError('시간을 확인해 주세요');
    if (toMinutes(to) <= toMinutes(from)) return setError('끝나는 시간이 시작 시간보다 늦어야 해요');
    setError(undefined);
    setParams({ day: String(day), from, to }, { replace: true });
  };

  return (
    <>
      <form className={s.query} onSubmit={submit} noValidate>
        <div className={s.days} role="group" aria-label="요일">
          {DAY_SHORT.map((label, i) => (
            <button
              key={label}
              type="button"
              aria-pressed={day === i}
              className={[s.day, day === i && s.dayOn].filter(Boolean).join(' ')}
              onClick={() => setDay(i as DayOfWeek)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className={s.timeRow}>
          <label htmlFor="from" className={s.timeLabel}>
            시간
          </label>
          <input
            id="from"
            type="time"
            className={s.time}
            value={from}
            aria-invalid={!!error || undefined}
            onChange={(e) => setFrom(e.target.value)}
          />
          <span className={s.dash} aria-hidden>
            –
          </span>
          <label htmlFor="to" className="sr-only">
            종료 시간
          </label>
          <input
            id="to"
            type="time"
            className={s.time}
            value={to}
            aria-invalid={!!error || undefined}
            onChange={(e) => setTo(e.target.value)}
          />
          <button type="submit" className={s.search}>
            조회
          </button>
        </div>
        {error && (
          <span className={s.error} role="alert">
            <Icon name="alert-circle" size={14} />
            {error}
          </span>
        )}
      </form>

      <div className={`${s.chips} hscroll`}>
        <Chip variant="select" selected={building === ALL} onClick={() => setBuilding(ALL)}>
          전체
        </Chip>
        {BUILDINGS.map((b) => (
          <Chip key={b} variant="select" selected={building === b} onClick={() => setBuilding(b)}>
            {b}
          </Chip>
        ))}
      </div>

      <section className={s.results} aria-live="polite">
        <h2 className={s.count}>
          비어 있는 강의실 <span>{shown.length}</span>
        </h2>
        <p className={s.condition}>
          {DAY_SHORT[query.day]}요일 {query.from}–{query.to} 기준
        </p>
        {shown.length === 0 ? (
          <p className={s.empty}>이 시간에 비어 있는 강의실을 찾지 못했어요</p>
        ) : (
          <ul className={s.list}>
            {shown.map((r) => (
              <li key={`${r.building}-${r.name}`} className={s.room}>
                <div className={s.icon}>
                  <Icon name="door" size={20} />
                </div>
                <div className={s.roomInfo}>
                  <div className={s.roomName}>
                    {r.building} {r.name}
                  </div>
                  <div className={s.next}>
                    {r.nextClassAt ? `${query.to} 이후 다음 수업 ${r.nextClassAt}` : '오늘 남은 수업 없음'}
                  </div>
                </div>
                <span className={s.updated}>{formatRegistered(r.registeredAt)} 등록</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
