import fs from "node:fs"
import fsPromises from "node:fs/promises"
import { shortId } from '../utils.mjs';
import { getEnv, DB_FILE_PATH } from "../utils/env.mjs";
let todos;

export function create(object) {
  const id = shortId();
  todos.set(id, object);
  return id;
}

export function update(id, object) {
  todos.set(id, object);
}

export function addUpload(id, fileName) {
  const item = get(id);
  if (item?.uploads && !item.uploads?.includes(fileName)) {
    item.uploads.push(fileName);
  } else {
    item.uploads = [fileName];
  }
  update(id, item);
}

export function removeUpload(id, fileName) {
  const item = get(id);
  if (item?.uploads?.includes(fileName)) {
    item.uploads = item.uploads.filter(_ => _ !== fileName);
  }
  update(id, item);
}

export function remove(id) {
  todos.delete(id);
}

export function get(id) {
  return todos.get(id);
}

export function list() {
  const entries = [];
  todos.forEach((_, key) => {
    entries.push({
      ..._,
      id: key
    })
  })
  return entries;
}

export function cleanup() {
  console.log("Persist data to disk...")
  const filePath = getEnv(DB_FILE_PATH);

  fs.writeFileSync(filePath, JSON.stringify(Object.fromEntries(todos)), 'utf8');
  console.log("Persist data to disk: done.")
}

export async function init() {
  const filePath = getEnv(DB_FILE_PATH);
  console.log(`Load data from disk ${filePath} ...`);
  todos  = new Map();
  try {
    const content = await fsPromises.readFile(filePath, 'utf8');
    const data = JSON.parse(content);
    const validatedData = new Map();
    const keys = Object.keys(data);
    if (typeof data === 'object' && keys.length > 0) {
      for (const key of keys) {
        validatedData.set(key, data[key]);
      }
    }
    if (validatedData.size > 0) {
      console.log(`Load data from disk: done. ${validatedData.size} rows found`);
      todos = validatedData;
      return validatedData.size;
    } else {
      console.log("Load data from disk: done. Nothing found");
      return 0;
    }
  } catch (e) {
    console.log(`Data file not exists: ${filePath}`);
    return;
  }
}