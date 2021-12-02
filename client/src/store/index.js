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
    setCastAppId(state, id) {
      state.castAppId = id;
    },
  },
});

export default store;
