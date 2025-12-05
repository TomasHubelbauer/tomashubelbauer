import { expect, test } from "bun:test";
import { $ } from "bun";
import extract from "./extract.ts";

test(extract.name, async () => {
  await $`echo 'Hello, world!' | 7z a test.zip -si`;

  try {
    expect(
      new TextDecoder().decode(
        await extract(Buffer.from(await Bun.file("test.zip").arrayBuffer()))
      )
    ).toBe("Hello, world!\n");
  } finally {
    await $`rm -f test.zip`;
  }
});
