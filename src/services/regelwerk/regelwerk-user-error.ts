export class RegelwerkUserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RegelwerkUserFacingError";
  }
}
