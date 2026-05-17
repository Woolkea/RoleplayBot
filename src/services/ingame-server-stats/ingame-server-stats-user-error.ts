export class IngameServerStatsUserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IngameServerStatsUserFacingError";
  }
}
