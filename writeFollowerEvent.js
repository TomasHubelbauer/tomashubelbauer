// Note that this is a virtual, fake event created above by myself
export default function writeFollowerEvent(event) {
  switch (event.payload.action) {
    case 'followed': {
      return `🤝 followed by [${event.payload.newFollower}](https://github.com/${event.payload.newFollower})`;
    }
    case 'unfollowed': {
      let markdown = `💔 unfollowed by [${event.payload.unfollower}](https://github.com/${event.payload.unfollower})`;
      if (event.payload.duration !== undefined) {
        markdown += ` after ${event.payload.duration} days`;
      }

      return markdown;
    }
    default: {
      throw new Error(`Unhandled follower event action ${event.payload.action}.`);
    }
  }
}
