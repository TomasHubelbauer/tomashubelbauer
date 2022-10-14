import name from './name.js';

// https://docs.github.com/en/developers/webhooks-and-events/github-event-types#commitcommentevent
export default function writeCommitCommentEvent(event) {
  switch (event.payload.action) {
    // Handle GitHub API not responding as documented (missing payload `action` field)
    case undefined:
    case 'created': {
      // TODO: Flesh this out properly
      return `💬 commented on a commit\n  in${name(event.repo.name)}`;
    }
    default: {
      throw new Error(`Unhandled commit comment event ${event.payload.action}.`);
    }
  }
}
