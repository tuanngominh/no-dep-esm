import { readFile } from 'fs/promises';
import { getEnv, GSHEET_SERVICE_ACCOUNT_KEY, GSHEET_SERVICE_ACCOUNT_EMAIL } from './env.mjs';
import { createSign } from 'crypto';

async function settings() {
  const serviceAccountFilePath = getEnv(GSHEET_SERVICE_ACCOUNT_KEY);

  const serviceAccountContent = await readFile(serviceAccountFilePath, 'utf8');
  const SERVICE_ACCOUNT_KEY_PRIVATE_KEY = JSON.parse(serviceAccountContent).private_key;

  return {
    SERVICE_ACCOUNT_EMAIL: getEnv(GSHEET_SERVICE_ACCOUNT_EMAIL),
    SERVICE_ACCOUNT_KEY_PRIVATE_KEY,
    SCOPE: 'https://www.googleapis.com/auth/spreadsheets'
  };
}

async function createJwt() {
  const {
    SERVICE_ACCOUNT_EMAIL, SERVICE_ACCOUNT_KEY_PRIVATE_KEY, SCOPE
  } = await settings();

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

  const encodeBase64 = (obj) => Buffer.from(JSON.stringify(obj))
    .toString('base64')
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const headerBase64 = encodeBase64(header);
  const claimSetBase64 = encodeBase64(claimSet);

  const unsignedJwt = `${headerBase64}.${claimSetBase64}`;

  const sign = createSign('RSA-SHA256');
  sign.update(unsignedJwt);
  const signatureBase64 = sign.sign(SERVICE_ACCOUNT_KEY_PRIVATE_KEY, 'base64')
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${unsignedJwt}.${signatureBase64}`;
}

export async function getAccessToken() {
  const jwt = await createJwt();
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&\
assertion=${jwt}`
  });
  if (!response.ok) {
    throw new Error(`Get access token. HTTP error! status: ${response.status}`);
  }
  const responseBody = await response.json();
  return responseBody.access_token;
}

