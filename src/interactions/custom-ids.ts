export const ingamePrefix = "ingame:" as const;

export type ServerShard = "s1" | "s2";

export const ingameSelectAction = `${ingamePrefix}sel:action` as const;

export const ingameBtnHistory = `${ingamePrefix}btn:history` as const;

export const ingameBtnGetUserId = `${ingamePrefix}btn:getuserid` as const;

export const ingameModalWarn = `${ingamePrefix}m:warn` as const;

export const ingameModalKick = `${ingamePrefix}m:kick` as const;

export const ingameModalBan = `${ingamePrefix}m:ban` as const;

export const ingameModalUnban = `${ingamePrefix}m:unban` as const;

export const ingameModalHistory = `${ingamePrefix}m:hist` as const;

export const ingameModalGetUserId = `${ingamePrefix}m:uid` as const;

export const ingameFieldServer = `${ingamePrefix}f:server` as const;

export const ingameFieldUsername = `${ingamePrefix}f:user` as const;

export const ingameFieldReason = `${ingamePrefix}f:reason` as const;

export const ingameFieldBanDuration = `${ingamePrefix}f:bandurtxt` as const;

export function buildIngameConfirmButtonCustomId(flowId: string): string {
  return `${ingamePrefix}cfm:${flowId}`;
}

export function buildIngameCancelButtonCustomId(flowId: string): string {
  return `${ingamePrefix}ccl:${flowId}`;
}

export function buildIngameDeleteButtonCustomId(entryId: number): string {
  return `${ingamePrefix}del:${String(entryId)}`;
}

export function buildIngameHistoryPageButtonCustomId(args: {
  robloxUserId: string;
  s1Page: number;
  s2Page: number;
  serverShard: ServerShard;
  direction: "prev" | "next";
}): string {
  return `${ingamePrefix}histpg:${args.robloxUserId}:${String(args.s1Page)}:${String(args.s2Page)}:${args.serverShard}:${args.direction}`;
}

export function parseIngameHistoryPage(customId: string):
  | {
      robloxUserId: string;
      s1Page: number;
      s2Page: number;
      serverShard: ServerShard;
      direction: "prev" | "next";
    }
  | undefined {
  const prefix = `${ingamePrefix}histpg:`;

  if (!customId.startsWith(prefix)) {
    return undefined;
  }

  const parts = customId.slice(prefix.length).split(":");

  if (parts.length !== 5) {
    return undefined;
  }

  const s1Page = Number.parseInt(parts[1], 10);
  const s2Page = Number.parseInt(parts[2], 10);

  if (!Number.isFinite(s1Page) || !Number.isFinite(s2Page) || s1Page < 1 || s2Page < 1) {
    return undefined;
  }

  const serverShard = parts[3];

  if (serverShard !== "s1" && serverShard !== "s2") {
    return undefined;
  }

  const direction = parts[4];

  if (direction !== "prev" && direction !== "next") {
    return undefined;
  }

  return {
    robloxUserId: parts[0],
    s1Page,
    s2Page,
    serverShard,
    direction,
  };
}

export function parseIngameFlowIdFromConfirm(customId: string): string | undefined {
  const prefix = `${ingamePrefix}cfm:`;

  if (!customId.startsWith(prefix)) {
    return undefined;
  }

  return customId.slice(prefix.length);
}

export function parseIngameFlowIdFromCancel(customId: string): string | undefined {
  const prefix = `${ingamePrefix}ccl:`;

  if (!customId.startsWith(prefix)) {
    return undefined;
  }

  return customId.slice(prefix.length);
}

export function parseIngameDeleteEntryId(customId: string): number | undefined {
  const prefix = `${ingamePrefix}del:`;

  if (!customId.startsWith(prefix)) {
    return undefined;
  }

  const rest = customId.slice(prefix.length);
  const n = Number.parseInt(rest, 10);

  if (!Number.isFinite(n)) {
    return undefined;
  }

  return n;
}

export const feedbackPrefix = "feedback:" as const;

export const feedbackBtnOpen = `${feedbackPrefix}btn:open` as const;

export const feedbackModalSubmit = `${feedbackPrefix}m:submit` as const;

export const feedbackFieldUser = `${feedbackPrefix}f:user` as const;

export const feedbackFieldCategory = `${feedbackPrefix}f:category` as const;

export const feedbackFieldStars = `${feedbackPrefix}f:stars` as const;

export const feedbackFieldReason = `${feedbackPrefix}f:reason` as const;

export const teamXpPrefix = "teamxp:" as const;

export const teamXpBtnStatus = `${teamXpPrefix}btn:status` as const;

export function buildTeamXpLeaderboardButtonCustomId(page: number): string {
  return `${teamXpPrefix}lb:${String(page)}`;
}

export function parseTeamXpLeaderboardPageButton(customId: string): number | undefined {
  const prefix = `${teamXpPrefix}lb:`;

  if (!customId.startsWith(prefix)) {
    return undefined;
  }

  const rest = customId.slice(prefix.length);
  const n = Number.parseInt(rest, 10);

  if (!Number.isFinite(n) || n < 1) {
    return undefined;
  }

  return n;
}

export function buildTeamXpLeaderboardPrevButtonCustomId(currentPage: number): string {
  return `${teamXpPrefix}lbp:${String(currentPage)}`;
}

export function buildTeamXpLeaderboardNextButtonCustomId(currentPage: number): string {
  return `${teamXpPrefix}lbn:${String(currentPage)}`;
}

export function parseTeamXpLeaderboardPrevButton(customId: string): number | undefined {
  const prefix = `${teamXpPrefix}lbp:`;

  if (!customId.startsWith(prefix)) {
    return undefined;
  }

  const n = Number.parseInt(customId.slice(prefix.length), 10);

  return Number.isFinite(n) && n >= 1 ? n : undefined;
}

export function parseTeamXpLeaderboardNextButton(customId: string): number | undefined {
  const prefix = `${teamXpPrefix}lbn:`;

  if (!customId.startsWith(prefix)) {
    return undefined;
  }

  const n = Number.parseInt(customId.slice(prefix.length), 10);

  return Number.isFinite(n) && n >= 1 ? n : undefined;
}

export const teamTxtStatusPrefix = "teamtxtstatus:" as const;

export const teamTxtStatusBtnMine = `${teamTxtStatusPrefix}btn:mine` as const;
const teamTxtStatusModalSetPrefix = `${teamTxtStatusPrefix}m:set:` as const;

export const teamTxtStatusFieldDescription = `${teamTxtStatusPrefix}f:desc` as const;

export function buildTeamTxtStatusModalSubmitCustomId(targetUserId: string): string {
  return `${teamTxtStatusModalSetPrefix}${targetUserId}`;
}

export function parseTeamTxtStatusModalSubmitCustomId(customId: string): string | undefined {
  if (!customId.startsWith(teamTxtStatusModalSetPrefix)) {
    return undefined;
  }

  const id = customId.slice(teamTxtStatusModalSetPrefix.length).trim();

  if (!/^\d{17,22}$/.test(id)) {
    return undefined;
  }

  return id;
}

export const teamlistePrefix = "teamliste:" as const;

export const teamlisteBtnCreate = `${teamlistePrefix}btn:create` as const;
const teamlisteEditRowPrefix = `${teamlistePrefix}btn:editrow:` as const;
const teamlisteDeleteRowPrefix = `${teamlistePrefix}btn:delrow:` as const;

export function buildTeamlisteEditRowButtonCustomId(categoryId: number): string {
  return `${teamlisteEditRowPrefix}${String(categoryId)}`;
}

export function parseTeamlisteEditRowButton(customId: string): number | undefined {
  if (!customId.startsWith(teamlisteEditRowPrefix)) {
    return undefined;
  }

  const n = Number.parseInt(customId.slice(teamlisteEditRowPrefix.length), 10);

  return Number.isFinite(n) && n >= 1 ? n : undefined;
}

export function buildTeamlisteDeleteRowButtonCustomId(categoryId: number): string {
  return `${teamlisteDeleteRowPrefix}${String(categoryId)}`;
}

export function parseTeamlisteDeleteRowButton(customId: string): number | undefined {
  if (!customId.startsWith(teamlisteDeleteRowPrefix)) {
    return undefined;
  }

  const n = Number.parseInt(customId.slice(teamlisteDeleteRowPrefix.length), 10);

  return Number.isFinite(n) && n >= 1 ? n : undefined;
}

export const teamlisteModalCreate = `${teamlistePrefix}m:create` as const;

export const teamlisteFieldName = `${teamlistePrefix}f:name` as const;

export const teamlisteFieldRoles = `${teamlistePrefix}f:roles` as const;
const teamlisteModalEditPrefix = `${teamlistePrefix}m:edit:` as const;

export function buildTeamlisteModalEditCustomId(categoryId: number): string {
  return `${teamlisteModalEditPrefix}${String(categoryId)}`;
}

export function parseTeamlisteModalEditCategoryId(customId: string): number | undefined {
  if (!customId.startsWith(teamlisteModalEditPrefix)) {
    return undefined;
  }

  const rest = customId.slice(teamlisteModalEditPrefix.length);
  const n = Number.parseInt(rest, 10);

  return Number.isFinite(n) && n >= 1 ? n : undefined;
}

export const robloxLinkPrefix = "robloxlink:" as const;

export function buildRobloxLinkConfirmButtonCustomId(flowId: string): string {
  return `${robloxLinkPrefix}cfm:${flowId}`;
}

export function buildRobloxLinkCancelButtonCustomId(flowId: string): string {
  return `${robloxLinkPrefix}ccl:${flowId}`;
}

export function parseRobloxLinkConfirmFlowId(customId: string): string | undefined {
  const prefix = `${robloxLinkPrefix}cfm:`;

  if (!customId.startsWith(prefix)) {
    return undefined;
  }

  return customId.slice(prefix.length);
}

export function parseRobloxLinkCancelFlowId(customId: string): string | undefined {
  const prefix = `${robloxLinkPrefix}ccl:`;

  if (!customId.startsWith(prefix)) {
    return undefined;
  }

  return customId.slice(prefix.length);
}

export const robloxSetupPrefix = "robloxsetup:" as const;

export const robloxSetupBtnLink = `${robloxSetupPrefix}btn:link` as const;

export const robloxSetupBtnView = `${robloxSetupPrefix}btn:view` as const;

export const robloxSetupModalLink = `${robloxSetupPrefix}m:link` as const;

export const robloxSetupModalView = `${robloxSetupPrefix}m:view` as const;

export const robloxSetupFieldUsername = `${robloxSetupPrefix}f:rbxuser` as const;

export const robloxSetupFieldMember = `${robloxSetupPrefix}f:member` as const;

export const adminCallPrefix = "admincall:" as const;

export const adminCallBtnOpen = `${adminCallPrefix}btn:open` as const;

export const adminCallModalSubmit = `${adminCallPrefix}m:submit` as const;

export const adminCallFieldServer = `${adminCallPrefix}f:server` as const;

export const adminCallFieldUsername = `${adminCallPrefix}f:user` as const;

export const adminCallFieldLocation = `${adminCallPrefix}f:location` as const;

export const adminCallFieldReason = `${adminCallPrefix}f:reason` as const;

export function buildAdminCallConfirmButtonCustomId(flowId: string): string {
  return `${adminCallPrefix}cfm:${flowId}`;
}

export function buildAdminCallCancelButtonCustomId(flowId: string): string {
  return `${adminCallPrefix}ccl:${flowId}`;
}

export function parseAdminCallConfirmFlowId(customId: string): string | undefined {
  const prefix = `${adminCallPrefix}cfm:`;

  if (!customId.startsWith(prefix)) {
    return undefined;
  }

  return customId.slice(prefix.length);
}

export function parseAdminCallCancelFlowId(customId: string): string | undefined {
  const prefix = `${adminCallPrefix}ccl:`;

  if (!customId.startsWith(prefix)) {
    return undefined;
  }

  return customId.slice(prefix.length);
}

const adminCallClaimBtnPrefix = `${adminCallPrefix}btn:claim:` as const;

export function buildAdminCallClaimButtonCustomId(callId: number): string {
  return `${adminCallClaimBtnPrefix}${String(callId)}`;
}

export function parseAdminCallClaimButton(customId: string): number | undefined {
  if (!customId.startsWith(adminCallClaimBtnPrefix)) {
    return undefined;
  }

  const rest = customId.slice(adminCallClaimBtnPrefix.length);
  const n = Number.parseInt(rest, 10);

  return Number.isFinite(n) && n >= 1 ? n : undefined;
}

const dizzyAbusePrefix = "dizzyabuse:" as const;

export function buildDizzyAbuseReportButtonCustomId(dizzyControlMessageId: string): string {
  return `${dizzyAbusePrefix}report:${dizzyControlMessageId}`;
}

export function parseDizzyAbuseReportButton(customId: string): string | undefined {
  const prefix = `${dizzyAbusePrefix}report:`;

  if (!customId.startsWith(prefix)) {
    return undefined;
  }

  const id = customId.slice(prefix.length);

  if (!/^\d{17,20}$/.test(id)) {
    return undefined;
  }

  return id;
}

const dizzyAbuseRevertPrefix = `${dizzyAbusePrefix}revert:` as const;

export function buildDizzyAbuseRevertButtonCustomId(penaltyId: number): string {
  return `${dizzyAbuseRevertPrefix}${String(penaltyId)}`;
}

export function parseDizzyAbuseRevertButton(customId: string): number | undefined {
  if (!customId.startsWith(dizzyAbuseRevertPrefix)) {
    return undefined;
  }

  const rest = customId.slice(dizzyAbuseRevertPrefix.length);
  const n = Number.parseInt(rest, 10);

  return Number.isFinite(n) && n >= 1 ? n : undefined;
}

const dizzyLinkPrefix = "dizzylink:" as const;
const dizzyLinkConfirmPrefix = `${dizzyLinkPrefix}cfm:` as const;
const dizzyLinkCancelPrefix = `${dizzyLinkPrefix}ccl:` as const;
const uuidV4Re = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function buildDizzyLinkConfirmButtonCustomId(flowId: string): string {
  return `${dizzyLinkConfirmPrefix}${flowId}`;
}

export function buildDizzyLinkCancelButtonCustomId(flowId: string): string {
  return `${dizzyLinkCancelPrefix}${flowId}`;
}

export function parseDizzyLinkConfirmFlowId(customId: string): string | undefined {
  if (!customId.startsWith(dizzyLinkConfirmPrefix)) {
    return undefined;
  }

  const id = customId.slice(dizzyLinkConfirmPrefix.length);

  return uuidV4Re.test(id) ? id : undefined;
}

export function parseDizzyLinkCancelFlowId(customId: string): string | undefined {
  if (!customId.startsWith(dizzyLinkCancelPrefix)) {
    return undefined;
  }

  const id = customId.slice(dizzyLinkCancelPrefix.length);

  return uuidV4Re.test(id) ? id : undefined;
}

export const officeRequestPrefix = "officereq:" as const;
const officeRequestMoveBtnPrefix = `${officeRequestPrefix}btn:move:` as const;

export function buildOfficeRequestMoveButtonCustomId(requestId: number): string {
  return `${officeRequestMoveBtnPrefix}${String(requestId)}`;
}

export function parseOfficeRequestMoveButton(customId: string): number | undefined {
  if (!customId.startsWith(officeRequestMoveBtnPrefix)) {
    return undefined;
  }

  const rest = customId.slice(officeRequestMoveBtnPrefix.length);
  const n = Number.parseInt(rest, 10);

  return Number.isFinite(n) && n >= 1 ? n : undefined;
}

export const regelwerkPrefix = "regelwerk:" as const;

export const regelwerkSelectCategory = `${regelwerkPrefix}sel:category` as const;
const ingameStatsSetPlayerAckPrefix = "ingsp:ack:" as const;

export function buildIngameStatsSetPlayerAckButtonCustomId(args: {
  guildId: string;
  userId: string;
  count: number;
  issuedAtMs: number;
}): string {
  return `${ingameStatsSetPlayerAckPrefix}${args.guildId}:${args.userId}:${String(args.count)}:${String(args.issuedAtMs)}`;
}

export function parseIngameStatsSetPlayerAckButtonCustomId(customId: string):
  | {
      guildId: string;
      userId: string;
      count: number;
      issuedAtMs: number;
    }
  | undefined {
  if (!customId.startsWith(ingameStatsSetPlayerAckPrefix)) {
    return undefined;
  }

  const parts = customId.split(":");

  if (parts.length !== 6 || parts[0] !== "ingsp" || parts[1] !== "ack") {
    return undefined;
  }

  const guildId = parts[2];
  const userId = parts[3];
  const count = Number.parseInt(parts[4], 10);
  const issuedAtMs = Number.parseInt(parts[5], 10);

  if (!Number.isFinite(count) || !Number.isFinite(issuedAtMs)) {
    return undefined;
  }

  return { guildId, userId, count, issuedAtMs };
}
