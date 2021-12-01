<template>
  <div class="wrapper">
    <Navbar />
    <div id="timeline" ref="timeline">
      <div class="no-items" v-if="items.length === 0">
        <span>Nothing to display</span>
        <font-awesome-icon icon="ghost" />
      </div>
      <Item
        v-for="item in itemsFinal"
        :key="item.id"
        :id="item.id"
        :width="item.uiWidth"
        :height="item.uiHeight"
        :ref="setItemRef"
      />
    </div>
  </div>
  <ItemActions />
</template>

<script>
import Navbar from '@/components/Navbar.vue';
import ItemActions from '@/components/ItemActions.vue';
import Item from '@/components/Item.vue';
import ItemService from '@/services/item';

export default {
  name: 'Timeline',
  components: {
    Item,
    Navbar,
    ItemActions,
  },
  data() {
    return {
      items: [],
      itemsFinal: [],
      error: null,
      totalResults: 0,
      loading: false,
      selectedCount: 0,
      latestResizeTimestamp: 0,
      lazyLoadWait: 100,
      currentLoadJobTimestamp: null,
      itemRefs: [],
    };
  },
  async created() {
    this.items = await this.fetchItems();
    this.calculateGallery();
  },
  mounted() {
    this.$nextTick(function () {
      window.addEventListener('resize', this.handleResize);
      this.$refs.timeline.addEventListener('scroll', this.lazyload);
    });
  },
  beforeUnmount() {
    this.$refs.timeline.removeEventListener('scroll', this.lazyload);
  },
  methods: {
    setItemRef(el) {
      if (el) {
        this.itemRefs.push(el);
      }
    },
    lazyload() {
      const loadJobTimestamp = Date.now();
      this.currentLoadJobTimestamp = loadJobTimestamp;

      setTimeout(async () => {
        if (this.currentLoadJobTimestamp == loadJobTimestamp) {
          this.itemRefs.forEach((item) => item.lazyload());
        }
      }, this.lazyLoadWait);
    },
    handleResize() {
      const resizeTimestamp = Date.now();
      this.latestResizeTimestamp = resizeTimestamp;

      setTimeout(() => {
        if (this.latestResizeTimestamp == resizeTimestamp) {
          this.calculateGallery();
        }
      }, 100);
    },
    async fetchItems() {
      // Reset
      this.error = '';

      // Show progress indicator
      this.loading = true;

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
        this.loading = false;
      }
    },
    /**
     * Calculate the number of pixels that are horizontally added to an .item div.
     * This is done dynamically, since .item margins are set using rem.
     *
     * @returns number
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
     * Calculate the total available width.
     *
     * @returns number
     */
    getTotalWidth() {
      const timeline = document.getElementById('timeline');
      const style = getComputedStyle(timeline);

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
      const totalWidth = this.getTotalWidth();
      const horizontalMargin = this.getHorizontalMargin();

      const minHeight = 300;
      const maxHeight = 550;

      let itemsFinal = [];
      let itemsForRow = [];

      for (const item of this.items) {
        // Add image to row
        itemsForRow.push(item);

        // Calculate the remaining width available in the current row
        // Subtract 20px for the scrollbar
        const availableWidth =
          totalWidth - itemsForRow.length * horizontalMargin - 20;

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
          item.uiWidth = Math.ceil(item.scaledUpWidth * scale);
          item.uiHeight = Math.ceil(rowHeight);
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
  },
};
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
