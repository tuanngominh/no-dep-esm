import { createSign } from 'crypto';
import { readFile } from 'node:fs/promises';
import { GSHEET_SERVICE_ACCOUNT_EMAIL, GSHEET_SERVICE_ACCOUNT_KEY, GSHEET_SHEET_ID, getEnv } from "../utils/env.mjs";
import { shortId } from '../utils.mjs';
import {toKeyValue, toNested} from '../utils/json-csv.mjs';

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
};

async function getAccessToken() {
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
};

async function fetchRequest(uri, options = {}) {
  const accessToken = await getAccessToken();
  const spreadsheetId = getEnv(GSHEET_SHEET_ID);
  const basePath = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  const defaultOptions = {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    method: 'GET'
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
    throw new Error(`Fetch gsheet. HTTP error! status: ${response.status}, message: ${error.error.message}`);
  }
  return response.json();
}

const sheetId = 'Sheet1';
const schema = {
  id: 'string',
  name: 'string'
}

/**
 * If the sheet has existing data, validate if the local schema matches with those data.
 * Steps:
 * - Get the first row in gsheet, this assumes to be header columns.
 * - Check if header columns name matching with local schema.
 */
async function validateSchema(localSchema) {
  const result = await fetchRequest(`/values/${sheetId}!1:1`);
    
  if (!(result?.values?.length > 0)) {
    return 'no_schema'
  }
      
  const localHeader = Object.keys(localSchema);
  const gsheetHeader = result.values[0];
  if (
    gsheetHeader.length === localHeader.length &&
    localHeader.every((value, index) => value === gsheetHeader[index])
  ) {
    return 'matched_schema';
  } else {
    return 'non_matched_schema';
  }
}

/**
 * @param {Todo} object
 */
export async function create(object) {
  const range = `${sheetId}!A:D`;
  const id = shortId();
  const keyValues = toKeyValue({
    id,
    ...object
  }, schema);

  const values = Object.values(keyValues);

  const validateResult = await validateSchema(schema);
  const headers = Object.keys(schema);
  let rows = [];
  switch(validateResult) {
    case 'no_schema': {
      rows = [
        headers,
        values
      ];
      break;
    }
    case 'matched_schema': {
      rows = [values];
      break;
    }
    case 'non_matched_schema': {
      throw new Error(`Insert to gsheet failed, target schema doesn't match`);
    }
  }

  const data = JSON.stringify({ values: rows });
  const url = `/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
  const options = {
    method: 'POST',
    body: data,
  }
  await fetchRequest(url, options);
  return id;
}

export async function list() {
  return getAllGsheetRows();
}

async function getGsheetRowIndexByItemId(todoId) {
  // https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/getByDataFilter
  const url = `:getByDataFilter`;
  const result = await fetchRequest(url, {
    method: 'POST',
    body: JSON.stringify({
      dataFilters: [
        {
          gridRange: {
              sheetId: 0,
              startColumnIndex: 0,
              endColumnIndex: 1,
          }
        }
      ],
      includeGridData: true
    }),
  });

  const rows = result?.sheets?.[0]?.data?.[0]?.rowData;
  if ((rows?.length > 0)) {
    for (let i = 0; i < rows.length; i++) {
      if (rows[i]?.values[0]?.formattedValue === todoId) {
        return i;
      }
    }
  }
  return null
}

async function getAllGsheetRows() {
  const url = `/values/${sheetId}`;
  const result = await fetchRequest(url);
  if (result?.values?.length > 1) {
    const [headers, ...values] = result.values;
    return toNested(values, schema);
  }
  return [];
}

async function getGsheetRowByItemId(todoId) {
  const rows = await getAllGsheetRows();
  const found = rows.filter(_ => _.id === todoId);
  if (found.length > 0) {
    return found[0]
  }
  return null;
}

export async function remove(id) {
  const rowIndex = await getGsheetRowIndexByItemId(id);
  if (!Number.isInteger(rowIndex)) {
    throw new Error(`There is no row with id: ${id}`);
  }
  const url = `:batchUpdate`;
  await fetchRequest(url, {
    method: 'POST',
    body: JSON.stringify({
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: 0,
              dimension: 'ROWS',
              startIndex: rowIndex,
              endIndex: rowIndex + 1
            }
          }
        }
      ]
    }),
  });
}

export async function get(id) {
  return getGsheetRowByItemId(id);  
}