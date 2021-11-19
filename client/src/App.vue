<template>
  <router-view />
</template>

<script>
export default {
  name: 'App',
};
</script>

<style lang="scss">
/* roboto-300 - latin */
@font-face {
  font-family: 'roboto-300';
  font-style: normal;
  font-weight: 300;
  src: local(''),
    url('~@/assets/fonts/roboto/roboto-v20-latin-300.woff2') format('woff2'),
    url('~@/assets/fonts/roboto/roboto-v20-latin-300.woff') format('woff');
}

/* roboto-regular - latin */
@font-face {
  font-family: 'roboto';
  font-style: normal;
  font-weight: 400;
  src: url('~@/assets/fonts/roboto/roboto-v20-latin-regular.woff2')
      format('woff2'),
    url('~@/assets/fonts/roboto/roboto-v20-latin-regular.woff') format('woff');
}

/* roboto-500 - latin */
@font-face {
  font-family: 'roboto-500';
  font-style: normal;
  font-weight: 500;
  src: url('~@/assets/fonts/roboto/roboto-v20-latin-500.woff2') format('woff2'),
    url('~@/assets/fonts/roboto/roboto-v20-latin-500.woff') format('woff');
}

body {
  font-family: roboto-300, 'Helvetica Neue', sans-serif;
  background: $primary-color;
}
</style>
