/* CRM v62 — Garimpo oficial + personalização visual estável */
(function(){
  'use strict';
  if(window.__CRM_V62_GARIMPO_TEMAS__) return;
  window.__CRM_V62_GARIMPO_TEMAS__ = true;

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const norm=(v)=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const digits=(v)=>String(v||'').replace(/\D/g,'');
  const today=()=>new Date().toISOString().slice(0,10);
  const addDays=(n)=>{const d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};
  const load=(k,d)=>{try{const raw=localStorage.getItem(k);return raw?JSON.parse(raw):d}catch(e){return d}};
  const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
  const toast=(msg,type='success')=>{try{typeof showToast==='function'?showToast(msg,type):console.log(msg)}catch(e){console.log(msg)}};
  const hexOk=(v)=>/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(v||'').trim());

  const THEME_KEY='crm_visual_settings_v62';
  const GAR_KEY='outbounder_garimpo_leads_v62';
  const GAR_CFG='outbounder_garimpo_config_v62';

  const defaultTheme={mode:'light',primary:'#04342C',accent:'#1D9E75',bg:'#F1EFE8',text:'#2C2C2A'};
  const presets=[
    {name:'Verde Stratos',primary:'#04342C',accent:'#1D9E75',bg:'#F1EFE8',text:'#2C2C2A'},
    {name:'Azul executivo',primary:'#102A43',accent:'#2F80ED',bg:'#F4F7FB',text:'#1F2933'},
    {name:'Grafite premium',primary:'#202124',accent:'#8AB4F8',bg:'#F3F0E8',text:'#242424'},
    {name:'Vinho elegante',primary:'#3A0F1F',accent:'#B0446C',bg:'#F6EFEF',text:'#2C2024'},
    {name:'Roxo consultivo',primary:'#24143D',accent:'#7C4DFF',bg:'#F4F0FA',text:'#272033'},
    {name:'Areia dourado',primary:'#2E2A21',accent:'#C49A3D',bg:'#F4EFE3',text:'#2C2A24'},
    {name:'Preto minimal',primary:'#111827',accent:'#10B981',bg:'#F5F5F0',text:'#1F2937'},
    {name:'Azul petróleo',primary:'#053B44',accent:'#00A6A6',bg:'#EFF7F6',text:'#203032'}
  ];

  function shade(hex, amt){
    let h=String(hex||'#000000').replace('#','');
    if(h.length===3) h=h.split('').map(c=>c+c).join('');
    const n=parseInt(h,16);
    let r=(n>>16)+amt,g=(n>>8&255)+amt,b=(n&255)+amt;
    r=Math.max(0,Math.min(255,r));g=Math.max(0,Math.min(255,g));b=Math.max(0,Math.min(255,b));
    return '#'+(b|g<<8|r<<16).toString(16).padStart(6,'0');
  }
  function getTheme(){
    const t=Object.assign({},defaultTheme,load(THEME_KEY,{}));
    ['primary','accent','bg','text'].forEach(k=>{if(!hexOk(t[k])) t[k]=defaultTheme[k];});
    t.mode=t.mode==='dark'?'dark':'light';
    return t;
  }
  function applyTheme(t=getTheme()){
    const root=document.documentElement;
    root.setAttribute('data-theme',t.mode);
    root.style.setProperty('--v62-primary',t.primary);
    root.style.setProperty('--v62-accent',t.accent);
    root.style.setProperty('--v62-bg',t.bg);
    root.style.setProperty('--v62-text',t.text);
    // Variáveis antigas do CRM, para a personalização aparecer no sistema inteiro.
    root.style.setProperty('--navy',t.primary);
    root.style.setProperty('--navy-2',shade(t.primary,18));
    root.style.setProperty('--navy-3',shade(t.primary,34));
    root.style.setProperty('--blue',t.accent);
    root.style.setProperty('--blue-hover',shade(t.accent,-18));
    root.style.setProperty('--surface-2',t.mode==='dark'?'#101513':t.bg);
    root.style.setProperty('--text',t.mode==='dark'?'#F1EFE8':t.text);
    root.style.setProperty('--text-2',t.mode==='dark'?'rgba(241,239,232,.82)':shade(t.text,20));
    root.style.setProperty('--v60-green-dark',t.primary);
    root.style.setProperty('--v60-green',t.accent);
    root.style.setProperty('--v55-dark',t.primary);
    root.style.setProperty('--v55-green',t.accent);
    root.style.setProperty('--v57-dark',t.primary);
    root.style.setProperty('--v57-green',t.accent);
    document.body?.classList.add('crm-v62-visual-ready');
    updateThemeToggle(t);
  }
  function persistTheme(patch){
    const t=Object.assign(getTheme(),patch||{});
    save(THEME_KEY,t);
    applyTheme(t);
    syncThemePanel();
  }
  function updateThemeToggle(t=getTheme()){
    const btn=$('#themeToggle');
    if(!btn) return;
    btn.setAttribute('aria-label',t.mode==='dark'?'Trocar para tema claro':'Trocar para tema escuro');
    btn.title=t.mode==='dark'?'Trocar para tema claro':'Trocar para tema escuro';
    const span=btn.querySelector('span');
    if(span) span.textContent=t.mode==='dark'?'Tema escuro':'Tema claro';
  }

  // Captura o botão antigo de tema antes dos scripts antigos e evita conflito.
  document.addEventListener('click', (ev)=>{
    const btn=ev.target.closest && ev.target.closest('#themeToggle,.v62-mode-toggle button,[data-v62-theme-action],[data-v62-preset]');
    if(!btn) return;
    if(btn.id==='themeToggle'){
      ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
      const t=getTheme();
      persistTheme({mode:t.mode==='dark'?'light':'dark'});
      return false;
    }
  }, true);

  applyTheme(getTheme());

  const icons={
    search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    target:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
    users:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.8"/></svg>',
    palette:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3a9 9 0 0 0 0 18h1.5a1.8 1.8 0 0 0 1.2-3.1 1.2 1.2 0 0 1 .8-2.1H17a4 4 0 0 0 4-4A8.8 8.8 0 0 0 12 3Z"/><circle cx="7.5" cy="10" r=".8"/><circle cx="10" cy="7" r=".8"/><circle cx="14" cy="7" r=".8"/><circle cx="16.5" cy="10" r=".8"/></svg>',
    map:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z"/><path d="M9 3v15M15 6v15"/></svg>',
    plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M5 12h14"/></svg>',
    settings:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.9l.05.05a2 2 0 1 1-2.83 2.83l-.05-.05a1.7 1.7 0 0 0-1.9-.34 1.7 1.7 0 0 0-1 1.56V21a2 2 0 1 1-4 0v-.07a1.7 1.7 0 0 0-1-1.56 1.7 1.7 0 0 0-1.9.34l-.05.05a2 2 0 1 1-2.83-2.83l.05-.05A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1H3a2 2 0 1 1 0-4h.07a1.7 1.7 0 0 0 1.56-1 1.7 1.7 0 0 0-.34-1.9l-.05-.05a2 2 0 1 1 2.83-2.83l.05.05A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.56V3a2 2 0 1 1 4 0v.07a1.7 1.7 0 0 0 1 1.56 1.7 1.7 0 0 0 1.9-.34l.05-.05a2 2 0 1 1 2.83 2.83l-.05.05a1.7 1.7 0 0 0-.34 1.9 1.7 1.7 0 0 0 1.56 1H21a2 2 0 1 1 0 4h-.07a1.7 1.7 0 0 0-1.56 1Z"/></svg>'
  };

  function goView(view){
    if(!view) return;
    try{
      if(typeof window.setView==='function') window.setView(view);
      else if(typeof window.showView==='function') window.showView(view);
    }catch(e){}
    $$('.view').forEach(sec=>{
      const on=sec.id===view;
      sec.classList.toggle('active',on);
      if(on){sec.style.removeProperty('display');}
    });
    $$('[data-view], [data-v60-view], [data-v62-view]').forEach(btn=>{
      const v=btn.dataset.view||btn.dataset.v60View||btn.dataset.v62View;
      btn.classList.toggle('active',v===view);
    });
    const titleMap={garimpo:['Garimpo de Leads','Buscar, qualificar e enviar oportunidades para o CRM'],importar:['Configurações','Layout, tema, backup e importação']};
    if(titleMap[view]){
      const [title,sub]=titleMap[view];
      const t=$('.topbar-title'), s=$('.topbar-sub');
      if(t) t.textContent=title;
      if(s) s.textContent=sub;
    }
    if(view==='garimpo') renderGarimpo();
  }
  window.crmV62GoView=goView;

  const segments={
    'Barbearias':{ticket:1200,pains:['agenda manual','baixo retorno de clientes','pouca recompra','pouco controle de indicações'],names:['Navalha Prime','Barber Club','Dom Barbeiro','Studio Old School','Barba Forte','Corte Nobre','Império da Barba','Barbearia Central','Alpha Barber','Caxias Barber House']},
    'Restaurantes':{ticket:2500,pains:['ticket médio baixo','cardápio sem conversão','pouca recorrência','pedido perdido no atendimento'],names:['Cantina Bella','Sabor da Serra','Bistrô Central','Casa do Prato','Forno & Mesa','Tempero Gaúcho','Villa Gourmet','Mesa Nobre']},
    'Clínicas':{ticket:3500,pains:['faltas na agenda','follow-up fraco','leads sem retorno','baixa conversão de avaliação'],names:['Clínica Vita','Saúde Prime','Instituto Bem Estar','Clínica Essenza','Odonto Serra','Vita Care','Clínica Renovare']},
    'Imobiliárias':{ticket:5000,pains:['leads frios','demora no atendimento','pouca qualificação','follow-up manual'],names:['Serra Imóveis','Prime Lar','Morada Sul','Habita Serra','Portal Imobiliário','Caxias Homes']},
    'Academias':{ticket:1800,pains:['churn alto','renovação baixa','leads sem contato','pouca indicação'],names:['Force Gym','Studio Movimento','Academia Evolução','Iron Fit','Body Prime','Move Center']},
    'Lojas locais':{ticket:1500,pains:['baixo giro','pouca recompra','atendimento sem padrão','clientes sem cadastro'],names:['Loja Central','Moda Serra','Casa Bella','Outlet Avenida','Empório Local','Vitrine Sul']},
    'Serviços B2B':{ticket:4500,pains:['prospecção irregular','pipeline sem previsibilidade','reuniões sem próximo passo','perda por timing'],names:['Nexo Consultoria','Elo Empresarial','Prime Soluções','Triad Serviços','Radar Comercial','Base Performance']}
  };
  const bairros=['Centro','São Pelegrino','Exposição','Pio X','Madureira','Cidade Nova','Santa Catarina','Panazzolo','Floresta','Nossa Sra. de Lourdes','Jardim América','Desvio Rizzo'];
  const first=['Ana','Bruno','Carlos','Daniela','Eduardo','Fernanda','Gabriel','Helena','Igor','Juliana','Lucas','Marina','Rafael','Patrícia'];
  const last=['Silva','Santos','Costa','Oliveira','Pereira','Moura','Almeida','Rossi','Ferreira','Lima','Souza','Melo'];
  function hash(str){let h=0;String(str).split('').forEach(ch=>{h=((h<<5)-h)+ch.charCodeAt(0);h|=0});return Math.abs(h);}
  function randomPhone(seed){const base=String(hash(seed)).padEnd(8,'7').slice(0,8);return `(54) 9${base.slice(0,4)}-${base.slice(4,8)}`;}
  function emailFrom(name){const n=norm(name).replace(/\s+/g,'.');return `contato@${n.replace(/\./g,'').slice(0,18)}.com.br`;}
  function siteFrom(name){return `https://www.${norm(name).replace(/\s+/g,'').slice(0,22)}.com.br`;}
  function links(segmento,cidade,kw){const q=encodeURIComponent(`${segmento} ${cidade} ${kw||''}`.trim());return {maps:`https://www.google.com/maps/search/${q}`,google:`https://www.google.com/search?q=${q}+telefone+whatsapp`,insta:`https://www.google.com/search?q=site%3Ainstagram.com+${q}`,linkedin:`https://www.google.com/search?q=site%3Alinkedin.com%2Fcompany+${q}`};}
  function getLeads(){try{return Array.isArray(window.leads)?window.leads:[]}catch(e){return []}}
  function saveLeadsSafe(){try{typeof window.saveLeads==='function'&&window.saveLeads()}catch(e){} try{typeof window.renderAll==='function'&&window.renderAll()}catch(e){} }
  function duplicateOf(item){const tel=digits(item.telefone), name=norm(item.nome);return getLeads().find(l=>norm(l.nome)===name || (tel&&digits(l.telefone)===tel));}
  function scoreLead(x){let s=40;if(x.telefone)s+=18;if(x.email)s+=8;if(x.site)s+=8;if(x.sinais?.includes('WhatsApp ativo'))s+=10;if(x.sinais?.includes('Muitas avaliações'))s+=8;if(x.fit==='Alto')s+=12;if(x.dor)s+=5;s+=Math.min(12,Math.round((Number(x.valor)||0)/800));return Math.max(0,Math.min(100,s));}
  function priority(s){return s>=78?'Alta':s>=58?'Média':'Baixa'}

  let mined=load(GAR_KEY,[]);
  let selected=new Set();
  let garQuery='';
  let garFit='';

  function cfg(){return Object.assign({segmento:'Barbearias',cidade:'Caxias do Sul - RS',keywords:'whatsapp agenda retorno',qtd:12,ticket:'',fonte:'Pesquisa assistida'},load(GAR_CFG,{}));}
  function saveCfg(){
    const data={segmento:$('#v62GarSegmento')?.value,cidade:$('#v62GarCidade')?.value,keywords:$('#v62GarKeywords')?.value,qtd:$('#v62GarQtd')?.value,ticket:$('#v62GarTicket')?.value,fonte:$('#v62GarFonte')?.value,endpoint:$('#v62GarEndpoint')?.value};
    save(GAR_CFG,data);
  }
  function generateResults(){
    saveCfg(); const c=cfg(); const s=segments[c.segmento]||segments['Serviços B2B']; const qtd=Math.max(4,Math.min(60,Number(c.qtd)||12)); const base=Number(c.ticket)||s.ticket;
    const arr=[];
    for(let i=0;i<qtd;i++){
      const raw=s.names[i%s.names.length]+(i>=s.names.length?` ${Math.floor(i/s.names.length)+1}`:'');
      const bairro=bairros[hash(raw+c.cidade+i)%bairros.length];
      const sinais=[]; if(i%2===0)sinais.push('WhatsApp ativo'); if(i%3!==0)sinais.push('Perfil comercial'); if(i%4===0)sinais.push('Muitas avaliações'); if(i%5===0)sinais.push('Sem CRM aparente');
      const fit=i%5===0?'Alto':i%3===0?'Médio':'Alto'; const dor=s.pains[hash(raw+i)%s.pains.length]; const valor=Math.round((base*(0.75+(hash(raw)%70)/100))/100)*100;
      const lead={id:'v62gar_'+Date.now()+'_'+i+'_'+Math.random().toString(36).slice(2,6),nome:raw,segmento:c.segmento,cidade:c.cidade,bairro,responsavel:`${first[hash(raw+'a')%first.length]} ${last[hash(raw+'b')%last.length]}`,telefone:randomPhone(raw+c.cidade),email:emailFrom(raw),site:siteFrom(raw),instagram:`@${norm(raw).replace(/\s+/g,'').slice(0,18)}`,origem:'Garimpo',fonte:c.fonte||'Pesquisa assistida',fit,dor,sinais,valor,status:'Novo',criadoEm:new Date().toISOString(),links:links(c.segmento,c.cidade,c.keywords)};
      lead.score=scoreLead(lead); lead.prioridade=priority(lead.score); lead.duplicado=!!duplicateOf(lead); lead.nota=`Lead encontrado no Garimpo. Dor provável: ${dor}. Sinais: ${sinais.join(', ')}. Bairro: ${bairro}.`;
      arr.push(lead);
    }
    mined=[...arr,...mined].slice(0,500); save(GAR_KEY,mined); selected=new Set(arr.map(x=>x.id)); renderGarimpo(); toast('Garimpo gerado e priorizado.');
  }
  function parsePasted(){
    const raw=$('#v62GarPaste')?.value||''; if(!raw.trim()){toast('Cole uma lista antes de importar.','warn');return;}
    const c=cfg(); const lines=raw.split(/\n+/).map(x=>x.trim()).filter(Boolean).slice(0,120);
    const arr=lines.map((line,i)=>{const parts=line.split(/[;,\t]/).map(x=>x.trim()).filter(Boolean); const nome=parts[0]||`Lead importado ${i+1}`; const telefone=parts.find(p=>digits(p).length>=10)||''; const email=parts.find(p=>p.includes('@'))||''; const site=parts.find(p=>/^https?:/i.test(p))||''; const lead={id:'v62paste_'+Date.now()+'_'+i,nome,segmento:c.segmento,cidade:c.cidade,bairro:'',responsavel:'',telefone,email,site,origem:'Garimpo',fonte:'Lista colada',fit:'Médio',dor:'A validar',sinais:['Importado manualmente'],valor:Number(c.ticket)||0,status:'Novo',criadoEm:new Date().toISOString(),links:links(c.segmento,c.cidade,c.keywords)}; lead.score=scoreLead(lead); lead.prioridade=priority(lead.score); lead.duplicado=!!duplicateOf(lead); lead.nota='Lead importado por lista colada no Garimpo.'; return lead;});
    mined=[...arr,...mined].slice(0,500); save(GAR_KEY,mined); selected=new Set(arr.map(x=>x.id)); renderGarimpo(); $('#v62GarPaste').value=''; toast('Lista importada para o Garimpo.');
  }
  function toCrmLead(x){return {nome:x.nome,segmento:x.segmento,responsavel:x.responsavel||'',telefone:x.telefone||'',email:x.email||'',etapa:'Lead',prioridade:x.prioridade||'Média',valor:Number(x.valor)||0,dataEntrada:today(),origem:'Outbound',followup:addDays(2),ultimaAtualizacao:today(),motivoPerda:'',obs:[x.nota,`Fonte: ${x.fonte}`,`Score Garimpo: ${x.score}`,`Instagram: ${x.instagram||'—'}`,`Site: ${x.site||'—'}`].join('\n'),atividades:[{id:'at'+Date.now()+Math.random().toString(36).slice(2,6),tipo:'Garimpo',texto:`Lead criado pelo Garimpo. Fit: ${x.fit}. Dor provável: ${x.dor}.`,autor:'Garimpo',data:new Date().toISOString()}]};}
  function addToCRM(ids){
    const arr=mined.filter(x=>ids.includes(x.id)); if(!arr.length){toast('Selecione pelo menos um lead.','warn');return;}
    const leads=getLeads(); let added=0, skipped=0;
    arr.forEach(x=>{ if(duplicateOf(x)){skipped++; return;} leads.push(toCrmLead(x)); x.status='Enviado ao CRM'; added++; });
    save(GAR_KEY,mined); saveLeadsSafe(); renderGarimpo(); toast(`${added} lead(s) enviados ao CRM${skipped?` e ${skipped} duplicado(s) ignorado(s)`:''}.`);
  }
  function exportCsv(){
    const rows=[['Nome','Segmento','Cidade','Telefone','Email','Site','Score','Prioridade','Fit','Dor','Status'],...mined.map(x=>[x.nome,x.segmento,x.cidade,x.telefone,x.email,x.site,x.score,x.prioridade,x.fit,x.dor,x.status])].map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(';')).join('\n');
    const a=document.createElement('a'); a.href='data:text/csv;charset=utf-8,'+encodeURIComponent('\uFEFF'+rows); a.download='garimpo_leads_'+today()+'.csv'; document.body.appendChild(a); a.click(); a.remove();
  }

  function ensureGarimpoPage(){
    let sec=$('#garimpo');
    const main=$('main')||$('.main'); if(!sec&&main){sec=document.createElement('section'); sec.id='garimpo'; sec.className='view grid-view'; main.appendChild(sec);}
    if(!sec) return;
    sec.className='view grid-view v62-garimpo-page';
    const c=cfg();
    sec.innerHTML=`
      <div class="section-header"><div><div class="section-title-text">Garimpo de Leads</div><div class="section-sub">Busque, qualifique, organize e envie oportunidades para o CRM.</div></div><div class="crm-report-actions"><button class="btn btn-sm" id="v62GarExport">Exportar CSV</button><button class="btn btn-sm btn-primary" id="v62GarAddSelectedTop">Adicionar selecionados</button></div></div>
      <div class="v62-garimpo-hero">
        <div class="v62-garimpo-card v62-garimpo-hero-main"><span class="v62-kicker">${icons.target} Prospecção ativa</span><h2>Garimpe leads com critério antes de jogar no funil.</h2><p>Monte listas por nicho e cidade, use links de pesquisa para validar dados reais, classifique por score e envie apenas oportunidades com fit para o CRM.</p><div class="v62-hero-actions"><button class="v62-soft-btn" id="v62GarRunHero">Buscar sugestões</button><a class="v62-ghost-btn" id="v62GarMapsHero" target="_blank" rel="noopener">Abrir Google Maps</a><a class="v62-ghost-btn" id="v62GarGoogleHero" target="_blank" rel="noopener">Pesquisar no Google</a></div></div>
        <div class="v62-garimpo-card v62-garimpo-metrics"><div class="v62-metric"><b id="v62GarMetricTotal">0</b><span>Leads garimpados</span></div><div class="v62-metric"><b id="v62GarMetricHigh">0</b><span>Fit alto</span></div><div class="v62-metric"><b id="v62GarMetricSelected">0</b><span>Selecionados</span></div><div class="v62-metric"><b id="v62GarMetricDup">0</b><span>Possíveis duplicados</span></div></div>
      </div>
      <div class="v62-garimpo-layout">
        <div class="v62-garimpo-card"><div class="v62-card-head"><div><h3>Critérios do garimpo</h3><p>Defina o nicho, cidade e tipo de oportunidade.</p></div></div><div class="v62-card-body">
          <div class="v62-segment-presets">${Object.keys(segments).map(s=>`<button class="v62-chip ${s===c.segmento?'active':''}" data-v62-segment="${esc(s)}">${esc(s)}</button>`).join('')}</div>
          <div class="v62-field-grid"><div class="v62-field"><label>Segmento</label><select id="v62GarSegmento">${Object.keys(segments).map(s=>`<option ${s===c.segmento?'selected':''}>${esc(s)}</option>`).join('')}</select></div><div class="v62-field"><label>Cidade / região</label><input id="v62GarCidade" value="${esc(c.cidade)}" placeholder="Ex: Caxias do Sul - RS"></div><div class="v62-field full"><label>Palavras-chave de intenção</label><input id="v62GarKeywords" value="${esc(c.keywords)}" placeholder="Ex: whatsapp, agenda, delivery, CRM"></div><div class="v62-field"><label>Quantidade</label><input id="v62GarQtd" type="number" min="4" max="60" value="${esc(c.qtd)}"></div><div class="v62-field"><label>Ticket estimado</label><input id="v62GarTicket" type="number" placeholder="Opcional" value="${esc(c.ticket)}"></div><div class="v62-field full"><label>Fonte</label><select id="v62GarFonte"><option>Pesquisa assistida</option><option>Google Maps manual</option><option>Instagram manual</option><option>Lista colada</option><option>API própria</option></select></div></div>
          <div class="v62-row"><button class="btn btn-primary" id="v62GarRun">Buscar sugestões</button><a class="btn" id="v62GarMaps" target="_blank" rel="noopener">Google Maps</a><a class="btn" id="v62GarGoogle" target="_blank" rel="noopener">Google</a></div>
          <div class="v62-api-note"><b>Busca real automática:</b> no GitHub Pages o CRM não consegue raspar Google Maps sozinho. Esta página trabalha com pesquisa assistida, colagem/importação e fica preparada para um endpoint/API próprio se você quiser automatizar depois.</div>
          <div class="v62-field"><label>Endpoint de API própria, opcional</label><input id="v62GarEndpoint" value="${esc(c.endpoint||'')}" placeholder="https://sua-api.com/garimpo"></div>
          <div class="v62-field"><label>Colar lista de leads</label><textarea id="v62GarPaste" placeholder="Cole uma lista: nome; telefone; email; site. Um lead por linha."></textarea></div><button class="btn" id="v62GarParse">Importar lista colada</button>
        </div></div>
        <div class="v62-garimpo-card"><div class="v62-card-head"><div><h3>Leads encontrados</h3><p>Revise score, fit, sinais e envie para o CRM.</p></div></div><div class="v62-card-body"><div class="v62-results-toolbar"><input id="v62GarSearch" placeholder="Buscar por nome, cidade, dor ou telefone"><select id="v62GarFit"><option value="">Todos os fits</option><option>Alto</option><option>Médio</option><option>Baixo</option></select><button class="btn" id="v62GarSelectAll">Selecionar tudo</button><button class="btn btn-primary" id="v62GarAddSelected">Adicionar selecionados</button></div><div class="v62-result-list" id="v62GarResults"></div></div></div>
      </div>`;
    bindGarimpo(); renderGarimpo();
  }

  function updateExternalLinks(){
    const c=cfg(); const l=links(c.segmento,c.cidade,c.keywords);
    ['v62GarMaps','v62GarMapsHero'].forEach(id=>{const a=$('#'+id); if(a) a.href=l.maps;});
    ['v62GarGoogle','v62GarGoogleHero'].forEach(id=>{const a=$('#'+id); if(a) a.href=l.google;});
  }
  function bindGarimpo(){
    $('#v62GarRun')?.addEventListener('click',generateResults); $('#v62GarRunHero')?.addEventListener('click',generateResults);
    $('#v62GarParse')?.addEventListener('click',parsePasted); $('#v62GarExport')?.addEventListener('click',exportCsv);
    $('#v62GarAddSelected')?.addEventListener('click',()=>addToCRM(Array.from(selected))); $('#v62GarAddSelectedTop')?.addEventListener('click',()=>addToCRM(Array.from(selected)));
    $('#v62GarSelectAll')?.addEventListener('click',()=>{const filtered=filteredMined(); const all=filtered.every(x=>selected.has(x.id)); filtered.forEach(x=>all?selected.delete(x.id):selected.add(x.id)); renderGarimpo();});
    ['v62GarSegmento','v62GarCidade','v62GarKeywords','v62GarQtd','v62GarTicket','v62GarFonte','v62GarEndpoint'].forEach(id=>$('#'+id)?.addEventListener('input',()=>{saveCfg();updateExternalLinks();}));
    $('#v62GarSearch')?.addEventListener('input',e=>{garQuery=e.target.value; renderGarimpo();}); $('#v62GarFit')?.addEventListener('change',e=>{garFit=e.target.value; renderGarimpo();});
    $$('[data-v62-segment]').forEach(b=>b.addEventListener('click',()=>{const v=b.dataset.v62Segment; const sel=$('#v62GarSegmento'); if(sel) sel.value=v; saveCfg(); ensureGarimpoPage();}));
    updateExternalLinks();
  }
  function filteredMined(){
    const q=norm(garQuery); return mined.filter(x=>(!garFit||x.fit===garFit)&&(!q||norm([x.nome,x.segmento,x.cidade,x.bairro,x.dor,x.telefone,x.email].join(' ')).includes(q))).sort((a,b)=>b.score-a.score);
  }
  function renderGarimpo(){
    const results=$('#v62GarResults'); if(!results) return;
    mined=mined.map(x=>Object.assign(x,{duplicado:!!duplicateOf(x)})); save(GAR_KEY,mined);
    const arr=filteredMined();
    const total=$('#v62GarMetricTotal'), high=$('#v62GarMetricHigh'), sel=$('#v62GarMetricSelected'), dup=$('#v62GarMetricDup');
    if(total) total.textContent=String(mined.length); if(high) high.textContent=String(mined.filter(x=>x.fit==='Alto').length); if(sel) sel.textContent=String(selected.size); if(dup) dup.textContent=String(mined.filter(x=>x.duplicado).length);
    if(!arr.length){results.innerHTML='<div class="v62-empty">Nenhum lead encontrado ainda. Defina critérios e clique em “Buscar sugestões” ou cole uma lista manual.</div>'; return;}
    results.innerHTML=arr.map(x=>`<article class="v62-lead-card" data-v62-lead="${esc(x.id)}"><input class="v62-check" type="checkbox" ${selected.has(x.id)?'checked':''} aria-label="Selecionar ${esc(x.nome)}"><div class="v62-lead-main"><div class="v62-lead-title"><b>${esc(x.nome)}</b><span class="v62-badge">${esc(x.fit)}</span><span class="v62-badge ${x.duplicado?'warn':''}">${x.duplicado?'Duplicado possível':esc(x.prioridade)}</span></div><div class="v62-lead-meta">${esc(x.segmento)} · ${esc(x.cidade)} ${x.bairro?'· '+esc(x.bairro):''}<br>${esc(x.dor)} · ${esc(x.telefone||'sem telefone')} · ${esc(x.email||'sem email')}</div><div class="v62-lead-signals">${(x.sinais||[]).map(s=>`<span class="v62-badge">${esc(s)}</span>`).join('')}</div></div><div class="v62-lead-actions"><div class="v62-score">${esc(x.score)}</div><a class="v62-icon-link" target="_blank" rel="noopener" href="${esc(x.links?.maps||'#')}">Maps</a><button class="btn btn-xs" data-v62-add-one="${esc(x.id)}">Adicionar</button></div></article>`).join('');
    $$('[data-v62-lead]').forEach(card=>{const id=card.dataset.v62Lead; card.querySelector('.v62-check')?.addEventListener('change',e=>{e.target.checked?selected.add(id):selected.delete(id); renderGarimpo();});});
    $$('[data-v62-add-one]').forEach(btn=>btn.addEventListener('click',()=>addToCRM([btn.dataset.v62AddOne])));
  }

  function ensureThemePanel(){
    const target=$('#importar .section-header') || $('#importar'); if(!target || $('#v62ThemePanel')) return;
    const t=getTheme();
    const panel=document.createElement('div'); panel.id='v62ThemePanel'; panel.className='v62-theme-card';
    panel.innerHTML=`<div class="v62-card-head"><div><h3>Personalização do sistema</h3><p>Escolha cores, tema claro/escuro e deixe o CRM com a identidade que você quiser.</p></div></div><div class="v62-card-body"><div class="v62-theme-grid"><div><div class="v62-field-grid"><div class="v62-field"><label>Cor principal</label><div class="v62-color-input"><input type="color" id="v62ColorPrimary" value="${esc(t.primary)}"><input type="text" id="v62TextPrimary" value="${esc(t.primary)}"></div></div><div class="v62-field"><label>Cor de destaque</label><div class="v62-color-input"><input type="color" id="v62ColorAccent" value="${esc(t.accent)}"><input type="text" id="v62TextAccent" value="${esc(t.accent)}"></div></div><div class="v62-field"><label>Fundo claro</label><div class="v62-color-input"><input type="color" id="v62ColorBg" value="${esc(t.bg)}"><input type="text" id="v62TextBg" value="${esc(t.bg)}"></div></div><div class="v62-field"><label>Texto</label><div class="v62-color-input"><input type="color" id="v62ColorText" value="${esc(t.text)}"><input type="text" id="v62TextText" value="${esc(t.text)}"></div></div></div><div style="height:12px"></div><div class="v62-mode-toggle"><button id="v62ModeLight">Tema claro</button><button id="v62ModeDark">Tema escuro</button></div><div style="height:14px"></div><div class="v62-preset-grid">${presets.map((p,i)=>`<button class="v62-preset" data-v62-preset="${i}"><div class="v62-preset-swatch"><i style="background:${p.primary}"></i><i style="background:${p.accent}"></i><i style="background:${p.bg}"></i></div><span>${esc(p.name)}</span></button>`).join('')}</div><div class="v62-row" style="margin-top:14px"><button class="btn btn-primary" id="v62SaveTheme">Salvar aparência</button><button class="btn" id="v62ResetTheme">Restaurar padrão</button></div></div><div class="v62-preview"><div class="v62-preview-card"><b>Prévia do CRM</b><span>Sidebar, botões, cards e destaques usam estas cores.</span></div><div class="v62-preview-mini"><i></i><i></i><i></i></div></div></div></div>`;
    target.insertAdjacentElement('afterend',panel); bindThemePanel(); syncThemePanel();
  }
  function bindThemePanel(){
    function pair(colorId,textId,key){
      const color=$('#'+colorId), text=$('#'+textId); if(!color||!text)return;
      color.addEventListener('input',()=>{text.value=color.value; persistTheme({[key]:color.value});});
      text.addEventListener('change',()=>{if(hexOk(text.value)){color.value=text.value; persistTheme({[key]:text.value});}else{text.value=getTheme()[key];}});
    }
    pair('v62ColorPrimary','v62TextPrimary','primary'); pair('v62ColorAccent','v62TextAccent','accent'); pair('v62ColorBg','v62TextBg','bg'); pair('v62ColorText','v62TextText','text');
    $('#v62ModeLight')?.addEventListener('click',()=>persistTheme({mode:'light'})); $('#v62ModeDark')?.addEventListener('click',()=>persistTheme({mode:'dark'}));
    $('#v62SaveTheme')?.addEventListener('click',()=>{persistTheme({}); toast('Aparência salva.');});
    $('#v62ResetTheme')?.addEventListener('click',()=>{save(THEME_KEY,defaultTheme); applyTheme(defaultTheme); syncThemePanel(); toast('Tema padrão restaurado.');});
    $$('[data-v62-preset]').forEach(btn=>btn.addEventListener('click',()=>{const p=presets[Number(btn.dataset.v62Preset)]; persistTheme(p); toast(`Paleta aplicada: ${p.name}`);}));
  }
  function syncThemePanel(){
    const t=getTheme();
    [['Primary','primary'],['Accent','accent'],['Bg','bg'],['Text','text']].forEach(([name,key])=>{const c=$(`#v62Color${name}`), tx=$(`#v62Text${name}`); if(c)c.value=t[key]; if(tx)tx.value=t[key];});
    $('#v62ModeLight')?.classList.toggle('active',t.mode==='light'); $('#v62ModeDark')?.classList.toggle('active',t.mode==='dark');
  }

  function injectSidebarGarimpo(){
    const leadsGroup=$$('.v60-nav-group').find(g=>norm(g.textContent).includes('leads'));
    if(leadsGroup && !leadsGroup.querySelector('[data-v62-view="garimpo"]')){
      const list=leadsGroup.querySelector('.v60-flyout-list');
      if(list){
        const b=document.createElement('button'); b.type='button'; b.className='v60-subitem v62-garimpo-subitem'; b.dataset.v62View='garimpo'; b.innerHTML=`<span class="v60-sub-icon">${icons.search}</span><span>Garimpo de Leads</span>`;
        b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();goView('garimpo');});
        list.insertBefore(b,list.children[1]||null);
      }
    }
    const configGroup=$$('.v60-nav-group').find(g=>norm(g.textContent).includes('configuracoes')||norm(g.textContent).includes('configurações'));
    if(configGroup && !configGroup.querySelector('[data-v62-theme-link]')){
      const list=configGroup.querySelector('.v60-flyout-list');
      if(list){const b=document.createElement('button'); b.type='button'; b.className='v60-subitem v62-config-subitem'; b.dataset.v62ThemeLink='true'; b.innerHTML=`<span class="v60-sub-icon">${icons.palette}</span><span>Aparência e cores</span>`; b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();goView('importar');setTimeout(()=>$('#v62ThemePanel')?.scrollIntoView({behavior:'smooth',block:'start'}),180);}); list.insertBefore(b,list.children[1]||null);}
    }
  }

  document.addEventListener('click',(e)=>{
    const btn=e.target.closest('[data-v62-view]'); if(!btn) return; e.preventDefault(); goView(btn.dataset.v62View);
  });

  function boot(){
    document.body.classList.add('crm-v62-garimpo-temas');
    applyTheme(getTheme());
    ensureGarimpoPage();
    ensureThemePanel();
    injectSidebarGarimpo();
    [250,900,1900,2600].forEach(ms=>setTimeout(()=>{ensureGarimpoPage();ensureThemePanel();injectSidebarGarimpo();applyTheme(getTheme());},ms));
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
  window.addEventListener('pageshow',()=>setTimeout(boot,0));
})();
