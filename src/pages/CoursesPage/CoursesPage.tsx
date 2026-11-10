import { useRef, useState, type FormEvent } from 'react';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { IconButton } from '../../components/IconButton';
import { PageHeader } from '../../components/PageHeader';
import { TextField } from '../../components/TextField';
import { useToast } from '../../components/Toast';
import { useAppStore } from '../../store/AppStore';
import type { Course } from '../../types';
import { nextPaletteColor, PALETTE } from '../../utils/color';
import s from './CoursesPage.module.css';

export function CoursesPage() {
  const toast = useToast();
  const { courses, addCourse, updateCourse, deleteCourse } = useAppStore();
  const nameRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(() => nextPaletteColor(courses.map((c) => c.color)));
  const [error, setError] = useState<string>();
  const [deleting, setDeleting] = useState<Course | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setError(undefined);
    setColor(nextPaletteColor(courses.map((c) => c.color)));
  };

  const startEdit = (c: Course) => {
    setEditingId(c.id);
    setName(c.name);
    setColor(c.color);
    setError(undefined);
    nameRef.current?.focus();
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError('과목명을 입력해 주세요');
    if (courses.some((c) => c.name === trimmed && c.id !== editingId)) return setError('이미 있는 과목이에요');

    if (editingId) {
      updateCourse(editingId, { name: trimmed, color });
      toast('과목을 수정했어요');
    } else {
      addCourse(trimmed, color);
      toast(`${trimmed} 과목을 추가했어요`);
    }
    setEditingId(null);
    setName('');
    setError(undefined);
    setColor(nextPaletteColor([...courses.map((c) => c.color), color]));
  };

  const confirmDelete = () => {
    if (!deleting) return;
    deleteCourse(deleting.id);
    if (editingId === deleting.id) resetForm();
    toast(`${deleting.name} 과목을 삭제했어요`);
    setDeleting(null);
  };

  return (
    <div className={s.page}>
      <PageHeader variant="back" title="과목 관리" backTo="/" />

      {courses.length === 0 ? (
        <p className={s.empty}>아직 등록한 과목이 없어요</p>
      ) : (
        <ul className={s.list}>
          {courses.map((c) => (
            <li key={c.id} className={[s.row, editingId === c.id && s.editing].filter(Boolean).join(' ')}>
              <span className={s.swatch} style={{ background: c.color }} aria-hidden />
              <div className={s.info}>
                <div className={s.name}>{c.name}</div>
                <div className={s.count}>남은 과제 {c.remainingCount}개</div>
              </div>
              <IconButton icon="pencil" tone="muted" iconSize={20} aria-label={`${c.name} 수정`} onClick={() => startEdit(c)} />
              <IconButton
                icon="trash"
                tone="muted"
                iconSize={20}
                aria-label={`${c.name} 삭제`}
                className={s.last}
                onClick={() => setDeleting(c)}
              />
            </li>
          ))}
        </ul>
      )}

      <form className={s.panel} onSubmit={submit} noValidate>
        <div className={s.panelHead}>
          <h2 className={s.panelTitle}>{editingId ? '과목 수정' : '새 과목 추가'}</h2>
          {editingId && (
            <button type="button" className={s.cancel} onClick={resetForm}>
              취소
            </button>
          )}
        </div>
        <TextField
          ref={nameRef}
          id="cname"
          label="과목명"
          placeholder="예: 알고리즘"
          value={name}
          maxLength={30}
          onChange={(e) => {
            setName(e.target.value);
            setError(undefined);
          }}
          error={error}
        />
        <fieldset className={s.colors}>
          <legend className={s.colorLabel}>색상</legend>
          <div className={s.swatches}>
            {PALETTE.map((p) => {
              const on = p.color === color;
              return (
                <button
                  key={p.color}
                  type="button"
                  aria-label={p.name}
                  aria-pressed={on}
                  className={[s.colorBtn, on && s.colorOn].filter(Boolean).join(' ')}
                  style={{ background: p.color }}
                  onClick={() => setColor(p.color)}
                />
              );
            })}
          </div>
        </fieldset>
        <Button type="submit" fullWidth className={s.submit}>
          {editingId ? '수정하기' : '추가하기'}
        </Button>
      </form>

      <ConfirmDialog
        open={!!deleting}
        title={`${deleting?.name ?? ''} 과목을 삭제할까요?`}
        message={
          deleting && deleting.remainingCount > 0
            ? `남은 과제 ${deleting.remainingCount}개와 시간표의 수업도 함께 삭제돼요.`
            : '시간표의 수업도 함께 삭제돼요.'
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
