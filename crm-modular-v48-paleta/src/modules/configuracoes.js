import { getData, saveData, exportData, importData, CRM_STORAGE_KEY, LEGACY_KEYS } from '../core/storage.js';
import { pageHeader, esc, toast } from '../core/dom.js';
import { icon } from '../assets/icons.js';

let rootRef = null;
export async function render(root) { rootRef = root.querySelector('#page-configuracoes') || root; draw(); }
export function refresh() { draw(); }

function draw() {
  const data = getData();
  rootRef.innerHTML = `
    ${pageHeader('Configurações', 'Controle dos dados locais, importação, exportação e chaves antigas do CRM.', `<button class="btn" id="exportAllBtn">${icon('export')} Exportar dados</button>`)}
    <div class="card"><div class="card-header"><div><div class="card-title">Storage centralizado</div><div class="card-sub">Chave principal: <span class="mono">${CRM_STORAGE_KEY}</span></div></div></div><div class="card-body">
      <div class="grid-kpis"><div class="kpi"><b>${data.leads.length}</b><span>Leads</span></div><div class="kpi"><b>${data.agenda.length}</b><span>Eventos</span></div><div class="kpi"><b>${data.automacoes.length}</b><span>Automações</span></div><div class="kpi"><b>${data.migratedFromLegacy ? 'Sim' : 'Não'}</b><span>Migrou legado</span></div></div>
      <hr style="border:0;border-top:1px solid var(--border);margin:18px 0">
      <div class="field"><label>Importar JSON</label><textarea id="importBox" rows="8" placeholder="Cole aqui um JSON exportado do CRM"></textarea></div>
      <div class="toolbar" style="margin-top:12px"><button class="btn btn-primary" id="importBtn">Importar</button><button class="btn btn-danger" id="resetBtn">Resetar dados locais</button></div>
    </div></div>
    <div class="card"><div class="card-header"><div><div class="card-title">Chaves antigas observadas</div><div class="card-sub">O migrador procura essas chaves no primeiro carregamento.</div></div></div><div class="card-body"><pre class="mono" style="white-space:pre-wrap">${esc(JSON.stringify(LEGACY_KEYS, null, 2))}</pre></div></div>`;
  rootRef.querySelector('#exportAllBtn')?.addEventListener('click', () => download('crm-dados-v48.json', exportData()));
  rootRef.querySelector('#importBtn')?.addEventListener('click', () => {
    try { importData(rootRef.querySelector('#importBox').value); toast('Dados importados.'); draw(); } catch (e) { toast('JSON inválido.'); }
  });
  rootRef.querySelector('#resetBtn')?.addEventListener('click', () => {
    if (!confirm('Tem certeza? Isso apaga a chave central deste CRM modular.')) return;
    localStorage.removeItem(CRM_STORAGE_KEY);
    location.reload();
  });
}

function download(filename, text) {
  const blob = new Blob([text], { type:'application/json;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
