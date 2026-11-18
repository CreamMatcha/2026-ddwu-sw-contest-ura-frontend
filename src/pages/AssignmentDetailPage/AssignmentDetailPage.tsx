import dayjs from 'dayjs';
import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError, errorMessage } from '../../api/client';
import {
  useAssignment,
  useDeleteAssignment,
  useSchedule,
  useToggleAssignment,
  useUpdateAssignmentMemo,
} from '../../api/queries';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Icon } from '../../components/Icon';
import { IconButton } from '../../components/IconButton';
import { PageHeader } from '../../components/PageHeader';
import { QueryState } from '../../components/QueryState';
import { useToast } from '../../components/Toast';
import type { Assignment } from '../../types';
import { tagFgOf, tintOf } from '../../utils/color';
import { dday, formatMonthDay } from '../../utils/date';
import { useNow } from '../../utils/useNow';
import s from './AssignmentDetailPage.module.css';

const TYPE_LABEL: Record<Assignment['type'], string> = { assignment: '과제', exam: '시험', other: '일정' };

/** 캘린더 일정(과제) 상세: 마감, AI 메모, 원본 공지, 완료·삭제 */
export function AssignmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const today = useNow(60_000).startOf('day');
  const { courseById } = useSchedule();
  const { assignment: a, isLoading, error, refetch } = useAssignment(Number(id));
  const toggle = useToggleAssignment();
  const remove = useDeleteAssignment();
  const updateMemo = useUpdateAssignmentMemo();
  const [confirming, setConfirming] = useState(false);
  /** 메모 편집 중이면 입력값, 아니면 null */
  const [memoDraft, setMemoDraft] = useState<string | null>(null);

  // 뒤로 가면 캘린더에서 이 일정의 날짜를 보여 준다
  const backState = a ? { focusDate: a.dueAt } : undefined;
  const header = (actions?: ReactNode) => (
    <PageHeader variant="back" title="과제 상세" backTo="/" backState={backState} actions={actions} />
  );

  if (isLoading) {
    return (
      <>
        {header()}
        <QueryState loading />
      </>
    );
  }

  if (!a) {
    const notFound = !error || (error instanceof ApiError && error.status === 404);
    return (
      <>
        {header()}
        {notFound ? (
          <p className={s.missing}>과제를 찾을 수 없어요. 삭제되었을 수 있어요</p>
        ) : (
          <QueryState error={error} onRetry={refetch} />
        )}
      </>
    );
  }

  const course = a.courseId ? courseById.get(a.courseId) : undefined;
  const d = dday(a.dueAt, a.done, today);
  const due = dayjs(a.dueAt);

  const toggleDone = () =>
    toggle.mutate(
      { id: a.id, done: !a.done },
      {
        onSuccess: () => toast(a.done ? '미완료로 바꿨어요' : '완료로 표시했어요'),
        onError: (err) => toast(errorMessage(err, '완료 상태를 바꾸지 못했어요')),
      },
    );

  const saveMemo = () => {
    if (memoDraft === null) return;
    if (memoDraft.trim() === (a.memo ?? '')) return setMemoDraft(null);
    updateMemo.mutate(
      { id: a.id, memo: memoDraft },
      {
        onSuccess: () => {
          setMemoDraft(null);
          toast('메모를 저장했어요');
        },
        onError: (err) => toast(errorMessage(err, '메모를 저장하지 못했어요')),
      },
    );
  };

  const confirmDelete = () => {
    setConfirming(false);
    remove.mutate(a.id, {
      onSuccess: () => {
        toast('과제를 삭제했어요');
        navigate('/', { replace: true, state: backState });
      },
      onError: (err) => toast(errorMessage(err, '과제를 삭제하지 못했어요')),
    });
  };

  return (
    <div className={s.page}>
      {header(
        <IconButton
          icon="trash"
          tone="muted"
          iconSize={20}
          aria-label="과제 삭제"
          disabled={remove.isPending}
          onClick={() => setConfirming(true)}
        />,
      )}

      <div className={s.body}>
        <div className={s.top}>
          <div className={s.tags}>
            {course ? (
              <Badge variant="tag" fg={tagFgOf(course.color)} bg={tintOf(course.color)} dot={course.color}>
                {course.name}
              </Badge>
            ) : (
              <Badge variant="tag" fg="var(--color-text-muted)" bg="var(--color-divider-light)">
                미분류
              </Badge>
            )}
            <Badge
              variant="tag"
              fg={a.type === 'exam' ? 'var(--color-primary)' : 'var(--color-text-sub)'}
              bg={a.type === 'exam' ? 'var(--color-primary-tint)' : 'var(--color-divider-light)'}
            >
              {TYPE_LABEL[a.type]}
            </Badge>
          </div>
          <h2 className={[s.title, a.done && s.done].filter(Boolean).join(' ')}>{a.title}</h2>
          <span className={s.saved}>{dayjs(a.createdAt).format('YYYY.MM.DD')} 저장</span>
        </div>

        <div className={s.due}>
          <div className={s.dueIcon}>
            <Icon name="calendar" size={20} />
          </div>
          <div className={s.dueInfo}>
            <div className={s.dueLabel}>마감</div>
            <div className={s.dueMain}>
              {formatMonthDay(due)}
              {a.hasTime ? ` ${due.format('HH:mm')}` : ''}
            </div>
          </div>
          <Badge variant="dday" urgent={d.urgent}>
            {d.label}
          </Badge>
        </div>

        <section className={s.section}>
          <div className={s.sectionHead}>
            <h3 className={s.sectionTitle}>메모</h3>
            {memoDraft === null ? (
              <button type="button" className={s.textBtn} onClick={() => setMemoDraft(a.memo ?? '')}>
                {a.memo ? '수정' : '작성'}
              </button>
            ) : (
              <div className={s.memoActions}>
                <button
                  type="button"
                  className={s.textBtnMuted}
                  disabled={updateMemo.isPending}
                  onClick={() => setMemoDraft(null)}
                >
                  취소
                </button>
                <button type="button" className={s.textBtn} disabled={updateMemo.isPending} onClick={saveMemo}>
                  {updateMemo.isPending ? '저장 중…' : '저장'}
                </button>
              </div>
            )}
          </div>
          {memoDraft !== null ? (
            <textarea
              className={s.memoInput}
              aria-label="메모"
              rows={4}
              maxLength={1000}
              autoFocus
              value={memoDraft}
              placeholder="제출 방법, 준비물 등을 적어 두세요"
              onChange={(e) => setMemoDraft(e.target.value)}
            />
          ) : a.memo ? (
            <p className={s.memo}>{a.memo}</p>
          ) : (
            <p className={s.memoEmpty}>메모가 없어요</p>
          )}
        </section>

        {a.sourceNoticeId && (
          <section className={s.section}>
            <h3 className={s.sectionTitle}>출처</h3>
            <Link to={`/notices/${a.sourceNoticeId}`} className={s.sourceRow}>
              <Icon name="megaphone" size={20} />
              <span className={s.sourceText}>원본 공지 보기</span>
              <Icon name="chevron-right" size={18} />
            </Link>
          </section>
        )}
      </div>

      <div className={s.footer}>
        <Button
          fullWidth
          variant={a.done ? 'outline' : 'primary'}
          icon={a.done ? undefined : 'check'}
          disabled={toggle.isPending}
          onClick={toggleDone}
        >
          {a.done ? '미완료로 되돌리기' : '완료로 표시'}
        </Button>
      </div>

      <ConfirmDialog
        open={confirming}
        title="이 과제를 삭제할까요?"
        message="삭제한 과제는 되돌릴 수 없어요."
        onConfirm={confirmDelete}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
