<template>
  <main class="p-page">
    <UiCPageLoader v-if="requestInProgress"/>
    <div class="u-container" v-if="content">
      <div class="row">
        <div class="col-lg-3 col-md-3 col-12 u-col">
          <div class="l-sidebar">
            <ul>
              <li v-for="page in content?.related_pages" :key="page.ID">
                <NuxtLink :to="localePath(stripDomain(page.link))">{{ page.title }}</NuxtLink>
              </li>
            </ul>
            <div class="l-sidebar__contact">
              <a href="mailto:branded.own@gmail.com">branded.own@gmail.com</a>
              <p>Пн-Пт 9:00 – 21:00 <br> Сб-Вс 9:00 – 19:00</p>
            </div>
          </div>
        </div>
        <div class="col-lg-9 col-md-9 col-12 u-col">
          <div class="p-page__content">
            <h1 class="p-page__title u-h2">{{ content?.page?.title }}</h1>
            <div class="p-page__content-text" v-html="content?.page?.content"></div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
const route = useRoute()
const localePath = useLocalePath()
const { locale } = useI18n()
const { stripDomain } = useProductUtils()

const { data: pageData, pending: requestInProgress } = await useAsyncData(
  `page:${route.path}:${locale.value}`,
  async () => {
    const [pageResult, seoResult] = await Promise.all([
      $fetch('/api/page/page', {
        method: 'POST',
        body: {
          url: route.path,
          lang: locale.value,
        },
      }),
      $fetch('/api/seo/get_seo', {
        method: 'POST',
        body: {
          url: route.path,
          type: 'page',
          lang: locale.value,
        },
      }),
    ])

    return { content: pageResult, seo: seoResult }
  },
  {
    watch: [() => route.path],
    default: () => ({ content: null, seo: null }),
  }
)

const content = computed(() => pageData.value?.content ?? null)
const seoRef = computed(() => pageData.value?.seo ?? null)

useSeo(seoRef)
</script>

<style lang="scss" scoped>
  @import "~/assets/scss/layout/sidebar.scss";
</style>