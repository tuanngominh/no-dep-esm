import http from 'http';
import * as routes from './routes.mjs';
import * as asset from "./asset.mjs";
import { setStaticWebPath } from "./asset.mjs";
import {setUploadPath} from "./upload.mjs";
import {setEnv} from './utils.mjs';

const hostname = '127.0.0.1';
const port = 4200;

const server = http.createServer((req, res) => {
  
  console.log(`${req.method} ${req.url}`);

  const url = req.url;
  
  const uploadActionRoute = /^\/todos\/([^\/]+)\/upload\/([^\/]+)$/;
  if (url.match(uploadActionRoute)) {
    const matches = url.match(uploadActionRoute);
    const id = matches[1];
    const fileName = matches[2];
    req.params = { id, fileName };
    switch(req.method) {
      case 'DELETE': {
        routes.deleteUpload(req, res);
        return;
      }
    }
  }

  const customActionRoute = /^\/todos\/([^\/]+)\/([^\/]+)$/;
  if (url.match(customActionRoute)) {
    const matches = url.match(customActionRoute);
    const id = matches[1];
    const action = matches[2];
    req.params = { id };
    if (req.method === 'POST') {
      switch(action) {
        case 'upload': {
          routes.upload(req, res);
          return;
        }
      }
    }
  }

  const todoIdRoute = /^\/todos\/([^\/]+)$/;
  if (url.match(todoIdRoute)) {
    switch (req.method) {
      case 'DELETE': {
        const id = url.match(todoIdRoute)[1];
        req.params = { id };
        routes.deleteTodo(req, res);
        return;
      }
      case 'PUT': {
        const id = url.match(todoIdRoute)[1];
        req.params = { id };
        routes.updateTodo(req, res);
        return;
      }
    }
  }

  switch (url) {
    case '/todos': {
      switch (req.method) {
        case 'POST': {
          routes.createTodo(req, res);
          break;
        }
        case 'GET': {
          routes.listTodo(req, res);
          break;
        }    
      }
      return;
    }
  }

  const uploadRoute = /^\/upload\/([^\/]+)\/([^\/]+)$/;
  const uploadRouteMatch = url.match(uploadRoute);
  if (uploadRouteMatch) {
    const todoId = uploadRouteMatch[1];
    const imageFile = uploadRouteMatch[2];
    routes.viewUpload(`${todoId}/${imageFile}`, res);
    return;
  }

  asset.asset(req, res);
})

setStaticWebPath('../frontend');
setUploadPath('../upload');
server.listen(port, hostname, () => {
  console.log(`Server is running at http://${hostname}:${port}/`);
  setEnv('url', `http://${hostname}:${port}`);
})