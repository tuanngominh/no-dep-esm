import fs from "node:fs/promises";
import path from "path";
import { UPLOAD_DIR, getEnv } from "../utils/env.mjs";

export async function create(todoId, fileName, fileContent) {
  const uploadPath = getEnv(UPLOAD_DIR);

  const filePath = path.join(uploadPath, todoId, fileName);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, fileContent);
  return { 
    filePath,
    fileUri: path.join(todoId, fileName),
    fileName
  };
}

export async function getFile(fileUri) {
  return await fs.readFile(getEnv(UPLOAD_DIR) + "/" + fileUri);
}

export async function deleteFile(todoId, fileName) {
  const path = `${getEnv(UPLOAD_DIR)}/${todoId}/${fileName}`;
  await fs.unlink(path)
}

export async function deleteFolder(todoId) {
  await fs.rm(`${getEnv(UPLOAD_DIR)}/${todoId}`, {recursive: true, force: true})
}