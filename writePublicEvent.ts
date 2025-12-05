import name from "./name.ts";
import type { PublicPayload, Event } from "./types.ts";

export default function writePublicEvent(event: Event<PublicPayload>) {
  return `📨 published ${name(event.repo.name)}`;
}
