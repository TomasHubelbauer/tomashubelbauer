/* https://github.com/TomasHubelbauer/node-extract-zip */

import util from "util";
import zlib from "zlib";

/**
 * Extracts a single file from a single-file DEFLATE ZIP archive.
 */
export default async function extract(buffer: Buffer) {
  // https://en.wikipedia.org/wiki/ZIP_(file_format)#End_of_central_directory_record_(EOCD)
  const eocdIndex = buffer.indexOf(
    (0x504b0506).toString(16) /* BE not LE */,
    0,
    "hex"
  );
  if (eocdIndex === -1) {
    throw new Error("0x06054b50 (EOCD) not found!");
  }

  if (
    buffer.readUint16LE(eocdIndex + 4) !== 0 ||
    buffer.readUint16LE(eocdIndex + 6) !== 0
  ) {
    throw new Error(
      "EOCD disk number or CD disk number is not zero; is multi-disk"
    );
  }

  if (buffer.readUint16LE(eocdIndex + 8) !== 1) {
    throw new Error("CD count is not one; is multi-file");
  }

  // https://en.wikipedia.org/wiki/ZIP_(file_format)#Central_directory_file_header
  const cdIndex = buffer.readUint32LE(eocdIndex + 16);
  if (buffer.readUInt32LE(cdIndex) !== 0x02014b50) {
    throw new Error("0x02014b50 (CD) not found!");
  }

  if (buffer.readUint16LE(cdIndex + 10) !== 8) {
    throw new Error(
      "CD compression method is not 8 (DEFLATE); is uncompressed?"
    );
  }

  const size = buffer.readUint32LE(cdIndex + 20);

  // https://en.wikipedia.org/wiki/ZIP_(file_format)#Local_file_header
  const lfhIndex = buffer.readUint32LE(cdIndex + 42);
  if (buffer.readUInt32LE(lfhIndex) !== 0x04034b50) {
    throw new Error("0x04034b50 (LFH) not found!");
  }

  if (buffer.readUint16LE(lfhIndex + 8) !== 8) {
    throw new Error(
      "LFH compression method is not 8 (DEFLATE); is uncompressed?"
    );
  }

  const offset =
    lfhIndex +
    30 +
    buffer.readUint16LE(lfhIndex + 26) +
    buffer.readUint16LE(lfhIndex + 28);

  return util.promisify(zlib.inflateRaw)(
    buffer.subarray(offset, offset + size)
  );
}
