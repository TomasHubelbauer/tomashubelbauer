import name from "./name.ts";
import type { CreatePayload, Repo } from "./types.ts";

export default function branch(repo: Repo, payload: CreatePayload) {
  return `\n  [\`${payload.ref}\`](https://github.com/${repo.name}/tree/${
    payload.ref
  })\n  in${name(repo.name)}`;
}
