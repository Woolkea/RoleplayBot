export function utcDayStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

export function rollingSevenDaysStart(d: Date): Date {
  return new Date(d.getTime() - 7 * 24 * 60 * 60 * 1000);
}

export function effectiveWindowStart(clock: Date, windowStart: Date): Date {
  return clock.getTime() > windowStart.getTime() ? clock : windowStart;
}

export const DIZZY_ABUSE_DAILY_REPORT_THRESHOLD = 3;

export const DIZZY_ABUSE_WEEKLY_REPORT_THRESHOLD_EXCLUSIVE = 10;

export function abuseThresholdsMet(dayCount: number, weekCount: number): boolean {
  return (
    dayCount >= DIZZY_ABUSE_DAILY_REPORT_THRESHOLD ||
    weekCount > DIZZY_ABUSE_WEEKLY_REPORT_THRESHOLD_EXCLUSIVE
  );
}

export function resolveAbuseTriggerReason(
  dayCount: number,
  weekCount: number,
): "daily_3" | "weekly_11" | "daily_3_and_weekly_11" {
  const dayHit = dayCount >= DIZZY_ABUSE_DAILY_REPORT_THRESHOLD;
  const weekHit = weekCount > DIZZY_ABUSE_WEEKLY_REPORT_THRESHOLD_EXCLUSIVE;

  if (dayHit && weekHit) {
    return "daily_3_and_weekly_11";
  }

  if (dayHit) {
    return "daily_3";
  }

  return "weekly_11";
}
