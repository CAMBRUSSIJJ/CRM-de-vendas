import { appState } from '../core/state.js';

export async function loadPageTemplate(route) {
  if (appState.pageCache.has(route)) return appState.pageCache.get(route);
  try {
    const response = await fetch(`./pages/${route}.html`, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Página não encontrada: ${route}`);
    const html = await response.text();
    appState.pageCache.set(route, html);
    return html;
  } catch (error) {
    return `<section class="empty"><strong>Não consegui carregar a página ${route}.</strong><br><span>Confira se o arquivo pages/${route}.html existe e se você abriu por servidor local.</span></section>`;
  }
}
