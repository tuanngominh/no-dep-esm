import { UPLOAD_TYPE, getEnv } from '../utils/env.mjs';

let upload;

export async function getUpload() {
  if (!upload) {
    const uploadType = getEnv(UPLOAD_TYPE);
    switch(uploadType) {
      case 'file': {
        upload = await import('./file.mjs');  
        break;
      }
      default: {
        throw Error(`Unknow upload type: ${uploadType}`);
      }
    }
  }
  return upload;
}