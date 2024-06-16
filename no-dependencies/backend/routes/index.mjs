import * as asset from "../asset.mjs";
import * as routes from "./todos.mjs";

export async function routeHandler(req, res) {
  const url = req.url;

  const uploadActionRoute = /^\/todos\/([^\/]+)\/upload\/([^\/]+)$/;
  if (url.match(uploadActionRoute)) {
    const matches = url.match(uploadActionRoute);
    const id = matches[1];
    const fileName = matches[2];
    req.params = { id, fileName };
    switch (req.method) {
      case 'DELETE': {
        await routes.deleteUpload(req, res);
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
      switch (action) {
        case 'upload': {
          await routes.upload(req, res);
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
        await routes.deleteTodo(req, res);
        return;
      }
      case 'PUT': {
        const id = url.match(todoIdRoute)[1];
        req.params = { id };
        await routes.updateTodo(req, res);
        return;
      }
    }
  }

  switch (url) {
    case '/todos': {
      switch (req.method) {
        case 'POST': {
          await routes.createTodo(req, res);
          break;
        }
        case 'GET': {
          await routes.listTodo(req, res);
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
    await routes.viewUpload(`${todoId}/${imageFile}`, res);
    return;
  }

  asset.asset(req, res);
}
