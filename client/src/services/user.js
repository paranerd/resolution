import TokenService from './token';
import axios from './axios';

class UserService {
  /**
   * Remove access token both locally and remotely.
   */
  async logout() {
    // Remove refresh token from server
    await axios.post('/user/logout');

    // Remove tokens locally
    TokenService.removeToken();
  }

  /**
   * Request new tokens.
   * Axios interceptor handles storing the tokens.
   */
  async renewToken() {
    await axios.post('/user/refresh');
  }
}

export default new UserService();
