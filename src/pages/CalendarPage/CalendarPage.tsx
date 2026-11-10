import dayjs, { type Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Badge } from '../../components/Badge';
import { CheckCircle } from '../../components/Check';
import { Chip } from '../../components/Chip';
import { CourseDot } from '../../components/CourseDot';
import { Fab } from '../../components/Fab';
import { IconButton } from '../../components/IconButton';
import { useAppStore } from '../../store/AppStore';
import { buildMonthGrid } from '../../utils/calendar';
import { tintOf } from '../../utils/color';
import { dday, formatMonthDay, WEEKDAYS } from '../../utils/date';
import { useNow } from '../../utils/useNow';
import s from './CalendarPage.module.css';

const DONE_DOT = 'var(--color-border-dashed)';

export function CalendarPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { courses, courseById, assignments, hiddenCourseIds, toggleCourseHidden, toggleAssignment } = useAppStore();
  const today = useNow(60_000).startOf('day');

  // 캡처 저장 후 돌아오면 저장한 과제의 날짜를 보여 준다
  const focus = (location.state as { focusDate?: string } | null)?.focusDate;
  const [selected, setSelected] = useState<Dayjs>(() => (focus ? dayjs(focus) : dayjs()).startOf('day'));
  const [month, setMonth] = useState<Dayjs>(() => selected.startOf('month'));

  const hidden = useMemo(() => new Set(hiddenCourseIds), [hiddenCourseIds]);
  const visible = useMemo(
    () =>
      assignments
        .filter((a) => !hidden.has(a.courseId) && courseById.has(a.courseId))
        .sort((a, b) => a.dueAt.localeCompare(b.dueAt)),
    [assignments, hidden, courseById],
  );

  const byDay = useMemo(() => {
    const map = new Map<string, typeof visible>();
    for (const a of visible) {
      const key = a.dueAt.slice(0, 10);
      map.set(key, [...(map.get(key) ?? []), a]);
    }
    return map;
  }, [visible]);

  const cells = buildMonthGrid(month);
  const items = byDay.get(selected.format('YYYY-MM-DD')) ?? [];
  const remain = visible.filter(
    (a) => !a.done && dayjs(a.dueAt).isSame(month, 'month') && !dayjs(a.dueAt).isBefore(today),
  ).length;

  const moveMonth = (delta: number) => {
    const next = month.add(delta, 'month');
    setMonth(next);
    setSelected(next.isSame(today, 'month') ? today : next.startOf('month'));
  };

  const pick = (d: Dayjs) => {
    if (!d.isSame(month, 'month')) setMonth(d.startOf('month'));
    setSelected(d);
  };

  return (
    <>
      <header className={s.header}>
        <IconButton icon="chevron-left" aria-label="이전 달" onClick={() => moveMonth(-1)} />
        <h1 className={s.month} aria-live="polite">
          {month.year()}년 {month.month() + 1}월
        </h1>
        <IconButton icon="chevron-right" aria-label="다음 달" onClick={() => moveMonth(1)} />
      </header>

      <div className={`${s.chips} hscroll`}>
        {courses.map((c) => (
          <Chip
            key={c.id}
            variant="filter"
            checked={!hidden.has(c.id)}
            color={c.color}
            tint={tintOf(c.color)}
            onClick={() => toggleCourseHidden(c.id)}
          >
            {c.name}
          </Chip>
        ))}
        <Chip variant="dashed" icon="pencil" onClick={() => navigate('/courses')}>
          과목 관리
        </Chip>
      </div>

      <div className={s.calendar}>
        <div className={s.weekdays} aria-hidden>
          {WEEKDAYS.map((w, i) => (
            <span key={w} className={i === 0 ? s.sunday : undefined}>
              {w}
            </span>
          ))}
        </div>
        <div className={s.grid} role="grid" aria-label={`${month.month() + 1}월 달력`}>
          {cells.map((d) => {
            const key = d.format('YYYY-MM-DD');
            const list = byDay.get(key) ?? [];
            const inMonth = d.isSame(month, 'month');
            const isSel = d.isSame(selected, 'day');
            const isToday = d.isSame(today, 'day');
            const cls = [
              s.date,
              !inMonth && s.other,
              inMonth && d.day() === 0 && s.sunday,
              isToday && s.today,
              isSel && s.selected,
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <button
                key={key}
                type="button"
                role="gridcell"
                aria-selected={isSel}
                aria-current={isToday ? 'date' : undefined}
                aria-label={`${d.month() + 1}월 ${d.date()}일${list.length ? `, 과제 ${list.length}개` : ''}`}
                className={s.cell}
                onClick={() => pick(d)}
              >
                <span className={cls}>{d.date()}</span>
                <span className={s.dots}>
                  {inMonth &&
                    list.slice(0, 3).map((a) => (
                      <CourseDot key={a.id} size={6} color={a.done ? DONE_DOT : courseById.get(a.courseId)!.color} />
                    ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <section className={s.day} aria-labelledby="sel-day">
        <div className={s.dayHead}>
          <h2 id="sel-day" className={s.dayTitle}>
            {formatMonthDay(selected)}
          </h2>
          <span className={s.remain}>이번 달 남은 과제 {remain}개</span>
        </div>

        {items.length === 0 ? (
          <p className={s.empty}>이 날 마감인 과제가 없어요</p>
        ) : (
          <ul className={s.list}>
            {items.map((a) => {
              const c = courseById.get(a.courseId)!;
              const d = dday(a.dueAt, a.done, today);
              return (
                <li key={a.id} className={s.item}>
                  <CheckCircle
                    className={s.check}
                    checked={a.done}
                    color={c.color}
                    label={`${a.title} ${a.done ? '미완료로 바꾸기' : '완료로 표시'}`}
                    onToggle={() => toggleAssignment(a.id)}
                  />
                  <div className={s.body}>
                    <div className={[s.title, a.done && s.done].filter(Boolean).join(' ')}>{a.title}</div>
                    <div className={s.meta}>
                      <CourseDot color={c.color} size={8} />
                      {c.name} · {dayjs(a.dueAt).format('HH:mm')} 마감
                    </div>
                  </div>
                  <Badge variant="dday" urgent={d.urgent}>
                    {d.label}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Fab icon="camera" label="캡처로 추가" onClick={() => navigate('/capture')} />
    </>
  );
}
