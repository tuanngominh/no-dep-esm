import {describe, it} from 'node:test';
import assert from 'node:assert';
import { toKeyValue, toNested, validateSchema } from '../../utils/json-csv.mjs';

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
  },
};

const nested = {
  id: 'abc123',
  name: 'name 1',
  uploads: ['image1.png', 'image2.jpg'],
};
const keyValue = {
  id: 'abc123',
  name: 'name 1',
  "uploads[0]": 'image1.png',
  "uploads[1]": 'image2.jpg',
}
const validFlatHeader = ['id', 'name', 'uploads[0]', 'uploads[1]'];
const invalidFlatHeaders = [
  ['invalid-attribute','name', 'uploads[0]', 'uploads[1]'],
  ['id', 'name', 'labels[0]'],
];

it('should flatten nested object', () => {
  assert.deepStrictEqual(toKeyValue(nested, schema), keyValue)
})

describe('Rebuild nested from flatten', () => {
  it('should rebuild nested from flatten', () => {
    assert.deepStrictEqual(toNested(keyValue, schema), nested);
  })
  
  it('should ignore undefined and null value', () => {
    const nested = {
      id: 'abc123',
      uploads: ['image1.png'],
    };
    const keyValue = {
      id: 'abc123',
      name: undefined,
      "uploads[0]": 'image1.png',
      "uploads[1]": null,
    }
    assert.deepStrictEqual(toNested(keyValue, schema), nested);
  })
})

describe("Validate schema", () => {
  it('should validate schema against a flatten headers', () => {
    assert.ok(validateSchema(validFlatHeader, schema));
  })

  invalidFlatHeaders.forEach((invalidFlatHeader) => {    
    it('should invalidate schema against a flatten headers', () => {
      assert.strictEqual(validateSchema(invalidFlatHeader, schema), false);
    })
  })
})