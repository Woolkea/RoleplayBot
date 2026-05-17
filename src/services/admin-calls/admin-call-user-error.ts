export class AdminCallUserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminCallUserFacingError";
  }
}
