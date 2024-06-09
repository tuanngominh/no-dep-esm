import crypto from "crypto";
import { StringDecoder } from 'string_decoder';
import { getEnv, APP_URL } from "./utils/env.mjs";

export function parseFormData(req, callback) {
  return new Promise((resolve, reject) => {
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
  
      resolve(fields);
    });    
  })
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

export function getUploadUrl(fileUri) {
  return getEnv(APP_URL) + `/upload/${fileUri}`
}
