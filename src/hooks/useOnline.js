// src/hooks/useOnline.js
// Estado de conexión reactivo. Escucha los eventos 'online'/'offline' del
// navegador y devuelve un booleano. Útil para avisar al alumno y para disparar
// la sincronización de la cola (ver src/offline.js) al recuperar la señal.
import { useEffect, useState } from "react";

export function useOnline() {
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine !== false
  );
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, []);
  return online;
}
