<template>
  <div class="movie-card skeleton">
    <div class="skeleton-poster"></div>
    <div class="movie-card-overlay" style="opacity: 1">
      <div class="movie-card-content">
        <div class="skeleton-title"></div>
        <div class="movie-card-info">
          <span class="skeleton-rating"></span>
          <span class="skeleton-year"></span>
        </div>
        <div class="skeleton-overview">
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.movie-card.skeleton {
  pointer-events: none;
}

.skeleton-poster {
  width: 100%;
  aspect-ratio: 2/3;
  background: linear-gradient(
    90deg,
    var(--bg-light) 0%,
    #2a2a2a 50%,
    var(--bg-light) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-title {
  width: 80%;
  height: 18px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.08) 100%
  );
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 1.5s ease-in-out infinite;
  margin-bottom: 0.5rem;
}

.skeleton-rating,
.skeleton-year {
  display: inline-block;
  height: 14px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.08) 100%
  );
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-rating {
  width: 50px;
}

.skeleton-year {
  width: 40px;
}

.skeleton-overview {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: 0.5rem;
}

.skeleton-line {
  width: 100%;
  height: 11px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.08) 100%
  );
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-line.short {
  width: 70%;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>
