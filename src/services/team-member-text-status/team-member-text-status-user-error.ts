export class TeamMemberTextStatusUserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TeamMemberTextStatusUserFacingError";
  }
}
