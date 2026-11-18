import { useEffect, useState } from 'react';
import { errorMessage } from '../../api/client';
import { useAddLecture, useLectureSearch } from '../../api/queries';
import { currentTerm, termLabel } from '../../api/term';
import type { LectureItemDto } from '../../api/types';
import { BottomSheet } from '../../components/BottomSheet';
import { QueryState } from '../../components/QueryState';
import { TextField } from '../../components/TextField';
import { useToast } from '../../components/Toast';
import { nextPaletteColor, PALETTE } from '../../utils/color';
import s from './LectureSearchSheet.module.css';

interface LectureSearchSheetProps {
  open: boolean;
  onClose: () => void;
  /** 이미 쓰는 색 (새 과목 기본 색을 고를 때 피함) */
  usedColors: string[];
}

const DAY = ['', '월', '화', '수', '목', '금', '토', '일'];

function scheduleText(item: LectureItemDto): string {
  if (!item.schedules.length) return '시간 미정';
  return item.schedules
    .map((sc) => {
      const room = sc.classroom ? ` ${sc.classroom.buildingName} ${sc.classroom.roomName}` : '';
      return `${DAY[sc.dayOfWeek] ?? ''} ${sc.startsAt.slice(0, 5)}–${sc.endsAt.slice(0, 5)}${room}`;
    })
    .join(' · ');
}

/** 개설 강의를 검색해 내 시간표(=과목)에 추가 */
export function LectureSearchSheet({ open, onClose, usedColors }: LectureSearchSheetProps) {
  const toast = useToast();
  const [input, setInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [color, setColor] = useState(() => nextPaletteColor(usedColors));
  const search = useLectureSearch(keyword, open);
  const add = useAddLecture();

  // 입력이 멈추면 검색
  useEffect(() => {
    const t = window.setTimeout(() => setKeyword(input.trim()), 300);
    return () => window.clearTimeout(t);
  }, [input]);

  useEffect(() => {
    if (!open) return;
    setInput('');
    setKeyword('');
    setColor(nextPaletteColor(usedColors));
    // 열릴 때만 초기화
  }, [open]);

  const addLecture = (item: LectureItemDto) => {
    add.mutate(
      { lectureIds: item.lectureIds, color },
      {
        onSuccess: () => {
          toast(`${item.name} 과목을 추가했어요`);
          setColor(nextPaletteColor([...usedColors, color]));
        },
        onError: (err) => toast(errorMessage(err, '과목을 추가하지 못했어요')),
      },
    );
  };

  const items = search.data?.items ?? [];

  return (
    <BottomSheet open={open} onClose={onClose} backdrop title="과목 추가" subtitle={`${termLabel(currentTerm())} 개설 강의`}>
      <TextField
        id="lecture-q"
        label="강의 검색"
        hideLabel
        type="search"
        placeholder="과목명으로 검색"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <fieldset className={s.colors}>
        <legend className={s.label}>추가할 때 쓸 색</legend>
        <div className={s.swatches}>
          {PALETTE.map((p) => (
            <button
              key={p.color}
              type="button"
              aria-label={p.name}
              aria-pressed={p.color === color}
              className={[s.colorBtn, p.color === color && s.colorOn].filter(Boolean).join(' ')}
              style={{ background: p.color }}
              onClick={() => setColor(p.color)}
            />
          ))}
        </div>
      </fieldset>

      {search.isPending || search.error ? (
        <QueryState loading={search.isPending} error={search.error} onRetry={() => search.refetch()} loadingText="강의를 찾고 있어요" />
      ) : items.length === 0 ? (
        <p className={s.empty}>검색 결과가 없어요</p>
      ) : (
        <ul className={s.list}>
          {items.map((item) => {
            const pending = add.isPending && add.variables?.lectureIds === item.lectureIds;
            return (
              <li key={`${item.courseCode}-${item.sectionCode}`} className={s.row}>
                <div className={s.info}>
                  <div className={s.name}>
                    {item.name} <span className={s.code}>{item.sectionCode}분반</span>
                  </div>
                  <div className={s.meta}>{scheduleText(item)}</div>
                </div>
                <button
                  type="button"
                  className={s.add}
                  disabled={item.inMyTimetable || add.isPending}
                  aria-busy={pending}
                  onClick={() => addLecture(item)}
                >
                  {item.inMyTimetable ? '추가됨' : pending ? '추가 중' : '추가'}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </BottomSheet>
  );
}
