<template>
  <div class="c-search">
    <form role="search" method="get" id="searchform" class="c-search-form" @submit.prevent="handleSearchSubmit">
      <button type="submit" class="c-search-form__button">
        <svg width="15px" height="17px" class="is-search">
          <use xlink:href="#search"></use>
        </svg>
      </button>
      <input type="text" v-model="searchInput" placeholder="Поиск" @keydown.enter="fetchSearch" />
    </form>

    <div class="c-search__result" :class="{'is-active': searchContainerVisability}">
      <UiCSpinner v-if="requestInProgress"/>
      <svg v-if="searchResult.length > 0" @click="handleCloseClick" width="20px" height="20px" class="c-search__close">
        <use xlink:href="#icon-close"></use>
      </svg>
      <p v-if="!searchResult.length && !requestInProgress">По вашему запросу ничего не найдено!</p>
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
const { locale } = useI18n()
const localePath = useLocalePath()
const router = useRouter()
const { requestInProgress, waitRequest } = useWaitRequest()

const searchInput = ref('')
const searchResult = ref([])
const searchContainerVisability = ref(false)
const debounceTimeout = ref(null)

watch(searchInput, (newValue) => {
  if (newValue.length >= 3) {
    debouncedSearch()
  }
})

function fetchSearch() {
  if (!searchInput.value.trim() || searchInput.value.trim().length < 3) return
  searchContainerVisability.value = true
  waitRequest(() => {
    return $fetch('/api/search/search', {
      method: 'POST',
      body: { lang: locale.value, query: searchInput.value },
    })
    .then((result) => {
      searchResult.value = result?.products || []
    })
    .catch((error) => {
      console.error(error)
      searchContainerVisability.value = false
    })
  })
}

function handleCloseClick() {
  searchContainerVisability.value = false
}

function debouncedSearch() {
  if (debounceTimeout.value) clearTimeout(debounceTimeout.value)
  debounceTimeout.value = setTimeout(() => fetchSearch(), 1000)
}

async function goToSearchPage() {
  if (!searchInput.value.trim()) return
  const searchUrl = localePath(`/search?s=${encodeURIComponent(searchInput.value)}`)
  await router.push(searchUrl)
}

function handleSearchSubmit() {
  goToSearchPage()
  handleCloseClick()
}
</script>

<style>
@import "~/assets/scss/components/search.scss";
</style>

<style lang="scss" scoped>
  @import "~/assets/scss/layout/mini-cart.scss";
</style>