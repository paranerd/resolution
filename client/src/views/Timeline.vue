<template>
  <Navbar />
  <div id="timeline">
    <Item
      v-for="item in itemsFinal"
      :key="item.id"
      :id="item.id"
      :width="item.uiWidth"
      :height="item.uiHeight"
    />
  </div>
</template>

<script>
import Navbar from '@/components/Navbar.vue';
import Item from '@/components/Item.vue';
import axios from '@/services/axios.js';

export default {
  name: 'Timeline',
  components: {
    Item,
    Navbar,
  },
  data() {
    return {
      items: [],
      itemsFinal: [],
      error: null,
      totalResults: 0,
      loading: false,
      currentLoadJobTimestamp: null,
      selectedCount: 0,
      latestResizeTimestamp: 0,
    };
  },
  created() {
    this.fetchItems(true);
    //axios.get('/user/refresh');
  },
  mounted() {
    this.$nextTick(function () {
      window.addEventListener('resize', this.handleResize);
    });
  },
  methods: {
    handleResize() {
      const resizeTimestamp = Date.now();
      this.latestResizeTimestamp = resizeTimestamp;

      setTimeout(() => {
        if (this.latestResizeTimestamp == resizeTimestamp) {
          this.calculateGallery();
        }
      }, 100);
    },
    async fetchItems(force) {
      // Reset
      this.error = '';

      // Show progress indicator
      this.loading = true;

      try {
        if (!force) {
          this.items = []; //this.stateService.items;
        } else {
          const res = await axios.get(`${process.env.VUE_APP_API_URL}/item`);
          this.items = res.data.items.map((item) => ({
            ...item,
            uiWidth: 0,
            uiHeight: 0,
          }));
          this.$store.commit('setItems', this.items);
        }

        this.calculateGallery();
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
          item.uiWidth = item.scaledUpWidth * scale;
          item.uiHeight = rowHeight;
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
      /*this.itemsFinal.forEach((item) => {
        item.url = `${environment.apiUrl}/item/${item.id}?w=${item.uiWidth}&h=${item.uiHeight}`;
      });*/

      setTimeout(() => {
        this.lazyload();
      }, 100);
    },
    lazyload() {
      const loadJobTimestamp = Date.now();
      this.currentLoadJobTimestamp = loadJobTimestamp;

      setTimeout(() => {
        if (this.currentLoadJobTimestamp == loadJobTimestamp) {
          const items = document.querySelectorAll('#gallery .item .image');

          items.forEach((item) => {
            if (this.isInView(item)) {
              item.classList.remove('lazy');
            }
          });
        }
      }, 100);
    },
  },
};
</script>

<style lang="scss">
#timeline {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  flex-wrap: wrap;
  flex: 1;
}
</style>
