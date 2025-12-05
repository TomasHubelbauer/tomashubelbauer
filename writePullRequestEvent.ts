import name from "./name.ts";
import pr from "./pr.ts";
import type { PullRequestPayload, Event } from "./types.ts";

export default function writePullRequestEvent(
  event: Event<PullRequestPayload>
) {
  return `🎁 ${event.payload.action}${pr(
    event.payload.pull_request
  )}\n  in${name(event.repo.name)}`;
}
