# MovieFlix - 영화 스트리밍 데모 사이트

Netflix와 유사한 프론트엔드 데모 사이트입니다. Vue.js 3, TypeScript, TMDB API를 활용하여 제작되었습니다.

## 🌐 Live Demo

**배포 URL**: [https://lxxzdrgnl.github.io/PB_assignment_2/](https://lxxzdrgnl.github.io/PB_assignment_2/)

## 📋 프로젝트 개요

- **프로젝트명**: MovieFlix
- **설명**: TMDB API를 활용한 영화 정보 제공 및 찜하기 기능이 있는 SPA
- **기술 스택**: Vue.js 3, TypeScript, Pinia, Vue Router, Axios
- **API**: The Movie Database (TMDB) API

## 🚀 주요 기능

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

### 4. 찾아보기 페이지 (/search)
- 장르별 필터링
- 최소 평점 필터링
- 다양한 정렬 옵션
  - 인기순, 평점순, 개봉일순, 제목순
- 필터 초기화 기능

### 5. 찜한 리스트 페이지 (/wishlist)
- Local Storage 기반 찜하기 목록
- API 호출 없이 구현
- 빈 상태 UI

### 6. 공통 기능
- 반응형 헤더 (스크롤 시 배경색 변경)
- 영화 카드 호버 효과
- 찜하기 토글 기능
- 로딩 스피너
- 반응형 웹 디자인

## 🛠️ 기술 스택

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

## 📁 프로젝트 구조

```
PB_Assignment2/
├── public/
├── src/
│   ├── assets/
│   │   └── styles/
│   │       └── main.css           # 전역 스타일
│   ├── components/
│   │   ├── AppHeader.vue          # 헤더 컴포넌트
│   │   ├── MovieCard.vue          # 영화 카드 컴포넌트
│   │   ├── LoadingSpinner.vue     # 로딩 컴포넌트
│   │   └── ToastNotification.vue  # Toast 알림 컴포넌트
│   ├── composables/
│   │   └── useWishlist.ts         # Wishlist 관리 composable
│   ├── router/
│   │   └── index.ts               # 라우터 설정
│   ├── stores/
│   │   ├── auth.ts                # 인증 상태 관리
│   │   └── counter.ts             # 카운터 스토어 (기본)
│   ├── types/
│   │   └── movie.ts               # 타입 정의
│   ├── utils/
│   │   ├── auth.ts                # 인증 유틸리티
│   │   └── tmdb.ts                # TMDB API 유틸리티
│   ├── views/
│   │   ├── SignInView.vue         # 로그인/회원가입 페이지
│   │   ├── HomeView.vue           # 홈 페이지
│   │   ├── PopularView.vue        # 대세 콘텐츠 페이지
│   │   ├── SearchView.vue         # 찾아보기 페이지
│   │   └── WishlistView.vue       # 찜한 리스트 페이지
│   ├── App.vue                    # 루트 컴포넌트
│   └── main.ts                    # 앱 진입점
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
└── claude.md                      # 개발 참고 문서
```

## 🔧 설치 및 실행

### 필수 요구사항
- Node.js v20.19.0 이상
- npm 또는 yarn
- TMDB API 키

### 설치

```bash
# 의존성 설치
npm install

# .env 파일 생성 (중요!)
# .env.example 파일을 복사하여 .env 파일을 생성하고
# TMDB API 키를 입력하세요
cp .env.example .env
```

### 환경 변수 설정

`.env` 파일을 열고 다음 내용을 입력하세요:

```
VITE_TMDB_API_KEY=your_api_key_here
VITE_TMDB_ACCESS_TOKEN=your_access_token_here
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

## 💾 Local Storage 사용

이 프로젝트는 다음 데이터를 Local Storage에 저장합니다:

1. **isLoggedIn**: 로그인 상태
2. **users**: 회원가입한 사용자 목록 (이메일, 비밀번호)
3. **currentUser**: 현재 로그인한 사용자 이메일
4. **keepLogin**: 로그인 유지 여부
5. **movieWishlist**: 찜한 영화 목록

## 🔐 환경 변수

프로젝트 루트의 `.env` 파일에서 관리됩니다:

1. **VITE_TMDB_API_KEY**: TMDB API 키
2. **VITE_TMDB_ACCESS_TOKEN**: TMDB 읽기 액세스 토큰

**주의**: `.env` 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다.

## 🎨 주요 CSS 클래스

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

## 🌐 반응형 브레이크포인트

- **Desktop**: 1025px 이상
- **Tablet**: 769px ~ 1024px
- **Mobile**: 768px 이하
- **Small Mobile**: 480px 이하

## 🎯 구현 특징

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

## 📝 브랜치 전략

이 프로젝트는 Git Flow 전략을 사용합니다:

- **main**: 프로덕션 브랜치
- **develop**: 개발 브랜치
- **feature/\***: 기능 개발 브랜치