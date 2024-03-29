<template>
  <nav>
    <!-- Brand -->
    <div id="brand-container">
      <router-link class="brand" to="/">
        <font-awesome-icon icon="gem" class="brand-icon" />
        <span class="brand-name">Resolution</span>
      </router-link>
    </div>

    <!-- Searchbar -->
    <form id="search-form">
      <button class="search-icon">
        <font-awesome-icon icon="search" />
      </button>
      <input id="search" type="text" placeholder="Suchen..." />
      <button class="clear-search">
        <font-awesome-icon icon="times" />
      </button>
    </form>

    <div class="navbar-right">
      <!-- Search -->
      <button id="search-button" class="navbar-button">
        <font-awesome-icon icon="search" />
      </button>

      <!-- Upload -->
      <button class="navbar-button">
        <font-awesome-icon icon="upload" />
        <Upload />
      </button>

      <!-- User -->
      <button class="navbar-button" @click="showContext = !showContext">
        <font-awesome-icon icon="user-circle" class="fa-2x" />
        <ContextMenu :show="showContext" :actions="contextActions" />
      </button>
    </div>
  </nav>
</template>

<script lang="ts">
import ContextMenu from '@/components/ContextMenuComponent.vue';
import Upload from '@/components/UploadComponent.vue';
import authService from '@/services/auth';
import itemService from '@/services/item';
import httpService from '@/services/http';
import { defineComponent } from 'vue';

export default defineComponent({
  components: {
    ContextMenu,
    Upload,
  },
  data() {
    return {
      showContext: false,
      contextActions: [
        {
          title: 'Refresh Media',
          callback: this.scan,
          icon: 'sync-alt',
        },
        {
          title: 'Logout',
          callback: this.logout,
          icon: 'power-off',
        },
      ],
    };
  },
  methods: {
    async logout() {
      await authService.logout();
      this.$router.push('login');
    },
    async scan() {
      await httpService.post(`/item/scan`);
      await itemService.getAll(true);
    },
  },
});
</script>

<style lang="scss" scoped>
nav {
  width: 100%;
  height: $navbar-height;
  padding: 0.25rem;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  background: $primary-color;
  color: $text-color;
}

.navbar-button {
  position: relative;
  padding: 0.5rem;
  width: 50px;
  height: 50px;
  border-radius: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  fill: $text-color;

  &:hover {
    background: $secondary-color;
  }

  &:not(:last-child) {
    margin-right: 1rem;
  }

  &.plus-text {
    width: auto;
    border-radius: 5px;
  }

  .button-text {
    font-family: roboto;
    margin-left: 0.75rem;
  }
}

.navbar-shadow {
  box-shadow: 0 4px 2px -2px rgba(0, 0, 0, 0.2);
}

#brand-container {
  width: 250px;
}

#search-form {
  height: 50px;
  max-width: 600px;
  background-color: $secondary-color;
  flex: 1 1 auto;
  display: none;
}

#search {
  width: 100%;
  background: none;
  outline: none;
  font-family: roboto-500;
}

@media (min-width: 1024px) {
  #search-form {
    display: flex;
  }

  #search-button {
    display: none;
  }
}

.search-icon {
  width: 50px;
}

.clear-search {
  width: 50px;
  visibility: hidden;
}

#search:focus + .clear-search {
  visibility: visible;
}

.brand {
  margin-left: 1.25rem;
  font-weight: 600;
  font-size: 1.25rem;
  line-height: 1.75rem;
  letter-spacing: -0.025em;
  display: flex;
  align-items: center;
}

.brand-icon {
  color: $accent-color;
}

.brand-name {
  margin-left: 0.5rem;
}

.navbar-right {
  position: relative;
  margin-left: auto;
  display: flex;
}
</style>
