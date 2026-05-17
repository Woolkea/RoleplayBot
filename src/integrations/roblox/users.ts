import { ROBLOX_PROFILE_BASE, ROBLOX_THUMBNAILS_API, ROBLOX_USERS_API } from "./constants.js";

import { RobloxUserNotFoundError } from "./errors.js";

import { fetchJson } from "./http.js";

import type { RobloxPublicProfile, RobloxUserId } from "./types.js";

type UsernameLookupResponse = {
  data: Array<{
    id: number;
    name: string;
    displayName: string;
    requestedUsername: string;
  }>;
};
type UserResponse = {
  id: number;
  name: string;
  displayName: string;
  created: string;
};
type ThumbnailBatchResponse = {
  data: Array<{
    targetId: number;
    state: string;
    imageUrl: string | null;
  }>;
};

function buildHeadshotUrl(userId: RobloxUserId): string {
  return buildRobloxHeadshotImageUrl(userId);
}

export function buildRobloxHeadshotImageUrl(userId: string): string {
  const trimmed = userId.trim();

  if (trimmed === "") {
    throw new Error("Roblox user id must not be empty");
  }

  return `${ROBLOX_THUMBNAILS_API}/v1/users/avatar-headshot?userIds=${encodeURIComponent(trimmed)}&size=420x420&format=Png&isCircular=false`;
}

function buildProfileUrl(userId: RobloxUserId): string {
  return `${ROBLOX_PROFILE_BASE}/${userId}/profile`;
}

export async function resolveRobloxUsername(username: string): Promise<RobloxUserId> {
  const trimmed = username.trim();

  if (trimmed === "") {
    throw new Error("Roblox username must not be empty");
  }

  const body = await fetchJson<UsernameLookupResponse>(
    `${ROBLOX_USERS_API}/v1/usernames/users`,
    {
      method: "POST",
      body: JSON.stringify({
        usernames: [trimmed],
        excludeBannedUsers: false,
      }),
    },
    {},
  );
  const first = body.data.at(0);

  if (first === undefined) {
    throw new RobloxUserNotFoundError(trimmed);
  }

  return String(first.id);
}

export async function fetchRobloxPublicProfile(userId: RobloxUserId): Promise<RobloxPublicProfile> {
  const user = await fetchJson<UserResponse>(
    `${ROBLOX_USERS_API}/v1/users/${userId}`,
    { method: "GET" },
    {},
  );
  const thumbs = await fetchJson<ThumbnailBatchResponse>(
    `${ROBLOX_THUMBNAILS_API}/v1/users/avatar-headshot?userIds=${encodeURIComponent(userId)}&size=420x420&format=Png&isCircular=false`,
    { method: "GET" },
    {},
  );
  const thumb = thumbs.data[0]?.imageUrl ?? buildHeadshotUrl(userId);

  return {
    id: String(user.id),
    name: user.name,
    displayName: user.displayName,
    created: user.created ? new Date(user.created) : null,
    headshotUrl: thumb,
    profileUrl: buildProfileUrl(String(user.id)),
  };
}

export async function resolveRobloxPublicProfileByUsername(
  username: string,
): Promise<RobloxPublicProfile> {
  const userId = await resolveRobloxUsername(username);

  return fetchRobloxPublicProfile(userId);
}
