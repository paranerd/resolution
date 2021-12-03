import axios from '@/services/axios.js';
import store from '@/store';

class ItemService {
  /**
   * Fetch all items.
   *
   * @param {boolean} force
   * @returns {Array}
   */
  async getAll(force) {
    if (!force && !store.state.items.length == 0) {
      // Return cached items
      return store.state.items;
    } else {
      try {
        // Fetch items from server
        const res = await axios.get('/item');

        // Prepare items
        const items = res.data.items.map((item) => ({
          ...item,
          uiWidth: 0,
          uiHeight: 0,
        }));

        // Cache items in store
        store.commit('setItems', items);

        return items;
      } catch (err) {
        return [];
      }
    }
  }

  /**
   * Delete item(s).
   *
   * @param {Array<String>} ids
   */
  async remove(ids) {
    console.log('removing', ids);
    try {
      // Fetch items from server
      const res = await axios.delete('/item', { data: { ids } });
      console.log(res);

      return null;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  /**
   * Download item(s)
   *
   * @param {Array<String>} ids
   */
  async download(ids) {
    const params = new URLSearchParams();
    ids.forEach((id) => params.append('ids', id));

    const res = await axios.get('/item/download', {
      responseType: 'blob',
      params,
    });

    // Create link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(res.data);

    // Set filename
    const filename = res.headers['content-disposition'].split('"')[1];
    link.download = filename;

    // Clean up
    link.remove();

    // Initialize download
    link.click();
  }
}

export default new ItemService();
