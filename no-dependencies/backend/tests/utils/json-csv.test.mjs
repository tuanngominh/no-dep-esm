import test from 'node:test';
import assert from 'node:assert';
import { toKeyValue, toNested } from '../../utils/json-csv.mjs';

const schema = {
  id: 'string',
  name: 'string',
  uploads: 'array',
  labels: 'array',
  creator: 'number',
  customFields: 'object'
};
const nested = {
  id: 'abc123',
  name: 'name 1',
  uploads: ['image1.png', 'image2.jpg'],
  creator: 1,
  labels: ['project1', 'project2'],
  customFields: {
    field1: 'value 1',
    field2: 'value 2'
  }
};
const keyValue = {
  id: 'abc123',
  name: 'name 1',
  "uploads[0]": 'image1.png',
  "uploads[1]": 'image2.jpg',
  creator: 1,
  "labels[0]": 'project1',
  "labels[1]": 'project2',
  "customFields.field1": 'value 1',
  "customFields.field2": 'value 2'
}

test('should flatten nested object', () => {
  assert.deepStrictEqual(toKeyValue(nested, schema), keyValue)
})

test('should rebuild nested from flatten', () => {
  // assert.strictEqual(toNested(keyValue, schema), nested);
})