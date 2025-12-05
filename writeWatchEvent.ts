import name from "./name.ts";
import type { Event, WatchPayload } from "./types.ts";

export default function writeWatchEvent(event: Event<WatchPayload>) {
  // TODO: Handle the `payload.action` once they fix it so it is not always `started` (sic)
  return `⭐️ starred${name(event.repo.name)}`;
}
