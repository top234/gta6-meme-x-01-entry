// gta6-meme-x-01 entrypoint (Node 22, standard library only).
//
// The entry is the X post itself: the house reads the post from X and
// judges its first picture plus its text. This program's only job is to
// hand the post's address to the gate by copying POST.json from the
// repository root into the output directory. It also sanity-checks the
// file first, so a malformed POST.json fails loudly instead of silently
// producing an entry the gate would refuse.
//
// Run it the way the grader does:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
//
// No network, no wall clock, no files outside the repository, and the
// output directory itself is never removed (the grader mounts it).

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// An X post address, as X shows it: https://x.com/<handle>/status/<id>
// (twitter.com, www./mobile. prefixes and /i/web/status/<id> are read
// past by the house, but we only ever write the plain x.com form).
const POST_URL =
  /^https:\/\/(www\.|mobile\.)?(x|twitter)\.com\/([^/]+\/status\/\d+|i\/web\/status\/\d+)$/;

// The gate refuses a POST.json over 16384 bytes; fail here instead.
const MAX_POST_BYTES = 16384;

function fail(message) {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

mkdirSync(OUTPUT_DIR, { recursive: true });

let raw;
try {
  raw = readFileSync(join(BOT_DIR, 'POST.json'), 'utf8');
} catch (err) {
  fail(`could not read POST.json from ${BOT_DIR}: ${err.message}`);
}

if (Buffer.byteLength(raw, 'utf8') > MAX_POST_BYTES) {
  fail(`POST.json is over ${MAX_POST_BYTES} bytes, the gate would refuse it`);
}

let post;
try {
  post = JSON.parse(raw);
} catch (err) {
  fail(`POST.json is not valid JSON: ${err.message}`);
}

if (!post || typeof post !== 'object' || Array.isArray(post)) {
  fail('POST.json must be a JSON object like {"url": "https://x.com/<handle>/status/<id>"}');
}

if (typeof post.url !== 'string' || !POST_URL.test(post.url)) {
  fail(`POST.json url is not an X post address: ${JSON.stringify(post.url)}`);
}

try {
  writeFileSync(join(OUTPUT_DIR, 'POST.json'), raw, 'utf8');
} catch (err) {
  fail(`could not write POST.json to ${OUTPUT_DIR}: ${err.message}`);
}
