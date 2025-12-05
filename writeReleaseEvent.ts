import name from "./name.ts";
import type { ReleasePayload, Event } from "./types.ts";

export default function writeReleaseEvent(event: Event<ReleasePayload>) {
  return `🔪 cut [${event.payload.release.name}](${
    event.payload.release.html_url
  })\n  in${name(event.repo.name)}`;
}
