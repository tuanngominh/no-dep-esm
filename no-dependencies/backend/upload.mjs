import path from "path";
import { fileURLToPath } from 'url';
import fs from "node:fs/promises";

let uploadPath;
export function setUploadPath(relativeUploadPath) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  uploadPath = path.resolve(__dirname + "/" + relativeUploadPath);
}

export function getUploadPath() {
  if (!uploadPath) {
    throw new Error("Upload path is not defined");
  }
  return uploadPath;
}

export async function fileUpload(req, id) {
  const boundary = req.headers['content-type'].split('; ')[1].replace('boundary=', '');
  const chunks = [];

  const collectChunks = new Promise((resolve, reject) => {
    req.on('data', chunk => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    req.on('error', reject);
  });

  const body = await collectChunks;
  
  // Convert the body buffer to a string to find the boundaries
  const bodyStr = body.toString('binary');
  const parts = bodyStr.split(`--${boundary}`);

  for (const part of parts) {
    if (part.includes('Content-Disposition: form-data;')) {
      const fileNameMatch = part.match(/filename="(.+)"/);
      const fileName = fileNameMatch ? fileNameMatch[1] : 'uploaded_file';

      // Find the start and end of the file content in the binary string
      const fileContentStart = part.indexOf('\r\n\r\n') + 4;
      const fileContentEnd = part.lastIndexOf('\r\n');

      // Extract the binary content using the positions from the string
      const fileContent = body.slice(
        bodyStr.indexOf(part) + fileContentStart,
        bodyStr.indexOf(part) + fileContentEnd
      );

      const filePath = path.join(uploadPath, id, fileName);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, fileContent);

      return { 
        filePath,
        fileUri: path.join(id, fileName),
        fileName
      };
    }
  }

  throw new Error('File not found in upload');
}
