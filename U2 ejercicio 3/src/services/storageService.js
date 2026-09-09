
//  Cookies
// setCookie / getCookie / deleteCookie

export function setCookie(name, value, days) {
  let expires = "";

  if (typeof days === "number") {
    const fecha = new Date();
    fecha.setTime(fecha.getTime() + days * 24 * 60 * 60 * 1000);
    expires = `; expires=${fecha.toUTCString()}`;
  }

  try {
    document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/`;
    return true;
  } catch (error) {
    console.error(`No se pudo escribir la cookie "${name}":`, error);
    showToast("El navegador tiene las cookies bloqueadas para este sitio.");
    return false;
  }
}

export function getCookie(name) {
  try {
    const cookies = document.cookie.split("; ");
    const found = cookies.find((row) => row.startsWith(`${name}=`));

    if (!found) return null;

    const value = found.substring(name.length + 1);
    return decodeURIComponent(value);
  } catch (error) {
    console.error(`No se pudo leer la cookie "${name}":`, error);
    return null;
  }
}

export function deleteCookie(name) {
  try {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
    return true;
  } catch (error) {
    console.error(`No se pudo borrar la cookie "${name}":`, error);
    return false;
  }
}

// localStorage y sessionStorage 


function safeRead(storage, key) {
  try {
    return storage.getItem(key);
  } catch (error) {
    console.error(`No se pudo leer "${key}" de ${storageLabel(storage)}:`, error);
    return null;
  }
}

function safeWrite(storage, key, value) {
  try {
    storage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`No se pudo guardar "${key}" en ${storageLabel(storage)}:`, error);
    showToast(storageErrorMessage(error, storage));
    return false;
  }
}

function safeRemove(storage, key) {
  try {
    storage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`No se pudo borrar "${key}" de ${storageLabel(storage)}:`, error);
    return false;
  }
}

function storageLabel(storage) {
  try {
    return storage === window.localStorage ? "localStorage" : "sessionStorage";
  } catch {
    return "el almacenamiento del navegador";
  }
}

function storageErrorMessage(error, storage) {
  const isQuotaExceeded =
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" ||
      error.code === 22 ||
      error.code === 1014);

  if (isQuotaExceeded) {
    return "Se llenó el espacio disponible para guardar datos en este sitio. La app seguirá funcionando, pero este dato no se guardó.";
  }

  if (error && error.name === "SecurityError") {
    return "El navegador tiene bloqueado el almacenamiento (modo privado o política del navegador). La app seguirá funcionando sin recordar esta preferencia.";
  }

  return `No se pudo guardar el dato en ${storageLabel(storage)}. La app seguirá funcionando sin esa persistencia.`;
}

export const localStorageSafe = {
  get: (key) => safeRead(window.localStorage, key),
  set: (key, value) => safeWrite(window.localStorage, key, value),
  remove: (key) => safeRemove(window.localStorage, key),
};

export const sessionStorageSafe = {
  get: (key) => safeRead(window.sessionStorage, key),
  set: (key, value) => safeWrite(window.sessionStorage, key, value),
  remove: (key) => safeRemove(window.sessionStorage, key),
};

// mensaje de aviso
export function showToast(message) {
  let toast = document.getElementById("storage-toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "storage-toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("storage-toast--visible");

  clearTimeout(showToast._timeoutId);
  showToast._timeoutId = setTimeout(() => {
    toast.classList.remove("storage-toast--visible");
  }, 4000);
}
