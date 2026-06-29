# Dependencias vendorizadas

Estas librerías se sirven **localmente** (sin CDN) y se fijan en `index.html`
mediante **Subresource Integrity (SRI)**: si el contenido del archivo cambia y
su hash deja de coincidir, el navegador se niega a ejecutarlo.

| Archivo                     | Librería       | Notas                                         |
|-----------------------------|----------------|-----------------------------------------------|
| `pizzip.min.js`             | PizZip         | Empaqueta `pako 2.1.0` (ver `pizzip.min.js.LICENSE.txt`) |
| `docxtemplater.min.js`      | docxtemplater  | Genera el `.docx` a partir de la plantilla    |

## Integridad (SRI) usada en `index.html`

```
pizzip.min.js         sha384-XQtJZTVnqAq0NFD5n/9EXUu5+CRYAffTCptNzpB+5g3R4iug3g8jSc8XJkNCIcgF
docxtemplater.min.js  sha384-b7y7FzboK8nqhXi7AGaZPf2FLZIgvGb3rPMCModw572tDJwbPX8hlw0T+R+N7Uxn
```

## Checksums SHA-256 (verificación de integridad)

```
5a49e8df753c9f6d59d0a46839d086e6ab8b386a4c423ee4a7cbc8e7cbee02e3  pizzip.min.js
81c6d9272263b642054e04725fa4fe78e1c4173c7798a804a4da1608b1a4e1bd  docxtemplater.min.js
```

## Cómo regenerar los hashes si actualizas una librería

```bash
# SRI (sha384, base64) — el valor que va en el atributo integrity de index.html
openssl dgst -sha384 -binary vendor/pizzip.min.js | openssl base64 -A

# Checksum SHA-256 (hex) para esta tabla
openssl dgst -sha256 vendor/pizzip.min.js
```

> Al actualizar cualquier `.min.js`, recalcula y actualiza **ambos**: el atributo
> `integrity` en `index.html` y los checksums de este archivo. Si no, el navegador
> bloqueará el script por mismatch de SRI.
