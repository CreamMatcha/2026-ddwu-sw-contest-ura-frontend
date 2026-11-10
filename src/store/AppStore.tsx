import dayjs from 'dayjs';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  createMockNotices,
  createMockPlaces,
  mockAssignments,
  mockClasses,
  mockCourses,
} from '../mocks';
import type {
  Assignment,
  ClassBlock,
  Course,
  CourseData,
  Notice,
  Place,
  VoteLevel,
} from '../types';
import { nextPaletteColor } from '../utils/color';

/**
 * Phase 2~3용 클라이언트 상태 저장소 (목 데이터 + localStorage).
 * Phase 4에서 api/ + TanStack Query로 교체한다.
 */

interface PersistedState {
  auth: { email: string } | null;
  courses: CourseData[];
  assignments: Assignment[];
  classes: ClassBlock[];
  notices: Notice[];
  hiddenCourseIds: string[];
}

interface State extends PersistedState {
  places: Place[];
}

const STORAGE_KEY = 'ura.state.v1';

function initialState(): State {
  const base: PersistedState = {
    auth: null,
    courses: mockCourses,
    assignments: mockAssignments,
    classes: mockClasses,
    notices: createMockNotices(),
    hiddenCourseIds: [],
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) Object.assign(base, JSON.parse(raw) as Partial<PersistedState>);
  } catch {
    /* 저장된 값이 깨졌으면 목 데이터로 시작 */
  }
  return { ...base, places: createMockPlaces() };
}

let idSeq = 0;
const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}${(idSeq++).toString(36)}`;

export interface NewAssignmentInput {
  courseId?: string;
  courseName: string;
  title: string;
  dueAt: string;
}

function useAppStoreValue() {
  const [state, setState] = useState<State>(initialState);

  useEffect(() => {
    const { places: _places, ...persisted } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  }, [state]);

  const courses: Course[] = useMemo(
    () =>
      state.courses.map((c) => ({
        ...c,
        remainingCount: state.assignments.filter((a) => a.courseId === c.id && !a.done).length,
      })),
    [state.courses, state.assignments],
  );

  const courseById = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);

  // ---------- 인증 ----------
  const login = useCallback((email: string) => setState((s) => ({ ...s, auth: { email } })), []);
  const logout = useCallback(() => setState((s) => ({ ...s, auth: null })), []);

  // ---------- 과제 ----------
  const toggleAssignment = useCallback(
    (id: string) =>
      setState((s) => ({
        ...s,
        assignments: s.assignments.map((a) => (a.id === id ? { ...a, done: !a.done } : a)),
      })),
    [],
  );

  /** 캡처 결과 저장. courseId가 없으면 같은 이름 과목을 찾고, 없으면 새 과목을 만든다 */
  const addAssignments = useCallback((inputs: NewAssignmentInput[]) => {
    setState((s) => {
      const nextCourses = [...s.courses];
      const added: Assignment[] = inputs.map((input) => {
        let courseId = input.courseId;
        if (!courseId) {
          const name = input.courseName.trim();
          let course = nextCourses.find((c) => c.name === name);
          if (!course) {
            course = { id: newId('c'), name, color: nextPaletteColor(nextCourses.map((c) => c.color)) };
            nextCourses.push(course);
          }
          courseId = course.id;
        }
        return { id: newId('a'), courseId, title: input.title.trim(), dueAt: input.dueAt, done: false };
      });
      return { ...s, courses: nextCourses, assignments: [...s.assignments, ...added] };
    });
  }, []);

  // ---------- 과목 ----------
  const addCourse = useCallback((name: string, color: string) => {
    setState((s) => ({ ...s, courses: [...s.courses, { id: newId('c'), name: name.trim(), color }] }));
  }, []);

  const updateCourse = useCallback((id: string, patch: Partial<Omit<CourseData, 'id'>>) => {
    setState((s) => ({
      ...s,
      courses: s.courses.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }, []);

  /** 과목 삭제 시 해당 과목의 과제·수업도 지우고, 공지는 미분류로 돌린다 */
  const deleteCourse = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      courses: s.courses.filter((c) => c.id !== id),
      assignments: s.assignments.filter((a) => a.courseId !== id),
      classes: s.classes.filter((k) => k.courseId !== id),
      notices: s.notices.map((n) => (n.courseId === id ? { ...n, courseId: undefined } : n)),
      hiddenCourseIds: s.hiddenCourseIds.filter((h) => h !== id),
    }));
  }, []);

  const toggleCourseHidden = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      hiddenCourseIds: s.hiddenCourseIds.includes(id)
        ? s.hiddenCourseIds.filter((h) => h !== id)
        : [...s.hiddenCourseIds, id],
    }));
  }, []);

  // ---------- 시간표 ----------
  const addClass = useCallback((block: Omit<ClassBlock, 'id'>) => {
    setState((s) => ({ ...s, classes: [...s.classes, { ...block, id: newId('k') }] }));
  }, []);

  // ---------- 라운지 ----------
  const vote = useCallback((placeId: string, level: VoteLevel) => {
    setState((s) => {
      const now = dayjs();
      return {
        ...s,
        places: s.places.map((p) => {
          if (p.id !== placeId) return p;
          if (p.canVoteAt && now.isBefore(p.canVoteAt)) return p;
          return {
            ...p,
            myVote: level,
            canVoteAt: now.add(10, 'minute').toISOString(),
            voteCount: p.voteCount + 1,
            lastVotedAt: now.toISOString(),
            level: p.level === 'UNKNOWN' ? level : p.level,
          };
        }),
      };
    });
  }, []);

  /** 목 새로고침: 30분이 지난 장소는 정보 없음 처리 */
  const refreshPlaces = useCallback(() => {
    setState((s) => {
      const limit = dayjs().subtract(30, 'minute');
      return {
        ...s,
        places: s.places.map((p) =>
          p.lastVotedAt && dayjs(p.lastVotedAt).isBefore(limit)
            ? { ...p, level: 'UNKNOWN', voteCount: 0, lastVotedAt: undefined }
            : p,
        ),
      };
    });
  }, []);

  // ---------- 공지 ----------
  const addNotice = useCallback((notice: Omit<Notice, 'id'>): string => {
    const id = newId('n');
    setState((s) => ({ ...s, notices: [{ ...notice, id }, ...s.notices] }));
    return id;
  }, []);

  const deleteNotice = useCallback((id: string) => {
    setState((s) => ({ ...s, notices: s.notices.filter((n) => n.id !== id) }));
  }, []);

  return {
    auth: state.auth,
    courses,
    courseById,
    assignments: state.assignments,
    classes: state.classes,
    places: state.places,
    notices: state.notices,
    hiddenCourseIds: state.hiddenCourseIds,
    login,
    logout,
    toggleAssignment,
    addAssignments,
    addCourse,
    updateCourse,
    deleteCourse,
    toggleCourseHidden,
    addClass,
    vote,
    refreshPlaces,
    addNotice,
    deleteNotice,
  };
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
