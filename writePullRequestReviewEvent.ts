import name from "./name.ts";
import pr from "./pr.ts";
import type { PullRequestReviewPayload, Event } from "./types.ts";

// TODO: Distinguish between approval and rejection based on payload.review
export default function writePullRequestReviewEvent(
  event: Event<PullRequestReviewPayload>
) {
  return `✔ reviewed ${pr(event.payload.pull_request)}\n  in${name(
    event.repo.name
  )}`;
}
