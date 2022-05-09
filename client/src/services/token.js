import AuthService from '@/services/auth';

class TokenService {
  static tokenKey = 'jwt';
  static refreshTokenKey = 'jwt_refresh';
  static prefetchWindowSec = 5 * 60;

  /**
   * Construtor.
   */
  constructor() {
    this.expires = this.getExpiration();
  }
  /**
   * Return refresh token from localStorage.
   *
   * @returns {string}
   */
  getRefreshToken() {
    return localStorage.getItem(TokenService.refreshTokenKey);
  }

  /**
   * Return access token from localStorage.
   * Renew tokens if expired.
   *
   * @param {boolean} prefetch
   * @returns {string}
   */
  async getToken(prefetch = true) {
    if (
      prefetch &&
      this.expires &&
      this.expires - TokenService.prefetchWindowSec < Date.now() / 1000
    ) {
      try {
        await AuthService.renewToken();
      } catch (err) {
        console.error('Token refresh failed');
      }
    }

    return localStorage.getItem(TokenService.tokenKey);
  }

  /**
   * Update refresh token in localStorage.
   *
   * @param {string} token
   */
  updateRefreshToken(token) {
    localStorage.setItem(TokenService.refreshTokenKey, token);
  }

  /**
   * Update access token in localStorage.
   *
   * @param {string} token
   */
  updateToken(token) {
    // Update token in localStorage
    localStorage.setItem(TokenService.tokenKey, token);

    // Update expiration
    this.expires = this.getExpiration();
  }

  /**
   * Remove all tokens from localStorage.
   */
  removeToken() {
    localStorage.removeItem(TokenService.tokenKey);
    localStorage.removeItem(TokenService.refreshTokenKey);
  }

  /**
   * Get expiration time (sec) of access token.
   *
   * @returns {number}
   */
  getExpiration() {
    try {
      const token = localStorage.getItem(TokenService.tokenKey);

      return this.getPayload(token).exp;
    } catch (err) {
      return null;
    }
  }

  /**
   * Parse token payload
   *
   * @param {string} token
   * @returns {string}
   */
  getPayload(token) {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (err) {
      return null;
    }
  }
}

export default new TokenService();
