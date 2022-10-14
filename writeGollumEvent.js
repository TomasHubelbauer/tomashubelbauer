import name from './name.js';

// https://docs.github.com/en/developers/webhooks-and-events/github-event-types#gollumevent
export default function writeGollumEvent(event) {
  // TODO: Flesh this message out further
  return `📃 updated${name(event.repo.name)}\n  wiki page`;
}
