import fs from "node:fs/promises";
import * as db from './db.mjs';
import { parseFormData, getUploadUrl } from "./utils.mjs";
import {fileUpload, getUploadPath} from './upload.mjs';
import {getContentType} from "./asset.mjs";

export function createTodo(req, res) {
  parseFormData(req, (fields) => {
    const id = db.create(fields);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      id,
      ...fields
    }));
  });
}

export function listTodo(req, res) {
  let todos = db.list();
  todos = todos.map(_ => ({
    ..._,
    ...!!_.uploads && {
      uploads: _.uploads.map(fileName => getUploadUrl(`${_.id}/${fileName}`))
    }
  }))
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(todos));
}

export async function deleteTodo(req, res) {
  const todoId = req.params.id;
  const item = db.get(todoId);
  if (item?.uploads) {
    await fs.rm(`${getUploadPath()}/${todoId}`, {recursive: true, force: true})
  }
  db.remove(todoId);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({id: todoId}));
}

export async function upload(req, res) {
  const id = req.params.id;
  const {fileUri, fileName} = await fileUpload(req, id);
  db.addUpload(id, fileName);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    url: getUploadUrl(fileUri),
    name: fileName
  }));
}

export async function viewUpload(fileUri, res) {
  const contentType = getContentType(fileUri);

  try {
    const content = await fs.readFile(getUploadPath() + "/" + fileUri);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (error) {
    res.writeHead(500);
    res.end(`There is error, ${error.code}`);
  }
}

export async function deleteUpload(req, res) {
  const {id: todoId, fileName} = req.params;
  const path = `${getUploadPath()}/${todoId}/${fileName}`;
  await fs.unlink(path)
  db.removeUpload(todoId, fileName);
  res.writeHead(200);
  res.end();
}