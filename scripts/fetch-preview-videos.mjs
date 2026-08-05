/**
 * GitHub Releases の Preview 用動画を public/snippets/ に取得する。
 * Releases 直リンクは Content-Disposition: attachment のため <video> で再生できないので、
 * ビルド／dev 前に同一オリジン配信用へコピーする。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = "a-ofuji-vista/petacss";
const RELEASE_TAG = "assets-v1";
const FILES = ["bg-video.webm", "bg-video.mp4"];

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "snippets");

async function fetchFile(name) {
  const outPath = path.join(outDir, name);
  if (fs.existsSync(outPath) && fs.statSync(outPath).size > 0) {
    console.log(`[fetch-preview-videos] skip (exists): ${name}`);
    return;
  }

  const url = `https://github.com/${REPO}/releases/download/${RELEASE_TAG}/${name}`;
  console.log(`[fetch-preview-videos] downloading: ${name}`);

  const response = await fetch(url, {
    headers: { Accept: "application/octet-stream" },
    redirect: "follow",
  });
  if (!response.ok) {
    throw new Error(`Failed to download ${url} (status: ${response.status})`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, buffer);
  console.log(`[fetch-preview-videos] wrote: ${name} (${buffer.length} bytes)`);
}

await Promise.all(FILES.map(fetchFile));
