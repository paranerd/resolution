<template>
  <div class="loader">
    <span></span>
    <span></span>
    <span></span>
    <span></span>
  </div>
</template>

<script>
export default {};
</script>

<style lang="scss" scoped>
.loader {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}

.loader span {
  margin: 5px;
  height: 20px;
  width: 20px;
  opacity: 0.5;
  background: #fff;
  animation: loader-oscillate 0.5s ease-in-out infinite;
  animation-direction: alternate;
  animation-fill-mode: none;
}

.loader span:nth-child(1) {
  animation-delay: -300ms;
  background-color: #672576;
}

.loader span:nth-child(2) {
  animation-delay: -200ms;
  background-color: #781c70;
}

.loader span:nth-child(3) {
  animation-delay: -100ms;
  background-color: #a32480;
}

.loader span:nth-child(4) {
  background-color: #c4308b;
}

@keyframes loader-oscillate {
  0% {
    opacity: 0.5;
    transform: scaleY(1);
  }
  100% {
    opacity: 1;
    transform: scaleY(1.3);
  }
}
</style>
