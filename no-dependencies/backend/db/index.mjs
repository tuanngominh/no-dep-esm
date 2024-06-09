import { DB_TYPE, getEnv } from '../utils/env.mjs';

let db;

export async function getDb() {
  if (!db) {
    const dbType = getEnv(DB_TYPE);
    switch(dbType) {
      case 'file': {
        db = await import('./file.mjs');  
        break;
      }
      case 'gsheet': {
        db = await import('./gsheet.mjs');
        break;
      }
      default: {
        throw Error(`Unknow db type: ${dbType}`);
      }
    }
    if ('init' in db) {
      await db.init();
    }
  }
  return db;
}