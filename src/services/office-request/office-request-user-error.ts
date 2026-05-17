export class OfficeRequestUserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OfficeRequestUserFacingError";
  }
}
