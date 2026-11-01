/**
 * Auth Service Scaffold
 * 
 * TODO [Phase 2]: Implement register, login, refresh token rotation, and password comparison.
 */
export const authService = {
  async registerUser({ name, email, password }) {
    // TODO: Hash password with bcryptjs and create user document
    throw new Error('Register user feature pending implementation in Phase 2');
  },

  async loginUser({ email, password }) {
    // TODO: Verify credentials and issue access + refresh JWTs
    throw new Error('Login user feature pending implementation in Phase 2');
  },

  async refreshTokens(refreshToken) {
    // TODO: Verify refresh token and return new token pair
    throw new Error('Refresh token feature pending implementation in Phase 2');
  }
};

