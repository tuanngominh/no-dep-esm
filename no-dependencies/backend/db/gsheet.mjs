import https from 'https';
import { createSign } from 'crypto';
import { readFile } from 'node:fs/promises';
import { GSHEET_SERVICE_ACCOUNT_EMAIL, GSHEET_SERVICE_ACCOUNT_KEY, GSHEET_SHEET_ID, getEnv } from "../utils/env.mjs";
import { shortId } from '../utils.mjs';

/**
 * @typedef {import('../types.mjs').Todo} Todo
 */

async function settings() {
  const serviceAccountFilePath = getEnv(GSHEET_SERVICE_ACCOUNT_KEY);

  const serviceAccountContent = await readFile(serviceAccountFilePath, 'utf8');
  const SERVICE_ACCOUNT_KEY_PRIVATE_KEY = JSON.parse(serviceAccountContent).private_key;
  
  return {
    SERVICE_ACCOUNT_EMAIL: getEnv(GSHEET_SERVICE_ACCOUNT_EMAIL),
    SERVICE_ACCOUNT_KEY_PRIVATE_KEY,
    SCOPE: 'https://www.googleapis.com/auth/spreadsheets'
  }
}

async function createJwt() {
  const {
    SERVICE_ACCOUNT_EMAIL,
    SERVICE_ACCOUNT_KEY_PRIVATE_KEY,
    SCOPE
  } = await settings();
  console.log({SERVICE_ACCOUNT_EMAIL,
    SERVICE_ACCOUNT_KEY_PRIVATE_KEY,
    SCOPE});

  const header = {
      alg: "RS256",
      typ: "JWT"
  };

  const currentTime = Math.floor(Date.now() / 1000);
  const claimSet = {
      iss: SERVICE_ACCOUNT_EMAIL,
      scope: SCOPE,
      aud: "https://oauth2.googleapis.com/token",
      exp: currentTime + 3600,
      iat: currentTime
  };

  const encodeBase64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

  const headerBase64 = encodeBase64(header);
  const claimSetBase64 = encodeBase64(claimSet);

  const unsignedJwt = `${headerBase64}.${claimSetBase64}`;

  const sign = createSign('RSA-SHA256');
  sign.update(unsignedJwt);
  const signatureBase64 = sign.sign(SERVICE_ACCOUNT_KEY_PRIVATE_KEY, 'base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${unsignedJwt}.${signatureBase64}`;
};

async function getAccessToken() {
  const jwt = await createJwt();
  const data = `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`;
  const options = {
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': data.length
      }
  };

  return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
          let body = '';
          res.on('data', (chunk) => body += chunk);
          res.on('end', () => resolve(JSON.parse(body).access_token));
      });

      req.on('error', (e) => reject(e));
      req.write(data);
      req.end();
  });
};

async function fetchRequest(uri, options) {
  const accessToken = await getAccessToken();
  const spreadsheetId = getEnv(GSHEET_SHEET_ID);
  const basePath = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values`;
  const defaultOptions = {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  };

  const finalOptions = {
    ...defaultOptions,
    ...options,    
    headers: {
      ...defaultOptions.headers,
      ...!!options.headers && options.headers
    }
  }
  
  const url = basePath + uri;

  const response = await fetch(url, finalOptions);
  if (!response.ok) {
      const error = await response.json();
      throw new Error(`HTTP error! status: ${response.status}, message: ${error.error.message}`);
  }
  return response.json();
}

/**
 * @param {Todo} object
 */
export async function create(object) {
  const range = 'Sheet1!A:D';
  const id = shortId();
  const values = [[id, object.name]];
  const data = JSON.stringify({ values });
  const url = `/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
  const options = {
    method: 'POST',
    body: data,
  }
  await fetchRequest(url, options);
  return id;
}

export function list() {
  return [];
}