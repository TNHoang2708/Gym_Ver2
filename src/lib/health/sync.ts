export interface HealthData {
  steps: number;
  sleepHours: number;
}

/**
 * Sync health data from Apple Health or Google Fit via Capacitor.
 * If running on the web, this will mock the response.
 */
export async function syncHealthData(): Promise<HealthData> {
  if (typeof window !== 'undefined') {
    // Check if running in Capacitor
    const isNative = !!(window as any).Capacitor?.isNative;
    
    if (isNative) {
      // In a real app, call Capacitor plugin here. Example:
      // await requestHealthPermissions()
      // const steps = await queryDailySteps()
      // const sleep = await querySleepData()
      return { steps: 0, sleepHours: 0 }; 
    } else {
      // Mock for web testing
      console.log('Running on web. Mocking health sync...');
      
      const mockSteps = Math.floor(Math.random() * 9000) + 3000;
      const mockSleepMinutes = Math.floor(Math.random() * 300) + 240;
      const mockSleepHours = Number((mockSleepMinutes / 60).toFixed(1));
      
      return new Promise(resolve => setTimeout(() => resolve({
        steps: mockSteps,
        sleepHours: mockSleepHours
      }), 1200));
    }
  }
  return { steps: 0, sleepHours: 0 };
}
