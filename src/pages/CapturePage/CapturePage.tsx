import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { errorMessage } from '../../api/client';
import { useCaptureAssignments, useCreateEvents, useSchedule } from '../../api/queries';
import type { CaptureResponse, EventType } from '../../api/types';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { CheckBox } from '../../components/Check';
import { CourseDot } from '../../components/CourseDot';
import { Icon } from '../../components/Icon';
import { PageHeader } from '../../components/PageHeader';
import { TextField } from '../../components/TextField';
import { useToast } from '../../components/Toast';
import { UNCATEGORIZED_COLOR } from '../../utils/color';
import { AnalyzingStep, UploadStep, useObjectUrl } from './CaptureSteps';
import s from './CapturePage.module.css';

interface Draft {
  tempId: string;
  courseName: string;
  /** 내 시간표와 매칭된 과목. 없으면 미분류로 저장 */
  courseId?: string;
  userLectureId: number | null;
  title: string;
  eventType: EventType;
  memo: string | null;
  /** datetime-local 값 (YYYY-MM-DDTHH:mm) */
  dueAt: string;
  /** 마감일을 못 읽은 카드 (필수 입력) */
  review: boolean;
  /** 이미 캘린더에 같은 일정이 있음 */
  duplicate: boolean;
  checkReasons: string[];
  included: boolean;
}

function toDrafts(res: CaptureResponse, courseIdOf: (id: number | null) => string | undefined): Draft[] {
  return res.candidates.map((c, i) => ({
    tempId: `cap-${res.sourceImageId}-${i}`,
    courseName: c.lectureName ?? c.courseName ?? '과목 정보 없음',
    courseId: courseIdOf(c.userLectureId),
    userLectureId: c.userLectureId,
    title: c.title ?? '',
    eventType: c.eventType ?? 'assignment',
    memo: c.memo,
    // 시각이 없으면 LMS 기본 마감 시각인 23:59로 채운다
    dueAt: c.eventDate ? `${c.eventDate}T${c.eventTime ? c.eventTime.slice(0, 5) : '23:59'}` : '',
    review: !c.eventDate,
    duplicate: c.duplicate,
    checkReasons: c.checkReasons ?? [],
    included: !c.duplicate,
  }));
}

export function CapturePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { courseById, courseIdOf } = useSchedule();
  const capture = useCaptureAssignments();
  const createEvents = useCreateEvents();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<CaptureResponse | null>(null);
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const previewUrl = useObjectUrl(file);

  // 업로드는 파일을 고를 때 한 번만 보낸다 (effect로 보내면 StrictMode에서 두 번 분석됨)
  const pick = (f: File) => {
    setFile(f);
    setDrafts(null);
    setResult(null);
    capture.mutate(f, {
      onSuccess: (res) => {
        setResult(res);
        setDrafts(toDrafts(res, courseIdOf));
      },
      onError: (err) => {
        toast(errorMessage(err, '이미지를 분석하지 못했어요. 다시 시도해 주세요'));
        setFile(null);
      },
    });
  };

  if (!file) {
    return (
      <UploadStep
        title="과제 캡처"
        subtitle="LMS 과제 목록 화면을 찍거나 골라 주세요"
        backTo="/"
        onPick={pick}
      />
    );
  }

  if (!drafts || !result) return <AnalyzingStep previewUrl={previewUrl} message="과제를 찾고 있어요" />;

  const update = (id: string, patch: Partial<Draft>) =>
    setDrafts((ds) => ds && ds.map((d) => (d.tempId === id ? { ...d, ...patch } : d)));

  const colorOf = (d: Draft) => (d.courseId && courseById.get(d.courseId)?.color) || UNCATEGORIZED_COLOR;

  const selected = drafts.filter((d) => d.included);
  const saving = createEvents.isPending;
  const canSave = !saving && selected.length > 0 && selected.every((d) => d.title.trim() && d.dueAt);

  const save = async () => {
    if (!canSave) return;
    const { saved, error } = await createEvents.mutateAsync(
      selected.map((d) => {
        const [date, time] = d.dueAt.split('T');
        return {
          sourceImageId: result.sourceImageId,
          userLectureId: d.userLectureId,
          title: d.title.trim(),
          eventType: d.eventType,
          eventDate: date,
          eventTime: time ? `${time}:00` : null,
          memo: d.memo,
        };
      }),
    );
    if (error) {
      toast(`${saved}개만 저장했어요. ${errorMessage(error)}`);
      // 저장된 앞쪽 카드는 목록에서 빼서 중복 저장을 막는다
      const savedIds = new Set(selected.slice(0, saved).map((d) => d.tempId));
      setDrafts((ds) => ds && ds.filter((d) => !savedIds.has(d.tempId)));
      return;
    }
    toast(`과제 ${saved}개를 캘린더에 저장했어요`);
    const first = [...selected].sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0];
    navigate('/', { replace: true, state: { focusDate: first.dueAt } });
  };

  const retake = () => {
    setFile(null);
    setDrafts(null);
  };

  if (drafts.length === 0) {
    return (
      <div className={s.page}>
        <PageHeader
          variant="back"
          title="과제를 찾지 못했어요"
          subtitle={result.warnings[0] ?? '과제 목록이 잘 보이도록 다시 찍어 주세요'}
          backTo="/"
        />
        <div className={s.footer}>
          <Button fullWidth icon="camera" onClick={retake}>
            다시 찍기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <PageHeader
        variant="back"
        title={`과제 ${drafts.length}개를 찾았어요`}
        subtitle={result.warnings[0] ?? '내용을 확인하고 필요한 부분을 고쳐 주세요'}
        backTo="/"
      />

      <div className={s.image}>
        <div className={s.thumb}>
          {previewUrl ? <img src={previewUrl} alt="" /> : <Icon name="image" size={22} />}
        </div>
        <div className={s.imageText}>
          <div className={s.imageTitle}>LMS 캡처 이미지</div>
          <div className={s.imageSub}>저장한 과제에서 원본을 다시 볼 수 있어요</div>
        </div>
        <button type="button" className={s.retake} onClick={retake}>
          다시 찍기
        </button>
      </div>

      <ul className={s.cards}>
        {drafts.map((d) => {
          const missingDue = d.included && !d.dueAt;
          return (
            <li
              key={d.tempId}
              className={[s.card, !d.included && s.excluded, d.review && missingDue && s.cardError]
                .filter(Boolean)
                .join(' ')}
            >
              <div className={s.cardHead}>
                <CheckBox
                  className={s.check}
                  checked={d.included}
                  label={`${d.title || '과제'} ${d.included ? '저장에서 빼기' : '저장에 포함'}`}
                  onToggle={() => update(d.tempId, { included: !d.included })}
                />
                <CourseDot color={colorOf(d)} size={10} />
                <span className={s.course}>{d.courseId ? courseById.get(d.courseId)?.name : d.courseName}</span>
                {d.duplicate ? (
                  <Badge variant="tag" size="sm" fg="var(--color-text-muted)" bg="var(--color-divider-light)">
                    이미 저장됨
                  </Badge>
                ) : (
                  !d.courseId && (
                    <Badge variant="tag" size="sm" fg="#4079A8" bg="#EDF3F8">
                      시간표에 없는 과목
                    </Badge>
                  )
                )}
              </div>
              <TextField
                id={`${d.tempId}-title`}
                size="sm"
                label="과제명"
                value={d.title}
                disabled={!d.included}
                onChange={(e) => update(d.tempId, { title: e.target.value })}
                error={d.included && !d.title.trim() ? '과제명을 입력해 주세요' : undefined}
              />
              <TextField
                id={`${d.tempId}-due`}
                size="sm"
                type="datetime-local"
                label="마감 일시"
                requiredMark={d.review}
                value={d.dueAt}
                disabled={!d.included}
                onChange={(e) => update(d.tempId, { dueAt: e.target.value })}
                error={
                  missingDue
                    ? d.review
                      ? '마감일을 읽지 못했어요. 직접 입력해 주세요'
                      : '마감 일시를 입력해 주세요'
                    : d.included && d.checkReasons.length
                      ? d.checkReasons[0]
                      : undefined
                }
              />
            </li>
          );
        })}
      </ul>

      <div className={s.footer}>
        <Button fullWidth disabled={!canSave} onClick={save} aria-busy={saving}>
          {saving ? '저장하는 중…' : `선택한 ${selected.length}개 캘린더에 저장`}
        </Button>
      </div>
    </div>
  );
}
