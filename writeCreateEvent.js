import branch from './branch.js';
import name from './name.js';

// https://docs.github.com/en/developers/webhooks-and-events/github-event-types#createevent
export default function writeCreateEvent(event) {
  switch (event.payload.ref_type) {
    case 'branch': {
      return `🌳 created branch ${branch(event.repo, event.payload)}`;
    }
    case 'repository': {
      return `📓 created repository${name(event.repo.name)}`;
    }
    case 'tag': {
      return `🏷 created tag \`${event.payload.ref}\` in${name(event.repo.name)}`;
    }
    default: {
      throw new Error(`Unhandled ref type ${event.payload.ref_type}.`);
    }
  }
}
