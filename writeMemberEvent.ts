import name from "./name.ts";
import type { MemberPayload, Event } from "./types.ts";

export default function writeMemberEvent(event: Event<MemberPayload>) {
  // TODO: Flesh this out properly
  return `👷‍♂️ ${event.payload.action} a member\n  in${name(event.repo.name)}`;
}
