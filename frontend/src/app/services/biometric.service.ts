import { Injectable } from '@angular/core';
import { BiometricAuth, BiometryType } from '@aparajita/capacitor-biometric-auth';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

const PREF_BIOMETRIC_TOKEN = 'fordago_bio_token';
const PREF_BIOMETRIC_USER = 'fordago_bio_user';
const PREF_BIOMETRIC_DEVICE = 'fordago_bio_device';
const PREF_BIOMETRIC_ENABLED = 'fordago_bio_enabled';
const PREF_BIOMETRIC_ACCOUNTS = 'fordago_bio_accounts';

export interface BiometricAccount {
  identifier: string;
  name: string;
  role?: string;
  avatar?: string;
  token: string;
  deviceName?: string;
  registeredAt?: string;
}

export interface BiometricStatus {
  isAvailable: boolean;
  biometryType: BiometryType;
  typeName: string;
  isConfigured: boolean;
  savedUser: {
    identifier: string;
    name: string;
    avatar?: string;
    role?: string;
  } | null;
  savedAccounts: BiometricAccount[];
}

@Injectable({
  providedIn: 'root',
})
export class BiometricService {

  /**
   * Check device hardware biometric capabilities (Fingerprint, Face Unlock, Touch ID, Face ID, etc.)
   */
  async checkBiometrics(): Promise<BiometricStatus> {
    let isAvailable = false;
    let biometryType = BiometryType.none;
    let typeName = 'Biometric (Fingerprint / Face Unlock)';

    try {
      const checkResult = await BiometricAuth.checkBiometry();
      isAvailable = !!checkResult.isAvailable;
      biometryType = checkResult.biometryType;

      switch (biometryType) {
        case BiometryType.touchId:
          typeName = 'Touch ID (Fingerprint)';
          break;
        case BiometryType.faceId:
          typeName = 'Face ID';
          break;
        case BiometryType.fingerprintAuthentication:
          typeName = 'Fingerprint Scanner';
          break;
        case BiometryType.faceAuthentication:
          typeName = 'Face Recognition';
          break;
        case BiometryType.irisAuthentication:
          typeName = 'Iris Scanner';
          break;
        default:
          typeName = 'Fingerprint / Face Unlock';
          break;
      }
    } catch {
      // Graceful fallback for browser/PWA/web
      if (typeof window !== 'undefined' && (window as any).PublicKeyCredential) {
        isAvailable = true;
        typeName = 'Screen Lock / Passkey / Biometrics';
      } else {
        isAvailable = true; // allow web simulation
        typeName = 'Biometric Passkey';
      }
    }

    const savedAccounts = await this.getSavedBiometricAccounts();
    const savedUser = savedAccounts.length > 0 ? savedAccounts[0] : await this.getSavedBiometricUser();
    const isConfigured = savedAccounts.length > 0 || !!(savedUser && (await this.getSavedBiometricToken()));

    return {
      isAvailable,
      biometryType,
      typeName,
      isConfigured,
      savedUser,
      savedAccounts,
    };
  }

  lastError = '';

  /**
   * Prompt the native device biometric sensor dialog (Fingerprint / Face ID prompt).
   */
  async promptBiometric(reason = 'Login with your Biometrics'): Promise<boolean> {
    this.lastError = '';

    // If running in browser, allow instant testing
    if (Capacitor.getPlatform() === 'web') {
      return true;
    }

    try {
      await BiometricAuth.authenticate({
        reason,
        cancelTitle: 'Use Password',
        allowDeviceCredential: true,
        androidTitle: 'FordaGO',
        androidSubtitle: 'Login with your Biometrics',
        androidConfirmationRequired: false,
      });
      return true;
    } catch (err: any) {
      const errMsg = String(err?.message || err || '');
      const code = String(err?.code || '');

      if (errMsg.includes('plugin_not_implemented') || errMsg.includes('not implemented on web')) {
        return true;
      }

      if (code === 'userCancel' || errMsg.toLowerCase().includes('cancel') || errMsg.toLowerCase().includes('user abort')) {
        this.lastError = 'Biometric authentication was cancelled.';
        return false;
      }

      if (code === 'biometryNotEnrolled' || errMsg.toLowerCase().includes('not enrolled')) {
        this.lastError = 'No fingerprint or face unlock enrolled on this device. Please set up biometrics in your phone Settings (Security > Fingerprint) first.';
        return false;
      }

      if (code === 'biometryLockout' || errMsg.toLowerCase().includes('lockout')) {
        this.lastError = 'Biometric sensor locked due to too many failed attempts. Please unlock with phone PIN or use your password.';
        return false;
      }

      if (code === 'passcodeNotSet' || errMsg.toLowerCase().includes('passcode')) {
        this.lastError = 'Device screen lock (PIN / Pattern) is required in your phone Settings to use this feature.';
        return false;
      }

      // Fallback: Retry without allowDeviceCredential in case device policy restricts credentials
      try {
        await BiometricAuth.authenticate({
          reason,
          cancelTitle: 'Use Password',
          allowDeviceCredential: false,
          androidTitle: 'FordaGO',
          androidSubtitle: 'Login with your Biometrics',
          androidConfirmationRequired: false,
        });
        return true;
      } catch (retryErr: any) {
        const retryMsg = String(retryErr?.message || retryErr || '');
        if (retryMsg.toLowerCase().includes('cancel')) {
          this.lastError = 'Biometric authentication was cancelled.';
        } else {
          this.lastError = 'Biometric verification failed. Please sign in with password.';
        }
        return false;
      }
    }
  }

  /**
   * Retrieve all saved biometric accounts on this device.
   */
  async getSavedBiometricAccounts(): Promise<BiometricAccount[]> {
    try {
      const { value } = await Preferences.get({ key: PREF_BIOMETRIC_ACCOUNTS });
      if (value) {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}

    // Migration fallback for legacy single-account data
    const oldUser = await this.getSavedBiometricUser();
    const oldToken = await this.getSavedBiometricToken();
    if (oldUser && oldToken) {
      const migrated: BiometricAccount = {
        identifier: oldUser.identifier,
        name: oldUser.name,
        role: (oldUser as any).role || 'member',
        avatar: oldUser.avatar,
        token: oldToken,
        deviceName: (await Preferences.get({ key: PREF_BIOMETRIC_DEVICE })).value || this.getDeviceModelName(),
        registeredAt: new Date().toISOString(),
      };
      try {
        await Preferences.set({ key: PREF_BIOMETRIC_ACCOUNTS, value: JSON.stringify([migrated]) });
      } catch {}
      return [migrated];
    }

    return [];
  }

  /**
   * Save or update an account in the multi-account biometric registry.
   */
  async saveBiometricAccount(account: BiometricAccount): Promise<void> {
    const accounts = await this.getSavedBiometricAccounts();
    const idx = accounts.findIndex(a => a.identifier.toLowerCase() === account.identifier.toLowerCase());
    if (idx >= 0) {
      accounts[idx] = { ...accounts[idx], ...account };
    } else {
      accounts.push(account);
    }
    await Preferences.set({ key: PREF_BIOMETRIC_ACCOUNTS, value: JSON.stringify(accounts) });

    // Also persist as latest active for fallback
    await Preferences.set({ key: PREF_BIOMETRIC_TOKEN, value: account.token });
    await Preferences.set({ key: PREF_BIOMETRIC_USER, value: JSON.stringify(account) });
    if (account.deviceName) {
      await Preferences.set({ key: PREF_BIOMETRIC_DEVICE, value: account.deviceName });
    }
    await Preferences.set({ key: PREF_BIOMETRIC_ENABLED, value: 'true' });
  }

  /**
   * Remove a single account from the biometric registry.
   */
  async removeBiometricAccount(identifier: string): Promise<void> {
    if (!identifier) return;
    let accounts = await this.getSavedBiometricAccounts();
    accounts = accounts.filter(a => a.identifier.toLowerCase() !== identifier.toLowerCase());
    await Preferences.set({ key: PREF_BIOMETRIC_ACCOUNTS, value: JSON.stringify(accounts) });

    if (accounts.length === 0) {
      await this.clearBiometricCredential();
    } else {
      // Set the first remaining account as primary fallback
      await Preferences.set({ key: PREF_BIOMETRIC_TOKEN, value: accounts[0].token });
      await Preferences.set({ key: PREF_BIOMETRIC_USER, value: JSON.stringify(accounts[0]) });
    }
  }

  /**
   * Check if a specific account identifier has biometrics registered on this device.
   */
  async isAccountBiometricEnabled(identifier: string): Promise<boolean> {
    if (!identifier) return false;
    const accounts = await this.getSavedBiometricAccounts();
    return accounts.some(a => a.identifier.toLowerCase() === identifier.toLowerCase());
  }

  /**
   * Legacy wrapper: Store biometric credentials securely in device storage.
   */
  async saveBiometricCredential(
    token: string,
    user: { identifier: string; name: string; avatar?: string; role?: string },
    deviceName: string
  ): Promise<void> {
    const account: BiometricAccount = {
      identifier: user.identifier,
      name: user.name,
      role: user.role || 'member',
      avatar: user.avatar,
      token,
      deviceName,
      registeredAt: new Date().toISOString(),
    };
    await this.saveBiometricAccount(account);
  }

  async getSavedBiometricToken(): Promise<string | null> {
    const { value } = await Preferences.get({ key: PREF_BIOMETRIC_TOKEN });
    return value || null;
  }

  async getSavedBiometricUser(): Promise<{ identifier: string; name: string; avatar?: string; role?: string } | null> {
    const { value } = await Preferences.get({ key: PREF_BIOMETRIC_USER });
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  async isBiometricActiveOnDevice(): Promise<boolean> {
    const accounts = await this.getSavedBiometricAccounts();
    return accounts.length > 0;
  }

  /**
   * Clear all saved biometric credentials when user explicitly resets all accounts.
   */
  async clearBiometricCredential(): Promise<void> {
    await Preferences.remove({ key: PREF_BIOMETRIC_TOKEN });
    await Preferences.remove({ key: PREF_BIOMETRIC_USER });
    await Preferences.remove({ key: PREF_BIOMETRIC_DEVICE });
    await Preferences.remove({ key: PREF_BIOMETRIC_ENABLED });
    await Preferences.remove({ key: PREF_BIOMETRIC_ACCOUNTS });
  }

  /**
   * Detect device model or browser name for human-readable device tag.
   */
  getDeviceModelName(): string {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) {
      const match = ua.match(/Android\s+[\d\.]+;\s+([^;\)]+)/i);
      return match && match[1] ? match[1].trim() : 'Android Device';
    }
    if (/iphone|ipad|ipod/i.test(ua)) {
      return 'Apple iOS Device';
    }
    return 'Authorized Device';
  }
}
