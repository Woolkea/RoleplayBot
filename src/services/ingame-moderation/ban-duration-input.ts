export type ParsedBanDuration =
  | {
      ok: true;
      isPermanent: true;
      durationDays: null;
    }
  | {
      ok: true;
      isPermanent: false;
      durationDays: number;
    }
  | {
      ok: false;
      message: string;
    };

export function parseBanDurationInput(raw: string): ParsedBanDuration {
  const trimmed = raw.trim();
  const match = trimmed.match(/\d+/u);

  if (match === null) {
    return { ok: true, isPermanent: true, durationDays: null };
  }

  const n = Number.parseInt(match[0], 10);

  if (!Number.isFinite(n) || n < 1 || n > 365) {
    return {
      ok: false,
      message: `Bann: Nur 1–365 Tage erlaubt (erkannt: „${match[0]}“). Ohne Zahl in der Eingabe = permanent.`,
    };
  }

  return { ok: true, isPermanent: false, durationDays: n };
}
