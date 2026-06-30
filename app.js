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

// Convierte 0..999.999 a letras ("CIENTO VEINTITRÉS MIL CUATROCIENTOS…")
function milesALetras(n) {
  if (n === 0) return "";
  const miles = Math.floor(n / 1000);
  const resto = n % 1000;
  let txt = "";
  if (miles === 1) txt = "MIL";
  else if (miles > 1) txt = centenaALetras(miles) + " MIL";
  if (resto > 0) txt += (txt ? " " : "") + centenaALetras(resto);
  return txt.trim();
}

function numeroALetras(num) {
  num = Number(num);
  if (isNaN(num)) return "";
  num = Math.floor(num);
  // Valores negativos no son válidos como dinero: se tratan como cero
  // (coherente con la cifra que se muestra entre paréntesis).
  if (num <= 0) return "CERO PESOS M/L";
  // Fuera del rango razonable de un contrato (>= un billón); evita
  // imprecisión de Number y un cuelgue del conversor.
  if (num > 999999999999) return num.toLocaleString("es-CO") + " PESOS M/L";

  const partes = [];
  const millones = Math.floor(num / 1000000);
  const resto = num % 1000000;

  if (millones > 0) {
    if (millones === 1) partes.push("UN MILLÓN");
    else partes.push(milesALetras(millones) + " MILLONES");
  }
  if (resto > 0) partes.push(milesALetras(resto));

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

  // Conversiones automáticas (enteros no negativos: misma base para
  // las letras, la cifra mostrada y el JSON enviado)
  data.valor_total_numero = Math.max(0, Math.floor(Number(data.valor_total_numero) || 0));
  data.valor_mensual_numero = Math.max(0, Math.floor(Number(data.valor_mensual_numero) || 0));
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
   FORMATEO DE FECHAS PARA LA PLANTILLA
   ============================================================ */
// "2026-06-30" -> "30 de junio de 2026"
function fechaLarga(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "";
  return `${d} de ${MESES[m - 1]} de ${y}`;
}

// "2026-01-02" -> "02/01/2026"
function fechaCorta(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "";
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

/* ============================================================
   DATOS PARA LA PLANTILLA WORD (marcadores {campo})
   ============================================================ */
function datosPlantilla() {
  const d = recopilarDatos();
  const fmt = n => Number(n).toLocaleString("es-CO");

  return {
    numero_contrato: d.numero_contrato || "",
    nombre_contratista: d.nombre_contratista || "",
    cedula_contratista: d.cedula_contratista || "",
    email_contratista: d.email_contratista || "",
    objeto_contrato: `“${d.objeto_contrato || ""}"`,
    alcance: d.alcance || "",
    actividades_principales: Array.isArray(d.actividades_principales)
      ? d.actividades_principales.join("\n") : "",
    valor_total_texto: `${d.valor_total_letras} ($${fmt(d.valor_total_numero)})`,
    valor_mensual_texto: `${d.valor_mensual_letras} ($${fmt(d.valor_mensual_numero)})`,
    plazo_texto: (d.plazo_texto || "").toUpperCase(),
    supervisor_nombre: d.supervisor_nombre || "",
    supervisor_cargo: d.supervisor_cargo || "",
    fecha_terminacion_texto: fechaLarga(d.fecha_terminacion),
    fecha_firma_letras: d.fecha_firma_letras || "",
    presupuesto_texto:
      `Certificado de Disponibilidad Presupuestal No ${d.cdp_numero} del ${fechaCorta(d.cdp_fecha)} ` +
      `y Certificado de Registro Presupuestal No ${d.crp_numero} del ${fechaCorta(d.crp_fecha)}.`,
    proyecto: d.proyecto || "",
    revision_juridica: d.revision_juridica || "",
    revision_financiera: d.revision_financiera || "",
    aprobo: d.aprobo || ""
  };
}

/* ============================================================
   1) GENERAR CONTRATO -> RELLENA LA PLANTILLA Y DESCARGA (.docx)
   ============================================================ */
const PLANTILLA_URL = "plantilla_contrato.docx";

// fetch con timeout: aborta la petición si el servidor no responde a tiempo,
// para que los spinners no queden colgados indefinidamente.
async function fetchConTimeout(url, opciones = {}, ms = 30000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opciones, signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}

async function generarWord() {
  if (!form.reportValidity()) return;

  const Docx = window.docxtemplater || window.Docxtemplater;
  if (!window.PizZip || !Docx) {
    mostrarMensaje("err", "❌ No se cargaron las librerías para generar el Word. Revisa tu conexión.");
    return;
  }

  mostrarMensaje("ok", "⏳ Generando contrato…");

  try {
    const resp = await fetchConTimeout(PLANTILLA_URL, {}, 20000);
    if (!resp.ok) throw new Error("No se encontró la plantilla (" + resp.status + ")");
    const buffer = await resp.arrayBuffer();

    const zip = new window.PizZip(buffer);
    const doc = new Docx(zip, { paragraphLoop: true, linebreaks: true });
    doc.render(datosPlantilla());

    const blob = doc.getZip().generate({
      type: "blob",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    });

    const numero = ($("numero_contrato").value || "ACTIVA").replace(/\s+/g, "_");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Contrato_${numero}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    mostrarMensaje("ok", "📄 Contrato (Word) generado. Revísalo, fírmalo y guárdalo como PDF para cargarlo.");
  } catch (err) {
    let detalle;
    if (err.name === "AbortError") {
      detalle = "la plantilla tardó demasiado en cargar. Revisa tu conexión e inténtalo de nuevo.";
    } else if (err.properties && err.properties.errors) {
      detalle = err.properties.errors.map(e => e.properties.explanation).join("; ");
    } else {
      detalle = err.message;
    }
    mostrarMensaje("err", "❌ Error al generar el contrato: " + detalle);
  }
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

  if (file.size === 0) {
    mostrarMensaje("err", "❌ El archivo PDF está vacío.");
    inputArchivo.value = "";
    return;
  }

  const MAX_PDF_MB = 10;
  if (file.size > MAX_PDF_MB * 1024 * 1024) {
    mostrarMensaje("err", `❌ El PDF supera el tamaño máximo permitido (${MAX_PDF_MB} MB).`);
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
    const resp = await fetchConTimeout(POWER_AUTOMATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }, 60000);
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
    let texto;
    if (err.name === "AbortError") {
      texto = "La conexión tardó demasiado. Revisa tu red e inténtalo de nuevo.";
    } else if (err.message && err.message.startsWith("HTTP")) {
      texto = "El servidor de ACTIVA respondió con un error. Inténtalo de nuevo en unos minutos.";
    } else {
      texto = "No se pudo conectar con ACTIVA. Revisa tu conexión a internet.";
    }
    mostrarMensaje("err", "❌ Error al enviar: " + texto);
    btnEnviar.disabled = false;
  } finally {
    btnEnviar.textContent = "📤 Enviar a ACTIVA";
  }
});
