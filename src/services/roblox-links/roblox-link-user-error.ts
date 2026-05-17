export class RobloxLinkUserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RobloxLinkUserFacingError";
  }
}
