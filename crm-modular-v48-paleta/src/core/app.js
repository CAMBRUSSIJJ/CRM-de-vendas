import { $, toast } from './dom.js';
import { getData, saveData } from './storage.js';
import { appState } from './state.js';
import { renderSidebar, markActiveRoute, getRouteMeta } from '../ui/sidebar.js';
import { loadPageTemplate } from '../ui/page-loader.js';
import { installButtonGuard, fixEmptyButtons } from '../ui/buttons.js';

const MODULES = {
  home: () => import('../modules/home.js'),
  leads: () => import('../modules/leads.js'),
  pipeline: () => import('../modules/pipeline.js'),
  followups: () => import('../modules/followups.js'),
  agenda: () => import('../modules/agenda.js'),
  automacoes: () => import('../modules/automacoes.js'),
  metricas: () => import('../modules/metricas.js'),
  metas: () => import('../modules/metas.js'),
  playbook: () => import('../modules/playbook.js'),
  configuracoes: () => import('../modules/configuracoes.js')
};

async function loadModule(route) {
  if (!appState.moduleCache.has(route)) {
    const mod = await (MODULES[route] || MODULES.home)();
    appState.moduleCache.set(route, mod);
  }
  return appState.moduleCache.get(route);
}

export async function navigate(route = 'home') {
  appState.route = route;
  const data = getData();
  data.ui.lastRoute = route;
  saveData(data);

  const meta = getRouteMeta(route);
  $('#pageTitle').textContent = meta.title;
  $('#pageSubtitle').textContent = meta.subtitle;
  markActiveRoute(route);

  const main = $('#appMain');
  main.innerHTML = await loadPageTemplate(route);
  const mod = await loadModule(route);
  await mod.render(main, context());
  fixEmptyButtons(main);
  main.focus({ preventScroll: true });
}

function context() {
  return { navigate, toast, getData, saveData };
}

function installGlobalActions() {
  $('#globalNewLeadBtn')?.addEventListener('click', () => navigate('leads').then(() => {
    document.dispatchEvent(new CustomEvent('crm:new-lead'));
  }));

  $('#themeToggleBtn')?.addEventListener('click', () => {
    const current = document.documentElement.dataset.theme || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    const data = getData();
    data.ui.theme = next;
    saveData(data);
    toast(`Tema ${next === 'dark' ? 'escuro' : 'claro'} aplicado.`);
  });

  window.addEventListener('crm:data-changed', () => {
    // Mantém módulos reativos simples sem framework.
    document.dispatchEvent(new CustomEvent('crm:refresh-current-route', { detail: appState.route }));
  });

  document.addEventListener('crm:refresh-current-route', event => {
    if (event.detail === appState.route) {
      loadModule(appState.route).then(mod => mod.refresh?.(context()));
    }
  });
}

function initTheme() {
  const data = getData();
  document.documentElement.dataset.theme = data.ui.theme || 'light';
}

async function boot() {
  getData();
  initTheme();
  renderSidebar($('#appSidebar'), navigate);
  installGlobalActions();
  installButtonGuard();
  const route = new URLSearchParams(location.search).get('page') || getData().ui.lastRoute || 'home';
  await navigate(route);
}

boot().catch(error => {
  console.error(error);
  $('#appMain').innerHTML = `<section class="empty"><strong>Erro ao iniciar o CRM.</strong><br><span>${error.message}</span></section>`;
});
