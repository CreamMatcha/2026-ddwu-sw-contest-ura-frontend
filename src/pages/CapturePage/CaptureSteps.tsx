import { useEffect, useRef, useState, type ChangeEvent } from 'react';
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
}

/** 업로드 전 단계 (디자인 없음 — 캡처 결과 화면 스타일을 따름) */
export function UploadStep({ title, subtitle, backTo, onPick }: UploadStepProps) {
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
      <button type="button" className={s.drop} onClick={() => albumRef.current?.click()}>
        <span className={s.dropIcon}>
          <Icon name="camera" size={28} />
        </span>
        <span className={s.dropTitle}>캡처 이미지를 올려 주세요</span>
        <span className={s.dropSub}>이미지는 분석에만 쓰이고 저장되지 않아요</span>
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
      {previewUrl && <img src={previewUrl} alt="" className={s.preview} />}
      <span className={s.spinner} aria-hidden />
      <p className={s.analyzingTitle}>{message}</p>
      <p className={s.dropSub}>잠시만 기다려 주세요</p>
    </div>
  );
}
