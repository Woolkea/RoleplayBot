import { existsSync } from "node:fs";

import { dirname, join } from "node:path";

import { fileURLToPath } from "node:url";

import { createCanvas, GlobalFonts, loadImage, type SKRSContext2D } from "@napi-rs/canvas";

import type { GuildMember } from "discord.js";

const CANVAS_FONT_ALIAS = "LunarTeamXpUi";
let resolvedFontFamily: string | null = null;

function resolveCanvasFontFamily(): string {
  if (resolvedFontFamily !== null) {
    return resolvedFontFamily;
  }

  const moduleDir = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(process.cwd(), "fonts", "NotoSans-Regular.ttf"),
    join(moduleDir, "..", "..", "..", "fonts", "NotoSans-Regular.ttf"),
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/usr/share/fonts/TTF/DejaVuSans.ttf",
    "/usr/share/fonts/ttf-dejavu/DejaVuSans.ttf",
    "C:\\Windows\\Fonts\\segoeui.ttf",
    "C:\\Windows\\Fonts\\arial.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/Library/Fonts/Arial.ttf",
  ];

  for (const fontPath of candidates) {
    try {
      if (!existsSync(fontPath)) {
        continue;
      }

      GlobalFonts.registerFromPath(fontPath, CANVAS_FONT_ALIAS);
      resolvedFontFamily = CANVAS_FONT_ALIAS;

      return CANVAS_FONT_ALIAS;
    } catch (err: unknown) {
      console.warn("team XP status card font registration failed for:", fontPath, err);
    }
  }

  console.warn(
    "team XP status card: no usable font file — text may not render. Add fonts/NotoSans-Regular.ttf or install fonts-dejavu-core.",
  );
  resolvedFontFamily = "sans-serif";

  return "sans-serif";
}

function canvasFontCss(weight: number, sizePx: number): string {
  const family = resolveCanvasFontFamily();
  const quoted = family.includes(" ") ? `"${family}"` : family;

  return `${String(weight)} ${String(sizePx)}px ${quoted}`;
}

const COL = {
  bg: "#242429",
  border: "#323237",
  surface: "#1b1b1e",
  text: "#ffffff",
  dim: "#ffffff",
  faint: "#38383d",
  accent: "#ffffff",
  lineA: "#0068ff",
  lineB: "#7900ff",
} as const;
const W = 520;
const H_FULL = 210;
const H_MIN = 84;
const PAD = 18;
const CARD_PAD = 14;
const OUTER_R = 8;
const CARD_R = 6;
const AVATAR = 48;
const AVATAR_R = 8;

function roundRectPath(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawCanvasBg(ctx: SKRSContext2D, width: number, height: number): void {
  ctx.fillStyle = COL.bg;
  roundRectPath(ctx, 0.5, 0.5, width - 1, height - 1, OUTER_R);
  ctx.fill();
  ctx.strokeStyle = COL.border;
  ctx.lineWidth = 1;
  ctx.stroke();
}

async function drawAvatarRounded(
  ctx: SKRSContext2D,
  url: string,
  x: number,
  y: number,
  size: number,
  radius: number,
): Promise<void> {
  const img = await loadImage(url);
  ctx.save();
  roundRectPath(ctx, x, y, size, size, radius);
  ctx.clip();
  ctx.drawImage(img, x, y, size, size);
  ctx.restore();
}

function drawXpRight(ctx: SKRSContext2D, xp: string, rightX: number, centerY: number): void {
  ctx.textAlign = "right";
  ctx.fillStyle = "#81828a";
  ctx.font = canvasFontCss(500, 10);
  ctx.fillText("TEAM-XP", rightX, centerY - 14);
  ctx.fillStyle = "#ffffff";
  ctx.font = canvasFontCss(600, 36);
  ctx.fillText(xp, rightX, centerY + 24);
  ctx.textAlign = "left";
}

function drawChart(
  ctx: SKRSContext2D,
  chartX: number,
  chartY: number,
  chartW: number,
  chartH: number,
  userHistory: {
    xp: number;
    createdAt: Date;
  }[],
  avgHistory: {
    xp: number;
    createdAt: Date;
  }[],
): void {
  ctx.fillStyle = COL.surface;
  roundRectPath(ctx, chartX, chartY, chartW, chartH, CARD_R);
  ctx.fill();
  ctx.fillStyle = "#81828a";
  ctx.font = canvasFontCss(500, 11);
  const label = "Verlauf";
  ctx.fillText(label, chartX + CARD_PAD, chartY + 18);
  const labelW = ctx.measureText(label).width;
  let lx = chartX + CARD_PAD + labelW + 16;
  const ly = chartY + 15;

  function drawLegendItem(color: string, text: string): void {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(lx, ly, 3, 0, Math.PI * 2);
    ctx.fill();
    lx += 8;
    ctx.fillStyle = "#81828a";
    ctx.font = canvasFontCss(500, 10);
    ctx.fillText(text, lx, ly + 3.5);
    lx += ctx.measureText(text).width + 12;
  }

  drawLegendItem(COL.lineA, "Deine XP");
  drawLegendItem(COL.lineB, "Team-Durchschnitt");
  const pad = 16;
  const innerX = chartX + pad;
  const innerY = chartY + 28;
  const innerW = chartW - pad * 2;
  const innerH = chartH - 28 - pad;
  const nowMs = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const startTimeMs = nowMs - sevenDaysMs;
  const windowStart = new Date(startTimeMs);
  const windowEnd = new Date(nowMs);

  function prepareSeriesForLineChart(
    series: {
      xp: number;
      createdAt: Date;
    }[],
  ): {
    xp: number;
    createdAt: Date;
  }[] {
    const sorted = [...series].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    if (sorted.length >= 2) {
      return sorted;
    }

    if (sorted.length === 1) {
      const v = sorted[0];

      return [
        { xp: v.xp, createdAt: windowStart },
        { xp: v.xp, createdAt: windowEnd },
      ];
    }

    return sorted;
  }

  const userPrepared = prepareSeriesForLineChart(userHistory);
  const avgPrepared = prepareSeriesForLineChart(avgHistory);
  const maxVal = Math.max(1, ...userPrepared.map((h) => h.xp), ...avgPrepared.map((h) => h.xp));

  function getX(date: Date): number {
    const t = (date.getTime() - startTimeMs) / sevenDaysMs;

    return innerX + Math.max(0, Math.min(1, t)) * innerW;
  }

  function toPoints(
    prepared: {
      xp: number;
      createdAt: Date;
    }[],
  ): {
    x: number;
    y: number;
  }[] {
    return prepared.map((h) => ({
      x: getX(h.createdAt),
      y: innerY + innerH - (h.xp / maxVal) * innerH,
    }));
  }

  const a = toPoints(userPrepared);
  const b = toPoints(avgPrepared);

  function strokePolyline(
    pts: {
      x: number;
      y: number;
    }[],
    color: string,
  ): void {
    if (pts.length < 2) {
      return;
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);

    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }

    ctx.stroke();
  }

  strokePolyline(b, COL.lineB);
  strokePolyline(a, COL.lineA);
}

export async function renderTeamXpStatusCardPng(args: {
  member: GuildMember;
  xp: number;
  userHistory: {
    xp: number;
    createdAt: Date;
  }[];
  avgHistory: {
    xp: number;
    createdAt: Date;
  }[];
}): Promise<Buffer> {
  resolveCanvasFontFamily();
  const hasChart = args.xp > 0;
  const canvasH = hasChart ? H_FULL : H_MIN;
  const canvas = createCanvas(W, canvasH);
  const ctx = canvas.getContext("2d");
  drawCanvasBg(ctx, W, canvasH);
  const member = args.member;
  const user = member.user;
  const ax = PAD;
  const ay = PAD;
  await drawAvatarRounded(
    ctx,
    member.displayAvatarURL({ extension: "png", size: 128 }),
    ax,
    ay,
    AVATAR,
    AVATAR_R,
  );
  const xpReserve = 120;
  const textLeft = PAD + AVATAR + 14;
  const textMaxW = W - PAD - xpReserve - textLeft;
  const rowMidY = PAD + AVATAR / 2;
  ctx.fillStyle = "#ffffff";
  ctx.font = canvasFontCss(500, 18);
  const dn = truncate(member.displayName, ctx, textMaxW, 18);
  ctx.fillText(dn, textLeft, rowMidY);
  ctx.fillStyle = "#81828a";
  ctx.font = canvasFontCss(400, 14);
  ctx.fillText(`@${user.username}`, textLeft, rowMidY + 18);
  drawXpRight(ctx, String(args.xp), W - PAD, rowMidY);

  if (hasChart) {
    const chartY = PAD + AVATAR + 14;
    const chartH = canvasH - chartY - PAD;
    drawChart(ctx, PAD, chartY, W - PAD * 2, chartH, args.userHistory, args.avgHistory);
  }

  return canvas.toBuffer("image/png");
}

function truncate(s: string, ctx: SKRSContext2D, maxW: number, fontPx: number): string {
  ctx.font = canvasFontCss(500, fontPx);

  if (ctx.measureText(s).width <= maxW) {
    return s;
  }

  let out = s;

  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxW) {
    out = out.slice(0, -1);
  }

  return `${out}…`;
}
