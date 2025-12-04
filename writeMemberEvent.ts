import name from './name.ts';

// https://docs.github.com/en/developers/webhooks-and-events/github-event-types#memberevent
export default function writeMemberEvent(event) {
  // TODO: Flesh this out properly
  return `👷‍♂️ ${event.payload.action} a member\n  in${name(event.repo.name)}`;
}
