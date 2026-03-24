<template>
  <ul class="c-menu">
    <li class="c-menu__item">
      <a href="https://branded.com.ua/sales" class="d-flex align-items-center">
        <svg width="18px" height="18px" style="margin-right: 6px">
          <use xlink:href="#sales"></use>
        </svg>
        <span>Sales</span>
      </a>
    </li>
    <li class="c-menu__item" v-for="(item, index) in headerMenu" :key="index">
      <NuxtLink :to="localePath(item.slug)">
        <span>{{ item.title }}</span>
      </NuxtLink>

      <div v-if="item.submenu.length" class="c-menu__container js-sub-menu">
        <ul class="c-sub-menu" :class="{ 'is-child-3': item.submenu[0].submenu.length }">
          <li v-for="(item2, index2) in item.submenu" :key="index2" class="c-sub-menu__item">
            <NuxtLink :to="localePath(item2.slug)" :class="{'c-sub-menu__item-subtitle': item2.submenu.length }">
              <span>{{ item2.title }}</span>
            </NuxtLink>

            <ul class="c-sub-menu-3" v-if="item2.submenu.length">
              <li class="c-sub-menu__item-3" v-for="(item3, index3) in item2.submenu" :key="index3">
                <div v-if="item3.submenu.length">
                  <span>{{ item3.title }}</span>
                  <svg width="9px" height="6px" class="c-main-nav__caret">
                    <use xlink:href="#icon-caret"></use>
                  </svg>
                </div>
                <NuxtLink :to="localePath(item3.slug)" v-else>
                  <span>{{ item3.title }}</span>
                </NuxtLink>

                <div v-if="item3.submenu.length" class="js-list">
                  <ul class="c-sub-menu-4 u-sub-menu">
                    <li class="c-item-4" v-for="(item4, index4) in item3.submenu" :key="index4">
                      <NuxtLink :to="localePath(item4.slug)">
                        <span>{{ item4.title }}</span>
                      </NuxtLink>
                    </li>
                  </ul>
                </div>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </li>
  </ul>
</template>

<script setup>
defineProps({
  headerMenu: {
    type: Array,
  },
})

const localePath = useLocalePath()
</script>

<style lang="scss">
@import "~/assets/scss/components/menu.scss";
</style>