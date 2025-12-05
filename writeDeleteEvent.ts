import name from "./name.ts";
import type { DeletePayload, Event } from "./types.ts";

// Note that this event does not include repository deletions
export default function writeDeleteEvent(event: Event<DeletePayload>) {
  switch (event.payload.ref_type) {
    case "tag": {
      return `🗑🏷 deleted tag \`${event.payload.ref}\` in${name(
        event.repo.name
      )}`;
    }
    case "branch": {
      return `🗑🌳 deleted branch \`${event.payload.ref}\` in${name(
        event.repo.name
      )}`;
    }
    default: {
      throw new Error(`Unhandled ref type ${event.payload.ref_type}.`);
    }
  }
}
