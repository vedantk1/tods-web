<template>
  <div class="sidebar-page">
    <div class="sidebar-layout">
      <b-sidebar
        position="static"
        :mobile="mobile"
        :expand-on-hover="expandOnHover"
        :reduce="reduce"
        :delay="expandWithDelay ? 500 : null"
        type="is-light"
        open
      >
        <div class="sidenavbar is-fullheight">
          <div class="blocklogo mb-5">
            <img src="@/assets/img/logo.png" alt="logo" />
          </div>
          <b-menu class="is-custom-mobile">
            <b-menu-list label="Menu">
              <!-- <b-menu-item
                icon="information-outline"
                label="Info"
              ></b-menu-item> -->
              <b-menu-item
                active
                expanded
                icon="view-dashboard"
                label="Dashboard"
              >
                <b-menu-item icon="account" label="Forms"></b-menu-item>
                <!-- <b-menu-item
                  icon="cellphone-link"
                  label="Devices"
                ></b-menu-item> -->
                <!-- <b-menu-item
                  icon="cash-multiple"
                  label="Payments"
                  disabled
                ></b-menu-item> -->
              </b-menu-item>
              <b-menu-item icon="account" label="My Account">
                <b-menu-item
                  icon="account-box"
                  label="Account data"
                ></b-menu-item>
                <b-menu-item
                  icon="home-account"
                  label="Addresses"
                ></b-menu-item>
              </b-menu-item>
            </b-menu-list>
            <!-- <b-menu-list>
              <b-menu-item label="Expo" icon="link"></b-menu-item>
            </b-menu-list>
            <b-menu-list label="Actions">
              <b-menu-item icon="logout" label="Logout"></b-menu-item>
            </b-menu-list> -->
          </b-menu>
        </div>
      </b-sidebar>
    </div>
    <!-- <Nuxt /> -->
  </div>
</template>

<script>
export default {
  data() {
    return {
      expandOnHover: false,
      expandWithDelay: false,
      mobile: 'reduce',
      reduce: false,
    }
  },
}
</script>
