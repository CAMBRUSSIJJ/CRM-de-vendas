/* Script original 03 */
(function(){
  'use strict';
  if (window.__crmNavigationHotfixV4_1) return;
  window.__crmNavigationHotfixV4_1 = true;

  const VIEW_META_HOTFIX = {
    inicio:{title:'Painel',sub:'Visão geral das suas oportunidades'},
    leads:{title:'Gestão de leads',sub:'Base comercial principal'},
    pipeline:{title:'Pipeline',sub:'Funil de oportunidades'},
    funil:{title:'Funil de vendas',sub:'Etapas, conversão, forecast e gargalos por lead'},
    clientes:{title:'Clientes',sub:'Relacionamentos cadastrados'},
    playbooks:{title:'Playbooks',sub:'Scripts, checklists e materiais de vendas'},
    objecoes:{title:'Biblioteca de Objeções',sub:'Respostas prontas para superar objeções'},
    perdas:{title:'Motivos de Perda',sub:'Análise e reativação de negócios perdidos'},
    dashboard:{title:'Dashboard Comercial',sub:'Visão completa de indicadores e performance'},
    cadencias:{title:'Follow-ups',sub:'Rotina de próximos contatos'},
    automacoes:{title:'Automações',sub:'Regras de funil'},
    agenda:{title:'Agenda',sub:'Planejamento e follow-ups'},
    chat:{title:'Chat',sub:'Conversas com leads e clientes via WhatsApp'},
    metricas:{title:'Métricas',sub:'Indicadores de desempenho'},
    importar:{title:'Importar / Exportar',sub:'Gerencie seus dados'}
  };

  function safeRun(fnName, delay){
    const fn = window[fnName] || (typeof globalThis !== 'undefined' ? globalThis[fnName] : null);
    if (typeof fn !== 'function') return;
    if (delay) setTimeout(() => { try { fn(); } catch(e) { console.warn('CRM hotfix:', fnName, e); } }, delay);
    else { try { fn(); } catch(e) { console.warn('CRM hotfix:', fnName, e); } }
  }

  function safeSetView(view){
    if (!view || view === 'novo-lead') {
      if (typeof window.openModal === 'function') window.openModal(null);
      else if (typeof openModal === 'function') openModal(null);
      return;
    }

    const target = document.getElementById(view);
    const isChat = view === 'chat';
    if (!target && !isChat) return;

    document.querySelectorAll('.view').forEach(el => {
      el.classList.remove('active');
      if (el.id !== 'chat') el.style.display = '';
    });

    const chat = document.getElementById('chat');
    if (isChat) {
      if (chat) {
        chat.style.display = 'block';
        chat.classList.add('active');
      }
    } else {
      if (chat) {
        chat.style.display = 'none';
        chat.classList.remove('active');
      }
      target.classList.add('active');
      target.style.display = '';
    }

    document.querySelectorAll('[data-view],[data-go]').forEach(el => {
      const key = el.dataset.view || el.dataset.go;
      el.classList.toggle('active', key === view);
    });

    const meta = VIEW_META_HOTFIX[view] || {title:view, sub:''};
    const title = document.getElementById('topbarTitle');
    const sub = document.getElementById('topbarSub');
    if (title) title.textContent = meta.title;
    if (sub) sub.textContent = meta.sub;

    if (view === 'agenda') safeRun('renderAgenda', 40);
    if (view === 'metricas') safeRun('renderMetrics', 40);
    if (view === 'dashboard') safeRun('renderDashboard', 40);
    if (view === 'playbooks') safeRun('renderPB', 40);
    if (view === 'objecoes') safeRun('renderObj', 40);
    if (view === 'perdas') safeRun('renderPerdas', 40);
    if (view === 'funil') safeRun('renderFunilPage', 40);
    if (view === 'chat') { safeRun('renderConversationList'); safeRun('updateChatBadge'); }
  }

  // Substitui a navegação encadeada por uma navegação única e previsível.
  window.setView = safeSetView;
  try { setView = safeSetView; } catch(e) {}

  // Captura cliques antes dos listeners antigos. Isso evita que um clique execute
  // dois ou três roteadores diferentes e acabe voltando para a aba Funil.
  document.addEventListener('click', function(e){
    const btn = e.target.closest('[data-view],[data-go],[data-go-view]');
    if (!btn) return;

    const view = btn.dataset.view || btn.dataset.go || btn.dataset.goView;
    if (!view) return;

    // Links reais de contato e botões internos sem navegação continuam funcionando.
    if (btn.closest('[data-stop]')) return;

    if (view === 'novo-lead') {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      if (typeof window.openModal === 'function') window.openModal(null);
      else if (typeof openModal === 'function') openModal(null);
      return;
    }

    if (document.getElementById(view) || view === 'chat') {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      safeSetView(view);
    }
  }, true);

  // Garante que a tela inicial continue correta depois que o hotfix carrega.
  const active = document.querySelector('.view.active');
  safeSetView(active ? active.id : 'inicio');
})();
