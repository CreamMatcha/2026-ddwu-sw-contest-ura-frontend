/** 백엔드 DTO (Spring /api/v1) — 응답 필드 이름 그대로 */

export interface ErrorResponse {
  code: string;
  message: string;
  errors: { field: string; reason: string }[];
}

export type Semester = '1' | 'summer' | '2' | 'winter';

// ---------- users ----------
export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  /** 초 단위 */
  expiresIn: number;
  user: { userId: number; nickname: string; loginId: string };
}

export interface SignupResponse {
  userId: number;
  nickname: string;
  loginId: string;
  createdAt: string;
}

// ---------- timetable / lecture ----------
export interface ClassroomDto {
  classroomId: number;
  buildingName: string;
  roomName: string;
}

/** 시간표 항목 = 요일별 수업 행 1개. timetableId가 곧 다른 API의 userLectureId */
export interface TimetableItemDto {
  timetableId: number;
  lectureId: number;
  name: string;
  courseCode: string;
  sectionCode: string;
  academicYear: number;
  semester: Semester;
  classroom: ClassroomDto | null;
  /** 월 1 ~ 일 7 */
  dayOfWeek: number;
  color: string;
  startsAt: string; // HH:mm:ss
  endsAt: string;
}

export interface TimetableListResponse {
  academicYear: number;
  semester: Semester;
  items: TimetableItemDto[];
}

export interface LectureScheduleDto {
  lectureId: number;
  dayOfWeek: number;
  startsAt: string;
  endsAt: string;
  classroom: ClassroomDto | null;
}

export interface LectureItemDto {
  courseCode: string;
  sectionCode: string;
  name: string;
  lectureIds: number[];
  schedules: LectureScheduleDto[];
  inMyTimetable: boolean;
}

export interface LectureSearchResponse {
  academicYear: number;
  semester: Semester;
  keyword: string | null;
  items: LectureItemDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// ---------- event ----------
export type EventType = 'assignment' | 'exam' | 'other';

export interface EventDto {
  eventId: number;
  sourceNoticeId: number | null;
  sourceImageId: number | null;
  imageUrl: string | null;
  userLectureId: number | null;
  title: string;
  eventType: EventType;
  eventDate: string; // YYYY-MM-DD
  eventTime: string | null; // HH:mm:ss
  memo: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventCreateRequest {
  sourceNoticeId?: number | null;
  sourceImageId?: number | null;
  userLectureId?: number | null;
  title: string;
  eventType: EventType;
  eventDate: string;
  eventTime?: string | null;
  memo?: string | null;
}

export interface CaptureCandidateDto {
  courseName: string | null;
  userLectureId: number | null;
  lectureName: string | null;
  title: string | null;
  eventType: EventType | null;
  eventDate: string | null;
  eventTime: string | null;
  memo: string | null;
  needsCheck: boolean;
  checkReasons: string[];
  duplicate: boolean;
}

export interface CaptureResponse {
  sourceImageId: number;
  imageUrl: string;
  candidates: CaptureCandidateDto[];
  warnings: string[];
}

// ---------- notice ----------
export interface EventCandidateDto {
  title: string;
  eventType: EventType | null;
  eventDate: string | null;
  eventTime: string | null;
  memo: string | null;
}

export interface NoticeListItemDto {
  noticeId: number;
  userLectureId: number | null;
  lectureName: string | null;
  title: string;
  summary: string;
  createdAt: string;
}

export interface NoticeListResponse {
  items: NoticeListItemDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface NoticeDetailDto {
  noticeId: number;
  userLectureId: number | null;
  lectureName?: string | null;
  title: string;
  imageUrl: string | null;
  summary: string;
  actionItems: string[];
  eventCandidates: EventCandidateDto[];
  createdAt: string;
  updatedAt: string;
}

// ---------- space ----------
export type ApiCongestion = 'low' | 'medium' | 'high';

export interface SpaceItemDto {
  spaceId: number;
  name: string;
  buildingName: string;
  congestionLevel: ApiCongestion | 'unknown';
  validVoteCount: number;
  distribution: { low: number; medium: number; high: number };
  myVote: { congestionLevel: ApiCongestion; createdAt: string } | null;
  latestVoteAt: string | null;
}

export interface SpaceListResponse {
  items: SpaceItemDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  windowMinutes: number;
  asOf: string;
}

// ---------- classroom ----------
export interface ClassroomAvailabilityResponse {
  academicYear: number;
  semester: Semester;
  timeWeek: number;
  startTime: string;
  endTime: string;
  totalCount: number;
  buildings: {
    buildingName: string;
    classroomCount: number;
    classrooms: { classroomId: number; roomName: string; nextLectureStartTime: string | null }[];
  }[];
}
