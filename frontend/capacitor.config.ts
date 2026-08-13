import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'FordaGO',
  webDir: 'www',

  // Development only: the FordaGO Laravel API currently uses HTTP on port 8000
  // (see src/app/config/api.config.ts). Remove these two development HTTP
  // allowances once the API is deployed on HTTPS.
  server: {
    cleartext: true,
  },

  android: {
    allowMixedContent: true,
  },

  plugins: {
    SystemBars: {
      insetsHandling: 'css',
      style: 'DARK',
      hidden: false,
      animation: 'NONE',
    },
  },
};

export default config;
