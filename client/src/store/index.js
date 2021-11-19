import { createStore } from 'vuex';

const store = createStore({
  state() {
    return {
      count: 0,
      items: [],
    };
  },
  mutations: {
    setItems(state, items) {
      state.items = items;
    },
  },
});

export default store;
