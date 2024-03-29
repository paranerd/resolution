<template>
  <div class="wrapper">
    <Navbar />
    <div id="timeline" ref="timeline">
      <div class="no-items" v-if="itemsFinal.length === 0">
        <span>Nothing to display</span>
        <font-awesome-icon icon="ghost" />
      </div>
      <Item
        v-for="item in itemsFinal"
        :key="item.id"
        :ref="setItemRef"
        :item="item"
      />
    </div>
  </div>
  <ItemActions />
  <UploadStatus />
</template>

<script lang="ts">
import Navbar from '@/components/NavbarComponent.vue';
import ItemActions from '@/components/ItemActionsComponent.vue';
import UploadStatus from '@/components/UploadStatusComponent.vue';
import Item from '@/components/ItemComponent.vue';
import itemService from '@/services/item';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'TimelineView',
  components: {
    Item,
    Navbar,
    ItemActions,
    UploadStatus,
  },
  data() {
    return {
      itemsFinal: [] as typeof Item[],
      error: '',
      totalResults: 0,
      loading: false,
      selectedCount: 0,
      latestResizeTimestamp: 0,
      lazyLoadWait: 100,
      currentLoadJobTimestamp: 0,
      itemRefs: [] as typeof Item[],
    };
  },
  computed: {
    items() {
      return this.$store.state.items;
    },
  },
  watch: {
    items() {
      this.calculateGallery();
      this.lazyload();
    },
  },
  async created() {
    await this.fetchItems();
    this.calculateGallery();
  },
  mounted() {
    this.$nextTick(function () {
      window.addEventListener('resize', this.handleResize);
      (this.$refs.timeline as HTMLElement).addEventListener('scroll', this.lazyload);
    });
  },
  beforeUnmount() {
    (this.$refs.timeline as HTMLElement).removeEventListener('scroll', this.lazyload);
  },
  methods: {
    /**
     * Store references to all items.
     *
     * @param {Item} el
     */
    setItemRef(el: any) {
      if (el) {
        this.itemRefs.push(el);
      }
    },
    /**
     * Trigger item load after scroll ended.
     */
    lazyload() {
      const loadJobTimestamp = Date.now();
      this.currentLoadJobTimestamp = loadJobTimestamp;

      setTimeout(async () => {
        if (this.currentLoadJobTimestamp == loadJobTimestamp) {
          this.itemRefs.forEach((item) => item.lazyload());
        }
      }, this.lazyLoadWait);
    },
    /**
     * Recalculate gallery on resize.
     */
    handleResize() {
      const resizeTimestamp = Date.now();
      this.latestResizeTimestamp = resizeTimestamp;

      setTimeout(() => {
        if (this.latestResizeTimestamp == resizeTimestamp) {
          this.calculateGallery();
        }
      }, 100);
    },
    /**
     * Fetch all items metadata.
     */
    async fetchItems() {
      // Reset
      this.error = '';

      // Show progress indicator
      this.loading = true;

      try {
        await itemService.getAll();
      } catch (err: unknown) {
        const e = err as { status: number; error: string };
        console.error(err);
        this.error = e.status != 0 && e.status < 500 ? e.error : 'Something went wrong...';
        this.totalResults = 0;
      } finally {
        this.loading = false;
      }
    },
    /**
     * Calculate the number of pixels that are horizontally added to an .item div.
     * This is done dynamically, since .item margins are set using rem.
     *
     * @returns {number}
     */
    getHorizontalMargin() {
      const div = document.createElement('div');
      div.classList.add('item');
      document.body.appendChild(div);

      const style = getComputedStyle(div);
      const margin = parseInt(style.marginLeft) + parseInt(style.marginRight);

      const outerWidth = div.offsetWidth + margin;
      const innerWidth = parseInt(style.width);

      document.body.removeChild(div);

      return outerWidth - innerWidth;
    },
    /**
     * Calculate timeline's total available width.
     *
     * @returns {number}
     */
    getTimelineWidth() {
      const style = getComputedStyle((this.$refs.timeline as HTMLElement));

      return parseInt(style.width);
    },
    /**
     * Scale items to align in the gallery.
     * This takes 3 steps:
     * (1) Determine the width of all items scaled up to the largest height
     * (2) Based on that new total width determine the factor by which to
     *     scale down to reach the available gallery width
     * (3) Scale down further if the maximum row height is exceeded
     */
    calculateGallery() {
      const timelineRealWidth =
        this.getTimelineWidth() - this.getScrollbarWidth();
      const horizontalMargin = this.getHorizontalMargin();

      const minHeight = 300;
      const maxHeight = 550;

      let itemsFinal: typeof Item[] = []; //IItem[] = [];
      let itemsForRow = [];

      for (const item of this.items) {
        // Add image to row
        itemsForRow.push(item);

        // Calculate the remaining width available in the current row
        // Subtract space for scrollbar
        const availableWidth =
          timelineRealWidth - itemsForRow.length * horizontalMargin;

        // Get height of largest item
        const largestHeight = itemsForRow
          .map((item) => item.height)
          .reduce((p, v) => {
            return p > v ? p : v;
          });

        // Scale up item width to match largest height
        itemsForRow.forEach(
          (item) =>
            (item.scaledUpWidth = item.width * (largestHeight / item.height))
        );

        // Calculate total width of scaled up items
        const totalScaledUpWidth = itemsForRow
          .map((item) => item.scaledUpWidth)
          .reduce((acc, curr) => acc + curr);

        // Scale down that total width to the available width
        // But also make sure that the height does not exceed MaxHeight
        const scale = Math.min(
          availableWidth / totalScaledUpWidth,
          maxHeight / largestHeight,
          1
        );

        // Calculate rowHeight so we don't have to do it for each item
        const rowHeight = largestHeight * scale;

        // Set the actual widths and heights to be displayed
        itemsForRow.forEach((item) => {
          item.uiWidth = Math.floor(item.scaledUpWidth * scale);
          item.uiHeight = Math.floor(rowHeight);
        });

        // Once the number of items in the row is so large
        // that the height of the row is too small,
        // consider the row done.
        if (rowHeight < minHeight) {
          itemsFinal = itemsFinal.concat(itemsForRow);

          itemsForRow = [];
        }
      }

      this.itemsFinal = itemsFinal.concat(itemsForRow);
    },
    /**
     * Determine width of scrollbar.
     *
     * @return {number}
     */
    getScrollbarWidth() {
      // Create invisible container
      const outer = document.createElement('div');
      outer.style.visibility = 'hidden';
      // Force scrollbar to appear
      outer.style.overflow = 'scroll';
      document.body.appendChild(outer);

      // Create inner element and place it in the container
      const inner = document.createElement('div');
      outer.appendChild(inner);

      // Calculate difference between container's full width and the child width
      const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;

      // Remove temporary elements from the DOM
      outer.parentNode?.removeChild(outer);

      return scrollbarWidth;
    },
  },
});
</script>

<style lang="scss" scoped>
.wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

#timeline {
  overflow: auto;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  flex-wrap: wrap;
  flex: 1;
}

.no-items {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: $text-color;
  font-family: roboto-500;
  font-size: 2rem;

  span {
    margin-right: 1rem;
  }
}
</style>
