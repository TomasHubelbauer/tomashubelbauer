import issue from "./issue.ts";
import name from "./name.ts";
import type { IssuePayload, Event } from "./types.ts";

export default function writeIssueCommentEvent(event: Event<IssuePayload>) {
  switch (event.payload.action) {
    case "created": {
      return `💬 commented on${issue(event.payload.issue)}\n  in${name(
        event.repo.name
      )}`;
    }
    default: {
      throw new Error(`Unhandled issue comment event ${event.payload.action}.`);
    }
  }
}
