import name from "./name.ts";
import type { CommitCommentPayload, Event } from "./types.ts";

export default function writeCommitCommentEvent(
  event: Event<CommitCommentPayload>
) {
  switch (event.payload.action) {
    // Handle GitHub API not responding as documented (missing payload `action` field)
    case undefined:
    case "created": {
      // TODO: Flesh this out properly
      return `💬 commented on a commit\n  in${name(event.repo.name)}`;
    }
    default: {
      throw new Error(
        `Unhandled commit comment event ${event.payload.action}.`
      );
    }
  }
}
