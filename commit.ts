import name from "./name.ts";
import type { PushPayload, Repo } from "./types.ts";

export default function commit(repo: Repo, payload: PushPayload) {
  // TODO: Find out a new way to get the commit name
  return `\n  [\`${payload.head.slice(0, 7)}\`](https://github.com/${
    repo.name
  }/commit/${payload.head})\n  into${name(repo.name)}`;
}
