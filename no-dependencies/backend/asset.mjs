import { fileURLToPath } from "url";
import fs from "node:fs/promises";
import path from "path";

let webStaticPath;
export function setStaticWebPath(relativeStaticPath) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  webStaticPath = path.resolve(__dirname + "/" + relativeStaticPath);
}

export async function asset(req, res) {
  const defaultContent = '/index.html';
  let file = req.url ?? defaultContent;
  if (req.url === '/') {
    file = defaultContent;
  }

  const contentType = getContentType(file);

  try {
    const content = await fs.readFile(webStaticPath + file, { encoding: 'utf8' });
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content, 'utf-8');
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
  '.pdf': 'application/pdf'
};

export function getContentType(filePath) {
  const extension = path.extname(filePath).toLocaleLowerCase();
  return mimeTypes[extension];
}

