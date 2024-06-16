/**
 * Using jsonpath like notation for key name (https://goessner.net/articles/JsonPath/)
 */

export function toKeyValue(object, schema) {  
  const keyValue = {};
  for (const [fieldName, fieldType] of Object.entries(schema)) {
    if (!(fieldName in object)) {
      continue;
    }
    const fieldValue = object[fieldName]
    switch (fieldType) {
      case 'string': {
        keyValue[fieldName] = String(fieldValue);
        break;
      }
      case 'number': {
        keyValue[fieldName] = Number(fieldValue);
        break;
      }
      case 'array': {
        if (!Array.isArray(fieldValue)) {
          throw new Error(`${fieldName} field is not ${fieldType} type`);
        }

        if(fieldValue.length === 0) {
          break;
        }

        for (const [index, value] of fieldValue.entries()) {
          if (typeof value !== 'number' && typeof value !== 'string') {
            throw Error(`${fieldName} field: expect string or number as array element at index ${index}. Actual value: ${value}`);
          }
          keyValue[`${fieldName}[${index}]`] = value;
        }
        break;
      }
      case 'object': {
        if (typeof fieldValue !== 'object') {
          throw new Error(`${fieldName} field is not ${fieldType} type`);
        }
        if (Object.keys(fieldValue).length === 0) {
          continue;
        }
        for(const [key, value] of Object.entries(fieldValue)) {
          if (typeof value !== 'number' && typeof value !== 'string') {
            throw Error(`${fieldName}.${key} field: expect string or number. Actual value: ${value}`);
          }
          keyValue[`${fieldName}.${key}`] = value;
        }
        break;
      }
    }
  }
  return keyValue;
}

export function toNested(array, schema) {
  const nestedArr = [];
  if (!(array?.length > 0)) {
    return nestedArr;
  }
  const schemaFlat = Object.entries(schema);
  for (const values of array) {
    const nested = {};
    for (const [index, fieldValue] of values.entries()) {
      const [fieldName, fieldType] = schemaFlat[index];
      switch (fieldType) {
        case 'string': {
          nested[fieldName] = String(fieldValue);
          break;
        }
        case 'number': {
          nested[fieldName] = Number(fieldValue);
          break;
        }
        case 'array': {
          const index = 0;
          const regex = /uploads\[(\d+)\]/;
          nested[fieldValue][index] = 
        }
      }
    }
    nestedArr.push(nested);
  }
  return nestedArr;
}