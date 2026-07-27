import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gymplannerai.app',
  appName: 'GymPlannerAI',
  webDir: 'public',
  server: {
    url: 'http://10.11.1.94:3000',
    cleartext: true
  }
};

export default config;
