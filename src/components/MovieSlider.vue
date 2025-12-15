<script setup lang="ts">
import { computed } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation, Autoplay, Pagination } from 'swiper/modules'
import type { Movie } from '@/types/movie'

interface Props {
  movies: Movie[]
  autoplay?: boolean
  autoplayDelay?: number
  pagination?: boolean
  loop?: boolean
  slidesPerView?: number
  spaceBetween?: number
  customClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  autoplay: false,
  autoplayDelay: 4000,
  pagination: false,
  loop: true,
  slidesPerView: 3.5,
  spaceBetween: 12,
  customClass: 'movies-slider'
})

const modules = computed(() => {
  const baseModules = [Navigation]
  if (props.autoplay) baseModules.push(Autoplay)
  if (props.pagination) baseModules.push(Pagination)
  return baseModules
})

const autoplayConfig = computed(() => {
  return props.autoplay ? { delay: props.autoplayDelay, disableOnInteraction: false } : false
})

const paginationConfig = computed(() => {
  return props.pagination ? { clickable: true } : false
})
</script>

<template>
  <Swiper
    :modules="modules"
    :slides-per-view="slidesPerView"
    :space-between="spaceBetween"
    :navigation="true"
    :loop="loop"
    :autoplay="autoplayConfig"
    :pagination="paginationConfig"
    :breakpoints="{
      320: { slidesPerView: 2, spaceBetween: 8 },
      480: { slidesPerView: 2.5, spaceBetween: 10 },
      640: { slidesPerView: 3.5, spaceBetween: 12 },
      768: { slidesPerView: 4, spaceBetween: 12 },
      1024: { slidesPerView: 5, spaceBetween: 12 },
      1280: { slidesPerView: 6, spaceBetween: 12 },
      1600: { slidesPerView: 7, spaceBetween: 15 }
    }"
    :class="customClass"
  >
    <SwiperSlide v-for="movie in movies" :key="movie.id">
      <slot :movie="movie"></slot>
    </SwiperSlide>
  </Swiper>
</template>

<style scoped>
.movies-slider {
  padding: 1rem 0 1.5rem;
}

.movies-slider :deep(.swiper) {
  padding: 0.5rem 0 1rem;
}

.movies-slider :deep(.swiper-wrapper) {
  padding: 0;
}

.movies-slider :deep(.swiper-slide) {
  padding: 0;
}
</style>
