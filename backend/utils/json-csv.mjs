/**
 * Using jsonpath like notation for key name (https://goessner.net/articles/JsonPath/)
 */

export function toKeyValue(object, schema) {  
  const keyValue = {};
  outerLoop:
  for (const [fieldName, fieldTypeDef] of Object.entries(schema)) {
    if (!(fieldName in object)) {
      continue;
    }
    const fieldValue = object[fieldName];
    const type = fieldTypeDef.type;
    switch (type) {
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
          throw new Error(`${fieldName} field is not array type`);
        }

        if(fieldValue.length === 0) {
          continue outerLoop;
        }

        for (const [index, value] of fieldValue.entries()) {
          if (typeof value !== 'number' && typeof value !== 'string') {
            throw Error(`${fieldName} field: expect string or number as array element at index ${index}. Actual value: ${value}`);
          }
          keyValue[`${fieldName}[${index}]`] = value;
        }
        break;
      }
    }
  }
  return keyValue;
}

const arrayIndexRegex = /([a-zA-Z]+)\[(\d+)\]/;
export function toNested(flatObject, schema) {
  const nested = {};

  for (const [fieldName, fieldTypeDef] of Object.entries(schema)) {
    const type = fieldTypeDef.type;
    if (['string', 'number'].includes(type) && 
      fieldName in flatObject &&
      flatObject[fieldName] !== null &&
      flatObject[fieldName] !== undefined
    ) {
      switch(type) {
        case 'string': {
          nested[fieldName] = String(flatObject[fieldName]);
          break;
        }
        case 'number': {
          nested[fieldName] = Number(flatObject[fieldName]);
          break;
        }
      }
      continue;
    }

    if (type === 'array') {
      const arrayValue = [];
      const foundIndexes = [];
      const arrayElementType = fieldTypeDef.items.type;
      for(const key in flatObject) {
        const match = key.match(arrayIndexRegex);
        if (!match) {
          continue;
        }
        const arrayNameFromInput = match[1];
        if (arrayNameFromInput !== fieldName) {
          continue;
        }
        const index = parseInt(match[2]);
        if (isNaN(index)) {
          continue;
        }
        if (flatObject[key] === undefined || flatObject[key] === null) {
          continue;
        }
        if (!foundIndexes.includes(index)) {
          foundIndexes.push(index);
          switch(arrayElementType) {
            case 'string': {              
              arrayValue.push(String(flatObject[key]));
              break;
            }
            case 'number': {      
              arrayValue.push(Number(flatObject[key]));
              break;
            }
          }
        }
      }
      nested[fieldName] = arrayValue;
    }
  }

  return nested;
}

export function validateSchema(flatHeaders, schema) {
  const primitiveTypes = ['string', 'number'];
  for (const header of flatHeaders) {
    if (header in schema && primitiveTypes.includes(schema[header]?.type)) {
      continue;
    }

    const match = header.match(arrayIndexRegex);
    if (match) {
      const arrayName = match[1];
      const index = parseInt(match[2]);
      if ((arrayName in schema) && !isNaN(index) && schema[arrayName]?.type === 'array') {
        continue;
      }
    }
    return false;
  }

  return true;
}