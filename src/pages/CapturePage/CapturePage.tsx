import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { CheckBox } from '../../components/Check';
import { CourseDot } from '../../components/CourseDot';
import { Icon } from '../../components/Icon';
import { PageHeader } from '../../components/PageHeader';
import { TextField } from '../../components/TextField';
import { useToast } from '../../components/Toast';
import { mockCaptureResults } from '../../mocks';
import { useAppStore } from '../../store/AppStore';
import type { CaptureResult } from '../../types';
import { nextPaletteColor } from '../../utils/color';
import { AnalyzingStep, UploadStep, useObjectUrl } from './CaptureSteps';
import s from './CapturePage.module.css';

interface Draft {
  tempId: string;
  courseName: string;
  courseId?: string;
  title: string;
  dueAt: string;
  /** 마감일을 못 읽은 카드 (필수 입력) */
  review: boolean;
  included: boolean;
}

/** TODO(Phase 4): 이미지 업로드 → 분석 API로 교체 */
function analyze(_file: File): Promise<CaptureResult[]> {
  return new Promise((resolve) => setTimeout(() => resolve(mockCaptureResults), 1200));
}

export function CapturePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { courses, addAssignments } = useAppStore();
  const [file, setFile] = useState<File | null>(null);
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const previewUrl = useObjectUrl(file);

  useEffect(() => {
    if (!file) return;
    let alive = true;
    setDrafts(null);
    analyze(file).then((results) => {
      if (!alive) return;
      setDrafts(
        results.map((r) => ({
          tempId: r.tempId,
          courseName: r.courseName,
          courseId: r.courseId ?? courses.find((c) => c.name === r.courseName)?.id,
          title: r.title,
          dueAt: r.dueAt ?? '',
          review: !r.dueAt,
          included: true,
        })),
      );
    });
    return () => {
      alive = false;
    };
    // 과목 목록이 바뀌어도 다시 분석하지 않는다
  }, [file]);

  if (!file) {
    return (
      <UploadStep
        title="과제 캡처"
        subtitle="LMS 과제 목록 화면을 찍거나 골라 주세요"
        backTo="/"
        onPick={setFile}
      />
    );
  }

  if (!drafts) return <AnalyzingStep previewUrl={previewUrl} message="과제를 찾고 있어요" />;

  const update = (id: string, patch: Partial<Draft>) =>
    setDrafts((ds) => ds && ds.map((d) => (d.tempId === id ? { ...d, ...patch } : d)));

  // 새 과목 미리보기 색 (저장 시 같은 규칙으로 배정)
  const usedColors = courses.map((c) => c.color);
  const newColors = new Map<string, string>();
  for (const d of drafts) {
    if (!d.courseId && !newColors.has(d.courseName)) {
      const color = nextPaletteColor([...usedColors, ...newColors.values()]);
      newColors.set(d.courseName, color);
    }
  }
  const colorOf = (d: Draft) =>
    (d.courseId && courses.find((c) => c.id === d.courseId)?.color) || newColors.get(d.courseName)!;

  const selected = drafts.filter((d) => d.included);
  const canSave = selected.length > 0 && selected.every((d) => d.title.trim() && d.dueAt);

  const save = () => {
    if (!canSave) return;
    addAssignments(
      selected.map((d) => ({ courseId: d.courseId, courseName: d.courseName, title: d.title, dueAt: d.dueAt })),
    );
    toast(`과제 ${selected.length}개를 캘린더에 저장했어요`);
    const first = [...selected].sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0];
    navigate('/', { replace: true, state: { focusDate: first.dueAt } });
  };

  return (
    <div className={s.page}>
      <PageHeader
        variant="back"
        title={`과제 ${drafts.length}개를 찾았어요`}
        subtitle="내용을 확인하고 필요한 부분을 고쳐 주세요"
        backTo="/"
      />

      <div className={s.image}>
        <div className={s.thumb}>
          {previewUrl ? <img src={previewUrl} alt="" /> : <Icon name="image" size={22} />}
        </div>
        <div className={s.imageText}>
          <div className={s.imageTitle}>LMS 캡처 이미지</div>
          <div className={s.imageSub}>이미지는 분석에만 쓰이고 저장되지 않아요</div>
        </div>
        <button type="button" className={s.retake} onClick={() => setFile(null)}>
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
                <span className={s.course}>{d.courseName}</span>
                {!d.courseId && (
                  <Badge variant="tag" size="sm" fg="#4079A8" bg="#EDF3F8">
                    새 과목으로 추가
                  </Badge>
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
                error={missingDue ? (d.review ? '마감일을 읽지 못했어요. 직접 입력해 주세요' : '마감 일시를 입력해 주세요') : undefined}
              />
            </li>
          );
        })}
      </ul>

      <div className={s.footer}>
        <Button fullWidth disabled={!canSave} onClick={save}>
          선택한 {selected.length}개 캘린더에 저장
        </Button>
      </div>
    </div>
  );
}
