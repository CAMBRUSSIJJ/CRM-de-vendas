(function(W){
  'use strict';
  if(W.CRMScriptEngine) return;

  const PB_KEY='crm_v93_playbooks';
  const read=(key,fb)=>{try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fb}catch(e){return fb}};
  const write=(key,val)=>{try{localStorage.setItem(key,JSON.stringify(val));return true}catch(e){console.warn('[CRM Script Engine] Falha ao salvar',e);return false}};
  const clone=v=>JSON.parse(JSON.stringify(v));
  const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const slug=v=>norm(v).replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'')||'item';
  const uid=p=>(p||'id')+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7);
  const arr=v=>Array.isArray(v)?v:[];
  const text=v=>String(v??'');

  const BLOCK_TYPES=['speech','question-single','question-multi','checklist','notice','proof','action'];
  const BLOCK_LABELS={
    speech:'Texto para falar',
    'question-single':'Pergunta — uma resposta',
    'question-multi':'Pergunta — várias respostas',
    checklist:'Checklist',
    notice:'Aviso interno',
    proof:'Prova/argumento',
    action:'Ação rápida'
  };

  function normalizeOption(o={},i=0){
    if(typeof o==='string') return {id:'opt_'+slug(o)+'_'+i,label:o,value:o,nextId:''};
    return {id:o.id||('opt_'+slug(o.label||o.value||'opcao')+'_'+i),label:text(o.label||o.value||('Opção '+(i+1))),value:text(o.value||o.label||''),nextId:text(o.nextId||o.next||'')};
  }
  function normalizeBlock(b={},i=0){
    const type=BLOCK_TYPES.includes(b.type)?b.type:'speech';
    const options=arr(b.options).map(normalizeOption);
    return {
      id:b.id||('block_'+slug(b.title||b.name||'etapa')+'_'+i),
      title:text(b.title||b.name||('Etapa '+(i+1))),
      type,
      content:text(b.content??b.text??''),
      objective:text(b.objective??b.objetivo??''),
      notePrompt:text(b.notePrompt??b.note_prompt??'Nota desta etapa'),
      options,
      required:b.required===true,
      nextId:text(b.nextId||b.next||''),
      hidden:b.hidden===true,
      tags:arr(b.tags).map(text),
      order:Number.isFinite(Number(b.order))?Number(b.order):i
    };
  }
  function legacyBlocks(p){
    if(arr(p.scriptBlocks).length) return p.scriptBlocks;
    if(arr(p.scriptSections).length) return p.scriptSections.map((s,i)=>({id:s.id,title:s.title,content:s.content,type:'speech',order:i}));
    const s=p.script||{};
    const defs=[
      ['abertura','Abertura','Confirmar se está falando com a pessoa certa e conquistar permissão para continuar.'],
      ['contexto','Contextualização','Explicar por que o contato faz sentido sem alongar a conversa.'],
      ['diagnostico','Diagnóstico','Entender processo atual, dor, urgência e autoridade de decisão.'],
      ['valor','Proposta de valor','Conectar a solução diretamente ao problema relatado pelo lead.'],
      ['fechamento','Fechamento','Definir um próximo passo concreto, com data e responsável.'],
      ['whatsapp','Mensagem pós-ligação','Registrar a mensagem curta que pode ser enviada após a tentativa.']
    ];
    return defs.map((d,i)=>({id:d[0],title:d[1],type:'speech',content:text(s[d[0]]||''),objective:d[2],order:i}));
  }
  function normalizeObjection(o={},i=0){
    if(typeof o==='string') o={nome:o};
    return {
      id:o.id||('obj_'+slug(o.nome||o.name||'objecao')+'_'+i),
      nome:text(o.nome||o.name||('Objeção '+(i+1))),
      categoria:text(o.categoria||o.category||'Geral'),
      frases:arr(o.frases||o.triggers).length?arr(o.frases||o.triggers).map(text):[],
      resposta:text(o.resposta||o.response||''),
      alternativa:text(o.alternativa||o.alternative||''),
      pergunta:text(o.pergunta||o.deepQuestion||''),
      argumento:text(o.argumento||o.proof||''),
      proximaAcao:text(o.proximaAcao||o.nextAction||''),
      segmentos:arr(o.segmentos||o.segments).map(text),
      etapas:arr(o.etapas||o.stages).map(text),
      tags:arr(o.tags).map(text)
    };
  }
  function syncLegacyScript(pb){
    pb.script=Object.assign({},pb.script||{});
    const map={abertura:/abert/i,contexto:/context/i,diagnostico:/diagn/i,valor:/valor|proposta/i,fechamento:/fech/i,whatsapp:/whats/i};
    for(const [key,re] of Object.entries(map)){
      const b=pb.scriptBlocks.find(x=>x.id===key||re.test(x.title));
      if(b) pb.script[key]=b.content;
    }
    pb.scriptSections=pb.scriptBlocks.map(b=>({id:b.id,title:b.title,content:b.content}));
    return pb;
  }
  function normalizePlaybook(p={}){
    const blocks=legacyBlocks(p).map(normalizeBlock).sort((a,b)=>a.order-b.order).map((b,i)=>Object.assign(b,{order:i}));
    const out={
      id:p.id||uid('pb'),
      nome:text(p.nome||p.name||'Playbook sem nome'),
      segmento:text(p.segmento||p.segment||'Geral'),
      etapa:text(p.etapa||p.stage||'Primeiro contato'),
      canal:text(p.canal||p.channel||'Ligação'),
      objetivo:text(p.objetivo||p.goal||'Conduzir a conversa até um próximo passo claro.'),
      descricao:text(p.descricao||p.description||''),
      scriptBlocks:blocks,
      scriptSections:[],
      script:Object.assign({},p.script||{}),
      objecoes:arr(p.objecoes).map(normalizeObjection),
      cadencia:arr(p.cadencia).map(text),
      version:Number(p.version||1),
      updatedAt:p.updatedAt||new Date().toISOString()
    };
    return syncLegacyScript(out);
  }

  function defaultPlaybook(){
    return normalizePlaybook({
      id:'pb_garimpo',
      nome:'Primeiro contato — Garimpo',
      segmento:'Geral',
      etapa:'Primeiro contato',
      canal:'Ligação',
      objetivo:'Confirmar o cenário atual, identificar perda de oportunidades e marcar uma conversa rápida.',
      scriptBlocks:[
        {id:'abertura',title:'1. Abertura',type:'speech',objective:'Confirmar o decisor e obter permissão para continuar.',content:'Oi, {nome_lead}, tudo bem? Aqui é {responsavel}. Eu estava analisando a forma como a {empresa} recebe e acompanha os clientes que chegam pelo WhatsApp. Posso te explicar em menos de um minuto o motivo do contato?'},
        {id:'contexto',title:'2. Contextualização',type:'speech',objective:'Mostrar uma hipótese de problema sem afirmar algo que ainda não foi confirmado.',content:'Percebi um ponto que pode estar fazendo vocês perderem alguns agendamentos sem perceber, principalmente quando o cliente chama, não recebe retorno no momento certo e acaba procurando outro local.'},
        {id:'canais',title:'3. Canais de entrada',type:'question-multi',objective:'Entender por onde os contatos chegam.',content:'Por onde os clientes costumam entrar em contato com vocês?',options:['WhatsApp','Instagram','Telefone','Site','Indicação']},
        {id:'responsavel',title:'4. Responsável pelos retornos',type:'question-single',objective:'Mapear autoridade e processo operacional.',content:'Existe uma pessoa responsável por acompanhar e retornar todos esses contatos?',options:['Sim','Não','Às vezes']},
        {id:'tempo_resposta',title:'5. Tempo de resposta',type:'question-single',objective:'Medir urgência e risco de perda.',content:'Quanto tempo normalmente leva para um cliente receber resposta?',options:['Imediato','Até 1 hora','Algumas horas','No outro dia']},
        {id:'aprofundamento',title:'6. Pergunta de aprofundamento',type:'speech',objective:'Transformar a resposta em impacto comercial.',content:'E quando o cliente chama, não agenda e some, vocês conseguem identificar quem precisa receber um retorno depois?'},
        {id:'valor',title:'7. Proposta de valor',type:'speech',objective:'Conectar a solução à dor informada.',content:'A ideia é organizar contatos, retornos e próximos passos em uma rotina simples para aumentar agendamentos e reduzir clientes perdidos sem depender apenas de anúncio.'},
        {id:'fechamento',title:'8. Próximo passo',type:'speech',objective:'Conseguir um compromisso concreto.',content:'Faz sentido eu te mostrar isso em uma reunião rápida de 10 minutos? Você consegue hoje no fim da tarde ou amanhã de manhã?'},
        {id:'whatsapp',title:'Mensagem pós-ligação',type:'action',objective:'Enviar uma mensagem curta caso seja necessário complementar o contato.',content:'Oi, {nome_lead}. Tentei falar contigo sobre uma forma de organizar melhor os contatos e retornos da {empresa}. Posso te explicar por aqui?'}
      ],
      objecoes:[
        {nome:'Sem tempo',categoria:'Tempo',frases:['agora não posso','estou ocupado','sem tempo'],resposta:'Claro. Melhor eu te chamar no fim da tarde ou amanhã de manhã?',alternativa:'Sem problema. Me diz apenas qual horário costuma ser mais tranquilo e eu deixo agendado.',pergunta:'Qual horário é mais tranquilo para você conseguir avaliar isso com calma?',proximaAcao:'Agendar retorno com data e horário.'},
        {nome:'Manda no WhatsApp',categoria:'Canal',frases:['manda no whats','me envia mensagem'],resposta:'Te mando sim. Para eu não mandar algo genérico, hoje vocês querem melhorar mais atendimento, agendamento ou retorno?',pergunta:'Qual desses pontos mais incomoda hoje?',proximaAcao:'Enviar mensagem personalizada e programar retorno.'},
        {nome:'Já tenho sistema',categoria:'Concorrente',frases:['já uso sistema','já tenho crm'],resposta:'Perfeito. A ideia não é trocar algo que já funciona sem entender primeiro. Hoje esse sistema acompanha também os contatos que chamam, não marcam e precisam receber retorno depois?',pergunta:'Qual parte do sistema atual mais ajuda vocês e qual ainda depende de controle manual?',argumento:'Comparar acompanhamento de leads, follow-ups e facilidade operacional.',proximaAcao:'Mapear lacuna do sistema atual.'},
        {nome:'Está caro',categoria:'Preço',frases:['caro','sem orçamento','não cabe'],resposta:'Entendo. Antes de falar de investimento, vale comparar com quantos agendamentos deixam de acontecer quando os retornos não são acompanhados. Hoje vocês conseguem medir isso?',pergunta:'Qual seria o impacto de recuperar alguns desses clientes por semana?',argumento:'Levar a conversa para retorno financeiro e custo de oportunidade.',proximaAcao:'Quantificar impacto e revisar proposta.'},
        {nome:'Preciso falar com meu sócio',categoria:'Autoridade',frases:['falar com sócio','consultar sócia'],resposta:'Perfeito. Para facilitar, quais informações ele precisa ver para vocês decidirem juntos?',pergunta:'Faz sentido marcarmos uma conversa com vocês dois?',proximaAcao:'Agendar reunião com todos os decisores.'}
      ],
      cadencia:['Dia 0 — Ligação','Dia 0 — WhatsApp pós-ligação','Dia 2 — Follow-up','Dia 4 — Segunda tentativa']
    });
  }
  function defaults(){return [defaultPlaybook()]}
  function getPlaybooks(){
    let list=read(PB_KEY,[]);
    if(!Array.isArray(list)||!list.length) list=defaults();
    const normalized=list.map(normalizePlaybook);
    if(JSON.stringify(list)!==JSON.stringify(normalized)) write(PB_KEY,normalized);
    return normalized;
  }
  function savePlaybooks(list){
    const normalized=(Array.isArray(list)?list:[]).map(normalizePlaybook);
    write(PB_KEY,normalized.length?normalized:defaults());
    try{document.dispatchEvent(new CustomEvent('crm:playbooks-updated',{detail:{count:normalized.length}}))}catch(e){}
    return normalized;
  }
  function choosePlaybook(lead){
    const list=getPlaybooks(),seg=norm(lead?.segmento),stage=norm(lead?.followupEtapa||lead?.followup||'');
    return list.find(p=>p.segmento&&norm(p.segmento)!=='geral'&&seg.includes(norm(p.segmento)))||list.find(p=>p.etapa&&stage.includes(norm(p.etapa)))||list[0]||defaultPlaybook();
  }
  function fill(content,lead){
    const map={
      nome_lead:lead?.nome||lead?.empresa||'',empresa:lead?.empresa||lead?.nome||'',cidade:lead?.cidade||'',segmento:lead?.segmento||'',campanha:lead?.campanha||'',origem:lead?.origem||'',etapa_pipeline:lead?.pipeline||lead?.etapa||'',followup:lead?.followupEtapa||lead?.followup||'',responsavel:lead?.responsavel||'Você',telefone:lead?.telefone||'',produto:lead?.produto||'CRM',dor:lead?.dor||lead?.callWorkspace?.notes?.pain||'perda de contatos',ultima_interacao:lead?.ultimoResultado||'',proxima_acao:lead?.proximaAcao||''
    };
    return text(content).replace(/\{([^}]+)\}/g,(m,k)=>map[k]??m);
  }
  function objectionScore(obj,ctx={}){
    const hay=norm([ctx.query,ctx.block?.title,ctx.block?.content,ctx.lead?.segmento,ctx.lead?.ultimoResultado,ctx.lead?.observacoes].join(' '));
    let score=0;
    if(ctx.category&&ctx.category!=='Todos'&&norm(obj.categoria)===norm(ctx.category))score+=30;
    if(arr(obj.segmentos).some(x=>norm(ctx.lead?.segmento).includes(norm(x))))score+=25;
    if(arr(obj.etapas).some(x=>norm(ctx.block?.title).includes(norm(x))))score+=20;
    if(arr(obj.frases).some(x=>hay.includes(norm(x))))score+=40;
    if(hay.includes(norm(obj.nome)))score+=25;
    return score;
  }
  function categories(playbook){return ['Todos',...new Set(arr(playbook?.objecoes).map(o=>o.categoria||'Geral'))]}

  W.CRMScriptEngine=Object.freeze({
    version:'98.7',PB_KEY,BLOCK_TYPES,BLOCK_LABELS,normalizeOption,normalizeBlock,normalizeObjection,normalizePlaybook,defaultPlaybook,defaults,getPlaybooks,savePlaybooks,choosePlaybook,fill,objectionScore,categories,uid,clone
  });
})(window);
