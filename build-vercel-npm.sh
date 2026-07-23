#!/usr/bin/env bash
set -euo pipefail
echo "[1/3] vite build"
npx vite build
echo "[2/3] assemble .vercel/output"
rm -rf .vercel/output
mkdir -p .vercel/output/functions/render.func
cp -R dist/client .vercel/output/static
rm -f .vercel/output/static/index.html
echo "[3/3] bundle SSR handler"
npx esbuild vercel-entry.ts --bundle --platform=node --outfile=.vercel/output/functions/render.func/index.mjs --external:@neondatabase/serverless
cat > .vercel/output/functions/render.func/.vc-config.json << 'CFG'
{"runtime":"nodejs22.x","handler":"index.mjs","launcherType":"Nodejs","supportsResponseStreaming":true}
CFG
cat > .vercel/output/config.json << 'CFG'
{"version":3,"routes":[{"handle":"filesystem"},{"src":"/(.*)","dest":"/render"}]}
CFG
echo "done"
