<template>
  <nav v-if="totalPages > 1" class="c-pagination" :aria-label="t('pagination')">
    <ul>
      <li
        v-for="item in items"
        :key="item.key"
        :class="{ 'is-active': item.page === page, 'is-dots': item.page === null }"
      >
        <span v-if="item.page === null" class="page-numbers dots">…</span>
        <span v-else-if="item.page === page" class="page-numbers current" aria-current="page">{{ item.page }}</span>
        <NuxtLink
          v-else
          :to="pageLink(item.page)"
          class="page-numbers"
          @click="scrollToTop"
        >
          {{ item.page }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<script setup>
// Ссылки ?page=N вместо кнопок: роботы видят страницы архива, как в пагинации WP.
const props = defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true },
})

const route = useRoute()
const { t } = useI18n()

// Как paginate_links() в теме: первая и последняя, по две вокруг текущей.
const items = computed(() => {
  const pages = new Set([1, props.totalPages])
  for (let i = props.page - 2; i <= props.page + 2; i++) {
    if (i > 1 && i < props.totalPages) pages.add(i)
  }

  const result = []
  let previous = 0
  for (const current of [...pages].sort((a, b) => a - b)) {
    if (current - previous > 1) result.push({ key: `dots-${current}`, page: null })
    result.push({ key: current, page: current })
    previous = current
  }
  return result
})

function pageLink(page) {
  return {
    path: route.path,
    query: { ...route.query, page: page > 1 ? String(page) : undefined },
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<style lang="scss">
@import "~/assets/scss/components/pagination.scss";
</style>
