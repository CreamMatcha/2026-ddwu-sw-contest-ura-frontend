import dayjs from 'dayjs';
import type {
  Assignment,
  CaptureResult,
  ClassBlock,
  CourseData,
  Notice,
  Place,
  RoomSchedule,
} from '../types';

export const mockCourses: CourseData[] = [
  { id: 'db', name: '데이터베이스프로그래밍', color: '#4079A8' },
  { id: 'os', name: '알고리즘', color: '#A08030' },
  { id: 'mp', name: '모바일응용', color: '#3A8C92' },
  { id: 'se', name: '정보보안', color: '#4E8C69' },
  { id: 'bs', name: '베스트셀러다시읽기', color: '#AD4A5D' },
  { id: 'bd', name: '빅데이터처리', color: '#B5652E' },
];

export const mockAssignments: Assignment[] = [
  { id: 'a1', courseId: 'se', title: '암호화 실습 보고서', dueAt: '2026-11-05T23:59', done: true },
  { id: 'a2', courseId: 'db', title: '정규화 실습 보고서', dueAt: '2026-11-07T23:59', done: false },
  { id: 'a3', courseId: 'mp', title: 'Compose 레이아웃 실습', dueAt: '2026-11-07T18:00', done: false },
  { id: 'a4', courseId: 'os', title: '과제 3 · 동적 프로그래밍', dueAt: '2026-11-09T18:00', done: false },
  { id: 'a5', courseId: 'mp', title: 'Room DB 연동 과제', dueAt: '2026-11-12T23:59', done: false },
  { id: 'a6', courseId: 'se', title: '취약점 분석 리포트', dueAt: '2026-11-12T13:00', done: false },
  { id: 'a7', courseId: 'db', title: 'ERD 설계 보고서', dueAt: '2026-11-18T23:59', done: false },
  { id: 'a8', courseId: 'os', title: '그래프 탐색 문제 풀이', dueAt: '2026-11-20T23:59', done: false },
  { id: 'a9', courseId: 'mp', title: '팀 프로젝트 중간 발표 자료', dueAt: '2026-11-26T09:00', done: false },
];

export const mockClasses: ClassBlock[] = [
  { id: 'k1', dayOfWeek: 1, start: '09:00', end: '10:15', courseId: 'os', room: '인A301' },
  { id: 'k2', dayOfWeek: 2, start: '10:30', end: '13:15', courseId: 'mp', room: '인B301' },
  { id: 'k3', dayOfWeek: 3, start: '10:30', end: '11:45', courseId: 'os', room: '인B301' },
  { id: 'k4', dayOfWeek: 3, start: '12:00', end: '14:45', courseId: 'db', room: '인B301' },
  { id: 'k5', dayOfWeek: 1, start: '13:30', end: '14:45', courseId: 'se', room: '인B301' },
  { id: 'k6', dayOfWeek: 2, start: '13:30', end: '14:45', courseId: 'se', room: '인B301' },
  { id: 'k7', dayOfWeek: 0, start: '15:00', end: '16:15', courseId: 'bs', room: '원207' },
  { id: 'k8', dayOfWeek: 3, start: '15:00', end: '16:15', courseId: 'bs', room: '원207' },
  { id: 'k9', dayOfWeek: 4, start: '15:00', end: '17:45', courseId: 'bd', room: '인B301' },
];

/** 장소 목록 — 투표 시각은 앱 실행 시점 기준으로 만든다 */
export function createMockPlaces(): Place[] {
  const ago = (m: number) => dayjs().subtract(m, 'minute').toISOString();
  return [
    { id: 'p1', name: '인문관 1층 카페', level: 'CROWDED', voteCount: 9, lastVotedAt: ago(3) },
    { id: 'p2', name: '숭인관 2층 글로벌 라운지', level: 'RELAXED', voteCount: 4, lastVotedAt: ago(12) },
    { id: 'p3', name: '백주년 2층 라운지', level: 'NORMAL', voteCount: 6, lastVotedAt: ago(7) },
    { id: 'p4', name: '수면실', level: 'UNKNOWN', voteCount: 0 },
  ];
}

const ALL: (0 | 1 | 2 | 3 | 4)[] = [0, 1, 2, 3, 4];

export const BUILDINGS = ['대학원', '인문관', '숭인관', '예지관', '백주년', '동인관', '인덕관'];

export const mockRoomSchedules: RoomSchedule[] = [
  { building: '인문관', name: 'B205', registeredAt: '2026-09-01', classes: [{ days: ALL, start: '09:00', end: '10:15' }, { days: ALL, start: '18:00', end: '19:15' }] },
  { building: '인문관', name: 'B301', registeredAt: '2026-09-01', classes: [{ days: ALL, start: '15:00', end: '16:15' }] },
  { building: '숭인관', name: '302호', registeredAt: '2026-09-01', classes: [{ days: ALL, start: '09:00', end: '11:45' }] },
  { building: '숭인관', name: '405호', registeredAt: '2026-09-01', classes: [{ days: ALL, start: '14:00', end: '17:00' }] },
  { building: '예지관', name: '410호', registeredAt: '2026-11-02', classes: [{ days: ALL, start: '17:30', end: '18:45' }] },
  { building: '백주년', name: '101호', registeredAt: '2026-09-01', classes: [{ days: ALL, start: '10:30', end: '11:45' }] },
  { building: '대학원', name: '201호', registeredAt: '2026-09-01', classes: [{ days: [0, 2, 4], start: '12:00', end: '13:15' }] },
  { building: '동인관', name: '203호', registeredAt: '2026-09-01', classes: [{ days: ALL, start: '18:00', end: '19:15' }] },
  { building: '인덕관', name: '305호', registeredAt: '2026-09-01', classes: [{ days: ALL, start: '16:30', end: '17:45' }, { days: [0, 3], start: '15:00', end: '16:15' }] },
];

export function createMockNotices(): Notice[] {
  const daysAgo = (n: number) => dayjs().subtract(n, 'day').startOf('day').add(10, 'hour').toISOString();
  return [
    {
      id: 'n1', courseId: 'os', isExam: true,
      title: '중간고사 범위 및 시험 안내',
      summary: '시험 범위는 1~7장이고, 계산기 지참이 가능해요.',
      points: ['범위: 교재 1~7장, 강의 슬라이드 포함', '공학용 계산기 지참 가능', '시험 장소는 평소 강의실과 같음'],
      mentionedDates: [{ at: '2026-11-20T10:30', label: '중간고사' }],
      savedAt: daysAgo(0),
    },
    {
      id: 'n2', courseId: 'db', isExam: false,
      title: '팀 프로젝트 중간 발표 일정',
      summary: '팀별 10분 발표, 발표 자료는 전날까지 LMS에 제출해요.',
      points: ['팀별 발표 10분 + 질의응답 5분', '발표 자료는 발표 전날 23:59까지 제출', '발표 순서는 수업 시간에 추첨'],
      mentionedDates: [{ at: '2026-11-25', label: '팀 프로젝트 중간 발표' }],
      savedAt: daysAgo(1),
    },
    {
      id: 'n3', isExam: false,
      title: '2학기 수강 철회 기간 안내',
      summary: '포털에서 신청할 수 있고 철회한 과목은 성적표에 W로 표시돼요.',
      points: ['포털 > 수업 > 수강철회 메뉴에서 신청', '성적표에 W로 표시'],
      mentionedDates: [],
      savedAt: daysAgo(3),
    },
    {
      id: 'n4', courseId: 'mp', isExam: false,
      title: '실습 환경 업데이트 공지',
      summary: 'Android Studio 최신 버전으로 업데이트한 뒤 실습에 참여해 주세요.',
      points: ['Android Studio 최신 안정 버전 설치', '에뮬레이터는 API 34 이상 권장'],
      mentionedDates: [],
      savedAt: daysAgo(7),
    },
  ];
}

/** 과제 캡처 분석 결과 (서버 연동 전 목 데이터) */
export const mockCaptureResults: CaptureResult[] = [
  { tempId: 'c1', courseName: '알고리즘', title: '과제 4 · 최단 경로 알고리즘', dueAt: '2026-11-16T23:59' },
  { tempId: 'c2', courseName: '빅데이터처리', title: 'LABHW9 제출', dueAt: '2026-11-19T18:00' },
  { tempId: 'c3', courseName: '데이터베이스프로그래밍', title: 'ERD 설계 보고서' },
];

/** 공지 캡처 분석 결과 (서버 연동 전 목 데이터) */
export function createMockNoticeCapture(): Omit<Notice, 'id'> {
  return {
    courseId: 'mp', isExam: false,
    title: '기말 프로젝트 제출 안내',
    summary: '최종 결과물과 보고서를 12월 15일까지 LMS에 함께 올려 주세요.',
    points: ['APK 파일과 소스 코드 압축본 제출', '보고서는 10쪽 이내 PDF', '지각 제출은 하루당 10% 감점'],
    mentionedDates: [{ at: '2026-12-15T23:59', label: '기말 프로젝트 제출 마감' }],
    savedAt: dayjs().toISOString(),
  };
}
