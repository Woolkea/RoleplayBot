export class FeedbackUserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeedbackUserFacingError";
  }
}
