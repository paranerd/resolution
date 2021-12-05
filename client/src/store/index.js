import { createStore } from 'vuex';

function compare(key, order) {
  return (a, b) => {
    if (a[key] < b[key]) {
      return -1 * order;
    }
    if (a[key] > b[key]) {
      return 1 * order;
    }
    return 0;
  };
}

const store = createStore({
  state() {
    return {
      selected: [],
      items: [],
      castAppId: '',
      sortBy: 'created',
      sortOrder: -1,
    };
  },
  mutations: {
    /**
     * Set items.
     *
     * @param {object} state
     * @param {Array} items
     */
    setItems(state, items) {
      state.items = items;
    },
    /**
     * Add items to existing set.
     *
     * @param {object} state
     * @param {Array} items
     */
    addItems(state, items) {
      state.items = [...state.items, ...items].sort(
        compare(state.sortBy, state.sortOrder)
      );
    },
    /**
     * Remove items.
     *
     * @param {object} state
     * @param {Array<String>} ids
     */
    removeItems(state, ids) {
      state.items = state.items
        .filter((item) => !ids.includes(item.id))
        .sort(compare(state.sortBy, state.sortOrder));
    },
    /**
     * Set item as selected.
     *
     * @param {object} state
     * @param {String} itemId
     */
    select(state, itemId) {
      state.selected.push(itemId);
    },
    /**
     * Set item as unselected.
     *
     * @param {object} state
     * @param {String} itemId
     */
    unselect(state, itemId = null) {
      if (itemId) {
        state.selected = state.selected.filter((id) => id !== itemId);
      } else {
        state.selected = [];
      }
    },
    /**
     * Set Cast App ID.
     *
     * @param {object} state
     * @param {String} id
     */
    setCastAppId(state, id) {
      state.castAppId = id;
    },
  },
});

export default store;
