import { useEffect, useState, type FormEvent } from 'react';
import { BottomSheet } from '../../components/BottomSheet';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { useToast } from '../../components/Toast';
import { useAppStore } from '../../store/AppStore';
import type { DayOfWeek } from '../../types';
import { DAY_END_MIN, DAY_START_MIN, overlaps, toMinutes } from '../../utils/timetable';
import s from './AddClassSheet.module.css';

interface AddClassSheetProps {
  open: boolean;
  onClose: () => void;
  initialDay?: DayOfWeek;
  initialStart?: string;
  initialEnd?: string;
}

const DAY_SHORT = ['월', '화', '수', '목', '금'];

/** 수업 추가 (디자인 없음 — 과목 관리 패널 스타일을 따름) */
export function AddClassSheet({ open, onClose, initialDay, initialStart, initialEnd }: AddClassSheetProps) {
  const toast = useToast();
  const { courses, classes, courseById, addClass } = useAppStore();
  const [courseId, setCourseId] = useState('');
  const [day, setDay] = useState<DayOfWeek>(0);
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('10:15');
  const [room, setRoom] = useState('');
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!open) return;
    setCourseId((id) => (id && courseById.has(id) ? id : courses[0]?.id ?? ''));
    setDay(initialDay ?? 0);
    setStart(initialStart ?? '09:00');
    setEnd(initialEnd ?? '10:15');
    setRoom('');
    setError(undefined);
    // 열릴 때만 초기화
  }, [open]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!courseId) return setError('먼저 과목 관리에서 과목을 추가해 주세요');
    if (!start || !end || toMinutes(end) <= toMinutes(start)) return setError('끝나는 시간이 시작 시간보다 늦어야 해요');
    if (toMinutes(start) < DAY_START_MIN || toMinutes(end) > DAY_END_MIN)
      return setError('09:00–18:00 사이 수업만 넣을 수 있어요');
    const clash = classes.find((k) => k.dayOfWeek === day && overlaps(k.start, k.end, start, end));
    if (clash) return setError(`${courseById.get(clash.courseId)?.name ?? '다른'} 수업과 시간이 겹쳐요`);

    addClass({ courseId, dayOfWeek: day, start, end, room: room.trim() });
    toast('수업을 추가했어요');
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} backdrop title="수업 추가">
      <form className={s.form} onSubmit={submit} noValidate>
        <div className={s.field}>
          <label htmlFor="class-course" className={s.label}>
            과목
          </label>
          <select
            id="class-course"
            className={s.select}
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
          >
            {courses.length === 0 && <option value="">등록된 과목이 없어요</option>}
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className={s.field}>
          <span className={s.label} id="class-day">
            요일
          </span>
          <div className={s.days} role="group" aria-labelledby="class-day">
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
        </div>

        <div className={s.times}>
          <TextField id="class-start" label="시작" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          <TextField id="class-end" label="끝" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>

        <TextField
          id="class-room"
          label="강의실"
          placeholder="예: 인B301"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          error={error}
        />

        <Button type="submit" fullWidth>
          추가하기
        </Button>
      </form>
    </BottomSheet>
  );
}
