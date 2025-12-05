import commit from "./commit.ts";
import type { PushPayload, Event } from "./types.ts";

export default function writePushEvent(event: Event<PushPayload>) {
  return `📌 pushed${commit(event.repo, event.payload)}`;
}
