<template>
  <div style="position: relative; height: 100%">
    <video ref="videoPlayer">
      <source :src="src" type="video/mp4" />
    </video>
  </div>

  <div class="controls">
    <button @click="togglePlay()">
      <font-awesome-icon :icon="paused ? 'play-circle' : 'pause-circle'" />
    </button>

    <!-- Progress -->
    <div class="progress-container" @click="seek($event)">
      <div class="progress-bg">
        <div class="progress" :style="{ width: progress + '%' }"></div>
      </div>
    </div>

    <div class="time-remaining">{{ remaining }}</div>
  </div>
</template>

<script>
export default {
  props: ['src'],
  data() {
    return {
      player: null,
      progress: 0,
      remaining: null,
    };
  },
  computed: {
    paused() {
      return this.player ? this.player.paused : true;
    },
  },
  watch: {
    src(val) {
      this.player.src = val;
    },
  },
  mounted() {
    // Initialize video player
    this.player = this.$refs.videoPlayer;

    // Update UI when currentTime updates
    // Either while playing or because of user interaction
    this.player.ontimeupdate = () => {
      this.updateUi();
    };

    // Update UI once we got metadata
    this.player.onloadedmetadata = () => {
      this.updateUi();
    };

    // Handle click on video
    // Default play/pause toggle is disabled without controls
    this.player.onclick = () => {
      this.togglePlay();
    };
  },
  methods: {
    /**
     * Seek video.
     */
    seek(event) {
      if (!this.player) {
        return;
      }

      const seekTo =
        (event.offsetX / event.target.offsetWidth) * this.player.duration;

      this.player.currentTime = seekTo;
    },
    /**
     * Update player UI.
     */
    updateUi() {
      this.progress = (this.player.currentTime / this.player.duration) * 100;
      this.remaining = this.formatRemaining();
    },
    /**
     * Format remaining time.
     *
     * @return {string}
     */
    formatRemaining() {
      if (isNaN(this.player.duration) || isNaN(this.player.currentTime)) {
        return null;
      }

      let seconds = Math.floor(this.player.duration - this.player.currentTime);
      const minutes = Math.floor(seconds / 60);
      seconds -= minutes * 60;

      const minutesFormatted = `0${minutes}`.slice(-2);
      const secondsFormatted = `0${seconds}`.slice(-2);

      return `${minutesFormatted}:${secondsFormatted}`;
    },
    /**
     * Toggle play state.
     */
    togglePlay() {
      if (this.player.paused || this.player.ended) {
        this.player.play();
      } else {
        this.player.pause();
      }
    },
  },
};
</script>

<style lang="scss" scoped>
video {
  height: 100%;
}

.controls {
  position: absolute;
  bottom: 0;
  left: 0;
  padding: 0 1rem;
  height: 40px;
  width: 100%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  display: flex;
  align-items: center;
  z-index: 1;
}

.progress-container {
  margin: 0 1rem;
  height: 100%;
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.progress-bg {
  height: 5px;
  flex: 1;
  background: #999;
}

.progress {
  height: 100%;
  background: #fff;
}
</style>
