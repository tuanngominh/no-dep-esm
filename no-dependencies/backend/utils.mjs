import { fileURLToPath } from "url";
import crypto from "crypto";
import { StringDecoder } from 'string_decoder';
import path from "node:path";

export function parseFormData(req, callback) {
  const decoder = new StringDecoder('utf-8');
  let body = '';

  req.on('data', (chunk) => {
    body += decoder.write(chunk);
  });

  req.on('end', () => {
    const boundary = '--' + req.headers['content-type'].split('; ')[1].replace('boundary=', '');
    const parts = body.split(boundary).filter(part => part.trim() !== '' && part.trim() !== '--');
    const fields = {};

    parts.forEach(part => {
      const [header, value] = part.split('\r\n\r\n');
      const nameMatch = header.match(/name="([^"]+)"/);
      if (nameMatch) {
        const name = nameMatch[1];
        fields[name] = value.replace(/\r\n$/, '');
      }
    });

    callback(fields);
  });
}

export function shortId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.randomBytes(8);
  let id = '';
  for (let i = 0; i < bytes.length; i++) {
    id += chars[bytes[i] % chars.length];
  }
  return id;
}


export const ROOT_DIR = 'ROOT_DIR';
export const ASSET_DIR = 'ASSET_DIR';
export const UPLOAD_DIR = 'UPLOAD_DIR';
export const DB_FILE_PATH = 'DB_FILE_PATH';
export const URL = 'URL';
export const HOSTNAME = 'HOSTNAME';
export const PORT = 'PORT';

const env = {
  [ROOT_DIR]: process.env[ROOT_DIR] ?? null,
  [ASSET_DIR]: process.env[ASSET_DIR] ?? null,
  [UPLOAD_DIR]: process.env[UPLOAD_DIR] ?? null,
  [DB_FILE_PATH]: process.env[DB_FILE_PATH] ?? null,
  [URL]: process.env[URL] ?? null,
  [HOSTNAME]: 'localhost',
  [PORT]: 4200
};

export function initEnv() {
  if (!env[ROOT_DIR]) {
    const __filename = fileURLToPath(import.meta.url);
    env[ROOT_DIR] = path.dirname(__filename);
  }

  if (!env[ASSET_DIR]) {
    env[ASSET_DIR] = path.resolve(env[ROOT_DIR] + "/../frontend");
  }

  if (!env[UPLOAD_DIR]) {
    env[UPLOAD_DIR] = path.resolve(env[ROOT_DIR] + "/../upload");
  }

  if (!env[DB_FILE_PATH]) {
    env[DB_FILE_PATH] = path.resolve(env[ROOT_DIR] + "/../db/data.json");
  }

  if (!env[URL]) {
    env[URL] = `http://${env[HOSTNAME]}:${env[PORT]}`;
  }
}

export function setEnv(name, value) {
  env[name] = value
}

export function getEnv(name) {
  if (process.env[name]) {
    return process.env[name];
  }

  if (name in env) {
    return env[name];
  }

  throw new Error(`env ${name} not found`);
}

export function getUploadUrl(fileUri) {
  return getEnv(URL) + `/upload/${fileUri}`
}
