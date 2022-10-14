import name from './name.js';

// https://docs.github.com/en/developers/webhooks-and-events/github-event-types#forkevent
export default function writeForkEvent(event) {
  return `🍴 forked${name(event.repo.name)}\n  into${name(event.payload.forkee.full_name)}`;
}
