/**
 * Converts a timestamp in seconds to MM:SS format
 * @param seconds - The timestamp in seconds (can be decimal)
 * @returns Formatted timestamp string (e.g., "2:13", "0:45", "12:05")
 */
export function formatTrackTimestamp(seconds: number): string {
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  
  // Pad seconds with leading zero if needed
  const paddedSeconds = remainingSeconds.toString().padStart(2, '0');
  
  return `${minutes}:${paddedSeconds}`;
}
