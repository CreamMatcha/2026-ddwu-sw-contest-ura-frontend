import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { TextField } from '../../components/TextField';
import { useAppStore } from '../../store/AppStore';
import s from './LoginPage.module.css';

interface Errors {
  email?: string;
  password?: string;
  confirm?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 로그인 / 회원가입 (회원가입은 디자인이 없어 로그인 폼을 재사용) */
export function LoginPage({ mode }: { mode: 'login' | 'signup' }) {
  const { auth, login } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const isSignup = mode === 'signup';

  if (auth) return <Navigate to="/" replace />;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!EMAIL_RE.test(email.trim())) next.email = '이메일 형식을 확인해 주세요';
    if (!password) next.password = '비밀번호를 입력해 주세요';
    else if (isSignup && password.length < 8) next.password = '비밀번호는 8자 이상이어야 해요';
    if (isSignup && confirm !== password) next.confirm = '비밀번호가 서로 달라요';
    setErrors(next);
    if (Object.keys(next).length) return;

    // TODO(Phase 4): 실제 로그인/회원가입 API 호출, 실패 시 입력창 error 상태
    login(email.trim());
    const from = (location.state as { from?: string } | null)?.from;
    navigate(from && from !== '/login' ? from : '/', { replace: true });
  };

  return (
    <div className={s.page}>
      <div className={s.hero}>
        <div className={s.logo}>
          <Icon name="logo" size={36} label="우라 로고" />
        </div>
        <h1 className={s.name}>우라</h1>
        <p className={s.intro}>
          과제 마감부터 빈 강의실, 라운지 자리까지
          <br />
          캠퍼스 생활을 한곳에서 관리해요
        </p>
      </div>

      <form className={s.form} onSubmit={onSubmit} noValidate>
        <TextField
          id="email"
          label="이메일"
          type="email"
          autoComplete="email"
          placeholder="example@school.ac.kr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <TextField
          id="pw"
          label="비밀번호"
          type="password"
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          placeholder={isSignup ? '8자 이상 입력' : '비밀번호 입력'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        {isSignup && (
          <TextField
            id="pw2"
            label="비밀번호 확인"
            type="password"
            autoComplete="new-password"
            placeholder="비밀번호 다시 입력"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={errors.confirm}
          />
        )}
        <Button type="submit" fullWidth className={s.submit}>
          {isSignup ? '회원가입' : '로그인'}
        </Button>
        <p className={s.switch}>
          {isSignup ? (
            <>
              이미 계정이 있나요? <Link to="/login">로그인</Link>
            </>
          ) : (
            <>
              처음이신가요? <Link to="/signup">회원가입</Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
