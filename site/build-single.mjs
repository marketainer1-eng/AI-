// site/index.html + site/assets/* → site/dist/index.html (이미지가 모두 내장된 단일 HTML 파일)
// 사용법: node site/build-single.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const mime = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", svg: "image/svg+xml", gif: "image/gif" };

const html = readFileSync(join(dir, "index.html"), "utf8").replace(
  /assets\/([\w.-]+\.(jpe?g|png|webp|svg|gif))/g,
  (_, file, ext) => `data:${mime[ext]};base64,${readFileSync(join(dir, "assets", file)).toString("base64")}`,
);

mkdirSync(join(dir, "dist"), { recursive: true });
writeFileSync(join(dir, "dist", "index.html"), html);
console.log(`site/dist/index.html (${(html.length / 1024 / 1024).toFixed(1)} MB)`);
