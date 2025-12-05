import name from "./name.ts";
import pr from "./pr.ts";
import type { PullRequestReviewCommentPayload, Event } from "./types.ts";

export default function writePullRequestReviewCommentEvent(
  event: Event<PullRequestReviewCommentPayload>
) {
  return `💬 ${event.payload.action}${pr(
    event.payload.pull_request
  )}\n  in${name(event.repo.name)}`;
}
