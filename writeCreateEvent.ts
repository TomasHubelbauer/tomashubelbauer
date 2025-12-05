import branch from "./branch.ts";
import name from "./name.ts";
import type { CreatePayload, Event } from "./types.ts";

export default function writeCreateEvent(event: Event<CreatePayload>) {
  switch (event.payload.ref_type) {
    case "branch": {
      return `🌳 created branch ${branch(event.repo, event.payload)}`;
    }
    case "repository": {
      return `📓 created repository${name(event.repo.name)}`;
    }
    case "tag": {
      return `🏷 created tag \`${event.payload.ref}\` in${name(
        event.repo.name
      )}`;
    }
    default: {
      throw new Error(`Unhandled ref type ${event.payload.ref_type}.`);
    }
  }
}
