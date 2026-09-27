import { serverConfig } from "#/lib/config";
import {
  startDiscordGateway,
  stopDiscordGateway,
} from "#/lib/integrations/discord/gateway";
import { logGuildRolesForAuthentikSetup } from "#/lib/integrations/discord/guild-role-catalog";

let started = false;

function isGatewayEnabled(): boolean {
  const flag = process.env.DISCORD_BOT_GATEWAY?.trim().toLowerCase();
  if (flag === "false" || flag === "0" || flag === "off") {
    return false;
  }

  return true;
}

export async function startDiscordBot(): Promise<void> {
  if (started) {
    return;
  }

  started = true;

  if (isGatewayEnabled()) {
    startDiscordGateway(serverConfig.discord.botToken);
  }

  try {
    await logGuildRolesForAuthentikSetup();
  } catch (error) {
    console.error("[discord-bot] Failed to list guild roles:", error);
  }
}

export function stopDiscordBot(): void {
  stopDiscordGateway();
  started = false;
}
