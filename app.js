/* ============================================================
   CONFIGURACIÓN
   ============================================================ */
// URL HTTP POST del trigger de Power Automate
const POWER_AUTOMATE_URL = "https://defaulte982e2ab16ea4111b3dff3a537f8d7.16.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/061c675a865642d6ad4ec251fa32e44a/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=hoOXmRnCtcrG-Z1UEFC39LQdnrKsJRZiXVntRdvPk14";

/* ============================================================
   CONVERSOR: NÚMERO A LETRAS (PESOS COLOMBIANOS)
   ============================================================ */
const UNIDADES = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE",
                  "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISÉIS",
                  "DIECISIETE", "DIECIOCHO", "DIECINUEVE", "VEINTE"];
const DECENAS = ["", "", "VEINTI", "TREINTA", "CUARENTA", "CINCUENTA",
                 "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
const CENTENAS = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS",
                  "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];

function centenaALetras(n) {
  if (n === 0) return "";
  if (n === 100) return "CIEN";
  const c = Math.floor(n / 100);
  const resto = n % 100;
  let txt = CENTENAS[c];
  if (resto > 0) txt += (txt ? " " : "") + decenaALetras(resto);
  return txt.trim();
}

function decenaALetras(n) {
  if (n <= 20) return UNIDADES[n];
  if (n < 30) {
    const u = n - 20;
    return u === 0 ? "VEINTE" : "VEINTI" + UNIDADES[u];
  }
  const d = Math.floor(n / 10);
  const u = n % 10;
  return DECENAS[d] + (u > 0 ? " Y " + UNIDADES[u] : "");
}

function numeroALetras(num) {
  num = Math.floor(Math.abs(Number(num)));
  if (isNaN(num)) return "";
  if (num === 0) return "CERO PESOS M/L";

  const millones = Math.floor(num / 1000000);
  const miles = Math.floor((num % 1000000) / 1000);
  const resto = num % 1000;

  const partes = [];

  if (millones > 0) {
    if (millones === 1) partes.push("UN MILLÓN");
    else partes.push(centenaALetras(millones) + " MILLONES");
  }
  if (miles > 0) {
    if (miles === 1) partes.push("MIL");
    else partes.push(centenaALetras(miles) + " MIL");
  }
  if (resto > 0) partes.push(centenaALetras(resto));

  return partes.join(" ").replace(/\s+/g, " ").trim() + " PESOS M/L";
}

/* ============================================================
   CONVERSOR: FECHA A LETRAS (es-CO)
   -> "seis (06) días del mes de enero de 2026"
   ============================================================ */
const DIAS_TEXTO = ["", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO",
  "NUEVE", "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISÉIS",
  "DIECISIETE", "DIECIOCHO", "DIECINUEVE", "VEINTE", "VEINTIUNO", "VEINTIDÓS",
  "VEINTITRÉS", "VEINTICUATRO", "VEINTICINCO", "VEINTISÉIS", "VEINTISIETE",
  "VEINTIOCHO", "VEINTINUEVE", "TREINTA", "TREINTA Y UNO"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
               "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function fechaALetras(isoDate) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return "";
  const diaTexto = DIAS_TEXTO[d].toLowerCase();
  const diaNum = String(d).padStart(2, "0");
  return `${diaTexto} (${diaNum}) días del mes de ${MESES[m - 1]} de ${y}`;
}

/* ============================================================
   VISTA PREVIA
   ============================================================ */
const $ = id => document.getElementById(id);

function actualizarValor(idInput, idPrev) {
  const v = $(idInput).value;
  $(idPrev).textContent = v ? numeroALetras(v) : "Vista previa en letras…";
}

function actualizarFecha(idInput, idPrev) {
  const v = $(idInput).value;
  $(idPrev).textContent = v ? fechaALetras(v) : "Vista previa en letras…";
}

$("valor_total_numero").addEventListener("input", () => actualizarValor("valor_total_numero", "prev_valor_total"));
$("valor_mensual_numero").addEventListener("input", () => actualizarValor("valor_mensual_numero", "prev_valor_mensual"));
$("fecha_firma_numero").addEventListener("input", () => actualizarFecha("fecha_firma_numero", "prev_fecha_firma"));

/* ============================================================
   REFERENCIAS Y ESTADO
   ============================================================ */
const form = $("contratoForm");
const mensaje = $("mensaje");
const btnEnviar = $("btnEnviar");
const inputArchivo = $("archivoContrato");
const btnCargar = $("btnCargar");
const archivoInfo = $("archivoInfo");

// PDF cargado por el usuario (firmado)
let pdfBase64 = null;
let pdfNombre = null;

function mostrarMensaje(tipo, texto) {
  mensaje.className = tipo;
  mensaje.textContent = texto;
  mensaje.style.display = "block";
}

/* ============================================================
   RECOPILAR DATOS DEL FORMULARIO
   ============================================================ */
function recopilarDatos() {
  const data = Object.fromEntries(new FormData(form).entries());

  // Conversiones automáticas
  data.valor_total_numero = Number(data.valor_total_numero);
  data.valor_mensual_numero = Number(data.valor_mensual_numero);
  data.valor_total_letras = numeroALetras(data.valor_total_numero);
  data.valor_mensual_letras = numeroALetras(data.valor_mensual_numero);
  data.fecha_firma_letras = fechaALetras(data.fecha_firma_numero);

  // Convertir actividades a array
  if (data.actividades_principales) {
    data.actividades_principales = data.actividades_principales
      .split("\n").map(s => s.trim()).filter(s => s.length > 0);
  }

  return data;
}

/* ============================================================
   1) GENERAR CONTRATO -> DESCARGA WORD (.doc)
   ============================================================ */
function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function construirDocumentoWord(d) {
  const actividades = Array.isArray(d.actividades_principales)
    ? d.actividades_principales.map(a => `<li>${escapeHtml(a)}</li>`).join("")
    : "";

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8">
<style>
  body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #000; }
  h1 { font-size: 14pt; text-align: center; }
  h2 { font-size: 12pt; }
  p { text-align: justify; }
  .label { font-weight: bold; }
</style>
</head>
<body>
  <h1>CONTRATO DE PRESTACIÓN DE SERVICIOS N° ${escapeHtml(d.numero_contrato)}</h1>

  <p>En la ciudad, a los ${escapeHtml(d.fecha_firma_letras)}, se celebra el presente
  contrato entre la EMPRESA DE PARQUES Y EVENTOS DE ANTIOQUIA — ACTIVA y el(la)
  contratista <span class="label">${escapeHtml(d.nombre_contratista)}</span>,
  identificado(a) con cédula de ciudadanía N° ${escapeHtml(d.cedula_contratista)}
  expedida en ${escapeHtml(d.ciudad_expedicion_cc)}, correo electrónico
  ${escapeHtml(d.email_contratista)}.</p>

  <h2>PRIMERA. OBJETO</h2>
  <p>${escapeHtml(d.objeto_contrato)}</p>

  <h2>SEGUNDA. ACTIVIDADES</h2>
  <ol>${actividades}</ol>

  <h2>TERCERA. VALOR Y FORMA DE PAGO</h2>
  <p>El valor total del contrato es de
  $${Number(d.valor_total_numero).toLocaleString("es-CO")}
  (${escapeHtml(d.valor_total_letras)}), pagaderos en mensualidades de
  $${Number(d.valor_mensual_numero).toLocaleString("es-CO")}
  (${escapeHtml(d.valor_mensual_letras)}).</p>

  <h2>CUARTA. PLAZO</h2>
  <p>${escapeHtml(d.plazo_texto)} Fecha de terminación: ${escapeHtml(d.fecha_terminacion)}.</p>

  <h2>QUINTA. MARCO NORMATIVO Y PRESUPUESTAL</h2>
  <p>Resolución N° ${escapeHtml(d.resolucion_numero)} del ${escapeHtml(d.resolucion_fecha)}.
  CDP N° ${escapeHtml(d.cdp_numero)} del ${escapeHtml(d.cdp_fecha)}.
  CRP N° ${escapeHtml(d.crp_numero)} del ${escapeHtml(d.crp_fecha)}.</p>

  <h2>SEXTA. SUPERVISIÓN</h2>
  <p>La supervisión estará a cargo de ${escapeHtml(d.supervisor_nombre)},
  en su calidad de ${escapeHtml(d.supervisor_cargo)}.</p>

  <br><br>
  <p>_____________________________<br>${escapeHtml(d.nombre_contratista)}<br>Contratista</p>
</body>
</html>`;
}

function generarWord() {
  if (!form.reportValidity()) return;

  const data = recopilarDatos();
  const html = construirDocumentoWord(data);
  const blob = new Blob(["﻿", html], { type: "application/msword" });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Contrato_${(data.numero_contrato || "ACTIVA").replace(/\s+/g, "_")}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  mostrarMensaje("ok", "📄 Contrato (Word) generado. Revísalo, fírmalo y guárdalo como PDF para cargarlo.");
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  generarWord();
});

/* ============================================================
   2) CARGAR CONTRATO (PDF) -> BASE64
   ============================================================ */
btnCargar.addEventListener("click", () => inputArchivo.click());

inputArchivo.addEventListener("change", () => {
  const file = inputArchivo.files[0];
  if (!file) return;

  if (file.type !== "application/pdf") {
    mostrarMensaje("err", "❌ El archivo debe ser un PDF.");
    inputArchivo.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    // reader.result -> "data:application/pdf;base64,XXXX"; tomamos solo el base64
    pdfBase64 = reader.result.split(",")[1];
    pdfNombre = file.name;
    archivoInfo.textContent = `📎 ${file.name} (${(file.size / 1024).toFixed(0)} KB)`;
    btnEnviar.disabled = false;
    mostrarMensaje("ok", "✅ Contrato cargado. Ya puedes enviarlo a ACTIVA.");
  };
  reader.onerror = () => mostrarMensaje("err", "❌ No se pudo leer el archivo.");
  reader.readAsDataURL(file);
});

/* ============================================================
   3) ENVIAR A ACTIVA -> POST JSON (con PDF en base64)
   ============================================================ */
btnEnviar.addEventListener("click", async () => {
  if (!form.reportValidity()) return;
  if (!pdfBase64) {
    mostrarMensaje("err", "❌ Primero debes cargar el contrato en PDF.");
    return;
  }

  btnEnviar.disabled = true;
  btnEnviar.textContent = "Enviando...";
  mensaje.style.display = "none";

  const data = recopilarDatos();
  data.archivo_nombre = pdfNombre;
  data.archivo_pdf_base64 = pdfBase64;

  try {
    const resp = await fetch(POWER_AUTOMATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!resp.ok) throw new Error("HTTP " + resp.status);

    mostrarMensaje("ok", "✅ Contrato enviado correctamente a ACTIVA.");
    form.reset();
    document.querySelectorAll(".preview").forEach(p => p.textContent = "Vista previa en letras…");
    pdfBase64 = null;
    pdfNombre = null;
    inputArchivo.value = "";
    archivoInfo.textContent = "";
    btnEnviar.disabled = true;
  } catch (err) {
    mostrarMensaje("err", "❌ Error al enviar: " + err.message);
    btnEnviar.disabled = false;
  } finally {
    btnEnviar.textContent = "📤 Enviar a ACTIVA";
  }
});
