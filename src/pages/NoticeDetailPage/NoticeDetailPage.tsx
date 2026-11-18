import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from '../../components/Badge';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Fab } from '../../components/Fab';
import { Icon } from '../../components/Icon';
import { IconButton } from '../../components/IconButton';
import { PageHeader } from '../../components/PageHeader';
import { useToast } from '../../components/Toast';
import { ApiError, errorMessage } from '../../api/client';
import { fetchImage } from '../../api/endpoints';
import { useAddNoticeDateToCalendar, useDeleteNotice, useNotice, useSchedule } from '../../api/queries';
import { QueryState } from '../../components/QueryState';
import type { MentionedDate } from '../../types';
import { tagFgOf, tintOf } from '../../utils/color';
import { formatMentionedDate } from '../../utils/date';
import s from './NoticeDetailPage.module.css';

export function NoticeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { courseById } = useSchedule();
  const { notice, isLoading, error } = useNotice(Number(id));
  const deleteNotice = useDeleteNotice();
  const addToCalendar = useAddNoticeDateToCalendar();
  const [confirming, setConfirming] = useState(false);
  const [added, setAdded] = useState<Set<string>>(() => new Set());
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  // 원본 이미지 Blob URL 정리
  useEffect(() => () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  if (isLoading) {
    return (
      <>
        <PageHeader variant="back" title="공지 상세" backTo="/notices" />
        <QueryState loading />
      </>
    );
  }

  if (!notice) {
    return (
      <>
        <PageHeader variant="back" title="공지 상세" backTo="/notices" />
        <p className={s.missing}>
          {error && !(error instanceof ApiError && error.status === 404)
            ? errorMessage(error, '공지를 불러오지 못했어요')
            : '공지를 찾을 수 없어요. 삭제되었을 수 있어요'}
        </p>
      </>
    );
  }

  const course = notice.courseId ? courseById.get(notice.courseId) : undefined;

  const remove = () => {
    setConfirming(false);
    deleteNotice.mutate(notice.id, {
      onSuccess: () => {
        toast('공지를 삭제했어요');
        navigate('/notices', { replace: true });
      },
      onError: (err) => toast(errorMessage(err, '공지를 삭제하지 못했어요')),
    });
  };

  const dateKey = (d: MentionedDate) => d.at + d.label;
  const addDate = (d: MentionedDate) => {
    const [date, time] = d.at.split('T');
    addToCalendar.mutate(
      {
        sourceNoticeId: notice.id,
        title: d.label,
        eventType: d.type,
        eventDate: date,
        eventTime: time ? `${time}:00` : null,
        memo: d.memo ?? null,
      },
      {
        onSuccess: () => {
          setAdded((prev) => new Set(prev).add(dateKey(d)));
          toast('캘린더에 추가했어요');
        },
        onError: (err) => toast(errorMessage(err, '캘린더에 추가하지 못했어요')),
      },
    );
  };

  const showImage = async () => {
    if (!notice.imageUrl || imageLoading) return;
    setImageLoading(true);
    try {
      const blob = await fetchImage(notice.imageUrl);
      setImageUrl(URL.createObjectURL(blob));
    } catch (err) {
      toast(errorMessage(err, '원본 이미지를 불러오지 못했어요'));
    } finally {
      setImageLoading(false);
    }
  };

  return (
    <div className={s.page}>
      <PageHeader
        variant="back"
        title="공지 상세"
        backTo="/notices"
        actions={<IconButton icon="trash" tone="muted" iconSize={20} aria-label="공지 삭제" onClick={() => setConfirming(true)} />}
      />

      <div className={s.body}>
        <div className={s.top}>
          <div className={s.tags}>
            {course ? (
              <Badge variant="tag" fg={tagFgOf(course.color)} bg={tintOf(course.color)} dot={course.color}>
                {course.name}
              </Badge>
            ) : notice.lectureName ? (
              <Badge variant="tag" fg="var(--color-text-muted)" bg="var(--color-divider-light)">
                {notice.lectureName}
              </Badge>
            ) : (
              <Badge variant="tag" fg="var(--color-text-muted)" bg="var(--color-divider-light)">
                미분류
              </Badge>
            )}
            {notice.isExam && (
              <Badge variant="tag" fg="var(--color-primary)" bg="var(--color-primary-tint)">
                시험
              </Badge>
            )}
          </div>
          <h2 className={s.title}>{notice.title}</h2>
          <span className={s.saved}>{dayjs(notice.savedAt).format('YYYY.MM.DD')} 저장 · AI 요약</span>
        </div>

        <div className={s.summary}>
          <span className={s.summaryLabel}>한 줄 요약</span>
          <p className={s.summaryText}>{notice.summary}</p>
        </div>

        {notice.mentionedDates.length > 0 && (
          <section className={s.section}>
            <h3 className={s.sectionTitle}>언급된 날짜</h3>
            {notice.mentionedDates.map((d) => (
              <div key={d.at + d.label} className={s.dateRow}>
                <div className={s.dateIcon}>
                  <Icon name="calendar" size={20} />
                </div>
                <div className={s.dateInfo}>
                  <div className={s.dateMain}>{formatMentionedDate(d.at)}</div>
                  <div className={s.dateLabel}>{d.label}</div>
                </div>
                <button
                  type="button"
                  className={s.addDate}
                  disabled={added.has(dateKey(d)) || addToCalendar.isPending}
                  onClick={() => addDate(d)}
                >
                  {added.has(dateKey(d)) ? '추가됨' : '캘린더에 추가'}
                </button>
              </div>
            ))}
          </section>
        )}

        {notice.points.length > 0 && (
          <section className={s.section}>
            <h3 className={s.sectionTitle}>핵심 내용</h3>
            <ol className={s.points}>
              {notice.points.map((p, i) => (
                <li key={i} className={s.point}>
                  <span className={s.num} aria-hidden>
                    {i + 1}
                  </span>
                  {p}
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>

      <Fab
        icon="image"
        label="이미지 원본 보기"
        withTabBar={false}
        onClick={showImage}
      />

      {imageUrl && (
        <div className={s.viewer} role="dialog" aria-label="공지 원본 이미지" onClick={() => setImageUrl(null)}>
          <img src={imageUrl} alt={`${notice.title} 원본`} />
          <IconButton icon="close" aria-label="닫기" className={s.viewerClose} onClick={() => setImageUrl(null)} />
        </div>
      )}

      <ConfirmDialog
        open={confirming}
        title="이 공지를 삭제할까요?"
        message="삭제한 공지 요약은 되돌릴 수 없어요."
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
