# FormularioMinuta

Generador de documentos para **ACTIVA** (Empresa de Parques y Eventos de Antioquia).
Aplicación web estática (HTML/CSS/JS) con dos páginas:

**Generador de Contrato** (`index.html`):
1. **Genera** un contrato en Word (`.docx`) rellenando una plantilla oficial
   (`plantilla_contrato.docx`) con los datos del formulario, usando
   [docxtemplater](https://docxtemplater.com/) + [PizZip](https://github.com/open-xml-templating/pizzip).
2. Permite **cargar** el contrato ya firmado en PDF.
3. **Envía** los datos y el PDF (en base64) a un flujo de **Power Automate**.

**Estudio Previo** (`estudio_previo.html`):
1. **Genera** el estudio previo de prestación de servicios (formato SBSF28) en
   Word, rellenando `plantilla_estudio_previo.docx` con los datos del formulario.

## Estructura

| Archivo                          | Descripción                                            |
|----------------------------------|--------------------------------------------------------|
| `index.html`                     | Formulario del contrato                                |
| `app.js`                         | Lógica del contrato: letras, generación y envío        |
| `estudio_previo.html`            | Formulario del estudio previo (SBSF28)                 |
| `estudio.js`                     | Lógica del estudio previo: letras y generación         |
| `styles.css`                     | Estilos compartidos                                    |
| `plantilla_contrato.docx`        | Plantilla del contrato con marcadores `{campo}`        |
| `plantilla_estudio_previo.docx`  | Plantilla del estudio previo con marcadores `{campo}`  |
| `vendor/`                        | Librerías locales fijadas con SRI (ver `vendor/VENDOR.md`) |

## Despliegue

Es un sitio estático: basta con servir los archivos detrás de **HTTPS**
(GitHub Pages, Azure Static Web Apps, cualquier hosting estático). No requiere
build ni backend propio.

## Configuración

La URL del disparador (trigger HTTP) de Power Automate está en la constante
`POWER_AUTOMATE_URL` al inicio de `app.js`. Para apuntar a otro flujo, edita esa
constante.

> ⚠️ **Seguridad:** esa URL incluye una firma (`sig`) que autoriza el disparo del
> flujo. Al ser una app de cliente, la firma queda visible para cualquiera que
> abra la página. Considera mover el envío a un proxy/función con autenticación
> y mantener la firma como secreto del servidor.

## Dependencias

Las librerías se sirven **localmente** desde `vendor/` (sin CDN) y se fijan con
Subresource Integrity. Versiones, procedencia y checksums en
[`vendor/VENDOR.md`](vendor/VENDOR.md).
