export const formatTime = (ms: number) =>
  `${Math.floor(ms / 60000).toString().padStart(2, "0")}:${((ms / 1000) % 60).toFixed(1).padStart(4, "0")}`;
