import axios from './http';
import store from '@/store';

class SystemService {
  /**
   * Get Cast App Id.
   *
   * @returns {String}
   */
  async getCastAppId() {
    if (store.state.castAppId) {
      // Return cached id
      return store.state.castAppId;
    } else {
      try {
        // Fetch items from server
        const res = await axios.get('/system/cast-app-id');

        // Extract Cast App ID
        const castAppId = res.data.castAppId;

        // Cache Cast App ID in store
        store.commit('setCastAppId', castAppId);

        return castAppId;
      } catch (err) {
        return '';
      }
    }
  }
}

const systemService = new SystemService();
export default systemService;
