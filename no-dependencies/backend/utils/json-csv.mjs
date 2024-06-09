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

export function toNested(object, schema) {

}