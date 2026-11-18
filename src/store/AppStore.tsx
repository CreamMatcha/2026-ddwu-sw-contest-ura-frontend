import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { loadAuth, saveAuth, setUnauthorizedHandler, type StoredAuth } from '../api/client';
import { authApi } from '../api/endpoints';

/**
 * 클라이언트 전용 상태: 로그인 세션 + 캘린더에서 숨긴 과목.
 * 서버 데이터(과목·일정·공지·라운지)는 api/queries.ts의 TanStack Query 훅에서 다룬다.
 */

const HIDDEN_KEY = 'ura.hiddenCourses.v1';

function loadHidden(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HIDDEN_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

function useAppStoreValue() {
  const qc = useQueryClient();
  const [auth, setAuth] = useState<StoredAuth | null>(loadAuth);
  const [hiddenCourseIds, setHidden] = useState<string[]>(loadHidden);

  useEffect(() => {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(hiddenCourseIds));
  }, [hiddenCourseIds]);

  const clearSession = useCallback(() => {
    saveAuth(null);
    setAuth(null);
    qc.clear();
  }, [qc]);

  // 토큰이 만료돼 401을 받으면 로그인 화면으로
  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  // 만료 시각이 되면 자동 로그아웃
  useEffect(() => {
    if (!auth) return;
    const t = window.setTimeout(clearSession, Math.max(0, auth.expiresAt - Date.now()));
    return () => window.clearTimeout(t);
  }, [auth, clearSession]);

  const login = useCallback(
    async (loginId: string, password: string) => {
      const res = await authApi.login(loginId, password);
      const next: StoredAuth = {
        accessToken: res.accessToken,
        expiresAt: Date.now() + res.expiresIn * 1000,
        user: res.user,
      };
      qc.clear();
      saveAuth(next);
      setAuth(next);
    },
    [qc],
  );

  const signup = useCallback(
    async (nickname: string, loginId: string, password: string) => {
      await authApi.signup(nickname, loginId, password);
      await login(loginId, password);
    },
    [login],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* 서버는 토큰을 무효화하지 않으므로 실패해도 클라이언트에서 지우면 된다 */
    }
    clearSession();
  }, [clearSession]);

  const toggleCourseHidden = useCallback((id: string) => {
    setHidden((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id]));
  }, []);

  return { auth, login, signup, logout, hiddenCourseIds, toggleCourseHidden };
}

type AppStore = ReturnType<typeof useAppStoreValue>;

const AppStoreContext = createContext<AppStore | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const value = useAppStoreValue();
  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore(): AppStore {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error('useAppStore must be used inside AppStoreProvider');
  return ctx;
}
