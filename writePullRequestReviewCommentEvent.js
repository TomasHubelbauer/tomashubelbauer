import name from './name.js';
import pr from './pr.js';

// https://docs.github.com/en/developers/webhooks-and-events/events/github-event-types#pullrequestreviewcommentevent
export default function writePullRequestReviewCommentEvent(event) {
  return `💬 ${event.payload.action}${pr(event.payload.pull_request)}\n  in${name(event.repo.name)}`;
}
