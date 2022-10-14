import name from './name.js';

// https://docs.github.com/en/developers/webhooks-and-events/github-event-types#releaseevent
export default function writeReleaseEvent(event) {
  return `🔪 cut [${event.payload.release.name}](${event.payload.release.html_url})\n  in${name(event.repo.name)}`;
}
