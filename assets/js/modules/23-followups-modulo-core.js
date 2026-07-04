/* Script original 23 */
(function(){
  'use strict';
  if(window.__crmProV35Followups) return;
  window.__crmProV35Followups = true;
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=(v)=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const money=(n)=>'R$ '+(Number(n)||0).toLocaleString('pt-BR',{maximumFractionDigits:0});
  const today=()=>new Date().toISOString().slice(0,10);
  const addDays=(iso,d)=>{const x=new Date((iso||today())+'T12:00:00');x.setDate(x.getDate()+Number(d||0));return x.toISOString().slice(0,10)};
  const daysDiff=(iso)=>{if(!iso)return 9999;const a=new Date(String(iso).slice(0,10)+'T12:00:00');const b=new Date(today()+'T12:00:00');return Math.round((a-b)/864e5)};
  const fmt=(iso)=>{if(!iso)return 'Sem data';try{return new Date(String(iso).slice(0,10)+'T12:00:00').toLocaleDateString('pt-BR')}catch(e){return iso}};
  const initials=(name)=>String(name||'Lead').split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();
  const openStages=['Lead','Contato','Proposta'];
  let fuFilter='todos';

  function leadList(){
    try{ if(typeof leads!=='undefined' && Array.isArray(leads)) return leads; }catch(e){}
    try{return JSON.parse(localStorage.getItem('outbounder_leads_v5')||'[]')}catch(e){return []}
  }
  function persist(){
    try{ if(typeof saveLeads==='function') saveLeads(); else localStorage.setItem('outbounder_leads_v5',JSON.stringify(leadList())); }catch(e){}
    try{ if(typeof renderAll==='function') renderAll(); }catch(e){}
    try{ if(typeof renderAgenda==='function') renderAgenda(); }catch(e){}
  }
  function toast(msg,type){try{(window.showToast||showToast)(msg,type||'success')}catch(e){console.log(msg)}}
  function score(l){try{return typeof calcScore==='function'?calcScore(l):0}catch(e){return 0}}
  function isOpen(l){return !['Fechado','Perdido'].includes(l.etapa)}
  function status(l){
    if(!l.followup) return 'nodate';
    const d=daysDiff(l.followup);
    if(d<0) return 'overdue';
    if(d===0) return 'today';
    if(d<=7) return 'week';
    return 'future';
  }
  function statusLabel(l){
    const st=status(l),d=daysDiff(l.followup);
    if(st==='nodate')return 'Sem próximo passo';
    if(st==='overdue')return `Vencido há ${Math.abs(d)}d`;
    if(st==='today')return 'Hoje';
    if(st==='week')return `Em ${d}d`;
    return fmt(l.followup);
  }
  function stageTag(stage){const m={Lead:'tag-lead',Contato:'tag-contato',Proposta:'tag-proposta',Fechado:'tag-fechado',Perdido:'tag-perdido'};return `<span class="tag ${m[stage]||'tag-neutro'}">${esc(stage||'Lead')}</span>`}
  function priTag(p){const m={Alta:'tag-alta','Média':'tag-media',Baixa:'tag-baixa'};return `<span class="tag ${m[p]||'tag-neutro'}">${esc(p||'Média')}</span>`}
  function filtered(){
    const q=($('#fuSearch')?.value||'').toLowerCase().trim();
    let arr=leadList().filter(isOpen);
    arr=arr.filter(l=>{
      const st=status(l),d=daysDiff(l.followup);
      if(fuFilter==='vencidos' && st!=='overdue')return false;
      if(fuFilter==='hoje' && st!=='today')return false;
      if(fuFilter==='semana' && !(d>=0&&d<=7&&l.followup))return false;
      if(fuFilter==='sem-data' && st!=='nodate')return false;
      if(fuFilter==='alta' && l.prioridade!=='Alta')return false;
      if(q){const hay=[l.nome,l.segmento,l.responsavel,l.email,l.telefone,l.obs,l.etapa,l.prioridade].join(' ').toLowerCase();if(!hay.includes(q))return false;}
      return true;
    });
    const sort=$('#fuSort')?.value||'date';
    arr.sort((a,b)=>{
      if(sort==='score')return score(b)-score(a);
      if(sort==='value')return (Number(b.valor)||0)-(Number(a.valor)||0);
      if(sort==='stage')return String(a.etapa||'').localeCompare(String(b.etapa||''));
      return (daysDiff(a.followup))-(daysDiff(b.followup));
    });
    return arr;
  }
  function renderKpis(){
    const arr=leadList().filter(isOpen),over=arr.filter(l=>status(l)==='overdue'),todayArr=arr.filter(l=>status(l)==='today'),week=arr.filter(l=>{const d=daysDiff(l.followup);return l.followup&&d>=0&&d<=7}),nodate=arr.filter(l=>!l.followup),risk=over.reduce((s,l)=>s+(Number(l.valor)||0),0);
    const set=(id,v)=>{const el=$(id);if(el)el.textContent=v};
    set('#fuKpiOverdue',over.length);set('#fuKpiToday',todayArr.length);set('#fuKpiWeek',week.length);set('#fuKpiNoNext',nodate.length);set('#fuKpiRisk',money(risk));
  }
  function renderLeadSelect(){
    const sel=$('#fuLeadSelect'); if(!sel)return;
    const old=sel.value;
    const arr=leadList().filter(isOpen).sort((a,b)=>String(a.nome).localeCompare(String(b.nome)));
    sel.innerHTML=arr.map(l=>`<option value="${esc(l.id||l.nome)}">${esc(l.nome)} — ${esc(l.etapa||'Lead')}</option>`).join('')||'<option value="">Nenhum lead aberto</option>';
    if(old)sel.value=old;
  }
  function renderList(){
    const list=$('#fuList'); if(!list)return;
    const arr=filtered();
    $('#fuListCount') && ($('#fuListCount').textContent=`${arr.length} ${arr.length===1?'item':'itens'}`);
    if(!arr.length){list.innerHTML='<div class="fu-empty"><b>Nenhum follow-up encontrado</b>Ajuste os filtros ou crie um novo próximo passo para um lead aberto.</div>';return}
    list.innerHTML=arr.map(l=>{
      const st=status(l);const pill=st==='overdue'?'overdue':st==='today'?'today':'';
      const next=l.proximaAcao||l.nextAction||l.obs||'Sem observação cadastrada.';
      return `<div class="followup-item ${st==='week'?'future':st}" data-fu-id="${esc(l.id||l.nome)}">
        <div class="fu-avatar">${esc(initials(l.nome))}</div>
        <div>
          <div class="fu-title"><b>${esc(l.nome)}</b>${stageTag(l.etapa)}${priTag(l.prioridade)}<span class="fu-date-pill ${pill}">${statusLabel(l)}</span></div>
          <div class="fu-meta"><span>${esc(l.segmento||'Sem segmento')}</span><span>Responsável: ${esc(l.responsavel||'Não definido')}</span><span>Score ${score(l)}</span><span>${money(l.valor)}</span></div>
          <div class="fu-note">${esc(next)}</div>
        </div>
        <div class="fu-actions">
          <button class="fu-action" data-fu-done="${esc(l.id||l.nome)}">Registrar contato</button>
          <button class="fu-action" data-fu-delay="${esc(l.id||l.nome)}">Adiar +2d</button>
          <button class="fu-action" data-fu-open="${esc(l.id||l.nome)}">Abrir</button>
        </div>
      </div>`;
    }).join('');
  }
  function renderRoutine(){
    const box=$('#fuRoutine'); if(!box)return;
    const arr=leadList().filter(isOpen).slice().sort((a,b)=>{
      const pr=(x)=>status(x)==='overdue'?0:status(x)==='today'?1:!x.followup?2:3;
      return pr(a)-pr(b)||score(b)-score(a)||(Number(b.valor)||0)-(Number(a.valor)||0);
    }).slice(0,5);
    if(!arr.length){box.innerHTML='<div class="fu-empty"><b>Rotina livre</b>Sem oportunidades abertas para acompanhar.</div>';return}
    box.innerHTML=arr.map((l,i)=>`<div class="routine-item"><div class="routine-rank">${i+1}</div><div><b>${esc(l.nome)} · ${statusLabel(l)}</b><p>${esc(l.proximaAcao||l.obs||'Fazer contato, atualizar histórico e definir próxima data.')}</p></div></div>`).join('');
  }
  function renderAllFu(){renderKpis();renderLeadSelect();renderList();renderRoutine();}
  function findLead(ref){return leadList().find(l=>String(l.id||l.nome)===String(ref)||String(l.nome)===String(ref));}
  function addActivity(l,tipo,texto){
    if(!l)return; if(!Array.isArray(l.atividades))l.atividades=[];
    l.atividades.unshift({id:'fu_'+Date.now().toString(36),tipo:tipo||'Follow-up',texto:texto||'',autor:'Você',data:new Date().toISOString()});
  }
  function saveQuick(){
    const ref=$('#fuLeadSelect')?.value, l=findLead(ref); if(!l){toast('Escolha um lead','warn');return}
    const date=$('#fuDate')?.value||today(), type=$('#fuType')?.value||'Follow-up', note=($('#fuNote')?.value||'').trim();
    l.followup=date; l.proximaAcao=`${type}: ${note||'realizar novo contato'}`; l.ultimaAtualizacao=today();
    addActivity(l,'Follow-up',`Follow-up agendado para ${fmt(date)}. ${type}${note?': '+note:''}`);
    persist(); renderAllFu(); toast('Follow-up salvo','success');
  }
  function complete(ref){
    const l=findLead(ref); if(!l)return;
    const next=addDays(today(),3); addActivity(l,'Contato',`Contato registrado pela aba Follow-ups. Próximo acompanhamento sugerido para ${fmt(next)}.`);
    l.followup=next; l.proximaAcao='Fazer novo acompanhamento após o contato registrado'; l.ultimaAtualizacao=today();
    persist(); renderAllFu(); toast('Contato registrado e próximo follow-up criado','success');
  }
  function delay(ref){
    const l=findLead(ref); if(!l)return;
    l.followup=addDays(l.followup||today(),2); l.proximaAcao=l.proximaAcao||'Follow-up reagendado';
    addActivity(l,'Follow-up',`Follow-up adiado para ${fmt(l.followup)}.`); persist(); renderAllFu(); toast('Follow-up adiado','success');
  }
  function openLead(ref){
    const l=findLead(ref); if(!l)return;
    try{ if(typeof openDetail==='function') openDetail(l.nome); else if(typeof openModal==='function') openModal(l); }catch(e){try{window.setView('leads')}catch(_){}}
  }
  function template(kind){
    const base={
      whatsapp:'Oi [NOME], tudo bem? Passando para dar continuidade ao nosso último contato. Conseguiu avaliar o que conversamos? Posso te ajudar com alguma dúvida para avançarmos?',
      proposta:'Oi [NOME], tudo bem? Te enviei a proposta e queria confirmar se fez sentido para o cenário de vocês. Posso te mostrar os pontos principais em 10 minutos?',
      breakup:'Oi [NOME], como não consegui retorno, vou pausar meu contato por aqui. Se isso ainda for prioridade mais adiante, fico à disposição para retomarmos de forma objetiva.',
      reuniao:'Oi [NOME], tudo certo? Passando para confirmar nossa reunião. O horário segue bom para você? Se quiser, já levo um resumo objetivo com próximos passos.'
    };
    const txt=base[kind]||base.whatsapp;
    if(navigator.clipboard?.writeText)navigator.clipboard.writeText(txt).then(()=>toast('Modelo copiado','success')).catch(()=>toast(txt,'success')); else toast(txt,'success');
  }
  function bind(){
    $('#fuSearch')?.addEventListener('input',renderAllFu); $('#fuSort')?.addEventListener('change',renderAllFu);
    $$('#fuFilters [data-fu-filter]').forEach(b=>b.addEventListener('click',()=>{fuFilter=b.dataset.fuFilter; $$('#fuFilters .chip').forEach(x=>x.classList.toggle('active',x===b)); renderAllFu();}));
    $('#fuSaveQuick')?.addEventListener('click',saveQuick);
    $('#fuGenerateRoutine')?.addEventListener('click',()=>{renderRoutine();toast('Rotina de follow-up atualizada','success')});
    $('#fuOpenQuickCreate')?.addEventListener('click',()=>{$('#fuQuickCreateCard')?.scrollIntoView({behavior:'smooth',block:'center'}); $('#fuLeadSelect')?.focus();});
    document.addEventListener('click',e=>{
      const done=e.target.closest('[data-fu-done]'),del=e.target.closest('[data-fu-delay]'),op=e.target.closest('[data-fu-open]'),tp=e.target.closest('[data-fu-template]');
      if(done){e.preventDefault();e.stopPropagation();complete(done.dataset.fuDone)}
      if(del){e.preventDefault();e.stopPropagation();delay(del.dataset.fuDelay)}
      if(op){e.preventDefault();e.stopPropagation();openLead(op.dataset.fuOpen)}
      if(tp){e.preventDefault();template(tp.dataset.fuTemplate)}
    });
  }
  function relabel(){
    $$('[data-view="cadencias"]').forEach(el=>{if(el.tagName==='BUTTON'||el.classList.contains('rail-btn'))el.title='Follow-ups'; const span=el.querySelector('span'); if(span&&/Cad/i.test(span.textContent))span.textContent='Follow-ups'; if(el.classList.contains('tab')&&/Cad/i.test(el.textContent))el.textContent='Follow-ups';});
    const old=window.setView;
    if(typeof old==='function'&&!old.__fuV35){
      const wrapped=function(v){old(v); if(v==='cadencias'){const t=$('#topbarTitle'),s=$('#topbarSub'); if(t)t.textContent='Follow-ups'; if(s)s.textContent='Rotina de próximos contatos'; setTimeout(renderAllFu,40); }};
      wrapped.__fuV35=true; window.setView=wrapped; try{setView=wrapped}catch(e){}
    }
  }
  function boot(){relabel(); bind(); renderAllFu(); $('#fuDate') && ($('#fuDate').value=today());}
  document.addEventListener('crm:viewchange',e=>{if(e.detail?.view==='cadencias'){const t=$('#topbarTitle'),s=$('#topbarSub'); if(t)t.textContent='Follow-ups'; if(s)s.textContent='Rotina de próximos contatos'; setTimeout(renderAllFu,30)}});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,250)); else setTimeout(boot,250);
})();
