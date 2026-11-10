# 우라 — 프론트엔드 구현 계획서 (웹앱)

> 기준 디자인: Claude 아티팩트 **"대학생활 관리 앱 UI"** (화면 9개 + 로고 시안)
> 이 문서를 레포 루트에 두고 Claude Code에 `FRONTEND_PLAN.md 기준으로 작업해줘`라고 요청하면 됩니다.

---

## 0. 기술 스택

| 항목 | 선택 | 이유 |
|---|---|---|
| 빌드 | **Vite** | 빠른 개발 서버 |
| 프레임워크 | **React 18 + TypeScript** | 컴포넌트 단위로 디자인 옮기기 쉬움 |
| 라우팅 | **React Router v6** | 하단 탭 + 상세 화면 구조 |
| 스타일 | **CSS Modules + CSS 변수(토큰)** | 디자인이 순수 CSS라 그대로 옮기기 쉬움 |
| 서버 상태 | **TanStack Query** (Phase 4) | API 연동 시 캐싱·재조회 |
| 날짜 | **dayjs** | 캘린더·D-day 계산 |

### 레이아웃 원칙
- **모바일 우선 웹앱**: 디자인 프레임 **390×844**
- 앱 전체를 `max-width: 430px; margin: 0 auto;`로 가운데 정렬 (데스크톱에서도 폰 화면처럼)
- 하단 탭바 높이만큼 콘텐츠 `padding-bottom` 확보, `env(safe-area-inset-bottom)` 반영
- 모든 터치 영역 **최소 44×44px**

---

## 1. 폴더 구조

```
src/
├── styles/
│   ├── tokens.css        # 디자인 토큰 (아래 2장)
│   └── global.css        # reset, body 폰트
├── components/           # 공통 컴포넌트 (3장)
├── layouts/
│   └── TabLayout.tsx     # 하단 탭바 포함 레이아웃
├── pages/                # 화면 (4장)
│   ├── LoginPage/
│   ├── CalendarPage/
│   ├── CapturePage/
│   ├── CoursesPage/
│   ├── TimetablePage/
│   ├── SpacesPage/       # LoungeTab, RoomsTab
│   ├── NoticesPage/
│   └── NoticeDetailPage/
├── types/                # 도메인 타입 (5장)
├── mocks/                # 목 데이터 (디자인 속 데이터 그대로)
├── api/                  # Phase 4: API 호출 함수
├── utils/                # dday, 날짜, 시간표 계산
└── router.tsx
```

---

## 2. 디자인 토큰 (`tokens.css`)

### 2-1. 색상

| 토큰 | 값 | 쓰임 |
|---|---|---|
| `--color-primary` | `#9D3549` | 메인 버튼, 선택 상태, 활성 탭 |
| `--color-primary-hover` | `#7A2738` | 링크 hover |
| `--color-primary-tint` | `#F6EEF0` | 선택된 칩·세그먼트 배경, 아이콘 배경 |
| `--color-error-bg` | `#FBF3F5` | 필수 입력 누락 필드 배경 |
| `--color-text` | `#1F1A1C` | 기본 텍스트 |
| `--color-text-sub` | `#4A4246` | 라벨, 보조 제목 |
| `--color-text-muted` | `#6B6266` | 설명, 비활성 탭 |
| `--color-text-done` | `#8A7F83` | 완료된 과제 제목 |
| `--color-text-faint` | `#B5ABAF` | 다른 달 날짜, 미분류 |
| `--color-sunday` | `#B3261E` | 일요일 |
| `--color-border` | `#E4DADD` | 입력창·칩 테두리 |
| `--color-border-dashed` | `#D9CBCF` | 점선 테두리 |
| `--color-divider` | `#EFE7E9` | 카드 테두리, 탭바 상단선, 비활성 배지 배경 |
| `--color-divider-light` | `#F3ECEE` | 리스트 구분선 |
| `--color-surface` | `#FFFFFF` | 기본 배경 |
| `--color-surface-soft` | `#FBF7F8` | 카드·바텀 섹션 배경 |
| `--color-section-gap` | `#F7F2F3` | 캘린더 아래 8px 구분 띠 |

### 2-2. 혼잡도 상태 색

| 상태 | 글자색 | 배경색 |
|---|---|---|
| 여유 `RELAXED` | `#2E7D5B` | `#EAF4EE` |
| 보통 `NORMAL` | `#8A5300` | `#FBF1E3` |
| 혼잡 `CROWDED` | `#B3261E` | `#FBEBEA` |
| 정보 없음 `UNKNOWN` | `#6B6266` | `#F3ECEE` |

### 2-3. 과목 색상 팔레트 (8색)

| 이름 | color | tint (칩 배경) |
|---|---|---|
| 와인 | `#AD4A5D` | — |
| 블루 | `#4079A8` | `#EDF3F8` |
| 그린 | `#4E8C69` | `#EEF5F1` |
| 퍼플 | `#7A5DA3` | — |
| 오렌지 | `#B5652E` | — |
| 틸 | `#3A8C92` | `#EAF4F5` |
| 머스터드 | `#A08030` | `#F6F1E4` (배지 글자 `#6E5718`) |
| 그레이 | `#6B6F76` | — |

- tint가 없는 색은 `color-mix(in srgb, <color> 10%, white)`로 생성해 통일

### 2-4. 타이포그래피
- 폰트: **Noto Sans KR** (400 / 500 / 700), fallback `system-ui, sans-serif`

| 토큰 | 크기 / 굵기 | 쓰임 |
|---|---|---|
| `--fs-display` | 28 / 700, letter-spacing -0.5px | 로그인 앱 이름 |
| `--fs-title` | 22 / 700, -0.3px | 탭 화면 제목, 캘린더 월 |
| `--fs-header` | 18 / 700 | 상세 화면 헤더 |
| `--fs-section` | 17 / 700 | 섹션 제목, 바텀시트 제목 |
| `--fs-button` | 16 / 700 | 메인 버튼 |
| `--fs-body` | 15 / 400~500 | 본문, 입력값, 카드 제목 |
| `--fs-sm` | 14 | 보조 본문 |
| `--fs-xs` | 13 | 칩, 라벨 |
| `--fs-caption` | 12 | 메타 정보, 배지 |
| `--fs-tiny` | 11 | 하단 탭 라벨, 작은 배지 |

### 2-5. 모양·크기

| 토큰 | 값 | 쓰임 |
|---|---|---|
| `--radius-xs` | 6px | 배지, 시간표 블록 |
| `--radius-sm` | 10px | 작은 입력창, 요일 버튼 |
| `--radius-md` | 12px | 입력창, 세그먼트 컨테이너 |
| `--radius-lg` | 14px | 메인 버튼, 리스트 카드 |
| `--radius-xl` | 16px | 큰 카드 |
| `--radius-sheet` | 24px | 바텀시트 상단 |
| `--radius-pill` | 999px | 칩, FAB |
| `--h-touch` | 44px | 아이콘 버튼 |
| `--h-input` | 52px | 기본 입력창 |
| `--h-button` | 54px | 메인 버튼 |
| `--h-fab` | 52px | 플로팅 버튼 |
| `--h-chip` | 36px | 칩 |
| `--h-tabbar` | 72px | 하단 탭바 |
| `--page-x` | 20px | 화면 좌우 여백 |

### 2-6. 그림자

| 토큰 | 값 |
|---|---|
| `--shadow-fab` | `0 6px 18px rgba(157, 53, 73, 0.32)` |
| `--shadow-sheet` | `0 -8px 24px rgba(31, 26, 28, 0.12)` |
| `--shadow-segment` | `0 1px 3px rgba(31, 26, 28, 0.12)` |

---

## 3. 공통 컴포넌트

| 컴포넌트 | 변형 / props | 쓰이는 화면 |
|---|---|---|
| `BottomTabBar` | 탭 4개: 캘린더 `/`, 내 시간표 `/timetable`, 공간 `/spaces`, 공지 `/notices` · 활성 탭은 primary + 700 | 탭 화면 전체 |
| `PageHeader` | `variant="title"` (22px 큰 제목 + 우측 액션) / `variant="back"` (뒤로 버튼 + 18px 제목 + 부제) | 전체 |
| `IconButton` | 44×44, 투명 배경, `aria-label` 필수 | 전체 |
| `Button` | `primary` (채움) / `outline` (primary 테두리) · `size="lg"`(54) / `md`(52) / `sm`(44) | 로그인, 캡처, 과목, 시간표 시트 |
| `Fab` | 아이콘 + 라벨, 우하단 `right:20px; bottom: 탭바+20px` | 캘린더, 공지, 공지 상세 |
| `TextField` | label + input · `error` 상태 (primary 테두리 + error-bg + 경고 문구) · `required` 표시 | 로그인, 캡처, 과목, 빈 강의실 |
| `Chip` | `filter` (체크박스 + 과목색 테두리/배경) / `select` (선택 시 primary 계열) / `dashed` (링크형) | 캘린더, 빈 강의실, 공지 |
| `SegmentedControl` | 2칸, 선택 칸 흰 배경 + 그림자 | 공간 |
| `Badge` | `dday` (긴급: primary 채움 / 기본: divider 배경) · `status` (혼잡도 색) · `tag` (과목·시험) | 캘린더, 공간, 공지 |
| `CheckCircle` / `CheckBox` | 원형(과제 완료) / 사각(캡처 선택) · 과목색 또는 primary | 캘린더, 캡처 |
| `CourseDot` | 6·8·10px 원, 과목색 | 전체 |
| `BottomSheet` | 상단 radius 24, `--shadow-sheet`, 닫기 버튼 | 시간표 |
| `Icon` | 24 그리드, stroke 2, round cap/join · 아래 목록 | 전체 |

### 필요한 아이콘
`chevron-left`, `chevron-right`, `calendar`, `timetable`, `sofa`(공간), `megaphone`(공지), `camera`, `image`, `pencil`, `trash`, `plus`, `close`, `refresh`, `check`, `alert-circle`, `door`(강의실), `logo`

---

## 4. 화면별 구현 명세

### 라우트

| 경로 | 화면 | 탭바 | 우선순위 |
|---|---|---|---|
| `/login` | 로그인 | ✕ | P0 |
| `/` | 캘린더 · 과목 필터 | ✓ | P0 |
| `/capture` | 과제 캡처 분석 결과 | ✕ | P0 |
| `/courses` | 과목 관리 | ✕ | P0 |
| `/timetable` | 내 시간표 | ✓ | P1 |
| `/spaces/lounge` | 공간 · 라운지 | ✓ | P1 |
| `/spaces/rooms` | 공간 · 빈 강의실 | ✓ | P1 |
| `/notices` | 공지 요약 | ✓ | P2 |
| `/notices/:id` | 공지 상세 | ✕ | P2 |

- `/spaces` 는 `/spaces/lounge` 로 리다이렉트

---

### 4-1. 로그인 `/login` (P0)
- **구성**: 로고(64×64, radius 18, primary 배경) → 앱 이름 "우라" → 소개 2줄 → 이메일·비밀번호 입력 → 로그인 버튼 → "처음이신가요? 회원가입"
- 상단 영역은 `flex: 1`로 세로 가운데, 폼은 하단 고정 (좌우 패딩 28px)
- **동작**: 로그인 성공 시 `/` 이동, 실패 시 입력창 error 상태
- **TODO**: 회원가입 화면은 디자인 없음 → 로그인 폼 재사용으로 간단히 구현

### 4-2. 캘린더 `/` (P0)
- **헤더**: `‹ 2026년 11월 ›` (이전/다음 달 이동)
- **과목 필터 칩**: 가로 스크롤 · 켜짐 = 과목 tint 배경 + 과목색 테두리 + 체크 / 꺼짐 = 흰 배경 + 회색 테두리 · 맨 끝에 점선 "과목 관리" 칩 → `/courses`
- **월 그리드**: 7열, 셀 높이 50px
  - 날짜 원 34px · 선택 = primary 채움 · 오늘 = primary 테두리 · 일요일 빨강 · 다른 달 날짜 흐리게
  - 날짜 아래 과제 점 최대 3개 (완료된 과제는 `#D9CBCF`)
  - 필터에서 꺼진 과목의 과제는 점·목록에서 제외
- **선택 날짜 섹션**: 위에 8px `--color-section-gap` 띠
  - 제목 "11월 7일 (토)" + 우측 "이번 달 남은 과제 N개"
  - 과제 카드: 완료 체크 원 · 제목(완료 시 취소선 + 회색) · "과목명 · 23:59 마감" · D-day 배지
  - D-day: 0일 `D-DAY`, 양수 `D-n`, 음수 `D+n`, 완료 `완료` · **0~2일 남고 미완료면 primary 배지**
  - 비어 있으면 "이 날 마감인 과제가 없어요"
- **FAB**: "캡처로 추가" → `/capture`
- **구현 메모**: 디자인은 11월 고정이라 **dayjs로 실제 달력 계산** (해당 월 1일 요일부터, 5~6주)

### 4-3. 과제 캡처 분석 결과 `/capture` (P0)
- **헤더**: 뒤로 + "과제 N개를 찾았어요" + "내용을 확인하고 필요한 부분을 고쳐 주세요"
- **이미지 영역**: 점선 박스 · "LMS 캡처 이미지" · "이미지는 분석에만 쓰이고 저장되지 않아요" · "다시 찍기"
- **과제 카드 목록**: 체크박스(저장 포함 여부, 해제 시 opacity 0.55) · 과목 점 + 과목명 · "새 과목으로 추가" 배지(기존에 없는 과목) · 과제명 입력 · 마감 일시 입력
  - 마감일을 못 읽은 카드: 카드·입력창 primary 테두리, 라벨 "마감 일시 (필수)", 경고 "마감일을 읽지 못했어요. 직접 입력해 주세요"
- **하단 고정 버튼**: "선택한 N개 캘린더에 저장" → 저장 후 `/`
- **TODO (디자인에 없음)**
  - 업로드 전 단계: `<input type="file" accept="image/*" capture="environment">` 로 촬영/선택 → 분석 중 로딩 화면
  - 마감 일시 입력은 `type="datetime-local"` 사용 권장
  - 필수 항목 비어 있으면 저장 버튼 비활성

### 4-4. 과목 관리 `/courses` (P0)
- **헤더**: 뒤로 + "과목 관리"
- **과목 리스트**: 색 사각형(14px, radius 4) · 과목명 · "남은 과제 N개" · 수정·삭제 아이콘 버튼
- **하단 "새 과목 추가" 패널**: surface-soft 배경, 상단 radius 24 · 과목명 입력 · 색상 원 8개(36px, 선택 시 진한 테두리) · "추가하기"
- **TODO**: 수정 시 하단 패널을 수정 모드로 전환 · 삭제는 확인 다이얼로그

### 4-5. 내 시간표 `/timetable` (P1)
- **헤더**: "2026년 2학기" + "내 시간표" + 우측 `+`(수업 추가)
- **그리드**: 첫 열 30px(교시 번호 + 시작 시각) + 월~금 5열
  - 세로 기준: **1시간 = 64px**, 09:00 시작 → 블록 `top = (시작분 - 540) / 60 × 64`
  - 교시: 1 `09:00–10:15`, 2 `10:30–11:45`, 3 `12:00–13:15`, 4 `13:30–14:45`, 5 `15:00–16:15`, 6 `16:30–17:45`
  - 수업 블록: 과목색 배경 + 흰 글자 (과목명 11px bold, 강의실 10px)
  - **빈 교시**: 점선 칸 버튼 · 선택 시 primary 테두리 2px + tint 배경
- 안내 문구: "빈 교시를 누르면 그 시간에 갈 수 있는 공간을 찾아볼 수 있어요"
- **바텀시트** (빈 교시 선택 시): "화요일 5교시 · 15:00–16:15" · "수업이 없는 시간이에요. 어디로 갈까요?" · [빈 강의실 찾기] [라운지 보기]
  - 빈 강의실 찾기 → `/spaces/rooms?day=1&from=15:00&to=16:15` (쿼리로 조건 전달)
- **TODO**: 수업 추가 화면은 디자인 없음

### 4-6. 공간 · 라운지 `/spaces/lounge` (P1)
- **헤더**: "공간" + 새로고침 버튼 · 세그먼트 [라운지 | 빈 강의실]
- 안내: "최근 30분 동안의 투표로 계산해요 · 당겨서 새로고침"
- **장소 카드** (아코디언, 한 번에 하나만 펼침, 펼친 카드는 primary 테두리)
  - 장소명 · 막대 3칸 (여유 1칸 / 보통 2칸 / 혼잡 3칸 상태색, 나머지 divider색) · "유효 투표 N건 · 마지막 투표 n분 전" · 상태 배지
  - 투표 없음: "최근 30분 동안 투표가 없어요" + "정보 없음"
  - 펼침: "지금 여기 어때요?" + [여유][보통][혼잡] 버튼 (각 상태색)
  - 투표 후: 고른 버튼만 채움, 나머지 비활성 + "투표했어요 · 10분 뒤에 다시 투표할 수 있어요"
- **TODO**: 당겨서 새로고침(pull-to-refresh)은 새로고침 버튼으로 먼저 구현

### 4-7. 공간 · 빈 강의실 `/spaces/rooms` (P1)
- **헤더**: "공간" + "강의실 시간표 등록"(카메라 아이콘 pill 버튼) · 세그먼트
- **조회 조건 박스** (surface-soft): 요일 5버튼(선택 primary) · 시간 시작–종료 입력 + [조회]
- **건물 칩**: 전체, 대학원, 인문관, 숭인관, 예지관, 백주년, 동인관, 인덕관 (가로 스크롤)
- **결과**: "비어 있는 강의실 N" · 카드: 아이콘 · "건물 호실" · "16:15 이후 다음 수업 18:00" / "오늘 남은 수업 없음" · "26.09 등록"
- 결과 없음: "이 시간에 비어 있는 강의실을 찾지 못했어요"
- **구현 메모**: URL 쿼리(`day`, `from`, `to`)가 있으면 초기값으로 사용 · 시간 입력은 `type="time"` 권장

### 4-8. 공지 요약 `/notices` (P2)
- **헤더**: "공지 요약"
- **필터 칩**: 전체, 시험, 과목별…, 미분류 (선택 시 primary 채움)
- **공지 카드** (surface-soft, 클릭 → 상세): 과목 점 + 과목명 + 우측 저장 시점("오늘") · 제목 · 한 줄 요약 · 날짜가 있으면 캘린더 아이콘 배지
- **FAB**: "공지 캡처"
- **TODO**: 공지 캡처 업로드 흐름은 과제 캡처와 같은 방식으로

### 4-9. 공지 상세 `/notices/:id` (P2)
- **헤더**: 뒤로 + "공지 상세" + 우측 삭제
- 태그(과목 tint 배지, "시험" 배지) · 제목 22px · "2026.11.07 저장 · AI 요약"
- **한 줄 요약 박스** (surface-soft, primary 라벨)
- **언급된 날짜**: 아이콘 + 날짜 + 일정 이름 (TODO: 눌러서 캘린더에 추가)
- **핵심 내용**: 번호 원(22px primary) + 내용 리스트
- **FAB**: "이미지 원본 보기" (탭바 없으므로 `bottom: 28px`)

---

## 5. 도메인 타입 (`types/`)

```ts
type CourseColor = string; // 팔레트 hex

interface Course {
  id: string;
  name: string;
  color: CourseColor;
  remainingCount: number;
}

interface Assignment {
  id: string;
  courseId: string;
  title: string;
  dueAt: string;      // ISO
  done: boolean;
}

interface CaptureResult {      // 캡처 분석 결과 1건
  tempId: string;
  courseName: string;
  courseId?: string;           // 없으면 "새 과목으로 추가"
  title: string;
  dueAt?: string;              // 없으면 필수 입력
}

interface ClassBlock {
  id: string;
  courseId: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4; // 월~금
  start: string;  // "10:30"
  end: string;
  room: string;
}

type CongestionLevel = 'RELAXED' | 'NORMAL' | 'CROWDED' | 'UNKNOWN';

interface Place {
  id: string;
  name: string;
  level: CongestionLevel;
  voteCount: number;
  lastVotedAt?: string;
  myVote?: Exclude<CongestionLevel, 'UNKNOWN'>;
  canVoteAt?: string;   // 10분 제한
}

interface EmptyRoom {
  building: string;
  name: string;
  nextClassAt?: string;  // 없으면 "오늘 남은 수업 없음"
  registeredAt: string;
}

interface Notice {
  id: string;
  courseId?: string;     // 없으면 미분류
  isExam: boolean;
  title: string;
  summary: string;
  points: string[];
  mentionedDates: { at: string; label: string }[];
  savedAt: string;
}
```

---

## 6. 구현 순서

| 단계 | 작업 | 완료 기준 |
|---|---|---|
| **Phase 0** | Vite + React + TS 생성, 라우터, 폰트, `tokens.css`, `global.css` | 빈 화면 9개 라우팅 동작 |
| **Phase 1** | 공통 컴포넌트 (3장) + `TabLayout` | 탭 이동 동작, 컴포넌트 단독 확인 |
| **Phase 2** | P0 화면: 로그인 → 캘린더 → 캡처 → 과목 관리 (목 데이터) | 디자인과 픽셀 비교 일치 |
| **Phase 3** | P1~P2 화면: 시간표 → 라운지 → 빈 강의실 → 공지 → 공지 상세 | 디자인 속 인터랙션 전부 동작 |
| **Phase 4** | `api/` 연동 (TanStack Query), 로그인 토큰, 에러·로딩 상태 | 목 데이터 제거 |

- 목 데이터는 디자인 파일 안의 데이터를 그대로 `mocks/`로 옮겨서 시작

---

## 7. Claude Code에 쓸 요청 예시

1. `FRONTEND_PLAN.md 읽고 Phase 0 진행해줘. 2장 토큰을 tokens.css로 만들어줘.`
2. `3장 공통 컴포넌트 만들어줘. 각 컴포넌트는 CSS Modules로.`
3. `4-2 캘린더 화면 구현해줘. 목 데이터는 mocks/에 두고, dayjs로 실제 달력 계산해줘.`
4. `4-5 시간표 화면 구현해줘. 1시간=64px 기준으로 블록 위치 계산하는 유틸은 utils/에 분리해줘.`

---

## 8. 확인이 필요한 것

- **앱 이름**: 디자인에는 **"우라"**로 되어 있음 → 최종 이름 확정 필요
- **로고**: 시안 A~E 중 선택 필요 (현재 로그인 화면은 **C · 시간표 한 칸** 사용)
- **디자인 없는 화면**: 회원가입, 캡처 업로드·분석 중, 수업 추가, 과목 수정, 강의실 시간표 등록
