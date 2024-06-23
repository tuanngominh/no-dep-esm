let backendUrl;
export function setBackendUrl(url) {
  backendUrl = url;
}

export async function deleteUpload(id, fileUrl) {
  try {
    await fetch(`${backendUrl}/todos/${id}/upload/${fileUrl}`, {
      method: 'DELETE'
    });
  } catch (e) {
    console.error(e);
  }
}

export async function deleteTodo(id) {
  try {
    await fetch(`${backendUrl}/todos/${id}`, {
      method: 'DELETE'
    });
  } catch (e) {
    console.error(e);
  }
}

export async function createTodo(formData) {
  try {
    const response = await fetch(`${backendUrl}/todos`, {
      method: "POST",
      body: formData
    })
    const result = await response.json();
    return result;
  } catch(e) {
    console.error(e);
  }
}

export async function listTodo() {
  try {
    const response = await fetch(`${backendUrl}/todos`);
    return await response.json();
  } catch(e) {
    console.error(e);
  }
}

export async function uploadFile(id, formData) {
  try {
    const result = await fetch(`${backendUrl}/todos/${id}/upload`, {
      method: 'POST',
      body: formData
    });
    const file = await result.json();
    return file;
  } catch(e) {
    console.error(e);
  }
}