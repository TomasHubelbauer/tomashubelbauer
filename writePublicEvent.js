import name from './name.js';

// https://docs.github.com/en/developers/webhooks-and-events/github-event-types#publicevent
export default function writePublicEvent(event) {
  return `📨 published ${name(event.repo.name)}`;
}
