export default defineAppConfig({
  imageLoading: {
    // Запас по высоте до viewport: 0 — только видимая область, 200 — на 200 px раньше.
    viewportOffset: 200,
    // Сколько соседних карточек подгружать по обе стороны видимых в карусели.
    carouselNeighbors: 1,
  },
})
