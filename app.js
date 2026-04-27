/* ================== CONFIGURACIÓN ================== */
// TODO: pega aquí la URL /exec de tu Apps Script desplegado
const API_BASE = 'https://script.google.com/macros/s/AKfycby_TJ_vPiqPJdJdqBMuhya_Prwb7UMoFEUMISeHv_nAqT0jepMDfu5kNBn5ayTKiuJB_A/exec';
 
/* ================== SONIDOS (mismos tags/estilo indexref) ================== */
const SOUNDS = {
  question: 'https://res.cloudinary.com/dqqeavica/video/upload/v1759011577/Pay_fail_ls2aif.mp3',
  info: 'https://res.cloudinary.com/dqqeavica/video/upload/v1759011578/Default_notification_pkp4wr.mp3',
  success: 'https://res.cloudinary.com/dqqeavica/video/upload/v1759011577/Pay_success_t5aawh.mp3',
  error: 'https://res.cloudinary.com/dqqeavica/video/upload/v1759011578/Low_battery_d5qua1.mp3',
  warning: 'https://res.cloudinary.com/dqqeavica/video/upload/v1759011578/Low_battery_d5quaa1.mp3',
  login: 'https://res.cloudinary.com/dqqeavica/video/upload/v1759011577/Siri_star_g1owy4.mp3',
  logout: 'https://res.cloudinary.com/dqqeavica/video/upload/v1759011577/Siri_End_kelv02.mp3',
  back: 'https://res.cloudinary.com/dqqeavica/video/upload/v1759011578/Keyboard_Enter_b9k2dc.mp3',
  menu: 'https://res.cloudinary.com/dqqeavica/video/upload/v1759011577/Namedrop_Popup_ale2zy.mp3'
};
function playSoundOnce(url){
  try{ const a=new Audio(url); a.preload='auto'; a.play().catch(()=>{}); }catch(e){}
}
if (window.Swal && typeof Swal.fire === 'function'){
  const __fire = Swal.fire.bind(Swal);
  Swal.fire = function(options = {}, ...rest){
    try{
      const icon = options.icon || options.type;
      if (icon && SOUNDS[icon]) playSoundOnce(SOUNDS[icon]);
    }catch(_){}
    return __fire(options, ...rest);
  };
}

/* ================== LOADER ================== */
const loader = document.getElementById('loader');
let loadingCount = 0, loaderTimer = null;
function startLoading(){
  loadingCount++;
  if (loadingCount === 1){
    loaderTimer = setTimeout(()=>{ loader.classList.remove('hidden'); loaderTimer = null; }, 120);
  }
}
function stopLoading(){
  if (loadingCount === 0) return;
  loadingCount--;
  if (loadingCount === 0){
    if (loaderTimer){ clearTimeout(loaderTimer); loaderTimer = null; }
    loader.classList.add('hidden');
  }
}

  /* ================== PREDIAL SUBMENU TOGGLE ================== */
document.getElementById('btn-cat-predial')?.addEventListener('click', () => {
  playSoundOnce(SOUNDS.menu);
  const sub = document.getElementById('predial-submenu');
  if (!sub) return;
  const open = sub.style.display !== 'none';
  sub.style.display = open ? 'none' : '';
});

/* ================== API ================== */
async function apiGet(action, params = {}){
  startLoading();
  try{
    const url = new URL(API_BASE);
    url.search = new URLSearchParams({ action, ...params }).toString();
    const r = await fetch(url.toString(), { method: 'GET' });
    const j = await r.json();
    if(!j.ok) throw new Error(j.error || 'Error');
    return j.data;
  } finally { stopLoading(); }
}
async function apiPost(action, body = {}){
  startLoading();
  try{
    const url = API_BASE + '?action=' + encodeURIComponent(action);
    const r = await fetch(url, {
      method:'POST',
      headers: { 'Content-Type':'text/plain;charset=utf-8' },
      body: JSON.stringify(body)
    });
    const j = await r.json();
    if(!j.ok) throw new Error(j.error || 'Error');
    return j.data;
  } finally { stopLoading(); }
}

/* ================== PWA AVANZADO ================== */
let deferredPrompt = null;
let __installStartShown = false;
let __installSuccessShown = false;

function isStandalone(){
  const dmStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const dmInstalled  = window.matchMedia('(display-mode: installed)').matches;
  const iosStandalone = (window.navigator.standalone === true);
  return dmStandalone || dmInstalled || iosStandalone;
}
function isIOS(){
  return /(iphone|ipad|ipod)/i.test(navigator.userAgent || '');
}
function isMarkedInstalled(){
  try{ return localStorage.getItem('pwaInstalledFlag') === '1'; }catch(_){ return false; }
}
function markInstalled(){
  try{ localStorage.setItem('pwaInstalledFlag', '1'); }catch(_){}
}
function clearInstalledMark(){
  try{ localStorage.removeItem('pwaInstalledFlag'); }catch(_){}
}
async function detectInstalled(){
  if (isStandalone()) return true;
  if (typeof navigator.getInstalledRelatedApps === 'function'){
    try{
      const apps = await navigator.getInstalledRelatedApps();
      const found = apps.some(a =>
        a.platform === 'webapp' &&
        typeof a.url === 'string' &&
        /manifest\.webmanifest$/.test(a.url)
      );
      if (found){
        markInstalled();
        return true;
      } else {
        clearInstalledMark();
      }
    }catch(_){}
  }
  return isMarkedInstalled();
}
function updateInstallButtonsVisibility(){
  const btn1 = document.getElementById('btn-instalar');
  const canPrompt = !!deferredPrompt;
  const installed = isMarkedInstalled() || isStandalone();
  const shouldShow = !installed && (canPrompt || isIOS());
  if(btn1) btn1.style.display = shouldShow ? '' : 'none';
}

window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault();
  deferredPrompt = e;
  updateInstallButtonsVisibility();
});

window.addEventListener('appinstalled', ()=>{
  markInstalled();
  deferredPrompt = null;
  updateInstallButtonsVisibility();
});

document.getElementById('btn-instalar').addEventListener('click', async ()=>{
  if(isIOS()){
    Swal.fire({
      icon:'info',
      title: '¡Para Instalar en tu Iphone!',
      html: `
        <div style="text-align:center; margin-top:8px;">
          <img
            src="https://res.cloudinary.com/dqqeavica/image/upload/v1765745210/instalacion_ios_ysbhnd.gif"
            alt="Instalación de IOS"
            style="width:180px; max-width:70vw; height:auto; display:block; margin:0 auto 12px;"
          >
          <div style="margin-top:10px;">
            <b>1.</b> Toca Compartir.<br><b>2.</b> Elige "Agregar a pantalla de inicio".<br><b>3.</b> Confirma "Agregar".
          </div>
        </div>
      `,
    });
    return;
  }
  if(!deferredPrompt){
    Swal.fire({icon:'info',title:'Instalación no disponible todavía'});
    return;
  }

  const dp = deferredPrompt;
  dp.prompt();
  const choice = await dp.userChoice;
  deferredPrompt = null;

  if (choice.outcome === 'accepted'){
    markInstalled();
    __installStartShown = true;
    Swal.fire({
      icon: 'success',
      title: '¡App instalándose!',
      html: `
        <div style="text-align:center; margin-top:8px;">
          <img
            src="https://res.cloudinary.com/dqqeavica/image/upload/v1765740540/instalacion_lydtcl.gif"
            alt="Instalando app"
            style="width:180px; max-width:70vw; height:auto; display:block; margin:0 auto 12px;"
          >
          <div>Debes esperar unos segundos mientras el sistema instala la App.</div>
          <div style="margin-top:10px;">
            <b>Al desaparecer este aviso, puedes salir de esta vista. La App aparecerá en la pantalla principal de este dispositivo.</b>
          </div>
        </div>
      `,
      timer: 12000,
      showConfirmButton: false
    });
  } else {
    Swal.fire({icon:'info',title:'Instalación cancelada'});
  }

  updateInstallButtonsVisibility();
});

async function initPWAVista(){
  const installed = await detectInstalled();
  if (installed){
    showView('view-login');
  } else {
    showView('view-instalar');
    updateInstallButtonsVisibility();
  }
}
if ('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('./sw.js').catch(()=>{});
  });
}
window.addEventListener('load', initPWAVista);

/* ================== VISTAS ================== */
function showView(id){
  for(const el of document.querySelectorAll('.view')) el.classList.remove('active');
  document.getElementById(id)?.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

  /* ================== MODAL RESPUESTA LIMPIA ================== */
function openRespuestaLimpiaModal_(){
  const m = document.getElementById('modal-respuesta-limpia');
  if(!m) return;
  document.getElementById('respuesta-limpia').value = '';
  m.classList.remove('hidden');
  setTimeout(()=> document.getElementById('respuesta-limpia')?.focus(), 50);
}

function closeRespuestaLimpiaModal_(){
  const m = document.getElementById('modal-respuesta-limpia');
  if(!m) return;
  m.classList.add('hidden');
}

document.getElementById('btn-cerrar-respuesta-limpia')?.addEventListener('click', ()=>{
  playSoundOnce(SOUNDS.back);
  closeRespuestaLimpiaModal_();
});

document.getElementById('btn-enviar-respuesta-limpia')?.addEventListener('click', async ()=>{
  try{
    if(!currentUser){
      Swal.fire({ icon:'warning', title:'Sesión inválida' });
      return;
    }
    if(!currentCardSelected){
      Swal.fire({ icon:'warning', title:'Solicitud inválida' });
      return;
    }

    const respuesta = String(document.getElementById('respuesta-limpia').value || '').trim();
    if(!respuesta){
      Swal.fire({ icon:'warning', title:'Respuesta requerida', text:'Escribe un mensaje para enviar.' });
      return;
    }

    const ok = await Swal.fire({
      icon:'question',
      title:'Enviar RESPUESTA LIMPIA',
      text:'Esta acción marcará la solicitud como atendida y enviará mensaje al usuario.',
      showCancelButton:true,
      confirmButtonText:'Enviar',
      cancelButtonText:'Cancelar'
    });
    if(!ok.isConfirmed) return;

    await apiPost('marcarRespuesta', {
      id_predial: currentCardSelected.id_predial,
      respuesta: respuesta,
      usuario: currentUser.nombre || ''
    });

    closeRespuestaLimpiaModal_();
    Swal.fire({ icon:'success', title:'Enviado', timer:1400, showConfirmButton:false });

    // refrescar la vista/lista actual
    await loadAndRenderList_(currentListMode);
  }catch(e){
    Swal.fire({ icon:'error', title:'Error', text: String(e.message || e) });
  }
});

  /* ================== RESET FORMULARIO DE SOLICITUD PREDIAL ================== */
  function resetAgregarSolicitudForm_(){
  // Limpia inputs
  const p = document.getElementById('Propietario');
  const id = document.getElementById('identidad');
  const cel = document.getElementById('celular');
  if(p) p.value = '';
  if(id) id.value = '';
  if(cel) cel.value = '';

  // Limpia select (Choices si existe, si no, normal)
  const sel = document.getElementById('upd-residencia');
  try{
    if(choicesResidencia){
      choicesResidencia.removeActiveItems();
      // intenta dejarlo en vacío (sin seleccionar nada)
      choicesResidencia.setChoiceByValue('');
    } else if(sel){
      sel.value = '';
    }
  }catch(_){
    try{ if(sel) sel.value = ''; }catch(__){}
  }
}

/* ================== VALIDACIONES ================== */
function onlyDigits(s){ return String(s||'').replace(/\D/g,''); }
function bindNumericSanitizer(id, maxLen){
  const el = document.getElementById(id);
  if(!el) return;
  el.addEventListener('input', ()=>{
    const raw = onlyDigits(el.value);
    el.value = maxLen ? raw.slice(0, maxLen) : raw;
  });
}
bindNumericSanitizer('login-doc', 10);
bindNumericSanitizer('identidad', 10);
/* (Cambio #1) Teléfono permite hasta 12 dígitos */
bindNumericSanitizer('celular', 12);

function validatePhone_(digits){
  const s = onlyDigits(digits);
  if(s.length === 10) return true;
  if(s.length === 12 && s.startsWith('57')) return true;
  return false;
}
function normalizePhoneForSave_(digits){
  const s = onlyDigits(digits);
  if(s.length === 12 && s.startsWith('57')) return s;
  if(s.length === 10) return '57' + s;
  throw new Error('Teléfono inválido');
}

document.getElementById('toggle-doc')?.addEventListener('click', ()=>{
  const el = document.getElementById('login-doc');
  const oculto = el.type === 'password';
  el.type = oculto ? 'text' : 'password';
  const src = oculto
    ? 'https://res.cloudinary.com/dqqeavica/image/upload/v1764084782/Ocultar_lgdxpd.png'
    : 'https://res.cloudinary.com/dqqeavica/image/upload/v1764084782/Mostrar_yymceh.png';
  document.getElementById('toggle-doc-img').src = src;
});

/* ================== ESTADO ================== */
let currentUser = null; // { documento, nombre, isSuper }
let currentListMode = 'PENDIENTE'; // PENDIENTE | ATENDIDA CHAT | ATENDIDA PRESENCIAL
let currentCardSelected = null; // card object
let choicesResidencia = null;

  /* ================== PERMISOS DE VISTAS (NUEVO) ================== */
const ALLOW_AGREGAR_SOLICITUD = [
  'EDILBERTO RAMIREZ HERNANDEZ',
  'EDWIN ALFONSO OSUNA MONROY',
  'DIANA MARCELA OTALORA',
  'HECTOR ANDRES MARTINEZ CRUZ',
  'AMANDA VANESSA TAMAYO BEJARANO'
].map(s => normalizeText_(s));

const ALLOW_PENDIENTES = [
  'EDWIN ALFONSO OSUNA MONROY',
  'DIANA MARCELA OTALORA',
  'HECTOR ANDRES MARTINEZ CRUZ',
  'AMANDA VANESSA TAMAYO BEJARANO'
].map(s => normalizeText_(s));

  const ALLOW_ATENDIDAS_CHAT = [
  'AMANDA VANESSA TAMAYO BEJARANO'
].map(s => normalizeText_(s));

function canSeeAtendidasChat_(){
  if(!currentUser) return false;
  if(currentUser.isSuper) return true;
  const n = normalizeText_(currentUser.nombre || '');
  return ALLOW_ATENDIDAS_CHAT.includes(n);
}

function canSeeAgregarSolicitud_(){
  if(!currentUser) return false;
  if(currentUser.isSuper) return true;
  const n = normalizeText_(currentUser.nombre || '');
  return ALLOW_AGREGAR_SOLICITUD.includes(n);
}

function canSeePendientes_(){
  if(!currentUser) return false;
  if(currentUser.isSuper) return true;
  const n = normalizeText_(currentUser.nombre || '');
  return ALLOW_PENDIENTES.includes(n);
}

/* ── Permiso para AGREGAR ASIGNACIÓN (semáforo) ─── */
const ALLOW_AGREGAR_ASIGNACION = [
  'AMANDA VANESSA TAMAYO BEJARANO'
].map(s => normalizeText_(s));

function canSeeAgregarAsignacion_() {
  if (!currentUser) return false;
  if (currentUser.isSuper) return true;
  const n = normalizeText_(currentUser.nombre || '');
  return ALLOW_AGREGAR_ASIGNACION.includes(n);
}


  /* ================== MI SEMÁFORO ================== */

function renderProcList_(items) {
  const wrap = document.getElementById('proc-list');
  const countEl = document.getElementById('proc-count');
  wrap.innerHTML = '';
  countEl.textContent = String(items.length);

  if (!items.length) {
    wrap.innerHTML = '<p class="muted center" style="margin-top:20px;">No hay asignaciones.</p>';
    return;
  }

  for (const it of items) {
    const color = getSemaforoColor_(it);
    const diasTxt = getDiasTxt_(it);
    const card = document.createElement('div');
    card.className = `proc-card color-${color}`;

    card.innerHTML = `
      <div class="proc-head">
        <div class="proc-head-left">
          <p class="proc-asignado">${escapeHtml_(it.asignado || '')}</p>
          <p class="proc-asistente">${escapeHtml_(it.asistente || '')}</p>
          <p class="proc-descripcion">
            <img src="https://res.cloudinary.com/dqqeavica/image/upload/v1775788408/chincheta_v6mg7a.png" alt="">
            ${escapeHtml_(it.descripcion || '')}
          </p>
        </div>
        <div class="proc-head-right">
          <span class="proc-estado-badge semaforo-${color}">
            ${escapeHtml_(it.estado || '')}
            <span class="proc-dias-txt">${diasTxt}</span>
          </span>
        </div>
      </div>
      <div class="cat-row">
        ${getCatPill_(it.categoria)}
        ${getSubcatPill_(it.subcategoria)}
        ${it.etapa ? `<span class="etapa-badge"><img src="https://res.cloudinary.com/dqqeavica/image/upload/v1775788266/subcategoria4.1_c1nm1b.png" style="width:16px;height:16px;" alt=""> ${escapeHtml_(it.etapa)}</span>` : ''}
      </div>
      <div class="proc-actions">
        <div class="proc-icons" id="proc-icons-${it.id_proceso}"></div>
      </div>
    `;

    wrap.appendChild(card);

    // Íconos
    const iconsWrap = card.querySelector(`#proc-icons-${it.id_proceso}`);
    const estadoFinalizado = normalizeText_(it.estado || '') === 'FINALIZADO';

    if (currentUser?.isSuper) {
      // Firmar
      const btnFirmar = makeIconBtn_('https://res.cloudinary.com/dqqeavica/image/upload/v1775850623/firma_e19uie.webp', 'Firmar', async () => {
        const ok = await Swal.fire({ icon: 'info', title: '¿Marcar como PENDIENTE DE EVIDENCIA?', showCancelButton: true, confirmButtonText: 'Confirmar', cancelButtonText: 'Cancelar' });
        if (!ok.isConfirmed) return;
        await apiPost('updateProceso', { id_proceso: it.id_proceso, estado: 'PENDIENTE DE EVIDENCIA' });
        await abrirAsignaciones_();
      });
      // Eliminar
      const btnEliminar = makeIconBtn_('https://res.cloudinary.com/dqqeavica/image/upload/v1775788435/Eliminar_jcmwso.webp', 'Eliminar', async () => {
        const ok = await Swal.fire({ icon: 'warning', title: '¿Eliminar esta asignación?', showCancelButton: true, confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar' });
        if (!ok.isConfirmed) return;
        await apiPost('deleteProceso', { id_proceso: it.id_proceso });
        await abrirAsignaciones_();
      });
      iconsWrap.appendChild(btnFirmar);
      iconsWrap.appendChild(btnEliminar);
    }

    // Ver
    const btnVer = makeIconBtn_('https://res.cloudinary.com/dqqeavica/image/upload/v1764084782/Mostrar_yymceh.png', 'Ver', () => {
      __procSelected = it;
      abrirVerAsignacion_(it);
    });
    iconsWrap.appendChild(btnVer);

    // Editar (para super: siempre; para asignado: solo si no es FINALIZADO)
    if (currentUser?.isSuper || !estadoFinalizado) {
      const btnEditar = makeIconBtn_('https://res.cloudinary.com/dqqeavica/image/upload/v1771979124/editar_bx9dsl.webp', 'Editar', () => {
        __procSelected = it;
        abrirEditarAsignacion_(it);
      });
      iconsWrap.appendChild(btnEditar);
    }
  }
}

function makeIconBtn_(src, title, onClick) {
  const btn = document.createElement('button');
  btn.className = 'proc-icon-btn';
  btn.title = title;
  btn.type = 'button';
  btn.innerHTML = `<img src="${src}" alt="${title}">`;
  btn.addEventListener('click', onClick);
  return btn;
}

// Filtro
document.getElementById('proc-filter')?.addEventListener('input', () => {
  const q = normalizeText_(document.getElementById('proc-filter').value || '');
  if (!q) { renderProcList_(__procCache); return; }
  renderProcList_(__procCache.filter(it => normalizeText_(JSON.stringify(it)).includes(q)));
});

  /* ================== MIS PROCESOS (semáforo) ================== */
document.getElementById('btn-mis-procesos')?.addEventListener('click', async () => {
  playSoundOnce(SOUNDS.back);
  try {
    if (!currentUser) {
      Swal.fire({ icon: 'warning', title: 'Sesión inválida' });
      return;
    }
    const res = await apiGet('getMisProcesosLink', { documento: currentUser.documento });
    const link = String(res?.link || '').trim();
    if (!link) {
      Swal.fire({ icon: 'info', title: 'Sin enlace', text: 'No tienes enlace de procesos configurado en la hoja USUARIOS (columna H).' });
      return;
    }
    window.open(link, '_blank', 'noopener');
  } catch (e) {
    Swal.fire({ icon: 'error', title: 'Error', text: String(e.message || e) });
  }
});

// Regresar
document.getElementById('btn-asignaciones-back')?.addEventListener('click', () => {
  playSoundOnce(SOUNDS.back);
  showView('view-inicio');
});

/* ✅ Handlers (no duplicar en otra parte) */
document.getElementById('btn-estadisticas')?.addEventListener('click', async ()=>{
  playSoundOnce(SOUNDS.back);
  await openEstadisticas_();
});

document.getElementById('btn-estad-back')?.addEventListener('click', ()=>{
  playSoundOnce(SOUNDS.back);
  destroyEstadChart_();
  showView('view-inicio');
});

document.getElementById('btn-estad-tiempo')?.addEventListener('click', async ()=>{
  playSoundOnce(SOUNDS.back);
  await showEstadTiempo_();
});

document.getElementById('btn-estad-zonas')?.addEventListener('click', async ()=>{
  playSoundOnce(SOUNDS.back);
  await showEstadZonas_();
});

/* Seguridad: ocultar botón al logout */
document.getElementById('btn-logout')?.addEventListener('click', ()=>{
  try{
    const bEst = document.getElementById('btn-estadisticas');
    if(bEst) bEst.style.display = 'none';
  }catch(_){}
});

/* ================== DRIVE ANEXOS (NUEVO) ================== */
const DRIVE_HIDE_FOR = [
  'DIANA MARCELA OTALORA',
  'DIEGO FERNANDO GARCIA'
].map(s => normalizeText_(s));

const DRIVE_ICON_EDIT = 'https://res.cloudinary.com/dqqeavica/image/upload/v1771979124/editar_bx9dsl.webp';
const DRIVE_ICON_DRIVE = 'https://res.cloudinary.com/dqqeavica/image/upload/v1763997280/DRIVE_bycgsc.webp';

let DRIVE_DATA = [];
let DRIVE_EDIT_TARGET = null;

function canSeeDriveAnexos_(){
  if(!currentUser || !currentUser.nombre) return false;
  const n = normalizeText_(currentUser.nombre);
  return DRIVE_HIDE_FOR.indexOf(n) === -1;
}

function normalizeDriveFolderId_(link){
  const s = String(link || '').trim();
  if(!s) return '';
  const m1 = s.match(/\/folders\/([A-Za-z0-9_-]{10,})/);
  if(m1) return m1[1];
  const m2 = s.match(/[?&]id=([A-Za-z0-9_-]{10,})/);
  if(m2) return m2[1];
  return '';
}

function isValidGmail_(email){
  const e = String(email || '').trim().toLowerCase();
  if(!e) return false;
  return /^[a-z0-9._%+-]+@gmail\.com$/.test(e);
}

function openDriveEdit_(row){
  DRIVE_EDIT_TARGET = row;
  document.getElementById('drive-edit-nombre').textContent = String(row.nombre || '').trim();
  document.getElementById('drive-edit-correo').value = String(row.correo || '').trim();
  showView('view-drive-editar');
  setTimeout(()=> document.getElementById('drive-edit-correo')?.focus(), 50);
}

function renderDriveGrid_(list){
  const grid = document.getElementById('drive-grid');
  grid.innerHTML = '';

  list.forEach(row=>{
    const correo = String(row.correo || '').trim();
    const isRed = !correo;

    const card = document.createElement('div');
    card.className = 'drive-card ' + (isRed ? 'red' : 'green');

    const nameEl = document.createElement('div');
    nameEl.className = 'drive-name';
    nameEl.textContent = String(row.nombre || '').trim();

    const mailEl = document.createElement('div');
    mailEl.className = 'drive-mail';
    mailEl.textContent = correo || '';

    const iconRow = document.createElement('div');
    iconRow.className = 'icon-row';

    const btnEdit = document.createElement('button');
    btnEdit.type = 'button';
    btnEdit.className = 'btn-icon';
    btnEdit.setAttribute('aria-label','Editar correo');
    btnEdit.title = 'Editar correo';
    btnEdit.innerHTML = '<img src="' + DRIVE_ICON_EDIT + '" alt="Editar">';
    btnEdit.addEventListener('click', ()=>{
      playSoundOnce(SOUNDS.menu);
      openDriveEdit_(row);
    });

    const btnDrive = document.createElement('button');
    btnDrive.type = 'button';
    btnDrive.className = 'btn-icon';
    btnDrive.setAttribute('aria-label','Abrir carpeta Drive');
    btnDrive.title = 'Abrir carpeta Drive';
    btnDrive.innerHTML = '<img src="' + DRIVE_ICON_DRIVE + '" alt="Drive">';
    btnDrive.addEventListener('click', ()=>{
      playSoundOnce(SOUNDS.info);
      const link = String(row.enlace || '').trim();
      if(!link){
        Swal.fire({ icon:'info', title:'Sin carpeta', text:'Este registro no tiene enlace de carpeta.' });
        return;
      }
      window.open(link, '_blank', 'noopener');
    });

    iconRow.appendChild(btnEdit);
    iconRow.appendChild(btnDrive);

    card.appendChild(nameEl);
    card.appendChild(mailEl);
    card.appendChild(iconRow);

    grid.appendChild(card);
  });
}

function applyDriveFilter_(){
  renderDriveGrid_(DRIVE_DATA);
}

/**
 * Regla pedida: al entrar a DRIVE ANEXOS, el usuario ve inicialmente SOLO su tarjeta (la que coincida con su nombre).
 * Igual dejamos el filtro disponible.
 */
async function loadDriveData_(){
  const list = await apiGet('listDriveRows'); // NUEVO endpoint en gs1
  const all = Array.isArray(list) ? list : [];

  const userName = normalizeText_(currentUser?.nombre || '');
  const mine = all.filter(r => normalizeText_(r.nombre || '') === userName);

  DRIVE_DATA = mine;      // inicialmente SOLO la tarjeta del usuario
  applyDriveFilter_();    // aplica filtro sobre esa lista
}

async function openDriveAnexosView_(){
  if(!currentUser){
    Swal.fire({ icon:'warning', title:'Sesión inválida' });
    return;
  }
  if(!canSeeDriveAnexos_()){
    // no mostrar nada (según requisito)
    return;
  }
  DRIVE_DATA = [];
  renderDriveGrid_([]);
  showView('view-drive-anexos');
  await loadDriveData_();
}

/* ================== LOGIN ================== */
document.getElementById('btn-login')?.addEventListener('click', async ()=>{
  const doc = (document.getElementById('login-doc').value || '').trim();

  if(doc === ''){
    await Swal.fire({ icon:'question', title:'¿Deseas comenzar?', text:'Ingresa un Documento para validar.', timer:3000, showConfirmButton:false });
    return;
  }
  if(!/^\d{6,10}$/.test(doc)){
    await Swal.fire({
      icon:'error',
      title:'CONTRASEÑA INCORRECTA',
      text:'La contraseña contiene entre 6 y 10 dígitos numéricos.',
      timer:3000,
      showConfirmButton:false
    });
    return;
  }

  try{
    const res = await apiGet('login', { documento: doc });

    if(!res?.encontrado){
      await Swal.fire({
        icon:'info',
        title:'NO TIENES ACCESO AÚN',
        text:'Solicitar acceso a Secretaría de Hacienda.',
        timer:6000,
        showConfirmButton:false
      });
      return;
    }

    currentUser = {
      documento: String(res.documento || doc),
      nombre: String(res.nombre || ''),
      isSuper: !!res.isSuper
    };

    // ✅ MOSTRAR BOTÓN ESTADISTICAS SOLO SI ES SUPER USUARIO
try{
  const bEst = document.getElementById('btn-estadisticas');
  if(bEst) bEst.style.display = (currentUser && currentUser.isSuper) ? '' : 'none';
}catch(_){}

  // ── PANEL DASHBOARD: solo SUPER USUARIO ──
try {
  const bPanel = document.getElementById('btn-panel-dashboard');
  if (bPanel) bPanel.style.display = (currentUser && currentUser.isSuper) ? '' : 'none';
} catch(_) {}

    // ── MI SEMÁFORO: visible para super usuario y para asignados del sistema ──
try {
  const SEMAFORO_USERS = [
    'LEESLIE JULIET GOMEZ QUINTERO',
    'MARIA NIDIA MENESES MARTINEZ',
    'LUIS GILBERTO MOYA ROMERO',
    'NICOL ESTEFANI MADRIGALES GONZALEZ',
    'ANDREA KATERINE LAMAR RODRIGUEZ',
    'VICTOR MANUEL FANDIÑO GIRALDO',
    'LUIS GABRIEL RAMIREZ RAMIREZ',
    'DIEGO FERNANDO GARCIA',
    'SOL MAR OCHOA HERNANDEZ',
    'ROSALBA ABADIA ARAGON',
    'AMANDA VANESSA TAMAYO BEJARANO',
    'DIANA MARCELA OTALORA'
  ].map(s => normalizeText_(s));

  const bSema = document.getElementById('btn-semaforo');
  if (bSema) {
    const canSeeSemaforo =
      (currentUser && currentUser.isSuper) ||
      SEMAFORO_USERS.includes(normalizeText_(currentUser?.nombre || ''));
    bSema.style.display = canSeeSemaforo ? '' : 'none';
  }
} catch(_) {}

    // ✅ Permisos de botones por rol (requisitos nuevos)
try{
  const bAgregar = document.getElementById('btn-agregar');
  if(bAgregar) bAgregar.style.display = canSeeAgregarSolicitud_() ? '' : 'none';
}catch(_){}

  // ✅ Mostrar botón MIS INFORMES PREDIAL solo si puede ver AGREGAR SOLICITUD o es SUPER
try{
  const bInf = document.getElementById('btn-mis-informes');
  if(bInf) bInf.style.display = (canSeeAgregarSolicitud_() || (currentUser && currentUser.isSuper)) ? '' : 'none';
}catch(_){}

try{
  const bPend = document.getElementById('btn-pendientes');
  if(bPend) bPend.style.display = canSeePendientes_() ? '' : 'none';
}catch(_){}

// ATENCIONES REGISTRADAS: visible para super usuario y usuarios con permiso de chat
try{
  const bAtenc = document.getElementById('btn-atenciones-registradas');
  if(bAtenc) bAtenc.style.display = canSeeAtendidasChat_() ? '' : 'none';
}catch(_){}

    // Mostrar/ocultar botón DRIVE ANEXOS según usuario
    try{
      const b = document.getElementById('btn-drive-anexos');
      if(b) b.style.display = canSeeDriveAnexos_() ? '' : 'none';
    }catch(_){}

    document.getElementById('inicio-nombre').textContent = (currentUser.nombre || '').toUpperCase();
    document.getElementById('inicio-sub').textContent = currentUser.isSuper ? 'SUPER USUARIO' : 'USUARIO';

    playSoundOnce(SOUNDS.login);
    showView('view-inicio');
  }catch(e){
    Swal.fire({ icon:'error', title:'Error', text: e.message || String(e) });
  }
});

/* ================== LOGOUT ================== */
document.getElementById('btn-logout')?.addEventListener('click', ()=>{
  stopPendientesAutoRefresh_();
  stopAsignacionesAutoRefresh_();
  playSoundOnce(SOUNDS.logout);
  currentUser = null;
  currentCardSelected = null;
  document.getElementById('login-doc').value = '';
  try{ const b = document.getElementById('btn-agregar');        if(b) b.style.display = 'none'; }catch(_){}
  try{ const b = document.getElementById('btn-pendientes');     if(b) b.style.display = 'none'; }catch(_){}
  try{ const b = document.getElementById('btn-atenciones-registradas'); if(b) b.style.display = 'none'; }catch(_){}
  try{ const b = document.getElementById('btn-mis-informes');   if(b) b.style.display = 'none'; }catch(_){}
  try{ const b = document.getElementById('btn-estadisticas');   if(b) b.style.display = 'none'; }catch(_){}
  try{ const b = document.getElementById('btn-semaforo');       if(b) b.style.display = 'none'; }catch(_){}
  try{ const b = document.getElementById('btn-panel-dashboard'); if(b) b.style.display = 'none'; }catch(_){}
  // Colapsar submenú predial
  try{ const s = document.getElementById('predial-submenu');    if(s) s.style.display = 'none'; }catch(_){}
  showView('view-login');
});

try{ const b = document.getElementById('btn-drive-anexos'); if(b) b.style.display = 'none'; }catch(_){}
try{ const b = document.getElementById('btn-mis-informes'); if(b) b.style.display = 'none'; }catch(_){}
try{ const b = document.getElementById('btn-estadisticas'); if(b) b.style.display = 'none'; }catch(_){}
try{ const b = document.getElementById('btn-semaforo');     if(b) b.style.display = 'none'; }catch(_){}

/* ================== INICIO: botones ================== */
document.getElementById('btn-pendientes')?.addEventListener('click', async ()=>{
  playSoundOnce(SOUNDS.back);

  if(!canSeePendientes_()){
    Swal.fire({ icon:'warning', title:'No tienes permiso para ver PENDIENTES' });
    return;
  }

  if(!currentUser){
    Swal.fire({ icon:'warning', title:'Sesión inválida' });
    return;
  }

  try{
    // ✅ Antes de entrar a la vista, validamos si hay filas
    const data = await apiGet('listSolicitudes', { estado: 'PENDIENTE' });
    const items = Array.isArray(data) ? data : [];

    if(items.length === 0){
      // Por si quedó algún refresco prendido
      stopPendientesAutoRefresh_();

      // ✅ No entrar a la vista, solo alert
      await showAlDiaAlert_();
      return;
    }

    // ✅ Sí hay filas -> entrar y renderizar
    currentListMode = 'PENDIENTE';
    document.getElementById('lista-title').textContent = 'PENDIENTES PREDIAL';
    document.getElementById('lista-filter').value = '';
    __listCache = items;
    renderList_(__listCache);
    showView('view-lista');

    // ✅ Auto-refresh cada 30s solo en Pendientes
    startPendientesAutoRefresh_();
  }catch(e){
    Swal.fire({ icon:'error', title:'Error', text: String(e.message || e) });
  }
});

document.getElementById('btn-agregar')?.addEventListener('click', ()=>{
  playSoundOnce(SOUNDS.back);

  if(!canSeeAgregarSolicitud_()){
    Swal.fire({ icon:'warning', title:'No tienes permiso para AGREGAR SOLICITUD' });
    return;
  }

  initResidenciaChoices_();
  resetAgregarSolicitudForm_(); // <-- resetea al iniciar la vista
  showView('view-agregar');
});

  document.getElementById('btn-mis-informes')?.addEventListener('click', async ()=>{
  playSoundOnce(SOUNDS.back); // sonido (puedes cambiar a SOUNDS.menu si prefieres)

  try{
    if(!currentUser){
      Swal.fire({ icon:'warning', title:'Sesión inválida' });
      return;
    }

    const res = await apiGet('getMisInformesLink', { documento: currentUser.documento });
    const link = String(res?.link || '').trim();

    if(!link){
      Swal.fire({ icon:'info', title:'Sin enlace', text:'No tienes enlace configurado en la hoja USUARIOS (columna G).' });
      return;
    }

    window.open(link, '_blank', 'noopener');
  }catch(e){
    Swal.fire({ icon:'error', title:'Error', text: String(e.message || e) });
  }
});

/* ================== LISTA: render + filtro ================== */
let __listCache = [];

/* ================== AUTO REFRESH PENDIENTES (NUEVO) ================== */
let __pendientesIntervalId = null;
const PENDIENTES_REFRESH_MS = 15000;

function startPendientesAutoRefresh_(){
  // Evita duplicar intervalos
  stopPendientesAutoRefresh_();

  __pendientesIntervalId = setInterval(async ()=>{
    try{
      // Solo refrescar si:
      // 1) estoy en modo PENDIENTE
      // 2) la vista lista está activa (el usuario realmente está viendo la lista)
      const vistaListaActiva = document.getElementById('view-lista')?.classList.contains('active');
      if(currentListMode !== 'PENDIENTE') return;
      if(!vistaListaActiva) return;

      // Respeta el filtro actual (si el usuario está buscando algo)
      const q = String(document.getElementById('lista-filter')?.value || '').trim();

      // Carga lista actualizada desde backend
      await loadAndRenderList_('PENDIENTE');

      // Si había filtro, lo reaplicamos (dispara el listener o filtra manual)
      if(q){
        document.getElementById('lista-filter').value = q;
        const evt = new Event('input', { bubbles:true });
        document.getElementById('lista-filter').dispatchEvent(evt);
      }
    }catch(_){
      // Silencioso: no molestamos al usuario cada 30s si hay un fallo puntual
    }
  }, PENDIENTES_REFRESH_MS);
}

function stopPendientesAutoRefresh_(){
  if(__pendientesIntervalId){
    clearInterval(__pendientesIntervalId);
    __pendientesIntervalId = null;
  }
}

  /* ================== AUTO REFRESH ASIGNACIONES ================== */
let __asignacionesIntervalId = null;
const ASIGNACIONES_REFRESH_MS = 60000; // 60 segundos

function startAsignacionesAutoRefresh_() {
  // Evita duplicar intervalos
  stopAsignacionesAutoRefresh_();

  __asignacionesIntervalId = setInterval(async () => {
    try {
      // Solo refrescar si la vista asignaciones está activa
      const vistaActiva = document.getElementById('view-asignaciones')?.classList.contains('active');
      if (!vistaActiva) return;

      // Respeta el filtro actual (si el usuario está buscando algo)
      const q = String(document.getElementById('proc-filter')?.value || '').trim();

      // Carga lista actualizada desde backend
      await loadAndRenderProcesos_();

      // Si había filtro, lo reaplicamos
      if (q) {
        document.getElementById('proc-filter').value = q;
        const evt = new Event('input', { bubbles: true });
        document.getElementById('proc-filter').dispatchEvent(evt);
      }
    } catch (_) {
      // Silencioso: no interrumpir al usuario
    }
  }, ASIGNACIONES_REFRESH_MS);
}

function stopAsignacionesAutoRefresh_() {
  if (__asignacionesIntervalId) {
    clearInterval(__asignacionesIntervalId);
    __asignacionesIntervalId = null;
  }
}
  
function normalizeText_(s){
  return String(s||'')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g,'')
    .toUpperCase();
}

/* Normaliza una zona: quita el espacio + número romano final
   Ej: "ARAGON I" → "ARAGON", "ORQUIDEAS REAL IV" → "ORQUIDEAS REAL" */
function normalizeZona_(barrio) {
  if (!barrio) return '';
  let s = String(barrio).trim().toUpperCase();
  s = s.replace(/\s+[IVX]+$/i, '').trim();
  return s;
}

  function showAlDiaAlert_(){
  return Swal.fire({
    icon: 'success',
    title: 'ESTÁS AL DÍA 💪🏻',
    html: 'Revisa posteriormente para validar nuevas solicitudes 👩🏻‍💻',
    timer: 3200,
    showConfirmButton: false
  });
}

async function loadAndRenderList_(estado){
  const data = await apiGet('listSolicitudes', { estado });
  __listCache = Array.isArray(data) ? data : [];
  renderList_(__listCache);
}

function renderList_(items){
  const wrap = document.getElementById('lista-wrap');
  wrap.innerHTML = '';

  document.getElementById('lista-count').textContent = String(items.length);

  if(!items.length){
    const p = document.createElement('p');
    p.className = 'muted center';
    p.textContent = 'No hay registros.';
    wrap.appendChild(p);
    return;
  }

  for(const it of items){
    const card = document.createElement('div');
    card.className = 'sol-card';

    const head = document.createElement('div');
    head.className = 'sol-head';

    const title = document.createElement('p');
    title.className = 'sol-title';
    title.innerHTML = `Usuario: <b>${escapeHtml_(it.nombre || '')}</b>`;

    head.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'sol-meta';

    const respondedExtra = (currentListMode === 'ATENDIDA CHAT' && it.respondida && String(it.respondida).trim())
  ? `<p><span style="color:#16a34a;font-weight:1000;">RESPONDIDA:</span> ${escapeHtml_(it.respondida)}</p>`
  : '';

    meta.innerHTML = `
      <p>Documento / NIT: ${escapeHtml_(it.documento || '')}</p>
      <p>Residencia: ${escapeHtml_(it.barrio || '')}</p>
      <p>Código Catastral: ${escapeHtml_(it.codigo || '')}</p>
      <p>Solicitud: ${escapeHtml_(it.solicitud || '')}</p>
      <p><span style="color:#dc2626;font-weight:1000;">Fecha:</span> ${escapeHtml_(it.fecha || '')}</p>
      ${respondedExtra}
    `;

    const actions = document.createElement('div');
    actions.className = 'sol-actions';

    const btnResp = document.createElement('button');
    btnResp.className = 'btn-respond';
    btnResp.type = 'button';
    btnResp.textContent = 'RESPONDER - ADJUNTAR';
    btnResp.addEventListener('click', async ()=>{
      currentCardSelected = it;
      await openRespuestaViewWithCheck_();
    });

    const icons = document.createElement('div');
    icons.className = 'right-icons';

    // Icono AL DÍA
    const alDiaBtn = document.createElement('button');
    alDiaBtn.className = 'icon-btn';
    alDiaBtn.type = 'button';
    alDiaBtn.title = 'AL DÍA';
    alDiaBtn.innerHTML = `<img src="https://res.cloudinary.com/dqqeavica/image/upload/v1773342298/al_dia_o70awr.webp" alt="AL DÍA">`;
    alDiaBtn.addEventListener('click', async ()=>{
      const ok = await Swal.fire({
        icon:'question',
        title:'Marcar como AL DÍA',
        text:'Esta acción marcará la solicitud como atendida y enviará mensaje al usuario.',
        showCancelButton:true,
        confirmButtonText:'Sí, continuar',
        cancelButtonText:'Cancelar'
      });
      if(!ok.isConfirmed) return;
      await apiPost('marcarAlDia', { id_predial: it.id_predial, usuario: currentUser ? (currentUser.nombre || '') : '' });
      await loadAndRenderList_(currentListMode);
      Swal.fire({ icon:'success', title:'Listo', timer:1400, showConfirmButton:false });
    });

    // Icono NO ENCONTRADO
    const noBtn = document.createElement('button');
    noBtn.className = 'icon-btn';
    noBtn.type = 'button';
    noBtn.title = 'NO ENCONTRADO';
    noBtn.innerHTML = `<img src="https://res.cloudinary.com/dqqeavica/image/upload/v1773342299/no_found_czsnkj.webp" alt="NO ENCONTRADO">`;
    noBtn.addEventListener('click', async ()=>{
      const ok = await Swal.fire({
        icon:'question',
        title:'Marcar como NO ENCONTRADO',
        text:'Esta acción marcará la solicitud como atendida y enviará mensaje al usuario.',
        showCancelButton:true,
        confirmButtonText:'Sí, continuar',
        cancelButtonText:'Cancelar'
      });
      if(!ok.isConfirmed) return;
      await apiPost('marcarNoEncontrado', { id_predial: it.id_predial, usuario: currentUser ? (currentUser.nombre || '') : '' });
      await loadAndRenderList_(currentListMode);
      Swal.fire({ icon:'success', title:'Listo', timer:1400, showConfirmButton:false });
    });

    // Icono RESPUESTA LIMPIA
const respLimpiaBtn = document.createElement('button');
respLimpiaBtn.className = 'icon-btn';
respLimpiaBtn.type = 'button';
respLimpiaBtn.title = 'RESPUESTA LIMPIA';
respLimpiaBtn.innerHTML = `<img src="https://res.cloudinary.com/dqqeavica/image/upload/v1774398142/mensaje_xu3mbq.webp" alt="RESPUESTA LIMPIA">`;
respLimpiaBtn.addEventListener('click', async ()=>{
  currentCardSelected = it;
  playSoundOnce(SOUNDS.menu);
  openRespuestaLimpiaModal_();
});

    // Icono DAR DE BAJA (solo en PENDIENTES)
    const bajaBtn = document.createElement('button');
    bajaBtn.className = 'icon-btn';
    bajaBtn.type = 'button';
    bajaBtn.title = 'DAR DE BAJA';
    bajaBtn.innerHTML = `<img src="https://res.cloudinary.com/dqqeavica/image/upload/v1775788435/Eliminar_jcmwso.webp" alt="DAR DE BAJA">`;
    bajaBtn.addEventListener('click', async ()=>{
      const ok = await Swal.fire({
        icon: 'warning',
        title: 'DAR DE BAJA',
        html: `
          <div style="text-align:left; font-size:.92rem; line-height:1.55;">
            <p style="margin:0 0 10px;"><b>⚠️ Esta acción es irreversible.</b></p>
            <p style="margin:0 0 10px;">El registro será <b>eliminado permanentemente</b> de la hoja SOLICITUDES.</p>
            <p style="margin:0; color:#b91c1c; font-weight:800;">
              Realiza esta acción ÚNICAMENTE si la solicitud ya fue referida o atendida en el Grupo de WhatsApp de solicitudes.
            </p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Sí, dar de baja',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc2626'
      });
      if(!ok.isConfirmed) return;

      try{
        await apiPost('darDeBajaSolicitud', {
          id_predial: it.id_predial,
          usuario: currentUser ? (currentUser.nombre || '') : ''
        });
        await loadAndRenderList_(currentListMode);

        // Si ya no quedan pendientes, salir y mostrar "AL DÍA"
        if(__listCache.length === 0){
          stopPendientesAutoRefresh_();
          showView('view-inicio');
          await showAlDiaAlert_();
          return;
        }

        Swal.fire({ icon:'success', title:'Solicitud dada de baja', timer:1400, showConfirmButton:false });
      }catch(e){
        Swal.fire({ icon:'error', title:'Error', text: String(e.message || e) });
      }
    });

    icons.appendChild(respLimpiaBtn);
    icons.appendChild(alDiaBtn);
    icons.appendChild(noBtn);
    icons.appendChild(bajaBtn);

    actions.appendChild(btnResp);
    actions.appendChild(icons);

    card.appendChild(head);
    card.appendChild(meta);
    card.appendChild(actions);

    wrap.appendChild(card);
  }
}

function escapeHtml_(s){
  return String(s||'')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');
}

document.getElementById('lista-filter')?.addEventListener('input', ()=>{
  const q = normalizeText_(document.getElementById('lista-filter').value || '');
  if(!q){
    renderList_(__listCache);
    return;
  }
  const filtered = __listCache.filter(it=>{
    const blob = normalizeText_([
      it.id_predial, it.nombre, it.documento, it.barrio, it.whatsapp,
      it.codigo, it.solicitud, it.fecha, it.estado, it.observacion, it.respondida
    ].join(' '));
    return blob.includes(q);
  });
  renderList_(filtered);
});

document.getElementById('lista-back')?.addEventListener('click', ()=>{
  playSoundOnce(SOUNDS.back);

  // ✅ NUEVO: parar refresco al salir
  stopPendientesAutoRefresh_();

  showView('view-inicio');
});

/* ================== RESPUESTA SOLICITUD ================== */
const MAX_PDF_MB = 2;
function isPdfFile_(file){
  if(!file) return false;
  const nameOk = /\.pdf$/i.test(String(file.name||''));
  const typeOk = String(file.type||'').toLowerCase() === 'application/pdf';
  return nameOk || typeOk;
}
function setPdfStatus_(id, file){
  const el = document.getElementById(id + '-status');
  if(!el) return;
  if(!file){ el.textContent = ''; return; }
  el.textContent = `CARGADO: ${file.name}`;
}

['recibo1','recibo2','recibo3','recibo4','recibo5'].forEach(id=>{
  const inp = document.getElementById(id);
  if(!inp) return;
  inp.addEventListener('change', async ()=>{
    const file = inp.files && inp.files[0] ? inp.files[0] : null;
    setPdfStatus_(id, null);
    if(!file) return;

    if(!isPdfFile_(file)){
      inp.value = '';
      await Swal.fire({ icon:'warning', title:'Archivo inválido', text:'Solo se permiten archivos PDF.' });
      return;
    }
    const sizeMB = file.size/(1024*1024);
    if(sizeMB > MAX_PDF_MB){
      inp.value = '';
      await Swal.fire({ icon:'warning', title:'Archivo muy pesado', text:`El PDF supera ${MAX_PDF_MB} MB.` });
      return;
    }
    setPdfStatus_(id, file);
  });
});

/* (Cambio #3) Al entrar a RESPONDER - ADJUNTAR: validación por estado solo en PENDIENTES */
async function openRespuestaViewWithCheck_(){
  if(!currentCardSelected){
    Swal.fire({ icon:'warning', title:'Selecciona una solicitud' });
    return;
  }

  // Solo la vista PENDIENTE hace verificación fuerte
  if(currentListMode === 'PENDIENTE'){
    try{
      const still = await apiGet('getSolicitudById', { id_predial: currentCardSelected.id_predial });
      const estadoNow = String(still?.estado || '').toUpperCase().trim();

      if(estadoNow !== 'PENDIENTE'){
        await Swal.fire({ icon:'info', title:'YA FUE RESPONDIDA', timer:2000, showConfirmButton:false });
        // refresca lista de pendientes para que desaparezca
        await loadAndRenderList_('PENDIENTE');
        return;
      }
    }catch(_){
      // si falla la consulta, por seguridad dejamos pasar a responder
    }
  }

  openRespuestaView_();
}

function openRespuestaView_(){
  if(!currentCardSelected){
    Swal.fire({ icon:'warning', title:'Selecciona una solicitud' });
    return;
  }

  document.getElementById('respuesta').value = '';
  ['recibo1','recibo2','recibo3','recibo4','recibo5'].forEach(id=>{
    const inp = document.getElementById(id);
    if(inp) inp.value = '';
    setPdfStatus_(id, null);
  });

    const v = document.getElementById('vigencia');
  if(v) v.value = '';

       // Mostrar resumen centrado (igual a la tarjeta de PENDIENTES)
  const rh = document.getElementById('resp-head');
  if(rh && currentCardSelected){
    rh.innerHTML = `
      <div style="font-weight:1000; margin-bottom:6px;">Usuario: <b>${escapeHtml_(currentCardSelected.nombre || '')}</b></div>
      <div style="display:grid; gap:4px; font-weight:800; color:#222;">
        <div>Documento / NIT: ${escapeHtml_(currentCardSelected.documento || '')}</div>
        <div>Residencia: ${escapeHtml_(currentCardSelected.barrio || '')}</div>
        <div>Código Catastral: ${escapeHtml_(currentCardSelected.codigo || '')}</div>
        <div>Solicitud: ${escapeHtml_(currentCardSelected.solicitud || '')}</div>
        <div>Fecha: ${escapeHtml_(currentCardSelected.fecha || '')}</div>
      </div>
    `;
  }

  showView('view-respuesta');
}

async function fileToBase64_(file){
  const dataUrl = await new Promise((resolve, reject)=>{
    const r = new FileReader();
    r.onload = ()=> resolve(String(r.result||''));
    r.onerror = ()=> reject(new Error('No se pudo leer el archivo'));
    r.readAsDataURL(file);
  });
  return (dataUrl.split(',')[1] || '');
}

document.getElementById('resp-back')?.addEventListener('click', ()=>{
  playSoundOnce(SOUNDS.back);
  showView('view-lista');
});

document.getElementById('resp-guardar')?.addEventListener('click', async ()=>{
  if(!currentCardSelected){
    Swal.fire({ icon:'warning', title:'Solicitud inválida' });
    return;
  }

  const respuesta = String(document.getElementById('respuesta').value || '').trim();
  const files = ['recibo1','recibo2','recibo3','recibo4','recibo5']
    .map(id => document.getElementById(id)?.files?.[0] || null)
    .filter(Boolean);

  if(files.length < 1){
    await Swal.fire({ icon:'warning', title:'Adjunta al menos 1 PDF', text:'Debes adjuntar mínimo un recibo.' });
    return;
  }

    const vigencia = String(document.getElementById('vigencia').value || '').trim();
  if(!vigencia){
    await Swal.fire({ icon:'warning', title:'Vigencia requerida', text:'Selecciona una vigencia.' });
    return;
  }

  const ok = await Swal.fire({
    icon:'question',
    title:'Guardar respuesta',
    text:`Se guardarán ${files.length} PDF(s) y se enviará mensaje al usuario.`,
    showCancelButton:true,
    confirmButtonText:'Guardar',
    cancelButtonText:'Cancelar'
  });
  if(!ok.isConfirmed) return;

  const pdfs = [];
  for(let i=0;i<files.length;i++){
    pdfs.push({ filename: files[i].name, base64: await fileToBase64_(files[i]) });
  }

    await apiPost('guardarRespuesta', {
    id_predial: currentCardSelected.id_predial,
    respuesta: respuesta,
    vigencia: vigencia,
    pdfs: pdfs,
    usuario: currentUser ? (currentUser.nombre || '') : ''
  });

  await Swal.fire({ icon:'success', title:'Enviado', timer:1500, showConfirmButton:false });

  showView('view-lista');
  await loadAndRenderList_(currentListMode);
});

/* ================== AGREGAR SOLICITUD (presencial) ================== */
function initResidenciaChoices_(){
  if(choicesResidencia) return;
  const el = document.getElementById('upd-residencia');
  if(!el) return;
  choicesResidencia = new Choices(el, {
    searchEnabled: true,
    itemSelectText: '',
    shouldSort: false
  });
}

function validateTwoWords_(s){
  const parts = String(s||'').trim().split(/\s+/).filter(Boolean);
  return parts.length >= 2;
}

/* (Cambio #1) buscar contacto por documento y autocompletar A/B/C/D */
document.getElementById('btn-buscar-contacto')?.addEventListener('click', async ()=>{
  try{
    if(!currentUser){
      Swal.fire({ icon:'warning', title:'Sesión inválida' });
      return;
    }
    const doc = onlyDigits(document.getElementById('identidad').value || '');
    if(!/^\d{6,10}$/.test(doc)){
      // no alertas si no está / inválido: solo no hacer nada (como pediste, sin enredos)
      return;
    }

    const found = await apiGet('buscarContacto', { documento: doc });
    if(!found?.encontrado) return;

    // autocompletar
    if(found.nombre) document.getElementById('Propietario').value = String(found.nombre);
    if(found.whatsapp) document.getElementById('celular').value = onlyDigits(found.whatsapp);

    // residencia: solo si existe exactamente en el select
    if(found.barrio){
      const val = String(found.barrio).toUpperCase().trim();
      const sel = document.getElementById('upd-residencia');
      const exists = Array.from(sel.options).some(o => String(o.value).toUpperCase().trim() === val);
      if(exists){
        try{
          choicesResidencia?.setChoiceByValue(val);
        }catch(_){
          sel.value = val;
        }
      }
    }
  }catch(_){
    // sin alertas
  }
});

document.getElementById('add-back')?.addEventListener('click', ()=>{
  playSoundOnce(SOUNDS.back);
  showView('view-inicio');
});

document.getElementById('add-guardar')?.addEventListener('click', async ()=>{
  if(!currentUser){
    Swal.fire({ icon:'warning', title:'Sesión inválida' });
    return;
  }
  const propietario = String(document.getElementById('Propietario').value||'').trim();
  const identidad = onlyDigits(document.getElementById('identidad').value||'');
  const residencia = String(document.getElementById('upd-residencia').value||'').trim();
  const celularRaw = onlyDigits(document.getElementById('celular').value||'');

  if(!validateTwoWords_(propietario)){
    Swal.fire({ icon:'warning', title:'Nombre inválido', text:'Debe contener al menos 2 palabras.' });
    return;
  }
  if(!/^\d{6,10}$/.test(identidad)){
    Swal.fire({ icon:'warning', title:'Documento/NIT inválido', text:'Debe tener entre 6 y 10 dígitos.' });
    return;
  }
  if(!residencia){
    Swal.fire({ icon:'warning', title:'Residencia requerida' });
    return;
  }
  if(!validatePhone_(celularRaw)){
    Swal.fire({ icon:'warning', title:'Teléfono inválido', text:'Debe tener 10 dígitos, o 12 si empieza con 57.' });
    return;
  }

  // (Cambio solicitado) quitamos el resumen/confirm modal de guardar
  // Guardar directo
  await apiPost('agregarSolicitudPresencial', {
    propietario,
    identidad,
    residencia,
    celular: normalizePhoneForSave_(celularRaw), // ya normalizado (con 57 si aplica)
    usuario: currentUser ? (currentUser.nombre || '') : ''
  });

  await Swal.fire({ icon:'success', title:'Guardado', timer:1400, showConfirmButton:false });

  // Limpiar campos
  document.getElementById('Propietario').value = '';
  document.getElementById('identidad').value = '';
  document.getElementById('celular').value = '';
  try{ document.getElementById('upd-residencia').value = ''; choicesResidencia?.setChoiceByValue(''); }catch(_){}

 // Ir a INICIO (requisito nuevo)
  showView('view-inicio');
});

  /* ===== DRIVE ANEXOS: botones ===== */
document.getElementById('btn-drive-anexos')?.addEventListener('click', async ()=>{
  playSoundOnce(SOUNDS.back);
  try{
    await openDriveAnexosView_();
  }catch(e){
    Swal.fire({ icon:'error', title:'Error', text: String(e.message || e) });
  }
});

document.getElementById('btn-drive-regresar')?.addEventListener('click', ()=>{
  playSoundOnce(SOUNDS.back);
  showView('view-inicio');
});

document.getElementById('btn-drive-back-edit')?.addEventListener('click', ()=>{
  playSoundOnce(SOUNDS.back);
  DRIVE_EDIT_TARGET = null;
  showView('view-drive-anexos');
});

document.getElementById('btn-drive-guardar')?.addEventListener('click', async ()=>{
  if(!DRIVE_EDIT_TARGET){
    Swal.fire({ icon:'warning', title:'Registro inválido' });
    return;
  }

  const newEmail = String(document.getElementById('drive-edit-correo').value || '').trim().toLowerCase();
  if(!isValidGmail_(newEmail)){
    Swal.fire({ icon:'warning', title:'Correo inválido', text:'Debes ingresar un correo @gmail.com válido.' });
    return;
  }

  const oldEmail = String(DRIVE_EDIT_TARGET.correo || '').trim().toLowerCase();
  const link = String(DRIVE_EDIT_TARGET.enlace || '').trim();
  const folderId = normalizeDriveFolderId_(link);

  if(!folderId){
    Swal.fire({ icon:'error', title:'Carpeta inválida', text:'No se pudo extraer el ID de la carpeta en Drive.' });
    return;
  }

  try{
    await apiPost('updateDriveCorreo', {
      rowIndex: DRIVE_EDIT_TARGET.rowIndex,
      newEmail,
      oldEmail,
      folderId
    });

    Swal.fire({ icon:'success', title:'Guardado', timer:1600, showConfirmButton:false });

    await loadDriveData_();
    DRIVE_EDIT_TARGET = null;
    showView('view-drive-anexos');
  }catch(e){
    Swal.fire({ icon:'error', title:'Error', text: String(e.message || e) });
  }
});

  /* ============================================================
   MI SEMÁFORO 🚦 — Lógica JavaScript
   Agregar al final del bloque <script> de index.html
   ============================================================ */

/* ── Constantes ─────────────────────────────────────────── */
const GRUPOS_SEMAFORO = [
  { asignado:'LEESLIE JULIET GOMEZ QUINTERO',   contacto1:'3183200977', asistente:'MARIA NIDIA MENESES MARTINEZ',       contacto2:'3015786913' },
  { asignado:'LUIS GILBERTO MOYA ROMERO',        contacto1:'3208858086', asistente:'NICOL ESTEFANI MADRIGALES GONZALEZ', contacto2:'3212331684' },
  { asignado:'ANDREA KATERINE LAMAR RODRIGUEZ',  contacto1:'3163170769', asistente:'VICTOR MANUEL FANDIÑO GIRALDO',      contacto2:'3203811201' },
  { asignado:'LUIS GABRIEL RAMIREZ RAMIREZ',     contacto1:'3204744065', asistente:'',                                   contacto2:'' },
  { asignado:'DIEGO FERNANDO GARCIA',            contacto1:'3166139232', asistente:'',                                   contacto2:'' },
  { asignado:'DIANA MARCELA OTALORA',            contacto1:'3108034107', asistente:'',                                   contacto2:'' },
  { asignado:'ROSALBA ABADIA ARAGON',            contacto1:'3202028939', asistente:'AMANDA VANESSA TAMAYO BEJARANO',     contacto2:'3209661591' }
];

/* ── Tabla coordinadores (contacto3) ───────────────────── */
const COORDINADORES_CONTACTO3 = [
  { coordinador: 'LUZ HAYDEE ORTEGA MAYORGA',     contacto3: '3222622322' },
  { coordinador: 'OSCAR MAURICIO POLANIA GUERRA',  contacto3: '3103230712' },
  { coordinador: 'DIEGO FERNANDO GARCIA',          contacto3: '3166139232' }
];

function getContacto3ByCoordinador_(nombre) {
  const n = normalizeText_(nombre || '');
  const found = COORDINADORES_CONTACTO3.find(c => normalizeText_(c.coordinador) === n);
  return found ? found.contacto3 : '';
}

/* Devuelve el contacto del usuario logueado consultando
   COORDINADORES_CONTACTO3 y GRUPOS_SEMAFORO (asignado/asistente). */
function getContactoUsuarioLogueado_() {
  if (!currentUser) return '';
  const n = normalizeText_(currentUser.nombre || '');

  // 1) Tabla oficial de coordinadores
  const coord = COORDINADORES_CONTACTO3.find(c => normalizeText_(c.coordinador) === n);
  if (coord) return coord.contacto3 || '';

  // 2) Grupos del semáforo — como asignado
  const gA = GRUPOS_SEMAFORO.find(g => normalizeText_(g.asignado) === n);
  if (gA) return gA.contacto1 || '';

  // 3) Grupos del semáforo — como asistente
  const gS = GRUPOS_SEMAFORO.find(g => normalizeText_(g.asistente) === n);
  if (gS) return gS.contacto2 || '';

  return '';
}

const FERIADOS_2026 = new Set([
  '23/03/2026','02/04/2026','03/04/2026','01/05/2026','18/05/2026','08/06/2026',
  '15/06/2026','29/06/2026','20/07/2026','07/08/2026','17/08/2026','12/10/2026',
  '02/11/2026','16/11/2026','08/12/2026','25/12/2026'
]);

const CAT_ICONS = {
  'GESTIÓN DE IMPUESTOS (FACTURACIÓN)':         'https://res.cloudinary.com/dqqeavica/image/upload/v1775925730/categoria1_dytugz.png',
  'COBRO COACTIVO Y PERSUASIVO':                'https://res.cloudinary.com/dqqeavica/image/upload/v1775925920/categoria2_hsjnwc.png',
  'PETICIONES Y RELACIONES CIUDADANAS (PQRSD)': 'https://res.cloudinary.com/dqqeavica/image/upload/v1775926064/categoria3_zvzmre.png',
  'RECURSOS DE LEY (DEFENSA DEL CIUDADANO)':    'https://res.cloudinary.com/dqqeavica/image/upload/v1775926219/categoria4_u9oodc.png'
};

const SUBCAT_ICONS = {
  'LIQUIDACIÓN DE IMPUESTOS (FACTURACIÓN)':     'https://res.cloudinary.com/dqqeavica/image/upload/v1775925730/subcategoria1.1_obq8j3.png',
  'EXENCIONES Y BENEFICIOS TRIBUTARIOS':        'https://res.cloudinary.com/dqqeavica/image/upload/v1775925731/subcategoria1.2_fexkst.png',
  'REVISIONES DE AVALÚO O TARIFA':              'https://res.cloudinary.com/dqqeavica/image/upload/v1775925730/subcategoria1.3_cjc9uw.png',
  'DEVOLUCIONES O COMPENSACIONES DE SALDO':     'https://res.cloudinary.com/dqqeavica/image/upload/v1775925730/subcategoria1.4_but7fh.png',
  'ETAPA PERSUASIVA (INVITACIÓN AL PAGO)':      'https://res.cloudinary.com/dqqeavica/image/upload/v1775925920/subcategoria2.1_tkss3x.png',
  'ETAPA COACTIVA (EMBARGOS Y EJECUCIÓN)':      'https://res.cloudinary.com/dqqeavica/image/upload/v1775925920/subcategoria2.2_a9ffzt.png',
  'FACILIDADES DE PAGO (ACUERDOS)':             'https://res.cloudinary.com/dqqeavica/image/upload/v1775925920/subcategroia2.3_iijlxw.png',
  'DERECHO DE PETICIÓN DE INFORMACIÓN':         'https://res.cloudinary.com/dqqeavica/image/upload/v1775926065/subcategoria3.1_v11uug.png',
  'CERTIFICACIONES Y CONSTANCIAS':              'https://res.cloudinary.com/dqqeavica/image/upload/v1775926065/subcategoria3.2_zd5p4f.png',
  'QUEJAS, RECLAMOS Y SUGERENCIAS':             'https://res.cloudinary.com/dqqeavica/image/upload/v1775926065/subcategoria3.3_rv6imv.png',
  'RECURSO DE REPOSICIÓN':                      'https://res.cloudinary.com/dqqeavica/image/upload/v1775926219/subcategoria4.1_cosola.png',
  'RECURSO DE RECONSIDERACIÓN':                 'https://res.cloudinary.com/dqqeavica/image/upload/v1775926220/subcategoria4.2_ndos1e.png',
  'REVOCATORIA DIRECTA':                        'https://res.cloudinary.com/dqqeavica/image/upload/v1775926220/subcategoria4.3_zwehxh.png'
};

const SUBCAT_POR_CAT = {
  'GESTIÓN DE IMPUESTOS (FACTURACIÓN)': [
    'LIQUIDACIÓN DE IMPUESTOS (FACTURACIÓN)',
    'EXENCIONES Y BENEFICIOS TRIBUTARIOS',
    'REVISIONES DE AVALÚO O TARIFA',
    'DEVOLUCIONES O COMPENSACIONES DE SALDO'
  ],
  'COBRO COACTIVO Y PERSUASIVO': [
    'ETAPA PERSUASIVA (INVITACIÓN AL PAGO)',
    'ETAPA COACTIVA (EMBARGOS Y EJECUCIÓN)',
    'FACILIDADES DE PAGO (ACUERDOS)'
  ],
  'PETICIONES Y RELACIONES CIUDADANAS (PQRSD)': [
    'DERECHO DE PETICIÓN DE INFORMACIÓN',
    'CERTIFICACIONES Y CONSTANCIAS',
    'QUEJAS, RECLAMOS Y SUGERENCIAS'
  ],
  'RECURSOS DE LEY (DEFENSA DEL CIUDADANO)': [
    'RECURSO DE REPOSICIÓN',
    'RECURSO DE RECONSIDERACIÓN',
    'REVOCATORIA DIRECTA'
  ]
};

const ETAPAS_POR_CAT = {
  'GESTIÓN DE IMPUESTOS (FACTURACIÓN)': [
    'Recepción y Análisis','Requerimiento de Información',
    'Proyección de Acto Administrativo','Notificación','Firmeza'
  ],
  'COBRO COACTIVO Y PERSUASIVO': [
    'Verificación de Título Ejecutivo','Mandamiento de Pago',
    'Investigaciones de Bienes / Medidas Cautelares',
    'Resolución de Excepciones','Terminación y Archivo'
  ],
  'PETICIONES Y RELACIONES CIUDADANAS (PQRSD)': [
    'En Trámite / Reparto Interno','Solicitud de Concepto Técnico',
    'Respuesta Proyectada','Respuesta Enviada / Finalizado'
  ],
  'RECURSOS DE LEY (DEFENSA DEL CIUDADANO)': [
    'Auto Admisorio','Práctica de Pruebas','Fallo de Segunda Instancia'
  ]
};

/* ── Colores de borde por categoría / subcategoría ──────── */
const CAT_COLORS = {
  'GESTIÓN DE IMPUESTOS (FACTURACIÓN)':         { border: '#1e40af', bg: '#dbeafe' }, // azul oscuro / azul claro
  'COBRO COACTIVO Y PERSUASIVO':                { border: '#15803d', bg: '#dcfce7' }, // verde oscuro / verde claro
  'PETICIONES Y RELACIONES CIUDADANAS (PQRSD)': { border: '#6d28d9', bg: '#ede9fe' }, // lila oscuro / lila claro
  'RECURSOS DE LEY (DEFENSA DEL CIUDADANO)':    { border: '#c2410c', bg: '#ffedd5' }  // naranja oscuro / naranja claro
};

// Mapa: subcategoría → su categoría padre (para heredar color más claro)
const SUBCAT_TO_CAT = {
  'LIQUIDACIÓN DE IMPUESTOS (FACTURACIÓN)':  'GESTIÓN DE IMPUESTOS (FACTURACIÓN)',
  'EXENCIONES Y BENEFICIOS TRIBUTARIOS':     'GESTIÓN DE IMPUESTOS (FACTURACIÓN)',
  'REVISIONES DE AVALÚO O TARIFA':           'GESTIÓN DE IMPUESTOS (FACTURACIÓN)',
  'DEVOLUCIONES O COMPENSACIONES DE SALDO':  'GESTIÓN DE IMPUESTOS (FACTURACIÓN)',
  'ETAPA PERSUASIVA (INVITACIÓN AL PAGO)':   'COBRO COACTIVO Y PERSUASIVO',
  'ETAPA COACTIVA (EMBARGOS Y EJECUCIÓN)':   'COBRO COACTIVO Y PERSUASIVO',
  'FACILIDADES DE PAGO (ACUERDOS)':          'COBRO COACTIVO Y PERSUASIVO',
  'DERECHO DE PETICIÓN DE INFORMACIÓN':      'PETICIONES Y RELACIONES CIUDADANAS (PQRSD)',
  'CERTIFICACIONES Y CONSTANCIAS':           'PETICIONES Y RELACIONES CIUDADANAS (PQRSD)',
  'QUEJAS, RECLAMOS Y SUGERENCIAS':          'PETICIONES Y RELACIONES CIUDADANAS (PQRSD)',
  'RECURSO DE REPOSICIÓN':                   'RECURSOS DE LEY (DEFENSA DEL CIUDADANO)',
  'RECURSO DE RECONSIDERACIÓN':              'RECURSOS DE LEY (DEFENSA DEL CIUDADANO)',
  'REVOCATORIA DIRECTA':                     'RECURSOS DE LEY (DEFENSA DEL CIUDADANO)'
};

function getCatColor_(catName) {
  const key = normalizeText_(catName || '');
  return Object.entries(CAT_COLORS).find(([k]) => normalizeText_(k) === key)?.[1] || null;
}
function getSubcatColor_(subcatName) {
  const catKey = SUBCAT_TO_CAT[subcatName] ||
    Object.entries(SUBCAT_TO_CAT).find(([k]) => normalizeText_(k) === normalizeText_(subcatName))?.[1];
  return catKey ? CAT_COLORS[catKey] || null : null;
}

const ICONO_JURIDICO   = 'https://res.cloudinary.com/dqqeavica/image/upload/v1775926546/juridico_oepj4a.png';
const ICONO_CHINCHETA  = 'https://res.cloudinary.com/dqqeavica/image/upload/v1775788408/chincheta_v6mg7a.png';
const ICONO_ELIMINAR   = 'https://res.cloudinary.com/dqqeavica/image/upload/v1775788435/Eliminar_jcmwso.webp';
const ICONO_EDITAR     = 'https://res.cloudinary.com/dqqeavica/image/upload/v1771979124/editar_bx9dsl.webp';
const ICONO_VER        = 'https://res.cloudinary.com/dqqeavica/image/upload/v1764084782/Mostrar_yymceh.png';
const ICONO_FIRMA      = 'https://res.cloudinary.com/dqqeavica/image/upload/v1775850623/firma_e19uie.webp';
const ICONO_REBOTAR    = 'https://res.cloudinary.com/dqqeavica/image/upload/v1775844088/devolver_zhe62l.webp';
const ICONO_INBOX      = 'https://res.cloudinary.com/dqqeavica/image/upload/v1775841196/inbox_nvanat.webp';
const ICONO_OUTBOX     = 'https://res.cloudinary.com/dqqeavica/image/upload/v1775841196/outbox_tnns1w.webp';
const ICONO_MEMORIA    = 'https://res.cloudinary.com/dqqeavica/image/upload/v1773105921/memoria_o2lro5.webp';

const BB_PROC_ENDPOINT = 'https://app.builderbot.cloud/api/v2/ff37a123-12b0-4fdc-9866-f3e2daf389fb/messages';
const BB_PROC_KEY      = 'bb-7f9ef630-5cfc-4ba4-9258-5e7cecbb4f65';

/* ── SOL MAR: usuario especial expediente ── */
const SOLMAR_NOMBRE  = 'SOL MAR OCHOA HERNANDEZ';
const SOLMAR_TEL     = '3134268302';
const SOLMAR_PREFIJO = 'SOL MAR';

function getPrefijo_(nombreCompleto) {
  // Retorna los dos primeros nombres en mayúsculas
  const partes = String(nombreCompleto || '')
    .replace(/\s+/g, ' ').trim().toUpperCase().split(' ').filter(Boolean);
  return partes.slice(0, 2).join(' ');
}

function esSolMar_() {
  return normalizeText_(currentUser?.nombre || '') === normalizeText_(SOLMAR_NOMBRE);
}

/* ── Estado global ──────────────────────────────────────── */
let currentProcesoSelected = null;
let __procListCache = [];
let __procFechaTarget = null; // 'recibido' | 'respuesta' | 'edit-recibido' | 'edit-respuesta' | 'edit-cierre'

/* ── Utilidades de fecha ────────────────────────────────── */
function parseDDMMYYYYtoDate_(str) {
  const s = String(str || '').trim();
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const d = parseInt(m[1], 10), mo = parseInt(m[2], 10), y = parseInt(m[3], 10);
  const dt = new Date(y, mo - 1, d);
  if (isNaN(dt.getTime())) return null;
  return dt;
}

function formatDDMMYYYY_(date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}/${m}/${date.getFullYear()}`;
}

function formatFechaLarga_(str) {
  // dd/mm/yyyy → "Viernes, 10 de abril de 2026"
  const dt = parseDDMMYYYYtoDate_(str);
  if (!dt) return str || '';
  const dias   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const meses  = ['enero','febrero','marzo','abril','mayo','junio',
                  'julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return `${dias[dt.getDay()]}, ${dt.getDate()} de ${meses[dt.getMonth()]} de ${dt.getFullYear()}`;
}

function diasHabiles_(fechaIni, fechaFin) {
  // Retorna días hábiles INCLUYENDO ambos extremos (fechaIni y fechaFin).
  // "Faltan X días" cuenta desde hoy (inclusive) hasta el vencimiento (inclusive).
  // "Resp. en X días" cuenta desde recibido (inclusive) hasta cierre (inclusive).
  const a = parseDDMMYYYYtoDate_(fechaIni);
  const b = parseDDMMYYYYtoDate_(fechaFin);
  if (!a || !b) return 0;
  let count = 0;
  const cursor = new Date(a);   // ← arranca EN fechaIni (inclusive)
  const end    = new Date(b);
  const dir    = end >= cursor ? 1 : -1;
  while (dir === 1 ? cursor <= end : cursor >= end) {
    const dow  = cursor.getDay();
    const dStr = formatDDMMYYYY_(cursor);
    if (dow !== 0 && dow !== 6 && !FERIADOS_2026.has(dStr)) count += dir;
    cursor.setDate(cursor.getDate() + dir);
  }
  return count;
}

function calcSemaforo_(row) {
  const estado = String(row.estado || '').trim().toUpperCase();
  if (estado === 'FINALIZADO') {
    const dias = diasHabiles_(row.recibido, row.cierre);
    return { clase: 'semaforo-gris', texto: `Resp. en ${Math.abs(dias)} días`, cardClass: 'color-gris' };
  }
  const hoy    = formatDDMMYYYY_(new Date());
  const total  = diasHabiles_(row.recibido, row.respuesta);
  const faltan = diasHabiles_(hoy, row.respuesta);

  if (faltan <= 0) {
    // Vencido → rojo oscuro
    return {
      clase: 'semaforo-rojo',
      cardClass: 'color-rojo',
      texto: faltan === 0 ? 'Vence hoy' : `Venció hace ${Math.abs(faltan)} días`
    };
  }
  if (faltan <= 3) {
    // ≤ 3 días → rojo claro
    return {
      clase: 'semaforo-rojo-claro',
      cardClass: 'color-rojo-claro',
      texto: `Faltan ${faltan} días`
    };
  }
  if (total > 0 && (faltan / total) < 0.5) {
    // Menos de la mitad del plazo → naranja
    return {
      clase: 'semaforo-naranja',
      cardClass: 'color-naranja',
      texto: `Faltan ${faltan} días`
    };
  }
  // Más de la mitad del plazo → verde
  return {
    clase: 'semaforo-verde',
    cardClass: '',
    texto: `Faltan ${faltan} días`
  };
}

/* ── Visibilidad botón semáforo ─────────────────────────── */
function canSeeSemaforo_() {
  if (!currentUser) return false;
  if (currentUser.isSuper) return true;
  const n = normalizeText_(currentUser.nombre || '');
  return GRUPOS_SEMAFORO.some(g =>
    normalizeText_(g.asignado) === n || normalizeText_(g.asistente) === n
  );
}

function updateSemaforoBtn_() {
  try {
    const b = document.getElementById('btn-semaforo');
    if (b) b.style.display = canSeeSemaforo_() ? '' : 'none';
  } catch (_) {}
}

/* ── Picker de fechas para procesos ─────────────────────── */
(function initProcPicker_() {
  const dSel = document.getElementById('proc-picker-dia');
  const mSel = document.getElementById('proc-picker-mes');
  if (!dSel || !mSel || dSel.childElementCount) return;
  for (let d = 1; d <= 31; d++) {
    const o = document.createElement('option');
    o.value = String(d).padStart(2, '0');
    o.textContent = o.value;
    dSel.appendChild(o);
  }
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  meses.forEach((nm, i) => {
    const o = document.createElement('option');
    o.value = String(i + 1).padStart(2, '0');
    o.textContent = nm;
    mSel.appendChild(o);
  });
})();

function abrirProcPicker_(target) {
  __procFechaTarget = target;
  const m = document.getElementById('proc-fecha-modal');
  if (m) { m.classList.add('open'); m.setAttribute('aria-hidden', 'false'); }
}
// Alias global para los onclick del HTML
function abrirProcPicker(t) { abrirProcPicker_(t); }

function cancelarProcPicker() {
  const m = document.getElementById('proc-fecha-modal');
  if (m) { m.classList.remove('open'); m.setAttribute('aria-hidden', 'true'); }
  __procFechaTarget = null;
}

function confirmarProcPicker() {
  const dia = document.getElementById('proc-picker-dia')?.value || '01';
  const mes = document.getElementById('proc-picker-mes')?.value || '01';
  const val = `${dia}/${mes}/2026`;

  if (__procFechaTarget) {
    let inputId = '';
    switch (__procFechaTarget) {
      case 'recibido':       inputId = 'proc-recibido'; break;
      case 'respuesta':      inputId = 'proc-respuesta'; break;
      case 'edit-recibido':  inputId = 'edit-recibido'; break;
      case 'edit-respuesta': inputId = 'edit-respuesta'; break;
      case 'edit-cierre':    inputId = 'edit-cierre'; break;
    }
    if (inputId) {
      const el = document.getElementById(inputId);
      if (el) el.value = val;
    }
  }
  cancelarProcPicker();
}

/* ── Helpers grupos ─────────────────────────────────────── */
function getGrupoByAsignado_(nombre) {
  const n = normalizeText_(nombre || '');
  return GRUPOS_SEMAFORO.find(g => normalizeText_(g.asignado) === n) || null;
}

function autoFillAsistente_(asignadoVal, prefijo) {
  const g = getGrupoByAsignado_(asignadoVal);
  const asist = document.getElementById(prefijo + 'asistente');
  const c1    = document.getElementById(prefijo + 'contacto1');
  const c2    = document.getElementById(prefijo + 'contacto2');
  if (asist) asist.value = g ? (g.asistente || '') : '';
  if (c1)    c1.value    = g ? (g.contacto1 || '') : '';
  if (c2)    c2.value    = g ? (g.contacto2 || '') : '';
}

/* ── Selector de categorías con iconos ──────────────────── */
function renderCatSelector_(containerId, selectId, selectedValue, prefijo) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  wrap.innerHTML = '';
  Object.entries(CAT_ICONS).forEach(([cat, iconUrl]) => {
    const color   = getCatColor_(cat);
    const borderC = color ? color.border : '#aaa';
    const bgC     = color ? color.bg     : '#f9f9f9';
    const isSelected = normalizeText_(selectedValue) === normalizeText_(cat);

    const pill = document.createElement('div');
    pill.className = 'cat-pill-colored clickable' + (isSelected ? ' selected' : '');
    pill.style.borderColor = borderC;
    pill.style.background  = bgC;
    pill.style.color       = borderC;
    pill.innerHTML = `<img src="${iconUrl}" alt="${cat}" /><span>${cat}</span>`;
    pill.title = cat;
    pill.addEventListener('click', () => {
      wrap.querySelectorAll('.cat-pill-colored').forEach(p => p.classList.remove('selected'));
      pill.classList.add('selected');
      const sel = document.getElementById(selectId);
      if (sel) sel.value = cat;
      renderSubcatSelector_(
        prefijo + 'subcat-selector',
        prefijo + 'subcategoria',
        cat, ''
      );
      if (prefijo === 'edit-') updateEditEtapas_(cat);
    });
    wrap.appendChild(pill);
  });

  const sel = document.getElementById(selectId);
  if (sel) {
    sel.innerHTML = '<option value="">— Selecciona —</option>';
    Object.keys(CAT_ICONS).forEach(cat => {
      const o = document.createElement('option');
      o.value = cat; o.textContent = cat;
      sel.appendChild(o);
    });
    if (selectedValue) sel.value = selectedValue;
  }
}

function renderSubcatSelector_(containerId, selectId, catVal, selectedValue) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  wrap.innerHTML = '';
  const subcats = SUBCAT_POR_CAT[catVal] || [];
  subcats.forEach(subcat => {
    const iconUrl = getSubcatIcon_(subcat);
    const color   = getSubcatColor_(subcat);
    const borderC = color ? color.border : '#aaa';
    // tono más claro: mezcla bg con un poco más de blanco
    const bgC     = color ? color.bg     : '#f9f9f9';
    const isSelected = normalizeText_(selectedValue) === normalizeText_(subcat);

    const pill = document.createElement('div');
    pill.className = 'cat-pill-colored clickable' + (isSelected ? ' selected' : '');
    // borde mismo color pero bg más claro (usamos opacity trick)
    pill.style.borderColor = borderC;
    pill.style.background  = bgC;
    pill.style.color       = borderC;
    pill.style.opacity     = '0.88'; // tono visualmente más claro que la cat
    pill.innerHTML = iconUrl
      ? `<img src="${iconUrl}" alt="${subcat}" /><span>${subcat}</span>`
      : `<span>${subcat}</span>`;
    pill.title = subcat;
    pill.addEventListener('click', () => {
      wrap.querySelectorAll('.cat-pill-colored').forEach(p => p.classList.remove('selected'));
      pill.classList.add('selected');
      const sel = document.getElementById(selectId);
      if (sel) sel.value = subcat;
    });
    wrap.appendChild(pill);
  });

  const sel = document.getElementById(selectId);
  if (sel) {
    sel.innerHTML = '<option value="">— Opcional —</option>';
    subcats.forEach(s => {
      const o = document.createElement('option');
      o.value = s; o.textContent = s;
      sel.appendChild(o);
    });
    if (selectedValue) sel.value = selectedValue;
  }
}

/* ── Normalizar icono de subcategoría ───────────────────── */
function getSubcatIcon_(subcat) {
  if (!subcat) return '';
  const key = normalizeText_(subcat);
  return Object.entries(SUBCAT_ICONS).find(([k]) => normalizeText_(k) === key)?.[1] || '';
}
function getCatIcon_(cat) {
  if (!cat) return '';
  const key = normalizeText_(cat);
  return Object.entries(CAT_ICONS).find(([k]) => normalizeText_(k) === key)?.[1] || '';
}

/* ── WhatsApp Builderbot ────────────────────────────────── */
function sendProcWA_(numero, mensaje) {
  try {
    if (!numero) return;
    let num = String(numero).replace(/\D/g, '');
    if (num.length === 10) num = '57' + num;
    if (!num) return;
    fetch(BB_PROC_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-builderbot': BB_PROC_KEY },
      body: JSON.stringify({ messages: { content: mensaje }, number: num, checkIfExists: false })
    }).catch(() => {});
  } catch (_) {}
}

/* ── Vista ASIGNACIONES ─────────────────────────────────── */
async function abrirVistaAsignaciones_() {
  if (!currentUser) return;
  showView('view-asignaciones');
  document.getElementById('proc-filter').value = '';
  // Mostrar / ocultar botón agregar
  const btnAgregar = document.getElementById('btn-agregar-asignacion');
  if (btnAgregar) btnAgregar.style.display = canSeeAgregarAsignacion_() ? '' : 'none';

  await loadAndRenderProcesos_();
  startAsignacionesAutoRefresh_(); // ← AGREGA ESTA LÍNEA
}

async function loadAndRenderProcesos_() {
  const esSuper  = currentUser?.isSuper ? 'true' : 'false';
  const esSolMar = esSolMar_();

  let asignado = '';
  if (!currentUser.isSuper && !esSolMar) {
    const nombre = normalizeText_(currentUser.nombre || '');
    const grupo = GRUPOS_SEMAFORO.find(g =>
      normalizeText_(g.asignado) === nombre || normalizeText_(g.asistente) === nombre
    );
    asignado = grupo ? grupo.asignado : (currentUser.nombre || '');
  }
  // Si es super o SOL MAR → asignado='' → trae todas las asignaciones

  const data = await apiGet('listProcesos', { asignado, esSuper });
  __procListCache = Array.isArray(data) ? data : [];
  renderProcList_(__procListCache);
}

function renderProcList_(items) {
  const wrap = document.getElementById('proc-list');
  const countEl = document.getElementById('proc-count');
  if (!wrap) return;
  wrap.innerHTML = '';
  if (countEl) countEl.textContent = String(items.length);

  if (!items.length) {
    wrap.innerHTML = '<p class="muted center" style="grid-column:1/-1;">No hay asignaciones.</p>';
    return;
  }

  for (const row of items) {
    const sem = calcSemaforo_(row);
    const catIcon  = getCatIcon_(row.categoria);
    const subcatIcon = getSubcatIcon_(row.subcategoria);
    const cat  = row.categoria  || '';
    const subcat = row.subcategoria || '';
    const etapa = row.etapa || '';

    const card = document.createElement('div');
    card.className = `proc-card ${sem.cardClass}`;

    // HEAD: asignado + estado
    const head = document.createElement('div');
    head.className = 'proc-head';

    const headLeft = document.createElement('div');
    headLeft.className = 'proc-head-left';
    headLeft.innerHTML = `
      <p class="proc-asignado">${escapeHtml_(row.asignado || '')}</p>
      ${row.asistente ? `<p class="proc-asistente">${escapeHtml_(row.asistente)}</p>` : ''}
    `;

    const headRight = document.createElement('div');
    headRight.className = 'proc-head-right';
    headRight.innerHTML = `
      <div class="proc-estado-badge ${sem.clase}">
        ${escapeHtml_(row.estado || '')}
        <span class="proc-dias-txt">${sem.texto}</span>
      </div>
    `;

    head.appendChild(headLeft);
    head.appendChild(headRight);
    card.appendChild(head);

    // Descripción con chincheta
    const desc = document.createElement('div');
    desc.className = 'proc-descripcion';
    desc.innerHTML = `
      <img src="${ICONO_CHINCHETA}" alt="📌" title="Asunto" />
      <span>${escapeHtml_(row.descripcion || '')}</span>
    `;
    card.appendChild(desc);

    // Fila categorías + etapa
    const catRow = document.createElement('div');
    catRow.className = 'cat-row';
        if (cat) catRow.innerHTML += `
      <div class="cat-pill" title="${escapeHtml_(cat)}">
        ${catIcon ? `<img src="${catIcon}" alt="${escapeHtml_(cat)}" />` : ''}
        <span>${escapeHtml_(cat)}</span>
      </div>`;
    if (subcat) catRow.innerHTML += `
      <div class="cat-pill" title="${escapeHtml_(subcat)}">
        ${subcatIcon ? `<img src="${subcatIcon}" alt="${escapeHtml_(subcat)}" />` : ''}
        <span>${escapeHtml_(subcat)}</span>
      </div>`;
    if (etapa) catRow.innerHTML += `
      <div class="etapa-col">
        <div class="etapa-badge-mini">
          <img src="https://res.cloudinary.com/dqqeavica/image/upload/v1775788362/juridico_csqxdq.png" alt="⚖️" />
          <span>Etapa Jurídica</span>
        </div>
        <span class="etapa-valor">${escapeHtml_(etapa)}</span>
      </div>`;
    card.appendChild(catRow);

    // Acciones
    const actions = document.createElement('div');
    actions.className = 'proc-actions';

    // Consultivo (consecutivo)
           const consWrap = document.createElement('div');
    consWrap.style.cssText = 'display:flex;flex-direction:column;gap:2px;';
    if (row.consecutivo) {
      const consEl = document.createElement('span');
      consEl.style.cssText = 'font-size:.70rem;font-weight:700;color:var(--text-muted);';
      consEl.textContent = 'CONSEC: ' + row.consecutivo;
      consWrap.appendChild(consEl);
    }
    if (row.peticionario) {
      const petEl = document.createElement('span');
      petEl.style.cssText = 'font-size:.68rem;font-weight:600;color:var(--text-sub);';
      petEl.textContent = 'PET: ' + row.peticionario;
      consWrap.appendChild(petEl);
    }
    if (row.expediente) {
      const expEl = document.createElement('span');
      expEl.style.cssText = 'font-size:.68rem;font-weight:700;color:var(--primary);';
      expEl.textContent = 'EXP: ' + row.expediente;
      consWrap.appendChild(expEl);
    }
    actions.appendChild(consWrap);

    const icons = document.createElement('div');
    icons.className = 'proc-icons';

    // Firmar (solo super)
    if (currentUser?.isSuper) {
      const btnFirma = _mkProcIconBtn_(ICONO_FIRMA, 'Decisión');
      btnFirma.addEventListener('click', () => {
        currentProcesoSelected = row;
        abrirDecision_(row);
      });
      icons.appendChild(btnFirma);
    }

    // Eliminar (solo super)
    if (currentUser.isSuper) {
      const btnElim = _mkProcIconBtn_(ICONO_ELIMINAR, 'Eliminar asignación');
      btnElim.addEventListener('click', async () => {
        const ok = await Swal.fire({
          icon: 'warning',
          title: '¿Eliminar asignación?',
          html: `<b>${escapeHtml_(row.descripcion || row.id_proceso)}</b><br>Esta acción es irreversible.`,
          showCancelButton: true, confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar'
        });
        if (!ok.isConfirmed) return;
        await apiPost('eliminarProceso', { id_proceso: row.id_proceso });
        playSoundOnce(SOUNDS.success);
        await loadAndRenderProcesos_();
      });
      icons.appendChild(btnElim);
    }

    // Ver
    const btnVer = _mkProcIconBtn_(ICONO_VER, 'Ver detalles');
    btnVer.addEventListener('click', () => {
      playSoundOnce(SOUNDS.menu);
      currentProcesoSelected = row;
      abrirVerAsignacion_(row);
    });
    icons.appendChild(btnVer);

    // Editar
    const estadoUpper = String(row.estado || '').toUpperCase();
    const puedeEditar = currentUser.isSuper || estadoUpper !== 'FINALIZADO';
    if (puedeEditar) {
      const btnEdit = _mkProcIconBtn_(ICONO_EDITAR, 'Editar asignación');
      btnEdit.addEventListener('click', () => {
        playSoundOnce(SOUNDS.menu);
        currentProcesoSelected = row;
        abrirEditarAsignacion_(row);
      });
      icons.appendChild(btnEdit);
    }

    actions.appendChild(icons);
    card.appendChild(actions);
    wrap.appendChild(card);
  }
}

function _mkProcIconBtn_(src, title) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'proc-icon-btn';
  btn.title = title;
  btn.setAttribute('aria-label', title);
  btn.innerHTML = `<img src="${src}" alt="${title}" />`;
  return btn;
}

// Filtro asignaciones
document.getElementById('proc-filter')?.addEventListener('input', () => {
  const q = normalizeText_(document.getElementById('proc-filter').value || '');
  if (!q) { renderProcList_(__procListCache); return; }
  const filtered = __procListCache.filter(row => {
    const blob = normalizeText_([
      row.id_proceso, row.estado, row.recibido, row.consecutivo, row.descripcion,
      row.respuesta, row.medio, row.categoria, row.subcategoria, row.asignado,
      row.asistente, row.coordinador, row.etapa, row.bitacora
    ].join(' '));
    return blob.includes(q);
  });
  renderProcList_(filtered);
});

// Botones vista asignaciones
document.getElementById('btn-agregar-asignacion')?.addEventListener('click', () => {
  playSoundOnce(SOUNDS.back);
  abrirAgregarAsignacion_();
});

  /* ================== PANEL DASHBOARD ================== */
document.getElementById('btn-panel-dashboard')?.addEventListener('click', async () => {
  playSoundOnce(SOUNDS.back);
  if (!currentUser || !currentUser.isSuper) {
    Swal.fire({ icon: 'warning', title: 'Solo SUPER USUARIO' });
    return;
  }
  await abrirPanel_();
});
  
document.getElementById('btn-asignaciones-back')?.addEventListener('click', () => {
  playSoundOnce(SOUNDS.back);
  stopAsignacionesAutoRefresh_();
  showView('view-inicio');
});
document.getElementById('btn-semaforo')?.addEventListener('click', async () => {
  playSoundOnce(SOUNDS.back);
  if (!currentUser) return;
  await abrirVistaAsignaciones_();
});

/* ── Vista AGREGAR ASIGNACIÓN ─────────────────────────────*/
function abrirAgregarAsignacion_() {
  // Limpiar form
  ['proc-recibido','proc-consecutivo','proc-respuesta'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  document.getElementById('proc-descripcion').value = '';
  const procPet = document.getElementById('proc-peticionario'); if (procPet) procPet.value = '';
  const procExp = document.getElementById('proc-expediente');   if (procExp) procExp.value = '';
  document.getElementById('proc-medio').value = '';
  document.getElementById('proc-asignado').value = '';
  document.getElementById('proc-asistente').value = '';
  document.getElementById('proc-contacto1').value = '';
  document.getElementById('proc-contacto2').value = '';
  // Coordinador y contacto3 del usuario logueado
  document.getElementById('proc-coordinador').value = currentUser?.nombre || '';
document.getElementById('proc-contacto3').value   = getContactoUsuarioLogueado_();
  // Files
  ['proc-recibido1','proc-recibido2','proc-recibido3'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
    const st = document.getElementById(id + '-status'); if (st) st.textContent = '';
  });
  // Selector categorías
  renderCatSelector_('proc-cat-selector', 'proc-categoria', '', 'proc-');
  renderSubcatSelector_('proc-subcat-selector', 'proc-subcategoria', '', '');

  showView('view-agregar-asignacion');
}

// Asignado → auto asistente/contactos
document.getElementById('proc-asignado')?.addEventListener('change', () => {
  const v = document.getElementById('proc-asignado').value;
  autoFillAsistente_(v, 'proc-');
});

// Validación archivos agregar
['proc-recibido1','proc-recibido2','proc-recibido3'].forEach(id => {
  document.getElementById(id)?.addEventListener('change', () => {
    const f = document.getElementById(id)?.files?.[0];
    const st = document.getElementById(id + '-status');
    if (!f) { if (st) st.textContent = ''; return; }
    if (f.size > 10 * 1024 * 1024) {
      document.getElementById(id).value = '';
      if (st) st.textContent = '';
      Swal.fire({ icon: 'warning', title: 'Archivo muy pesado', text: 'Máximo 10 MB por PDF.' });
      return;
    }
    if (st) st.textContent = `✓ ${f.name}`;
  });
});

// Guardar asignación
document.getElementById('btn-proc-add-guardar')?.addEventListener('click', async () => {
  // Validaciones
  const recibido     = document.getElementById('proc-recibido').value.trim();
  const consecutivo  = document.getElementById('proc-consecutivo').value.trim();
  const descripcion  = document.getElementById('proc-descripcion').value.trim();
  const respuesta    = document.getElementById('proc-respuesta').value.trim();
  const medio        = document.getElementById('proc-medio').value;
  const categoria    = document.getElementById('proc-categoria').value;
  const subcategoria = document.getElementById('proc-subcategoria')?.value || '';
  const asignado     = document.getElementById('proc-asignado').value;
  const peticionario = (document.getElementById('proc-peticionario')?.value || '').trim().toUpperCase();
  const expediente   = (document.getElementById('proc-expediente')?.value   || '').trim().toUpperCase();
  const contacto1    = document.getElementById('proc-contacto1').value;
  const asistente    = document.getElementById('proc-asistente').value;
  const contacto2    = document.getElementById('proc-contacto2').value;
  const coordinador  = document.getElementById('proc-coordinador').value;
  const contacto3    = document.getElementById('proc-contacto3').value;

  if (!recibido)    { Swal.fire({ icon:'warning', title:'Fecha de Recibido requerida' }); return; }
  if (!consecutivo) { Swal.fire({ icon:'warning', title:'Consecutivo requerido' }); return; }
  if (!descripcion) { Swal.fire({ icon:'warning', title:'Asunto requerido' }); return; }
  if (!respuesta)   { Swal.fire({ icon:'warning', title:'Fecha de Respuesta requerida' }); return; }
  // Validar 3 días hábiles mínimo
  const hoy = formatDDMMYYYY_(new Date());
  if (diasHabiles_(hoy, respuesta) < 3) {
    Swal.fire({ icon:'warning', title:'Fecha muy cercana', text:'Selecciona al menos 3 días hábiles desde hoy.' });
    return;
  }
  if (!medio)    { Swal.fire({ icon:'warning', title:'Medio requerido' }); return; }
  if (!categoria){ Swal.fire({ icon:'warning', title:'Categoría requerida' }); return; }

  // Subir archivos
  const files = {};
  for (const id of ['proc-recibido1','proc-recibido2','proc-recibido3']) {
    const f = document.getElementById(id)?.files?.[0];
    if (f) files[id.replace('proc-','')] = { filename: f.name, base64: await fileToBase64_(f) };
  }

  // Resumen
  const resumenHtml = buildResumenHtml_({
    'Recibido': recibido,
    'Consecutivo': consecutivo,
    'Asunto': descripcion,
    ...(peticionario ? { 'Peticionario': peticionario } : {}),
    ...(expediente   ? { 'N° EXP. INTERNO': expediente } : {}),
    'Respuesta': respuesta,
    'Medio': medio,
    'Categoría': categoria,
    'Subcategoría': subcategoria,
    'Asignado': asignado,
    'Asistente': asistente,
    'Documentos': Object.keys(files).length + ' archivo(s)'
  });
  
  const ok = await Swal.fire({
    icon: 'info', title: 'Confirmar Asignación',
    html: resumenHtml, showCancelButton: true,
    confirmButtonText: 'Guardar', cancelButtonText: 'Editar'
  });
  if (!ok.isConfirmed) return;

  try {
    const res = await apiPost('agregarProceso', {
      recibido, consecutivo: consecutivo.toUpperCase(),
      descripcion: descripcion.toUpperCase(), respuesta, medio,
      peticionario: peticionario,
      expediente:   expediente,
      categoria, subcategoria, asignado, contacto1, asistente,
      contacto2, coordinador, contacto3,
      recibido1: files['recibido1'] || null,
      recibido2: files['recibido2'] || null,
      recibido3: files['recibido3'] || null
    });

    // Enviar WhatsApp si hay asignado
    if (asignado && contacto1) {
      const msg1 =
        `Estimado(a) *${asignado}*\n\n` +
        `Se te ha asignado el oficio *${consecutivo.toUpperCase()}* recibido a través de *${medio}*.\n` +
        `*Asunto:* ${descripcion}.\n\n` +
        `Por favor, entra a la App para iniciarlo asignando etapa jurídica y bitácora.\n\n` +
        `Cordialmente,\n\n*${coordinador}*`;
      sendProcWA_(contacto1, msg1);

      if (asistente && contacto2) {
        setTimeout(() => {
          const msg2 =
            `Estimado(a) *${asistente}*\n\n` +
            `Se te ha asignado un apoyo para responder el oficio *${consecutivo.toUpperCase()}* recibido a través de *${medio}*.\n` +
            `*Asunto:* ${descripcion}.\n\n` +
            `Por favor, entra a la App para iniciarlo.\n\n` +
            `Cordialmente,\n\n*${coordinador}*`;
          sendProcWA_(contacto2, msg2);
        }, 3000);
      }

      playSoundOnce(SOUNDS.success);
      await Swal.fire({
        icon: 'success', title: 'ASIGNACIÓN EXITOSA',
        html: `<b>Asignado:</b> ${escapeHtml_(asignado)}${asistente ? `<br><b>Apoyo:</b> ${escapeHtml_(asistente)}` : ''}`,
        timer: 3000, showConfirmButton: false
      });
    } else {
      playSoundOnce(SOUNDS.success);
      await Swal.fire({
        icon: 'success', title: 'REGISTRO GUARDADO',
        html: 'No olvides la asignación oportuna.',
        timer: 2500, showConfirmButton: false
      });
    }
    await abrirVistaAsignaciones_();
  } catch (e) {
    Swal.fire({ icon: 'error', title: 'Error', text: String(e.message || e) });
  }
});

document.getElementById('btn-proc-add-back')?.addEventListener('click', () => {
  playSoundOnce(SOUNDS.back);
  showView('view-asignaciones');
});

/* ── Vista VER DETALLES ─────────────────────────────────── */
function abrirVerAsignacion_(row) {
  const sem = calcSemaforo_(row);
  const catIcon    = getCatIcon_(row.categoria);
  const subcatIcon = getSubcatIcon_(row.subcategoria);

  // Header
  const header = document.getElementById('proc-ver-header');
  header.innerHTML = '';
  if (row.categoria) {
    header.innerHTML += `
      <div class="cat-pill" style="padding:8px 14px;">
        ${catIcon ? `<img src="${catIcon}" alt="${escapeHtml_(row.categoria)}" />` : ''}
        <span style="font-weight:700;">${escapeHtml_(row.categoria)}</span>
      </div>`;
  }
  if (row.subcategoria) {
    header.innerHTML += `
      <div class="cat-pill" style="padding:8px 14px;">
        ${subcatIcon ? `<img src="${subcatIcon}" alt="${escapeHtml_(row.subcategoria)}" />` : ''}
        <span style="font-weight:700;">${escapeHtml_(row.subcategoria)}</span>
      </div>`;
  }
      if (row.etapa) {
    header.innerHTML += `
      <div class="etapa-col">
        <div class="etapa-badge-mini">
          <img src="https://res.cloudinary.com/dqqeavica/image/upload/v1775788362/juridico_csqxdq.png" alt="⚖️" />
          <span>Etapa Jurídica</span>
        </div>
        <span class="etapa-valor">${escapeHtml_(row.etapa)}</span>
      </div>`;
  }
  header.innerHTML += `
    <div class="proc-estado-badge ${sem.clase}" style="min-width:140px;">
      ${escapeHtml_(row.estado || '')}
      <span class="proc-dias-txt">${sem.texto}</span>
    </div>`;

  // Cuerpo
  const body = document.getElementById('proc-ver-body');
  body.innerHTML = '';
   const addField = (label, value, esHTML) => {
    if (!value) return;
    const div = document.createElement('div');
    div.className = 'proc-detalle-field';
    const rendered = esHTML ? value : escapeHtml_(value).replace(/\n/g, '<br>');
    div.innerHTML = `<span class="proc-detalle-label">${label}</span>
      <span class="proc-detalle-value">${rendered}</span>`;
    body.appendChild(div);
  };
  addField('Asunto:',               row.descripcion);
  addField('Consecutivo:',          row.consecutivo);
  addField('Fecha de Recibido:',    formatFechaLarga_(row.recibido));
  addField('Medio:',                row.medio);
  addField('Fecha de Respuesta:',   formatFechaLarga_(row.respuesta));
  addField('Bitácora:', row.bitacora ? escapeHtml_(row.bitacora).replace(/\n/g, '<br>') : '', true);
  addField('Fecha de Cierre:',      formatFechaLarga_(row.cierre));
  addField('Asignado:',             row.asignado);
  addField('Asistente:',            row.asistente);

  // Evidencia
  const evWrap = document.getElementById('proc-ver-evidencia');
  const evImg  = document.getElementById('proc-ver-evidencia-img');
  if (row.evidencia) {
    evImg.src = row.evidencia;
    evWrap.style.display = '';
    evImg.onclick = () => window.open(row.evidencia, '_blank', 'noopener');
  } else {
    evWrap.style.display = 'none';
  }

  // Archivos recibidos y respuestas
  const filesWrap = document.getElementById('proc-ver-files');
  filesWrap.innerHTML = '';
  const addFileIcon_ = (urls, srcIcon, label) => {
    const validUrls = urls.filter(Boolean);
    if (!validUrls.length) return;
    validUrls.forEach((url, idx) => {
      if (!url) return;
      const item = document.createElement('div');
      item.className = 'proc-file-item';
      item.title = `${label} ${idx + 1}`;
      item.innerHTML = `
        <img src="${srcIcon}" alt="${label}" />
        ${validUrls.length > 1 ? `<span class="proc-file-counter">${idx + 1}</span>` : ''}
        <span class="proc-file-label">${label} ${idx + 1}</span>`;
      item.addEventListener('click', () => window.open(url, '_blank', 'noopener'));
      filesWrap.appendChild(item);
    });
  };
  addFileIcon_([row.recibido1, row.recibido2, row.recibido3], ICONO_INBOX,  'Recibido');
  addFileIcon_([row.respuesta1, row.respuesta2, row.respuesta3], ICONO_OUTBOX, 'Respuesta');

  // Creación
  const creacionEl = document.getElementById('proc-ver-creacion');
  if (creacionEl && row.creacion) creacionEl.textContent = `Creada: ${row.creacion}`;

  // Botones acción
  const actionsWrap = document.getElementById('proc-ver-actions');
  actionsWrap.innerHTML = '';
  const estado = String(row.estado || '').toUpperCase();

  // Rebotar
  if (estado === 'ASIGNADO') {
    const btnRebotar = document.createElement('button');
    btnRebotar.type = 'button';
    btnRebotar.className = 'proc-action-btn proc-btn-rebotar';
    btnRebotar.title = 'Rebotar asignación';
    btnRebotar.innerHTML = `<img src="${ICONO_REBOTAR}" alt="Rebotar" /> REBOTAR`;
    btnRebotar.addEventListener('click', () => {
      document.getElementById('proc-rebote').value = '';
      document.getElementById('modal-rebotar').classList.remove('hidden');
    });
    actionsWrap.appendChild(btnRebotar);
  }

  // Editar
  const puedeEditar = currentUser.isSuper || estado !== 'FINALIZADO';
  if (puedeEditar) {
    const btnEditar = document.createElement('button');
    btnEditar.type = 'button';
    btnEditar.className = 'btn-primary proc-action-btn';
    btnEditar.style.width = 'auto';
    btnEditar.innerHTML = `<img src="${ICONO_EDITAR}" style="width:20px;height:20px;vertical-align:middle;" alt="Editar" /> EDITAR`;
    btnEditar.addEventListener('click', () => {
      playSoundOnce(SOUNDS.menu);
      abrirEditarAsignacion_(row);
    });
    actionsWrap.appendChild(btnEditar);
  }

  // Solicitar Finalización
  if (estado === 'PENDIENTE DE EVIDENCIA') {
    const btnFin = document.createElement('button');
    btnFin.type = 'button';
    btnFin.className = 'proc-action-btn';
    btnFin.style.cssText = 'background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff;border:0;width:auto;';
    btnFin.title = 'Solicitar Finalización';
    btnFin.innerHTML = `<img src="${ICONO_MEMORIA}" class="proc-btn-finalizar" alt="Finalizar" style="width:28px;height:28px;" /> SOLICITAR FINALIZACIÓN`;
    btnFin.addEventListener('click', async () => {
      const ok = await Swal.fire({
        icon: 'success', title: 'FINALIZACIÓN DE ASIGNACIÓN',
        html: `Antes de realizar este proceso corrobora:<br>
          - Oficio(s) de respuesta firmado y adjuntado<br>
          - Bitácora Editada correctamente<br>
          - Etapa Jurídica Actualizada`,
        showCancelButton: true, confirmButtonText: 'Confirmar', cancelButtonText: 'Cancelar'
      });
      if (!ok.isConfirmed) return;
      // Enviar WhatsApp al coordinador (contacto3)
      const c3 = row.contacto3 || '';
      const msg =
        `Estimado *${row.coordinador || ''}*\n` +
        `Solicito la finalización de mi asignación *${row.descripcion || ''}*\n\n` +
        `Todos los soportes están correctamente cargados.\n\n` +
        `Cordialmente,\n\n*${row.asignado || ''}*`;
      sendProcWA_(c3, msg);
      playSoundOnce(SOUNDS.success);
      await Swal.fire({ icon:'success', title:'Solicitud enviada', timer:1800, showConfirmButton:false });
      abrirVerAsignacion_(row);
    });
    actionsWrap.appendChild(btnFin);
  }

  // Creada al final
  addField('Creada:', row.creacion);
  showView('view-ver-asignacion');
}

document.getElementById('btn-ver-asignacion-back')?.addEventListener('click', () => {
  playSoundOnce(SOUNDS.back);
  showView('view-asignaciones');
});

/* ── Modal REBOTAR ──────────────────────────────────────── */
document.getElementById('btn-rebote-regresar')?.addEventListener('click', () => {
  playSoundOnce(SOUNDS.back);
  document.getElementById('modal-rebotar').classList.add('hidden');
});

document.getElementById('btn-rebote-guardar')?.addEventListener('click', async () => {
  const rebote = document.getElementById('proc-rebote').value.trim();
  if (!rebote) {
    Swal.fire({ icon:'warning', title:'Justificación requerida' });
    return;
  }
  if (!currentProcesoSelected) return;
  try {
    await apiPost('rebotarProceso', { id_proceso: currentProcesoSelected.id_proceso, rebote });
    // Enviar WhatsApp al coordinador
    const c3  = currentProcesoSelected.contacto3 || '';
    const msg =
      `Estimado *${currentProcesoSelected.coordinador || ''}*\n\n` +
      `He rebotado la asignación *${currentProcesoSelected.descripcion || ''}*\n` +
      `*Justificación:*\n${rebote}\n\n` +
      `Cordialmente,\n\n*${currentProcesoSelected.asignado || ''}*`;
    sendProcWA_(c3, msg);
    document.getElementById('modal-rebotar').classList.add('hidden');
    playSoundOnce(SOUNDS.success);
    await Swal.fire({ icon:'success', title:'Asignación Rebotada', timer:1800, showConfirmButton:false });
    // Recargar asignaciones; si no hay, ir a inicio
    await loadAndRenderProcesos_();
    if (__procListCache.length) showView('view-asignaciones');
    else showView('view-inicio');
  } catch (e) {
    Swal.fire({ icon:'error', title:'Error', text: String(e.message || e) });
  }
});

/* ── Vista EDITAR ASIGNACIÓN ────────────────────────────── */
function updateEditEtapas_(cat) {
  const sel = document.getElementById('edit-etapa');
  if (!sel) return;
  sel.innerHTML = '<option value="">— Selecciona —</option>';
  const etapas = ETAPAS_POR_CAT[cat] || ETAPAS_POR_CAT[normalizeText_(cat)] ||
    Object.entries(ETAPAS_POR_CAT).find(([k]) => normalizeText_(k) === normalizeText_(cat))?.[1] || [];
  etapas.forEach(e => {
    const o = document.createElement('option');
    o.value = e; o.textContent = e;
    sel.appendChild(o);
  });
}

function abrirEditarAsignacion_(row) {
  if (!row) return;
  currentProcesoSelected = row;

  // Badge identificador
  const badgeRow = document.getElementById('edit-badge-row');
  if (badgeRow) {
    badgeRow.innerHTML = `<div class="edit-badge">${escapeHtml_(row.id_proceso || '')} — ${escapeHtml_(row.consecutivo || '')}</div>`;
  }

  // Determinar si puede ver campos super
  const esDiegoSuper = normalizeText_(currentUser?.nombre || '') === normalizeText_('DIEGO FERNANDO GARCIA');
  const esSuper = currentUser?.isSuper || false;

  // Mostrar/ocultar campos solo super
  const superFields = document.getElementById('edit-super-fields');
  const recibidosSuper = document.getElementById('edit-recibidos-super');
  const cierreSuper   = document.getElementById('edit-cierre-super');
  if (superFields)    superFields.style.display   = esSuper ? '' : 'none';
  if (recibidosSuper) recibidosSuper.style.display = esSuper ? '' : 'none';
  if (cierreSuper)    cierreSuper.style.display    = esSuper ? '' : 'none';

  // Pre-llenar campos super
  if (esSuper) {
    const er = document.getElementById('edit-recibido');   if (er) er.value = row.recibido || '';
    const ec = document.getElementById('edit-consecutivo'); if (ec) ec.value = row.consecutivo || '';
    const ed = document.getElementById('edit-descripcion'); if (ed) ed.value = row.descripcion || '';
    const esp = document.getElementById('edit-respuesta'); if (esp) esp.value = row.respuesta || '';
    const em = document.getElementById('edit-medio');       if (em) em.value = row.medio || '';
    const ea = document.getElementById('edit-asignado');    if (ea) ea.value = row.asignado || '';
    const ecierre = document.getElementById('edit-cierre'); if (ecierre) ecierre.value = row.cierre || '';
    const epet = document.getElementById('edit-peticionario'); if (epet) epet.value = row.peticionario || '';
    const eexp = document.getElementById('edit-expediente');   if (eexp) eexp.value = row.expediente   || '';
    autoFillAsistente_(row.asignado, 'edit-');
    document.getElementById('edit-contacto1').value = row.contacto1 || '';
  }

  // Campos ambos roles
  renderCatSelector_('edit-cat-selector', 'edit-categoria', row.categoria || '', 'edit-');
  const catVal = row.categoria || '';
  renderSubcatSelector_('edit-subcat-selector', 'edit-subcategoria', catVal, row.subcategoria || '');
  document.getElementById('edit-asistente').value   = row.asistente   || '';
  document.getElementById('edit-contacto2').value   = row.contacto2   || '';
  document.getElementById('edit-coordinador').value = row.coordinador || '';
  document.getElementById('edit-contacto3').value   = row.contacto3   || '';
  document.getElementById('edit-bitacora').value    = row.bitacora    || '';

  // Etapas
  updateEditEtapas_(catVal);
  const etapaSel = document.getElementById('edit-etapa');
  if (etapaSel && row.etapa) etapaSel.value = row.etapa;

   // Estados: solo super ve el select; asignado no lo necesita (se deduce de bitácora)
  const estadoSel = document.getElementById('edit-estado');
  const estadoWrap = estadoSel ? estadoSel.closest('label, div') : null;

  // Ocultar label + select del estado para no-super
  const allLabels = document.querySelectorAll('#view-editar-asignacion label');
  let estadoLabel = null;
  allLabels.forEach(lbl => { if (lbl.textContent.trim() === 'Estado') estadoLabel = lbl; });

  if (!esSuper) {
    if (estadoLabel) estadoLabel.style.display = 'none';
    if (estadoSel)   estadoSel.style.display   = 'none';
  } else {
    if (estadoLabel) estadoLabel.style.display = '';
    if (estadoSel)   estadoSel.style.display   = '';
    estadoSel.innerHTML = '<option value="">— Selecciona —</option>';
    const estadosSuper = ['ASIGNADO','PENDIENTE ASIGNACION','EN PROYECCIÓN','PENDIENTE EVIDENCIA','FINALIZADO'];
    estadosSuper.forEach(s => {
      const o = document.createElement('option');
      o.value = s; o.textContent = s;
      estadoSel.appendChild(o);
    });
    if (row.estado) estadoSel.value = row.estado;
  }

  // Limpiar files
  ['edit-recibido1','edit-recibido2','edit-recibido3','edit-respuesta1','edit-respuesta2','edit-respuesta3','edit-evidencia']
    .forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
      const st = document.getElementById(id + '-status'); if (st) st.textContent = '';
    });

    // Limpiar si la fila no tiene valores (protección)
  if (!row.peticionario) { const el = document.getElementById('edit-peticionario'); if(el) el.value=''; }
  if (!row.expediente)   { const el = document.getElementById('edit-expediente');   if(el) el.value=''; }

    // Mostrar/ocultar campos de respuesta según estado
  const estadoActualParaEditar = String(row.estado || '').toUpperCase();
  const puedeVerRespuesta = esSuper || estadoActualParaEditar === 'EN PROYECCIÓN';
  ['edit-respuesta1','edit-respuesta2','edit-respuesta3'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    // buscar el label anterior
    let prev = el.previousElementSibling;
    while (prev && prev.tagName !== 'LABEL') prev = prev.previousElementSibling;
    if (prev) prev.style.display = puedeVerRespuesta ? '' : 'none';
    el.style.display = puedeVerRespuesta ? '' : 'none';
    const st = document.getElementById(id + '-status');
    if (st) st.style.display = puedeVerRespuesta ? '' : 'none';
  });

    // Ocultar campo evidencia si estado es ASIGNADO (solo puede subirse desde EN PROYECCIÓN o super)
  const puedeVerEvidencia = esSuper || estadoActualParaEditar !== 'ASIGNADO';
  const editEvInput = document.getElementById('edit-evidencia');
  if (editEvInput) {
    let evLabel = editEvInput.previousElementSibling;
    while (evLabel && evLabel.tagName !== 'LABEL') evLabel = evLabel.previousElementSibling;
    if (evLabel) evLabel.style.display = puedeVerEvidencia ? '' : 'none';
    editEvInput.style.display = puedeVerEvidencia ? '' : 'none';
    const evSt = document.getElementById('edit-evidencia-status');
    if (evSt) evSt.style.display = puedeVerEvidencia ? '' : 'none';
    const evPrev = document.getElementById('edit-evidencia-preview');
    if (evPrev && !puedeVerEvidencia) evPrev.style.display = 'none';
  }

  showView('view-editar-asignacion');
}

// Cambio de asignado en editar
document.getElementById('edit-asignado')?.addEventListener('change', () => {
  const v = document.getElementById('edit-asignado').value;
  autoFillAsistente_(v, 'edit-');
  document.getElementById('edit-contacto1').value = getGrupoByAsignado_(v)?.contacto1 || '';
});

// Validación files editar (10MB pdf, 5MB imagen)
['edit-recibido1','edit-recibido2','edit-recibido3','edit-respuesta1','edit-respuesta2','edit-respuesta3'].forEach(id => {
  document.getElementById(id)?.addEventListener('change', () => {
    const f = document.getElementById(id)?.files?.[0];
    const st = document.getElementById(id + '-status');
    if (!f) { if (st) st.textContent = ''; return; }
    if (f.size > 10 * 1024 * 1024) {
      document.getElementById(id).value = '';
      if (st) st.textContent = '';
      Swal.fire({ icon:'warning', title:'Archivo muy pesado', text:'Máximo 10 MB por PDF.' });
      return;
    }
    if (st) st.textContent = `✓ ${f.name}`;
  });
});
document.getElementById('edit-evidencia')?.addEventListener('change', () => {
  const f = document.getElementById('edit-evidencia')?.files?.[0];
  const st = document.getElementById('edit-evidencia-status');
  if (!f) { if (st) st.textContent = ''; return; }
  if (f.size > 5 * 1024 * 1024) {
    document.getElementById('edit-evidencia').value = '';
    if (st) st.textContent = '';
    Swal.fire({ icon:'warning', title:'Imagen muy pesada', text:'Máximo 5 MB.' });
    return;
  }
  if (st) st.textContent = `✓ ${f.name}`;
});

document.getElementById('btn-edit-asig-back')?.addEventListener('click', () => {
  playSoundOnce(SOUNDS.back);
  showView('view-asignaciones');
});

document.getElementById('btn-edit-asig-guardar')?.addEventListener('click', async () => {
  if (!currentProcesoSelected) return;
  const row    = currentProcesoSelected;
  const esSuper = currentUser?.isSuper || false;

    // Validar bitácora requerida
  const _bitacoraVal = (document.getElementById('edit-bitacora')?.value || '').trim();
  if (!_bitacoraVal) {
    Swal.fire({ icon: 'warning', title: 'Bitácora requerida', text: 'Debes escribir al menos una entrada en la bitácora antes de guardar.' });
    document.getElementById('edit-bitacora')?.focus();
    return;
  }

  // Validar etapa jurídica requerida
  const _etapaVal = (document.getElementById('edit-etapa')?.value || '').trim();
  if (!_etapaVal) {
    Swal.fire({ icon: 'warning', title: 'Etapa Jurídica requerida', text: 'Selecciona la etapa jurídica correspondiente antes de guardar.' });
    document.getElementById('edit-etapa')?.focus();
    return;
  }

  const payload = {
    id_proceso: row.id_proceso,
    rowIndex:   row.rowIndex
  };

  if (esSuper) {
    const er  = document.getElementById('edit-recibido')?.value.trim();
    const ec  = document.getElementById('edit-consecutivo')?.value.trim();
    const ed  = document.getElementById('edit-descripcion')?.value.trim();
    const esp = document.getElementById('edit-respuesta')?.value.trim();
    const em  = document.getElementById('edit-medio')?.value;
    const ea  = document.getElementById('edit-asignado')?.value;
    const eci = document.getElementById('edit-cierre')?.value.trim();
    if (er)               payload.recibido    = er;
    if (ec)               payload.consecutivo = ec.toUpperCase();
    if (ed)               payload.descripcion = ed.toUpperCase();
    const _pet = (document.getElementById('edit-peticionario')?.value || '').trim().toUpperCase();
    const _exp = (document.getElementById('edit-expediente')?.value   || '').trim().toUpperCase();
    if (_pet) payload.peticionario = _pet;
    if (_exp) payload.expediente   = _exp;
    if (esp)              payload.respuesta   = esp;
    if (em)               payload.medio       = em;
    if (ea !== undefined) payload.asignado    = ea;
    if (eci)              payload.cierre      = eci;
    payload.contacto1 = document.getElementById('edit-contacto1')?.value || '';

    // Super: recoge estado del select
    payload.estado = document.getElementById('edit-estado')?.value || '';
  } else {
    // Asignado: el estado se deduce automáticamente de la bitácora
    // No lee el select (que está oculto para el asignado)
    const bitacoraNueva = (document.getElementById('edit-bitacora')?.value || '').trim();
    if (bitacoraNueva) {
      payload.estado = 'EN PROYECCIÓN';
    }
    // Si no hay bitácora, no cambiamos el estado (queda el actual)
  }

  payload.categoria    = document.getElementById('edit-categoria')?.value    || '';
  payload.subcategoria = document.getElementById('edit-subcategoria')?.value || '';
  payload.asistente    = document.getElementById('edit-asistente')?.value    || '';
  payload.contacto2    = document.getElementById('edit-contacto2')?.value    || '';
  payload.coordinador  = document.getElementById('edit-coordinador')?.value  || '';
  payload.contacto3    = document.getElementById('edit-contacto3')?.value    || '';
    payload.bitacora     = (document.getElementById('edit-bitacora')?.value || '').trim() || '';
  payload.etapa        = document.getElementById('edit-etapa')?.value        || '';

  // Archivos de respuesta: solo permitidos si estado es EN PROYECCIÓN o super
  const estadoActual = String(row.estado || '').toUpperCase();
  const puedeSubirRespuesta = esSuper || estadoActual === 'EN PROYECCIÓN' || payload.estado === 'EN PROYECCIÓN';

  const fileFields = [
    { id:'edit-recibido1',  key:'recibido1',  permitido: esSuper },
    { id:'edit-recibido2',  key:'recibido2',  permitido: esSuper },
    { id:'edit-recibido3',  key:'recibido3',  permitido: esSuper },
    { id:'edit-respuesta1', key:'respuesta1', permitido: puedeSubirRespuesta },
    { id:'edit-respuesta2', key:'respuesta2', permitido: puedeSubirRespuesta },
    { id:'edit-respuesta3', key:'respuesta3', permitido: puedeSubirRespuesta },
    { id:'edit-evidencia',  key:'evidencia',  permitido: true }
  ];
  for (const { id, key, permitido } of fileFields) {
    if (!permitido) continue;
    const f = document.getElementById(id)?.files?.[0];
    if (f) payload[key] = { filename: f.name, base64: await fileToBase64_(f) };
  }

  // Resumen
  const resumenFields = {};
  if (payload.recibido)    resumenFields['Recibido']    = payload.recibido;
  if (payload.consecutivo) resumenFields['Consecutivo'] = payload.consecutivo;
  if (payload.descripcion) resumenFields['Asunto']      = payload.descripcion;
  if (payload.peticionario) resumenFields['Peticionario']    = payload.peticionario;
  if (payload.expediente)   resumenFields['N° EXP. INTERNO'] = payload.expediente;
  if (payload.respuesta)   resumenFields['Respuesta']   = payload.respuesta;
  if (payload.medio)       resumenFields['Medio']       = payload.medio;
  if (payload.categoria)   resumenFields['Categoría']   = payload.categoria;
  if (payload.subcategoria)resumenFields['Subcategoría']= payload.subcategoria;
  if (payload.etapa)       resumenFields['Etapa']       = payload.etapa;
  if (payload.estado)      resumenFields['Estado']      = payload.estado;
  if (payload.bitacora)    resumenFields['Bitácora']    = payload.bitacora.substring(0,60) + (payload.bitacora.length>60?'…':'');
  if (payload.cierre)      resumenFields['Cierre']      = payload.cierre;
  const filesCount = fileFields.filter(f => payload[f.key]).length;
  if (filesCount) resumenFields['Archivos'] = filesCount + ' archivo(s)';

  const ok = await Swal.fire({
    icon:'info', title:'Confirmar Edición',
    html: buildResumenHtml_(resumenFields),
    showCancelButton:true, confirmButtonText:'Guardar', cancelButtonText:'Seguir editando'
  });
  if (!ok.isConfirmed) return;

  try {
    await apiPost('editarProceso', payload);
    playSoundOnce(SOUNDS.success);
    await Swal.fire({ icon:'success', title:'EDICIÓN EXITOSA', html:'Sigue cada día tu asignación', timer:2000, showConfirmButton:false });
    await abrirVistaAsignaciones_();
  } catch (e) {
    Swal.fire({ icon:'error', title:'Error', text: String(e.message || e) });
  }
});
     
/* ── Utilidad: resumen HTML dinámico ────────────────────── */
function buildResumenHtml_(fields) {
  let html = '<div style="text-align:left;font-size:.9rem;">';
  for (const [label, value] of Object.entries(fields)) {
    if (!value && value !== 0) continue;
    html += `<div class="proc-resumen-item"><b>${escapeHtml_(label)}:</b><span>${escapeHtml_(String(value))}</span></div>`;
  }
  html += '</div>';
  return html;
}

/* ── Integrar en el login handler (pegar después del login existente) ── */
// En la función de login, después de setear currentUser, agregar:
// updateSemaforoBtn_();
// Reemplazamos con un patch que detecta cambio en currentUser
const __origLoginBtn = document.getElementById('btn-login');
if (__origLoginBtn && !__origLoginBtn.dataset.semaforoPatch) {
  __origLoginBtn.dataset.semaforoPatch = '1';
  __origLoginBtn.addEventListener('click', () => {
    // Aplazar para que el login original termine
    setTimeout(updateSemaforoBtn_, 600);
  });
}

// En logout
const __origLogoutBtn = document.getElementById('btn-logout');
if (__origLogoutBtn && !__origLogoutBtn.dataset.semaforoPatch) {
  __origLogoutBtn.dataset.semaforoPatch = '1';
  __origLogoutBtn.addEventListener('click', () => {
    try {
      const b = document.getElementById('btn-semaforo');
      if (b) b.style.display = 'none';
    } catch (_) {}
  });
}

  /* ============================================================
   PARCHES DE MEJORA — aplicar al final del <script>
   ============================================================ */

/* ── 1. LIGHTBOX ─────────────────────────────────────────── */
(function initLightbox_() {
  const lb    = document.getElementById('proc-lightbox');
  const lbImg = document.getElementById('proc-lightbox-img');
  const lbClose = document.getElementById('proc-lightbox-close');
  if (!lb || !lbImg) return;

  window.openLightbox_ = function(src) {
    lbImg.src = src;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  window.closeLightbox_ = function() {
    lb.classList.remove('open');
    lbImg.src = '';
    document.body.style.overflow = '';
  };

  lb.addEventListener('click', closeLightbox_);
  lbClose.addEventListener('click', (e) => { e.stopPropagation(); closeLightbox_(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox_(); });
})();

/* ── 2. PREVIEW EVIDENCIA en EDITAR ─────────────────────── */
(function patchEditEvidencia_() {
  const inp     = document.getElementById('edit-evidencia');
  const preview = document.getElementById('edit-evidencia-preview');
  const preImg  = document.getElementById('edit-evidencia-preview-img');
  if (!inp || !preview || !preImg) return;

  // Reemplazamos el listener existente con uno nuevo
  const newInp = inp.cloneNode(true);
  inp.parentNode.replaceChild(newInp, inp);

  newInp.addEventListener('change', () => {
    const f  = newInp.files?.[0];
    const st = document.getElementById('edit-evidencia-status');
    preview.style.display = 'none';
    preImg.src = '';
    if (!f) { if (st) st.textContent = ''; return; }
    if (f.size > 5 * 1024 * 1024) {
      newInp.value = '';
      if (st) st.textContent = '';
      Swal.fire({ icon: 'warning', title: 'Imagen muy pesada', text: 'Máximo 5 MB.' });
      return;
    }
    if (st) st.textContent = `✓ ${f.name}`;
    const reader = new FileReader();
    reader.onload = (e) => {
      preImg.src = e.target.result;
      preview.style.display = '';
    };
    reader.readAsDataURL(f);
  });
})();

/* ── 3. HELPER: formatear fecha creación ────────────────── */
function formatCreacionLarga_(str) {
  // "10/04/2026 15:30:00" → "10/04/2026 — Viernes, 10 de abril de 2026"
  const parte = String(str || '').trim().split(' ')[0]; // solo la parte dd/mm/yyyy
  const m = parte.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return str || '';
  const dd = parseInt(m[1], 10), mm2 = parseInt(m[2], 10) - 1, yy = parseInt(m[3], 10);
  const dt = new Date(yy, mm2, dd);
  if (isNaN(dt.getTime())) return str || '';
  const dias  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const meses = ['enero','febrero','marzo','abril','mayo','junio',
                 'julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return `${parte} — ${dias[dt.getDay()]}, ${dd} de ${meses[mm2]} de ${yy}`;
}

/* ── 4. REEMPLAZAR renderProcList_ (iconos solo imagen) ─── */
renderProcList_ = function(items) {
  const wrap    = document.getElementById('proc-list');
  const countEl = document.getElementById('proc-count');
  if (!wrap) return;
  wrap.innerHTML = '';
  if (countEl) countEl.textContent = String(items.length);

  if (!items.length) {
    wrap.innerHTML = '<p class="muted center" style="grid-column:1/-1;">No hay asignaciones.</p>';
    return;
  }

  for (const row of items) {
    const sem       = calcSemaforo_(row);
    const catIcon   = getCatIcon_(row.categoria);
    const subcatIcon= getSubcatIcon_(row.subcategoria);
    const etapa     = row.etapa || '';

    const card = document.createElement('div');
    card.className = `proc-card ${sem.cardClass}`;

    // HEAD
    const head = document.createElement('div');
    head.className = 'proc-head';

    const headLeft = document.createElement('div');
    headLeft.className = 'proc-head-left';
    headLeft.innerHTML = `
      <p class="proc-asignado">${escapeHtml_(row.asignado || '')}</p>
      ${row.asistente ? `<p class="proc-asistente">${escapeHtml_(row.asistente)}</p>` : ''}
    `;

    const headRight = document.createElement('div');
    headRight.className = 'proc-head-right';
    headRight.innerHTML = `
      <div class="proc-estado-badge ${sem.clase}">
        ${escapeHtml_(row.estado || '')}
        <span class="proc-dias-txt">${sem.texto}</span>
      </div>
    `;

    head.appendChild(headLeft);
    head.appendChild(headRight);
    card.appendChild(head);

    // Descripción (con truncado a 3 líneas y pastilla "…" press-and-hold)
    const desc = document.createElement('div');
    desc.className = 'proc-descripcion';
    desc.innerHTML = `
      <img src="${ICONO_CHINCHETA}" alt="📌" />
      <div class="proc-desc-wrap">
        <span class="proc-desc-text">${escapeHtml_(row.descripcion || '')}</span>
        <button type="button" class="proc-desc-pill"
          aria-label="Mantén presionado para ver completo"
          title="Mantén presionado para ver el asunto completo">
          <span class="proc-desc-pill-dots">•••</span>
        </button>
      </div>
    `;
    card.appendChild(desc);

    // Press-and-hold para expandir el asunto
    const __descText = desc.querySelector('.proc-desc-text');
    const __descPill = desc.querySelector('.proc-desc-pill');
    if (__descText && __descPill) {
      // Ocultar la pastilla si el texto NO necesita truncado
      requestAnimationFrame(() => {
        if (__descText.scrollHeight <= __descText.clientHeight + 1) {
          __descPill.style.display = 'none';
        }
      });

      const __expand = (e) => {
        if (e) e.preventDefault();
        __descText.classList.add('expanded');
      };
      const __collapse = () => {
        __descText.classList.remove('expanded');
      };

      // Desktop
      __descPill.addEventListener('mousedown',  __expand);
      __descPill.addEventListener('mouseup',    __collapse);
      __descPill.addEventListener('mouseleave', __collapse);
      // Móvil
      __descPill.addEventListener('touchstart', __expand, { passive: false });
      __descPill.addEventListener('touchend',   __collapse);
      __descPill.addEventListener('touchcancel',__collapse);
      // Seguridad: si sueltas fuera
      __descPill.addEventListener('blur',       __collapse);
    }

        // Fila iconos categoría (CON COLOR)
    const catRow = document.createElement('div');
    catRow.className = 'cat-row';

    if (row.categoria && catIcon) {
      const cColor = getCatColor_(row.categoria);
      const pill   = document.createElement('div');
      pill.className = 'cat-pill-colored';
      pill.title     = row.categoria;
      pill.style.borderColor = cColor ? cColor.border : '#aaa';
      pill.style.background  = cColor ? cColor.bg     : '#f9f9f9';
      pill.style.color       = cColor ? cColor.border : '#333';
      pill.innerHTML = `<img src="${catIcon}" alt="${escapeHtml_(row.categoria)}" /><span>${escapeHtml_(row.categoria)}</span>`;
      catRow.appendChild(pill);
    }
    if (row.subcategoria && subcatIcon) {
      const sColor = getSubcatColor_(row.subcategoria);
      const pill   = document.createElement('div');
      pill.className = 'cat-pill-colored';
      pill.title     = row.subcategoria;
      pill.style.borderColor = sColor ? sColor.border : '#aaa';
      pill.style.background  = sColor ? sColor.bg     : '#f9f9f9';
      pill.style.color       = sColor ? sColor.border : '#333';
      pill.style.opacity     = '0.88';
      pill.innerHTML = `<img src="${subcatIcon}" alt="${escapeHtml_(row.subcategoria)}" /><span>${escapeHtml_(row.subcategoria)}</span>`;
      catRow.appendChild(pill);
    }
    if (etapa) {
      const etapaPill = document.createElement('div');
      etapaPill.className = 'etapa-badge-mini';
      etapaPill.title = 'Etapa Jurídica: ' + etapa;
      etapaPill.innerHTML = `<img src="${ICONO_JURIDICO}" alt="⚖️" /><span>${escapeHtml_(etapa)}</span>`;
      catRow.appendChild(etapaPill);
    }
    card.appendChild(catRow);

    // Acciones
    const actions = document.createElement('div');
    actions.className = 'proc-actions';

        const consWrap = document.createElement('div');
    consWrap.style.cssText = 'display:flex;flex-direction:column;gap:2px;';

    if (row.consecutivo) {
      const el = document.createElement('span');
      el.style.cssText = 'font-size:.64rem;font-weight:700;color:var(--text-sub);';
      el.textContent = 'Consecutivo: ' + row.consecutivo;
      consWrap.appendChild(el);
    }
    if (row.peticionario) {
      const el = document.createElement('span');
      el.style.cssText = 'font-size:.64rem;font-weight:600;color:var(--text-sub);';
      el.textContent = 'Peticionario: ' + row.peticionario;
      consWrap.appendChild(el);
    }
    if (row.expediente) {
      const el = document.createElement('span');
      el.style.cssText = 'font-size:.64rem;font-weight:700;color:var(--primary);';
      el.textContent = 'N° Exp. Interno: ' + row.expediente;
      consWrap.appendChild(el);
    }

   if (row.coordinador) {
  const el = document.createElement('span');
  el.style.cssText = 'font-size:.64rem;font-weight:500;color:var(--text-muted);font-style:italic;';
  el.textContent = 'Asignado por: ' + row.coordinador;
  consWrap.appendChild(el);
}
    
    actions.appendChild(consWrap);

    const icons = document.createElement('div');
    icons.className = 'proc-icons';

if (currentUser?.isSuper && String(row.estado || '').toUpperCase() !== 'FINALIZADO') {
      const btnFirma = _mkProcIconBtn_(ICONO_FIRMA, 'Decisión');
      btnFirma.addEventListener('click', () => {
        currentProcesoSelected = row;
        abrirDecision_(row);
      });
      icons.appendChild(btnFirma);

      const btnElim = _mkProcIconBtn_(ICONO_ELIMINAR, 'Eliminar asignación');
      btnElim.addEventListener('click', async () => {
        const ok = await Swal.fire({ icon:'warning', title:'¿Eliminar asignación?', html:`<b>${escapeHtml_(row.descripcion || row.id_proceso)}</b><br>Esta acción es irreversible.`, showCancelButton:true, confirmButtonText:'Eliminar', cancelButtonText:'Cancelar' });
        if (!ok.isConfirmed) return;
        await apiPost('eliminarProceso', { id_proceso: row.id_proceso });
        playSoundOnce(SOUNDS.success);
        await loadAndRenderProcesos_();
      });
      icons.appendChild(btnElim);
    }

    const btnVer = _mkProcIconBtn_(ICONO_VER, 'Ver detalles');
    btnVer.addEventListener('click', () => { playSoundOnce(SOUNDS.menu); currentProcesoSelected = row; abrirVerAsignacion_(row); });
    icons.appendChild(btnVer);

    const estadoUpper   = String(row.estado || '').toUpperCase();
const miNombre      = normalizeText_(currentUser?.nombre || '');
const esSuperUser   = !!currentUser?.isSuper;
const esCoordRow    = miNombre === normalizeText_(row.coordinador || '');
const esAsignadoRow = miNombre === normalizeText_(row.asignado || '') ||
                      miNombre === normalizeText_(row.asistente || '');
const puedeEditar   = esSuperUser ||
                      esCoordRow ||
                      (esAsignadoRow && estadoUpper !== 'FINALIZADO');
if (puedeEditar) {
  const btnEdit = _mkProcIconBtn_(ICONO_EDITAR, 'Editar asignación');
  btnEdit.addEventListener('click', () => { playSoundOnce(SOUNDS.menu); currentProcesoSelected = row; abrirEditarAsignacion_(row); });
  icons.appendChild(btnEdit);
}

    actions.appendChild(icons);
    card.appendChild(actions);
    wrap.appendChild(card);
  }
};

/* ── 5. REEMPLAZAR abrirVerAsignacion_ ──────────────────── */
abrirVerAsignacion_ = function(row) {
  const sem        = calcSemaforo_(row);
  const catIcon    = getCatIcon_(row.categoria);
  const subcatIcon = getSubcatIcon_(row.subcategoria);

  // Header: solo iconos + estado
   // Header: pills con color + estado
  const header = document.getElementById('proc-ver-header');
  header.innerHTML = '';

  if (row.categoria && catIcon) {
    const cColor = getCatColor_(row.categoria);
    const pill   = document.createElement('div');
    pill.className = 'cat-pill-colored';
    pill.title     = row.categoria;
    pill.style.borderColor = cColor ? cColor.border : '#aaa';
    pill.style.background  = cColor ? cColor.bg     : '#f9f9f9';
    pill.style.color       = cColor ? cColor.border : '#333';
    pill.innerHTML = `<img src="${catIcon}" alt="${escapeHtml_(row.categoria)}" /><span>${escapeHtml_(row.categoria)}</span>`;
    header.appendChild(pill);
  }
  if (row.subcategoria && subcatIcon) {
    const sColor = getSubcatColor_(row.subcategoria);
    const pill   = document.createElement('div');
    pill.className = 'cat-pill-colored';
    pill.title     = row.subcategoria;
    pill.style.borderColor = sColor ? sColor.border : '#aaa';
    pill.style.background  = sColor ? sColor.bg     : '#f9f9f9';
    pill.style.color       = sColor ? sColor.border : '#333';
    pill.style.opacity     = '0.88';
    pill.innerHTML = `<img src="${subcatIcon}" alt="${escapeHtml_(row.subcategoria)}" /><span>${escapeHtml_(row.subcategoria)}</span>`;
    header.appendChild(pill);
  }
  if (row.etapa) {
    const etapaPill = document.createElement('div');
    etapaPill.className = 'etapa-badge-mini';
    etapaPill.title = 'Etapa Jurídica: ' + row.etapa;
    etapaPill.innerHTML = `<img src="${ICONO_JURIDICO}" alt="⚖️" /><span>${escapeHtml_(row.etapa)}</span>`;
    header.appendChild(etapaPill);
  }
   const estadoBadge = document.createElement('div');
  estadoBadge.className = `proc-estado-badge ${sem.clase}`;
  estadoBadge.style.minWidth = '140px';
  estadoBadge.innerHTML = `${escapeHtml_(row.estado || '')}<span class="proc-dias-txt">${sem.texto}</span>`;
  header.appendChild(estadoBadge);

  // Cuerpo — SIN "Creada" aquí
  const body = document.getElementById('proc-ver-body');
  body.innerHTML = '';
    const addField = (label, value, esHTML) => {
    if (!value) return;
    const div = document.createElement('div');
    div.className = 'proc-detalle-field';
    const rendered = esHTML ? value : escapeHtml_(value).replace(/\n/g, '<br>');
    div.innerHTML = `<span class="proc-detalle-label">${label}</span>
      <span class="proc-detalle-value" style="white-space:pre-line;">${rendered}</span>`;
    body.appendChild(div);
  };
  addField('Asunto:',             row.descripcion);
  addField('Peticionario:',       row.peticionario);
  addField('N° Exp. Interno:',   row.expediente);
  addField('Consecutivo:',        row.consecutivo);
  addField('Fecha de Recibido:',  formatFechaLarga_(row.recibido));
  addField('Medio:',              row.medio);
  addField('Fecha de Respuesta:', formatFechaLarga_(row.respuesta));
  addField('Bitácora:',           row.bitacora);
  addField('Fecha de Cierre:',    formatFechaLarga_(row.cierre));
  addField('Asignado:',           row.asignado);
  addField('Asistente:',          row.asistente);

  // Creación con formato largo (posición correcta, debajo de campos)
  const creacionEl = document.getElementById('proc-ver-creacion');
if (creacionEl) {
  creacionEl.className = 'proc-creacion-field';
  let html = '';
  if (row.creacion) {
    html += `<span>Creada:</span> ${escapeHtml_(formatCreacionLarga_(row.creacion))}`;
  }
  if (row.coordinador) {
    if (html) html += '<br>';
    html += `<span>Asignado por:</span> ${escapeHtml_(row.coordinador)}`;
  }
  creacionEl.innerHTML = html;
}

  // Evidencia — con zoom al hacer clic
  const evWrap = document.getElementById('proc-ver-evidencia');
  const evImg  = document.getElementById('proc-ver-evidencia-img');
  if (row.evidencia) {
    // Forzar la URL de visualización directa desde Drive
    let evUrl = String(row.evidencia).trim();
    // Si es enlace de Drive, convertir a thumbnail/preview
    const driveMatch = evUrl.match(/\/d\/([A-Za-z0-9_-]{10,})\//);
    if (driveMatch) {
      evUrl = `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
    }
    evImg.src = evUrl;
    evImg.style.cursor = 'zoom-in';
    // Reemplazar listener previo
    const newEvImg = evImg.cloneNode(true);
    evImg.parentNode.replaceChild(newEvImg, evImg);
    newEvImg.addEventListener('click', () => {
      if (typeof openLightbox_ === 'function') openLightbox_(evUrl);
    });
    evWrap.style.display = '';
  } else {
    evWrap.style.display = 'none';
  }

  // Archivos recibidos / respuestas
  const filesWrap = document.getElementById('proc-ver-files');
  filesWrap.innerHTML = '';
  const addFileIcon_ = (urls, srcIcon, label) => {
    const validUrls = urls.filter(Boolean);
    if (!validUrls.length) return;
    validUrls.forEach((url, idx) => {
      if (!url) return;
      const item = document.createElement('div');
      item.className = 'proc-file-item';
      item.title = `${label} ${idx + 1}`;
      item.innerHTML = `
        <img src="${srcIcon}" alt="${label}" />
        ${validUrls.length > 1 ? `<span class="proc-file-counter">${idx + 1}</span>` : ''}
        <span class="proc-file-label">${label} ${idx + 1}</span>`;
      item.addEventListener('click', () => window.open(url, '_blank', 'noopener'));
      filesWrap.appendChild(item);
    });
  };
  addFileIcon_([row.recibido1, row.recibido2, row.recibido3],     ICONO_INBOX,  'Recibido');
  addFileIcon_([row.respuesta1, row.respuesta2, row.respuesta3],  ICONO_OUTBOX, 'Respuesta');

   // Botones acción
  const actionsWrap = document.getElementById('proc-ver-actions');
  actionsWrap.innerHTML = '';
  const estado = String(row.estado || '').toUpperCase();

  // ── REBOTAR (solo cuando ASIGNADO) ───────────────────────
  if (estado === 'ASIGNADO') {
    const btnRebotar = document.createElement('button');
    btnRebotar.type = 'button';
    btnRebotar.className = 'proc-action-btn proc-btn-rebotar';
    btnRebotar.innerHTML = `<img src="${ICONO_REBOTAR}" alt="Rebotar" /> REBOTAR`;
    btnRebotar.addEventListener('click', () => {
      document.getElementById('proc-rebote').value = '';
      document.getElementById('modal-rebotar').classList.remove('hidden');
    });
    actionsWrap.appendChild(btnRebotar);
  }

  // ── EDITAR (asignado NO puede editar si FINALIZADO) ───────
  const miNombre      = normalizeText_(currentUser?.nombre || '');
const esCoordRow    = miNombre === normalizeText_(row.coordinador || '');
const esAsignadoRow = miNombre === normalizeText_(row.asignado || '') ||
                      miNombre === normalizeText_(row.asistente || '');
const puedeEditar = currentUser?.isSuper ||
                    esCoordRow ||
                    (esAsignadoRow && estado !== 'FINALIZADO');
if (puedeEditar) {
  const btnEditar = document.createElement('button');
    btnEditar.type = 'button';
    btnEditar.className = 'btn-primary proc-action-btn';
    btnEditar.style.width = 'auto';
    btnEditar.innerHTML = `<img src="${ICONO_EDITAR}" style="width:20px;height:20px;vertical-align:middle;" alt="Editar" /> EDITAR`;
    btnEditar.addEventListener('click', () => { playSoundOnce(SOUNDS.menu); abrirEditarAsignacion_(row); });
    actionsWrap.appendChild(btnEditar);
  }

  // ── SOLICITAR PROCESO (asignado, cuando EN PROYECCIÓN) ────
  if (!currentUser?.isSuper && (estado === 'EN PROYECCIÓN' || estado === 'PENDIENTE EVIDENCIA')) {
    const btnSP = document.createElement('button');
    btnSP.type = 'button';
    btnSP.className = 'proc-action-btn';
    btnSP.style.cssText = 'background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff;border:0;width:auto;';
    btnSP.innerHTML = `<img src="${ICONO_MEMORIA}" style="width:28px;height:28px;" alt="Solicitar" /> SOLICITAR PROCESO`;
    btnSP.addEventListener('click', () => abrirSolicitarProceso_(row));
    actionsWrap.appendChild(btnSP);
  }

    // ── DECISIÓN (solo super usuario, no visible si FINALIZADO) ──
  if (currentUser?.isSuper && estado !== 'FINALIZADO') {
    const btnDec = document.createElement('button');
    btnDec.type = 'button';
    btnDec.className = 'proc-action-btn';
    btnDec.style.cssText = 'background:linear-gradient(135deg,#0a7a46,#06402B);color:#fff;border:0;width:auto;';
    btnDec.innerHTML = `<img src="${ICONO_FIRMA}" style="width:22px;height:22px;" alt="Decisión" /> DECISIÓN`;
    btnDec.addEventListener('click', () => abrirDecision_(row));
    actionsWrap.appendChild(btnDec);
  }

  showView('view-ver-asignacion');
};

/* ── 6. PATCH abrirEditarAsignacion_: indicar archivos ya cargados ── */
const __origAbrirEditar = abrirEditarAsignacion_;
abrirEditarAsignacion_ = function(row) {
  __origAbrirEditar(row);

  // Mapeo: id del input → URL ya guardada en row
  const fileMap = [
    { inputId: 'edit-recibido1',  url: row.recibido1  || '', label: 'Recibido 1'  },
    { inputId: 'edit-recibido2',  url: row.recibido2  || '', label: 'Recibido 2'  },
    { inputId: 'edit-recibido3',  url: row.recibido3  || '', label: 'Recibido 3'  },
    { inputId: 'edit-respuesta1', url: row.respuesta1 || '', label: 'Respuesta 1' },
    { inputId: 'edit-respuesta2', url: row.respuesta2 || '', label: 'Respuesta 2' },
    { inputId: 'edit-respuesta3', url: row.respuesta3 || '', label: 'Respuesta 3' },
    { inputId: 'edit-evidencia',  url: row.evidencia  || '', label: 'Evidencia'   }
  ];

  fileMap.forEach(({ inputId, url, label }) => {
    const inp = document.getElementById(inputId);
    if (!inp) return;

    // Eliminar badge anterior si existía
    const prevBadge = document.getElementById(inputId + '-loaded');
    if (prevBadge) prevBadge.remove();

    if (!url) return;

    const badge = document.createElement('a');
    badge.id        = inputId + '-loaded';
    badge.href      = url;
    badge.target    = '_blank';
    badge.rel       = 'noopener';
    badge.className = 'file-already-loaded';
    badge.innerHTML = `<img src="${ICONO_INBOX}" alt="Cargado" />${label}: archivo ya cargado — clic para ver`;
    inp.parentNode.insertBefore(badge, inp.nextSibling);
  });

  // Preview evidencia si ya tiene imagen
  const evPreview = document.getElementById('edit-evidencia-preview');
  const evPreImg  = document.getElementById('edit-evidencia-preview-img');
  if (evPreview && evPreImg) {
    const evUrl = row.evidencia || '';
    if (evUrl) {
      let thumb = evUrl;
      const dm = evUrl.match(/\/d\/([A-Za-z0-9_-]{10,})\//);
      if (dm) thumb = `https://lh3.googleusercontent.com/d/${dm[1]}`;
      evPreImg.src = thumb;
      evPreview.style.display = '';
    } else {
      evPreview.style.display = 'none';
      evPreImg.src = '';
    }
  }
};

     /* ── SOLICITAR PROCESO (asignado → coordinador) ─────────── */
let __spTipoSeleccionado = null; // 'revision' | 'finalizacion'
let __spRowActual        = null;

function abrirSolicitarProceso_(row) {
  __spRowActual = row;
  // Primer Swal: elegir tipo
  Swal.fire({
    icon: 'question',
    title: 'SOLICITAR PROCESO',
    html: '¿Qué tipo de solicitud deseas enviar?',
    showCancelButton: true,
    showDenyButton:   true,
    confirmButtonText: 'Revisión / Firma',
    denyButtonText:    'Finalización',
    cancelButtonText:  'Cancelar'
  }).then(result => {
    if (result.isConfirmed) {
      __spTipoSeleccionado = 'Revisión / Firma';
      document.getElementById('modal-sp-titulo').textContent = '¿Deseas complementar la solicitud?';
      document.getElementById('modal-sp-solicitud').value = '';
      document.getElementById('modal-solicitar-proceso').classList.remove('hidden');
    } else if (result.isDenied) {
      __spTipoSeleccionado = 'Finalización';
      document.getElementById('modal-sp-titulo').textContent = '¿Deseas complementar la solicitud?';
      document.getElementById('modal-sp-solicitud').value = '';
      document.getElementById('modal-solicitar-proceso').classList.remove('hidden');
    }
  });
}

document.getElementById('btn-sp-cancelar')?.addEventListener('click', () => {
  playSoundOnce(SOUNDS.back);
  document.getElementById('modal-solicitar-proceso').classList.add('hidden');
  __spTipoSeleccionado = null;
  __spRowActual = null;
});

document.getElementById('btn-sp-guardar')?.addEventListener('click', async () => {
  if (!__spRowActual || !__spTipoSeleccionado) return;
  const row      = __spRowActual;
  const solicitud = String(document.getElementById('modal-sp-solicitud').value || '').trim();
  const tipo     = __spTipoSeleccionado;

  const c3 = row.contacto3 || getContacto3ByCoordinador_(row.coordinador);
  const msg =
    `Estimado *${row.coordinador || ''}*\n\n` +
    `Solicito la *${tipo}* de mi asignación *${row.descripcion || ''}*\n\n` +
    (solicitud ? solicitud + '\n\n' : '\n') +
    `Cordialmente,\n\n*${row.asignado || ''}*`;

  sendProcWA_(c3, msg);
  document.getElementById('modal-solicitar-proceso').classList.add('hidden');
  __spTipoSeleccionado = null;
  __spRowActual = null;

  playSoundOnce(SOUNDS.success);
  await Swal.fire({ icon: 'success', title: 'Solicitud enviada', timer: 1800, showConfirmButton: false });
});

/* ── DECISIÓN (super usuario → asignado) ────────────────── */
let __decTipoSeleccionado = null; // 'FINALIZADO' | 'PENDIENTE EVIDENCIA'
let __decRowActual        = null;

function abrirDecision_(row) {
  __decRowActual = row;
  Swal.fire({
    icon: 'info',
    title: 'DECISIÓN',
    html: '¿Cuál es la decisión para esta asignación?',
    showCancelButton: true,
    showDenyButton:   true,
    confirmButtonText: 'Finalizar',
    denyButtonText:    'Pendiente de Evidencia',
    cancelButtonText:  'Cancelar'
  }).then(result => {
    if (result.isConfirmed) {
      __decTipoSeleccionado = 'FINALIZADO';
      document.getElementById('modal-dec-titulo').textContent = '¿Deseas complementar la respuesta?';
      document.getElementById('modal-dec-solicitud').value = '';
      document.getElementById('modal-decision').classList.remove('hidden');
    } else if (result.isDenied) {
      __decTipoSeleccionado = 'PENDIENTE EVIDENCIA';
      document.getElementById('modal-dec-titulo').textContent = '¿Deseas complementar la respuesta?';
      document.getElementById('modal-dec-solicitud').value = '';
      document.getElementById('modal-decision').classList.remove('hidden');
    }
  });
}

document.getElementById('btn-dec-cancelar')?.addEventListener('click', () => {
  playSoundOnce(SOUNDS.back);
  document.getElementById('modal-decision').classList.add('hidden');
  __decTipoSeleccionado = null;
  __decRowActual = null;
});

document.getElementById('btn-dec-guardar')?.addEventListener('click', async () => {
  if (!__decRowActual || !__decTipoSeleccionado) return;
  const row      = __decRowActual;
  const solicitud = String(document.getElementById('modal-dec-solicitud').value || '').trim();
  const tipo     = __decTipoSeleccionado;

  try {
    // 1. Actualizar estado en backend
    await apiPost('editarProceso', {
      id_proceso: row.id_proceso,
      rowIndex:   row.rowIndex,
      estado:     tipo
    });

    // 2. Enviar WhatsApp al asignado (contacto1)
    const c1 = row.contacto1 || '';
    let msg = '';
    if (tipo === 'FINALIZADO') {
      msg =
        `Estimado *${row.asignado || ''}*\n` +
        `Se ha dado por finalizada la asignación *${row.descripcion || ''}*\n` +
        (solicitud ? solicitud + '\n\n' : '\n') +
        `Muchas gracias por tu valioso trabajo.\n\n` +
        `Cordialmente,\n\n*${row.coordinador || ''}*`;
    } else {
      msg =
        `Estimado *${row.asignado || ''}*\n` +
        `Por favor subir la evidencia de envío al igual que el oficio firmado de la asignación *${row.descripcion || ''}*\n` +
        (solicitud ? solicitud + '\n\n' : '\n') +
        `Quedo atento(a) a la confirmación.\n\n` +
        `Cordialmente,\n\n*${row.coordinador || ''}*`;
    }
    sendProcWA_(c1, msg);

    document.getElementById('modal-decision').classList.add('hidden');
    __decTipoSeleccionado = null;
    __decRowActual = null;

    playSoundOnce(SOUNDS.success);
    const titulo = tipo === 'FINALIZADO' ? 'ASIGNACIÓN FINALIZADA' : 'PENDIENTE DE EVIDENCIA';
    await Swal.fire({ icon:'success', title: titulo, timer:2000, showConfirmButton:false });
    await abrirVistaAsignaciones_();
  } catch (e) {
    Swal.fire({ icon:'error', title:'Error', text: String(e.message || e) });
  }
});

  /* ============================================================
   CHAT TIEMPO REAL — Firebase Realtime Database
   ============================================================ */

/* ── 1. Cargar Firebase SDK (compat para uso sin bundler) ── */
(function loadFirebaseSDK_() {
  const scripts = [
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js'
  ];
  scripts.forEach(src => {
    if (document.querySelector(`script[src="${src}"]`)) return;
    const s = document.createElement('script');
    s.src = src; s.defer = true;
    document.head.appendChild(s);
  });
})();

/* ── 2. Config Firebase ─────────────────────────────────── */
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyBgvBSKz-R1XDW5xUdxKyfcrmoQyJ2l5gs",
  authDomain:        "semaforo-hacienda.firebaseapp.com",
  databaseURL:       "https://semaforo-hacienda-default-rtdb.firebaseio.com",
  projectId:         "semaforo-hacienda",
  storageBucket:     "semaforo-hacienda.firebasestorage.app",
  messagingSenderId: "372729856735",
  appId:             "1:372729856735:web:abddede02bcc431c07df6a"
};

/* ── 3. Estado global del chat ──────────────────────────── */
let __fbApp      = null;
let __fbDB       = null;
let __chatRef    = null;   // ref a mensajes del proceso activo
let __typingRef  = null;   // ref a indicadores de escritura
let __chatProcId = null;   // id_proceso activo en el chat
let __chatProc   = null;   // objeto proceso completo
let __chatUnsubMsg    = null; // unsubscribe mensajes
let __chatUnsubTyping = null; // unsubscribe typing
let __typingTimer     = null; // debounce escritura
let __chatOpen        = false;
let __lastMsgCount    = 0;
let __chatToastTimer  = null;
let __lastDateShown   = '';

/* ── 4. Inicializar Firebase (lazy, cuando se abre el chat) ─*/
function initFirebase_() {
  return new Promise((resolve) => {
    if (__fbDB) { resolve(__fbDB); return; }

    const waitForSDK = () => {
      if (typeof firebase === 'undefined' || !firebase.app) {
        setTimeout(waitForSDK, 80);
        return;
      }
      try {
        __fbApp = firebase.apps.length
          ? firebase.app()
          : firebase.initializeApp(FIREBASE_CONFIG);
        __fbDB = firebase.database(__fbApp);
        resolve(__fbDB);
      } catch (e) {
        console.error('Firebase init error:', e);
        resolve(null);
      }
    };
    waitForSDK();
  });
}

/* ── 5. Utilidades de tiempo ────────────────────────────── */
function tsRelativo_(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  if (diff < 60000)  return 'ahora';
  if (diff < 3600000) return Math.floor(diff / 60000) + ' min';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h';
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
}

function fechaCorta_(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const hoy = new Date();
  if (d.toDateString() === hoy.toDateString()) return 'HOY';
  const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1);
  if (d.toDateString() === ayer.toDateString()) return 'AYER';
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function horaHHMM_(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

/* ── 6. Render de un mensaje ────────────────────────────── */
function renderChatMsg_(key, data, container) {
  const esMio = normalizeText_(data.autor || '') ===
                normalizeText_(currentUser?.nombre || '');

  // Separador de fecha
  const fechaStr = fechaCorta_(data.ts);
  if (fechaStr !== __lastDateShown) {
    __lastDateShown = fechaStr;
    const sep = document.createElement('div');
    sep.className = 'chat-date-sep';
    sep.textContent = '── ' + fechaStr + ' ──';
    sep.dataset.msgKey = key + '_sep';
    container.appendChild(sep);
  }

  const wrap = document.createElement('div');
  wrap.className = 'chat-msg ' + (esMio ? 'mine' : 'other');
  wrap.dataset.msgKey = key;

  const author = document.createElement('div');
  author.className = 'chat-author';
  author.textContent = esMio ? 'Tú' : (data.autor || '');

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';
  // Preservar saltos de línea
  bubble.innerHTML = escapeHtml_(data.texto || '').replace(/\n/g, '<br>');

  const meta = document.createElement('div');
  meta.className = 'chat-meta';
  meta.innerHTML = `<span>${horaHHMM_(data.ts)}</span>`;

  wrap.appendChild(author);
  wrap.appendChild(bubble);
  wrap.appendChild(meta);
  return wrap;
}

/* ── 7. Scroll al fondo ─────────────────────────────────── */
function chatScrollBottom_(force) {
  const c = document.getElementById('chat-messages');
  if (!c) return;
  const nearBottom = c.scrollHeight - c.scrollTop - c.clientHeight < 120;
  if (force || nearBottom) {
    requestAnimationFrame(() => { c.scrollTop = c.scrollHeight; });
  }
}

/* ── 8. Toast mensaje nuevo ─────────────────────────────── */
function showChatToast_(autor) {
  const t = document.getElementById('chat-toast');
  if (!t) return;
  t.textContent = '💬 ' + (autor || 'Nuevo mensaje');
  t.classList.add('show');
  clearTimeout(__chatToastTimer);
  __chatToastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}

/* ── 9. Abrir chat ──────────────────────────────────────── */
async function abrirChat_(row) {
  if (!currentUser) return;

  __chatProc  = row;
  __chatProcId = row.id_proceso;
  __lastDateShown = '';

  // Header
  document.getElementById('chat-header-title').textContent =
    (row.consecutivo || row.id_proceso) + ' — ' + (row.descripcion || '').substring(0, 40);
  document.getElementById('chat-header-sub').textContent =
    (row.asignado || '') + (row.asistente ? ' · ' + row.asistente : '');

// Limpiar mensajes anteriores
const container = document.getElementById('chat-messages');
container.innerHTML = '';
__lastDateShown = '';

// Re-crear el placeholder vacío en lugar de reutilizar el del DOM
const emptyPlaceholder = document.createElement('div');
emptyPlaceholder.id = 'chat-empty';
emptyPlaceholder.className = 'chat-empty';
emptyPlaceholder.innerHTML = `
  <img src="https://res.cloudinary.com/dqqeavica/image/upload/v1775788408/chincheta_v6mg7a.png" alt="">
  <p>Aún no hay mensajes.<br>¡Sé el primero en escribir!</p>
`;
container.appendChild(emptyPlaceholder);

  // Desuscribir listeners previos
  cerrarListeners_();

  // Abrir modal
  document.getElementById('modal-chat').classList.add('open');
  // Mostrar botón reset SOLO para OSCAR
const resetBtn = document.getElementById('btn-chat-reset');
if (resetBtn) {
  resetBtn.style.display =
    normalizeText_(currentUser?.nombre || '') === normalizeText_('OSCAR MAURICIO POLANIA GUERRA')
      ? 'flex' : 'none';
}
  
  document.body.style.overflow = 'hidden';
  __chatOpen = true;

  // Inicializar Firebase
  const db = await initFirebase_();
  if (!db) {
    Swal.fire({ icon: 'error', title: 'Error de conexión', text: 'No se pudo conectar con Firebase.' });
    cerrarChat_();
    return;
  }

  // Refs
  __chatRef   = db.ref('chats/' + __chatProcId + '/mensajes');
  __typingRef = db.ref('chats/' + __chatProcId + '/typing/' +
    encodeURIComponent(currentUser.nombre || 'usuario'));

  // Escuchar mensajes en tiempo real
  let primeraCarga = true;
__chatUnsubMsg = __chatRef.on('child_added', (snap) => {
  const data = snap.val();
  if (!data) return;

  // Ocultar placeholder — buscar por id de forma segura
  const empty = container.querySelector('#chat-empty') ||
                document.getElementById('chat-empty');
  if (empty) empty.style.display = 'none';

  const msgEl = renderChatMsg_(snap.key, data, container);
  container.appendChild(msgEl);

    if (primeraCarga) {
      chatScrollBottom_(true);
    } else {
      // Mensaje nuevo mientras ya está abierto
      const esMio = normalizeText_(data.autor || '') ===
                    normalizeText_(currentUser?.nombre || '');
      if (esMio) {
        chatScrollBottom_(true);
      } else {
        chatScrollBottom_(false);
        if (!__chatOpen) showChatToast_(data.autor);
        // Notificación si el chat está abierto pero el usuario scrolleó arriba
        const c2 = document.getElementById('chat-messages');
        const nearBottom = c2.scrollHeight - c2.scrollTop - c2.clientHeight < 120;
        if (!nearBottom) showChatToast_(data.autor);
      }
    }
  });

  // Marcar primera carga completa
  __chatRef.once('value', () => {
    primeraCarga = false;
    chatScrollBottom_(true);
  });

  // Escuchar indicadores de escritura (otros usuarios)
  const typingRootRef = db.ref('chats/' + __chatProcId + '/typing');
  __chatUnsubTyping = typingRootRef.on('value', (snap) => {
    const typing = snap.val() || {};
    const others = Object.entries(typing)
      .filter(([k, v]) => {
        const nombre = decodeURIComponent(k);
        return v === true &&
               normalizeText_(nombre) !== normalizeText_(currentUser?.nombre || '');
      })
      .map(([k]) => decodeURIComponent(k).split(' ')[0]); // solo primer nombre

    const typingEl  = document.getElementById('chat-typing');
    const typingWho = document.getElementById('chat-typing-who');
    if (others.length && typingEl) {
      typingWho.textContent = others[0];
      typingEl.classList.add('visible');
      chatScrollBottom_(false);
    } else if (typingEl) {
      typingEl.classList.remove('visible');
    }
  });

  // Input foco
  setTimeout(() => document.getElementById('chat-input')?.focus(), 180);
}

/* ── 10. Cerrar chat ────────────────────────────────────── */
function cerrarChat_() {
  document.getElementById('modal-chat').classList.remove('open');
  document.body.style.overflow = '';
  __chatOpen = false;
  // Limpiar presencia typing
  if (__typingRef) {
    __typingRef.set(false).catch(() => {});
  }
  cerrarListeners_();
}

function cerrarListeners_() {
  if (__chatRef && __chatUnsubMsg) {
    __chatRef.off('child_added', __chatUnsubMsg);
    __chatUnsubMsg = null;
  }
  if (__typingRef) {
    const typingRootRef2 = __typingRef.parent;
    if (typingRootRef2 && __chatUnsubTyping) {
      typingRootRef2.off('value', __chatUnsubTyping);
      __chatUnsubTyping = null;
    }
  }
  clearTimeout(__typingTimer);
}

/* ── 11. Enviar mensaje ─────────────────────────────────── */
async function enviarMensaje_() {
  const inp = document.getElementById('chat-input');
  if (!inp) return;
  const texto = inp.value.trim();
  if (!texto || !__chatRef) return;

  inp.value = '';
  inp.style.height = '';

  // Limpiar typing
  if (__typingRef) __typingRef.set(false).catch(() => {});
  clearTimeout(__typingTimer);

  try {
    await __chatRef.push({
      autor: currentUser?.nombre || 'Usuario',
      texto: texto,
      ts:    firebase.database.ServerValue.TIMESTAMP
    });
  } catch (e) {
    Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo enviar el mensaje.' });
  }
}

/* ── 12. Indicador de escritura (debounce 2.5s) ─────────── */
function onChatInputChange_() {
  if (!__typingRef) return;
  __typingRef.set(true).catch(() => {});
  clearTimeout(__typingTimer);
  __typingTimer = setTimeout(() => {
    __typingRef.set(false).catch(() => {});
  }, 2500);
}

/* ── 13. Auto-resize textarea ───────────────────────────── */
function chatInputAutoResize_() {
  const el = document.getElementById('chat-input');
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

/* ── 14. Badges de no leídos en botones de la lista ─────── */
let __chatBadgeListeners = {}; // id_proceso → unsubscribe

function suscribirBadgeChat_(idProceso, btnEl) {
  if (__chatBadgeListeners[idProceso]) return; // ya suscrito
  initFirebase_().then(db => {
    if (!db) return;
    const ref = db.ref('chats/' + idProceso + '/mensajes');
    const handler = ref.on('value', snap => {
      const data = snap.val() || {};
      const total = Object.keys(data).length;
      // Badge en botón chat de la tarjeta (si existe)
      const badge = btnEl?.querySelector('.chat-unread-badge');
      if (badge) badge.textContent = total > 99 ? '99+' : String(total);
    });
    __chatBadgeListeners[idProceso] = () => ref.off('value', handler);
  });
}

/* ── 15. Eventos ────────────────────────────────────────── */
document.getElementById('btn-chat-close')?.addEventListener('click', () => {
  playSoundOnce(SOUNDS.back);
  cerrarChat_();
});

// Cerrar al clic fuera del chat-box
document.getElementById('modal-chat')?.addEventListener('click', (e) => {
  if (e.target === document.getElementById('modal-chat')) cerrarChat_();
});

// Enviar con botón
document.getElementById('btn-chat-send')?.addEventListener('click', () => {
  playSoundOnce(SOUNDS.success);
  enviarMensaje_();
});

// Enviar con Enter (Shift+Enter = salto de línea)
document.getElementById('chat-input')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    playSoundOnce(SOUNDS.success);
    enviarMensaje_();
  }
});

// Typing + auto-resize
document.getElementById('chat-input')?.addEventListener('input', () => {
  onChatInputChange_();
  chatInputAutoResize_();
});

// Cerrar con Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && __chatOpen) cerrarChat_();
});

/* ── 16. PATCH abrirVerAsignacion_: agregar botón chat ──── */
const __origVerAsig2 = abrirVerAsignacion_;
abrirVerAsignacion_ = function(row) {
  __origVerAsig2(row);

  // Agregar botón chat en proc-ver-actions si no existe
  setTimeout(() => {
    const actionsWrap = document.getElementById('proc-ver-actions');
    if (!actionsWrap) return;

    // ── NUEVO: eliminar botón chat anterior (si quedó de otra asignación)
    const prevBtn = actionsWrap.querySelector('.proc-btn-chat');
    if (prevBtn) prevBtn.remove();

    // ── NUEVO: cancelar listener de badge anterior
    if (typeof __chatBadgeCurrentUnsubscribe_ === 'function') {
      __chatBadgeCurrentUnsubscribe_();
      __chatBadgeCurrentUnsubscribe_ = null;
    }

    const btnChat = document.createElement('button');
    btnChat.type = 'button';
    btnChat.className = 'proc-btn-chat proc-action-btn';
    btnChat.innerHTML = `
      <img src="https://res.cloudinary.com/dqqeavica/image/upload/v1776016986/chat_sueco4.webp"
           alt="Chat" style="width:22px;height:22px;" />
      CHAT
      <span class="chat-unread-badge" id="chat-badge-ver" style="display:none;"></span>
    `;
    btnChat.addEventListener('click', () => {
      playSoundOnce(SOUNDS.menu);
      // ── NUEVO: siempre pasa el row ACTUAL (no una referencia vieja)
      abrirChat_(row);
    });

    // Insertar como primer botón
    actionsWrap.insertBefore(btnChat, actionsWrap.firstChild);

    // ── NUEVO: Badge ligado al id_proceso del row ACTUAL
    initFirebase_().then(db => {
      if (!db) return;

      const badgeRef = db.ref('chats/' + row.id_proceso + '/mensajes');
      const badgeHandler = badgeRef.on('value', snap => {
        const badge = document.getElementById('chat-badge-ver');
        if (!badge) return;
        const n = snap.numChildren();
        if (n > 0) {
          badge.textContent = n > 99 ? '99+' : String(n);
          badge.style.display = '';
        } else {
          badge.style.display = 'none';
        }
      });

      // Guardar función para cancelar este listener al abrir otra asignación
      window.__chatBadgeCurrentUnsubscribe_ = () => {
        badgeRef.off('value', badgeHandler);
      };
    });

  }, 80);
};

  /* ── RESET CHAT (solo OSCAR MAURICIO POLANIA GUERRA) ────── */
document.getElementById('btn-chat-reset')?.addEventListener('click', async () => {
  if (!__fbDB || !__chatProcId) return;

  const ok = await Swal.fire({
    icon: 'warning',
    title: 'Resetear Chat',
    html: '¿Estás seguro? Se eliminarán <b>todos los mensajes</b> de este chat. Esta acción es irreversible.',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar todo',
    cancelButtonText: 'Cancelar'
  });
  if (!ok.isConfirmed) return;

  try {
    // Borrar todo el nodo del chat en Firebase
    await __fbDB.ref('chats/' + __chatProcId).remove();

    // Limpiar visualmente el contenedor de mensajes
    const container = document.getElementById('chat-messages');
    if (container) {
      container.innerHTML = '';
      __lastDateShown = '';

      // Re-insertar el placeholder vacío
      const emptyEl = document.createElement('div');
      emptyEl.id = 'chat-empty';
      emptyEl.className = 'chat-empty';
      emptyEl.innerHTML = `
        <img src="https://res.cloudinary.com/dqqeavica/image/upload/v1775788408/chincheta_v6mg7a.png" alt="">
        <p>Aún no hay mensajes.<br>¡Sé el primero en escribir!</p>
      `;
      container.appendChild(emptyEl);
    }

    playSoundOnce(SOUNDS.success);
    await Swal.fire({ icon: 'success', title: 'Chat reiniciado', timer: 1500, showConfirmButton: false });
  } catch (e) {
    Swal.fire({ icon: 'error', title: 'Error', text: String(e.message || e) });
  }
});

  /* ============================================================
   SOLICITUD EXPEDIENTE CON SOLMAR
   ============================================================ */

let __expedienteRowActual = null;

/* Abre el modal cargando el valor actual de columna AD (body.solicitudExpediente) */
function abrirExpedienteModal_(row) {
  __expedienteRowActual = row;

  // Historial previo
  const historial = String(row.solicitudExpediente || '').trim();
  const histEl    = document.getElementById('modal-expediente-historial');
  const vacioEl   = document.getElementById('modal-expediente-vacio');
  const nuevoEl   = document.getElementById('modal-expediente-nuevo');

  if (historial) {
    histEl.textContent  = historial;
    histEl.style.display = '';
    vacioEl.style.display = 'none';
    // Scroll al fondo del historial
    requestAnimationFrame(() => { histEl.scrollTop = histEl.scrollHeight; });
  } else {
    histEl.style.display  = 'none';
    vacioEl.style.display = '';
  }

  // Limpiar campo nuevo mensaje
  if (nuevoEl) { nuevoEl.value = ''; }

  document.getElementById('modal-expediente').classList.remove('hidden');
  setTimeout(() => nuevoEl?.focus(), 60);
}

function cerrarExpedienteModal_() {
  document.getElementById('modal-expediente').classList.add('hidden');
  __expedienteRowActual = null;
}

document.getElementById('btn-expediente-cancelar')?.addEventListener('click', () => {
  playSoundOnce(SOUNDS.back);
  cerrarExpedienteModal_();
});

document.getElementById('btn-expediente-guardar')?.addEventListener('click', async () => {
  if (!__expedienteRowActual) return;

  const row      = __expedienteRowActual;
  // Leer SOLO el campo nuevo mensaje
  const textoNew = (document.getElementById('modal-expediente-nuevo')?.value ?? '').trim();
  const esSolMar = esSolMar_();
  const prefijo  = esSolMar
    ? SOLMAR_PREFIJO
    : getPrefijo_(currentUser?.nombre || '');

  if (!textoNew) {
    Swal.fire({ icon: 'warning', title: 'Escribe algo antes de enviar' });
    return;
  }

  const historialPrevio = String(row.solicitudExpediente || '').trim();
  const lineaNueva      = prefijo + ': ' + textoNew;
  const textoFinal      = historialPrevio
    ? historialPrevio + '\n\n' + lineaNueva
    : lineaNueva;

  try {
    await apiPost('guardarExpediente', {
      id_proceso:          row.id_proceso,
      rowIndex:            row.rowIndex,
      solicitudExpediente: textoFinal
    });

    // Actualizar caché local
    row.solicitudExpediente = textoFinal;
    const cached = __procListCache.find(r => r.id_proceso === row.id_proceso);
    if (cached) cached.solicitudExpediente = textoFinal;

    // WA a SOL MAR solo si quien guarda NO es SOL MAR
    if (!esSolMar) {
      const msg =
        `Estimada *Sol Mar*\n` +
        `Tienes una solicitud de *${currentUser?.nombre || ''}*\n` +
        `*N° Exp. Interno:* ${row.expediente || row.id_proceso}\n` +
        `> Revisa la App`;
      sendProcWA_(SOLMAR_TEL, msg);
    }

    cerrarExpedienteModal_();
    playSoundOnce(SOUNDS.success);
    await Swal.fire({ icon: 'success', title: 'Guardado', timer: 1400, showConfirmButton: false });
  } catch (e) {
    Swal.fire({ icon: 'error', title: 'Error', text: String(e.message || e) });
  }
});

/* ── PATCH renderProcList_: botón expediente + chat en tarjeta ── */
const __origRenderProcListFinal = renderProcList_;
renderProcList_ = function(items) {
  __origRenderProcListFinal(items);

  const wrap = document.getElementById('proc-list');
  if (!wrap) return;

  const cards = wrap.querySelectorAll('.proc-card');
  const esSolMar = esSolMar_();

  // Cancelar listeners de badge anteriores para evitar fugas de memoria
  if (window.__chatCardBadgeUnsubs) {
    window.__chatCardBadgeUnsubs.forEach(fn => { try { fn(); } catch(_) {} });
  }
  window.__chatCardBadgeUnsubs = [];

  cards.forEach((card, idx) => {
    const row = items[idx];
    if (!row) return;

    const iconsWrap = card.querySelector('.proc-icons');
    if (!iconsWrap) return;

    // Si es SOL MAR: ocultar TODOS los botones excepto el de expediente
    if (esSolMar) {
      iconsWrap.querySelectorAll('.proc-icon-btn').forEach(b => { b.style.display = 'none'; });
    }

    // ── 1. BOTÓN EXPEDIENTE (primera posición) ───────────────
    // Evitar duplicados
    if (!iconsWrap.querySelector('.proc-btn-expediente-wrap')) {
      const btnExp = document.createElement('button');
      btnExp.type = 'button';
      btnExp.className = 'proc-icon-btn proc-btn-expediente-wrap';
      btnExp.title = 'Solicitud Expediente con SOLMAR';
      btnExp.setAttribute('aria-label', 'Solicitud Expediente');
      btnExp.innerHTML = `<img src="https://res.cloudinary.com/dqqeavica/image/upload/v1776121369/expediente_clb9ca.webp"
        alt="Expediente" style="width:24px;height:24px;object-fit:contain;" />`;
      btnExp.addEventListener('click', () => {
        playSoundOnce(SOUNDS.menu);
        abrirExpedienteModal_(row);
      });
      iconsWrap.insertBefore(btnExp, iconsWrap.firstChild);
    }

    // ── 2. BOTÓN CHAT (segunda posición, después de expediente) ─
    // SOL MAR no tiene acceso al chat en tarjetas
    if (!esSolMar && !iconsWrap.querySelector('.proc-btn-chat-card')) {

      const btnChat = document.createElement('button');
      btnChat.type = 'button';
      btnChat.className = 'proc-icon-btn proc-btn-chat-card';
      btnChat.title = 'Chat de asignación';
      btnChat.setAttribute('aria-label', 'Chat');
      btnChat.style.position = 'relative'; // necesario para el badge absoluto
      btnChat.innerHTML = `
        <img src="https://res.cloudinary.com/dqqeavica/image/upload/v1776016986/chat_sueco4.webp"
             alt="Chat" style="width:24px;height:24px;object-fit:contain;" />
        <span class="chat-unread-badge" id="chat-card-badge-${row.id_proceso}"
              style="display:none;"></span>
      `;
      btnChat.addEventListener('click', () => {
        playSoundOnce(SOUNDS.menu);
        abrirChat_(row);
      });

      // Insertar en segunda posición (después del botón expediente)
      const expBtn = iconsWrap.querySelector('.proc-btn-expediente-wrap');
      if (expBtn && expBtn.nextSibling) {
        iconsWrap.insertBefore(btnChat, expBtn.nextSibling);
      } else if (expBtn) {
        iconsWrap.appendChild(btnChat);
      } else {
        iconsWrap.insertBefore(btnChat, iconsWrap.firstChild);
      }

      // Badge en tiempo real con Firebase (independiente por tarjeta)
      initFirebase_().then(db => {
        if (!db) return;

        const badgeRef = db.ref('chats/' + row.id_proceso + '/mensajes');
        const badgeHandler = badgeRef.on('value', snap => {
          const badge = document.getElementById('chat-card-badge-' + row.id_proceso);
          if (!badge) return;
          const n = snap.numChildren();
          if (n > 0) {
            badge.textContent = n > 99 ? '99+' : String(n);
            badge.style.display = '';
          } else {
            badge.style.display = 'none';
          }
        });

        // Guardar función de limpieza
        window.__chatCardBadgeUnsubs.push(() => {
          badgeRef.off('value', badgeHandler);
        });
      });
    }
  });
};

  /* ============================================================
   PANEL DASHBOARD — Lógica
   ============================================================ */

/* ── Iconos panel ───────────────────────────────────────── */
const PANEL_ICON_BARRAS  = 'https://res.cloudinary.com/dqqeavica/image/upload/v1776287026/barras_pinzze.png';
const PANEL_ICON_USUARIOS= 'https://res.cloudinary.com/dqqeavica/image/upload/v1776287377/usuarios_dkzfqk.webp';
const PANEL_ICON_RELOJ   = 'https://res.cloudinary.com/dqqeavica/image/upload/v1776287528/reloj_mnsqmb.png';
const PANEL_ICON_TARGET  = 'https://res.cloudinary.com/dqqeavica/image/upload/v1776287585/target_rmpes0.webp';

/* ── Estado panel ───────────────────────────────────────── */
let __panelTabActual  = 'resumen';
let __panelCharts     = {};

/* ── Colores estados ─────────────────────────────────────── */
const PANEL_ESTADO_COLORS = {
  'ASIGNADO':              '#2563eb',
  'EN PROYECCIÓN':         '#7c3aed',
  'PENDIENTE EVIDENCIA':   '#f97316',
  'PENDIENTE ASIGNACION':  '#d97706',
  'FINALIZADO':            '#16a34a',
  'REBOTADO':              '#dc2626'
};

/* ── Colores categoría ──────────────────────────────────── */
const PANEL_CAT_COLORS_LIST = ['#1e40af','#15803d','#6d28d9','#c2410c'];

/* ── Destruir chart panel ───────────────────────────────── */
function panelDestroyChart_(key) {
  try {
    if (__panelCharts[key]) {
      __panelCharts[key].destroy();
      delete __panelCharts[key];
    }
  } catch(_) {}
}

/* ── Cambiar tab ─────────────────────────────────────────── */
function panelShowTab_(tab) {
  __panelTabActual = tab;
  const tabs   = ['resumen','equipo','tiempo','cats'];
  const tabIds = { resumen:'panel-tab-resumen', equipo:'panel-tab-equipo',
                   tiempo:'panel-tab-tiempo',   cats:'panel-tab-cats' };
  tabs.forEach(t => {
    const viewEl = document.getElementById('panel-view-' + t);
    const tabEl  = document.getElementById(tabIds[t]);
    if (!viewEl || !tabEl) return;
    const isActive = (t === tab);
    viewEl.style.display = isActive ? '' : 'none';
    tabEl.classList.toggle('active', isActive);
    if (isActive) {
      viewEl.classList.remove('panel-animate');
      void viewEl.offsetWidth; // reflow para reiniciar animación
      viewEl.classList.add('panel-animate');
    }
  });

  // Renderizar el tab seleccionado con los datos actuales
  if (!window.__panelData) return;
  switch(tab) {
    case 'resumen': panelRenderResumen_(__panelData); break;
    case 'equipo':  panelRenderEquipo_(__panelData);  break;
    case 'tiempo':  panelRenderTiempo_(__panelData);  break;
    case 'cats':    panelRenderCats_(__panelData);    break;
  }
}

/* ── Regresar ────────────────────────────────────────────── */
function panelGoBack_() {
  playSoundOnce(SOUNDS.back);
  // Destruir todos los charts para liberar memoria
  Object.keys(__panelCharts).forEach(k => panelDestroyChart_(k));
  showView('view-asignaciones');
}

/* ── Abrir panel ─────────────────────────────────────────── */
async function abrirPanel_() {
  if (!currentUser?.isSuper) {
    Swal.fire({ icon: 'warning', title: 'Solo SUPER USUARIO' });
    return;
  }
  playSoundOnce(SOUNDS.menu);
  showView('view-panel');
  panelShowTab_('resumen');

  try {
    // Reutilizar caché si ya está cargada
    const data = await apiGet('listProcesos', { asignado: '', esSuper: 'true' });
    const rows  = Array.isArray(data) ? data : [];
    window.__panelData = rows;

    const subtitle = document.getElementById('panel-subtitle');
    if (subtitle) {
      const ts = new Date();
      subtitle.textContent =
        `${rows.length} asignaciones · Actualizado ${String(ts.getHours()).padStart(2,'0')}:${String(ts.getMinutes()).padStart(2,'0')}`;
    }

    panelRenderResumen_(rows);
  } catch(e) {
    Swal.fire({ icon: 'error', title: 'Error al cargar datos', text: String(e.message || e) });
  }
}

/* ── Helpers estadísticas ────────────────────────────────── */
function panelCountByKey_(rows, key) {
  const map = {};
  rows.forEach(r => {
    const v = String(r[key] || '').trim().toUpperCase() || 'SIN DATO';
    map[v] = (map[v] || 0) + 1;
  });
  return map;
}

function panelSemaforoDistrib_(rows) {
  const dist = { verde: 0, naranja: 0, rojo: 0, 'rojo-claro': 0, gris: 0 };
  rows.forEach(r => {
    const sem = calcSemaforo_(r);
    const cls = sem.clase.replace('semaforo-', '');
    if (dist[cls] !== undefined) dist[cls]++;
    else dist.gris++;
  });
  return dist;
}

/* ── TAB: RESUMEN ────────────────────────────────────────── */
function panelRenderResumen_(rows) {
  const total     = rows.length;
  const pendAsig  = rows.filter(r => normalizeText_(r.estado||'') === 'PENDIENTE ASIGNACION').length;
  const asignados = rows.filter(r => normalizeText_(r.estado||'') === 'ASIGNADO').length;
  const enProy    = rows.filter(r => normalizeText_(r.estado||'') === 'EN PROYECCION').length;
  const pendEv    = rows.filter(r => normalizeText_(r.estado||'').includes('EVIDENCIA')).length;
  const finaliz   = rows.filter(r => normalizeText_(r.estado||'') === 'FINALIZADO').length;
  const activos   = total - finaliz;

  // ── KPIs ────────────────────────────────────────────────
  const kpiWrap = document.getElementById('panel-kpis-main');
  if (kpiWrap) {
    kpiWrap.innerHTML = '';
    const kpis = [
      { icon: PANEL_ICON_BARRAS,   value: total,    label: 'Total',          sub: 'asignaciones',       cls: '' },
      { icon: PANEL_ICON_TARGET,   value: activos,  label: 'Activas',        sub: 'en seguimiento',     cls: 'kpi-blue' },
      { icon: PANEL_ICON_USUARIOS, value: asignados,label: 'Asignadas',      sub: 'esperando respuesta',cls: 'kpi-blue' },
      { icon: PANEL_ICON_RELOJ,    value: enProy,   label: 'En Proyección',  sub: 'trabajando en ello', cls: 'kpi-naranja' },
      { icon: PANEL_ICON_TARGET,   value: pendEv,   label: 'Pend. Evidencia',sub: 'falta soporte',      cls: 'kpi-naranja' },
      { icon: PANEL_ICON_BARRAS,   value: finaliz,  label: 'Finalizadas',    sub: 'completadas',        cls: 'kpi-verde' }
    ];
    kpis.forEach(k => {
      const el = document.createElement('div');
      el.className = 'kpi-card ' + k.cls;
      el.innerHTML = `
        <img class="kpi-icon" src="${k.icon}" alt="${k.label}" />
        <div class="kpi-value">${k.value}</div>
        <div class="kpi-label">${k.label}</div>
        <div class="kpi-sub">${k.sub}</div>
      `;
      kpiWrap.appendChild(el);
    });
  }

  // ── Semáforo visual ──────────────────────────────────────
  const semDist = panelSemaforoDistrib_(rows);
  const semWrap = document.getElementById('panel-semaforo');
  if (semWrap) {
    semWrap.innerHTML = '';
    const semConfig = [
      { key: 'verde',      label: 'A TIEMPO',         cls: 'semaforo-verde' },
      { key: 'naranja',    label: 'MITAD DE PLAZO',   cls: 'semaforo-naranja' },
      { key: 'rojo-claro', label: '≤ 3 DÍAS',         cls: 'semaforo-rojo-claro' },
      { key: 'rojo',       label: 'VENCIDO',          cls: 'semaforo-rojo' },
      { key: 'gris',       label: 'FINALIZADO',       cls: 'semaforo-gris' }
    ];
    semConfig.forEach(s => {
      const sc = document.createElement('div');
      sc.className = 'sem-card ' + s.cls;
      sc.innerHTML = `
        <div class="sem-dot"></div>
        <div class="sem-value">${semDist[s.key] || 0}</div>
        <div class="sem-label">${s.label}</div>
      `;
      semWrap.appendChild(sc);
    });
  }

  // ── Chart estados ────────────────────────────────────────
  panelDestroyChart_('estados');
  const ctxEstados = document.getElementById('panel-chart-estados');
  if (ctxEstados) {
    const estadosMap = panelCountByKey_(rows, 'estado');
    const labels  = Object.keys(estadosMap);
    const values  = labels.map(l => estadosMap[l]);
    const colors  = labels.map(l =>
      PANEL_ESTADO_COLORS[l.toUpperCase()] ||
      Object.entries(PANEL_ESTADO_COLORS)
        .find(([k]) => normalizeText_(k) === normalizeText_(l))?.[1] ||
      '#94a3b8'
    );
    __panelCharts['estados'] = new Chart(ctxEstados, {
      type: 'bar',
      plugins: [window.ChartDataLabels || {}],
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderRadius: 10,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          datalabels: {
            color: '#fff',
            font: { weight: '900', size: 14 },
            anchor: 'center', align: 'center',
            formatter: v => v > 0 ? v : '',
            textStrokeColor: 'rgba(0,0,0,.3)',
            textStrokeWidth: 3
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#3d5248', font: { weight: '700', size: 10 },
              maxRotation: 30, minRotation: 0
            },
            grid: { display: false }
          },
          y: {
            beginAtZero: true, ticks: { precision: 0, color: '#6b7c74', font: { weight: '600' } },
            grid: { color: 'rgba(6,64,43,.07)' }
          }
        }
      }
    });
  }
}

/* ── TAB: EQUIPO ─────────────────────────────────────────── */
function panelRenderEquipo_(rows) {
  const hoy = formatDDMMYYYY_(new Date());

  // Ranking por asignado en 4 buckets
  const byAsignado = {};
  rows.forEach(r => {
    const n = (r.asignado || '').trim().toUpperCase() || 'SIN ASIGNAR';
    if (!byAsignado[n]) byAsignado[n] = { total: 0, activo: 0, porVencer: 0, vencida: 0, finaliz: 0 };
    byAsignado[n].total++;

    const estado = normalizeText_(r.estado || '');
    if (estado === 'FINALIZADO') {
      byAsignado[n].finaliz++;
    } else {
      const faltan = diasHabiles_(hoy, r.respuesta);
      if (faltan < 0)                       byAsignado[n].vencida++;    // estrictamente vencida
      else if (faltan >= 0 && faltan <= 3)  byAsignado[n].porVencer++;  // hoy y 1–3 días hábiles
      else                                  byAsignado[n].activo++;     // > 3 días
    }
  });

  const sorted = Object.entries(byAsignado)
    .sort((a,b) => b[1].total - a[1].total);

  // Ranking
  const rankWrap = document.getElementById('panel-ranking');
  if (rankWrap) {
    rankWrap.innerHTML = '';
    if (!sorted.length) {
      rankWrap.innerHTML = '<div class="panel-empty">Sin datos de equipo.</div>';
    } else {
      sorted.forEach(([nombre, stats], idx) => {
        const initials = nombre.split(' ').slice(0,2).map(w=>w[0]||'').join('');
        const posCls   = idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : '';
        const medals   = ['🥇','🥈','🥉'];
        const posSymbol= idx < 3 ? medals[idx] : (idx + 1);

        const parts = [];
        if (stats.activo > 0)    parts.push(`<span style="color:#16a34a;font-weight:800;">ACTIVO: ${stats.activo}</span>`);
        if (stats.porVencer > 0) parts.push(`<span style="color:#f97316;font-weight:800;">POR VENCER: ${stats.porVencer}</span>`);
        if (stats.vencida > 0)   parts.push(`<span style="color:#dc2626;font-weight:800;">VENCIDAS: ${stats.vencida}</span>`);
        if (stats.finaliz > 0)   parts.push(`<span style="color:#6b7280;font-weight:800;">FINALIZADAS: ${stats.finaliz}</span>`);
        const detailHtml = parts.length
          ? parts.join(' · ')
          : '<span style="color:var(--text-muted);">Sin asignaciones</span>';

        const item = document.createElement('div');
        item.className = 'ranking-item';
        item.innerHTML = `
          <div class="ranking-pos ${posCls}">${posSymbol}</div>
          <div class="ranking-avatar">${initials}</div>
          <div class="ranking-info">
            <div class="ranking-name">${escapeHtml_(nombre)}</div>
            <div class="ranking-detail" style="font-size:.66rem;line-height:1.45;">${detailHtml}</div>
          </div>
          <div class="ranking-count">${stats.total}</div>
        `;
        rankWrap.appendChild(item);
      });
    }
  }

  // Chart carga de trabajo (4 series apiladas con colores semáforo)
  panelDestroyChart_('equipo');
  const ctxEq = document.getElementById('panel-chart-equipo');
  if (ctxEq && sorted.length) {
    const topN   = sorted.slice(0, 8);
    const labels = topN.map(([n]) => {
      const parts = n.split(' ');
      return parts.length >= 2 ? parts[0] + ' ' + parts[parts.length-1] : n;
    });
    const actData  = topN.map(([,s]) => s.activo);
    const pvData   = topN.map(([,s]) => s.porVencer);
    const venData  = topN.map(([,s]) => s.vencida);
    const finData  = topN.map(([,s]) => s.finaliz);

    __panelCharts['equipo'] = new Chart(ctxEq, {
      type: 'bar',
      plugins: [window.ChartDataLabels || {}],
      data: {
        labels,
        datasets: [
          { label: 'ACTIVO',      data: actData, backgroundColor: '#16a34a', borderRadius: 6, stack: 'stack' },
          { label: 'POR VENCER',  data: pvData,  backgroundColor: '#f97316', borderRadius: 6, stack: 'stack' },
          { label: 'VENCIDAS',    data: venData, backgroundColor: '#dc2626', borderRadius: 6, stack: 'stack' },
          { label: 'FINALIZADAS', data: finData, backgroundColor: '#6b7280', borderRadius: 6, stack: 'stack' }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { weight: '700', size: 11 }, color: '#3d5248', boxWidth: 12, padding: 8 }
          },
          datalabels: {
            color: '#fff',
            font: { weight: '900', size: 11 },
            anchor: 'center', align: 'center',
            formatter: v => v > 0 ? v : '',
            textStrokeColor: 'rgba(0,0,0,.3)',
            textStrokeWidth: 3
          }
        },
        scales: {
          x: {
            stacked: true, beginAtZero: true,
            ticks: { precision: 0, color: '#6b7c74', font: { weight: '600' } },
            grid: { color: 'rgba(6,64,43,.07)' }
          },
          y: {
            stacked: true,
            ticks: { color: '#3d5248', font: { weight: '700', size: 11 } },
            grid: { display: false }
          }
        }
      }
    });
  }
}

/* ── TAB: TIEMPOS ────────────────────────────────────────── */
function panelRenderTiempo_(rows) {
  // Solo activos (no finalizados)
  const activos = rows.filter(r => normalizeText_(r.estado||'') !== 'FINALIZADO');
  const hoy = formatDDMMYYYY_(new Date());

  // Calcular días restantes
  const conDias = activos.map(r => {
    const faltan = diasHabiles_(hoy, r.respuesta);
    const sem    = calcSemaforo_(r);
    return { ...r, _faltan: faltan, _semClase: sem.clase, _semTxt: sem.texto };
  });

  // Ordenar: vencidos primero, luego por días asc
  conDias.sort((a,b) => a._faltan - b._faltan);

  // KPIs de tiempo
  const vencidos  = conDias.filter(r => r._faltan < 0).length;
  const hoyVence  = conDias.filter(r => r._faltan === 0).length;
  const tresDias  = conDias.filter(r => r._faltan > 0 && r._faltan <= 3).length;
  const enPlazo   = conDias.filter(r => r._faltan > 3).length;
  const promDias  = activos.length
    ? Math.round(conDias.filter(r=>r._faltan>0).reduce((a,b)=>a+b._faltan,0) /
        Math.max(conDias.filter(r=>r._faltan>0).length, 1))
    : 0;

  const kpiTiempoWrap = document.getElementById('panel-kpis-tiempo');
  if (kpiTiempoWrap) {
    kpiTiempoWrap.innerHTML = '';
    const kpis = [
      { icon: PANEL_ICON_RELOJ,   value: vencidos, label: 'Vencidos',     sub: 'requieren atención urgente', cls: 'kpi-rojo' },
      { icon: PANEL_ICON_RELOJ,   value: hoyVence, label: 'Vencen Hoy',   sub: 'vencimiento inmediato',      cls: 'kpi-rojo' },
      { icon: PANEL_ICON_TARGET,  value: tresDias, label: '≤ 3 Días',     sub: 'plazo muy corto',            cls: 'kpi-naranja' },
      { icon: PANEL_ICON_BARRAS,  value: enPlazo,  label: 'A Tiempo',     sub: 'más de 3 días hábiles',      cls: 'kpi-verde' },
      { icon: PANEL_ICON_RELOJ,   value: promDias, label: 'Días Prom.',   sub: 'promedio hábiles restantes', cls: '' }
    ];
    kpis.forEach(k => {
      const el = document.createElement('div');
      el.className = 'kpi-card ' + k.cls;
      el.innerHTML = `
        <img class="kpi-icon" src="${k.icon}" alt="${k.label}" />
        <div class="kpi-value">${k.value}</div>
        <div class="kpi-label">${k.label}</div>
        <div class="kpi-sub">${k.sub}</div>
      `;
      kpiTiempoWrap.appendChild(el);
    });
  }

  // Timeline
  const tlWrap = document.getElementById('panel-timeline');
  if (tlWrap) {
    tlWrap.innerHTML = '';
    if (!conDias.length) {
      tlWrap.innerHTML = '<div class="panel-empty">Sin asignaciones activas.</div>';
    } else {
      conDias.slice(0, 30).forEach(r => {
        const cls   = r._semClase.replace('semaforo-', 'tl-');
        const bgCls = r._faltan < 0  ? 'bg-rojo'
                    : r._faltan <= 3 ? 'bg-naranja'
                    : 'bg-verde';

        const item = document.createElement('div');
        item.className = `timeline-item ${cls}`;

        const fechaParts = String(r.respuesta || '').split('/');
        const fechaCorta = fechaParts.length === 3
          ? fechaParts[0] + '/' + fechaParts[1]
          : (r.respuesta || '—');

        item.innerHTML = `
          <div class="timeline-date">${escapeHtml_(fechaCorta)}<br><span style="font-size:.60rem;color:var(--text-muted);">${escapeHtml_(fechaParts[2]||'')}</span></div>
          <div class="timeline-info">
            <div class="timeline-name">${escapeHtml_((r.asignado||'').split(' ').slice(0,2).join(' '))}</div>
            <div class="timeline-desc">${escapeHtml_(r.descripcion||'')}</div>
          </div>
          <span class="timeline-badge ${bgCls}">${escapeHtml_(r._semTxt)}</span>
        `;
        tlWrap.appendChild(item);
      });
    }
  }
}

/* ── TAB: CATEGORÍAS ─────────────────────────────────────── */
function panelRenderCats_(rows) {
  // Categorías
  const catMap     = panelCountByKey_(rows, 'categoria');
  const sortedCats = Object.entries(catMap).sort((a,b) => b[1]-a[1]);
  const maxCat     = Math.max(...sortedCats.map(([,v])=>v), 1);

  // Lista categorías (igual que antes)
  const catsWrap = document.getElementById('panel-cats');
  if (catsWrap) {
    catsWrap.innerHTML = '';
    sortedCats.forEach(([cat, count], idx) => {
      const iconUrl = getCatIcon_(cat);
      const color   = PANEL_CAT_COLORS_LIST[idx % PANEL_CAT_COLORS_LIST.length];
      const pct     = Math.round((count / maxCat) * 100);
      const item = document.createElement('div');
      item.className = 'cat-stat-item';
      item.innerHTML = `
        ${iconUrl ? `<img class="cat-stat-icon" src="${iconUrl}" alt="${cat}" />` : ''}
        <div class="cat-stat-info">
          <div class="cat-stat-name" title="${escapeHtml_(cat)}">${escapeHtml_(cat)}</div>
          <div class="cat-stat-bar-track">
            <div class="cat-stat-bar-fill" style="width:${pct}%;background:${color};"></div>
          </div>
        </div>
        <div class="cat-stat-count">${count}</div>
      `;
      catsWrap.appendChild(item);
    });
    if (!sortedCats.length) catsWrap.innerHTML = '<div class="panel-empty">Sin datos.</div>';
  }

  // Mapa: categoría → { subcat: count }
  const subcatPorCat = {};
  rows.forEach(r => {
    const cat    = String(r.categoria    || '').trim();
    const subcat = String(r.subcategoria || '').trim();
    if (!cat || !subcat) return;
    if (!subcatPorCat[cat]) subcatPorCat[cat] = {};
    subcatPorCat[cat][subcat] = (subcatPorCat[cat][subcat] || 0) + 1;
  });

  // Categoría activa por defecto = la más grande
  let activeCat = sortedCats[0]?.[0] || null;

  // Render lista + chart de subcats según categoría
  const renderSubcatsView = (catName) => {
    const titleListEl  = document.getElementById('panel-subcats-list-title');
    const titleChartEl = document.getElementById('panel-subcats-chart-title');
    const subcatsWrap  = document.getElementById('panel-subcats');

    const subMap = (catName && subcatPorCat[catName]) ? subcatPorCat[catName] : {};
    const titleSuffix = catName ? ` — ${catName}` : '';

    if (titleListEl)  titleListEl.textContent  = `POR SUBCATEGORÍA${titleSuffix}`;
    if (titleChartEl) titleChartEl.textContent = `GRÁFICO POR SUBCATEGORÍA${titleSuffix}`;

    const sortedSubs = Object.entries(subMap).sort((a,b) => b[1]-a[1]);
    const maxSub     = Math.max(...sortedSubs.map(([,v])=>v), 1);

    // Lista subcats
    if (subcatsWrap) {
      subcatsWrap.innerHTML = '';
      sortedSubs.slice(0, 10).forEach(([sub, count], idx) => {
        const iconUrl = getSubcatIcon_(sub);
        const color   = PANEL_CAT_COLORS_LIST[idx % PANEL_CAT_COLORS_LIST.length];
        const pct     = Math.round((count / maxSub) * 100);
        const item = document.createElement('div');
        item.className = 'cat-stat-item';
        item.innerHTML = `
          ${iconUrl ? `<img class="cat-stat-icon" src="${iconUrl}" alt="${sub}" />` : ''}
          <div class="cat-stat-info">
            <div class="cat-stat-name" title="${escapeHtml_(sub)}">${escapeHtml_(sub)}</div>
            <div class="cat-stat-bar-track">
              <div class="cat-stat-bar-fill" style="width:${pct}%;background:${color};"></div>
            </div>
          </div>
          <div class="cat-stat-count">${count}</div>
        `;
        subcatsWrap.appendChild(item);
      });
      if (!sortedSubs.length) {
        subcatsWrap.innerHTML = '<div class="panel-empty">Sin subcategorías.</div>';
      }
    }

    // Chart subcats (dona derecha)
    panelDestroyChart_('subcats');
    const ctxSubs = document.getElementById('panel-chart-subcats');
    if (ctxSubs && sortedSubs.length) {
      const labels = sortedSubs.map(([k]) => {
        const words = k.split(' ');
        return words.length > 3 ? words.slice(0,3).join(' ') + '…' : k;
      });
      const values = sortedSubs.map(([,v]) => v);
      const colors = sortedSubs.map((_,i) => PANEL_CAT_COLORS_LIST[i % PANEL_CAT_COLORS_LIST.length]);

      __panelCharts['subcats'] = new Chart(ctxSubs, {
        type: 'doughnut',
        plugins: [window.ChartDataLabels || {}],
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: colors,
            borderWidth: 3,
            borderColor: '#fff',
            hoverOffset: 10
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '60%',
          animation: { duration: 400 },
          plugins: {
            legend: {
              position: 'bottom',
              labels: { font: { weight: '700', size: 11 }, color: '#3d5248', boxWidth: 12, padding: 10 }
            },
            tooltip: {
              backgroundColor: 'rgba(255,255,255,.97)',
              titleColor: '#06402B', bodyColor: '#3d5248',
              borderColor: 'rgba(6,64,43,.15)', borderWidth: 1.5,
              padding: 10, cornerRadius: 10,
              callbacks: {
                label: (ctx) => {
                  const total = ctx.dataset.data.reduce((a,b)=>a+b,0) || 1;
                  const pct = Math.round((ctx.parsed / total) * 100);
                  return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
                }
              }
            },
            datalabels: {
              color: '#fff',
              font: { weight: '900', size: 13 },
              formatter: (v, ctx) => {
                const pctVal = Math.round(v / (ctx.dataset.data.reduce((a,b)=>a+b,0)||1) * 100);
                return pctVal >= 5 ? pctVal + '%' : '';
              },
              textStrokeColor: 'rgba(0,0,0,.4)',
              textStrokeWidth: 3
            }
          }
        }
      });
    } else {
      // Si no hay subcats, destruir cualquier chart anterior
      panelDestroyChart_('subcats');
    }
  };

  // Render inicial con la categoría más grande
  renderSubcatsView(activeCat);

  // Chart de categorías (dona izquierda) con hover interactivo
  panelDestroyChart_('cats');
  const ctxCats = document.getElementById('panel-chart-cats');
  if (ctxCats && sortedCats.length) {
    const fullLabels = sortedCats.map(([k]) => k);
    const labels = sortedCats.map(([k]) => {
      const words = k.split(' ');
      return words.length > 3 ? words.slice(0,3).join(' ') + '…' : k;
    });
    const values = sortedCats.map(([,v]) => v);
    const colors = sortedCats.map((_,i) => PANEL_CAT_COLORS_LIST[i % PANEL_CAT_COLORS_LIST.length]);

    __panelCharts['cats'] = new Chart(ctxCats, {
      type: 'doughnut',
      plugins: [window.ChartDataLabels || {}],
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderWidth: 3,
          borderColor: '#fff',
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { weight: '700', size: 11 }, color: '#3d5248', boxWidth: 12, padding: 10 }
          },
          tooltip: {
            backgroundColor: 'rgba(255,255,255,.97)',
            titleColor: '#06402B', bodyColor: '#3d5248',
            borderColor: 'rgba(6,64,43,.15)', borderWidth: 1.5,
            padding: 10, cornerRadius: 10,
            callbacks: {
              label: (ctx) => {
                const total = ctx.dataset.data.reduce((a,b)=>a+b,0) || 1;
                const pct = Math.round((ctx.parsed / total) * 100);
                return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
              }
            }
          },
          datalabels: {
            color: '#fff',
            font: { weight: '900', size: 13 },
            formatter: (v, ctx) => {
              const pctVal = Math.round(v / (ctx.dataset.data.reduce((a,b)=>a+b,0)||1) * 100);
              return pctVal >= 5 ? pctVal + '%' : '';
            },
            textStrokeColor: 'rgba(0,0,0,.4)',
            textStrokeWidth: 3
          }
        },
        onHover: (event, activeElements, chart) => {
          chart.canvas.style.cursor = activeElements.length ? 'pointer' : 'default';
          if (activeElements.length > 0) {
            const idx = activeElements[0].index;
            const catName = fullLabels[idx];
            if (catName !== activeCat) {
              activeCat = catName;
              renderSubcatsView(activeCat);
            }
          }
        }
      }
    });
  }
}

  /* ================== ATENCIONES REGISTRADAS ================== */
let __atencionesTabActual = 'chat';
let __atencionesChatCache = [];
let __atencionesPresCache = [];

async function abrirAtenciones_() {
  if (!currentUser || !canSeeAtendidasChat_()) {
    Swal.fire({ icon: 'warning', title: 'Sin permiso' });
    return;
  }
  __atencionesTabActual = 'chat';
  document.getElementById('atenc-filter').value = '';

  // La pestaña Presencial solo es visible para super usuario
  const tabPres = document.getElementById('tab-atenc-pres');
  if (tabPres) tabPres.style.display = currentUser?.isSuper ? '' : 'none';

  atencionesShowTabUI_('chat');
  showView('view-atenciones');
  await atencionesLoadAll_();
}

async function atencionesLoadAll_() {
  const isSuper = currentUser?.isSuper;
  const [chatData, presData] = await Promise.all([
    apiGet('listSolicitudes', { estado: 'ATENDIDA CHAT' }),
    isSuper
      ? apiGet('listSolicitudes', { estado: 'ATENDIDA PRESENCIAL' })
      : Promise.resolve([])
  ]);
  __atencionesChatCache = Array.isArray(chatData) ? chatData : [];
  __atencionesPresCache = Array.isArray(presData) ? presData : [];
  renderAtenciones_(
    __atencionesTabActual === 'chat' ? __atencionesChatCache : __atencionesPresCache
  );
}

function atencionesShowTab_(tab) {
  __atencionesTabActual = tab;
  atencionesShowTabUI_(tab);
  document.getElementById('atenc-filter').value = '';
  renderAtenciones_(tab === 'chat' ? __atencionesChatCache : __atencionesPresCache);
}

function atencionesShowTabUI_(tab) {
  const tabChat = document.getElementById('tab-atenc-chat');
  const tabPres = document.getElementById('tab-atenc-pres');
  if (tabChat) tabChat.classList.toggle('active', tab === 'chat');
  if (tabPres) tabPres.classList.toggle('active', tab === 'pres');
}

function renderAtenciones_(items) {
  const wrap = document.getElementById('atenc-wrap');
  if (!wrap) return;
  wrap.innerHTML = '';
  document.getElementById('atenc-count').textContent = String(items.length);

  if (!items.length) {
    wrap.innerHTML = '<p class="muted center" style="margin-top:20px;">No hay registros.</p>';
    return;
  }

  for (const it of items) {
    const card = document.createElement('div');
    card.className = 'sol-card';

    const head = document.createElement('div');
    head.className = 'sol-head';
    const titleEl = document.createElement('p');
    titleEl.className = 'sol-title';
    titleEl.innerHTML = `Usuario: <b>${escapeHtml_(it.nombre || '')}</b>`;
    head.appendChild(titleEl);

    const meta = document.createElement('div');
    meta.className = 'sol-meta';
    const respondedExtra = (it.respondida && String(it.respondida).trim())
      ? `<p><span style="color:#16a34a;font-weight:1000;">RESPONDIDA:</span> ${escapeHtml_(it.respondida)}</p>`
      : '';
    meta.innerHTML = `
      <p>Documento / NIT: ${escapeHtml_(it.documento || '')}</p>
      <p>Residencia: ${escapeHtml_(it.barrio || '')}</p>
      <p>Código Catastral: ${escapeHtml_(it.codigo || '')}</p>
      <p>Solicitud: ${escapeHtml_(it.solicitud || '')}</p>
      <p><span style="color:#dc2626;font-weight:1000;">Fecha:</span> ${escapeHtml_(it.fecha || '')}</p>
      ${respondedExtra}
    `;

    card.appendChild(head);
    card.appendChild(meta);
    wrap.appendChild(card);
  }
}

document.getElementById('btn-atenciones-registradas')?.addEventListener('click', async () => {
  playSoundOnce(SOUNDS.back);
  await abrirAtenciones_();
});

document.getElementById('atenc-filter')?.addEventListener('input', () => {
  const q = normalizeText_(document.getElementById('atenc-filter').value || '');
  const source = __atencionesTabActual === 'chat'
    ? __atencionesChatCache
    : __atencionesPresCache;
  if (!q) { renderAtenciones_(source); return; }
  renderAtenciones_(source.filter(it => {
    const blob = normalizeText_([
      it.id_predial, it.nombre, it.documento, it.barrio,
      it.codigo, it.solicitud, it.fecha, it.respondida
    ].join(' '));
    return blob.includes(q);
  }));
});

document.getElementById('atenc-back')?.addEventListener('click', () => {
  playSoundOnce(SOUNDS.back);
  showView('view-inicio');
});

  /* ============================================================
   ESTADÍSTICAS DASHBOARD v2 — Lógica completa
   ============================================================ */

const ESTAD_ICON = {
  calendario: 'https://res.cloudinary.com/dqqeavica/image/upload/v1776301265/calendario_tbjeas.webp',
  mapa:       'https://res.cloudinary.com/dqqeavica/image/upload/v1776301266/mapa_o7izhb.png',
  tendencia:  'https://res.cloudinary.com/dqqeavica/image/upload/v1776301266/tendencia_cpy1nw.png',
  barras:     'https://res.cloudinary.com/dqqeavica/image/upload/v1776287026/barras_pinzze.png'
};

let __estadTabActual      = 'tiempo';
let __estadChartsDash     = {};
let __estadZonasPages     = [];
let __estadZonasPagActual = 0;

/* ── Destruir chart por clave ────────────────────────────── */
function estadDestroyChart_(key) {
  try {
    if (__estadChartsDash[key]) {
      __estadChartsDash[key].destroy();
      delete __estadChartsDash[key];
    }
  } catch(_) {}
}

/* ── Cambiar tab ─────────────────────────────────────────── */
function estadShowTab_(tab) {
  __estadTabActual = tab;
  ['tiempo','zonas','tendencia'].forEach(t => {
    const view = document.getElementById('estad-view-' + t);
    const btn  = document.getElementById('estad-tab-btn-' + t);
    if (!view || !btn) return;
    const active = (t === tab);
    view.style.display = active ? '' : 'none';
    btn.classList.toggle('active', active);
    if (active) {
      view.classList.remove('estad-tab-content');
      void view.offsetWidth;
      view.classList.add('estad-tab-content');
    }
  });

  if (!__estadCache || !__estadCache.length) return;

  switch (tab) {
    case 'tiempo':    estadRenderTiempo_();    break;
    case 'zonas':     estadRenderZonas_();     break;
    case 'tendencia': estadRenderTendencia_(); break;
  }
}

/* ── Regresar ────────────────────────────────────────────── */
function estadGoBack_() {
  playSoundOnce(SOUNDS.back);
  Object.keys(__estadChartsDash).forEach(k => estadDestroyChart_(k));
  destroyEstadChart_();
  showView('view-inicio');
}

/* ── OVERRIDE openEstadisticas_ ─────────────────────────── */
openEstadisticas_ = async function() {
  if (!currentUser || !currentUser.isSuper) {
    Swal.fire({ icon: 'warning', title: 'Solo SUPER USUARIO' });
    return;
  }

  showView('view-estadisticas');
  estadShowTab_('tiempo');

  try {
    await loadEstadisticasData_();

    const sub = document.getElementById('estad-dash-subtitle');
    if (sub) {
      const ts = new Date();
      sub.textContent =
        `${__estadCache.length} atendidas · Actualizado ` +
        `${String(ts.getHours()).padStart(2,'0')}:${String(ts.getMinutes()).padStart(2,'0')}`;
    }

    estadRenderTiempo_();
  } catch(e) {
    Swal.fire({ icon: 'error', title: 'Error', text: String(e.message || e) });
  }
};

/* ══════════════════════════════════════════════════════════
   TAB: TIEMPO 2026
══════════════════════════════════════════════════════════ */
function estadRenderTiempo_() {
  const rows = __estadCache;
  const data = buildDataTiempo2026_(rows);

  const totalChat = data.totals.chat;
  const totalPres = data.totals.pres;
  const totalAll  = totalChat + totalPres;

  /* Mes más activo */
  let bestLabel = '—';
  let bestVal   = 0;
  if (data.labels.length) {
    data.labels.forEach((lbl, i) => {
      const combined = data.datasets.reduce((s, ds) => s + (ds.data[i] || 0), 0);
      if (combined > bestVal) { bestVal = combined; bestLabel = lbl; }
    });
  }
  const promMensual = data.labels.length
    ? Math.round(totalAll / data.labels.length)
    : 0;

  /* ── KPIs ── */
  const kpiWrap = document.getElementById('estad-kpis-tiempo');
  if (kpiWrap) {
    kpiWrap.innerHTML = '';
    [
      { icon: ESTAD_ICON.barras,     value: totalAll,    label: 'Total 2026',  sub: 'solicitudes atendidas', cls: '' },
      { icon: ESTAD_ICON.calendario, value: totalChat,   label: 'CHAT',        sub: 'atendidas por chat',    cls: 'kpi-naranja' },
      { icon: ESTAD_ICON.calendario, value: totalPres,   label: 'PRESENCIAL',  sub: 'atendidas presencial',  cls: 'kpi-verde' },
      { icon: ESTAD_ICON.tendencia,  value: promMensual, label: 'Prom./Mes',   sub: 'atenciones promedio',   cls: '' },
      { icon: ESTAD_ICON.barras,     value: bestLabel,   label: 'Mejor Mes',   sub: `${bestVal} atendidas`,  cls: 'kpi-blue' }
    ].forEach(k => {
      const vs     = String(k.value);
      const isLong = vs.length > 5;
      const el = document.createElement('div');
      el.className = 'kpi-card ' + k.cls;
      el.innerHTML = `
        <img class="kpi-icon" src="${k.icon}" alt="${k.label}" />
        <div class="kpi-value" style="${isLong ? 'font-size:1rem;line-height:1.2;text-align:center;' : ''}">${escapeHtml_(vs)}</div>
        <div class="kpi-label">${k.label}</div>
        <div class="kpi-sub">${k.sub}</div>
      `;
      kpiWrap.appendChild(el);
    });
  }

  /* ── Pills totales ── */
  const pillWrap = document.getElementById('estad-totals-tiempo');
  if (pillWrap) {
    pillWrap.innerHTML = `
      <div class="estad-tend-pill">
        <span class="estad-tend-pill-icon">🟠</span>
        <span class="estad-tend-pill-value">${totalChat}</span>
        <span class="estad-tend-pill-label">CHAT</span>
      </div>
      <div class="estad-tend-pill">
        <span class="estad-tend-pill-icon">🟢</span>
        <span class="estad-tend-pill-value">${totalPres}</span>
        <span class="estad-tend-pill-label">PRESENCIAL</span>
      </div>
      <div class="estad-tend-pill">
        <span class="estad-tend-pill-icon">📊</span>
        <span class="estad-tend-pill-value">${totalAll}</span>
        <span class="estad-tend-pill-label">TOTAL</span>
      </div>
    `;
  }

  /* ── Gráfico barras ── */
  estadDestroyChart_('tiempo');
  const canvas = document.getElementById('estad-canvas-tiempo');
  if (!canvas) return;

  const dl = window.ChartDataLabels;

  __estadChartsDash['tiempo'] = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: { labels: data.labels, datasets: data.datasets },
    plugins: dl ? [dl] : [],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 14, boxHeight: 14,
            color: '#3d5248', font: { weight: '700', size: 13 }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(255,255,255,.97)',
          titleColor: '#06402B', bodyColor: '#3d5248',
          borderColor: 'rgba(6,64,43,.15)', borderWidth: 1.5,
          titleFont: { weight: '800', size: 13 },
          bodyFont: { weight: '600', size: 12 },
          padding: 12, cornerRadius: 12
        },
        datalabels: dl ? {
          color: '#fff',
          anchor: 'center', align: 'center', clamp: true,
          font: { weight: '900', size: 15, family: "'IBM Plex Sans',sans-serif" },
          formatter: v => (v && v > 0) ? String(v) : '',
          textStrokeColor: 'rgba(0,0,0,.28)', textStrokeWidth: 3
        } : { display: false }
      },
      scales: {
        x: {
          stacked: true,
          ticks: { color: '#06402B', font: { weight: '700', size: 13 }, maxRotation: 0 },
          grid: { display: false }
        },
        y: {
          stacked: true, beginAtZero: true,
          ticks: { precision: 0, color: '#3d5248', font: { weight: '700' } },
          grid: { color: 'rgba(6,64,43,.08)' }
        }
      }
    }
  });
}

/* ══════════════════════════════════════════════════════════
   TAB: ZONAS
══════════════════════════════════════════════════════════ */
function estadRenderZonas_() {
  const rows  = __estadCache;
  const built = buildDataZonasChunks_(rows);
  __estadZonasPages     = built.pages;
  __estadZonasPagActual = 0;

  /* Mapa de zonas para KPIs y top */
  const byZona = {};
  rows.forEach(r => {
    const est  = normalizeText_(r.estado || '');
    const zona = normalizeZona_(r.barrio); 
    if (!zona) return;
    if (!byZona[zona]) byZona[zona] = { chat: 0, pres: 0 };
    if (est === 'ATENDIDA CHAT')       byZona[zona].chat++;
    if (est === 'ATENDIDA PRESENCIAL') byZona[zona].pres++;
  });

  const zonasSorted = Object.entries(byZona)
    .map(([z, v]) => ({ zona: z, chat: v.chat, pres: v.pres, total: v.chat + v.pres }))
    .sort((a, b) => b.total - a.total);

  const topZona  = zonasSorted[0]?.zona  || '—';
  const topVal   = zonasSorted[0]?.total || 0;
  const numZonas = zonasSorted.length;
  const totC     = built.totals.chat;
  const totP     = built.totals.pres;

  /* ── KPIs ── */
  const kpiWrap = document.getElementById('estad-kpis-zonas');
  if (kpiWrap) {
    kpiWrap.innerHTML = '';
    [
      { icon: ESTAD_ICON.mapa,       value: numZonas,    label: 'Zonas',       sub: 'con actividad registrada', cls: '' },
      { icon: ESTAD_ICON.mapa,       value: topZona,     label: 'Zona Top',    sub: `${topVal} atendidas`,      cls: 'kpi-blue' },
      { icon: ESTAD_ICON.calendario, value: totC,        label: 'CHAT',        sub: 'en todas las zonas',       cls: 'kpi-naranja' },
      { icon: ESTAD_ICON.calendario, value: totP,        label: 'PRESENCIAL',  sub: 'en todas las zonas',       cls: 'kpi-verde' },
      { icon: ESTAD_ICON.barras,     value: totC + totP, label: 'Total Registros', sub: 'atenciones acumuladas', cls: '' }
    ].forEach(k => {
      const vs     = String(k.value);
      const isLong = vs.length > 8;
      const el = document.createElement('div');
      el.className = 'kpi-card ' + k.cls;
      el.innerHTML = `
        <img class="kpi-icon" src="${k.icon}" alt="${k.label}" />
        <div class="kpi-value" style="${isLong ? 'font-size:.72rem;line-height:1.25;text-align:center;word-break:break-word;' : ''}">${escapeHtml_(vs)}</div>
        <div class="kpi-label">${k.label}</div>
        <div class="kpi-sub">${k.sub}</div>
      `;
      kpiWrap.appendChild(el);
    });
  }

  /* ── Top zonas lista ── */
  const topWrap = document.getElementById('estad-top-zonas');
  if (topWrap) {
    topWrap.innerHTML = '';
    const maxVal = zonasSorted[0]?.total || 1;
    const medals = ['🥇','🥈','🥉'];
    zonasSorted.slice(0, 8).forEach((item, idx) => {
      const pct    = Math.round((item.total / maxVal) * 100);
      const posCls = idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : '';
      const posStr = idx < 3 ? medals[idx] : (idx + 1);
      const el = document.createElement('div');
      el.className = 'estad-top-item';
      el.innerHTML = `
        <div class="estad-top-pos ${posCls}">${posStr}</div>
        <div class="estad-top-info">
          <div class="estad-top-name" title="${escapeHtml_(item.zona)}">${escapeHtml_(item.zona)}</div>
          <div class="estad-top-bar-track">
            <div class="estad-top-bar-fill" style="width:${pct}%;"></div>
          </div>
        </div>
        <div class="estad-top-count">${item.total}</div>
      `;
      topWrap.appendChild(el);
    });
  }

  /* Primer gráfico y paginador */
  estadRenderZonasPagina_(0);
}

function estadRenderZonasPagina_(pageIdx) {
  __estadZonasPagActual = pageIdx;
  const pages = __estadZonasPages;
  if (!pages || !pages.length) return;

  const page = pages[pageIdx];
  if (!page) return;

  /* Etiqueta de página */
  const lblEl = document.getElementById('estad-zonas-page-label');
  if (lblEl) {
    lblEl.textContent = pages.length > 1
      ? `Página ${pageIdx + 1} / ${pages.length}`
      : '';
  }

  /* Destruir chart anterior */
  estadDestroyChart_('zonas');

  const canvas = document.getElementById('estad-canvas-zonas');
  if (!canvas) return;

  const isSmall = window.matchMedia('(max-width:700px)').matches;
  const dl      = window.ChartDataLabels;

  /* Totales por serie para leyenda */
  const totalChatSerie = (page.datasets || [])
    .find(d => String(d.label||'').toUpperCase() === 'CHAT')
    ?.data?.reduce((a, b) => a + (Number(b)||0), 0) || 0;
  const totalPresSerie = (page.datasets || [])
    .find(d => String(d.label||'').toUpperCase() === 'PRESENCIAL')
    ?.data?.reduce((a, b) => a + (Number(b)||0), 0) || 0;

  const datasets = (page.datasets || []).map(ds => {
    const lkey = String(ds.label||'').toUpperCase();
    const t    = lkey === 'CHAT' ? totalChatSerie : totalPresSerie;
    return { ...ds, label: `${ds.label}  (Total: ${t})` };
  });

  __estadChartsDash['zonas'] = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: { labels: page.labels, datasets },
    plugins: dl ? [dl] : [],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12, boxHeight: 12,
            color: '#3d5248', font: { weight: '700', size: 12 }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(255,255,255,.97)',
          titleColor: '#06402B', bodyColor: '#3d5248',
          borderColor: 'rgba(6,64,43,.15)', borderWidth: 1.5,
          padding: 12, cornerRadius: 12,
          titleFont: { weight: '800' }, bodyFont: { weight: '600' }
        },
                 datalabels: dl ? {
            color: '#fff',
            anchor: 'center', align: 'center', clamp: true,
            font: {
              weight: '900',
              size: isSmall ? 12 : 15,
              family: "'IBM Plex Sans',sans-serif"
            },
            formatter: v => (v && v > 0) ? String(v) : '',
            textStrokeColor: 'rgba(0,0,0,.55)', textStrokeWidth: 4
          } : { display: false }
      },
      scales: {
        x: {
          stacked: true,
          ticks: {
            color: '#06402B',
            font: { weight: '700', size: isSmall ? 9 : 11 },
            autoSkip: false,
            minRotation: 90, maxRotation: 90
          },
          grid: { display: false }
        },
        y: {
          stacked: true, beginAtZero: true,
          ticks: { precision: 0, color: '#3d5248', font: { weight: '700' } },
          grid: { color: 'rgba(6,64,43,.08)' }
        }
      }
    }
  });

  /* ── Paginador ── */
  const pagerWrap = document.getElementById('estad-pager-zonas');
  if (!pagerWrap) return;
  pagerWrap.innerHTML = '';

  if (pages.length <= 1) return;

  /* Botón anterior */
  const btnPrev = document.createElement('button');
  btnPrev.className = 'estad-pager-btn';
  btnPrev.textContent = '← Ant.';
  btnPrev.disabled = (pageIdx === 0);
  btnPrev.addEventListener('click', () => {
    if (__estadZonasPagActual > 0) estadRenderZonasPagina_(__estadZonasPagActual - 1);
  });
  pagerWrap.appendChild(btnPrev);

  /* Botones numéricos */
  pages.forEach((_, i) => {
    const btn = document.createElement('button');
    btn.className = 'estad-pager-btn' + (i === pageIdx ? ' active' : '');
    btn.textContent = String(i + 1);
    btn.addEventListener('click', () => estadRenderZonasPagina_(i));
    pagerWrap.appendChild(btn);
  });

  /* Botón siguiente */
  const btnNext = document.createElement('button');
  btnNext.className = 'estad-pager-btn';
  btnNext.textContent = 'Sig. →';
  btnNext.disabled = (pageIdx === pages.length - 1);
  btnNext.addEventListener('click', () => {
    if (__estadZonasPagActual < __estadZonasPages.length - 1)
      estadRenderZonasPagina_(__estadZonasPagActual + 1);
  });
  pagerWrap.appendChild(btnNext);
}

/* ══════════════════════════════════════════════════════════
   TAB: TENDENCIA
══════════════════════════════════════════════════════════ */
function estadRenderTendencia_() {
  const rows = __estadCache;

  /* Construir datos mensuales completos */
  const byMonth = {};
  rows.forEach(r => {
    const est   = normalizeText_(r.estado || '');
    const fecha = parseFechaObj_(r.fecha || '');
if (!fecha || fecha.yyyy !== 2026) return;
const key = String(fecha.mm).padStart(2, '0');
    if (!byMonth[key]) byMonth[key] = { chat: 0, pres: 0 };
    if (est === 'ATENDIDA CHAT')       byMonth[key].chat++;
    if (est === 'ATENDIDA PRESENCIAL') byMonth[key].pres++;
  });

  const monthsSorted = Object.keys(byMonth).sort();
  const labels  = monthsSorted.map(k => MONTHS_ES[parseInt(k, 10) - 1]);
  const chatArr = monthsSorted.map(k => byMonth[k].chat);
  const presArr = monthsSorted.map(k => byMonth[k].pres);
  const totArr  = monthsSorted.map((k, i) => chatArr[i] + presArr[i]);

  const totalAll  = totArr.reduce((a, b) => a + b, 0);
  const totalChat = chatArr.reduce((a, b) => a + b, 0);
  const totalPres = presArr.reduce((a, b) => a + b, 0);
  const maxMes    = Math.max(...totArr, 0);
  const minMes    = totArr.length ? Math.min(...totArr.filter(v => v > 0)) : 0;
  const promMes   = totArr.length ? Math.round(totalAll / totArr.length) : 0;

  /* Variación último mes vs anterior */
  let varPct = null;
  if (totArr.length >= 2) {
    const last = totArr[totArr.length - 1];
    const prev = totArr[totArr.length - 2];
    varPct = prev > 0 ? Math.round(((last - prev) / prev) * 100) : null;
  }

  /* ── KPIs ── */
  const kpiWrap = document.getElementById('estad-kpis-tendencia');
  if (kpiWrap) {
    kpiWrap.innerHTML = '';
    [
      { icon: ESTAD_ICON.barras,    value: totalAll,  label: 'Total 2026',   sub: 'solicitudes acumuladas', cls: '' },
      { icon: ESTAD_ICON.tendencia, value: maxMes,    label: 'Pico Mensual', sub: 'máximo en un mes',       cls: 'kpi-blue' },
      { icon: ESTAD_ICON.tendencia, value: minMes,    label: 'Mínimo Mes',   sub: 'mínimo registrado',      cls: '' },
      { icon: ESTAD_ICON.barras,    value: promMes,   label: 'Promedio',     sub: 'atenciones por mes',     cls: '' },
      {
        icon:  ESTAD_ICON.tendencia,
        value: varPct !== null ? (varPct >= 0 ? '+' + varPct + '%' : varPct + '%') : '—',
        label: 'Var. Último Mes',
        sub:   'vs mes anterior',
        cls:   varPct === null ? '' : varPct >= 0 ? 'kpi-verde' : 'kpi-rojo'
      }
    ].forEach(k => {
      const vs     = String(k.value);
      const isLong = vs.length > 5;
      const el = document.createElement('div');
      el.className = 'kpi-card ' + k.cls;
      el.innerHTML = `
        <img class="kpi-icon" src="${k.icon}" alt="${k.label}" />
        <div class="kpi-value" style="${isLong ? 'font-size:1rem;line-height:1.2;text-align:center;' : ''}">${escapeHtml_(vs)}</div>
        <div class="kpi-label">${k.label}</div>
        <div class="kpi-sub">${k.sub}</div>
      `;
      kpiWrap.appendChild(el);
    });
  }

  /* ── Gráfico de línea ── */
  estadDestroyChart_('tendencia');
  const canvas = document.getElementById('estad-canvas-tendencia');
  if (canvas && labels.length) {
    const dl = window.ChartDataLabels;

    __estadChartsDash['tendencia'] = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'TOTAL',
            data: totArr,
            borderColor: '#06402B',
            backgroundColor: 'rgba(6,64,43,.10)',
            borderWidth: 3,
            pointBackgroundColor: '#06402B',
            pointRadius: 6,
            pointHoverRadius: 9,
            fill: true,
            tension: 0.38
          },
          {
            label: 'CHAT',
            data: chatArr,
            borderColor: '#f97316',
            backgroundColor: 'rgba(249,115,22,.08)',
            borderWidth: 2.5,
            pointBackgroundColor: '#f97316',
            pointRadius: 5,
            pointHoverRadius: 8,
            fill: false,
            tension: 0.38
          },
          {
            label: 'PRESENCIAL',
            data: presArr,
            borderColor: '#16a34a',
            backgroundColor: 'rgba(22,163,74,.08)',
            borderWidth: 2.5,
            pointBackgroundColor: '#16a34a',
            pointRadius: 5,
            pointHoverRadius: 8,
            fill: false,
            tension: 0.38
          }
        ]
      },
      plugins: dl ? [dl] : [],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 14, boxHeight: 14,
              color: '#3d5248', font: { weight: '700', size: 13 }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(255,255,255,.97)',
            titleColor: '#06402B', bodyColor: '#3d5248',
            borderColor: 'rgba(6,64,43,.15)', borderWidth: 1.5,
            titleFont: { weight: '800', size: 13 },
            bodyFont: { weight: '600', size: 12 },
            padding: 12, cornerRadius: 12
          },
          datalabels: dl ? {
            color: (ctx) => {
              const colors = ['#06402B','#f97316','#16a34a'];
              return colors[ctx.datasetIndex] || '#333';
            },
            anchor: 'top', align: 'top', offset: 4,
            font: { weight: '900', size: 13, family: "'IBM Plex Sans',sans-serif" },
            formatter: v => (v && v > 0) ? String(v) : '',
            textStrokeColor: 'rgba(255,255,255,.8)', textStrokeWidth: 4
          } : { display: false }
        },
        scales: {
          x: {
            ticks: { color: '#06402B', font: { weight: '700', size: 12 }, maxRotation: 0 },
            grid: { color: 'rgba(6,64,43,.06)' }
          },
          y: {
            beginAtZero: true,
            ticks: { precision: 0, color: '#3d5248', font: { weight: '700' } },
            grid: { color: 'rgba(6,64,43,.08)' }
          }
        }
      }
    });
  }

  /* ── Tabla comparación mensual ── */
  const tbody = document.getElementById('estad-month-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!monthsSorted.length) {
    tbody.innerHTML = `
      <tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:16px;">
        Sin datos para 2026.
      </td></tr>`;
    return;
  }

  let acumTotal = 0;
  let prevTotal = null;

  monthsSorted.forEach((key, i) => {
    const mes   = labels[i];
    const chat  = chatArr[i];
    const pres  = presArr[i];
    const tot   = totArr[i];
    acumTotal  += tot;

    /* Variación vs mes anterior */
    let varStr  = '—';
    let varCls  = '';
    if (prevTotal !== null && prevTotal > 0) {
      const diff = Math.round(((tot - prevTotal) / prevTotal) * 100);
      varStr = (diff >= 0 ? '+' : '') + diff + '%';
      varCls = diff > 0  ? 'style="color:#16a34a;font-weight:900;"'
             : diff < 0  ? 'style="color:#dc2626;font-weight:900;"'
             : 'style="color:#6b7280;"';
    } else if (prevTotal !== null) {
      varStr = tot > 0 ? '🆕' : '—';
    }
    prevTotal = tot;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="td-mes">${escapeHtml_(mes)}</td>
      <td class="td-chat">${chat}</td>
      <td class="td-pres">${pres}</td>
      <td class="td-total">${tot}</td>
      <td ${varCls}>${varStr}</td>
    `;
    tbody.appendChild(tr);
  });

  /* Fila totales */
  const trFoot = document.createElement('tr');
  trFoot.innerHTML = `
    <td class="td-foot">TOTAL</td>
    <td class="td-foot td-chat">${totalChat}</td>
    <td class="td-foot td-pres">${totalPres}</td>
    <td class="td-foot td-total">${totalAll}</td>
    <td class="td-foot">—</td>
  `;
  tbody.appendChild(trFoot);
}

/* ── Desconectar botones legacy (Tiempo / Zonas) ─────────── */
/* Los botones btn-estad-tiempo y btn-estad-zonas ya no existen en el
   nuevo HTML, pero si el navegador los tiene en caché los neutralizamos. */
(function patchLegacyEstadButtons_() {
  const bTiempo = document.getElementById('btn-estad-tiempo');
  const bZonas  = document.getElementById('btn-estad-zonas');
  const bBack   = document.getElementById('btn-estad-back');

  if (bTiempo) {
    bTiempo.replaceWith(bTiempo.cloneNode(true));
  }
  if (bZonas) {
    bZonas.replaceWith(bZonas.cloneNode(true));
  }
  if (bBack) {
    bBack.addEventListener('click', () => {
      playSoundOnce(SOUNDS.back);
      estadGoBack_();
    });
  }
})();

  /* ============================================================
   ESTADÍSTICAS — Variables y helpers faltantes
   ============================================================ */

/* 1. Caché de datos */
let __estadCache = [];

/* 2. Nombres de meses */
const MONTHS_ES = [
  'Ene','Feb','Mar','Abr','May','Jun',
  'Jul','Ago','Sep','Oct','Nov','Dic'
];

/* 3. destroyEstadChart_ (alias que faltaba) */
function destroyEstadChart_() {
  Object.keys(__estadChartsDash).forEach(k => estadDestroyChart_(k));
}

/* 4. Cargar datos del backend */
async function loadEstadisticasData_() {
  const [chat, pres] = await Promise.all([
    apiGet('listSolicitudes', { estado: 'ATENDIDA CHAT' }),
    apiGet('listSolicitudes', { estado: 'ATENDIDA PRESENCIAL' })
  ]);
  __estadCache = [
    ...(Array.isArray(chat) ? chat.map(r => ({ ...r, estado: 'ATENDIDA CHAT' }))        : []),
    ...(Array.isArray(pres) ? pres.map(r => ({ ...r, estado: 'ATENDIDA PRESENCIAL' })) : [])
  ];
}

/* 5. Helper parser que devuelve {yyyy, mm, dd} — usado en tendencia */
function parseFechaObj_(str) {
  const s = String(str || '').trim();
  if (!s) return null;

  // dd/mm/yyyy  o  d/m/yyyy  (acepta hora al final: "16/04/2026 10:30:00")
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return { dd: parseInt(m[1],10), mm: parseInt(m[2],10), yyyy: parseInt(m[3],10) };

  // ISO: yyyy-mm-dd
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return { dd: parseInt(m[3],10), mm: parseInt(m[2],10), yyyy: parseInt(m[1],10) };

  // dd-mm-yyyy
  m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (m) return { dd: parseInt(m[1],10), mm: parseInt(m[2],10), yyyy: parseInt(m[3],10) };

  return null;
}

/* 6. buildDataTiempo2026_ */
function buildDataTiempo2026_(rows) {
  const byMonth = {};
  let totalChat = 0, totalPres = 0;

  rows.forEach(r => {
    const est = normalizeText_(r.estado || '');
    const f   = parseFechaObj_(r.fecha || '');
    if (!f || f.yyyy !== 2026) return;
    const key = String(f.mm).padStart(2,'0');
    if (!byMonth[key]) byMonth[key] = { chat:0, pres:0 };
    if (est === 'ATENDIDA CHAT')       { byMonth[key].chat++; totalChat++; }
    if (est === 'ATENDIDA PRESENCIAL') { byMonth[key].pres++; totalPres++; }
  });

  const sorted = Object.keys(byMonth).sort();
  return {
    labels:   sorted.map(k => MONTHS_ES[parseInt(k,10) - 1]),
    datasets: [
      { label:'CHAT',       data: sorted.map(k => byMonth[k].chat),
        backgroundColor:'#f97316', borderRadius:8, stack:'stack' },
      { label:'PRESENCIAL', data: sorted.map(k => byMonth[k].pres),
        backgroundColor:'#16a34a', borderRadius:8, stack:'stack' }
    ],
    totals: { chat: totalChat, pres: totalPres }
  };
}

/* 7. buildDataZonasChunks_ */
function buildDataZonasChunks_(rows) {
  const byZona = {};
  let totalChat = 0, totalPres = 0;

  rows.forEach(r => {
    const est  = normalizeText_(r.estado || '');
    const zona = normalizeZona_(r.barrio);
    if (!zona) return;
    if (!byZona[zona]) byZona[zona] = { chat:0, pres:0 };
    if (est === 'ATENDIDA CHAT')       { byZona[zona].chat++; totalChat++; }
    if (est === 'ATENDIDA PRESENCIAL') { byZona[zona].pres++; totalPres++; }
  });

  const sorted = Object.entries(byZona)
    .sort((a,b) => (b[1].chat + b[1].pres) - (a[1].chat + a[1].pres));

  const PAGE_SIZE = 15;
  const pages = [];
  for (let i = 0; i < sorted.length; i += PAGE_SIZE) {
    const chunk = sorted.slice(i, i + PAGE_SIZE);
    pages.push({
      labels: chunk.map(([z]) => z),
      datasets: [
        { label:'CHAT',       data: chunk.map(([,v]) => v.chat),
          backgroundColor:'#f97316', borderRadius:6, stack:'stack' },
        { label:'PRESENCIAL', data: chunk.map(([,v]) => v.pres),
          backgroundColor:'#16a34a', borderRadius:6, stack:'stack' }
      ]
    });
  }

  return {
    pages:  pages.length ? pages : [{ labels:[], datasets:[] }],
    totals: { chat: totalChat, pres: totalPres }
  };
}

/* ================== AUTO-ACTUALIZACIÓN (version.json) ================== */
let __APP_VERSION_LOADED = '';
let __versionCheckInFlight = false;

async function checkAppVersion(){
  if(__versionCheckInFlight) return;
  __versionCheckInFlight = true;
  try{
    const url = 'version.json?t=' + Date.now();
    const r = await fetch(url, { cache: 'no-store' });
    if(!r.ok) return;
    const j = await r.json();
    const serverVersion = String(j.version || '').trim();
    if(!serverVersion) return;

    // Primera lectura: guardar la versión actual y pintarla en login
    if(!__APP_VERSION_LOADED){
      __APP_VERSION_LOADED = serverVersion;
      const el = document.getElementById('app-version');
      if(el) el.textContent = 'Versión ' + serverVersion;
      return;
    }

    // Lecturas posteriores: si cambió, recargar silenciosamente
    if(serverVersion !== __APP_VERSION_LOADED){
      try{
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }catch(_){}
      location.reload();
    }
  }catch(_){
    /* silencio: sin red no hay actualización */
  }finally{
    __versionCheckInFlight = false;
  }
}

// Recarga automática cuando el SW nuevo toma control (solo una vez por sesión de página)
if('serviceWorker' in navigator){
  let __reloadingFromSW = false;
  navigator.serviceWorker.addEventListener('controllerchange', ()=>{
    if(__reloadingFromSW) return;
    // Evitar loop: solo recargar si NO veníamos de una recarga reciente
    const lastReload = Number(sessionStorage.getItem('__swReloadTs') || 0);
    const now = Date.now();
    if(now - lastReload < 10000) return; // si recargamos hace menos de 10s, no recargar otra vez
    __reloadingFromSW = true;
    sessionStorage.setItem('__swReloadTs', String(now));
    location.reload();
  });
}

// Chequeo al cargar la página
window.addEventListener('load', ()=>{ checkAppVersion(); });

// Chequeo cada vez que la pestaña/PWA vuelve a estar visible (máx 1 vez cada 30s)
let __lastVersionCheck = Date.now();
document.addEventListener('visibilitychange', ()=>{
  if(document.hidden) return;
  const now = Date.now();
  if(now - __lastVersionCheck < 30000) return;
  __lastVersionCheck = now;
  checkAppVersion();
});
