export const biometricService = {
  isSupported: () => {
    // Disabled pending Firebase Cloud Functions deployment for secure WebAuthn
    return false;
  },

  async register(userId: string, email: string) {
    throw new Error('Biometric registration is disabled pending Firebase Cloud Functions deployment.');
  },

  async login() {
    throw new Error('Biometric login is disabled pending Firebase Cloud Functions deployment.');
  },

  async removeBiometrics() {
    return { status: 'success', message: 'Biometrics removed locally' };
  }
};
