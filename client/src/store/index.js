import { createStore } from 'vuex';

const store = createStore({
  state() {
    return {
      selected: [],
      items: [],
    };
  },
  mutations: {
    setItems(state, items) {
      state.items = items;
    },
    select(state, itemId) {
      state.selected.push(itemId);
    },
    unselect(state, itemId = null) {
      if (itemId) {
        state.selected = state.selected.filter((id) => id !== itemId);
      } else {
        state.selected = [];
      }
    },
  },
});

export default store;
