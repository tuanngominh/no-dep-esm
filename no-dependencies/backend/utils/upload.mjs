export async function extractFile(req) {
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

      return { 
        fileContent,
        fileName
      };
    }
  }

  throw new Error('File not found in upload');
}
