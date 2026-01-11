<template>
  <div class="sidenavcompo">
    <Header />
    <Sidenavbar />
    <nuxt />
  </div>
</template>

<script>
import Sidenavbar from '~/components/sidenavbar.vue'
import Header from '~/components/header.vue'
export default {
  data() {
    return {}
  },
  components: { Header, Sidenavbar },
}
</script>
