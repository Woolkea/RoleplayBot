import {
  ButtonBuilder,
  ContainerBuilder,
  LabelBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  ModalBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  TextInputBuilder,
  UserSelectMenuBuilder,
} from "@discordjs/builders";

import { ButtonStyle, MessageFlags, SeparatorSpacingSize, TextInputStyle } from "discord.js";

import { EMOJIS, emojiToString } from "@/config/constants.js";

import {
  robloxSetupBtnLink,
  robloxSetupBtnView,
  robloxSetupFieldMember,
  robloxSetupFieldUsername,
  robloxSetupModalLink,
  robloxSetupModalView,
} from "@/interactions/custom-ids.js";

const ROBLOX_SETUP_PANEL_BANNER_URL =
  "https://media.discordapp.net/attachments/1500208165307027587/1500837090668052640/LunarRP.png?ex=6a007a76&is=69ff28f6&hm=cd5297ca9a8992ae14da4f026975c584f3ed3a9c65d6050a1f3e3717a7b0183b&=&format=webp&quality=lossless&width=1872&height=52";

export function robloxSetupV2Flags(): number {
  return MessageFlags.IsComponentsV2;
}

export function buildRobloxSetupPanelContainer(): ContainerBuilder {
  return new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${emojiToString(EMOJIS.ROBLOX_SETUP)} Roblox-Setup`),
      new TextDisplayBuilder().setContent(
        "> Hier kannst du deinen Roblox-Account verknüpfen und die von anderen Teammitgliedern einsehen. Nutze dafür die Buttons unten.",
      ),
    )
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Large)
        .setSpacing(SeparatorSpacingSize.Large),
    )
    .addActionRowComponents((row) =>
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(robloxSetupBtnLink)
          .setLabel("Roblox verknüpfen")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(EMOJIS.PLUS_WHITE),
        new ButtonBuilder()
          .setCustomId(robloxSetupBtnView)
          .setLabel("Benutzernamen anzeigen")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(EMOJIS.AUGE_WHITE),
      ),
    )
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Large)
        .setSpacing(SeparatorSpacingSize.Large),
    )
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(ROBLOX_SETUP_PANEL_BANNER_URL),
      ),
    );
}

function robloxUsernameInput(): TextInputBuilder {
  return new TextInputBuilder()
    .setCustomId(robloxSetupFieldUsername)
    .setStyle(TextInputStyle.Short)
    .setMinLength(2)
    .setMaxLength(64)
    .setRequired(true);
}

export function buildRobloxSetupLinkModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(robloxSetupModalLink)
    .setTitle("Roblox verknüpfen")
    .addLabelComponents(
      new LabelBuilder()
        .setLabel("Roblox-Benutzername")
        .setTextInputComponent(robloxUsernameInput()),
    );
}

export function buildRobloxSetupViewModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(robloxSetupModalView)
    .setTitle("Benutzernamen anzeigen")
    .addLabelComponents(
      new LabelBuilder()
        .setLabel("Teammitglied")
        .setUserSelectMenuComponent(
          new UserSelectMenuBuilder()
            .setCustomId(robloxSetupFieldMember)
            .setMinValues(1)
            .setMaxValues(1),
        ),
    );
}
