/* Script original 06 */
(function(){
  'use strict';
  if(window.__crmGarimpoLeadsV7) return;
  window.__crmGarimpoLeadsV7 = true;

  const GAR_KEY='outbounder_garimpo_leads_v7';
  const GAR_CFG='outbounder_garimpo_config_v7';
  const $=(s,root=document)=>root.querySelector(s);
  const $$=(s,root=document)=>Array.from(root.querySelectorAll(s));
  const esc=(v)=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const digits=(v)=>String(v||'').replace(/\D/g,'');
  const norm=(v)=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const today=()=>new Date().toISOString().slice(0,10);
  const addDays=(n)=>{const d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};
  const brl=(v)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v)||0);
  const toast=(msg,type='success')=>{try{typeof showToast==='function'?showToast(msg,type):alert(msg)}catch(e){console.log(msg)}};
  const getLeads=()=>{try{return Array.isArray(leads)?leads:[]}catch(e){return []}};
  const persistLeads=()=>{try{typeof saveLeads==='function'&&saveLeads()}catch(e){}};
  const rerender=()=>{try{typeof renderAll==='function'&&renderAll()}catch(e){};try{typeof renderGarimpoLeadsV7==='function'&&renderGarimpoLeadsV7()}catch(e){}};
  const load=(k,d)=>{try{const raw=localStorage.getItem(k);return raw?JSON.parse(raw):d}catch(e){return d}};
  const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
  let mined=load(GAR_KEY,[]);
  let selected=new Set();
  let garSearch='';
  let garFit='';
  let garSort='score';

  const iconPick='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M21 21l-4.35-4.35"/><circle cx="11" cy="11" r="8"/><path d="M11 7v8M7 11h8"/></svg>';
  const iconSpark='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/></svg>';
  const iconUsers='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>';

  const SEG_PRESETS={
    'Barbearias': {ticket:1200, palavras:['barbearia','barba','cabelo masculino','agenda lotada','whatsapp'], pains:['agenda manual','baixo retorno de clientes','pouca recompra','falta de controle de indicações']},
    'Restaurantes': {ticket:2500, palavras:['restaurante','cardápio digital','delivery','iFood','mesa'], pains:['ticket médio baixo','cardápio sem conversão','pouca recorrência','pedido perdido no atendimento']},
    'Clínicas': {ticket:3500, palavras:['clínica','consulta','agendamento','procedimento','convênio'], pains:['faltas na agenda','follow-up fraco','leads sem retorno','baixa conversão de avaliação']},
    'Imobiliárias': {ticket:5000, palavras:['imobiliária','corretor','venda','aluguel','imóvel'], pains:['leads frios','demora no atendimento','pouca qualificação','follow-up manual']},
    'Academias': {ticket:1800, palavras:['academia','musculação','personal','treino','matrícula'], pains:['churn alto','renovação baixa','leads sem contato','pouca indicação']},
    'Lojas locais': {ticket:1500, palavras:['loja','varejo','moda','calçados','atendimento'], pains:['baixo giro','pouca recompra','atendimento sem padrão','clientes sem cadastro']},
    'Serviços B2B': {ticket:4500, palavras:['consultoria','empresa','serviços','B2B','contrato'], pains:['prospecção irregular','pipeline sem previsibilidade','reuniões sem próximo passo','perda por timing']}
  };

  const NAME_BANK={
    'Barbearias':['Navalha Prime','Barber Club','Dom Barbeiro','Studio Old School','Barba Forte','Corte Nobre','Império da Barba','Barbearia Central','Alpha Barber','Caxias Barber House','The King Barber','Estação da Barba'],
    'Restaurantes':['Cantina Bella','Sabor da Serra','Bistrô Central','Casa do Prato','Forno & Mesa','Tempero Gaúcho','Villa Gourmet','Mesa Nobre','Dona Massa','Parrilla Sul'],
    'Clínicas':['Clínica Vita','Saúde Prime','Instituto Bem Estar','Clínica Essenza','Odonto Serra','Vita Care','Clínica Renovare','Mais Saúde Centro'],
    'Imobiliárias':['Serra Imóveis','Prime Lar','Morada Sul','Habita Serra','Portal Imobiliário','Caxias Homes','Alto Padrão Imóveis'],
    'Academias':['Force Gym','Studio Movimento','Academia Evolução','Iron Fit','Body Prime','Move Center','Arena Fitness'],
    'Lojas locais':['Loja Central','Moda Serra','Casa Bella','Outlet Avenida','Empório Local','Vitrine Sul','Ponto do Cliente'],
    'Serviços B2B':['Nexo Consultoria','Elo Empresarial','Prime Soluções','Triad Serviços','Radar Comercial','Base Performance','Axis B2B']
  };
  const BAIRROS=['Centro','São Pelegrino','Exposição','Pio X','Madureira','Cidade Nova','Santa Catarina','Panazzolo','Floresta','Nossa Sra. de Lourdes','Jardim América','Desvio Rizzo'];
  const FIRST=['Ana','Bruno','Carlos','Daniela','Eduardo','Fernanda','Gabriel','Helena','Igor','Juliana','Lucas','Marina','Rafael','Patrícia','Sandro','Camila'];
  const LAST=['Silva','Santos','Costa','Oliveira','Pereira','Moura','Almeida','Rossi','Ferreira','Lima','Souza','Melo'];

  function randomPhone(seed){
    const base=String(Math.abs(hash(seed))).padEnd(8,'7').slice(0,8);
    return `(54) 9${base.slice(0,4)}-${base.slice(4,8)}`;
  }
  function hash(str){let h=0;String(str).split('').forEach(ch=>{h=((h<<5)-h)+ch.charCodeAt(0);h|=0});return h;}
  function emailFrom(name){const n=norm(name).replace(/\s+/g,'.');return `contato@${n.replace(/\./g,'').slice(0,18)}.com.br`;}
  function siteFrom(name){return `https://www.${norm(name).replace(/\s+/g,'').slice(0,22)}.com.br`;}
  function leadScore(item){
    let s=42;
    if(item.telefone) s+=18;
    if(item.email) s+=10;
    if(item.site) s+=8;
    if(item.sinais?.includes('WhatsApp ativo')) s+=10;
    if(item.sinais?.includes('Muitas avaliações')) s+=8;
    if(item.fit==='Alto') s+=12;
    if(item.fit==='Médio') s+=6;
    if(item.dor&&item.dor.length>4) s+=5;
    s += Math.min(12, Math.round((Number(item.valor)||0)/800));
    return Math.max(0,Math.min(100,s));
  }
  function priorityFromScore(s){return s>=78?'Alta':s>=56?'Média':'Baixa'}
  function duplicateOf(item){
    const ns=norm(item.nome), tel=digits(item.telefone), em=norm(item.email);
    return getLeads().find(l=>norm(l.nome)===ns || (tel&&digits(l.telefone)===tel) || (em&&norm(l.email)===em));
  }
  function buildExternalLinks(segmento,cidade,kw){
    const q=encodeURIComponent(`${segmento} ${cidade} ${kw||''}`.trim());
    return {
      maps:`https://www.google.com/maps/search/${q}`,
      google:`https://www.google.com/search?q=${q}+telefone+whatsapp`,
      instagram:`https://www.google.com/search?q=site%3Ainstagram.com+${q}`,
      linkedin:`https://www.google.com/search?q=site%3Alinkedin.com%2Fcompany+${q}`
    };
  }
  function createMockResults(opts){
    const segmento=opts.segmento||'Barbearias';
    const cidade=opts.cidade||'Caxias do Sul - RS';
    const preset=SEG_PRESETS[segmento]||SEG_PRESETS['Serviços B2B'];
    const names=(NAME_BANK[segmento]||NAME_BANK['Serviços B2B']);
    const qtd=Math.max(4,Math.min(60,Number(opts.qtd)||12));
    const baseTicket=Number(opts.ticket)||preset.ticket||1500;
    const arr=[];
    for(let i=0;i<qtd;i++){
      const rawName=names[i%names.length] + (i>=names.length?` ${Math.floor(i/names.length)+1}`:'');
      const bairro=BAIRROS[Math.abs(hash(rawName+cidade+i))%BAIRROS.length];
      const responsavel=`${FIRST[Math.abs(hash(rawName+'a'))%FIRST.length]} ${LAST[Math.abs(hash(rawName+'b'))%LAST.length]}`;
      const sinais=[];
      if(i%2===0) sinais.push('WhatsApp ativo');
      if(i%3!==0) sinais.push('Perfil comercial');
      if(i%4===0) sinais.push('Muitas avaliações');
      if(i%5===0) sinais.push('Sem CRM aparente');
      const fit=i%5===0?'Alto':i%3===0?'Médio':'Alto';
      const dor=preset.pains[Math.abs(hash(rawName+i))%preset.pains.length];
      const valor=Math.round((baseTicket*(0.75+(Math.abs(hash(rawName))%70)/100))/100)*100;
      const lead={
        id:'gar_'+Date.now()+'_'+i+'_'+Math.random().toString(36).slice(2,6),
        nome:rawName,
        segmento,
        cidade,
        bairro,
        responsavel,
        telefone:randomPhone(rawName+cidade),
        email:emailFrom(rawName),
        site:siteFrom(rawName),
        instagram:`@${norm(rawName).replace(/\s+/g,'').slice(0,18)}`,
        origem:'Garimpo',
        fonte: opts.fonte || 'Simulador local / pesquisa assistida',
        fit,
        dor,
        sinais,
        valor,
        status:'Novo',
        nota:`Lead encontrado por garimpo. Possível dor: ${dor}. Sinais: ${sinais.join(', ')}. Bairro: ${bairro}.`,
        criadoEm:new Date().toISOString()
      };
      lead.score=leadScore(lead);
      lead.prioridade=priorityFromScore(lead.score);
      lead.links=buildExternalLinks(segmento,cidade,opts.keywords);
      lead.duplicado=!!duplicateOf(lead);
      arr.push(lead);
    }
    return arr.sort((a,b)=>b.score-a.score);
  }
  function saveMined(){save(GAR_KEY,mined.slice(0,500));}
  function cfg(){return load(GAR_CFG,{segmento:'Barbearias',cidade:'Caxias do Sul - RS',keywords:'whatsapp agenda',qtd:12,ticket:''})}
  function saveCfg(){
    const data={segmento:$('#garSegmento')?.value,cidade:$('#garCidade')?.value,keywords:$('#garKeywords')?.value,qtd:$('#garQtd')?.value,ticket:$('#garTicket')?.value,endpoint:$('#garApiEndpoint')?.value,apiKey:$('#garApiKey')?.value};
    save(GAR_CFG,data);
  }

  function ensureStyle(){
    if($('#garimpoStyleV7'))return;
    const style=document.createElement('style');style.id='garimpoStyleV7';style.textContent=`
      .gar-shell{gap:18px}.gar-hero{display:grid;grid-template-columns:1.2fr .8fr;gap:16px;background:linear-gradient(135deg,var(--navy) 0%,var(--navy-3) 100%);border-radius:var(--radius);padding:24px;color:#fff;box-shadow:var(--shadow-md)}
      .gar-hero h2{font-family:'Inter Tight','Inter',sans-serif;font-size:23px;font-weight:800;letter-spacing:-.025em;margin:0 0 8px}.gar-hero p{opacity:.76;line-height:1.65;max-width:68ch}.gar-hero-panel{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);border-radius:14px;padding:14px}.gar-hero-panel strong{display:block;font-size:13px;margin-bottom:6px}.gar-hero-panel span{display:block;font-size:12.5px;opacity:.75;line-height:1.55}
      .gar-grid{display:grid;grid-template-columns:360px 1fr;gap:18px;align-items:start}.gar-form{display:grid;gap:12px}.gar-source-tabs{display:flex;gap:4px;background:var(--surface-2);border:1px solid var(--border);padding:4px;border-radius:11px}.gar-source-tabs button{flex:1;border:none;background:transparent;border-radius:8px;padding:7px 8px;font-size:12px;font-weight:700;color:var(--text-3);cursor:pointer}.gar-source-tabs button.active{background:var(--surface);color:var(--text);box-shadow:var(--shadow-xs)}
      .gar-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.gar-kpi{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px}.gar-kpi .v{font-family:'Inter Tight','Inter',sans-serif;font-size:24px;font-weight:800;letter-spacing:-.03em;color:var(--text);line-height:1}.gar-kpi .l{font-size:11.5px;color:var(--text-3);margin-top:5px;font-weight:600}.gar-toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.gar-table-wrap{overflow-x:auto}.gar-score{display:inline-flex;align-items:center;justify-content:center;min-width:38px;height:24px;border-radius:7px;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:800}.gar-score.hi{background:#dcfce7;color:#166534}.gar-score.md{background:#fef3c7;color:#92400e}.gar-score.lo{background:#fee2e2;color:#991b1b}
      .gar-fit{font-size:11px;font-weight:800;border-radius:999px;padding:3px 8px;display:inline-flex}.gar-fit.Alto{background:#dcfce7;color:#166534}.gar-fit.Médio{background:#fef3c7;color:#92400e}.gar-fit.Baixo{background:#fee2e2;color:#991b1b}.gar-signal{display:inline-flex;border:1px solid var(--border);background:var(--surface-2);border-radius:999px;padding:2px 7px;font-size:10.5px;color:var(--text-3);font-weight:600;margin:1px}.gar-dupe{background:#fff7ed!important;color:#9a3412!important;border-color:#fed7aa!important}.gar-api-box{display:none}.gar-api-box.active{display:grid;gap:10px}.gar-empty{padding:42px 20px;text-align:center;color:var(--text-3)}.gar-empty b{display:block;color:var(--text);margin-bottom:4px}.gar-preview{background:var(--surface-2);border:1px solid var(--border);border-radius:12px;padding:12px;font-size:12.5px;color:var(--text-2);line-height:1.6}.gar-links{display:flex;gap:5px;flex-wrap:wrap}.gar-links a{font-size:11.5px;padding:5px 8px;border:1px solid var(--border);border-radius:7px;background:var(--surface);color:var(--text-2);font-weight:700}.gar-links a:hover{background:var(--navy);border-color:var(--navy);color:#fff}.gar-script-box{white-space:pre-wrap;background:var(--surface-2);border:1px solid var(--border);border-radius:10px;padding:12px;font-size:12.5px;line-height:1.65;color:var(--text-2);max-height:180px;overflow:auto}
      @media(max-width:1050px){.gar-grid,.gar-hero{grid-template-columns:1fr}.gar-kpis{grid-template-columns:repeat(2,1fr)}}@media(max-width:640px){.gar-kpis{grid-template-columns:1fr}}
    `;document.head.appendChild(style);
  }

  function makeNavButton(cls,view,label,title){
    const b=document.createElement('button');b.className=cls;b.dataset.view=view;b.title=title||label;b.innerHTML=iconPick+(label?`<span>${label}</span>`:'');return b;
  }
  function ensureNavigation(){
    if(!$('.sidebar-nav [data-view="garimpo"]')){
      const ref=$('.sidebar-nav [data-view="leads"]');
      const b=makeNavButton('nav-item','garimpo','Garimpo de leads','Garimpo de leads');
      ref?.insertAdjacentElement('afterend',b);
    }
    if(!$('.rail [data-view="garimpo"]')){
      const ref=$('.rail [data-view="leads"]');
      const b=makeNavButton('rail-btn','garimpo','','Garimpo de leads');
      ref?.insertAdjacentElement('afterend',b);
    }
    if(!$('.topbar-tabs [data-view="garimpo"]')){
      const ref=$('.topbar-tabs [data-view="leads"]');
      const b=document.createElement('button');b.className='tab';b.dataset.view='garimpo';b.textContent='Garimpo';ref?.insertAdjacentElement('afterend',b);
    }
    if(!$('.module-grid [data-view="garimpo"]')){
      const grid=$('.module-grid');
      const b=document.createElement('button');b.className='module-btn';b.dataset.view='garimpo';b.innerHTML=`<div class="module-icon stat-icon sky">${iconPick}</div><div class="module-label">Garimpo</div><div class="module-desc">Encontrar e qualificar novos leads</div>`;grid?.insertBefore(b,grid.firstElementChild);
    }
    const cta=$('.home-ctas');
    if(cta&&!$('#homeGarimpoBtn')){const b=document.createElement('button');b.id='homeGarimpoBtn';b.className='home-btn-primary';b.dataset.view='garimpo';b.textContent='Garimpar leads';cta.appendChild(b);}
  }

  function ensurePage(){
    if($('#garimpo'))return;
    const c=cfg();
    const section=document.createElement('section');
    section.id='garimpo';section.className='view grid-view gar-shell';
    section.innerHTML=`
      <div class="section-header"><div><div class="section-title-text">Garimpo de Leads</div><div class="section-sub">Encontre, qualifique e envie oportunidades direto para o CRM.</div></div><div class="crm-report-actions"><button class="btn btn-sm" id="garExportBtn">Exportar garimpo</button><button class="btn btn-sm btn-primary" id="garAddSelectedTop">Adicionar selecionados ao CRM</button></div></div>
      <div class="gar-hero"><div><h2>Prospecção ativa com scoring comercial</h2><p>Use o garimpo para buscar empresas por nicho e cidade, priorizar as melhores oportunidades e evitar que leads frios entrem no funil sem critério.</p><div class="gar-links" id="garHeroLinks" style="margin-top:14px"></div></div><div class="gar-hero-panel"><strong>Como usar de verdade</strong><span>O modo local gera e qualifica uma lista para você operar agora. Para buscar dados reais automaticamente, conecte um endpoint próprio, Google Places/Maps API, planilha enriquecida ou provedor autorizado no bloco de integração.</span></div></div>
      <div class="gar-grid">
        <div class="card"><div class="card-header"><div><div class="card-title">Critérios de garimpo</div><div class="card-sub">Defina o perfil ideal de cliente</div></div></div><div class="card-body gar-form">
          <div class="gar-source-tabs" id="garSourceTabs"><button class="active" data-gar-source="local">Local</button><button data-gar-source="api">API</button><button data-gar-source="manual">Manual</button></div>
          <div class="field"><label>Segmento / Nicho</label><select id="garSegmento">${Object.keys(SEG_PRESETS).map(s=>`<option ${s===c.segmento?'selected':''}>${esc(s)}</option>`).join('')}</select></div>
          <div class="field"><label>Cidade / Região</label><input id="garCidade" value="${esc(c.cidade||'Caxias do Sul - RS')}" placeholder="Ex: Caxias do Sul - RS"></div>
          <div class="field"><label>Palavras-chave</label><input id="garKeywords" value="${esc(c.keywords||'whatsapp agenda')}" placeholder="Ex: whatsapp, agenda, delivery"></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div class="field"><label>Quantidade</label><input id="garQtd" type="number" min="4" max="60" value="${esc(c.qtd||12)}"></div><div class="field"><label>Ticket estimado</label><input id="garTicket" type="number" min="0" value="${esc(c.ticket||'')}" placeholder="Automático"></div></div>
          <div class="gar-api-box" id="garApiBox"><div class="gar-preview"><strong>Integração pronta:</strong> seu endpoint deve retornar uma lista com nome, telefone, email, site, cidade, segmento e observações. O CRM calcula score e deduplica.</div><div class="field"><label>Endpoint de busca</label><input id="garApiEndpoint" value="${esc(c.endpoint||'')}" placeholder="https://seu-backend.com/leads/search"></div><div class="field"><label>Chave/API token</label><input id="garApiKey" value="${esc(c.apiKey||'')}" placeholder="Opcional"></div></div>
          <button class="btn btn-primary" id="garMineBtn" style="justify-content:center">${iconSpark} Garimpar leads agora</button>
          <button class="btn" id="garOpenSourcesBtn" style="justify-content:center">Abrir fontes de pesquisa</button>
          <div class="gar-preview" id="garStrategyBox"></div>
        </div></div>
        <div style="display:grid;gap:14px">
          <div class="gar-kpis" id="garKpis"></div>
          <div class="card" style="overflow:hidden"><div class="leads-toolbar"><div class="search-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><input class="search-input" type="search" id="garSearch" placeholder="Buscar empresa, bairro, dor..."></div><div class="sep"></div><div class="filter-chips" id="garFitFilters"><button class="chip active" data-gar-fit="">Todos</button><button class="chip" data-gar-fit="Alto">Fit alto</button><button class="chip" data-gar-fit="Médio">Fit médio</button><button class="chip" data-gar-fit="dupes">Duplicados</button></div><div style="margin-left:auto;display:flex;gap:6px"><button class="btn btn-sm" id="garTopBtn">Selecionar melhores</button><button class="btn btn-sm" id="garClearBtn">Limpar</button></div></div><div class="gar-table-wrap"><table class="data-table"><thead><tr><th style="width:36px"><input type="checkbox" id="garSelectAll"></th><th>Score</th><th>Empresa</th><th>Fit / Sinais</th><th>Contato</th><th>Valor</th><th>Fontes</th><th></th></tr></thead><tbody id="garTable"></tbody></table></div></div>
          <div class="card"><div class="card-header"><div><div class="card-title">Script rápido para abordagem</div><div class="card-sub">Mensagem baseada no lead selecionado</div></div><button class="btn btn-sm" id="garCopyScriptBtn">Copiar</button></div><div class="card-body"><div class="gar-script-box" id="garScriptBox">Selecione um lead para gerar uma abordagem.</div></div></div>
        </div>
      </div>`;
    const leadsPage=$('#leads');(leadsPage?.parentNode||$('main'))?.insertBefore(section,leadsPage||null);
  }

  function currentOpts(){return {segmento:$('#garSegmento')?.value||'Barbearias',cidade:$('#garCidade')?.value||'Caxias do Sul - RS',keywords:$('#garKeywords')?.value||'',qtd:$('#garQtd')?.value||12,ticket:$('#garTicket')?.value||'',fonte:'Garimpo local'}}
  function renderStrategy(){
    const box=$('#garStrategyBox');if(!box)return;
    const o=currentOpts();const p=SEG_PRESETS[o.segmento]||SEG_PRESETS['Serviços B2B'];
    box.innerHTML=`<strong>Estratégia sugerida:</strong><br>1) Buscar empresas de <b>${esc(o.segmento)}</b> em <b>${esc(o.cidade)}</b>.<br>2) Priorizar sinais: ${p.palavras.slice(0,4).map(esc).join(', ')}.<br>3) Dor provável para abordagem: ${esc(p.pains[0])}.<br>4) Primeiro contato recomendado: WhatsApp curto + pergunta de diagnóstico.`;
    const links=buildExternalLinks(o.segmento,o.cidade,o.keywords);
    const hero=$('#garHeroLinks');if(hero)hero.innerHTML=`<a href="${links.maps}" target="_blank">Google Maps</a><a href="${links.google}" target="_blank">Google</a><a href="${links.instagram}" target="_blank">Instagram</a><a href="${links.linkedin}" target="_blank">LinkedIn</a>`;
  }
  function filtered(){
    let arr=[...mined];
    if(garSearch){const q=norm(garSearch);arr=arr.filter(x=>norm([x.nome,x.segmento,x.cidade,x.bairro,x.dor,(x.sinais||[]).join(' ')].join(' ')).includes(q));}
    if(garFit==='dupes')arr=arr.filter(x=>x.duplicado||duplicateOf(x));
    else if(garFit)arr=arr.filter(x=>x.fit===garFit);
    arr.forEach(x=>{x.duplicado=!!duplicateOf(x);x.score=leadScore(x);x.prioridade=priorityFromScore(x.score);});
    return arr.sort((a,b)=>garSort==='valor'?(b.valor||0)-(a.valor||0):(b.score||0)-(a.score||0));
  }
  function renderKpis(){
    const box=$('#garKpis');if(!box)return;
    const total=mined.length,dupes=mined.filter(x=>x.duplicado||duplicateOf(x)).length,avg=total?Math.round(mined.reduce((s,x)=>s+(Number(x.score)||0),0)/total):0,val=mined.filter(x=>selected.has(x.id)).reduce((s,x)=>s+(Number(x.valor)||0),0);
    box.innerHTML=[['Encontrados',total,'Leads garimpados'],['Selecionados',selected.size,'Prontos para CRM'],['Score médio',avg,'Qualidade da lista'],['Valor selecionado',brl(val),'Potencial estimado']].map(k=>`<div class="gar-kpi"><div class="v">${esc(k[0]==='Score médio'?k[1]:k[1])}</div><div class="l">${esc(k[0])}</div><div class="crm-dashboard-note">${esc(k[2])}${k[0]==='Encontrados'&&dupes?` • ${dupes} duplicado(s)`:''}</div></div>`).join('');
  }
  function scoreClass(s){return s>=78?'hi':s>=55?'md':'lo'}
  function renderTable(){
    const tb=$('#garTable');if(!tb)return;
    const arr=filtered();
    if(!arr.length){tb.innerHTML=`<tr><td colspan="8"><div class="gar-empty"><b>Nenhum lead garimpado ainda</b>Escolha o segmento e clique em “Garimpar leads agora”.</div></td></tr>`;renderKpis();return;}
    tb.innerHTML=arr.map(x=>{
      const checked=selected.has(x.id);const tel=digits(x.telefone);const dupe=x.duplicado||duplicateOf(x);
      return `<tr data-gar-id="${esc(x.id)}" class="${checked?'selected-row':''}">
        <td onclick="event.stopPropagation()"><input type="checkbox" class="gar-cb" data-gar-id="${esc(x.id)}" ${checked?'checked':''}></td>
        <td><span class="gar-score ${scoreClass(x.score)}">${x.score}</span></td>
        <td><div style="font-weight:800;color:var(--text);font-size:13px">${esc(x.nome)} ${dupe?'<span class="tag gar-dupe">já existe</span>':''}</div><div style="font-size:11.5px;color:var(--text-3);margin-top:2px">${esc(x.bairro||'')} • ${esc(x.cidade||'')}</div><div style="font-size:11.5px;color:var(--text-3);margin-top:2px">Dor: ${esc(x.dor||'—')}</div></td>
        <td><span class="gar-fit ${esc(x.fit)}">${esc(x.fit)}</span><div style="margin-top:5px">${(x.sinais||[]).slice(0,3).map(s=>`<span class="gar-signal">${esc(s)}</span>`).join('')}</div></td>
        <td><div style="font-size:12px;color:var(--text-2)">${esc(x.responsavel||'Decisor')}</div><div style="display:flex;gap:4px;margin-top:5px">${x.telefone?`<a class="row-action wa" href="https://wa.me/55${tel}" target="_blank" onclick="event.stopPropagation()">Whats</a>`:''}${x.email?`<a class="row-action" href="mailto:${esc(x.email)}" onclick="event.stopPropagation()">Email</a>`:''}${x.site?`<a class="row-action" href="${esc(x.site)}" target="_blank" onclick="event.stopPropagation()">Site</a>`:''}</div></td>
        <td style="font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:800">${brl(x.valor)}</td>
        <td><div class="gar-links"><a href="${x.links?.maps||'#'}" target="_blank" onclick="event.stopPropagation()">Maps</a><a href="${x.links?.google||'#'}" target="_blank" onclick="event.stopPropagation()">Google</a><a href="${x.links?.instagram||'#'}" target="_blank" onclick="event.stopPropagation()">Insta</a></div></td>
        <td onclick="event.stopPropagation()"><button class="row-action primary gar-one-add" data-gar-id="${esc(x.id)}">Adicionar</button></td>
      </tr>`;
    }).join('');
    bindRows();renderKpis();
  }
  function bindRows(){
    $$('#garTable tr[data-gar-id]').forEach(r=>r.addEventListener('click',()=>{const id=r.dataset.garId;const x=mined.find(m=>m.id===id);if(x){selected.add(id);renderScript(x);renderTable();}}));
    $$('.gar-cb').forEach(cb=>cb.addEventListener('change',()=>{cb.checked?selected.add(cb.dataset.garId):selected.delete(cb.dataset.garId);const x=mined.find(m=>m.id===cb.dataset.garId);if(x)renderScript(x);renderTable();}));
    $$('.gar-one-add').forEach(b=>b.addEventListener('click',()=>addToCrm([b.dataset.garId])));
    const all=$('#garSelectAll');if(all){const arr=filtered();all.checked=arr.length>0&&arr.every(x=>selected.has(x.id));all.onchange=()=>{filtered().forEach(x=>all.checked?selected.add(x.id):selected.delete(x.id));renderTable();};}
  }
  function renderScript(x){
    const box=$('#garScriptBox');if(!box||!x)return;
    box.textContent=`Oi ${x.responsavel||'tudo bem'}, aqui é [SEU NOME]. Vi a ${x.nome} e percebi que negócios de ${x.segmento} costumam perder conversão por ${x.dor}.

A ideia não é te vender algo agora. Queria te fazer uma pergunta rápida: hoje vocês conseguem medir quantos contatos viram cliente e onde estão perdendo oportunidades?

Se fizer sentido, posso te mandar um diagnóstico simples com 2 ou 3 melhorias para aumentar conversão e ticket médio.`;
  }
  function toLead(x){
    return {nome:x.nome,segmento:x.segmento,responsavel:x.responsavel||'',telefone:x.telefone||'',email:x.email||'',etapa:'Lead',prioridade:x.prioridade||priorityFromScore(x.score),valor:Number(x.valor)||0,dataEntrada:today(),origem:'Outbound',followup:addDays(2),ultimaAtualizacao:today(),motivoPerda:'',obs:[x.nota,`Fonte: ${x.fonte||'Garimpo de Leads'}`,`Score garimpo: ${x.score}`,`Instagram: ${x.instagram||'—'}`,`Site: ${x.site||'—'}`].filter(Boolean).join('\n'),atividades:[{id:'at'+Date.now()+Math.random().toString(36).slice(2,6),tipo:'Automação',texto:`Lead criado pelo Garimpo de Leads. Fit: ${x.fit}. Dor provável: ${x.dor}.`,autor:'Garimpo',data:new Date().toISOString()}]};
  }
  function addToCrm(ids){
    const list=ids.map(id=>mined.find(x=>x.id===id)).filter(Boolean);
    if(!list.length){toast('Selecione pelo menos um lead','warn');return;}
    let added=0,skipped=0;
    list.forEach(x=>{
      if(duplicateOf(x)){x.duplicado=true;skipped++;return;}
      getLeads().unshift(toLead(x));x.status='Adicionado';added++;
    });
    persistLeads();saveMined();selected.clear();rerender();
    toast(`${added} lead(s) adicionados ao CRM${skipped?` • ${skipped} duplicado(s) ignorado(s)`:''}`,'success');
  }
  function exportMined(){
    const cols=['nome','segmento','cidade','bairro','responsavel','telefone','email','site','instagram','score','fit','dor','valor','sinais'];
    const rows=[cols.join(','),...filtered().map(x=>cols.map(k=>`"${String(k==='sinais'?(x.sinais||[]).join('; '):(x[k]??'')).replace(/"/g,'""')}"`).join(','))].join('\n');
    const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent('\uFEFF'+rows);a.download='garimpo_leads_'+today()+'.csv';document.body.appendChild(a);a.click();a.remove();toast('Garimpo exportado','success');
  }
  function openSources(){
    const o=currentOpts();const links=buildExternalLinks(o.segmento,o.cidade,o.keywords);Object.values(links).forEach((u,i)=>setTimeout(()=>window.open(u,'_blank'),i*120));
    toast('Fontes abertas em novas abas','success');
  }
  async function runApiSearch(){
    const endpoint=$('#garApiEndpoint')?.value?.trim();
    if(!endpoint){toast('Informe o endpoint da API','warn');return false;}
    const o=currentOpts();
    try{
      const resp=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',...($('#garApiKey')?.value?{'Authorization':'Bearer '+$('#garApiKey').value}:{})},body:JSON.stringify(o)});
      if(!resp.ok)throw new Error('HTTP '+resp.status);
      const data=await resp.json();const arr=Array.isArray(data)?data:(data.leads||data.results||[]);
      const mapped=arr.map((x,i)=>{
        const item={...x,id:x.id||('api_'+Date.now()+'_'+i),nome:x.nome||x.name||x.title||'Lead sem nome',segmento:x.segmento||o.segmento,cidade:x.cidade||o.cidade,bairro:x.bairro||'',responsavel:x.responsavel||x.owner||'Decisor',telefone:x.telefone||x.phone||'',email:x.email||'',site:x.site||x.website||'',instagram:x.instagram||'',origem:'Garimpo',fonte:'API conectada',fit:x.fit||'Médio',dor:x.dor||x.obs||'oportunidade de melhoria comercial',sinais:x.sinais||['Fonte externa'],valor:Number(x.valor||o.ticket||SEG_PRESETS[o.segmento]?.ticket||1500),status:'Novo',nota:x.nota||x.obs||''};
        item.links=buildExternalLinks(item.segmento,item.cidade,o.keywords);item.score=leadScore(item);item.prioridade=priorityFromScore(item.score);item.duplicado=!!duplicateOf(item);return item;
      });
      mined=[...mapped,...mined].slice(0,500);saveMined();toast(`${mapped.length} lead(s) via API`,'success');return true;
    }catch(e){toast('Não consegui buscar pela API. Verifique CORS, endpoint e token.','danger');return false;}
  }
  async function mine(){
    saveCfg();
    const active=$('#garSourceTabs button.active')?.dataset.garSource||'local';
    if(active==='api'){
      const ok=await runApiSearch(); if(ok){selected.clear();renderGarimpoLeadsV7();return;}
    }
    const opts=currentOpts();const generated=createMockResults(opts);
    mined=[...generated,...mined].filter((x,i,arr)=>arr.findIndex(y=>norm(y.nome)===norm(x.nome)&&norm(y.cidade)===norm(x.cidade))===i).slice(0,500);
    selected.clear();saveMined();renderGarimpoLeadsV7();toast(`${generated.length} leads garimpados e ranqueados`,'success');
  }
  function bindPage(){
    $('#garMineBtn')?.addEventListener('click',mine);
    $('#garOpenSourcesBtn')?.addEventListener('click',openSources);
    $('#garExportBtn')?.addEventListener('click',exportMined);
    $('#garAddSelectedTop')?.addEventListener('click',()=>addToCrm([...selected]));
    $('#garTopBtn')?.addEventListener('click',()=>{filtered().filter(x=>!x.duplicado&&!duplicateOf(x)).slice(0,10).forEach(x=>selected.add(x.id));renderTable();toast('Melhores leads selecionados','success');});
    $('#garClearBtn')?.addEventListener('click',()=>{if(confirm('Limpar todos os leads garimpados?')){mined=[];selected.clear();saveMined();renderGarimpoLeadsV7();}});
    $('#garCopyScriptBtn')?.addEventListener('click',()=>{const t=$('#garScriptBox')?.textContent||'';if(!t||t.includes('Selecione')){toast('Selecione um lead primeiro','warn');return;}navigator.clipboard?.writeText(t).then(()=>toast('Script copiado','success')).catch(()=>toast('Não foi possível copiar','warn'));});
    $('#garSearch')?.addEventListener('input',e=>{garSearch=e.target.value;renderTable();});
    $$('#garFitFilters .chip').forEach(b=>b.addEventListener('click',()=>{$$('#garFitFilters .chip').forEach(x=>x.classList.remove('active'));b.classList.add('active');garFit=b.dataset.garFit||'';renderTable();}));
    $$('#garSourceTabs button').forEach(b=>b.addEventListener('click',()=>{$$('#garSourceTabs button').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#garApiBox')?.classList.toggle('active',b.dataset.garSource==='api');renderStrategy();}));
    ['garSegmento','garCidade','garKeywords','garQtd','garTicket','garApiEndpoint','garApiKey'].forEach(id=>$('#'+id)?.addEventListener('input',()=>{saveCfg();renderStrategy();}));
    $('#garSegmento')?.addEventListener('change',()=>{saveCfg();renderStrategy();});
  }
  function updateTopbarIfActive(){
    if(!$('#garimpo.active'))return;
    const t=$('#topbarTitle'),s=$('#topbarSub');
    if(t)t.textContent='Garimpo de Leads';
    if(s)s.textContent='Prospecção inteligente, scoring e criação rápida de oportunidades';
    renderGarimpoLeadsV7();
  }
  function observeActive(){
    if(window.__garObserverV7)return;window.__garObserverV7=true;
    const main=$('main');if(!main)return;
    new MutationObserver(()=>setTimeout(updateTopbarIfActive,0)).observe(main,{subtree:true,attributes:true,attributeFilter:['class']});
  }
  window.renderGarimpoLeadsV7=function(){
    renderStrategy();
    mined.forEach(x=>{x.duplicado=!!duplicateOf(x);x.score=leadScore(x);x.prioridade=priorityFromScore(x.score);x.links=x.links||buildExternalLinks(x.segmento,x.cidade,'');});
    renderKpis();renderTable();
  };
  function init(){
    ensureStyle();ensureNavigation();ensurePage();bindPage();observeActive();renderGarimpoLeadsV7();updateTopbarIfActive();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
