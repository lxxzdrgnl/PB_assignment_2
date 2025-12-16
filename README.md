# MovieFlix - 영화 스트리밍 데모 사이트

Netflix와 유사한 프론트엔드 데모 사이트입니다. Vue.js 3, TypeScript, TMDB API를 활용하여 제작되었습니다.

## Live Demo

**배포 URL**: [https://lxxzdrgnl.github.io/PB_assignment_2/](https://lxxzdrgnl.github.io/PB_assignment_2/)

## 프로젝트 개요

- **프로젝트명**: MovieFlix
- **설명**: TMDB API를 활용한 영화 정보 제공 및 찜하기 기능이 있는 SPA
- **기술 스택**: Vue.js 3, TypeScript, Pinia, Vue Router, Axios
- **API**: The Movie Database (TMDB) API

## 주요 기능

### 1. 인증 시스템
- 로그인/회원가입 페이지
- 이메일/비밀번호 기반 인증
- 이메일 형식 검증
- 비밀번호 확인 (회원가입 시)
- Remember Me 기능
- 약관 동의 체크
- Toast 알림으로 사용자 피드백

### 2. 홈 페이지 (/)
- 4개 이상의 TMDB API 엔드포인트 사용
  - 인기 영화 (Popular Movies)
  - 현재 상영작 (Now Playing)
  - 높은 평점 (Top Rated)
  - 개봉 예정 (Upcoming)
- 동적 영화 카드 렌더링
- 찜하기 기능
- 반응형 그리드 레이아웃

### 3. 대세 콘텐츠 페이지 (/popular)
- Table View / Infinity Scroll 모드 전환
- 페이지네이션 (Table View)
- 무한 스크롤 (Infinity Scroll)
- 맨 위로 버튼
- 로딩 상태 표시
- top 10 영화 표시

### 4. 찾아보기 페이지 (/search)
- 장르별 필터링
- 최소 평점 필터링
- 다양한 정렬 옵션
  - 추천순, 인기순, 평점순, 개봉일순, 제목순
- 필터 초기화 기능

### 5. 찜한 리스트 페이지 (/wishlist)
- Local Storage 기반 찜하기 목록
- 찜하기 목록을 기반으로 간단한 통계 / 추천영화

### 6. 공통 기능
- 반응형 헤더 (스크롤 시 배경색 변경)
- 영화 카드 호버 효과
- 찜하기 토글 기능
- 로딩 스피너
- 반응형 웹 디자인

## 기술 스택

### Frontend
- **Vue.js 3**: Composition API 사용
- **TypeScript**: 타입 안정성 확보
- **Pinia**: 전역 상태 관리
- **Vue Router**: SPA 라우팅
- **Axios**: HTTP 클라이언트

### Styling
- **CSS3**: CSS Variables, Flexbox, Grid
- **CSS Animations**: Transition, Keyframe
- **Font Awesome**: 아이콘

### Development
- **Vite**: 빌드 도구
- **Node.js**: v20.19.0 이상

## 프로젝트 구조

```
PB_assignment_2/
├── public/
│   └── favicon.ico                # 파비콘
├── src/
│   ├── assets/
│   │   └── styles/
│   │       └── main.css           # 전역 스타일 (CSS Variables, 반응형)
│   ├── components/
│   │   ├── AppFooter.vue          # 푸터 컴포넌트
│   │   ├── AppHeader.vue          # 헤더 컴포넌트 (스크롤 효과)
│   │   ├── InfiniteScrollView.vue # 무한 스크롤 뷰
│   │   ├── LargeMovieCard.vue     # 영화 카드 컴포넌트
│   │   ├── LoadingSpinner.vue     # 로딩 스피너
│   │   ├── MovieCardSkeleton.vue  # 스켈레톤 UI
│   │   ├── MovieDetailModal.vue   # 영화 상세 모달
│   │   ├── MovieSlider.vue        # 영화 슬라이더 컴포넌트
│   │   ├── SearchBar.vue          # 검색 바 컴포넌트
│   │   ├── TableView.vue          # 테이블 뷰
│   │   └── ToastNotification.vue  # Toast 알림
│   ├── composables/
│   │   ├── index.ts               # Composables 통합 export
│   │   ├── useApiCache.ts         # API 캐싱 로직
│   │   ├── useRecommendations.ts  # 추천 시스템 로직
│   │   ├── useSearchHistory.ts    # 검색 히스토리 관리
│   │   ├── useTheme.ts            # 테마 관리
│   │   ├── useUserPreferences.ts  # 사용자 선호도 관리
│   │   ├── useWatchHistory.ts     # 시청 기록 관리
│   │   └── useWishlist.ts         # 찜하기 관리
│   ├── router/
│   │   └── index.ts               # Vue Router 설정 (라우트 가드 포함)
│   ├── stores/
│   │   ├── auth.ts                # 인증 상태 관리 (Pinia)
│   │   └── counter.ts             # 카운터 스토어 (기본)
│   ├── types/
│   │   └── movie.ts               # TypeScript 타입 정의
│   ├── utils/
│   │   ├── auth.ts                # 인증 유틸리티
│   │   ├── localStorage.ts        # LocalStorage 헬퍼
│   │   └── tmdb.ts                # TMDB API 클라이언트
│   ├── views/
│   │   ├── HomeView.vue           # 홈 페이지
│   │   ├── PopularView.vue        # 대세 콘텐츠 페이지
│   │   ├── SearchView.vue         # 찾아보기 페이지
│   │   ├── SignInView.vue         # 로그인/회원가입 페이지
│   │   └── WishlistView.vue       # 찜한 리스트 페이지
│   ├── App.vue                    # 루트 컴포넌트
│   └── main.ts                    # 앱 진입점
├── .gitignore
├── env.d.ts                       # TypeScript 환경 타입 정의
├── index.html                     # HTML 진입점
├── package.json                   # 프로젝트 의존성
├── package-lock.json
├── tsconfig.json                  # TypeScript 설정
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts                 # Vite 빌드 설정
└── README.md                      # 프로젝트 문서
```

## 설치 및 실행

### 필수 요구사항
- Node.js v20.19.0 이상
- npm 또는 yarn

### 설치

```bash
# 의존성 설치
npm install
```

### 개발 서버 실행

```bash
# 개발 모드로 실행 (http://localhost:5173)
npm run dev
```

### 프로덕션 빌드

```bash
# 타입 체크 및 빌드
npm run build

# 빌드된 결과물 미리보기
npm run preview
```

### 타입 체크

```bash
# TypeScript 타입 체크
npm run type-check
```

## Local Storage 사용

이 프로젝트는 다음 데이터를 Local Storage에 저장합니다:

1. **isLoggedIn**: 로그인 상태
2. **users**: 회원가입한 사용자 목록 (이메일, 비밀번호)
3. **currentUser**: 현재 로그인한 사용자 이메일
4. **keepLogin**: 로그인 유지 여부
5. **movieWishlist**: 찜한 영화 목록

## Git 커밋 메시지 규칙

이 프로젝트는 다음과 같은 커밋 메시지 컨벤션을 따릅니다:

### 커밋 메시지 형식

```
<타입>: <제목>
```

### 타입 (Type)

- **FEAT**: 새로운 기능 추가
  - 예: `FEAT: Add user authentication`
  - 예: `FEAT: Implement infinite scroll`

- **ADD**: 파일, 컴포넌트, 리소스 추가
  - 예: `ADD: MovieDetailModal component`
  - 예: `ADD: useTheme composable`

- **FIX**: 버그 수정
  - 예: `FIX: Resolve login form validation issue`
  - 예: `FIX: Correct movie card aspect ratio`

- **REFACTOR**: 코드 리팩토링 (기능 변경 없음)
  - 예: `REFACTOR: Simplify auth logic`
  - 예: `REFACTOR: Extract common utilities`

- **STYLE**: 코드 스타일 변경 (포매팅, 세미콜론 등)
  - 예: `STYLE: Format CSS with prettier`
  - 예: `STYLE: Fix indentation`

- **DOCS**: 문서 수정
  - 예: `DOCS: Update README installation guide`
  - 예: `DOCS: Add API documentation`

- **CHORE**: 빌드, 설정 파일 수정
  - 예: `CHORE: Update vite config`
  - 예: `CHORE: Add ESLint rules`

### 작성 규칙

- 50자 이내, 마침표 없이, 명령문으로 작성 (동사 원형), 첫 글자는 대문자

### 커밋 예시

```bash
# 간단한 커밋
git commit -m "FEAT: Add dark mode toggle"


## 브랜치 전략

이 프로젝트는 **Git Flow** 전략을 사용합니다:

### 브랜치 종류

#### 1. `main` (프로덕션 브랜치)
- 배포 가능한 안정적인 코드만 존재
- 직접 커밋 금지
- `dev` 브랜치에서 Pull Request로만 병합 가능

#### 2. `dev` (개발 브랜치)
- 다음 릴리스를 위한 개발 진행
- `feature` 브랜치들이 Git Merge로 병합되는 곳
- 기능 개발이 완료되면 `main`으로 PR 생성

#### 3. `feature/*` (기능 개발 브랜치)
- 새로운 기능 개발용
- `dev` 브랜치에서 분기
- 개발 완료 후 `dev`로 Git Merge로 병합
- 브랜치명 규칙: `feature/기능명`
  - 예: `feature/login`, `feature/movie-detail-modal`

### 워크플로우

```bash
# 1. dev 브랜치에서 feature 브랜치 생성
git checkout dev
git pull origin dev
git checkout -b feature/movie-slider

# 2. 기능 개발 및 커밋
git add .
git commit -m "FEAT: Add movie slider component"

# 3. dev 브랜치로 병합 (Git Merge)
git checkout dev
git merge feature/movie-slider
git push origin dev

# 4. 로컬 브랜치 삭제
git branch -d feature/movie-slider

# 5. 배포 준비 완료 시 (dev → main) - Pull Request 사용
# GitHub에서 PR 생성 (dev → main)
# 코드 리뷰 후 병합
```

### 브랜치 네이밍 규칙

- **feature/** : 기능 개발
  - `feature/infinite-scroll`
  - `feature/dark-mode`

- **fix/** : 버그 수정 (긴급하지 않은 경우)
  - `fix/search-filter`
  - `fix/modal-scroll`

- **hotfix/** : 긴급 버그 수정 (main에서 직접 분기)
  - `hotfix/critical-auth-bug`

### 병합 정책

- **Git Merge**: feature → dev
  - 로컬에서 `git merge` 명령어로 병합
  - 커밋 히스토리 유지

- **Pull Request**: dev → main
  - GitHub에서 PR 생성
  - 코드 리뷰 필수
  - 릴리스 단위를 명확히 구분


## 주요 CSS 클래스

### 버튼
- `.btn`: 기본 버튼
- `.btn-primary`: 주요 버튼 (빨간색)
- `.btn-secondary`: 보조 버튼
- `.btn-ghost`: 투명 버튼

### 입력 필드
- `.input-field`: 입력 필드
- `.input-label`: 라벨
- `.input-error`: 에러 상태

### 레이아웃
- `.container`: 컨테이너
- `.page-container`: 페이지 컨테이너
- `.movie-grid`: 영화 그리드
- `.section`: 섹션

### 컴포넌트
- `.movie-card`: 영화 카드
- `.header`: 헤더
- `.loading-spinner`: 로딩 스피너
- `.toast`: Toast 알림

## 반응형 브레이크포인트

- **Desktop**: 1025px 이상
- **Tablet**: 769px ~ 1024px
- **Mobile**: 768px 이하
- **Small Mobile**: 480px 이하

## 구현 특징

### Vue.js 특징
- Composition API 사용
- TypeScript 타입 안정성
- Pinia를 통한 전역 상태 관리
- Custom Composable (useWishlist)
- Dynamic Component Rendering
- Conditional & Iterative Rendering

### CSS 특징
- CSS Variables로 테마 관리
- Flexbox & Grid 레이아웃
- CSS Transitions & Animations
- 반응형 미디어 쿼리
- BEM 방법론 참고

### 성능 최적화
- 이미지 Lazy Loading
- 무한 스크롤 최적화
- Local Storage 캐싱
- Debounce/Throttle (필요 시)