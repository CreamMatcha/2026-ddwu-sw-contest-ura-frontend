import type { ErrorResponse } from './types';

/**
 * 백엔드 공통 fetch 래퍼.
 * - 기본 경로는 /api/v1 (개발 중에는 Vite 프록시가 백엔드로 넘긴다)
 * - 배포 시 다른 출처의 백엔드를 쓰면 VITE_API_BASE_URL로 지정 (백엔드 CORS 설정 필요)
 */
const BASE_URL = `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/v1`;

const AUTH_KEY = 'ura.auth.v1';

export interface StoredAuth {
  accessToken: string;
  /** 만료 시각 (epoch ms) */
  expiresAt: number;
  user: { userId: number; nickname: string; loginId: string };
}

export function loadAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const auth = JSON.parse(raw) as StoredAuth;
    return auth.expiresAt > Date.now() ? auth : null;
  } catch {
    return null;
  }
}

export function saveAuth(auth: StoredAuth | null) {
  if (auth) localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  else localStorage.removeItem(AUTH_KEY);
}

/** 401을 받으면 호출 (AppStore가 등록해 로그아웃 처리) */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fieldErrors: { field: string; reason: string }[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** 특정 필드의 검증 오류 문구 */
  fieldError(field: string): string | undefined {
    return this.fieldErrors.find((e) => e.field === field)?.reason;
  }
}

/** 화면에 띄울 오류 문구 */
export function errorMessage(err: unknown, fallback = '잠시 후 다시 시도해 주세요'): string {
  if (err instanceof ApiError) {
    if (err.status === 0) return '서버에 연결할 수 없어요. 백엔드가 켜져 있는지 확인해 주세요';
    return err.fieldErrors[0]?.reason ?? err.message ?? fallback;
  }
  return fallback;
}

type QueryValue = string | number | boolean | null | undefined | (string | number)[];
type Query = Record<string, QueryValue>;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: object;
  /** 객체는 JSON으로, FormData는 multipart로 보낸다 */
  body?: unknown;
  /** 응답을 Blob으로 받기 (이미지) */
  blob?: boolean;
  /** 로그인/회원가입처럼 토큰 없이 보내는 요청 */
  anonymous?: boolean;
}

function buildUrl(path: string, query?: object): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries((query ?? {}) as Query)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) value.forEach((v) => params.append(key, String(v)));
    else params.append(key, String(value));
  }
  const qs = params.toString();
  return `${BASE_URL}${path}${qs ? `?${qs}` : ''}`;
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const auth = opts.anonymous ? null : loadAuth();
  if (auth) headers.Authorization = `Bearer ${auth.accessToken}`;

  let body: BodyInit | undefined;
  if (opts.body instanceof FormData) body = opts.body;
  else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), { method: opts.method ?? 'GET', headers, body });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', '서버에 연결할 수 없어요');
  }

  if (!res.ok) {
    let data: Partial<ErrorResponse> = {};
    try {
      data = (await res.json()) as ErrorResponse;
    } catch {
      /* 본문이 JSON이 아님 (프록시 오류 등) */
    }
    if (res.status === 401 && !opts.anonymous) {
      saveAuth(null);
      onUnauthorized?.();
    }
    // Vite 프록시가 백엔드에 못 붙으면 500/502/504를 본문 없이 돌려준다
    if (!data.code && res.status >= 500) {
      throw new ApiError(0, 'NETWORK_ERROR', '서버에 연결할 수 없어요');
    }
    throw new ApiError(
      res.status,
      data.code ?? 'HTTP_ERROR',
      data.message || '요청을 처리하지 못했어요',
      data.errors ?? [],
    );
  }

  if (opts.blob) return (await res.blob()) as T;
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
