<template>
  <a
    class="item"
    ref="item"
    :class="{ selected, lazy }"
    v-bind:style="{ height: height + 'px', width: width + 'px' }"
    @click="handleItemClick()"
  >
    <!-- Image -->
    <div
      class="image"
      v-bind:style="{ 'background-image': 'url(' + url + ')' }"
    ></div>

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

<script>
export default {
  props: ['id', 'width', 'height'],
  data() {
    return {
      selected: false,
      selectedCount: 0,
      lazy: true,
      lazyLoadWait: 100,
      currentLoadJobTimestamp: null,
    };
  },
  computed: {
    url: function () {
      return `${process.env.VUE_APP_API_URL}/item/${this.id}?w=${this.width}&h=${this.height}`;
    },
  },
  created() {
    document.addEventListener('scroll', this.lazyload);
    this.lazyload();
  },
  unmounted() {
    document.removeEventListener('scroll', this.lazyload);
  },
  methods: {
    lazyload() {
      const loadJobTimestamp = Date.now();
      this.currentLoadJobTimestamp = loadJobTimestamp;

      setTimeout(() => {
        if (this.currentLoadJobTimestamp == loadJobTimestamp) {
          const item = this.$refs.item;

          if (this.isInView(item)) {
            this.lazy = false;
          }
        }
      }, this.lazyLoadWait);
    },
    isInView(elem) {
      const viewportOffset = elem.getBoundingClientRect();

      return (
        viewportOffset.top < window.innerHeight && viewportOffset.bottom > 0
      );
    },
    select() {
      this.selected = true;
    },
    unselect() {
      this.selected = false;
    },
    toggleSelect() {
      this.selected = !this.selected;
    },
    handleItemClick() {
      if (this.selected) {
        this.unselect();
      } else if (this.countSelected()) {
        this.select();
      } else {
        this.$router.push({ name: 'viewer', params: { id: this.id } });
      }
    },
    countSelected() {
      return document.querySelectorAll('.item.selected').length;
    },
  },
};
</script>

<style lang="scss">
.item {
  position: relative;
  margin: 5px;
  width: 100px;
  height: 100px;
  transition: transform 0.2s ease;
  cursor: pointer;

  &.lazy {
    .image {
      background: $secondary-color;
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

.item.selected .image,
.item.selected .item-overlay {
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
  background: rgba(0, 0, 0, 0.5);
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
</style>
