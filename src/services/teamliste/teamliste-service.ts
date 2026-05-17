import type { ContainerBuilder } from "@discordjs/builders";

import { ChannelType, type Client } from "discord.js";

import {
  deleteTeamlisteCategory,
  getTeamlisteCategoryById,
  getTeamlisteConfig,
  insertTeamlisteCategory,
  listTeamlisteCategories,
  updateTeamlisteCategory,
  upsertTeamlisteConfig,
  type TeamlisteCategoryRow,
} from "@/repositories/teamliste.js";

import { getRobloxLinksByDiscordUserIds } from "@/repositories/roblox-links.js";

import { TeamlisteUserFacingError } from "./teamliste-user-error.js";

import {
  buildTeamlisteAdminContainer,
  buildTeamlistePanelContainers,
  teamlistePanelAllowedMentions,
  teamlisteV2Flags,
} from "./ui-builders.js";

import { getTeamlisteAdminPanelMessage } from "./admin-panel-cache.js";

async function buildPublicTeamlisteContainers(
  client: Client,
  guildId: string,
): Promise<ContainerBuilder[]> {
  const guild = client.guilds.cache.get(guildId) ?? (await client.guilds.fetch(guildId));

  if (guild.members.cache.size === 0) {
    await guild.members.fetch().catch(() => undefined);
  }

  const categories = await listTeamlisteCategories(guildId);
  const allRoleIds = [...new Set(categories.flatMap((c) => c.roles))];

  if (allRoleIds.length > 0) {
    await guild.members.fetch().catch(() => undefined);
  }

  const memberIds = new Set<string>();

  for (const cat of categories) {
    for (const rid of cat.roles) {
      const role = guild.roles.cache.get(rid);

      if (role !== undefined) {
        for (const m of role.members.values()) {
          memberIds.add(m.id);
        }
      }
    }
  }

  const robloxByDiscordUserId = await getRobloxLinksByDiscordUserIds({
    guildId,
    discordUserIds: [...memberIds],
  });

  return buildTeamlistePanelContainers({ guild, categories, robloxByDiscordUserId });
}

export const teamlisteService = {
  async listCategories(guildId: string): Promise<TeamlisteCategoryRow[]> {
    return listTeamlisteCategories(guildId);
  },
  async getCategoryById(args: {
    guildId: string;
    categoryId: number;
  }): Promise<TeamlisteCategoryRow | null> {
    return getTeamlisteCategoryById({ id: args.categoryId, guildId: args.guildId });
  },
  async savePanelBinding(args: {
    guildId: string;
    channelId: string;
    panelMessageIds: string[];
  }): Promise<void> {
    await upsertTeamlisteConfig(args);
  },
  async buildPublicPanelContainers(args: {
    client: Client;
    guildId: string;
  }): Promise<ContainerBuilder[]> {
    return buildPublicTeamlisteContainers(args.client, args.guildId);
  },
  async refreshPanel(client: Client, guildId: string): Promise<void> {
    const config = await getTeamlisteConfig(guildId);

    if (config === null) {
      throw new TeamlisteUserFacingError(
        "Kein Teamliste-Panel konfiguriert. Bitte zuerst `/feature-setup` → **Teamliste-Panel** ausführen.",
      );
    }

    const containers = await buildPublicTeamlisteContainers(client, guildId);
    const channel =
      client.channels.cache.get(config.channelId) ??
      (await client.channels.fetch(config.channelId));

    if (channel === null || channel.type !== ChannelType.GuildText) {
      throw new TeamlisteUserFacingError("Der gespeicherte Panel-Kanal wurde nicht gefunden.");
    }

    const ids = [...config.panelMessageIds];

    for (const [i, component] of containers.entries()) {
      if (i < ids.length) {
        const msg = await channel.messages.fetch(ids[i]).catch(() => null);

        if (msg !== null && msg.editable) {
          await msg.edit({
            flags: teamlisteV2Flags(),
            components: [component],
            allowedMentions: teamlistePanelAllowedMentions,
          });
          continue;
        }
      }

      const sent = await channel.send({
        flags: teamlisteV2Flags(),
        components: [component],
        allowedMentions: teamlistePanelAllowedMentions,
      });

      if (i < ids.length) {
        ids[i] = sent.id;
      } else {
        ids.push(sent.id);
      }
    }

    for (let j = containers.length; j < ids.length; j++) {
      const mid = ids[j];
      const orphan = await channel.messages.fetch(mid).catch(() => null);

      if (orphan !== null && orphan.deletable) {
        await orphan.delete().catch(() => undefined);
      }
    }

    const nextIds = ids.slice(0, containers.length);
    await upsertTeamlisteConfig({
      guildId,
      channelId: config.channelId,
      panelMessageIds: nextIds,
    });
  },
  async createCategory(args: {
    client: Client;
    guildId: string;
    name: string;
    roleIds: string[];
  }): Promise<void> {
    const name = args.name.trim();

    if (name.length === 0) {
      throw new TeamlisteUserFacingError("Der Kategorie-Name darf nicht leer sein.");
    }

    if (args.roleIds.length === 0) {
      throw new TeamlisteUserFacingError("Bitte mindestens eine Rolle wählen.");
    }

    await insertTeamlisteCategory({
      guildId: args.guildId,
      name,
      roles: args.roleIds,
    });
    await teamlisteService.refreshPanel(args.client, args.guildId);
  },
  async updateCategory(args: {
    client: Client;
    guildId: string;
    categoryId: number;
    name: string;
    roleIds: string[];
  }): Promise<void> {
    const name = args.name.trim();

    if (name.length === 0) {
      throw new TeamlisteUserFacingError("Der Kategorie-Name darf nicht leer sein.");
    }

    if (args.roleIds.length === 0) {
      throw new TeamlisteUserFacingError("Bitte mindestens eine Rolle wählen.");
    }

    const ok = await updateTeamlisteCategory({
      id: args.categoryId,
      guildId: args.guildId,
      name,
      roles: args.roleIds,
    });

    if (!ok) {
      throw new TeamlisteUserFacingError(
        "Kategorie nicht gefunden oder gehört nicht zu dieser Guild.",
      );
    }

    await teamlisteService.refreshPanel(args.client, args.guildId);
  },
  async deleteCategory(args: {
    client: Client;
    guildId: string;
    categoryId: number;
  }): Promise<void> {
    const ok = await deleteTeamlisteCategory({ id: args.categoryId, guildId: args.guildId });

    if (!ok) {
      throw new TeamlisteUserFacingError(
        "Kategorie nicht gefunden oder gehört nicht zu dieser Guild.",
      );
    }

    await teamlisteService.refreshPanel(args.client, args.guildId);
  },
  async refreshAdminEphemeralPanel(args: {
    client: Client;
    guildId: string;
    userId: string;
  }): Promise<void> {
    const ref = getTeamlisteAdminPanelMessage(args.guildId, args.userId);

    if (ref === undefined) {
      return;
    }

    const ch = await args.client.channels.fetch(ref.channelId);

    if (ch === null || ch.type !== ChannelType.GuildText) {
      return;
    }

    const categories = await listTeamlisteCategories(args.guildId);
    const msg = await ch.messages.fetch(ref.messageId);
    await msg.edit({
      flags: teamlisteV2Flags(),
      components: [buildTeamlisteAdminContainer(categories)],
    });
  },
};
