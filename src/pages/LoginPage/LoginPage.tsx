import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ApiError, errorMessage } from '../../api/client';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { TextField } from '../../components/TextField';
import { useAppStore } from '../../store/AppStore';
import s from './LoginPage.module.css';

interface Errors {
  nickname?: string;
  loginId?: string;
  password?: string;
  confirm?: string;
}

// 백엔드 SignupRequestDto 검증 규칙과 같게 맞춘다
const LOGIN_ID_RE = /^[a-z0-9_]{4,50}$/;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,20}$/;

/** 로그인 / 회원가입 (회원가입은 디자인이 없어 로그인 폼을 재사용) */
export function LoginPage({ mode }: { mode: 'login' | 'signup' }) {
  const { auth, login, signup } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [nickname, setNickname] = useState('');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const isSignup = mode === 'signup';

  if (auth) return <Navigate to="/" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const id = loginId.trim();
    const next: Errors = {};
    if (isSignup && !nickname.trim()) next.nickname = '닉네임을 입력해 주세요';
    if (!id) next.loginId = '아이디를 입력해 주세요';
    else if (isSignup && !LOGIN_ID_RE.test(id)) next.loginId = '영문 소문자, 숫자, 밑줄(_)로 4~50자 입력해 주세요';
    if (!password) next.password = '비밀번호를 입력해 주세요';
    else if (isSignup && !PASSWORD_RE.test(password)) next.password = '영문과 숫자를 포함해 8~20자로 입력해 주세요';
    if (isSignup && confirm !== password) next.confirm = '비밀번호가 서로 달라요';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      if (isSignup) await signup(nickname.trim(), id, password);
      else await login(id, password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from !== '/login' && from !== '/signup' ? from : '/', { replace: true });
    } catch (err) {
      setErrors(toFieldErrors(err));
      setBusy(false);
    }
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
        {isSignup && (
          <TextField
            id="nickname"
            label="닉네임"
            autoComplete="nickname"
            placeholder="앱에서 쓸 이름"
            maxLength={100}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            error={errors.nickname}
          />
        )}
        <TextField
          id="loginId"
          label="아이디"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={isSignup ? '영문 소문자·숫자·밑줄 4자 이상' : '아이디 입력'}
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          error={errors.loginId}
        />
        <TextField
          id="pw"
          label="비밀번호"
          type="password"
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          placeholder={isSignup ? '영문·숫자 포함 8~20자' : '비밀번호 입력'}
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
        <Button type="submit" fullWidth className={s.submit} disabled={busy} aria-busy={busy}>
          {busy ? (isSignup ? '가입하는 중…' : '로그인하는 중…') : isSignup ? '회원가입' : '로그인'}
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

/** 서버 오류 → 입력창별 문구 */
function toFieldErrors(err: unknown): Errors {
  if (err instanceof ApiError) {
    if (err.code === 'DUPLICATE_LOGIN_ID') return { loginId: '이미 사용 중인 아이디예요' };
    if (err.code === 'INVALID_CREDENTIALS') return { password: '아이디 또는 비밀번호가 맞지 않아요' };
    const fields: Errors = {};
    for (const key of ['nickname', 'loginId', 'password'] as const) {
      const reason = err.fieldError(key);
      if (reason) fields[key] = reason;
    }
    if (Object.keys(fields).length) return fields;
  }
  return { password: errorMessage(err, '로그인하지 못했어요. 잠시 후 다시 시도해 주세요') };
}
