window.CRMV97Navigation = Object.freeze({
  version: 'V97',
  strategy: 'reorganizacao-sidebar-topbar-sem-novo-roteador',
  sidebar: {
    Operacao: ['inicio','leads','garimpo','pipeline'],
    Relacionamento: ['ligacoes','cadencias','agenda','chat'],
    Estrategia: ['playbooks','metas','automacoes'],
    Gestao: ['metricas','configuracoes']
  },
  consolidados: {
    funil: 'pipeline',
    clientes: 'leads',
    objecoes: 'playbooks',
    dashboard: 'metricas',
    perdas: 'metricas',
    importar: 'configuracoes'
  }
});
