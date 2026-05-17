export class RobloxHttpError extends Error {
  readonly status: number;
  readonly bodySnippet: string;
  constructor(message: string, status: number, bodySnippet: string) {
    super(message);
    this.name = "RobloxHttpError";
    this.status = status;
    this.bodySnippet = bodySnippet;
  }
}

export class RobloxUserNotFoundError extends Error {
  constructor(public readonly username: string) {
    super(`Roblox user not found: ${username}`);
    this.name = "RobloxUserNotFoundError";
  }
}
