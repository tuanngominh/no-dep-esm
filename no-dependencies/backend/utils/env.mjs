import path from "node:path";
import fs from 'node:fs';
import { URL } from "url";

export const ROOT_DIR = 'ROOT_DIR';
export const ASSET_DIR = 'ASSET_DIR';
export const UPLOAD_DIR = 'UPLOAD_DIR';
export const DB_FILE_PATH = 'DB_FILE_PATH';
export const APP_URL = 'APP_URL';
export const HOSTNAME = 'HOSTNAME';
export const PORT = 'PORT';
export const DB_TYPE = 'DB_TYPE'; // file, gsheet
export const CREDENTIALS = 'CREDENTIALS';
export const GSHEET_SERVICE_ACCOUNT_EMAIL = 'GSHEET_SERVICE_ACCOUNT_EMAIL';
export const GSHEET_SERVICE_ACCOUNT_KEY = 'GSHEET_SERVICE_ACCOUNT_KEY';
export const GSHEET_SHEET_ID = 'GSHEET_SHEET_ID';

const env = {
  [ROOT_DIR]: process.env[ROOT_DIR] ?? null,
  [ASSET_DIR]: process.env[ASSET_DIR] ?? null,
  [UPLOAD_DIR]: process.env[UPLOAD_DIR] ?? null,
  [DB_FILE_PATH]: process.env[DB_FILE_PATH] ?? null,
  [GSHEET_SERVICE_ACCOUNT_EMAIL]: process.env[GSHEET_SERVICE_ACCOUNT_EMAIL] ?? null,
  [GSHEET_SERVICE_ACCOUNT_KEY]: process.env[GSHEET_SERVICE_ACCOUNT_KEY] ?? null,
  [GSHEET_SHEET_ID]: process.env[GSHEET_SHEET_ID] ?? null,
  [APP_URL]: process.env[APP_URL] ?? null,
  [HOSTNAME]: 'localhost',
  [PORT]: 4200,
  [DB_TYPE]: null
};

function pathFromRoot(subFolder) {
  return new URL(subFolder, getEnv(ROOT_DIR)).pathname;
}

function getEnvFromFile(rootDir) {
  const envPath = new URL("./.env", rootDir);
  try {
    const envFileContent = fs.readFileSync(envPath, 'utf8');
    const envVars = envFileContent.split('\n');
    return envVars.reduce((accumulator, line) => {
      const [key, value] = line.split('=');
      if (key && value) {
        accumulator[key.trim()] = value.trim();
      }
      return accumulator;
    }, {})
  } catch(e) {
    console.info("No .env found");
    return {};
  }
}

export function initEnv(rootDir) {
  if (!env[ROOT_DIR]) {
    env[ROOT_DIR] = rootDir;
  }

  const envFromFile = getEnvFromFile(env[ROOT_DIR]);

  if (!env[ASSET_DIR]) {
    env[ASSET_DIR] = pathFromRoot("../frontend");
  }

  if (!env[UPLOAD_DIR]) {
    env[UPLOAD_DIR] = pathFromRoot("../upload");
  }

  if (!env[DB_FILE_PATH]) {
    env[DB_FILE_PATH] = pathFromRoot("../db/data.json");
  }

  if (!env[APP_URL]) {
    env[APP_URL] = `http://${env[HOSTNAME]}:${env[PORT]}`;
  }

  const keysInEnvFile = [
    DB_TYPE,
    GSHEET_SERVICE_ACCOUNT_EMAIL,
    GSHEET_SERVICE_ACCOUNT_KEY,
    GSHEET_SHEET_ID
  ]
  for (const key of keysInEnvFile) {
    if (key in envFromFile) {
      env[key] = envFromFile[key]
    }
  }
}

export function setEnv(name, value) {
  env[name] = value;
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
