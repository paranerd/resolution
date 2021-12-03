import { createStore } from 'vuex';

const store = createStore({
  state() {
    return {
      selected: [],
      items: [],
      castAppId: '',
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
      state.items = [...state.items, ...items];
    },
    /**
     * Remove items.
     *
     * @param {object} state
     * @param {Array<String>} ids
     */
    removeItems(state, ids) {
      state.items = state.items.filter((item) => !ids.includes(item.id));
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
