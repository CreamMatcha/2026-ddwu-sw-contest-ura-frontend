import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { errorMessage } from '../../api/client';
import { CourseInUseError, useDeleteCourse, useSchedule, useUpdateCourseColor } from '../../api/queries';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { IconButton } from '../../components/IconButton';
import { PageHeader } from '../../components/PageHeader';
import { QueryState } from '../../components/QueryState';
import { useToast } from '../../components/Toast';
import { useAppStore } from '../../store/AppStore';
import type { Course } from '../../types';
import { PALETTE } from '../../utils/color';
import { LectureSearchSheet } from '../TimetablePage/LectureSearchSheet';
import s from './CoursesPage.module.css';

/**
 * 과목 = 내 시간표에 담은 강의. 과목명은 개설 강의 정보라 바꿀 수 없고 색만 바꾼다.
 * 새 과목은 개설 강의 검색으로 추가한다.
 */
export function CoursesPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const { auth, logout } = useAppStore();
  const { courses, isLoading, error, refetch } = useSchedule();
  const updateColor = useUpdateCourseColor();
  const deleteCourse = useDeleteCourse();

  const [editing, setEditing] = useState<Course | null>(null);
  const [color, setColor] = useState(PALETTE[0].color);
  const [deleting, setDeleting] = useState<Course | null>(null);
  const [searching, setSearching] = useState(false);

  const startEdit = (c: Course) => {
    setEditing(c);
    setColor(c.color);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return setSearching(true);
    if (color === editing.color) return setEditing(null);
    updateColor.mutate(
      { course: editing, color },
      {
        onSuccess: () => {
          toast('과목 색을 바꿨어요');
          setEditing(null);
        },
        onError: (err) => toast(errorMessage(err, '색을 바꾸지 못했어요')),
      },
    );
  };

  const confirmDelete = () => {
    if (!deleting) return;
    const target = deleting;
    setDeleting(null);
    deleteCourse.mutate(target, {
      onSuccess: () => {
        if (editing?.id === target.id) setEditing(null);
        toast(`${target.name} 과목을 삭제했어요`);
      },
      onError: (err) =>
        toast(err instanceof CourseInUseError ? err.message : errorMessage(err, '과목을 삭제하지 못했어요')),
    });
  };

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className={s.page}>
      <PageHeader
        variant="back"
        title="과목 관리"
        subtitle={auth ? `${auth.user.nickname} 님` : undefined}
        backTo="/"
        actions={
          <button type="button" className={s.cancel} onClick={onLogout}>
            로그아웃
          </button>
        }
      />

      {isLoading || error ? (
        <QueryState loading={isLoading} error={error} onRetry={refetch} />
      ) : courses.length === 0 ? (
        <p className={s.empty}>아직 시간표에 담은 과목이 없어요</p>
      ) : (
        <ul className={s.list}>
          {courses.map((c) => (
            <li key={c.id} className={[s.row, editing?.id === c.id && s.editing].filter(Boolean).join(' ')}>
              <span className={s.swatch} style={{ background: c.color }} aria-hidden />
              <div className={s.info}>
                <div className={s.name}>{c.name}</div>
                <div className={s.count}>남은 과제 {c.remainingCount}개</div>
              </div>
              <IconButton icon="pencil" tone="muted" iconSize={20} aria-label={`${c.name} 색 바꾸기`} onClick={() => startEdit(c)} />
              <IconButton
                icon="trash"
                tone="muted"
                iconSize={20}
                aria-label={`${c.name} 삭제`}
                className={s.last}
                disabled={deleteCourse.isPending}
                onClick={() => setDeleting(c)}
              />
            </li>
          ))}
        </ul>
      )}

      <form className={s.panel} onSubmit={submit} noValidate>
        <div className={s.panelHead}>
          <h2 className={s.panelTitle}>{editing ? `${editing.name} 색 바꾸기` : '새 과목 추가'}</h2>
          {editing && (
            <button type="button" className={s.cancel} onClick={() => setEditing(null)}>
              취소
            </button>
          )}
        </div>
        {editing ? (
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
        ) : (
          <p className={s.count}>이번 학기 개설 강의를 검색해 내 시간표에 담아요</p>
        )}
        <Button type="submit" fullWidth className={s.submit} icon={editing ? undefined : 'plus'} disabled={updateColor.isPending}>
          {editing ? (updateColor.isPending ? '바꾸는 중…' : '수정하기') : '강의 검색해서 추가'}
        </Button>
      </form>

      <LectureSearchSheet open={searching} onClose={() => setSearching(false)} usedColors={courses.map((c) => c.color)} />

      <ConfirmDialog
        open={!!deleting}
        title={`${deleting?.name ?? ''} 과목을 삭제할까요?`}
        message={
          deleting && deleting.remainingCount > 0
            ? `남은 과제 ${deleting.remainingCount}개와 시간표의 수업도 함께 삭제돼요.`
            : '이 과목의 일정과 시간표의 수업도 함께 삭제돼요.'
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
