import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Chip } from '../../components/Chip';
import { CourseDot } from '../../components/CourseDot';
import { Fab } from '../../components/Fab';
import { Icon } from '../../components/Icon';
import { PageHeader } from '../../components/PageHeader';
import { useAppStore } from '../../store/AppStore';
import { UNCATEGORIZED_COLOR } from '../../utils/color';
import { formatMentionedDate, relativeDay } from '../../utils/date';
import { useNow } from '../../utils/useNow';
import s from './NoticesPage.module.css';

const ALL = 'all';
const EXAM = 'exam';
const NONE = 'none';

export function NoticesPage() {
  const navigate = useNavigate();
  const now = useNow(60_000);
  const { notices, courseById } = useAppStore();
  const [filter, setFilter] = useState<string>(ALL);

  // 필터 칩: 전체, 시험, 공지가 있는 과목들, 미분류
  const tabs = useMemo(() => {
    const ids = [...new Set(notices.map((n) => n.courseId).filter((id): id is string => !!id && courseById.has(id)))];
    return [
      { key: ALL, label: '전체' },
      { key: EXAM, label: '시험' },
      ...ids.map((id) => ({ key: id, label: courseById.get(id)!.name })),
      { key: NONE, label: '미분류' },
    ];
  }, [notices, courseById]);

  const list = notices.filter((n) => {
    if (filter === ALL) return true;
    if (filter === EXAM) return n.isExam;
    if (filter === NONE) return !n.courseId || !courseById.has(n.courseId);
    return n.courseId === filter;
  });

  return (
    <>
      <PageHeader variant="title" title="공지 요약" />

      <div className={`${s.chips} hscroll`}>
        {tabs.map((t) => (
          <Chip key={t.key} variant="select" tone="solid" selected={filter === t.key} onClick={() => setFilter(t.key)}>
            {t.label}
          </Chip>
        ))}
      </div>

      {list.length === 0 ? (
        <p className={s.empty}>
          {notices.length === 0 ? '아직 저장한 공지가 없어요. 공지를 캡처해 보세요' : '이 분류에 해당하는 공지가 없어요'}
        </p>
      ) : (
        <ul className={s.list}>
          {list.map((n) => {
            const c = n.courseId ? courseById.get(n.courseId) : undefined;
            const date = n.mentionedDates[0];
            return (
              <li key={n.id}>
                <Link to={`/notices/${n.id}`} className={s.card}>
                  <span className={s.meta}>
                    <CourseDot color={c?.color ?? UNCATEGORIZED_COLOR} size={8} />
                    {c?.name ?? '미분류'}
                    <span className={s.saved}>{relativeDay(n.savedAt, now)}</span>
                  </span>
                  <span className={s.title}>{n.title}</span>
                  <span className={s.summary}>{n.summary}</span>
                  {date && (
                    <span className={s.date}>
                      <Icon name="calendar" size={13} />
                      {formatMentionedDate(date.at)}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Fab icon="camera" label="공지 캡처" onClick={() => navigate('/notices/capture')} />
    </>
  );
}
