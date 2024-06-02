import * as services from "./services.js";
import { fetchTodo, addTodoForm } from "./ui.js";

services.setBackendUrl('http://localhost:4200');

const todoList = document.getElementById("todoList");
fetchTodo(todoList);

const form = document.getElementById("form");
addTodoForm(form, todoList);