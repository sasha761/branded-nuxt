<template>
  <div class="c-modal c-mobile-menu js-tab-mobile-menu" id="mobile-menu">
    <UiCTab :data="tabs" :labels="tabLabels">
      <template #additionalFieldInTabNav>
        <svg @click="handleCloseClick" width="20px" height="20px" data-modal="close" class="c-mobile-menu__close">
          <use xlink:href="#icon-close"></use>
        </svg>
      </template>
      <template #tabContent="{ tabContent }">
        <div class="c-mobile-menu__cat">
          <NuxtLink
            v-for="(item, index) in tabContent"
            :key="index"
            :to="item.path"
            class="c-mobile-menu__item"
          >
            <span>{{ item.title }}</span>
            <picture v-if="item.image">
              <source :srcset="item.image.url" type="image/jpeg">
              <img
                :src="item.image.url"
                :alt="item.title"
                :title="item.title"
                width="95"
                height="95"
                loading="lazy"
                decoding="async"
              >
            </picture>
          </NuxtLink>
        </div>
      </template>
    </UiCTab>
  </div>
</template>

<script setup>
const props = defineProps({
  data: { type: Object },
})

const localePath = useLocalePath()
const { t } = useI18n()
const { close } = usePopup()

// API отдаёт {man, woman}; вкладки как в теме WP: сначала «Женщинам»
const tabs = computed(() => ({
  menu: {
    woman: props.data?.menu?.woman ?? [],
    man: props.data?.menu?.man ?? [],
  },
}))

const tabLabels = computed(() => ({
  woman: t('for_women'),
  man: t('for_men'),
}))

function handleCloseClick() {
  close(1)
}
</script>

<style lang="scss">
@import "~/assets/scss/components/mobile-menu.scss";
</style>
