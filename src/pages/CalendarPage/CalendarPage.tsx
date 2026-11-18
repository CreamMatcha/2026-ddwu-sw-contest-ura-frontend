import dayjs, { type Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Badge } from '../../components/Badge';
import { CheckCircle } from '../../components/Check';
import { Chip } from '../../components/Chip';
import { CourseDot } from '../../components/CourseDot';
import { Fab } from '../../components/Fab';
import { IconButton } from '../../components/IconButton';
import { errorMessage } from '../../api/client';
import { useSchedule, useToggleAssignment } from '../../api/queries';
import { QueryState } from '../../components/QueryState';
import { useToast } from '../../components/Toast';
import { useAppStore } from '../../store/AppStore';
import type { Assignment } from '../../types';
import { buildMonthGrid } from '../../utils/calendar';
import { tintOf, UNCATEGORIZED_COLOR } from '../../utils/color';
import { dday, formatMonthDay, WEEKDAYS } from '../../utils/date';
import { useNow } from '../../utils/useNow';
import s from './CalendarPage.module.css';

const DONE_DOT = 'var(--color-border-dashed)';
const TYPE_LABEL: Record<Assignment['type'], string> = { assignment: '과제', exam: '시험', other: '일정' };

export function CalendarPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { hiddenCourseIds, toggleCourseHidden } = useAppStore();
  const { courses, courseById, assignments, isLoading, error, refetch } = useSchedule();
  const toggle = useToggleAssignment();
  const today = useNow(60_000).startOf('day');

  // 캡처 저장 후 돌아오면 저장한 과제의 날짜를 보여 준다
  const focus = (location.state as { focusDate?: string } | null)?.focusDate;
  const [selected, setSelected] = useState<Dayjs>(() => (focus ? dayjs(focus) : dayjs()).startOf('day'));
  const [month, setMonth] = useState<Dayjs>(() => selected.startOf('month'));

  const hidden = useMemo(() => new Set(hiddenCourseIds), [hiddenCourseIds]);
  const visible = useMemo(
    () =>
      assignments
        // 미분류 일정(강의와 연결 안 됨)은 항상 보인다
        .filter((a) => !a.courseId || !hidden.has(a.courseId))
        .sort((a, b) => a.dueAt.localeCompare(b.dueAt)),
    [assignments, hidden],
  );

  const byDay = useMemo(() => {
    const map = new Map<string, typeof visible>();
    for (const a of visible) {
      const key = a.dueAt.slice(0, 10);
      map.set(key, [...(map.get(key) ?? []), a]);
    }
    return map;
  }, [visible]);

  const colorOf = (a: Assignment) => (a.courseId && courseById.get(a.courseId)?.color) || UNCATEGORIZED_COLOR;
  const nameOf = (a: Assignment) => (a.courseId && courseById.get(a.courseId)?.name) || '미분류';

  const toggleAssignment = (a: Assignment) =>
    toggle.mutate(
      { id: a.id, done: !a.done },
      { onError: (err) => toast(errorMessage(err, '완료 상태를 바꾸지 못했어요')) },
    );

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
                      <CourseDot key={a.id} size={6} color={a.done ? DONE_DOT : colorOf(a)} />
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

        {isLoading || error ? (
          <QueryState loading={isLoading} error={error} onRetry={refetch} />
        ) : items.length === 0 ? (
          <p className={s.empty}>이 날 마감인 과제가 없어요</p>
        ) : (
          <ul className={s.list}>
            {items.map((a) => {
              const color = colorOf(a);
              const d = dday(a.dueAt, a.done, today);
              return (
                <li key={a.id} className={s.item}>
                  <CheckCircle
                    className={s.check}
                    checked={a.done}
                    color={color}
                    label={`${a.title} ${a.done ? '미완료로 바꾸기' : '완료로 표시'}`}
                    onToggle={() => toggleAssignment(a)}
                  />
                  {/* 체크 버튼을 뺀 나머지 영역을 누르면 과제 상세로 */}
                  <Link to={`/assignments/${a.id}`} className={s.link}>
                    <div className={s.body}>
                      <div className={[s.title, a.done && s.done].filter(Boolean).join(' ')}>{a.title}</div>
                      <div className={s.meta}>
                        <CourseDot color={color} size={8} />
                        {nameOf(a)} · {a.hasTime ? `${dayjs(a.dueAt).format('HH:mm')} 마감` : TYPE_LABEL[a.type]}
                      </div>
                    </div>
                    <Badge variant="dday" urgent={d.urgent}>
                      {d.label}
                    </Badge>
                  </Link>
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
