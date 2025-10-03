/**
 * Get greeting message based on time of day
 */
export function getGreeting(userName?: string): string {
  const hour = new Date().getHours();
  const name = userName ? `, ${userName}` : '';
  if (hour < 12) return `Good morning${name}`;
  if (hour < 18) return `Good afternoon${name}`;
  if (hour < 21) return `Good evening${name}`;
  return `Good night${name}`;
}

/**
 * Generate deterministic color based on string hash
 */
export function getDeterministicColour(subjectName: string, defaultColours: string[]): string {
  // Simple hash function (djb2)
  let hash = 5381;
  for (let i = 0; i < subjectName.length; i++) {
    hash = ((hash << 5) + hash) + subjectName.charCodeAt(i);
  }
  const idx = Math.abs(hash) % defaultColours.length;
  return defaultColours[idx];
}

/**
 * Format time left as HH:MM:SS or MM:SS for countdown display
 */
export function formatCountdownForTab(ms: number | null): string {
  if (ms === null) return '';
  // Display 00:00 at zero to avoid flashing 'Now!'
  if (ms <= 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
