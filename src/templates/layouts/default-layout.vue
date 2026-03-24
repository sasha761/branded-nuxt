<template>
  <div class="default-layout">
    <L-Modal />
    <L-Header />
      <div class="wrapper">
        <router-view :key="$route.path"></router-view>
      </div>
    <L-Footer />
  </div>
</template>

<script>
import LHeader from '@/templates/layout/L-Header.vue'
import LFooter from '@/templates/layout/L-Footer.vue'
import LModal from '@/templates/layout/L-Modal.vue'

export default {
  components: {
    LHeader,
    LFooter,
    LModal
  },
}
</script>
