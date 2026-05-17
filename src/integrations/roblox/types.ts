export type RobloxUserId = string;

export type RobloxPublicProfile = {
  id: RobloxUserId;
  name: string;
  displayName: string;
  created: Date | null;
  headshotUrl: string;
  profileUrl: string;
};
