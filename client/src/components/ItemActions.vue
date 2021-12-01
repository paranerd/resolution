<template>
  <div class="container" v-if="selectedCount">
    <button @click="close">
      <font-awesome-icon icon="times" />
    </button>
    <span class="selected-count">{{ selectedCount }} selected</span>
    <button @click="download">
      <font-awesome-icon icon="download" />
    </button>
    <button @click="remove">
      <font-awesome-icon icon="trash" />
    </button>
  </div>
</template>

<script>
import ItemService from '@/services/item';

export default {
  computed: {
    selectedCount() {
      return this.$store.state.selected.length;
    },
  },
  methods: {
    close() {
      this.$store.commit('unselect');
    },
    download() {
      ItemService.download(this.$store.state.selected);
    },
    async remove() {
      await ItemService.remove(this.$store.state.selected);
    },
  },
};
</script>

<style lang="scss" scoped>
.container {
  position: absolute;
  bottom: 50px;
  right: 100px;
  padding: 1rem 0.5rem;
  height: 60px;
  background: $accent-color;
  border-radius: 0.25rem;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
}

button {
  height: 50px;
  width: 50px;
  border-radius: 50px;

  &:hover {
    background: rgba(0, 0, 0, 0.25);
  }
}

.selected-count {
  margin: 0 0.5rem;
  font-family: roboto;
}
</style>
