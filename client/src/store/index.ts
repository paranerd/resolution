import Item from '@/models/item';
import { createStore } from 'vuex';

export interface UploadStatus {
  thumbnail: string;
  filename: string;
  progress: number;
  current: number;
  total: number;
}

export interface State {
  selected: string[];
  items: Item[];
  castAppId: string;
  sortBy: string;
  sortOrder: number;
  upload: UploadStatus;
}

function compare(key: string, order: number) {
  return (a: Item, b: Item) => {
    if (a[key] < b[key]) {
      return -1 * order;
    }
    if (a[key] > b[key]) {
      return 1 * order;
    }
    return 0;
  };
}

const store = createStore<State>({
  /*state() {
    return {
      selected: [] as Item[],
      items: [] as Item[],
      castAppId: '',
      sortBy: 'created',
      sortOrder: -1,
      upload: {
        thumbnail: '',
        filename: '',
        progress: 0,
        current: 0,
        total: 0,
      },
    };
  },*/
  state: {
    selected: [] as string[],
    items: [] as Item[],
    castAppId: '',
    sortBy: 'created',
    sortOrder: -1,
    upload: {
      thumbnail: '',
      filename: '',
      progress: 0,
      current: 0,
      total: 0,
    },
  },
  mutations: {
    updateUploadStatus(state: State, status: UploadStatus) {
      state.upload = { ...state.upload, ...status };
    },
    /**
     * Set items.
     *
     * @param {State} state
     * @param {Item[]} items
     */
    setItems(state: State, items: Item[]) {
      state.items = items;
    },
    /**
     * Add items to existing set.
     *
     * @param {State} state
     * @param {Item[]} items
     */
    addItems(state: State, items: Item[]) {
      state.items = [...state.items, ...items].sort(
        compare(state.sortBy, state.sortOrder)
      );
    },
    /**
     * Remove items.
     *
     * @param {State} state
     * @param {string[]} ids
     */
    removeItems(state: State, ids: string[]) {
      state.items = state.items
        .filter((item) => !ids.includes(item.id))
        .sort(compare(state.sortBy, state.sortOrder));

      state.selected = state.selected.filter((id) => !ids.includes(id));
    },
    /**
     * Set item as selected.
     *
     * @param {State} state
     * @param {string} itemId
     */
    select(state: State, itemId: string) {
      state.selected.push(itemId);
    },
    /**
     * Set item as unselected.
     *
     * @param {State} state
     * @param {string} itemId
     */
    unselect(state: State, itemId?: string) {
      if (itemId) {
        state.selected = state.selected.filter((id) => id !== itemId);
      } else {
        state.selected = [];
      }
    },
    /**
     * Set Cast App ID.
     *
     * @param {State} state
     * @param {string} id
     */
    setCastAppId(state: State, id: string) {
      state.castAppId = id;
    },
  },
  getters: {
    uploadStatus: (state: State) => {
      return state.upload;
    },
  },
});

export default store;
