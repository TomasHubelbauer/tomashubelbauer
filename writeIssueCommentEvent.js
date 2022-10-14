import issue from './issue.js';
import name from './name.js';

// https://docs.github.com/en/developers/webhooks-and-events/github-event-types#issuecommentevent
export default function writeIssueCommentEvent(event) {
  switch (event.payload.action) {
    case 'created': {
      return `💬 commented on${issue(event.payload.issue)}\n  in${name(event.repo.name)}`;
    }
    default: {
      throw new Error(`Unhandled issue comment event ${event.payload.action}.`);
    }
  }
}
