import name from './name.js';

// Note that this is a virtual, fake event created above by myself
export default function writeRepositoryEvent(event) {
  switch (event.payload.action) {
    case 'starred': {
      const delta = event.payload.new - event.payload.old;
      const change = delta < 0 ? '📉 lost' : '📈 received';
      const word = delta !== 1 && delta !== -1 ? delta + ' stars' : 'a star';
      return `⭐️${change} ${word} on ${name(event.repo.name)} (now ${event.payload.new || 'none'})`;
    }

    case 'forked': {
      const delta = event.payload.new - event.payload.old;
      const change = delta < 0 ? '📉 lost' : '📈 received';
      const word = delta !== 1 && delta !== -1 ? delta + 'forks' : 'a fork';
      return `🍴${change} ${word} on ${name(event.repo.name)} (now ${event.payload.new || 'none'})`;
    }

    default: {
      throw new Error(`Unhandled follower event action ${event.payload.action}.`);
    }
  }
}
