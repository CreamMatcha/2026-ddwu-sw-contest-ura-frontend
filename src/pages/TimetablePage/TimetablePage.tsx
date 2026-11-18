import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { BottomSheet } from '../../components/BottomSheet';
import { IconButton } from '../../components/IconButton';
import { PageHeader } from '../../components/PageHeader';
import { useSchedule } from '../../api/queries';
import { termLabel } from '../../api/term';
import { QueryState } from '../../components/QueryState';
import type { DayOfWeek } from '../../types';
import { WEEKDAY_NAMES } from '../../utils/date';
import { freePeriods, GRID_HEIGHT_PX, heightPx, PERIODS, topPx } from '../../utils/timetable';
import { LectureSearchSheet } from './LectureSearchSheet';
import s from './TimetablePage.module.css';

const DAYS: DayOfWeek[] = [0, 1, 2, 3, 4];
const DAY_SHORT = ['월', '화', '수', '목', '금'];

export function TimetablePage() {
  const navigate = useNavigate();
  const { term, courses, classes, courseById, isLoading, error, refetch } = useSchedule();
  const [sel, setSel] = useState<{ day: DayOfWeek; period: number } | null>(null);
  const [adding, setAdding] = useState(false);

  const selPeriod = sel ? PERIODS.find((p) => p.n === sel.period)! : null;
  const selRange = selPeriod ? `${selPeriod.start}–${selPeriod.end}` : '';

  return (
    <div className={sel ? s.withSheet : undefined}>
      <PageHeader
        variant="title"
        eyebrow={termLabel(term)}
        title="내 시간표"
        actions={
          <IconButton
            icon="plus"
            aria-label="과목 추가"
            onClick={() => {
              setAdding(true);
              setSel(null);
            }}
          />
        }
      />

      <QueryState loading={isLoading} error={error} onRetry={refetch} />
      {!isLoading && !error && classes.length === 0 && (
        <p className={s.hint}>시간표가 비어 있어요. 오른쪽 위 + 버튼으로 과목을 추가해 보세요</p>
      )}

      <div className={s.wrap}>
        <div className={s.dayHead} aria-hidden>
          <span />
          {DAY_SHORT.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className={s.grid}>
          <div className={s.col} style={{ height: GRID_HEIGHT_PX }}>
            {PERIODS.map((p) => (
              <div
                key={p.n}
                className={s.period}
                style={{ top: topPx(p.start), height: heightPx(p.start, p.end) }}
              >
                <span className={s.periodN}>{p.n}</span>
                <span className={s.periodT}>{p.start}</span>
              </div>
            ))}
          </div>

          {DAYS.map((d) => (
            <div key={d} className={`${s.col} ${s.dayCol}`} style={{ height: GRID_HEIGHT_PX }}>
              {freePeriods(classes, d).map((p) => {
                const on = sel?.day === d && sel.period === p.n;
                return (
                  <button
                    key={p.n}
                    type="button"
                    aria-label={`${WEEKDAY_NAMES[d]} ${p.n}교시 ${p.start}–${p.end} 빈 시간`}
                    aria-pressed={on}
                    className={[s.slot, on && s.slotOn].filter(Boolean).join(' ')}
                    style={{ top: topPx(p.start), height: heightPx(p.start, p.end) }}
                    onClick={() => setSel(on ? null : { day: d, period: p.n })}
                  />
                );
              })}
              {classes
                .filter((k) => k.dayOfWeek === d)
                .map((k) => {
                  const c = courseById.get(k.courseId);
                  if (!c) return null;
                  return (
                    <div
                      key={k.id}
                      className={s.block}
                      style={{ top: topPx(k.start), height: heightPx(k.start, k.end), background: c.color }}
                      title={`${c.name} · ${k.start}–${k.end} · ${k.room}`}
                    >
                      <div className={s.blockName}>{c.name}</div>
                      <div className={s.blockRoom}>{k.room}</div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
        <p className={s.hint}>빈 교시를 누르면 그 시간에 갈 수 있는 공간을 찾아볼 수 있어요</p>
      </div>

      <BottomSheet
        open={!!sel}
        onClose={() => setSel(null)}
        aboveTabBar
        title={sel ? `${WEEKDAY_NAMES[sel.day]} ${sel.period}교시 · ${selRange}` : ''}
        subtitle="수업이 없는 시간이에요. 어디로 갈까요?"
      >
        <div className={s.sheetActions}>
          <Button
            size="md"
            icon="door"
            onClick={() =>
              sel &&
              selPeriod &&
              navigate(`/spaces/rooms?day=${sel.day}&from=${selPeriod.start}&to=${selPeriod.end}`)
            }
          >
            빈 강의실 찾기
          </Button>
          <Button size="md" variant="outline" icon="sofa" onClick={() => navigate('/spaces/lounge')}>
            라운지 보기
          </Button>
        </div>
      </BottomSheet>

      <LectureSearchSheet open={adding} onClose={() => setAdding(false)} usedColors={courses.map((c) => c.color)} />
    </div>
  );
}
