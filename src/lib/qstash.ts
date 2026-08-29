import { Client } from "@upstash/qstash";

let client: Client | null = null;

export function getQstashClient(): Client {
  if (!client) {
    client = new Client({ token: process.env.QSTASH_TOKEN! });
  }
  return client;
}
