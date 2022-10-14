import name from './name.js';
import pr from './pr.js';

// https://docs.github.com/en/developers/webhooks-and-events/events/github-event-types#pullrequestreviewevent
// TODO: Distinguish between approval and rejection based on payload.review
export default function writePullRequestReviewEvent(event) {
  return `✔ reviewed ${pr(event.payload.pull_request)}\n  in${name(event.repo.name)}`;
}
