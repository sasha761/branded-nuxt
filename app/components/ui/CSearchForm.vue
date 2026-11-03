<template>
  <div class="c-search">
    <form role="search" method="get" id="searchform" class="c-search-form" @submit.prevent="handleSearchSubmit">
      <button type="submit" class="c-search-form__button">
        <svg width="15px" height="17px" class="is-search">
          <use xlink:href="#search"></use>
        </svg>
      </button>
      <input type="text" name="search" v-model="searchInput" :placeholder="t('search') " />
    </form>

    <div class="c-search__result" :class="{'is-active': searchContainerVisability}">
      <UiCSpinner v-if="requestInProgress"/>
      <svg v-if="searchResult.length > 0" @click="handleCloseClick" width="20px" height="20px" class="c-search__close">
        <use xlink:href="#icon-close"></use>
      </svg>
      <p v-if="!searchResult.length && !requestInProgress">{{ t('no_results') }}</p>
      <div v-if="searchResult.length > 0" class="l-mini-cart" :class="{'is-opacity': requestInProgress}">
        <ul class="l-mini-cart__list">
          <li v-for="(product, index) in searchResult" :key="index" class="l-mini-cart__item">
            <UiCMiniCartItem :product="product" />
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
const { locale, t } = useI18n()
const localePath = useLocalePath()
const router = useRouter()
const searchInput = ref('')
const searchResult = ref([])
const searchContainerVisability = ref(false)
const debounceTimeout = ref(null)
const requestInProgress = ref(false)
let searchController = null

watch(searchInput, (newValue) => {
  if (newValue.length >= 3) {
    debouncedSearch()
    return
  }

  cancelSearch()
})

onBeforeUnmount(cancelSearch)

// Новый запрос отменяет предыдущий: в подсказках всегда результат последнего введённого текста.
// (Раньше новый запрос пропускался, пока WP отвечал на старый, и подсказки отставали от ввода.)
function fetchSearch() {
  const query = searchInput.value.trim()
  if (query.length < 3) return
  searchContainerVisability.value = true

  searchController?.abort()
  const controller = new AbortController()
  searchController = controller
  requestInProgress.value = true

  $fetch('/api/search/search', {
    params: { lang: locale.value, query, posts_per_page: 7 },
    signal: controller.signal,
  })
    .then((result) => {
      if (searchController !== controller) return
      searchResult.value = result?.products || []
    })
    .catch((error) => {
      if (controller.signal.aborted) return
      console.error(error)
      searchContainerVisability.value = false
    })
    .finally(() => {
      if (searchController === controller) {
        searchController = null
        requestInProgress.value = false
      }
    })
}

function cancelSearch() {
  clearDebounceTimeout()
  searchController?.abort()
}

function handleCloseClick() {
  searchContainerVisability.value = false
}

function debouncedSearch() {
  clearDebounceTimeout()
  debounceTimeout.value = setTimeout(() => fetchSearch(), 1000)
}

function clearDebounceTimeout() {
  if (!debounceTimeout.value) return

  clearTimeout(debounceTimeout.value)
  debounceTimeout.value = null
}

async function goToSearchPage() {
  if (!searchInput.value.trim()) return
  await router.push(localePath({ path: '/search/', query: { s: searchInput.value.trim() } }))
}

function handleSearchSubmit() {
  cancelSearch()
  goToSearchPage()
  handleCloseClick()
}
</script>

<style lang="scss">
@import "~/assets/scss/components/search.scss";
</style>

<style lang="scss" scoped>
  @import "~/assets/scss/layout/mini-cart.scss";
</style>
