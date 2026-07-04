/*
  Patch leve para colar no FINAL do HTML legado, antes de </body>, caso você ainda não queira migrar tudo.
  Ele NÃO substitui os módulos acima. Serve como camada de segurança para:
  - corrigir botões vazios;
  - criar uma API central window.CRMStorage;
  - preparar o caminho para trocar localStorage solto por storage centralizado.
*/
(function(){
  'use strict';
  const KEY = 'outbounder_crm_v48_data';
  const LEGACY = {
    leads: 'outbounder_leads_v5',
    agenda: 'outbounder_agenda_v1',
    notes: 'outbounder_notes',
    automacoes: 'outbounder_automations_v1',
    ui: 'crm_v47_ui_prefs'
  };
  const labels = {
    autoNewBtn: '+ Nova automação',
    v41AutoNew: '+ Nova automação',
    newLeadBtn: '+ Novo lead',
    leadNewBtn: '+ Novo lead',
    agNewBtn: '+ Novo evento',
    metricasExportBtn: 'Exportar',
    themeToggleBtn: 'Tema'
  };
  function parse(k, fb){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):fb; }catch(e){ return fb; } }
  function write(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(e){ return false; } }
  function read(){
    const current = parse(KEY, null);
    if(current) return current;
    const data = {
      version:'v48-legacy-patch',
      migratedFromLegacy:true,
      leads: parse(LEGACY.leads, []),
      agenda: parse(LEGACY.agenda, []),
      notes: parse(LEGACY.notes, []),
      automacoes: parse(LEGACY.automacoes, []),
      ui: parse(LEGACY.ui, {})
    };
    write(KEY, data);
    return data;
  }
  function save(data){ data.updatedAt = new Date().toISOString(); write(KEY, data); return data; }
  function update(fn){ const data = read(); return save(fn(data) || data); }
  window.CRMStorage = { KEY, LEGACY, read, save, update };
  function fixButtons(root){
    (root || document).querySelectorAll('button').forEach(btn => {
      const text = (btn.textContent || '').replace(/\s+/g,'').trim();
      if(text) { if(!btn.getAttribute('aria-label')) btn.setAttribute('aria-label', btn.textContent.trim()); return; }
      if(btn.id && labels[btn.id]) { btn.textContent = labels[btn.id]; btn.setAttribute('aria-label', labels[btn.id].replace(/^\+\s*/,'')); }
    });
  }
  fixButtons();
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => n.nodeType === 1 && fixButtons(n)))).observe(document.body, {childList:true, subtree:true});
})();
