import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { errorMessage } from '../../api/client';
import { useCreateNotice, useSchedule } from '../../api/queries';
import { Chip } from '../../components/Chip';
import { useToast } from '../../components/Toast';
import { AnalyzingStep, UploadStep, useObjectUrl } from '../CapturePage/CaptureSteps';

/** 공지 캡처: 업로드 → AI 요약 → 상세 화면으로 이동 (과제 캡처와 같은 흐름) */
export function NoticeCapturePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const createNotice = useCreateNotice();
  const { courses } = useSchedule();
  const [courseId, setCourseId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const previewUrl = useObjectUrl(file);

  // 파일을 고를 때 한 번만 업로드
  const pick = (f: File) => {
    setFile(f);
    const course = courses.find((c) => c.id === courseId);
    createNotice.mutate(
      { file: f, userLectureId: course?.primaryTimetableId },
      {
        onSuccess: (notice) => {
          toast('공지를 요약해서 저장했어요');
          navigate(`/notices/${notice.noticeId}`, { replace: true });
        },
        onError: (err) => {
          toast(errorMessage(err, '공지를 요약하지 못했어요. 다시 시도해 주세요'));
          setFile(null);
        },
      },
    );
  };

  if (!file) {
    return (
      <UploadStep
        title="공지 캡처"
        subtitle="LMS 공지 화면을 찍거나 골라 주세요"
        backTo="/notices"
        onPick={pick}
      >
        {courses.length > 0 && (
          <div className="hscroll" role="group" aria-label="공지 과목" style={{ display: 'flex', gap: 8, padding: '0 var(--page-x) 12px' }}>
            <Chip variant="select" selected={courseId === null} onClick={() => setCourseId(null)}>
              과목 선택 안 함
            </Chip>
            {courses.map((c) => (
              <Chip key={c.id} variant="select" selected={courseId === c.id} onClick={() => setCourseId(c.id)}>
                {c.name}
              </Chip>
            ))}
          </div>
        )}
      </UploadStep>
    );
  }
  return <AnalyzingStep previewUrl={previewUrl} message="공지를 요약하고 있어요" />;
}
