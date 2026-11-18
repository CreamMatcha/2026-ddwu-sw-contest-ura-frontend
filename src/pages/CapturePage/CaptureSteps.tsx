import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { PageHeader } from '../../components/PageHeader';
import s from './CaptureSteps.module.css';

/** 선택한 이미지 파일 → 미리보기 URL (언마운트/교체 시 해제) */
export function useObjectUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) return setUrl(null);
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return url;
}

interface UploadStepProps {
  title: string;
  subtitle: string;
  backTo: string;
  onPick: (file: File) => void;
  /** 업로드 영역 위에 넣을 추가 입력 (예: 공지 과목 선택) */
  children?: ReactNode;
}

/** 업로드 전 단계 (디자인 없음 — 캡처 결과 화면 스타일을 따름) */
export function UploadStep({ title, subtitle, backTo, onPick, children }: UploadStepProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const albumRef = useRef<HTMLInputElement>(null);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f) onPick(f);
  };

  return (
    <div className={s.page}>
      <PageHeader variant="back" title={title} subtitle={subtitle} backTo={backTo} />
      {children}
      <button type="button" className={s.drop} onClick={() => albumRef.current?.click()}>
        <span className={s.dropIcon}>
          <Icon name="camera" size={28} />
        </span>
        <span className={s.dropTitle}>캡처 이미지를 올려 주세요</span>
        <span className={s.dropSub}>이미지 속 글자를 AI가 읽어 정리해요</span>
      </button>
      <div className={s.actions}>
        <Button icon="camera" fullWidth onClick={() => cameraRef.current?.click()}>
          사진 찍기
        </Button>
        <Button variant="outline" icon="image" fullWidth onClick={() => albumRef.current?.click()}>
          앨범에서 고르기
        </Button>
      </div>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={onChange} />
      <input ref={albumRef} type="file" accept="image/*" hidden onChange={onChange} />
    </div>
  );
}

export function AnalyzingStep({ previewUrl, message }: { previewUrl: string | null; message: string }) {
  return (
    <div className={s.analyzing} role="status" aria-live="polite">
      {/* 올린 이미지를 화면 가득 반투명하게 깔고 그 위에 로딩 표시 */}
      {previewUrl && <img src={previewUrl} alt="" className={s.backdrop} />}
      <div className={s.analyzingContent}>
        <span className={s.spinner} aria-hidden />
        <p className={s.analyzingTitle}>{message}</p>
        <p className={s.analyzingSub}>잠시만 기다려 주세요</p>
      </div>
    </div>
  );
}
