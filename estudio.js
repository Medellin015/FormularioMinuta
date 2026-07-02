/* ============================================================
   GENERADOR DE ESTUDIO PREVIO (SBSF28) — ACTIVA
   Página independiente: solo genera el Word desde la plantilla.
   ============================================================ */

/* ============================================================
   CONVERSOR: NÚMERO A LETRAS (PESOS COLOMBIANOS)
   (mismas reglas que app.js del generador de contrato)
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

// Convierte 0..999.999 a letras
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
  if (num <= 0) return "CERO PESOS M/L";
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

// "2026-01-02" -> "02/01/2026"
function fechaCorta(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "";
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

/* ============================================================
   REFERENCIAS Y UTILIDADES
   ============================================================ */
const $ = id => document.getElementById(id);
const form = $("estudioForm");
const mensaje = $("mensaje");

function mostrarMensaje(tipo, texto) {
  mensaje.className = tipo;
  mensaje.textContent = texto;
  mensaje.style.display = "block";
}

// fetch con timeout: aborta la petición si el servidor no responde a tiempo.
async function fetchConTimeout(url, opciones = {}, ms = 30000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opciones, signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}

/* ============================================================
   VISTA PREVIA EN LETRAS
   ============================================================ */
function actualizarValor(idInput, idPrev) {
  const v = $(idInput).value;
  $(idPrev).textContent = v ? numeroALetras(v) : "Vista previa en letras…";
}

$("presupuesto_numero").addEventListener("input", () => actualizarValor("presupuesto_numero", "prev_presupuesto"));
$("valor_mensual_numero").addEventListener("input", () => actualizarValor("valor_mensual_numero", "prev_valor_mensual"));

/* ============================================================
   DATOS PARA LA PLANTILLA (marcadores {campo})
   ============================================================ */
function limpiarLineas(texto) {
  return (texto || "")
    .split("\n").map(s => s.trim()).filter(s => s.length > 0).join("\n");
}

function datosPlantilla() {
  const d = Object.fromEntries(new FormData(form).entries());
  const fmt = n => Math.max(0, Math.floor(Number(n) || 0)).toLocaleString("es-CO");
  const presupuesto = Math.max(0, Math.floor(Number(d.presupuesto_numero) || 0));
  const mensual = Math.max(0, Math.floor(Number(d.valor_mensual_numero) || 0));

  return {
    modalidad_contractual: d.modalidad_contractual || "",
    objeto: d.objeto || "",
    alcance: d.alcance || "",
    identificacion_contrato: d.identificacion_contrato || "",
    plazo: d.plazo || "",
    lugar_ejecucion: d.lugar_ejecucion || "",
    cliente: d.cliente || "",
    contrato_interadministrativo: d.contrato_interadministrativo || "",
    medio_satisfaccion: d.medio_satisfaccion || "",
    op_numero: d.op_numero || "",
    op_emisor: d.op_emisor || "",
    perfil_profesional: d.perfil_profesional || "",
    experiencia_anios: d.experiencia_anios || "",
    presupuesto_texto: `${numeroALetras(presupuesto)} ($${fmt(presupuesto)})`,
    valor_mensual_texto: `${numeroALetras(mensual)} ($${fmt(mensual)})`,
    dias_pago: d.dias_pago || "",
    cdp_codigo: d.cdp_codigo || "",
    cdp_rubro: d.cdp_rubro || "",
    cdp_numero: d.cdp_numero || "",
    cdp_fecha_texto: fechaCorta(d.cdp_fecha),
    cdp_valor_fmt: fmt(d.cdp_valor),
    actividades_principales: limpiarLineas(d.actividades_principales),
    entregables: limpiarLineas(d.entregables),
    espec_cantidad: d.espec_cantidad || "",
    espec_descripcion: d.espec_descripcion || "",
    unspsc_nivel: d.unspsc_nivel || "",
    unspsc_codigo: d.unspsc_codigo || "",
    unspsc_descripcion: d.unspsc_descripcion || "",
    obligaciones_intro: (d.obligaciones_intro || "").trim(),
    obligaciones_generales: limpiarLineas(d.obligaciones_generales),
    obligaciones_contratista: limpiarLineas(d.obligaciones_contratista),
    obligaciones_contratante: limpiarLineas(d.obligaciones_contratante),
    riesgo: d.riesgo || "",
    riesgo_etapa: d.riesgo_etapa || "",
    riesgo_nivel: d.riesgo_nivel || "",
    riesgo_tratamiento: d.riesgo_tratamiento || "",
    entidad_beneficiaria: d.entidad_beneficiaria || "",
    garantia_tomador: d.garantia_tomador || "",
    garantia_asegurados: d.garantia_asegurados || "",
    amparo: d.amparo || "",
    amparo_porcentaje: d.amparo_porcentaje || "",
    amparo_duracion: d.amparo_duracion || "",
    tipo_supervision: d.tipo_supervision || "supervisión",
    supervisor_nombre: d.supervisor_nombre || "",
    supervisor_area: d.supervisor_area || "",
    cargo_area_interesada: d.cargo_area_interesada || "",
    cargo_area_financiera: d.cargo_area_financiera || "",
    cargo_area_juridica: d.cargo_area_juridica || "",
    proyecto: d.proyecto || ""
  };
}

/* ============================================================
   GENERAR ESTUDIO PREVIO -> RELLENA LA PLANTILLA Y DESCARGA (.docx)
   ============================================================ */
const PLANTILLA_URL = "plantilla_estudio_previo.docx";

async function generarWord() {
  if (!form.reportValidity()) return;

  const Docx = window.docxtemplater || window.Docxtemplater;
  if (!window.PizZip || !Docx) {
    mostrarMensaje("err", "❌ No se cargaron las librerías para generar el Word. Revisa tu conexión.");
    return;
  }

  mostrarMensaje("ok", "⏳ Generando estudio previo…");

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

    const ref = ($("op_numero").value || "ACTIVA").replace(/\s+/g, "_");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Estudio_Previo_${ref}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    mostrarMensaje("ok", "📋 Estudio previo (Word) generado y descargado.");
  } catch (err) {
    let detalle;
    if (err.name === "AbortError") {
      detalle = "la plantilla tardó demasiado en cargar. Revisa tu conexión e inténtalo de nuevo.";
    } else if (err.properties && err.properties.errors) {
      detalle = err.properties.errors.map(e => e.properties.explanation).join("; ");
    } else {
      detalle = err.message;
    }
    mostrarMensaje("err", "❌ Error al generar el estudio previo: " + detalle);
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  generarWord();
});
