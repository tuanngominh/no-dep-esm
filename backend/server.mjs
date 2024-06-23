import http from 'http';
import { initEnv, getEnv, HOSTNAME, PORT } from "./utils/env.mjs";
import { getDb } from './db/index.mjs';
import { routeHandler } from './routes/index.mjs';

initEnv(import.meta.url);

const hostname = getEnv(HOSTNAME);
const port = getEnv(PORT);

const server = http.createServer(async(req, res) => {
  try {
    console.log(`${req.method} ${req.url}`);
    await routeHandler(req, res);  
  } catch (error) {
    console.error(error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({error: error.toString()}));
  }
})

server.listen(port, hostname, () => {
  console.log(`Server is running at http://${hostname}:${port}/`);
});

process.on("SIGINT", async () => {
  const db = await getDb();
  if ('cleanup' in db) {
    await db.cleanup();  
  }
  process.exit();
})