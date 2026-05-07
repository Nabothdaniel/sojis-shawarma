import apiClient from './client';

export const biometricService = {
  isSupported: () => {
    return typeof window !== 'undefined' && 
           window.isSecureContext && 
           !!navigator.credentials && 
           !!window.PublicKeyCredential;
  },

  async register(userId: string, email: string) {
    if (!this.isSupported()) throw new Error('Biometrics not supported on this device/browser');

    // 1. Get challenge from backend
    const challengeRes: any = await apiClient.post('/auth/biometric/challenge', { userId });
    
    // 2. Create credential
    const options: PublicKeyCredentialCreationOptions = {
      challenge: Uint8Array.from(atob(challengeRes.challenge), c => c.charCodeAt(0)),
      rp: { name: "Soji's Shawarma Spot", id: window.location.hostname },
      user: {
        id: Uint8Array.from(userId, c => c.charCodeAt(0)),
        name: email,
        displayName: email.split('@')[0],
      },
      pubKeyCredParams: [{ alg: -7, type: "public-key" }], // ES256
      authenticatorSelection: { userVerification: "required" },
      timeout: 60000,
    };

    const credential: any = await navigator.credentials.create({ publicKey: options });
    
    // 3. Send back to server
    return apiClient.post('/auth/biometric/register', {
      credentialId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
      publicKey: btoa(String.fromCharCode(...new Uint8Array(credential.response.getPublicKey()))),
    });
  },

  async login() {
    if (!this.isSupported()) throw new Error('Biometrics not supported');

    // 1. Get challenge
    const challengeRes: any = await apiClient.post('/auth/biometric/login-challenge');
    
    // 2. Get assertion
    const options: PublicKeyCredentialRequestOptions = {
      challenge: Uint8Array.from(atob(challengeRes.challenge), c => c.charCodeAt(0)),
      allowCredentials: challengeRes.allowedIds.map((id: string) => ({
        id: Uint8Array.from(atob(id), c => c.charCodeAt(0)),
        type: 'public-key'
      })),
      userVerification: "required",
      timeout: 60000,
    };

    const assertion: any = await navigator.credentials.get({ publicKey: options });

    // 3. Verify on server
    return apiClient.post('/auth/biometric/verify', {
      credentialId: btoa(String.fromCharCode(...new Uint8Array(assertion.rawId))),
      clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(assertion.response.clientDataJSON))),
      authenticatorData: btoa(String.fromCharCode(...new Uint8Array(assertion.response.authenticatorData))),
      signature: btoa(String.fromCharCode(...new Uint8Array(assertion.response.signature))),
    });
  }
};
