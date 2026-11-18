import type { EventType } from '../api/types';

export type CourseColor = string; // 팔레트 hex

/**
 * 과목 = 내 시간표에 담은 강의 분반 (같은 과목코드·분반의 요일별 수업 행을 묶은 것)
 * 백엔드는 요일별 행(timetableId)을 따로 저장하므로 timetableIds를 함께 들고 있는다.
 */
export interface Course {
  /** `${courseCode}-${sectionCode}` */
  id: string;
  name: string;
  color: CourseColor;
  remainingCount: number;
  timetableIds: number[];
  /** 대표 수업 행 ID. 일정·공지를 이 과목에 연결할 때 userLectureId로 보낸다 */
  primaryTimetableId: number;
}

/** 캘린더 일정 (백엔드 event) */
export interface Assignment {
  id: number;
  /** 없으면 미분류 */
  courseId?: string;
  title: string;
  /** 로컬 시각 YYYY-MM-DDTHH:mm. 시각이 없는 일정은 23:59로 둔다 */
  dueAt: string;
  hasTime: boolean;
  done: boolean;
  type: EventType;
}

/** 일정 상세 (메모·원본 출처 포함) */
export interface AssignmentDetail extends Assignment {
  /** AI가 캡처에서 읽은 메모 등 */
  memo?: string;
  sourceNoticeId?: number;
  createdAt: string;
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4; // 월~금

export interface ClassBlock {
  id: number;
  courseId: string;
  dayOfWeek: DayOfWeek;
  start: string; // "10:30"
  end: string;
  room: string;
  /** 건물명 (온라인·미정이면 없음) */
  building?: string;
}

export type CongestionLevel = 'RELAXED' | 'NORMAL' | 'CROWDED' | 'UNKNOWN';
export type VoteLevel = Exclude<CongestionLevel, 'UNKNOWN'>;

export interface Place {
  id: number;
  name: string;
  building: string;
  level: CongestionLevel;
  voteCount: number;
  lastVotedAt?: string;
  myVote?: VoteLevel;
  myVotedAt?: string;
}

export interface EmptyRoom {
  building: string;
  name: string;
  nextClassAt?: string; // 없으면 "오늘 남은 수업 없음"
}

export interface MentionedDate {
  at: string;
  label: string;
  type: EventType;
  memo?: string;
}

/** 공지 목록 항목 */
export interface NoticeSummary {
  id: number;
  courseId?: string;
  /** 시간표에서 빠진 강의일 때 보여 줄 이름 */
  lectureName?: string;
  title: string;
  summary: string;
  savedAt: string;
}

export interface Notice extends NoticeSummary {
  isExam: boolean;
  points: string[];
  mentionedDates: MentionedDate[];
  imageUrl?: string;
}
