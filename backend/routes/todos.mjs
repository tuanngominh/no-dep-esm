import {getDb} from '../db/index.mjs';
import { parseFormData, getUploadUrl } from "../utils.mjs";
import {extractFile} from '../utils/upload.mjs';
import {getUpload } from "../upload/index.mjs";
import {getContentType} from "../asset.mjs";

export async function createTodo(req, res) {
  const fields = await parseFormData(req);
  const db = await getDb();
  const id = await db.create(fields);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    id,
    ...fields
  }));  
}

export async function listTodo(req, res) {
  const db = await getDb();
  let todos = await db.list();
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
  const db = await getDb();
  const item = await db.get(todoId);
  if (item?.uploads) {
    const upload = await getUpload();
    await upload.deleteFolder(todoId);  
  }
  db.remove(todoId);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({id: todoId}));
}

export async function upload(req, res) {
  const id = req.params.id;
  const {fileContent, fileName} = await extractFile(req);
  const upload = await getUpload();
  const {fileUri} = await upload.create(id, fileName, fileContent);
  const db = await getDb();
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
    const upload = await getUpload();
    const content = await upload.getFile(fileUri);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (error) {
    res.writeHead(500);
    res.end(`There is error, ${error.code}`);
  }
}

export async function deleteUpload(req, res) {
  const {id: todoId, fileName} = req.params;
  const upload = await getUpload();
  await upload.deleteFile(todoId, fileName);
  const db = await getDb();
  db.removeUpload(todoId, fileName);
  res.writeHead(200);
  res.end();
}

export async function updateTodo(req, res) {
  throw new Error("Need implementation");
}