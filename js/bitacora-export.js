/* ============================================================
   DESCARGAR BITÁCORAS — LOTE 10/09/2026 · SEC-HACIENDA
   BD Predial · Excel y PDF

   Qué agrega
     Un botón  📥 DESCARGAR BITÁCORAS  junto a las pastillas
     🗒️ MIS BITÁCORAS / 📖 VER MIS BITÁCORAS que ya puso el lote
     del 06/09, y un botón  🗒️ BITÁCORA  dentro del modal Ver de
     cada expediente. Los dos abren el mismo modal de descarga.

   De dónde salen los datos: DE LA MEMORIA, no del servidor
     La columna S (BITACORA) ya viaja en el listado ligero de BD
     Predial (rowToPredialListObj_), así que las 9.4xx filas ya
     están en el navegador desde que se abre la vista. Este módulo
     lee:
       · __bdpFilteredCache  → lo que está filtrado EN PANTALLA
       · __bdpListCache      → todo lo que esta persona puede ver
     y arma el archivo ahí mismo. CERO viajes a Apps Script, cero
     endpoints nuevos, cero cambios en Descargas.gs. Es el mismo
     patrón de carga única de la vista: el viaje se paga una vez al
     entrar y no se vuelve a pagar.

   Por qué no hay que revalidar permisos
     El caché de pantalla ES lo que el servidor ya autorizó a ver
     (PRED_puerta_/PRED_visible_ en Código.gs). Aquí no se puede
     bajar nada que no estuviera ya en pantalla.

   Quién ve qué anotaciones (decisión del 10/09)
     · ADMIN y DEV eligen: TODAS las anotaciones o SOLO LAS MÍAS.
     · Los demás: SOLO LAS SUYAS, sin opción.
     La regla de "mías" es la MISMA que usa el servidor para la
     descarga por bitácora (DSC_bitacoraEnRango_) y la misma que usa
     el modal 📖 VER MIS BITÁCORAS: se reutiliza el lector que ya
     expone js/bitacora.js (window.BITACORA.anotaciones), no se
     escribe una segunda copia que se pueda desincronizar.

   Excel y PDF
     Las dos librerías se bajan del CDN solo cuando se usan por
     primera vez, igual que la Fase 6 con SheetJS. Si el CDN falla:
     Excel cae a CSV y PDF cae a la ventana de impresión del
     navegador (que en móvil y en PC ofrece "Guardar como PDF").

   No modifica app.js, styles.css ni js/bitacora.js.
   ============================================================ */
(function () {
  'use strict';

  if (window.__HACBITEXP_LISTO) return;
  window.__HACBITEXP_LISTO = true;

  var CDN_XLSX  = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
  var CDN_JSPDF = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
  var CLAVE_COLS = 'hac.bitexport.v1';

  var VISTA = 'view-bd-predial';
  var ICONO = 'img/icon-192.png';

  /* Las columnas del expediente que se pueden marcar. Todas viven ya en el
     listado ligero: ninguna obliga a pedirle nada al servidor. `num` marca
     las que deben ir al Excel como número (para que sumen). */
  var COLUMNAS = [
    { k: 'no_exp_fisico',   t: 'NO. EXP. FÍSICO', def: true  },
    { k: 'nombres',         t: 'NOMBRES',         def: true  },
    { k: 'ficha_catastral', t: 'FICHA CATASTRAL', def: true, ficha: true },
    { k: 'direccion_predio',t: 'DIRECCIÓN PREDIO',def: true  },
    { k: 'nit_cedula',      t: 'NIT O CÉDULA',    def: false },
    { k: 'valor_deuda',     t: 'VALOR DEUDA',     def: false, num: true },
    { k: 'clasificacion',   t: 'CLASIFICACIÓN',   def: false },
    { k: 'actuacion',       t: 'ACTUACIÓN',       def: false },
    { k: 'sustanciador',    t: 'SUSTANCIADOR',    def: false },
    { k: 'asistente',       t: 'ASISTENTE',       def: false },
    { k: 'estado_proceso',  t: 'ESTADO PROCESO',  def: false }
  ];

  var expFijo = null;      /* fila cuando el modal se abre desde un expediente */
  var bajando = false;

  /* ══════════════ utilidades ══════════════ */

  function $(id) { return document.getElementById(id); }
  function txt(v) { return String(v == null ? '' : v).trim(); }

  function escapar(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  /* Los cachés de app.js son `let` de nivel superior: no cuelgan de window
     pero sí se ven desde otro script clásico. Mismo truco de js/bitacora.js. */
  function leer(nombre) {
    try {
      /* jshint evil:true */
      var v = (0, eval)(nombre);
      return Array.isArray(v) ? v : [];
    } catch (_) { return []; }
  }

  function miNombre() {
    try {
      if (window.ALC && window.ALC.nombre) return txt(window.ALC.nombre);
      if (window.currentUser && window.currentUser.nombre) return txt(window.currentUser.nombre);
    } catch (_) {}
    return '';
  }

  function mando() {
    try { return !!(window.IDN && window.IDN.esAdmin && window.IDN.esAdmin()); }
    catch (_) { return false; }
  }

  /* El lector de bitácora es el de js/bitacora.js: una sola regla en toda la
     app. Si ese archivo no montó, no se inventa otra: se avisa y no se baja. */
  function anotaciones(texto, autor) {
    if (window.BITACORA && typeof window.BITACORA.anotaciones === 'function') {
      return window.BITACORA.anotaciones(texto, autor);
    }
    return null;
  }

  function ficha(v) {
    try {
      if (typeof window.bdpCleanFicha_ === 'function') return txt(window.bdpCleanFicha_(v));
    } catch (_) {}
    return txt(v).replace(/^'/, '');
  }

  function valorCol(fila, col) {
    if (col.ficha) return ficha(fila[col.k]);
    if (col.num)   return Number(fila[col.k]) || 0;
    return txt(fila[col.k]);
  }

  function pesos(n) {
    var x = Number(n) || 0;
    return '$ ' + x.toLocaleString('es-CO');
  }

  function hoyISO(d) {
    var f = d || new Date();
    var p = function (n) { return String(n).padStart(2, '0'); };
    return f.getFullYear() + '-' + p(f.getMonth() + 1) + '-' + p(f.getDate());
  }

  function dia(iso) {
    var m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? Number(m[1]) * 10000 + Number(m[2]) * 100 + Number(m[3]) : 0;
  }

  function selloArchivo() {
    var f = new Date();
    var p = function (n) { return String(n).padStart(2, '0'); };
    return p(f.getDate()) + '-' + p(f.getMonth() + 1) + '-' + f.getFullYear();
  }

  function selloLargo() {
    var f = new Date();
    var p = function (n) { return String(n).padStart(2, '0'); };
    return p(f.getDate()) + '/' + p(f.getMonth() + 1) + '/' + f.getFullYear() +
           ' a las ' + p(f.getHours()) + ':' + p(f.getMinutes());
  }

  function nombreArchivo(base, ext) {
    return String(base).replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim() +
           ' ' + selloArchivo() + '.' + ext;
  }

  function guardadas() {
    try {
      var t = JSON.parse(localStorage.getItem(CLAVE_COLS) || '{}');
      return Array.isArray(t.columnas) ? t.columnas : null;
    } catch (_) { return null; }
  }

  function guardar(cols) {
    try { localStorage.setItem(CLAVE_COLS, JSON.stringify({ columnas: cols })); }
    catch (_) {}
  }

  /* El aviso va por los dos caminos del lote 06/09: SweetAlert (que desde ese
     lote sí sale por encima de los modales) y una línea dentro del modal. */
  function avisar(icono, titulo, texto) {
    enModal(titulo, texto, icono);
    if (window.Swal) window.Swal.fire({ icon: icono, title: titulo, text: texto || '' });
    else alert(titulo + (texto ? '\n' + texto : ''));
  }

  function enModal(titulo, texto, icono) {
    var capa = $('modal-bitexp');
    if (!capa || capa.classList.contains('hidden')) return;
    var el = $('bxp-avance');
    if (!el) return;
    el.textContent = titulo + (texto ? ' — ' + texto : '');
    el.className = 'bxp-avance ' +
      (icono === 'error' || icono === 'warning' ? 'bxp-avance-malo' : 'bxp-avance-aviso');
  }

  function avance(texto) {
    var el = $('bxp-avance');
    if (!el) return;
    el.textContent = texto || '';
    el.className = 'bxp-avance';
  }

  /* ══════════════ armar los datos ══════════════ */

  /** Las filas sobre las que se trabaja, según el alcance elegido. */
  function filasDelAlcance() {
    if (expFijo) return [expFijo];
    var quiero = (document.querySelector('input[name="bxp-alcance"]:checked') || {}).value || 'pantalla';
    return quiero === 'todo' ? leer('__bdpListCache') : leer('__bdpFilteredCache');
  }

  /** ¿De quién son las anotaciones que cuentan? '' = de todos. */
  function autorElegido() {
    if (!mando()) return miNombre();
    var v = (document.querySelector('input[name="bxp-autor"]:checked') || {}).value || 'todas';
    return v === 'mias' ? miNombre() : '';
  }

  function rangoElegido() {
    var on = $('bxp-fechas') && $('bxp-fechas').checked;
    if (!on) return { desde: 0, hasta: 0 };
    return {
      desde: dia($('bxp-fechas-desde') ? $('bxp-fechas-desde').value : ''),
      hasta: dia($('bxp-fechas-hasta') ? $('bxp-fechas-hasta').value : '')
    };
  }

  /**
   * El corazón: convierte filas de expediente en una lista de ANOTACIONES.
   * Devuelve { items:[…], expedientes:n } o null si el lector no está.
   * Cada item lleva su expediente al lado, para que Excel salga plano y el
   * PDF pueda agrupar sin volver a recorrer nada.
   */
  function recolectar() {
    var filas  = filasDelAlcance();
    var autor  = autorElegido();
    var rango  = rangoElegido();
    var items  = [];
    var exps   = {};

    for (var i = 0; i < filas.length; i++) {
      var r = filas[i];
      var anot = anotaciones(r.bitacora, autor);
      if (anot === null) return null;
      if (!anot.length) continue;

      for (var j = 0; j < anot.length; j++) {
        var a = anot[j];
        if (rango.desde && a.dia < rango.desde) continue;
        if (rango.hasta && a.dia > rango.hasta) continue;
        items.push({
          dia: a.dia, anio: a.anio, mes: a.mes,
          fecha: a.fecha, autor: a.autor, texto: a.texto,
          fila: r
        });
        /* La cuenta de expedientes va por ID PREDIAL (col A), que es único
           en la hoja; el N° Exp. Físico solo se usa para mostrar (hoy no se
           repite, pero 3.002 filas todavía no lo tienen). */
        exps[txt(r.id_predial) || ('#' + i)] = true;
      }
    }

    var n = 0;
    for (var k in exps) { if (Object.prototype.hasOwnProperty.call(exps, k)) n++; }
    return { items: items, expedientes: n };
  }

  function columnasMarcadas() {
    var out = [];
    var cajas = document.querySelectorAll('#bxp-columnas input[type=checkbox]');
    for (var i = 0; i < cajas.length; i++) {
      if (!cajas[i].checked) continue;
      for (var j = 0; j < COLUMNAS.length; j++) {
        if (COLUMNAS[j].k === cajas[i].value) out.push(COLUMNAS[j]);
      }
    }
    return out;
  }

  /* ══════════════ el modal ══════════════ */

  function crearModal() {
    if ($('modal-bitexp')) return;

    var capa = document.createElement('div');
    capa.id = 'modal-bitexp';
    capa.className = 'hidden';
    capa.setAttribute('role', 'dialog');
    capa.innerHTML =
      '<div class="card narrow bxp-caja">' +
        '<h2 id="bxp-titulo" style="color:var(--primary);margin-top:0;">DESCARGAR BITÁCORAS</h2>' +
        '<p id="bxp-alcance-txt" class="bxp-alcance"></p>' +
        '<div id="bxp-opciones"></div>' +
        '<div class="bxp-cols-cab">' +
          '<label>Columnas del expediente</label>' +
          '<div class="bxp-cols-acc">' +
            '<button type="button" id="btn-bxp-todas" class="bxp-mini" data-salida="1">Todas</button>' +
            '<button type="button" id="btn-bxp-ninguna" class="bxp-mini" data-salida="1">Ninguna</button>' +
          '</div>' +
        '</div>' +
        '<p class="bxp-nota">Cada fila lleva siempre <b>FECHA</b>, <b>AUTOR</b> y <b>ANOTACIÓN</b>. ' +
          'Lo que marques aquí se agrega al lado.</p>' +
        '<div id="bxp-columnas" class="bxp-columnas"></div>' +
        '<p id="bxp-conteo" class="bxp-conteo"></p>' +
        '<p id="bxp-avance" class="bxp-avance"></p>' +
        '<div class="btn-row bxp-botones" style="margin-top:14px;">' +
          '<button id="btn-bxp-excel" class="btn-primary">DESCARGAR EXCEL</button>' +
          '<button id="btn-bxp-pdf" class="bxp-btn-pdf">DESCARGAR PDF</button>' +
          '<button id="btn-bxp-cerrar" class="danger">CERRAR</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(capa);

    $('btn-bxp-cerrar').addEventListener('click', cerrar);
    $('btn-bxp-todas').addEventListener('click', function () { marcarTodas(true); });
    $('btn-bxp-ninguna').addEventListener('click', function () { marcarTodas(false); });
    $('btn-bxp-excel').addEventListener('click', function () { descargar('excel'); });
    $('btn-bxp-pdf').addEventListener('click', function () { descargar('pdf'); });

    $('bxp-opciones').addEventListener('change', function (ev) {
      var t = ev && ev.target;
      if (t && t.id === 'bxp-fechas') {
        var caja = $('bxp-fechas-bloque');
        if (caja) caja.classList.toggle('bxp-off', !t.checked);
      }
      pintarConteo();
    });
    $('bxp-opciones').addEventListener('input', pintarConteo);
    $('bxp-columnas').addEventListener('change', pintarConteo);

    /* Que cierre con clic fuera, como los demás modales (Fase 3). */
    try { if (window.BV && window.BV._cierres) window.BV._cierres['modal-bitexp'] = ['btn-bxp-cerrar']; }
    catch (_) {}
  }

  function marcarTodas(valor) {
    var cajas = document.querySelectorAll('#bxp-columnas input[type=checkbox]');
    for (var i = 0; i < cajas.length; i++) cajas[i].checked = valor;
    pintarConteo();
  }

  function pintarColumnas() {
    var cont = $('bxp-columnas');
    cont.innerHTML = '';
    var previas = guardadas();

    for (var i = 0; i < COLUMNAS.length; i++) {
      var col = COLUMNAS[i];
      var id = 'bxp-c-' + col.k;

      var fila = document.createElement('label');
      fila.className = 'bxp-col';
      fila.setAttribute('for', id);

      var caja = document.createElement('input');
      caja.type = 'checkbox';
      caja.id = id;
      caja.value = col.k;
      caja.checked = previas ? (previas.indexOf(col.k) !== -1) : col.def;

      var t = document.createElement('span');
      t.textContent = col.t;

      fila.appendChild(caja);
      fila.appendChild(t);
      cont.appendChild(fila);
    }
  }

  function pintarOpciones() {
    var cont = $('bxp-opciones');
    cont.innerHTML = '';

    var hoy = new Date();
    var primero = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    var html = '';

    /* ── de quién ── */
    if (mando()) {
      html +=
        '<div class="bxp-bloque">' +
          '<div class="bxp-tit">Anotaciones</div>' +
          '<label class="bxp-radio" for="bxp-autor-todas">' +
            '<input type="radio" name="bxp-autor" id="bxp-autor-todas" value="todas" checked>' +
            '<span>Todas las anotaciones</span></label>' +
          '<label class="bxp-radio" for="bxp-autor-mias">' +
            '<input type="radio" name="bxp-autor" id="bxp-autor-mias" value="mias">' +
            '<span>Solo las mías</span></label>' +
        '</div>';
    } else {
      html += '<p class="bxp-nota bxp-fijo">Se descargan <b>solo tus anotaciones</b>.</p>';
    }

    /* ── alcance ── */
    if (!expFijo) {
      html +=
        '<div class="bxp-bloque">' +
          '<div class="bxp-tit">Alcance</div>' +
          '<label class="bxp-radio" for="bxp-alc-pantalla">' +
            '<input type="radio" name="bxp-alcance" id="bxp-alc-pantalla" value="pantalla" checked>' +
            '<span>Lo que estoy viendo en BD Predial <i id="bxp-n-pantalla"></i></span></label>' +
          '<label class="bxp-radio" for="bxp-alc-todo">' +
            '<input type="radio" name="bxp-alcance" id="bxp-alc-todo" value="todo">' +
            '<span>Todos los expedientes <i id="bxp-n-todo"></i></span></label>' +
          '<p class="bxp-nota">«Lo que estoy viendo» respeta las pastillas, los filtros y el ' +
            'buscador que tengas puestos ahora mismo.</p>' +
        '</div>';
    }

    /* ── rango de fechas ── */
    html +=
      '<div class="bxp-bloque bxp-off" id="bxp-fechas-bloque">' +
        '<label class="bxp-check" for="bxp-fechas">' +
          '<input type="checkbox" id="bxp-fechas">' +
          '<span>Solo un rango de fechas (opcional)</span>' +
        '</label>' +
        '<div class="bxp-rango">' +
          '<div><label for="bxp-fechas-desde">Desde</label>' +
            '<input type="date" id="bxp-fechas-desde" value="' + hoyISO(primero) + '"></div>' +
          '<div><label for="bxp-fechas-hasta">Hasta</label>' +
            '<input type="date" id="bxp-fechas-hasta" value="' + hoyISO(hoy) + '"></div>' +
        '</div>' +
        '<p class="bxp-nota">Se mira la fecha de cada <b>anotación</b>, no la del expediente.</p>' +
      '</div>';

    cont.innerHTML = html;

    if (!expFijo) {
      var p = $('bxp-n-pantalla'), t = $('bxp-n-todo');
      if (p) p.textContent = '(' + leer('__bdpFilteredCache').length.toLocaleString('es-CO') + ')';
      if (t) t.textContent = '(' + leer('__bdpListCache').length.toLocaleString('es-CO') + ')';
    }
  }

  function pintarConteo() {
    var el = $('bxp-conteo');
    if (!el) return;
    var d = recolectar();
    if (d === null) { el.textContent = ''; return; }
    if (!d.items.length) {
      el.textContent = 'Con lo que elegiste no queda ninguna anotación para descargar.';
      return;
    }
    var texto = 'Se van a descargar ' + d.items.length.toLocaleString('es-CO') +
      (d.items.length === 1 ? ' anotación' : ' anotaciones') +
      ' de ' + d.expedientes.toLocaleString('es-CO') +
      (d.expedientes === 1 ? ' expediente.' : ' expedientes.');

    /* Aviso del tamaño del PDF. La fórmula sale de medir el PDF de verdad con
       estos mismos datos: 200 exp/270 anot = 28 págs · 800/1.087 = 110 ·
       1.927/2.540 = 261. Sale ~1 página por cada 17 entre expedientes y
       anotaciones. El Excel no tiene este problema y por eso no se avisa. */
    var pags = Math.ceil((d.expedientes + d.items.length) * 0.06);
    if (pags > 20) {
      texto += ' En PDF serían unas ' + pags.toLocaleString('es-CO') +
               ' páginas: si es para imprimir, conviene un rango de fechas.';
    }
    el.textContent = texto;
  }

  function abrir(fila) {
    expFijo = fila || null;
    crearModal();

    $('bxp-titulo').textContent = expFijo ? 'BITÁCORA DEL EXPEDIENTE' : 'DESCARGAR BITÁCORAS';
    $('bxp-alcance-txt').innerHTML = expFijo
      ? escapar(txt(expFijo.no_exp_fisico) || txt(expFijo.id_predial) || 'Sin número') +
        ' — ' + escapar(txt(expFijo.nombres))
      : 'Una fila por anotación, con el expediente al lado.';

    pintarOpciones();
    pintarColumnas();
    avance('');
    pintarConteo();

    $('modal-bitexp').classList.remove('hidden');
  }

  function cerrar() {
    if (bajando) return;                 /* no dejar el archivo a medias */
    var m = $('modal-bitexp');
    if (m) m.classList.add('hidden');
    expFijo = null;
  }

  /* ══════════════ librerías (perezosas) ══════════════ */

  function cargarScript(url, listo) {
    if (listo()) return Promise.resolve(true);
    return new Promise(function (ok) {
      var s = document.createElement('script');
      s.src = url;
      s.onload = function () { ok(listo()); };
      s.onerror = function () { ok(false); };
      document.head.appendChild(s);
    });
  }

  function cargarXLSX() {
    return cargarScript(CDN_XLSX, function () { return !!window.XLSX; });
  }

  function cargarJSPDF() {
    return cargarScript(CDN_JSPDF, function () {
      return !!(window.jspdf && window.jspdf.jsPDF);
    });
  }

  /* ══════════════ la descarga ══════════════ */

  function descargar(formato) {
    if (bajando) return;

    var d = recolectar();
    if (d === null) {
      avisar('error', 'No se puede leer la bitácora',
             'Falta js/bitacora.js. Recarga la app e inténtalo otra vez.');
      return;
    }
    if (!d.items.length) {
      avisar('info', 'No hay anotaciones para descargar',
             'Con el alcance y las fechas que elegiste no quedó ninguna.');
      return;
    }

    var cols = columnasMarcadas();
    guardar(cols.map(function (c) { return c.k; }));

    bajando = true;
    $('btn-bxp-excel').disabled = true;
    $('btn-bxp-pdf').disabled = true;
    avance('Armando el archivo…');

    var trabajo = (formato === 'pdf')
      ? escribirPDF(d, cols)
      : escribirExcel(d, cols);

    trabajo.then(function () {
      avance(d.items.length.toLocaleString('es-CO') + ' anotaciones descargadas.');
    }).catch(function (e) {
      avisar('error', 'No se pudo descargar', (e && e.message) ? e.message : String(e));
    }).then(function () {
      bajando = false;
      var a = $('btn-bxp-excel'), b = $('btn-bxp-pdf');
      if (a) a.disabled = false;
      if (b) b.disabled = false;
    });
  }

  function baseNombre() {
    if (expFijo) {
      return 'BITACORA ' + (txt(expFijo.no_exp_fisico) || txt(expFijo.id_predial) || 'EXPEDIENTE');
    }
    return 'BITACORAS BD PREDIAL';
  }

  function descripcionAlcance() {
    if (expFijo) {
      return 'Expediente ' + (txt(expFijo.no_exp_fisico) || txt(expFijo.id_predial) || '—') +
             ' — ' + txt(expFijo.nombres);
    }
    var quiero = (document.querySelector('input[name="bxp-alcance"]:checked') || {}).value || 'pantalla';
    return quiero === 'todo'
      ? 'Todos los expedientes visibles'
      : 'Los expedientes filtrados en pantalla';
  }

  function descripcionAutor() {
    var a = autorElegido();
    return a ? ('Anotaciones de ' + a) : 'Anotaciones de todos los autores';
  }

  function descripcionRango() {
    var r = rangoElegido();
    if (!r.desde && !r.hasta) return 'Sin rango de fechas';
    var f = function (n) {
      if (!n) return '—';
      var s = String(n);
      return s.slice(6, 8) + '/' + s.slice(4, 6) + '/' + s.slice(0, 4);
    };
    return 'Del ' + f(r.desde) + ' al ' + f(r.hasta);
  }

  /* ── Excel: plano, una fila por anotación, de la más nueva a la más vieja ── */

  function escribirExcel(d, cols) {
    var items = d.items.slice().sort(function (a, b) {
      if (b.dia !== a.dia) return b.dia - a.dia;
      var x = txt(a.fila.no_exp_fisico), y = txt(b.fila.no_exp_fisico);
      return x < y ? -1 : (x > y ? 1 : 0);
    });

    var encabezados = ['FECHA', 'AUTOR', 'ANOTACIÓN'];
    for (var i = 0; i < cols.length; i++) encabezados.push(cols[i].t);

    var filas = items.map(function (it) {
      var f = [it.fecha, it.autor, it.texto];
      for (var j = 0; j < cols.length; j++) f.push(valorCol(it.fila, cols[j]));
      return f;
    });

    return cargarXLSX().then(function (hay) {
      if (!hay) return escribirCSV(encabezados, filas);

      var hoja = window.XLSX.utils.aoa_to_sheet([encabezados].concat(filas));
      hoja['!cols'] = anchos(encabezados, filas);
      hoja['!freeze'] = { xSplit: 0, ySplit: 1 };

      var libro = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(libro, hoja, 'BITACORAS');
      window.XLSX.writeFile(libro, nombreArchivo(baseNombre(), 'xlsx'));
      return true;
    });
  }

  function anchos(encabezados, filas) {
    var out = [];
    for (var c = 0; c < encabezados.length; c++) {
      var max = String(encabezados[c] || '').length;
      var tope = Math.min(filas.length, 200);
      for (var i = 0; i < tope; i++) {
        var n = String(filas[i][c] == null ? '' : filas[i][c]).length;
        if (n > max) max = n;
      }
      /* La ANOTACIÓN es la columna larga: se le deja más aire que a las demás */
      var techo = (c === 2) ? 70 : 45;
      out.push({ wch: Math.min(Math.max(max + 2, 10), techo) });
    }
    return out;
  }

  function escribirCSV(encabezados, filas) {
    var esc = function (v) {
      var s = String(v == null ? '' : v);
      return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    var lineas = [encabezados.map(esc).join(';')];
    for (var i = 0; i < filas.length; i++) lineas.push(filas[i].map(esc).join(';'));

    var blob = new Blob(['\ufeff' + lineas.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    bajarBlob(blob, nombreArchivo(baseNombre(), 'csv'));

    avisar('info', 'Se descargó en CSV',
           'No se pudo cargar la librería de Excel. El CSV abre en Excel con doble clic.');
    return true;
  }

  function bajarBlob(blob, nombre) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* ── PDF: agrupado por expediente, que es como se lee una bitácora ── */

  /** Agrupa por expediente. Dentro de cada uno, en orden cronológico
   *  (de la más vieja a la más nueva); los expedientes se ordenan por su
   *  anotación más reciente. */
  function agrupar(items) {
    var mapa = {}, orden = [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var clave = txt(it.fila.id_predial) || ('#' + i);
      if (!mapa[clave]) {
        mapa[clave] = {
          clave: clave,
          titulo: txt(it.fila.no_exp_fisico) || txt(it.fila.id_predial) || '—',
          fila: it.fila, anot: [], ultimo: 0
        };
        orden.push(clave);
      }
      mapa[clave].anot.push(it);
      if (it.dia > mapa[clave].ultimo) mapa[clave].ultimo = it.dia;
    }
    var grupos = orden.map(function (k) { return mapa[k]; });
    grupos.sort(function (a, b) { return b.ultimo - a.ultimo; });
    grupos.forEach(function (g) { g.anot.sort(function (a, b) { return a.dia - b.dia; }); });
    return grupos;
  }

  /** El icono de la app como dataURL, para el encabezado del PDF. Es un
   *  archivo del propio repo (ya en la caché del service worker), no una
   *  imagen de fuera: si falla, el PDF sale igual, sin escudo. */
  function iconoDataURL() {
    return fetch(ICONO)
      .then(function (r) { return r.ok ? r.blob() : null; })
      .then(function (b) {
        if (!b) return null;
        return new Promise(function (ok) {
          var fr = new FileReader();
          fr.onload = function () { ok(String(fr.result)); };
          fr.onerror = function () { ok(null); };
          fr.readAsDataURL(b);
        });
      })
      .catch(function () { return null; });
  }

  function escribirPDF(d, cols) {
    var grupos = agrupar(d.items);

    return Promise.all([cargarJSPDF(), iconoDataURL()]).then(function (res) {
      if (!res[0]) return imprimirHTML(grupos, cols, d);
      return dibujarPDF(grupos, cols, d, res[1]);
    });
  }

  function dibujarPDF(grupos, cols, d, icono) {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

    var M = 14;                       /* margen */
    var W = 210, H = 297;
    var ANCHO = W - M * 2;
    var y = 0;
    var VERDE = [6, 64, 43];
    var GRIS  = [107, 124, 116];

    function cabecera() {
      doc.setFillColor(VERDE[0], VERDE[1], VERDE[2]);
      doc.rect(0, 0, W, 22, 'F');
      if (icono) {
        try { doc.addImage(icono, 'PNG', M, 4, 14, 14); } catch (_) {}
      }
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text('ALCALDÍA MUNICIPAL DE FLANDES — TOLIMA', M + (icono ? 18 : 0), 10);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text('Secretaría de Hacienda · Base de Datos del Impuesto Predial',
               M + (icono ? 18 : 0), 15.5);
      doc.setTextColor(0, 0, 0);
      y = 30;
    }

    function pieDeTodas() {
      var total = doc.internal.getNumberOfPages();
      for (var p = 1; p <= total; p++) {
        doc.setPage(p);
        doc.setDrawColor(220, 226, 223);
        doc.line(M, H - 14, W - M, H - 14);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(GRIS[0], GRIS[1], GRIS[2]);
        doc.text('Generado desde la app SEC-HACIENDA · ' + selloLargo(), M, H - 9);
        doc.text('Página ' + p + ' de ' + total, W - M, H - 9, { align: 'right' });
        doc.setTextColor(0, 0, 0);
      }
    }

    function espacio(alto) {
      if (y + alto <= H - 18) return;
      doc.addPage();
      cabecera();
    }

    cabecera();

    /* ── portada de la primera página ── */
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(VERDE[0], VERDE[1], VERDE[2]);
    doc.text(expFijo ? 'BITÁCORA DEL EXPEDIENTE' : 'BITÁCORA DE EXPEDIENTES', M, y);
    doc.setTextColor(0, 0, 0);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    var meta = [
      descripcionAlcance(),
      descripcionAutor(),
      descripcionRango(),
      d.items.length.toLocaleString('es-CO') +
        (d.items.length === 1 ? ' anotación' : ' anotaciones') + ' en ' +
        d.expedientes.toLocaleString('es-CO') +
        (d.expedientes === 1 ? ' expediente' : ' expedientes'),
      'Generado por ' + (miNombre() || '—') + ' el ' + selloLargo()
    ];
    for (var i = 0; i < meta.length; i++) {
      var lineas = doc.splitTextToSize(meta[i], ANCHO);
      doc.text(lineas, M, y);
      y += lineas.length * 4.4;
    }
    y += 3;
    doc.setDrawColor(VERDE[0], VERDE[1], VERDE[2]);
    doc.setLineWidth(0.6);
    doc.line(M, y, W - M, y);
    doc.setLineWidth(0.2);
    y += 7;

    /* ── grupos ── */
    for (var g = 0; g < grupos.length; g++) {
      var gr = grupos[g];

      espacio(24);

      /* barra del expediente */
      doc.setFillColor(233, 240, 236);
      doc.rect(M, y - 4.6, ANCHO, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(VERDE[0], VERDE[1], VERDE[2]);
      var tituloG = 'EXP. ' + gr.titulo;
      var nom = txt(gr.fila.nombres);
      if (nom) tituloG += '  —  ' + nom;
      doc.text(doc.splitTextToSize(tituloG, ANCHO - 4)[0], M + 2, y);
      doc.setTextColor(0, 0, 0);
      y += 7;

      /* datos del expediente (las columnas marcadas), en dos columnas */
      var pares = [];
      for (var c = 0; c < cols.length; c++) {
        if (cols[c].k === 'nombres' || cols[c].k === 'no_exp_fisico') continue;  /* ya van arriba */
        var v = valorCol(gr.fila, cols[c]);
        if (cols[c].num) { if (!v) continue; v = pesos(v); }
        if (!txt(v)) continue;
        pares.push([cols[c].t, String(v)]);
      }
      if (pares.length) {
        doc.setFontSize(8);
        var colW = ANCHO / 2;
        for (var p2 = 0; p2 < pares.length; p2 += 2) {
          espacio(6);
          for (var lado = 0; lado < 2 && (p2 + lado) < pares.length; lado++) {
            var x = M + lado * colW;
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(GRIS[0], GRIS[1], GRIS[2]);
            doc.text(pares[p2 + lado][0] + ': ', x, y);
            var wl = doc.getTextWidth(pares[p2 + lado][0] + ': ');
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            doc.text(doc.splitTextToSize(pares[p2 + lado][1], colW - wl - 4)[0], x + wl, y);
          }
          y += 4.4;
        }
        y += 1.5;
      }

      /* anotaciones */
      for (var a = 0; a < gr.anot.length; a++) {
        var it = gr.anot[a];
        var cuerpo = doc.splitTextToSize(it.texto || '(sin texto)', ANCHO - 6);
        espacio(6 + cuerpo.length * 4.2);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(VERDE[0], VERDE[1], VERDE[2]);
        doc.text(it.fecha + '  ·  ' + (it.autor || 'SIN AUTOR'), M + 3, y);
        doc.setTextColor(0, 0, 0);
        y += 4.4;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(cuerpo, M + 3, y);
        y += cuerpo.length * 4.2 + 3;
      }

      y += 3;
    }

    pieDeTodas();
    doc.save(nombreArchivo(baseNombre(), 'pdf'));
    return true;
  }

  /** Respaldo si no se pudo bajar jsPDF: se abre el mismo contenido en una
   *  ventana lista para imprimir. Tanto el móvil como el PC ofrecen ahí
   *  "Guardar como PDF", así nadie se queda sin su archivo. */
  function imprimirHTML(grupos, cols, d) {
    var html =
      '<!doctype html><html lang="es"><head><meta charset="utf-8">' +
      '<title>' + escapar(baseNombre()) + '</title><style>' +
      'body{font-family:Helvetica,Arial,sans-serif;color:#0f1f16;margin:24px;}' +
      'h1{color:#06402B;font-size:18px;margin:0 0 8px;}' +
      '.meta{font-size:12px;color:#3d5248;margin-bottom:4px;}' +
      'hr{border:0;border-top:2px solid #06402B;margin:14px 0;}' +
      '.g{margin:0 0 18px;page-break-inside:avoid;}' +
      '.gt{background:#e9f0ec;color:#06402B;font-weight:700;padding:6px 8px;font-size:13px;}' +
      '.gd{font-size:11px;color:#6b7c74;padding:6px 8px 0;}' +
      '.a{padding:6px 8px 0;}' +
      '.af{font-weight:700;color:#06402B;font-size:11px;}' +
      '.at{font-size:12px;white-space:pre-wrap;margin:2px 0 0;}' +
      '</style></head><body>' +
      '<h1>' + (expFijo ? 'BITÁCORA DEL EXPEDIENTE' : 'BITÁCORA DE EXPEDIENTES') + '</h1>' +
      '<div class="meta">' + escapar(descripcionAlcance()) + '</div>' +
      '<div class="meta">' + escapar(descripcionAutor()) + '</div>' +
      '<div class="meta">' + escapar(descripcionRango()) + '</div>' +
      '<div class="meta">' + d.items.length + ' anotaciones en ' + d.expedientes + ' expedientes</div>' +
      '<div class="meta">Generado por ' + escapar(miNombre() || '—') + ' el ' + escapar(selloLargo()) + '</div>' +
      '<hr>';

    for (var g = 0; g < grupos.length; g++) {
      var gr = grupos[g];
      html += '<div class="g"><div class="gt">EXP. ' + escapar(gr.titulo) +
              (txt(gr.fila.nombres) ? ' &mdash; ' + escapar(gr.fila.nombres) : '') + '</div>';

      var datos = [];
      for (var c = 0; c < cols.length; c++) {
        if (cols[c].k === 'nombres' || cols[c].k === 'no_exp_fisico') continue;
        var v = valorCol(gr.fila, cols[c]);
        if (cols[c].num) { if (!v) continue; v = pesos(v); }
        if (!txt(v)) continue;
        datos.push(escapar(cols[c].t) + ': ' + escapar(String(v)));
      }
      if (datos.length) html += '<div class="gd">' + datos.join(' &nbsp;·&nbsp; ') + '</div>';

      for (var a = 0; a < gr.anot.length; a++) {
        html += '<div class="a"><div class="af">' + escapar(gr.anot[a].fecha) + ' &middot; ' +
                escapar(gr.anot[a].autor || 'SIN AUTOR') + '</div>' +
                '<p class="at">' + escapar(gr.anot[a].texto || '(sin texto)') + '</p></div>';
      }
      html += '</div>';
    }
    html += '</body></html>';

    var v = window.open('', '_blank');
    if (!v) {
      avisar('warning', 'No se pudo abrir la ventana de impresión',
             'Permite las ventanas emergentes o descárgalo en Excel.');
      return true;
    }
    v.document.write(html);
    v.document.close();
    setTimeout(function () { try { v.focus(); v.print(); } catch (_) {} }, 400);

    avisar('info', 'Se abrió para imprimir',
           'No se pudo cargar la librería de PDF. En la ventana que se abrió elige "Guardar como PDF".');
    return true;
  }

  /* ══════════════ los botones ══════════════ */

  /** La pastilla de BD Predial, al lado de las dos del lote 06/09. */
  function pintarPastilla() {
    if ($('bxp-pill')) return;

    var b = document.createElement('button');
    b.type = 'button';
    b.id = 'bxp-pill';
    b.className = 'proc-status-pill bxp-pill';
    b.setAttribute('data-salida', '1');
    b.innerHTML = '📥 DESCARGAR BITÁCORAS';
    b.addEventListener('click', function () {
      try { if (window.playSoundOnce && window.SOUNDS) window.playSoundOnce(window.SOUNDS.menu); } catch (_) {}
      abrir(null);
    });

    /* Primero se intenta junto a las pastillas del lote 06/09; si ese lote
       no montó, se cuelga del mismo sitio donde va aquella fila. */
    var wrap = $('bit-pill-predial-wrap');
    if (wrap) { wrap.appendChild(b); return; }

    var ancla = $('bdp-pills-mias-wrap');
    if (!ancla || !ancla.parentNode) return;
    var propio = document.createElement('div');
    propio.className = 'bit-wrap bxp-wrap';
    propio.id = 'bxp-wrap';
    propio.appendChild(b);
    ancla.parentNode.insertBefore(propio, ancla.nextSibling);
  }

  /** El botón dentro del modal Ver de un expediente. */
  function engancharDetalle() {
    var original = window.abrirBDPDetalle_;
    if (typeof original !== 'function' || original.__bxp) return;
    var envuelta = function (row) {
      var r = original.apply(this, arguments);
      try { botonDetalle(row); } catch (e) { console.warn('BITEXPORT:', e); }
      return r;
    };
    envuelta.__bxp = true;
    window.abrirBDPDetalle_ = envuelta;
  }

  function botonDetalle(row) {
    var acciones = $('bdp-det-actions');
    if (!acciones || !row) return;
    if (!txt(row.bitacora)) return;          /* sin bitácora no hay qué bajar */
    if ($('btn-bxp-exp')) return;            /* app.js ya limpió el contenedor */

    var b = document.createElement('button');
    b.type = 'button';
    b.id = 'btn-bxp-exp';
    b.className = 'proc-action-btn bxp-btn-exp';
    b.setAttribute('data-salida', '1');
    b.innerHTML = '🗒️ BITÁCORA';
    b.addEventListener('click', function () {
      try { if (window.playSoundOnce && window.SOUNDS) window.playSoundOnce(window.SOUNDS.menu); } catch (_) {}
      abrir(row);
    });
    acciones.appendChild(b);
  }

  function alEntrar(vista) {
    if (vista !== VISTA) return;
    pintarPastilla();
  }

  function engancharVistas() {
    var original = window.showView;
    if (typeof original !== 'function' || original.__bxp) return;
    var envuelta = function (id) {
      var r = original.apply(this, arguments);
      try { alEntrar(id); } catch (e) { console.warn('BITEXPORT:', e); }
      return r;
    };
    envuelta.__bxp = true;
    window.showView = envuelta;
  }

  function arrancar() {
    engancharVistas();
    engancharDetalle();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
  else arrancar();

  /* Otras capas también envuelven showView y app.js define abrirBDPDetalle_
     al final de su archivo: se vuelve a enganchar por si alguna llegó
     después. Es idempotente (marca __bxp). */
  setTimeout(arrancar, 1500);

  /* Puerta para las pruebas. */
  window.BITEXPORT = {
    abrir: abrir,
    cerrar: cerrar,
    recolectar: recolectar,
    agrupar: agrupar,
    columnas: columnasMarcadas,
    catalogo: COLUMNAS,
    montar: alEntrar,
    botonDetalle: botonDetalle,
    ficha: ficha,
    expediente: function () { return expFijo; }
  };
})();
