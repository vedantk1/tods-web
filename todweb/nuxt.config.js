export default {
  server: {
    port: process.env.PORT || 3060,
    host: "0.0.0.0",
    timing: false,
  },
  // Global page headers: https://go.nuxtjs.dev/config-head
  env: {
    NODE_URL_LOC: "http://127.0.0.1:5050/api",
    NODE_URL_DEV: "https://todapi.travelodesk.com/api",
    NODE_URL_STG: "http://node.systimanx.xyz:5050/api",
    NODE_URL_LIVE: "https://api.systimanx.org/api",
    PRODUCTION_TYPE: "dev", // if in local "loc" --OR-- if in develepment server "dev" --OR-- if in Staging server "stg" --OR-- if in Live "live"
    API_SERVER: "node",
    COMPANY_NAME: "Travel O Desk",
    CUSTOM_CARE_NUMBER: "+33 783124680",
    CUSTOM_CARE_EMAIL: "support@travel0desk.in", // sample value
    PERMISSION_ADD: 1,
    PERMISSION_EDIT: 2,
    PERMISSION_LIST: 3,
    PERMISSION_DELETE: 4,
    PERMISSION_VIEW: 5,
    PERMISSION_ACTIVE_INACTIVE: 6,
    PERMISSION_DRAG_AND_DROP: 7,
    PERMISSION_RESET_PASSWORD: 8,
    PERMISSION_EXPORT: 9,
    PERMISSION_SET_DEFAULT: 10,
  },
  head: {
    title: "tod-web",
    htmlAttrs: {
      lang: "en",
    },
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { hid: "description", name: "description", content: "" },
      { name: "format-detection", content: "telephone=no" },
    ],
    link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: ["@/assets/scss/main.scss"],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/buefy
    "nuxt-buefy",
  ],

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {},
};
