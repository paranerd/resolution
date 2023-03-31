<template>
  <div class="container" v-if="show">
    <div id="upload-thumbnail" :style="{'background-image': thumbnailUrl}"></div>

    <div id="upload-info">
      <div id="upload-status">
        <div id="upload-title">Uploading...</div>
        <div id="upload-filename">{{ filename }}</div>
        <div id="upload-progress">
          <span>{{ current }}</span>
          of
          <span>{{ total }}</span>
        </div>
      </div>
      
      <div class="upload-progress-bar-container">
        <div class="upload-progress-bar" :style="{'width': `${progress}%`}"></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  data() {
    return {
      show: false,
      hideTimeout: 5000,
      totalChangeTimestamp: 0,
    };
  },
  computed: {
    uploadStatus() {
      return this.$store.getters.uploadStatus;
    },
    thumbnailUrl() {
      return this.$store.state.upload.thumbnail;
    },
    filename() {
      return this.$store.state.upload.filename;
    },
    current() {
      return this.$store.state.upload.current;
    },
    total() {
      return this.$store.state.upload.total;
    },
    progress() {
      return this.$store.state.upload.progress;
    },
  },
  watch: {
    uploadStatus (val) {
      this.show = val.total > 0;
      const totalChangeTimestamp = Date.now();
      this.totalChangeTimestamp = totalChangeTimestamp;

      if (val.progress === 100 && val.current === val.total) {
        setTimeout(() => {
          if (this.totalChangeTimestamp === totalChangeTimestamp) {
            this.show = false;
          }
        }, this.hideTimeout);
      }
    },
  }
});
</script>

<style lang="scss" scoped>
#upload-status {
  margin-left: 10px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

#upload-info {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
}

#upload-title {
  font-size: 0.75rem;
}

#upload-progress {
  margin-top: 5px;
  font-size: 0.75rem;
}

#upload-filename {
  margin-top: 5px;
  font-weight: 700;
  width: 130px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.container {
  position: absolute;
  bottom: 20px;
  left: 50px;
  height: 80px;
  width: 300px;
  background: #fff;
  border-radius: 0.25rem;
  display: flex;
  justify-content: left;
  color: $text-color;
  overflow: hidden;
}

#upload-thumbnail {
  height: 100px;
  width: 100px;
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
  background-color: #f1f1f1;
}

.upload-progress-bar-container {
  width: 100%;
  height: 5px;
  background: #f1f1f1;
}

.upload-progress-bar {
  height: 100%;
  background: $accent-color;
}
</style>
