// src/videoStore.test.js  (Node: usa el WebCrypto de Node; no requiere DOM)
import { describe, it, expect } from "vitest";
import { encryptBytes, decryptBytes } from "./videoStore.js";

const data = new TextEncoder().encode("contenido de video simulado 12345 áéí");

describe("videoStore — cifrado en reposo atado a la cuenta", () => {
  it("cifra (no queda texto plano) y descifra con la misma cuenta", async () => {
    const { iv, ct } = await encryptBytes("user-A", data);
    expect(ct.byteLength).toBeGreaterThan(data.byteLength); // incluye el tag GCM
    const back = await decryptBytes("user-A", iv, ct);
    expect(new TextDecoder().decode(back)).toBe("contenido de video simulado 12345 áéí");
  });

  it("otra cuenta NO puede descifrar (binding por userId)", async () => {
    const { iv, ct } = await encryptBytes("user-A", data);
    await expect(decryptBytes("user-B", iv, ct)).rejects.toBeTruthy();
  });
});
