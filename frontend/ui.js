import * as services from "./services.js";

export async function fetchTodo(target) {
  const todos = await services.listTodo();
  todos.forEach(todo => {
    todoItem(target, todo);
  });
}

export function image(fileUrl, todoId, fileName) {
  const container = document.createElement('div');

  const image = document.createElement('img');
  image.src = fileUrl;
  image.height = 20;
  image.style.marginLeft = '10px';

  const deleteIcon = document.createElement('button');
  deleteIcon.innerHTML = '&#128465;';
  deleteIcon.style.marginLeft = '10px';
  deleteIcon.addEventListener('click', async () => {
    await services.deleteUpload(todoId, fileName);
    container.remove();
  });

  container.append(image, deleteIcon);
  return container;
}

export function todoItem(todoList, todo) {
  const li = document.createElement('li');
  const span = document.createElement('span');
  span.textContent = todo.name;

  const deleteIcon = document.createElement('button');
  deleteIcon.innerHTML = '&#128465;';
  deleteIcon.style.marginLeft = '10px';
  deleteIcon.addEventListener('click', async () => {
    await services.deleteTodo(todo.id);
    li.remove();
  });

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.style.display = 'none';
  fileInput.addEventListener('change', async (event) => {
    const formData = new FormData();
    formData.append('image', event.target.files[0]);
    const {url: fileUrl, name: fileName} = await services.uploadFile(todo.id, formData);
    li.append(image(fileUrl, todo.id, fileName));
  });

  const uploadButton = document.createElement('button');
  uploadButton.innerHTML = '&#128247;';
  uploadButton.style.marginLeft = '10px';
  uploadButton.addEventListener('click', () => {
    fileInput.click();
  });

  li.append(span, fileInput, uploadButton, deleteIcon);
  todoList.append(li);

  if (todo?.uploads) {
    todo.uploads.forEach(url => {
      const fileName = url.split('/').pop();
      li.append(image(url, todo.id, fileName));
    })
  }
}

export function addTodoForm(form, todoList) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const result = await services.createTodo(formData);
    todoItem(todoList, result);
    form.reset();
  });
}
