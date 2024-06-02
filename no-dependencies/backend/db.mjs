import { shortId } from './utils.mjs';
const todos = new Map();

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

export function list(id) {
  const entries = [];
  todos.forEach((_, key) => {
    entries.push({
      ..._,
      id: key
    })
  })
  return entries;
}

