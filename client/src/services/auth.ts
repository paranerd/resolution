import TokenService from './token';
import axios from './http';

class AuthService {
  /**
   * Remove access token both locally and remotely.
   */
  async logout() {
    try {
      // Remove refresh token from server
      await axios.post('/auth/logout');
    } catch (err) {
      console.error(err);
    } finally {
      // Remove tokens locally
      TokenService.removeToken();
    }
  }

  /**
   * Request new tokens.
   * Axios interceptor handles storing the tokens.
   */
  async renewToken() {
    await axios.post('/auth/refresh');
  }
}

const authService = new AuthService();
export default authService;
