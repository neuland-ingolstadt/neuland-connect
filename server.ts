import {
  startDiscordBot,
  stopDiscordBot,
} from "#/lib/integrations/discord/bot-lifecycle.server";

void startDiscordBot();

void import("#/lib/authentik/client").then(({ getManagedIntegrationMaps }) => {
  void getManagedIntegrationMaps().catch(() => {});
});

if (typeof process !== "undefined") {
  const shutdown = () => {
    stopDiscordBot();
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

export default {
  async fetch(_request: Request): Promise<Response | undefined> {
    return undefined;
  },
};
