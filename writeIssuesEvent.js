import issue from './issue.js';
import name from './name.js';

// https://docs.github.com/en/developers/webhooks-and-events/github-event-types#issuesevent
export default function writeIssuesEvent(event) {
  switch (event.payload.action) {
    case 'created': {
      return `🎫 opened${issue(event.payload.issue)}\n  in${name(event.repo.name)}`;
    }
    case 'opened': {
      return `🎫 opened${issue(event.payload.issue)}\n  in${name(event.repo.name)}`;
    }
    case 'reopened': {
      return `♻️🎫 reopened${issue(event.payload.issue)}\n  in${name(event.repo.name)}`;
    }
    case 'closed': {
      return `🗑🎫 closed${issue(event.payload.issue)}\n  in${name(event.repo.name)}`;
    }
    default: {
      throw new Error(`Unhandled issues event ${event.payload.action}.`);
    }
  }
}
