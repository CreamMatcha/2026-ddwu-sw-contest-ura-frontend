export type CourseColor = string; // 팔레트 hex

export interface Course {
  id: string;
  name: string;
  color: CourseColor;
  remainingCount: number;
}

/** 저장되는 과목 데이터 (remainingCount는 과제 목록에서 계산) */
export type CourseData = Omit<Course, 'remainingCount'>;

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  dueAt: string; // ISO (로컬 시각, 예: 2026-11-07T23:59)
  done: boolean;
}

export interface CaptureResult {
  tempId: string;
  courseName: string;
  courseId?: string; // 없으면 "새 과목으로 추가"
  title: string;
  dueAt?: string; // 없으면 필수 입력
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4; // 월~금

export interface ClassBlock {
  id: string;
  courseId: string;
  dayOfWeek: DayOfWeek;
  start: string; // "10:30"
  end: string;
  room: string;
}

export type CongestionLevel = 'RELAXED' | 'NORMAL' | 'CROWDED' | 'UNKNOWN';
export type VoteLevel = Exclude<CongestionLevel, 'UNKNOWN'>;

export interface Place {
  id: string;
  name: string;
  level: CongestionLevel;
  voteCount: number;
  lastVotedAt?: string;
  myVote?: VoteLevel;
  canVoteAt?: string; // 10분 제한
}

export interface EmptyRoom {
  building: string;
  name: string;
  nextClassAt?: string; // 없으면 "오늘 남은 수업 없음"
  registeredAt: string;
}

/** 강의실 시간표 (빈 강의실 계산용 목 데이터) */
export interface RoomSchedule {
  building: string;
  name: string;
  registeredAt: string;
  classes: { days: DayOfWeek[]; start: string; end: string }[];
}

export interface Notice {
  id: string;
  courseId?: string; // 없으면 미분류
  isExam: boolean;
  title: string;
  summary: string;
  points: string[];
  mentionedDates: { at: string; label: string }[];
  savedAt: string;
}
