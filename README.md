# MovieFlix - Movie Streaming Demo Site

A Netflix-inspired frontend demo site built with Vue.js 3, TypeScript, and TMDB API.

## Live Demo

**Deployment URL**: [https://lxxzdrgnl.github.io/Movie-flix/](https://lxxzdrgnl.github.io/Movie-flix/)

## Project Overview

- **Project Name**: MovieFlix
- **Description**: SPA with movie information and wishlist features using TMDB API
- **Tech Stack**: Vue.js 3, TypeScript, Pinia, Vue Router, Axios
- **API**: The Movie Database (TMDB) API

## Key Features

### 1. Authentication System
- Login/Sign-up pages
- Email/Password-based authentication
- Email format validation
- Password confirmation (during sign-up)
- Remember Me feature
- Terms of service checkbox
- Toast notifications for user feedback

### 2. Home Page (/)
- Uses 4+ TMDB API endpoints
  - Popular Movies
  - Now Playing
  - Top Rated
  - Upcoming
- Dynamic movie card rendering
- Wishlist feature
- Responsive grid layout

### 3. Popular Content Page (/popular)
- Table View / Infinite Scroll mode toggle
- Pagination (Table View)
- Infinite scrolling (Infinity Scroll)
- Scroll to top button
- Loading state indicators
- Top 10 movies display

### 4. Browse Page (/search)
- Genre filtering
- Minimum rating filtering
- Various sorting options
  - Recommended, Popular, Rating, Release Date, Title
- Filter reset functionality

### 5. Wishlist Page (/wishlist)
- Local Storage-based wishlist
- Simple statistics and movie recommendations based on wishlist

### 6. Common Features
- Responsive header (background color changes on scroll)
- Movie card hover effects
- Wishlist toggle functionality
- Loading spinner
- Responsive web design

## Tech Stack

### Frontend
- **Vue.js 3**: Using Composition API
- **TypeScript**: Type safety
- **Pinia**: Global state management
- **Vue Router**: SPA routing
- **Axios**: HTTP client

### Styling
- **CSS3**: CSS Variables, Flexbox, Grid
- **CSS Animations**: Transitions, Keyframes
- **Font Awesome**: Icons

### Development
- **Vite**: Build tool
- **Node.js**: v20.19.0 or higher

## Project Structure

```
PB_assignment_2/
├── public/
│   └── favicon.ico                # Favicon
├── src/
│   ├── assets/
│   │   └── styles/
│   │       └── main.css           # Global styles (CSS Variables, responsive)
│   ├── components/
│   │   ├── AppFooter.vue          # Footer component
│   │   ├── AppHeader.vue          # Header component (scroll effect)
│   │   ├── InfiniteScrollView.vue # Infinite scroll view
│   │   ├── LargeMovieCard.vue     # Movie card component
│   │   ├── LoadingSpinner.vue     # Loading spinner
│   │   ├── MovieCardSkeleton.vue  # Skeleton UI
│   │   ├── MovieDetailModal.vue   # Movie detail modal
│   │   ├── MovieSlider.vue        # Movie slider component
│   │   ├── SearchBar.vue          # Search bar component
│   │   ├── TableView.vue          # Table view
│   │   └── ToastNotification.vue  # Toast notification
│   ├── composables/
│   │   ├── index.ts               # Composables integrated export
│   │   ├── useApiCache.ts         # API caching logic
│   │   ├── useRecommendations.ts  # Recommendation system logic
│   │   ├── useSearchHistory.ts    # Search history management
│   │   ├── useTheme.ts            # Theme management
│   │   ├── useUserPreferences.ts  # User preferences management
│   │   ├── useWatchHistory.ts     # Watch history management
│   │   └── useWishlist.ts         # Wishlist management
│   ├── router/
│   │   └── index.ts               # Vue Router setup (route guards included)
│   ├── stores/
│   │   ├── auth.ts                # Authentication state management (Pinia)
│   │   └── counter.ts             # Counter store (default)
│   ├── types/
│   │   └── movie.ts               # TypeScript type definitions
│   ├── utils/
│   │   ├── auth.ts                # Authentication utilities
│   │   ├── localStorage.ts        # LocalStorage helper
│   │   └── tmdb.ts                # TMDB API client
│   ├── views/
│   │   ├── HomeView.vue           # Home page
│   │   ├── PopularView.vue        # Popular content page
│   │   ├── SearchView.vue         # Browse page
│   │   ├── SignInView.vue         # Login/Sign-up page
│   │   └── WishlistView.vue       # Wishlist page
│   ├── App.vue                    # Root component
│   └── main.ts                    # App entry point
├── .gitignore
├── env.d.ts                       # TypeScript environment type definitions
├── index.html                     # HTML entry point
├── package.json                   # Project dependencies
├── package-lock.json
├── tsconfig.json                  # TypeScript configuration
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts                 # Vite build configuration
└── README.md                      # Project documentation
```

## Installation and Setup

### Prerequisites
- Node.js v20.19.0 or higher
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
```

### Development Server

```bash
# Run in development mode (http://localhost:5173)
npm run dev
```

### Production Build

```bash
# Type check and build
npm run build

# Preview build output
npm run preview
```

### Type Checking

```bash
# TypeScript type checking
npm run type-check
```

## Local Storage Usage

This project stores the following data in Local Storage:

1. **isLoggedIn**: Login status
2. **users**: List of registered users (email, password)
3. **currentUser**: Current logged-in user email
4. **keepLogin**: Remember login status
5. **movieWishlist**: Wishlist of movies

## Git Commit Message Conventions

This project follows these commit message conventions:

### Commit Message Format

```
<Type>: <Subject>
```

### Types

- **FEAT**: Add new feature
  - Example: `FEAT: Add user authentication`
  - Example: `FEAT: Implement infinite scroll`

- **ADD**: Add files, components, or resources
  - Example: `ADD: MovieDetailModal component`
  - Example: `ADD: useTheme composable`

- **FIX**: Bug fixes
  - Example: `FIX: Resolve login form validation issue`
  - Example: `FIX: Correct movie card aspect ratio`

- **REFACTOR**: Code refactoring (no functional changes)
  - Example: `REFACTOR: Simplify auth logic`
  - Example: `REFACTOR: Extract common utilities`

- **STYLE**: Code style changes (formatting, semicolons, etc.)
  - Example: `STYLE: Format CSS with prettier`
  - Example: `STYLE: Fix indentation`

- **DOCS**: Documentation updates
  - Example: `DOCS: Update README installation guide`
  - Example: `DOCS: Add API documentation`

- **CHORE**: Build and configuration file updates
  - Example: `CHORE: Update vite config`
  - Example: `CHORE: Add ESLint rules`

### Writing Rules

- Within 50 characters, no period, imperative mood (verb base form), capitalize first letter

### Commit Examples

```bash
# Simple commit
git commit -m "FEAT: Add dark mode toggle"


## Branching Strategy

This project uses the **Git Flow** strategy:

### Branch Types

#### 1. `main` (Production Branch)
- Contains only stable, deployable code
- No direct commits allowed
- Can only be merged from `dev` branch via Pull Request

#### 2. `dev` (Development Branch)
- Development for next release
- Where `feature` branches are merged via Git Merge
- Once feature development is complete, create PR to `main`

#### 3. `feature/*` (Feature Development Branch)
- For new feature development
- Branched from `dev` branch
- After development, merge to `dev` via Git Merge
- Branch naming convention: `feature/feature-name`
  - Example: `feature/login`, `feature/movie-detail-modal`

### Workflow

```bash
# 1. Create feature branch from dev
git checkout dev
git pull origin dev
git checkout -b feature/movie-slider

# 2. Develop feature and commit
git add .
git commit -m "FEAT: Add movie slider component"

# 3. Merge to dev branch (Git Merge)
git checkout dev
git merge feature/movie-slider
git push origin dev

# 4. Delete local branch
git branch -d feature/movie-slider

# 5. When ready to deploy (dev → main) - Use Pull Request
# Create PR on GitHub (dev → main)
# Merge after code review
```

### Branch Naming Conventions

- **feature/** : Feature development
  - `feature/infinite-scroll`
  - `feature/dark-mode`

- **fix/** : Bug fixes (non-urgent)
  - `fix/search-filter`
  - `fix/modal-scroll`

- **hotfix/** : Urgent bug fixes (branched directly from main)
  - `hotfix/critical-auth-bug`

### Merge Policy

- **Git Merge**: feature → dev
  - Merge locally with `git merge` command
  - Preserve commit history

- **Pull Request**: dev → main
  - Create PR on GitHub
  - Code review required
  - Clearly distinguish release units


## Main CSS Classes

### Buttons
- `.btn`: Basic button
- `.btn-primary`: Primary button (red)
- `.btn-secondary`: Secondary button
- `.btn-ghost`: Transparent button

### Input Fields
- `.input-field`: Input field
- `.input-label`: Label
- `.input-error`: Error state

### Layout
- `.container`: Container
- `.page-container`: Page container
- `.movie-grid`: Movie grid
- `.section`: Section

### Components
- `.movie-card`: Movie card
- `.header`: Header
- `.loading-spinner`: Loading spinner
- `.toast`: Toast notification

## Responsive Breakpoints

- **Desktop**: 1025px and above
- **Tablet**: 769px ~ 1024px
- **Mobile**: 768px and below
- **Small Mobile**: 480px and below

## Implementation Highlights

### Vue.js Features
- Composition API usage
- TypeScript type safety
- Global state management with Pinia
- Custom Composables (useWishlist)
- Dynamic Component Rendering
- Conditional & Iterative Rendering

### CSS Features
- Theme management with CSS Variables
- Flexbox & Grid layouts
- CSS Transitions & Animations
- Responsive media queries
- BEM methodology reference

### Performance Optimization
- Image lazy loading
- Infinite scroll optimization
- Local Storage caching
- Debounce/Throttle (as needed)
