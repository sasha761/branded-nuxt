<template>
  <aside class="l-sidebar">
    <div
      v-for="(group, index) in sidebar"
      :key="group.id"
      class="l-sidebar__block"
      :class="{ 'is-active': activeIndex === index }"
    >
      <h4 class="l-sidebar__title" @click="toggle(index)">
        <span>{{ group.label }}</span>
        <svg width="11px" height="7px" class="u-arrow">
          <use xlink:href="#arrow"></use>
        </svg>
      </h4>
      <ul ref="listRefs" class="l-sidebar__list">
        <li v-for="child in group.children" :key="child.term_id">
          <NuxtLink :to="child.path">
            {{ child.name }}
          </NuxtLink>
        </li>
      </ul>
    </div>
  </aside>
</template>

<script setup>
import { slideUp, slideDown } from '~/utils/slideToggle'

const props = defineProps({
  slug: { type: String, default: '' },
  items: { type: Array, default: null },
})

const { locale } = useI18n()

const { data: fetchedSidebar } = props.items
  ? { data: ref([]) }
  : useAsyncData(
      `sidebar-${props.slug}-${locale.value}`,
      () => $fetch('/api/archive/get_sidebar', {
        params: {
          lang: locale.value,
          slug: props.slug,
        },
      }),
      { watch: [locale, () => props.slug] }
    )

const sidebar = computed(() => props.items || fetchedSidebar.value || [])

const listRefs = ref([])
const activeIndex = ref(
  sidebar.value ? sidebar.value.findIndex(g => g.is_active) : -1
)

watch(sidebar, (val) => {
  if (val && activeIndex.value === -1) {
    activeIndex.value = val.findIndex(g => g.is_active)
  }
})

onMounted(() => {
  // Как в оригинальном accordion.init():
  // активный — slideDown, остальные — slideUp
  listRefs.value.forEach((el, i) => {
    if (!el) return
    if (i === activeIndex.value) {
      slideDown(el, 0)
    } else {
      slideUp(el, 0)
    }
  })
})

function toggle(index) {
  if (activeIndex.value === index) {
    activeIndex.value = -1
    slideUp(listRefs.value[index])
  } else {
    closeAll()
    openItem(index)
  }
}

function closeAll() {
  if (activeIndex.value !== -1 && listRefs.value[activeIndex.value]) {
    slideUp(listRefs.value[activeIndex.value])
  }
  activeIndex.value = -1
}

function openItem(index) {
  activeIndex.value = index
  slideDown(listRefs.value[index])
}
</script>

<style lang="scss" scoped>
  @import "~/assets/scss/layout/sidebar.scss";
</style>