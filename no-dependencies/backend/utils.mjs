import crypto from "crypto";
import { StringDecoder } from 'string_decoder';

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


const envs = {};
export function setEnv(name, value) {
  envs[name] = value
}

export function getEnv(name) {
  if (name in envs) {
    return envs[name];
  }
  throw new Error(`env ${name} not found`);
}

export function getUploadUrl(fileUri) {
  return getEnv('url') + `/upload/${fileUri}`
}