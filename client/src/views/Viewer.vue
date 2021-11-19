<template>
  <!-- Image -->
  <div id="image">
    <!-- Loading indicator -->
    <div
      v-if="loading"
      style="position: absolute; width: 50%; display: flex; align-items: center"
    >
      <ProgressBar />
    </div>

    <div
      v-if="item"
      class="item"
      :style="{
        height: item.uiHeight + 'px',
        width: item.uiWidth + 'px',
        background: 'url(' + url,
      }"
    ></div>
  </div>

  <div id="controls">
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
        <div class="item-header-button" @click="menuOpen = !menuOpen">
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
        </div>
      </div>
    </div>

    <!-- Image Navigation -->
    <div id="image-navigation">
      <!-- Previous -->
      <div
        class="navigation-area previous"
        v-if="index > 0"
        @click="previous()"
      >
        <div class="navigation-arrow">
          <svg width="36px" height="36px" viewBox="0 0 24 24">
            <path d="M15.41 16.09l-4.58-4.59 4.58-4.59L14 5.5l-6 6 6 6z"></path>
          </svg>
        </div>
      </div>

      <!-- Next -->
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
    </div>

    <!-- Backdrop -->
    <button
      v-if="menuOpen"
      @click="menuOpen = false"
      tabindex="-1"
      class="backdrop"
    ></button>

    <!-- Dropdown menu -->
    <div class="dropdown" v-if="menuOpen">
      <!-- Download -->
      <div class="dropdown-item" @click="download()">
        <font-awesome-icon icon="download" />
        <span>Download</span>
      </div>
    </div>
  </div>
</template>

<script>
import Cast from '@/components/Cast.vue';
import ProgressBar from '@/components/ProgressBar.vue';
import axios from 'axios';

export default {
  name: 'Viewer',
  components: {
    Cast,
    ProgressBar,
  },
  data() {
    return {
      loading: false,
      id: this.$route.params.id,
      menuOpen: false,
      item: null,
      items: [],
      index: null,
      nextListener: null,
      previousListener: null,
      closeListener: null,
    };
  },
  created() {
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
  beforeRouteUpdate(to, from, next) {
    this.id = to.params.id;
    this.loadItem();
    next();
  },
  computed: {
    dimensions: function () {
      return this.calculateImageDimensions();
    },
    url: function () {
      return `${process.env.VUE_APP_API_URL}/item/${this.id}?w=${this.dimensions.width}&h=${this.dimensions.height}`;
    },
  },
  methods: {
    async fetchItems() {
      // Show progress indicator
      this.loading = true;

      try {
        if (!this.$store.state.items.length == 0) {
          return this.$store.state.items;
        } else {
          const res = await axios.get(`${process.env.VUE_APP_API_URL}/item`);
          return res.data.items.map((item) => ({
            ...item,
            uiWidth: item.width,
            uiHeight: item.height,
          }));
        }
      } catch (err) {
        console.error(err);
        this.error =
          err.status != 0 && err.status < 500
            ? err.error
            : 'Something went wrong...';
        this.totalResults = 0;
      } finally {
        this.loading = false;
      }
    },
    async loadItem() {
      if (this.items.length === 0) {
        this.items = await this.fetchItems();
      }

      this.index = this.items.findIndex((item) => item.id == this.id);
      this.item = this.items[this.index];

      const dimensions = this.calculateImageDimensions();
      this.item.uiHeight = dimensions.height;
      this.item.uiWidth = dimensions.width;
      this.item.url = `${process.env.VUE_APP_API_URL}/item/${this.item.id}?w=${this.item.uiWidth}&h=${this.item.uiHeight}`;
    },
    previous() {
      if (this.index === 0) {
        return;
      }

      this.$router.push({
        name: 'viewer',
        params: { id: this.items[--this.index].id },
      });
    },
    next() {
      if (this.index === this.index.length - 1) {
        return;
      }

      this.$router.push({
        name: 'viewer',
        params: { id: this.items[++this.index].id },
      });
    },
    close() {
      this.$router.push({ name: 'timeline' });
    },
    getScreenDimensions() {
      const elem = document.getElementById('image');
      const style = getComputedStyle(elem);

      return {
        width: parseInt(style.width),
        height: parseInt(style.height),
      };
    },
    calculateImageDimensions() {
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
        width: calculatedWidth,
        height: calculatedHeight,
      };
    },
  },
};
</script>

<style lang="scss">
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

#image {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  background: black;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: -1;
}

.context-actions {
  position: relative;
  margin-left: auto;
  display: flex;
  flex-direction: row;
}

.item-header-button {
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

#image-navigation {
  display: flex;
  flex-direction: row;
  flex: 1;
  justify-content: space-between;
}

.navigation-area {
  padding: 0 2rem;
  width: 30%;
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  color: #fff;
  cursor: pointer;

  &.previous {
    justify-content: flex-start;
    margin-right: auto;
  }

  &.next {
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

#spinner {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dropdown {
  position: absolute;
  padding: 0.25rem 0;
  right: 0;
  margin-top: 0.5rem;
  width: 12rem;
  border-radius: 0.25rem;
  color: $text-color;
  background: $secondary-color;
}

.dropdown-item {
  padding: 1rem 1rem;
  height: 50px;
  display: flex;
  align-items: center;
  cursor: pointer;

  &:hover {
    background: $tertiary-color;
  }

  & span {
    margin-left: 1rem;
  }
}

.backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  height: 100%;
  width: 100%;
  cursor: default;
}
</style>
