const CLAVE = "bcs_usuario_id";

// La app no tiene login, así que cada navegador se identifica con un id propio
// que se guarda en localStorage. Es lo que viaja como user_id al backend.
export function getUsuarioId() {
  let id = localStorage.getItem(CLAVE);

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CLAVE, id);
  }

  return id;
}
