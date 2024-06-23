import { GSHEET_SHEET_ID, getEnv } from "../utils/env.mjs";
import { shortId } from '../utils.mjs';
import * as utils from '../utils/json-csv.mjs';
import { getAccessToken } from "../utils/google-oauth2.mjs";

/**
 * @typedef {import('../types.mjs').Todo} Todo
 */

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
  id: {
    type: 'string'
  },
  name: {
    type: 'string'
  },
  uploads: {
    type: 'array',
    items: {
      type: 'string'
    }
  }
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
      
  const gsheetHeader = result.values[0];

  if (utils.validateSchema(gsheetHeader, localSchema)) {
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
  const keyValues = utils.toKeyValue({
    id,
    ...object
  }, schema);

  const values = Object.values(keyValues);

  const validateResult = await validateSchema(schema);
  const headers = Object.keys(keyValues);
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
  return (await getAllGsheetRows()).map(_ => _.nested);
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
  const nested = [];
  const rows = [];
  if (result?.values?.length > 1) {
    const [headers, ...values] = result.values;
    for(const value of values) {
      const flatObject = {};
      for (let i = 0; i < headers.length; i++) {
        if (value[i] !== undefined && value[i] !== null) {
          flatObject[headers[i]] = value[i];
        }
      }
      nested.push();
      rows.push({
        headers,
        values: value,
        flat: flatObject,
        nested: utils.toNested(flatObject, schema)
      })
    }
  }
  return rows;
}

async function getGsheetRowByItemId(todoId) {
  const rows = await getAllGsheetRows();
  const found = rows.map((row, index) => ({
    row,
    index
  }))
  .filter(_ => _.row.nested.id === todoId)
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

async function updateRow(todoId, newFlatObject, currentGsheetRow, rowIndex) {
  const keys = Object.keys(newFlatObject);
  const values = Object.values(newFlatObject);
  const {headers, values: currentValues} = currentGsheetRow.row;

  const data = [];
  // this update introduces more columns
  if (keys.length > headers.length) {
    data.push({
      dataFilter: {
        gridRange: {
          sheetId: 0,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: keys.length
        }
      },
      majorDimension: 'ROWS',
      values: [
        keys
      ]
    })
  }

  // update actual data
  data.push({
    dataFilter: {
      gridRange: {
        sheetId: 0,
        startRowIndex: rowIndex + 1,
        endRowIndex: rowIndex + 2,
        startColumnIndex: 0,
        endColumnIndex: keys.length
      }
    },
    majorDimension: 'ROWS',
    values: [
      values
    ]
  })

  // remove other cell in the row
  if(currentValues.length > values.length) {
    const emptyCells = new Array(currentValues.length - values.length).fill('');
    data.push({
      dataFilter: {
        gridRange: {
          sheetId: 0,
          startRowIndex: rowIndex + 1,
          endRowIndex: rowIndex + 2,
          startColumnIndex: values.length,
          endColumnIndex: currentValues.length
        }
      },
      majorDimension: 'ROWS',
      values: [
        emptyCells
      ]
    })
  }
  rowIndex = rowIndex ?? await getGsheetRowIndexByItemId(todoId);
  const body = {
    data,
    valueInputOption: 'USER_ENTERED'
  };
  await fetchRequest(`/values:batchUpdateByDataFilter`, {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export async function addUpload(todoId, fileName) {
  const result = await getGsheetRowByItemId(todoId);
  if (!result) {
    throw new Error(`No item found with id ${todoId}`);
  }
  const {row, index} = result;
  const uploads = [...row.nested.uploads];
  if (!uploads.some(_ => _ === fileName)) {
    uploads.push(fileName);
  }
  const newNested = {
    ...row.nested,
    uploads
  }
  await updateRow(todoId, utils.toKeyValue(newNested, schema), result, index);
}

export async function removeUpload(todoId, fileName) {
  const result = await getGsheetRowByItemId(todoId);
  if (!result) {
    throw new Error(`No item found with id ${todoId}`);
  }
  const {row, index} = result;
  const nested = row.nested;
  if (!(nested?.uploads?.length > 0)) {
    return;
  }
  const uploads = [...nested.uploads.filter(_ => _ !== fileName)];
  const newNested = {
    ...nested,
    uploads
  }
  await updateRow(todoId, utils.toKeyValue(newNested, schema), result, index);
}

export async function get(todoId) {
  return getGsheetRowByItemId(todoId);
}