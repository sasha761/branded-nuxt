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
      <router-link :to="item.slug">
        <span>{{ item.title }}</span>
      </router-link>

      <div v-if="item.submenu.length" class="c-menu__container js-sub-menu">
        <ul class="c-sub-menu" :class="{ 'is-child-3': item.submenu[0].submenu.length }">
          <li v-for="(item2, index2) in item.submenu" :key="index2" class="c-sub-menu__item">
            <router-link :to="item2.slug" :class="{'c-sub-menu__item-subtitle': item2.submenu.length }">
              <span>{{ item2.title }}</span>
            </router-link>

            <ul class="c-sub-menu-3" v-if="item2.submenu.length">
              <li class="c-sub-menu__item-3" v-for="(item3, index3) in item2.submenu" :key="index3">
                <div v-if="item3.submenu.length">
                  <span>{{ item3.title }}</span>
                  <svg width="9px" height="6px" class="c-main-nav__caret">
                    <use xlink:href="#icon-caret"></use>
                  </svg>
                </div>
                <router-link :to="item3.slug" v-else>
                  <span>{{ item3.title }}</span>
                </router-link>

                <div v-if="item3.submenu.length" class="js-list">
                  <ul class="c-sub-menu-4 u-sub-menu">
                    <li class="c-item-4" v-for="(item4, index4) in item3.submenu" :key="index4">
                      <router-link :to="item4.slug">
                        <span>{{ item4.title }}</span>
                      </router-link>
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

<script>
export default {
  props: {
    headerMenu: {
      type: Array
    }
  },
}
</script>