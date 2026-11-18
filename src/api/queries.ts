import { useMutation, useQueries, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import type {
  Assignment,
  AssignmentDetail,
  ClassBlock,
  Course,
  DayOfWeek,
  Notice,
  NoticeSummary,
  Place,
  VoteLevel,
} from '../types';
import { PALETTE } from '../utils/color';
import { ApiError } from './client';
import {
  classroomApi,
  eventApi,
  noticeApi,
  spaceApi,
  timetableApi,
  type AvailabilityQuery,
  type Term,
} from './endpoints';
import { currentTerm } from './term';
import type {
  ApiCongestion,
  EventCreateRequest,
  EventDto,
  NoticeDetailDto,
  NoticeListItemDto,
  SpaceItemDto,
  TimetableItemDto,
} from './types';

// ---------- 쿼리 키 ----------
export const qk = {
  timetable: (t: Term) => ['timetable', t.academicYear, t.semester] as const,
  events: ['events'] as const,
  /** ['events'] 아래에 두어 일정이 바뀔 때 함께 무효화된다 */
  event: (id: number) => ['events', 'detail', id] as const,
  notices: ['notices'] as const,
  notice: (id: number) => ['notices', 'detail', id] as const,
  spaces: ['spaces'] as const,
  rooms: (q: AvailabilityQuery) => ['rooms', q] as const,
  lectures: (t: Term, keyword: string) => ['lectures', t.academicYear, t.semester, keyword] as const,
};

/** 일정은 범위를 넓게 한 번에 받는다 (캘린더·과목별 남은 과제 수에 같이 쓰임) */
const EVENT_RANGE = { start: '2000-01-01', end: '2099-12-31' };

/** 네트워크 오류·5xx만 한 번 재시도 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status > 0 && error.status < 500) return false;
  return failureCount < 1;
}

// ---------- 변환 ----------
const GRAY = PALETTE.find((p) => p.name === '그레이')!.color;

/** 백엔드 기본 색("gray") 등 hex가 아닌 값은 팔레트 그레이로 */
export function normalizeColor(color: string | null | undefined): string {
  return color && /^#[0-9a-f]{6}$/i.test(color) ? color : GRAY;
}

const hhmm = (t: string) => t.slice(0, 5);
export const courseKey = (courseCode: string, sectionCode: string) => `${courseCode}-${sectionCode}`;

function toAssignment(e: EventDto, courseIdOf: (id: number | null) => string | undefined): Assignment {
  return {
    id: e.eventId,
    courseId: courseIdOf(e.userLectureId),
    title: e.title,
    dueAt: `${e.eventDate}T${e.eventTime ? hhmm(e.eventTime) : '23:59'}`,
    hasTime: !!e.eventTime,
    done: e.completed,
    type: e.eventType,
  };
}

function toAssignmentDetail(e: EventDto, courseIdOf: (id: number | null) => string | undefined): AssignmentDetail {
  return {
    ...toAssignment(e, courseIdOf),
    memo: e.memo?.trim() || undefined,
    sourceNoticeId: e.sourceNoticeId ?? undefined,
    createdAt: e.createdAt,
  };
}

function toClassBlock(item: TimetableItemDto): ClassBlock | null {
  // 화면 시간표는 월~금만 그린다
  if (item.dayOfWeek < 1 || item.dayOfWeek > 5) return null;
  return {
    id: item.timetableId,
    courseId: courseKey(item.courseCode, item.sectionCode),
    dayOfWeek: (item.dayOfWeek - 1) as DayOfWeek,
    start: hhmm(item.startsAt),
    end: hhmm(item.endsAt),
    room: item.classroom ? `${item.classroom.buildingName} ${item.classroom.roomName}` : '온라인·미정',
    building: item.classroom?.buildingName,
  };
}

const LEVEL_FROM_API: Record<SpaceItemDto['congestionLevel'], Place['level']> = {
  low: 'RELAXED',
  medium: 'NORMAL',
  high: 'CROWDED',
  unknown: 'UNKNOWN',
};
const LEVEL_TO_API: Record<VoteLevel, ApiCongestion> = { RELAXED: 'low', NORMAL: 'medium', CROWDED: 'high' };

function toPlace(s: SpaceItemDto): Place {
  return {
    id: s.spaceId,
    name: s.name,
    building: s.buildingName,
    level: LEVEL_FROM_API[s.congestionLevel] ?? 'UNKNOWN',
    voteCount: s.validVoteCount,
    lastVotedAt: s.latestVoteAt ?? undefined,
    myVote: s.myVote ? (LEVEL_FROM_API[s.myVote.congestionLevel] as VoteLevel) : undefined,
    myVotedAt: s.myVote?.createdAt,
  };
}

function toNoticeSummary(n: NoticeListItemDto, courseIdOf: (id: number | null) => string | undefined): NoticeSummary {
  return {
    id: n.noticeId,
    courseId: courseIdOf(n.userLectureId),
    lectureName: n.lectureName ?? undefined,
    title: n.title,
    summary: n.summary,
    savedAt: n.createdAt,
  };
}

export function toNotice(d: NoticeDetailDto, courseIdOf: (id: number | null) => string | undefined): Notice {
  return {
    id: d.noticeId,
    courseId: courseIdOf(d.userLectureId),
    lectureName: d.lectureName ?? undefined,
    title: d.title,
    summary: d.summary,
    savedAt: d.createdAt,
    isExam: d.eventCandidates.some((c) => c.eventType === 'exam'),
    points: d.actionItems,
    mentionedDates: d.eventCandidates
      .filter((c) => c.eventDate)
      .map((c) => ({
        at: c.eventTime ? `${c.eventDate}T${hhmm(c.eventTime)}` : c.eventDate!,
        label: c.title,
        type: c.eventType ?? 'other',
        memo: c.memo ?? undefined,
      })),
    imageUrl: d.imageUrl ?? undefined,
  };
}

// ---------- 시간표 + 일정 (과목·캘린더) ----------
export function useSchedule() {
  const term = currentTerm();
  const timetable = useQuery({ queryKey: qk.timetable(term), queryFn: () => timetableApi.list(term) });
  const events = useQuery({
    queryKey: qk.events,
    queryFn: () => eventApi.list(EVENT_RANGE.start, EVENT_RANGE.end),
  });

  const derived = useMemo(() => {
    const items = timetable.data?.items ?? [];
    // timetableId(=userLectureId) → 과목 ID
    const byRow = new Map<number, string>();
    const grouped = new Map<string, TimetableItemDto[]>();
    for (const item of [...items].sort((a, b) => a.timetableId - b.timetableId)) {
      const key = courseKey(item.courseCode, item.sectionCode);
      byRow.set(item.timetableId, key);
      grouped.set(key, [...(grouped.get(key) ?? []), item]);
    }
    const courseIdOf = (id: number | null) => (id == null ? undefined : byRow.get(id));

    const assignments = (events.data?.items ?? []).map((e) => toAssignment(e, courseIdOf));
    const courses: Course[] = [...grouped.entries()].map(([key, rows]) => ({
      id: key,
      name: rows[0].name,
      color: normalizeColor(rows[0].color),
      timetableIds: rows.map((r) => r.timetableId),
      primaryTimetableId: rows[0].timetableId,
      remainingCount: assignments.filter((a) => a.courseId === key && !a.done).length,
    }));
    const classes = items.map(toClassBlock).filter((k): k is ClassBlock => !!k);
    return { courses, courseById: new Map(courses.map((c) => [c.id, c])), courseIdOf, assignments, classes };
  }, [timetable.data, events.data]);

  return {
    term,
    ...derived,
    isLoading: timetable.isPending || events.isPending,
    error: timetable.error ?? events.error,
    refetch: () => Promise.all([timetable.refetch(), events.refetch()]),
  };
}

/** 과목·공지 매핑만 필요할 때 (일정은 안 받음) */
export function useCourseLookup() {
  const term = currentTerm();
  const timetable = useQuery({ queryKey: qk.timetable(term), queryFn: () => timetableApi.list(term) });
  return useMemo(() => {
    const byRow = new Map<number, string>();
    for (const item of timetable.data?.items ?? []) byRow.set(item.timetableId, courseKey(item.courseCode, item.sectionCode));
    return { courseIdOf: (id: number | null) => (id == null ? undefined : byRow.get(id)), ready: !!timetable.data };
  }, [timetable.data]);
}

// ---------- 일정 ----------
export function useToggleAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, done }: { id: number; done: boolean }) => eventApi.setCompleted(id, done),
    // 체크는 바로 반영하고 실패하면 되돌린다
    onMutate: async ({ id, done }) => {
      await qc.cancelQueries({ queryKey: qk.events });
      const prev = qc.getQueryData<{ items: EventDto[] }>(qk.events);
      const prevDetail = qc.getQueryData<EventDto>(qk.event(id));
      qc.setQueryData<{ items: EventDto[] }>(qk.events, (old) =>
        old && { items: old.items.map((e) => (e.eventId === id ? { ...e, completed: done } : e)) },
      );
      qc.setQueryData<EventDto>(qk.event(id), (old) => old && { ...old, completed: done });
      return { prev, prevDetail };
    },
    onError: (_err, { id }, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.events, ctx.prev);
      if (ctx?.prevDetail) qc.setQueryData(qk.event(id), ctx.prevDetail);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.events }),
  });
}

export function useAssignment(id: number) {
  const { courseIdOf } = useCourseLookup();
  const q = useQuery({
    queryKey: qk.event(id),
    queryFn: () => eventApi.detail(id),
    enabled: Number.isInteger(id) && id > 0,
  });
  const assignment = useMemo(() => (q.data ? toAssignmentDetail(q.data, courseIdOf) : undefined), [q.data, courseIdOf]);
  return { assignment, isLoading: q.isPending && q.fetchStatus !== 'idle', error: q.error, refetch: q.refetch };
}

/** 메모만 바꾼다. 수정 API가 전체 교체라 나머지 값은 서버에 있는 그대로 다시 보낸다 */
export function useUpdateAssignmentMemo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, memo }: { id: number; memo: string }) => {
      const current = await qc.fetchQuery({ queryKey: qk.event(id), queryFn: () => eventApi.detail(id) });
      return eventApi.update(id, {
        userLectureId: current.userLectureId,
        title: current.title,
        eventType: current.eventType,
        eventDate: current.eventDate,
        eventTime: current.eventTime,
        memo: memo.trim() || null,
      });
    },
    onSuccess: (updated) => {
      qc.setQueryData(qk.event(updated.eventId), updated);
      qc.invalidateQueries({ queryKey: qk.events, exact: true });
    },
  });
}

export function useDeleteAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => eventApi.remove(id),
    onSuccess: (_d, id) => {
      qc.removeQueries({ queryKey: qk.event(id) });
      qc.invalidateQueries({ queryKey: qk.events, exact: true });
    },
  });
}

/** 여러 일정을 차례로 저장. 일부가 실패하면 저장된 개수와 첫 오류를 돌려준다 */
export function useCreateEvents() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (requests: EventCreateRequest[]) => {
      let saved = 0;
      for (const req of requests) {
        try {
          await eventApi.create(req);
          saved++;
        } catch (error) {
          return { saved, error };
        }
      }
      return { saved, error: undefined };
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.events }),
  });
}

export function useCaptureAssignments() {
  return useMutation({ mutationFn: (file: File) => eventApi.capture(file) });
}

// ---------- 과목(시간표) ----------
export function useLectureSearch(keyword: string, enabled: boolean) {
  const term = currentTerm();
  return useQuery({
    queryKey: qk.lectures(term, keyword),
    queryFn: () => timetableApi.searchLectures(term, keyword),
    enabled,
    staleTime: 60_000,
  });
}

export function useAddLecture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lectureIds, color }: { lectureIds: number[]; color: string }) =>
      timetableApi.add(currentTerm(), lectureIds, color),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timetable'] });
      qc.invalidateQueries({ queryKey: ['lectures'] });
    },
  });
}

export function useUpdateCourseColor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ course, color }: { course: Course; color: string }) =>
      timetableApi.updateColor(course.timetableIds, color),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timetable'] }),
  });
}

export class CourseInUseError extends Error {
  constructor(readonly noticeCount: number) {
    super(`이 과목에 연결된 공지 ${noticeCount}개를 먼저 삭제해 주세요`);
  }
}

/**
 * 과목 삭제 = 과목의 일정 삭제 → 시간표 행 삭제.
 * 백엔드는 공지·일정이 연결된 시간표 행을 지우지 못하게 막으므로(409),
 * 공지가 연결돼 있으면 아무것도 지우기 전에 멈춘다.
 */
export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (course: Course) => {
      const rows = new Set(course.timetableIds);
      const notices = await qc.fetchQuery({ queryKey: qk.notices, queryFn: () => noticeApi.list() });
      const linked = notices.items.filter((n) => n.userLectureId != null && rows.has(n.userLectureId));
      if (linked.length) throw new CourseInUseError(linked.length);

      const events = await qc.fetchQuery({
        queryKey: qk.events,
        queryFn: () => eventApi.list(EVENT_RANGE.start, EVENT_RANGE.end),
      });
      for (const e of events.items) {
        if (e.userLectureId != null && rows.has(e.userLectureId)) await eventApi.remove(e.eventId);
      }
      for (const id of course.timetableIds) await timetableApi.remove(id);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['timetable'] });
      qc.invalidateQueries({ queryKey: qk.events });
      qc.invalidateQueries({ queryKey: ['lectures'] });
    },
  });
}

// ---------- 라운지 ----------
export function usePlaces() {
  return useQuery({
    queryKey: qk.spaces,
    queryFn: () => spaceApi.list(),
    select: (d) => d.items.map(toPlace),
    refetchInterval: 60_000,
  });
}

export function useVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ placeId, level }: { placeId: number; level: VoteLevel }) => spaceApi.vote(placeId, LEVEL_TO_API[level]),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.spaces }),
  });
}

// ---------- 빈 강의실 ----------
export function useEmptyRooms(q: AvailabilityQuery) {
  return useQuery({ queryKey: qk.rooms(q), queryFn: () => classroomApi.availability(q) });
}

// ---------- 공지 ----------
export function useNotices() {
  const { courseIdOf, ready } = useCourseLookup();
  const list = useQuery({ queryKey: qk.notices, queryFn: () => noticeApi.list() });
  const items = list.data?.items ?? [];

  // 목록 응답에는 시험 여부·언급된 날짜가 없어 상세를 함께 받아 채운다
  const details = useQueries({
    queries: items.map((n) => ({
      queryKey: qk.notice(n.noticeId),
      queryFn: () => noticeApi.detail(n.noticeId),
      staleTime: 5 * 60_000,
    })),
  });

  const detailById = new Map(details.filter((d) => d.data).map((d) => [d.data!.noticeId, d.data!]));
  const notices: Notice[] = items.map((n) => {
    const d = detailById.get(n.noticeId);
    return d
      ? toNotice(d, courseIdOf)
      : { ...toNoticeSummary(n, courseIdOf), isExam: false, points: [], mentionedDates: [] };
  });

  return { notices, isLoading: list.isPending || !ready, error: list.error, refetch: list.refetch };
}

export function useNotice(id: number) {
  const { courseIdOf } = useCourseLookup();
  const q = useQuery({
    queryKey: qk.notice(id),
    queryFn: () => noticeApi.detail(id),
    enabled: Number.isInteger(id) && id > 0,
  });
  const notice = useMemo(() => (q.data ? toNotice(q.data, courseIdOf) : undefined), [q.data, courseIdOf]);
  return { notice, isLoading: q.isPending && q.fetchStatus !== 'idle', error: q.error };
}

export function useCreateNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, userLectureId }: { file: File; userLectureId?: number }) => noticeApi.create(file, userLectureId),
    onSuccess: (d) => {
      qc.setQueryData(qk.notice(d.noticeId), d);
      qc.invalidateQueries({ queryKey: qk.notices, exact: true });
    },
  });
}

export function useDeleteNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => noticeApi.remove(id),
    onSuccess: (_d, id) => {
      qc.removeQueries({ queryKey: qk.notice(id) });
      qc.invalidateQueries({ queryKey: qk.notices, exact: true });
    },
  });
}

/** 공지에 언급된 날짜를 캘린더 일정으로 저장 */
export function useAddNoticeDateToCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: EventCreateRequest) => eventApi.create(req),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.events }),
  });
}

export function clearServerState(qc: QueryClient) {
  qc.clear();
}
