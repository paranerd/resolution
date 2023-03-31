<template>
  <a
    class="item"
    ref="item"
    :class="{ selected, lazy }"
    v-bind:style="{ height: item.uiHeight + 'px', width: item.uiWidth + 'px' }"
    @click="handleItemClick()"
  >
    <!-- Image -->
    <div
      class="image"
      v-bind:style="{ 'background-image': 'url(' + url + ')' }"
    ></div>

    <div v-if="item.duration" class="duration">
      <span>{{ formattedDuration }}</span>
      <font-awesome-icon icon="play-circle" />
    </div>

    <!-- Overlay -->
    <div class="item-overlay"></div>

    <!-- Checkbox -->
    <div class="item-checkbox">
      <!-- Blue highlight -->
      <!--<svg class="item-checkbox-shine" width="24px" height="24px" viewBox="0 0 24 24" @click="$event.stopPropagation(); toggleSelect()"><circle cx="12" cy="12" r="17"></circle></svg>-->

      <!-- Outer ring -->
      <svg
        class="item-checkbox-outline"
        v-if="selectedCount > 0"
        width="24px"
        height="24px"
        viewBox="0 0 24 24"
        @click.stop="toggleSelect()"
      >
        <path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"
        ></path>
      </svg>

      <!-- White background -->
      <svg
        class="item-checkbox-white"
        v-if="selected"
        width="24px"
        height="24px"
        viewBox="0 0 24 24"
        @click.stop="toggleSelect()"
      >
        <circle cx="12.5" cy="12.2" r="8.292"></circle>
      </svg>

      <!-- White background -->
      <!--<svg class="item-checkbox-white" v-if="selected" width="24px" height="24px" viewBox="0 0 24 24" @click.stop="toggleSelect()"><circle opacity=".26" fill="url(#checkboxShadowCircle)" cx="12" cy="13.512" r="10.488"></circle><circle fill="#FFF" cx="12" cy="12.2" r="8.292"></circle></svg>-->

      <!-- Semi checked -->
      <svg
        class="item-checkbox-checkmark"
        v-bind:class="{
          'item-checkbox-blue': selected,
          'item-checkbox-white': selectedCount > 0,
        }"
        width="24px"
        height="24px"
        viewBox="0 0 24 24"
        @click.stop="toggleSelect()"
      >
        <path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
        ></path>
      </svg>
    </div>
  </a>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import tokenService from '@/services/token';

export default defineComponent({
  props: ['item'],
  data() {
    return {
      selectedCount: 0,
      lazy: true,
      lazyLoadWait: 100,
      currentLoadJobTimestamp: null,
      url: '',
    };
  },
  mounted() {
    this.lazyload();
  },
  computed: {
    selected() {
      return this.$store.state.selected.includes(this.item.id);
    },
    formattedDuration() {
      if (!this.item.duration) {
        return null;
      }

      let seconds = this.item.duration;
      const minutes = Math.floor(seconds / 60);
      seconds -= minutes * 60;

      const minutesFormatted = `0${minutes}`.slice(-2);
      const secondsFormatted = `0${seconds}`.slice(-2);

      return `${minutesFormatted}:${secondsFormatted}`;
    },
    width() {
      return this.item.uiWidth;
    },
    height() {
      return this.item.uiHeight;
    },
  },
  watch: {
    width(newVal, oldVal) {
      if (oldVal !== newVal) {
        this.url = '';
      }
    },
    height(newVal, oldVal) {
      if (oldVal !== newVal) {
        this.url = '';
      }
    },
  },
  methods: {
    /**
     * Load item if in view.
     */
    async lazyload() {
      if (this.url) {
        return;
      }

      const item: HTMLElement = this.$refs.item as HTMLElement;

      if (this.isInView(item)) {
        this.lazy = false;

        this.url = `${process.env.VUE_APP_API_URL}/item/${this.item.id}?w=${
          this.item.uiWidth
        }&thumbnail=true&h=${
          this.item.uiHeight
        }&token=${await tokenService.getToken()}`;
      }
    },
    /**
     * Check if item is in view.
     *
     * @param {HTMLElement} elem
     * @return {boolean}
     */
    isInView(elem: HTMLElement) {
      const viewportOffset = elem.getBoundingClientRect();

      return (
        viewportOffset.top < window.innerHeight && viewportOffset.bottom > 0
      );
    },
    /**
     * Set item as selected in store.
     */
    select() {
      this.$store.commit('select', this.item.id);
    },
    /**
     * Set item as unselected in store.
     */
    unselect() {
      this.$store.commit('unselect', this.item.id);
    },
    /**
     * Toggle item selection.
     */
    toggleSelect() {
      if (this.selected) {
        this.unselect();
      } else {
        this.select();
      }
    },
    /**
     * Handle item click depending on selection status.
     */
    handleItemClick() {
      if (this.selected) {
        this.unselect();
      } else if (this.$store.state.selected.length) {
        this.select();
      } else {
        this.$router.push({ name: 'viewer', params: { id: this.item.id } });
      }
    },
  },
});
</script>

<style lang="scss">
.item {
  position: relative;
  margin: 5px;
  width: 100px;
  height: 100px;
  transition: transform 0.2s ease;
  cursor: pointer;
  background-size: cover;
  background: $secondary-color;

  .selected {
    background: none;
  }

  &.lazy {
    .image {
      background-image: none !important;
    }
  }
}

.item-checkbox {
  position: absolute;
  height: 100%;
  width: 100%;
  color: white;
  padding: 10px;
}

.item:hover .item-checkbox {
  display: block;
}

.selected {
  color: $accent-color !important;
}

.selected .item-checkbox {
  display: block;
  color: $accent-color !important;
}

.image {
  position: absolute;
  height: 100%;
  width: 100%;
  transition: transform 0.25s;
  background-repeat: no-repeat;
}

.item.selected .image {
  transform: scale(0.95);
}

.item-checkbox-checkmark {
  fill: #fff;
  fill-opacity: 0.54;
  display: none;
}

.item:hover .item-checkbox-checkmark {
  display: block;
}

.item-checkbox-checkmark:hover:not(.item-checkbox-blue),
.item-checkbox-white {
  fill: #fff;
  fill-opacity: 1;
}

.item-checkbox-blue {
  fill: $accent-color;
  fill-opacity: 1;
  display: block;
}

.item-overlay {
  position: absolute;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  transition: transform 0.25s;
  display: none;
}

.selected {
  fill: $accent-color;
  fill-opacity: 1;

  .item-overlay {
    display: block;
  }
}

.item-checkbox svg {
  position: absolute;
}

.item-checkbox-outline {
  fill: currentColor;
  fill-opacity: 0.54;
}

.item-checkbox-shine {
  stroke: $accent-color;
  fill: none;
}

.duration {
  position: absolute;
  top: 15px;
  right: 15px;
  color: white;

  span {
    display: inline-block;
    margin-right: 5px;
  }
}
</style>
