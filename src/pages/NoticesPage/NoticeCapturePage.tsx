import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import { createMockNoticeCapture } from '../../mocks';
import { useAppStore } from '../../store/AppStore';
import { AnalyzingStep, UploadStep, useObjectUrl } from '../CapturePage/CaptureSteps';

/** 공지 캡처: 업로드 → AI 요약 → 상세 화면으로 이동 (과제 캡처와 같은 흐름) */
export function NoticeCapturePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { addNotice } = useAppStore();
  const [file, setFile] = useState<File | null>(null);
  const previewUrl = useObjectUrl(file);

  useEffect(() => {
    if (!file) return;
    // TODO(Phase 4): 공지 요약 API로 교체
    const t = setTimeout(() => {
      const id = addNotice(createMockNoticeCapture());
      toast('공지를 요약해서 저장했어요');
      navigate(`/notices/${id}`, { replace: true });
    }, 1400);
    return () => clearTimeout(t);
  }, [file, addNotice, navigate, toast]);

  if (!file) {
    return (
      <UploadStep
        title="공지 캡처"
        subtitle="LMS 공지 화면을 찍거나 골라 주세요"
        backTo="/notices"
        onPick={setFile}
      />
    );
  }
  return <AnalyzingStep previewUrl={previewUrl} message="공지를 요약하고 있어요" />;
}
