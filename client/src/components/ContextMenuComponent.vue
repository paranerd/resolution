<template>
  <!-- Backdrop -->
  <button v-if="show" @click="close" tabindex="-1" class="backdrop"></button>

  <!-- Dropdown menu -->
  <div class="dropdown" v-if="show">
    <div
      v-for="action in actions"
      :key="action.title"
      class="dropdown-item"
      @click="action.callback"
    >
      <font-awesome-icon :icon="action.icon" />
      <span>{{ action.title }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  props: ['actions', 'show'],
  emits: ['update:show'],
  data() {
    return {
      escapeListener: (e: KeyboardEvent) => {
      if (e.key == 'Escape') {
        this.$emit('update:show', false);
      }
    },
    };
  },
  created() {
    document.addEventListener('keydown',this.escapeListener);
  },
  unmounted() {
    document.removeEventListener('keydown', this.escapeListener);
  },
  methods: {
    close() {
      this.$emit('update:show', false);
    },
  },
});
</script>

<style lang="scss" scoped>
.dropdown {
  position: absolute;
  top: 100%;
  padding: 0.25rem 0;
  right: 0;
  width: 12rem;
  border-radius: 0.25rem;
  color: $text-color;
  background: $secondary-color;
  z-index: 2;
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
  z-index: 1;
}
</style>
