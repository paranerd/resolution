<template>
  <div class="progress-container">
    <div class="progress-bar">
      <div class="progress-bar-value"></div>
    </div>
  </div>
</template>

<script>
export default {};
</script>

<style lang="scss">
.progress-container {
  width: 100%;
  margin: auto;
}

.progress-bar {
  height: 4px;
  background-color: $secondary-color;
  width: 100%;
  overflow: hidden;
}

.progress-bar-value {
  width: 100%;
  height: 100%;
  background-color: $accent-color;
  animation: indeterminateAnimation 1s infinite linear;
  transform-origin: 0% 50%;
}

@keyframes indeterminateAnimation {
  0% {
    transform: translateX(0) scaleX(0);
  }
  40% {
    transform: translateX(0) scaleX(0.4);
  }
  100% {
    transform: translateX(100%) scaleX(0.5);
  }
}
</style>
