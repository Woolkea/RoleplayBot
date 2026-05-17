export type TeamXpUserFacingErrorOptions = {
  dizzyKontrolleLogFehler?: string;
};

export class TeamXpUserFacingError extends Error {
  readonly dizzyKontrolleLogFehler?: string;
  constructor(message: string, options?: TeamXpUserFacingErrorOptions) {
    super(message);
    this.name = "TeamXpUserFacingError";
    this.dizzyKontrolleLogFehler = options?.dizzyKontrolleLogFehler;
  }
}
