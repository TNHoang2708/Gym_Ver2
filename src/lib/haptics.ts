export const vibrate = (pattern: number | number[] = 15) => {
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern)
    } catch (e) {
      // Ignore on devices that don't support it
    }
  }
}

export const haptic = {
  light: () => vibrate(10),
  medium: () => vibrate(20),
  heavy: () => vibrate(30),
  success: () => vibrate([10, 30, 20]),
  error: () => vibrate([30, 50, 30, 50, 30])
}
