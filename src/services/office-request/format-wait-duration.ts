export function formatWaitDurationDe(from: Date, to: Date): string {
  const ms = to.getTime() - from.getTime();
  const sec = Math.max(0, Math.floor(ms / 1000));

  if (sec < 60) {
    return "unter 1 Min.";
  }

  const min = Math.floor(sec / 60);

  if (min < 60) {
    return min === 1 ? "1 Min." : `${String(min)} Min.`;
  }

  const h = Math.floor(min / 60);
  const rem = min % 60;

  if (rem === 0) {
    return h === 1 ? "1 Std." : `${String(h)} Std.`;
  }

  return `${String(h)} Std. ${String(rem)} Min.`;
}
