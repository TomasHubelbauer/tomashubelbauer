import name from "./name.ts";
import type { ForkPayload, Event } from "./types.ts";

export default function writeForkEvent(event: Event<ForkPayload>) {
  return `🍴 forked${name(event.repo.name)}\n  into${name(
    event.payload.forkee.full_name
  )}`;
}
