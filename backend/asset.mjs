import fs from "node:fs/promises";
import path from "path";
import { getEnv, ASSET_DIR } from "./utils/env.mjs";

export async function asset(req, res) {
  const defaultContent = '/index.html';
  let file = req.url ?? defaultContent;
  if (req.url === '/') {
    file = defaultContent;
  }

  const contentType = getContentType(file);

  const webStaticPath = getEnv(ASSET_DIR);
  try {
    const content = await fs.readFile(webStaticPath + file);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (error) {
    res.writeHead(500);
    res.end(`There is error, ${error.code}`);
  }
}

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.txt': 'text/plain',
  '.jpg': 'image/jpeg',
  '.heic': 'image/heic',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.ico': 'image/x-icon'
};

export function getContentType(filePath) {
  const extension = path.extname(filePath).toLocaleLowerCase();
  return mimeTypes[extension];
}

