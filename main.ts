// News-image entry for 23 November 2026.
//
// The picture is the entry.png beside this file. This program checks that
// it really is the 1024x1024 PNG the gate expects, then copies it to the
// output directory as entry.png. Node standard library only.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

const EXPECTED_WIDTH = 1024;
const EXPECTED_HEIGHT = 1024;

function fail(message: string): never {
  console.error(`entry: ${message}`);
  process.exit(1);
}

function readPngDimensions(bytes: Buffer): { width: number; height: number } {
  if (!bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    fail('entry.png is not a PNG file (bad signature)');
  }
  if (bytes.length < 24 || bytes.toString('ascii', 12, 16) !== 'IHDR') {
    fail('entry.png has no IHDR chunk');
  }
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, 'entry.png');
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');
const target = join(outDir, 'entry.png');

let image: Buffer;
try {
  image = readFileSync(source);
} catch {
  fail(`cannot read ${source}`);
}

const { width, height } = readPngDimensions(image);
if (width !== EXPECTED_WIDTH || height !== EXPECTED_HEIGHT) {
  fail(
    `entry.png is ${width}x${height}, expected ` +
      `${EXPECTED_WIDTH}x${EXPECTED_HEIGHT}`,
  );
}

mkdirSync(outDir, { recursive: true });
copyFileSync(source, target);

// Verify the copy before reporting success: read it back and confirm it
// is still the same PNG (signature intact) and no byte was lost.
const copied = readFileSync(target);
if (copied.length !== image.length) {
  fail(
    `copied entry.png is ${copied.length} bytes, ` +
      `expected ${image.length} bytes`,
  );
}
if (!copied.subarray(0, 8).equals(PNG_SIGNATURE)) {
  fail('copied entry.png lost its PNG signature');
}

const copiedSize = statSync(target).size;
console.log(
  `entry.png: ${width}x${height} PNG, ${copiedSize} bytes -> ${target}`,
);
