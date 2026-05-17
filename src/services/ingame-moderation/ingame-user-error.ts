export class IngameUserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IngameUserFacingError";
  }
}
