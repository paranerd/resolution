<template>
  <!-- Item -->
  <div ref="item" id="item">
    <!-- Image -->
    <div
      v-if="item && item.type === 'image'"
      class="item"
      :style="{
        height: item.uiHeight + 'px',
        width: item.uiWidth + 'px',
        backgroundImage: `url('${url}')`,
      }"
    ></div>

    <!-- Video -->
    <Video v-if="item && item.type === 'video'" :src="url" />
  </div>

  <!-- Previous Item -->
  <div class="navigation-area previous" v-if="index > 0" @click="previous()">
    <div class="navigation-arrow">
      <svg width="36px" height="36px" viewBox="0 0 24 24">
        <path d="M15.41 16.09l-4.58-4.59 4.58-4.59L14 5.5l-6 6 6 6z"></path>
      </svg>
    </div>
  </div>

  <!-- Next Item -->
  <div
    class="navigation-area next"
    v-if="index < items.length - 1"
    @click="next()"
  >
    <div class="navigation-arrow">
      <svg width="36px" height="36px" viewBox="0 0 24 24">
        <path d="M8.59 16.34l4.58-4.59-4.58-4.59L10 5.75l6 6-6 6z"></path>
      </svg>
    </div>
  </div>

  <!-- Header -->
  <div id="header">
    <!-- Back -->
    <a class="item-header-button" @click="close()">
      <svg
        width="24px"
        height="24px"
        class="item-header-icon"
        viewBox="0 0 24 24"
      >
        <path
          d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
        ></path>
      </svg>
    </a>

    <!-- Context actions -->
    <div class="context-actions">
      <!-- Cast -->
      <div class="item-header-button">
        <Cast :id="id" />
      </div>

      <!-- Menu -->
      <div class="item-header-button" @click="showContext = !showContext">
        <svg
          width="24px"
          height="24px"
          class="item-header-icon"
          viewBox="0 0 24 24"
        >
          <path
            d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
          ></path>
        </svg>

        <ContextMenu v-model:show="showContext" :actions="contextActions" />
      </div>
    </div>
  </div>

  <!-- Loading indicator -->
  <div v-if="loading > 0" class="loader-container">
    <Loader />
  </div>
</template>

<script>
import Cast from '@/components/Cast.vue';
import Loader from '@/components/Loader.vue';
import Video from '@/components/Video.vue';
import ContextMenu from '@/components/ContextMenu.vue';
import ItemService from '@/services/item';
import TokenService from '@/services/token';

export default {
  name: 'Viewer',
  components: {
    Cast,
    Loader,
    ContextMenu,
    Video,
  },
  data() {
    return {
      loading: 0,
      id: this.$route.params.id,
      url: null,
      item: null,
      index: null,
      nextListener: null,
      previousListener: null,
      closeListener: null,
      showContext: false,
      contextActions: [
        {
          title: 'Download',
          callback: this.download,
          icon: 'download',
        },
      ],
    };
  },
  async created() {
    // Fetch all items metadata
    await this.fetchItems();

    // Load current item
    this.loadItem();

    // Next item on arrow right
    this.nextListener = document.addEventListener('keydown', (e) => {
      if (e.key == 'ArrowRight') {
        this.next();
      }
    });

    // Previous item on arrow left
    this.previousListener = document.addEventListener('keydown', (e) => {
      if (e.key == 'ArrowLeft') {
        this.previous();
      }
    });

    // Previous item on arrow left
    this.closeListener = document.addEventListener('keydown', (e) => {
      if (e.key == 'Escape') {
        this.close();
      }
    });
  },
  unmounted() {
    document.removeEventListener('keydown', this.nextListener);
    document.removeEventListener('keydown', this.previousListener);
    document.removeEventListener('keydown', this.closeListener);
  },
  beforeUnmount() {
    if (this.player) {
      this.player.dispose();
    }
  },
  beforeRouteUpdate(to, from, next) {
    this.id = to.params.id;
    this.loadItem();
    next();
  },
  computed: {
    items() {
      return this.$store.state.items;
    },
  },
  methods: {
    /**
     * Initialize item download.
     */
    download() {
      ItemService.download([this.id]);
    },
    /**
     * Fetch items.
     */
    async fetchItems() {
      this.loading += 1;

      try {
        return await ItemService.getAll();
      } catch (err) {
        console.error(err);
        this.error =
          err.status != 0 && err.status < 500
            ? err.error
            : 'Something went wrong...';
        this.totalResults = 0;
      } finally {
        this.loading -= 1;
      }
    },
    /**
     * Load item with screen fitting dimensions.
     */
    async loadItem() {
      // Show progress indicator
      this.loading += 1;

      if (this.items.length === 0) {
        return;
      }

      this.index = this.items.findIndex((item) => item.id == this.id);
      this.item = this.items[this.index];

      const dimensions = this.calculateItemDimensions();
      this.item.uiHeight = dimensions.height;
      this.item.uiWidth = dimensions.width;

      this.url = `${process.env.VUE_APP_API_URL}/item/${this.id}?w=${
        this.item.uiWidth
      }&h=${this.item.uiHeight}&token=${await TokenService.getToken()}`;

      this.loading -= 1;
    },
    /**
     * Go to previous item.
     */
    previous() {
      if (this.index === 0) {
        return;
      }

      this.$router.push({
        name: 'viewer',
        params: { id: this.items[--this.index].id },
      });
    },
    /**
     * Go to next item.
     */
    next() {
      if (this.index === this.items.length - 1) {
        return;
      }

      this.$router.push({
        name: 'viewer',
        params: { id: this.items[++this.index].id },
      });
    },
    /**
     * Close viewer and go back to Timeline.
     */
    close() {
      this.$router.push({ name: 'timeline' });
    },
    /**
     * Determine available dimensions for item.
     *
     * @return {Object}
     */
    getScreenDimensions() {
      const elem = this.$refs.item;
      const style = getComputedStyle(elem);

      return {
        width: parseInt(style.width),
        height: parseInt(style.height),
      };
    },
    /**
     * Calculate item dimensions while maintaining aspect ratio.
     *
     * @return {Object}
     */
    calculateItemDimensions() {
      const sd = this.getScreenDimensions();

      const widthRatio = sd['width'] / this.item.width;
      const heightRatio = sd['height'] / this.item.height;

      let calculatedWidth = this.item.width;
      let calculatedHeight = this.item.height;

      if (this.item.width > sd['width'] && widthRatio < heightRatio) {
        calculatedWidth = sd['width'];
        calculatedHeight = this.item.height * widthRatio;
      } else if (this.item.height > sd['height'] && heightRatio < widthRatio) {
        calculatedHeight = sd['height'];
        calculatedWidth = this.item.width * heightRatio;
      }

      return {
        width: Math.ceil(calculatedWidth),
        height: Math.ceil(calculatedHeight),
      };
    },
  },
};
</script>

<style lang="scss" scoped>
#controls {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
}

#header {
  padding: 0 2rem;
  width: 100%;
  height: 60px;
  background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0));
  display: flex;
  align-items: center;
  color: #fff;
}

#item {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  background: black;
  display: flex;
  justify-content: center;
  align-items: center;
}

.context-actions {
  position: relative;
  margin-left: auto;
  display: flex;
  flex-direction: row;
}

.item-header-button {
  position: relative;
  height: 50px;
  width: 50px;
  border-radius: 5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.item-header-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.item-header-icon {
  fill: #fff;
}

.navigation-area {
  position: absolute;
  padding: 0 2rem;
  width: 30%;
  height: 100%;
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  color: #fff;
  cursor: pointer;

  &.previous {
    top: 0;
    left: 0;
    justify-content: flex-start;
    margin-right: auto;
  }

  &.next {
    top: 0;
    right: 0;
    justify-content: flex-end;
    margin-left: auto;
  }

  &:hover {
    & .navigation-arrow {
      visibility: visible;
    }
  }
}

.navigation-arrow {
  height: 60px;
  width: 60px;
  border-radius: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  visibility: hidden;

  & svg {
    fill: currentColor;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}

.loader-container {
  position: absolute;
  right: 2rem;
  bottom: 2rem;
}

#video-player {
  height: 100%;
}
</style>
