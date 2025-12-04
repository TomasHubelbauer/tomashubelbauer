import name from './name.ts';
import pr from './pr.ts';

// https://docs.github.com/en/developers/webhooks-and-events/github-event-types#pullrequestevent
export default function writePullRequestEvent(event) {
  return `🎁 ${event.payload.action}${pr(event.payload.pull_request)}\n  in${name(event.repo.name)}`;
}
