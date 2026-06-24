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
   ENVÍO A POWER AUTOMATE
   ============================================================ */
const form = $("contratoForm");
const mensaje = $("mensaje");
const btn = $("btnEnviar");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  btn.disabled = true;
  btn.textContent = "Enviando...";
  mensaje.style.display = "none";

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

  try {
    const resp = await fetch(POWER_AUTOMATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!resp.ok) throw new Error("HTTP " + resp.status);

    mensaje.className = "ok";
    mensaje.textContent = "✅ Contrato enviado correctamente a Power Automate.";
    mensaje.style.display = "block";
    form.reset();
    document.querySelectorAll(".preview").forEach(p => p.textContent = "Vista previa en letras…");
  } catch (err) {
    mensaje.className = "err";
    mensaje.textContent = "❌ Error al enviar: " + err.message;
    mensaje.style.display = "block";
  } finally {
    btn.disabled = false;
    btn.textContent = "🚀 Generar contrato";
  }
});
