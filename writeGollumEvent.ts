import name from "./name.ts";
import type { Event, GollumPayload } from "./types.ts";

export default function writeGollumEvent(event: Event<GollumPayload>) {
  // TODO: Flesh this message out further
  return `📃 updated${name(event.repo.name)}\n  wiki page`;
}
