import issue from "./issue.ts";
import name from "./name.ts";
import type { IssuePayload, Event } from "./types.ts";

export default function writeIssuesEvent(event: Event<IssuePayload>) {
  switch (event.payload.action) {
    case "created": {
      return `🎫 opened${issue(event.payload.issue)}\n  in${name(
        event.repo.name
      )}`;
    }
    case "opened": {
      return `🎫 opened${issue(event.payload.issue)}\n  in${name(
        event.repo.name
      )}`;
    }
    case "reopened": {
      return `♻️🎫 reopened${issue(event.payload.issue)}\n  in${name(
        event.repo.name
      )}`;
    }
    case "closed": {
      return `🗑🎫 closed${issue(event.payload.issue)}\n  in${name(
        event.repo.name
      )}`;
    }
    case "labeled": {
      return `🏷🎫 labeled${issue(event.payload.issue)}\n  in${name(
        event.repo.name
      )}`;
    }
    default: {
      throw new Error(`Unhandled issues event ${event.payload.action}.`);
    }
  }
}
