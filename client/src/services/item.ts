import Item from '@/models/item';
import axios from './http';
import store from '@/store';
import { AxiosProgressEvent } from 'axios';

class ItemService {
  /**
   * Fetch all items.
   *
   * @param {boolean} force
   * @returns {Array}
   */
  async getAll(force?: boolean) {
    if (!force && store.state.items.length !== 0) {
      // Return cached items
      return store.state.items;
    } else {
      try {
        // Fetch items from server
        const res = await axios.get('/item');

        // Prepare items
        const items = res.data.items.map((item: Item) => ({
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
   * @param {string[]} ids
   */
  async remove(ids: string[]) {
    try {
      // Fetch items from server
      await axios.delete('/item', { data: { ids } });

      return null;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async upload(
    formData: FormData,
    progressCallback: (progress: AxiosProgressEvent) => void
  ) {
    return await axios.post('/item/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: progressCallback,
    });
  }

  /**
   * Download item(s)
   *
   * @param {string[]} ids
   */
  async download(ids: string[]) {
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

const itemService = new ItemService();
export default itemService;
