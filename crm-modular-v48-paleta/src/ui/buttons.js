import { icon } from '../assets/icons.js';

const BUTTON_LABELS = {
  autoNewBtn: ['plus', 'Nova automação'],
  v41AutoNew: ['plus', 'Nova automação'],
  newLeadBtn: ['plus', 'Novo lead'],
  leadNewBtn: ['plus', 'Novo lead'],
  globalNewLeadBtn: ['plus', 'Novo lead'],
  agNewBtn: ['calendar', 'Novo evento'],
  metricasExportBtn: ['export', 'Exportar'],
  deleteLeadBtn: ['trash', 'Excluir'],
  themeToggleBtn: ['settings', 'Tema']
};

function visibleText(button) {
  return (button.textContent || '').replace(/\s+/g, '').trim();
}

function labelFor(button) {
  if (button.id && BUTTON_LABELS[button.id]) return BUTTON_LABELS[button.id];
  const action = button.dataset.action || button.dataset.go || button.dataset.route;
  if (action === 'new-lead') return ['plus', 'Novo lead'];
  if (action === 'new-automation') return ['plus', 'Nova automação'];
  if (action === 'delete') return ['trash', 'Excluir'];
  return null;
}

export function fixEmptyButtons(root = document) {
  root.querySelectorAll('button').forEach(button => {
    const label = labelFor(button);
    const hasText = visibleText(button).length > 0;
    if (!hasText && label) {
      const [iconName, text] = label;
      button.innerHTML = `${icon(iconName)}<span>${text}</span>`;
      button.setAttribute('aria-label', text);
      return;
    }
    if (!button.getAttribute('aria-label') && hasText) {
      button.setAttribute('aria-label', button.textContent.trim());
    }
  });
}

export function installButtonGuard() {
  fixEmptyButtons();
  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) fixEmptyButtons(node);
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
