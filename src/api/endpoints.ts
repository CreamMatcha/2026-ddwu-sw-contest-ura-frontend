import { request } from './client';
import type {
  ApiCongestion,
  CaptureResponse,
  ClassroomAvailabilityResponse,
  EventCreateRequest,
  EventDto,
  EventUpdateRequest,
  LectureSearchResponse,
  LoginResponse,
  NoticeDetailDto,
  NoticeListResponse,
  Semester,
  SignupResponse,
  SpaceListResponse,
  TimetableListResponse,
} from './types';

export interface Term {
  academicYear: number;
  semester: Semester;
}

// ---------- users ----------
export const authApi = {
  login: (loginId: string, password: string) =>
    request<LoginResponse>('/users/login', { method: 'POST', body: { loginId, password }, anonymous: true }),
  signup: (nickname: string, loginId: string, password: string) =>
    request<SignupResponse>('/users/signup', {
      method: 'POST',
      body: { nickname, loginId, password },
      anonymous: true,
    }),
  logout: () => request<void>('/users/logout', { method: 'POST' }),
};

// ---------- timetable / lecture ----------
export const timetableApi = {
  list: (term: Term) => request<TimetableListResponse>('/timetable', { query: term }),
  add: (term: Term, lectureIds: number[], color: string) =>
    request<unknown>('/timetable', { method: 'POST', body: { ...term, lectureIds, color } }),
  updateColor: (timetableIds: number[], color: string) =>
    request<unknown>('/timetable', { method: 'PUT', query: { timetableId: timetableIds }, body: { color } }),
  remove: (timetableId: number) => request<void>(`/timetable/${timetableId}`, { method: 'DELETE' }),
  searchLectures: (term: Term, keyword: string, page = 0, size = 30) =>
    request<LectureSearchResponse>('/lecture', { query: { ...term, keyword: keyword.trim(), page, size } }),
};

// ---------- event ----------
export const eventApi = {
  list: (startDate: string, endDate: string) =>
    request<{ items: EventDto[] }>('/event', { query: { startDate, endDate } }),
  detail: (eventId: number) => request<EventDto>(`/event/${eventId}`),
  create: (body: EventCreateRequest) => request<EventDto>('/event', { method: 'POST', body }),
  update: (eventId: number, body: EventUpdateRequest) =>
    request<EventDto>(`/event/${eventId}`, { method: 'PUT', body }),
  setCompleted: (eventId: number, completed: boolean) =>
    request<EventDto>(`/event/${eventId}/completion`, { method: 'PATCH', body: { completed } }),
  remove: (eventId: number) => request<void>(`/event/${eventId}`, { method: 'DELETE' }),
  capture: (image: File) => {
    const form = new FormData();
    form.append('image', image);
    return request<CaptureResponse>('/event/capture', { method: 'POST', body: form });
  },
};

// ---------- notice ----------
export const noticeApi = {
  list: (page = 0, size = 100) => request<NoticeListResponse>('/notice', { query: { page, size } }),
  detail: (noticeId: number) => request<NoticeDetailDto>(`/notice/${noticeId}`),
  create: (image: File, userLectureId?: number) => {
    const form = new FormData();
    form.append('image', image);
    if (userLectureId) form.append('userLectureId', String(userLectureId));
    return request<NoticeDetailDto>('/notice', { method: 'POST', body: form });
  },
  remove: (noticeId: number) => request<void>(`/notice/${noticeId}`, { method: 'DELETE' }),
};

/** imageUrl(/api/v1/...)은 인증이 필요해 <img src>로 바로 못 쓰고 Blob으로 받는다 */
export function fetchImage(imageUrl: string): Promise<Blob> {
  return request<Blob>(imageUrl.replace(/^\/api\/v1/, ''), { blob: true });
}

// ---------- space ----------
export const spaceApi = {
  list: () => request<SpaceListResponse>('/space', { query: { page: 0, size: 100 } }),
  vote: (spaceId: number, congestionLevel: ApiCongestion) =>
    request<unknown>(`/space/${spaceId}`, { method: 'POST', body: { congestionLevel } }),
};

// ---------- classroom ----------
export interface AvailabilityQuery extends Term {
  /** 월 1 ~ 일 7 */
  timeWeek: number;
  startTime: string; // HH:mm
  endTime: string;
  previousBuildingName?: string;
  nextBuildingName?: string;
}

export const classroomApi = {
  availability: (q: AvailabilityQuery) =>
    request<ClassroomAvailabilityResponse>('/classroom/availability', { query: q }),
};
