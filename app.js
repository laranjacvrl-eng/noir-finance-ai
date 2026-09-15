const KEY="noir-finance-v2";
const state=JSON.parse(localStorage.getItem(KEY)||"null")||{
  transactions:[],
  accounts:[
    {id:crypto.randomUUID(),name:"Nubank",type:"Conta corrente",initial:0},
    {id:crypto.randomUUID(),name:"Inter",type:"Conta corrente",initial:0}
  ],
  cards:[],budgets:[],goals:[],recurring:[],hide:false
};
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function money(v){if(state.hide)return "••••";return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(v)||0)}
function dateBR(d){return new Intl.DateTimeFormat("pt-BR").format(new Date(d+"T12:00:00"))}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function sum(type){return state.transactions.filter(t=>t.type===type).reduce((a,t)=>a+Number(t.value),0)}
function monthTx(){let n=new Date();let m=n.getMonth(),y=n.getFullYear();return state.transactions.filter(t=>{let d=new Date(t.date+"T12:00:00");return d.getMonth()===m&&d.getFullYear()===y})}
function monthSum(type){return monthTx().filter(t=>t.type===type).reduce((a,t)=>a+Number(t.value),0)}
function accountBalance(a){return Number(a.initial||0)+state.transactions.filter(t=>t.accountId===a.id).reduce((x,t)=>x+(t.type==="entrada"?Number(t.value):-Number(t.value)),0)}
function toast(msg){let x=document.createElement("div");x.className="toast";x.textContent=msg;document.getElementById("toastWrap").appendChild(x);setTimeout(()=>x.remove(),2800)}
function openModal(html){document.getElementById("modal").innerHTML=html;document.getElementById("modalBackdrop").classList.add("open")}
function closeModal(){document.getElementById("modalBackdrop").classList.remove("open")}
document.getElementById("modalBackdrop").addEventListener("click",e=>{if(e.target.id==="modalBackdrop")closeModal()});
function pageNav(p){document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===p));render(p)}
document.getElementById("nav").addEventListener("click",e=>{let b=e.target.closest(".nav-item");if(b)pageNav(b.dataset.page)});
document.querySelector(".sidebar-bottom").addEventListener("click",e=>{let b=e.target.closest(".nav-item");if(b)pageNav(b.dataset.page)});
document.getElementById("newTransaction").onclick=()=>transactionModal();
document.getElementById("openAI").onclick=()=>pageNav("ai");
document.getElementById("hideBalances").onclick=()=>{state.hide=!state.hide;save();render(currentPage);};
let currentPage="overview";

function render(p="overview"){
 currentPage=p;
 const titles={overview:["PERSONAL FINANCE","Visão geral"],transactions:["LEDGER","Lançamentos"],accounts:["BANKING","Bancos & contas"],cards:["CREDIT","Cartões"],budgets:["PLANNING","Orçamentos"],goals:["TARGETS","Metas"],recurring:["AUTOMATION","Recorrentes"],ai:["ASSISTANT","Finance AI"],reports:["EXPORT","Relatórios"],settings:["SYSTEM","Configurações"]};
 document.getElementById("pageEyebrow").textContent=titles[p][0];document.getElementById("pageTitle").textContent=titles[p][1];
 document.getElementById("page").innerHTML=pages[p]();
 bindPage(p);
}
const pages={
overview(){let mi=monthSum("entrada"),mo=monthSum("saída"),res=mi-mo,tx=monthTx().slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6);
return `<div class="page-grid stats">
<div class="stat"><div class="label">Saldo total</div><div class="value">${money(state.accounts.reduce((a,x)=>a+accountBalance(x),0))}</div><div class="sub">${state.accounts.length} conta(s) conectada(s) localmente</div></div>
<div class="stat"><div class="label">Entradas · mês</div><div class="value">${money(mi)}</div><div class="sub">somente lançamentos registrados</div></div>
<div class="stat"><div class="label">Saídas · mês</div><div class="value">${money(mo)}</div><div class="sub">somente lançamentos registrados</div></div>
<div class="stat"><div class="label">Resultado · mês</div><div class="value">${money(res)}</div><div class="sub">${res>=0?"saldo positivo":"saldo negativo"} no período</div></div>
</div>
<div class="page-grid split">
<div class="panel"><div class="panel-head"><h2>Movimentações recentes</h2><span>ESTE MÊS</span></div>${tx.length?`<div class="list">${tx.map(rowTx).join("")}</div>`:`<div class="empty"><div><b>Seu histórico começa aqui.</b><p>Nenhum lançamento foi criado. Use “+ Lançamento” ou fale naturalmente com a Finance AI.</p></div></div>`}</div>
<div class="panel"><div class="panel-head"><h2>Seus bancos</h2><span>${state.accounts.length}</span></div><div class="bank-grid">${state.accounts.map(bankCard).join("")}</div><div style="height:10px"></div><button class="quick" data-action="addAccount">+ Adicionar outro banco/conta</button></div>
</div>
<div class="panel" style="margin-top:12px"><div class="panel-head"><h2>Ações rápidas</h2><span>COMMANDS</span></div><div class="quick-grid">
<button class="quick" data-action="income">Registrar entrada</button><button class="quick" data-action="expense">Registrar saída</button><button class="quick" data-action="ask">Perguntar à IA</button>
</div></div>`},
transactions(){return `<div class="panel"><div class="panel-head"><h2>Todos os lançamentos</h2><button class="primary-btn" data-action="new">+ Novo</button></div>${state.transactions.length?`<div class="table-wrap"><table class="table"><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Banco</th><th>Tipo</th><th>Valor</th><th></th></tr></thead><tbody>${state.transactions.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(t=>`<tr><td>${dateBR(t.date)}</td><td>${esc(t.description)}</td><td>${esc(t.category)}</td><td>${esc(accountName(t.accountId))}</td><td class="${t.type==="entrada"?"in":"out"}">${t.type}</td><td class="money">${money(t.value)}</td><td><div class="actions"><button class="small-btn" data-edit="${t.id}">Editar</button><button class="small-btn danger" data-del="${t.id}">Excluir</button></div></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty"><div><b>Nenhum lançamento</b><p>Registre entradas e saídas para começar a construir seu histórico.</p></div></div>`}</div>`},
accounts(){return `<div class="page-grid split"><div class="panel"><div class="panel-head"><h2>Contas bancárias</h2><button class="primary-btn" data-action="addAccount">+ Conta</button></div><div class="list">${state.accounts.map(a=>`<div class="row"><div><div class="row-title">${esc(a.name)}</div><div class="row-sub">${esc(a.type)} · saldo inicial ${money(a.initial)}</div></div><div class="money">${money(accountBalance(a))}</div><button class="small-btn danger" data-account-del="${a.id}">Excluir</button></div>`).join("")}</div></div><div class="panel"><div class="panel-head"><h2>Conexões disponíveis</h2><span>MANUAL</span></div><div class="notice"><strong>Nubank e Inter já estão prontos.</strong><br>O app não acessa sua conta bancária nem puxa dados reais. Os lançamentos são registrados por você e ficam salvos neste navegador.</div></div></div>`},
cards(){return moduleList("Cartões","card",["Nome do cartão","Banco","Limite"],"Nenhum cartão cadastrado.")},
budgets(){return moduleList("Orçamentos","budget",["Categoria","Limite mensal"],"Nenhum orçamento criado.")},
goals(){return moduleList("Metas","goal",["Nome","Valor alvo"],"Nenhuma meta criada.")},
recurring(){return moduleList("Recorrentes","recurring",["Descrição","Valor"],"Nenhuma recorrência criada.")},
ai(){return `<div class="ai-layout"><div class="panel chat"><div class="panel-head"><h2>Finance AI</h2><span>LOCAL ASSISTANT</span></div><div class="messages" id="messages"><div class="msg">Olá. Posso interpretar comandos financeiros usando os dados deste navegador. Experimente: <b>“gastei 80 em alimentação no Nubank”</b>, <b>“recebi 1200 no Inter”</b> ou <b>“quanto gastei esse mês?”</b>.</div></div><div class="chat-input"><input id="aiInput" placeholder="Escreva uma pergunta ou comando..."><button class="primary-btn" id="aiSend">Enviar</button></div></div><div class="panel"><div class="panel-head"><h2>O que eu consigo fazer</h2></div><div class="insight">Registrar <b>entradas</b> e <b>saídas</b> por linguagem natural.</div><div class="insight">Escolher automaticamente <b>Nubank</b>, <b>Inter</b> ou outra conta cadastrada.</div><div class="insight">Responder total de entradas, saídas, saldo e maiores gastos.</div><div class="insight">Filtrar por categoria ou banco em perguntas simples.</div><div class="notice" style="margin-top:15px"><strong>Importante:</strong> esta versão usa um interpretador local. Ela não envia seus dados para uma API de IA.</div></div></div>`},
reports(){return `<div class="page-grid split"><div class="panel"><div class="panel-head"><h2>Relatório financeiro</h2><span>XLSX</span></div><div class="notice"><strong>Excel completo.</strong><br>O arquivo terá abas de resumo, lançamentos, entradas, saídas, categorias, bancos, cartões, orçamentos, metas e recorrentes.</div><button class="primary-btn" data-action="excel" style="margin-top:14px">Exportar relatório .xlsx</button><button class="ghost-btn" data-action="json" style="margin:14px 0 0 7px">Backup .json</button></div><div class="panel"><div class="panel-head"><h2>Resumo do período</h2></div><div class="list"><div class="row"><div class="row-title">Entradas</div><div class="money in">${money(sum("entrada"))}</div><span></span></div><div class="row"><div class="row-title">Saídas</div><div class="money out">${money(sum("saída"))}</div><span></span></div><div class="row"><div class="row-title">Resultado</div><div class="money">${money(sum("entrada")-sum("saída"))}</div><span></span></div></div></div></div>`},
settings(){return `<div class="settings-grid"><div class="panel"><div class="panel-head"><h2>Dados</h2></div><button class="setting-btn" data-action="json"><strong>Exportar backup</strong><span>Salva todos os dados em JSON.</span></button><div style="height:8px"></div><button class="setting-btn" data-action="reset"><strong>Limpar dados</strong><span>Remove lançamentos, contas e configurações deste navegador.</span></button></div><div class="panel"><div class="panel-head"><h2>Privacidade</h2></div><button class="setting-btn" data-action="hide"><strong>${state.hide?"Mostrar":"Ocultar"} valores</strong><span>Alterna a visualização dos valores financeiros.</span></button><div style="height:12px"></div><div class="notice">Se você limpar os dados do navegador, o conteúdo local poderá ser perdido. Faça um backup antes.</div></div></div>`}
};
function moduleList(title,type,fields,empty){let arr=state[type+"s"]||[];return `<div class="panel"><div class="panel-head"><h2>${title}</h2><button class="primary-btn" data-action="genericAdd" data-type="${type}">+ Novo</button></div>${arr.length?`<div class="list">${arr.map(x=>`<div class="row"><div><div class="row-title">${esc(x.name||x.description)}</div><div class="row-sub">${esc(x.bank||x.category||"")}</div></div><div class="money">${money(x.limit||x.target||x.value)}</div><button class="small-btn danger" data-generic-del="${x.id}" data-type="${type}">Excluir</button></div>`).join("")}</div>`:`<div class="empty"><div><b>${empty}</b><p>Crie seu primeiro registro. O painel não inventa valores.</p></div></div>`}</div>`}
function rowTx(t){return `<div class="row"><div><div class="row-title">${esc(t.description)}</div><div class="row-sub">${dateBR(t.date)} · ${esc(t.category)} · ${esc(accountName(t.accountId))}</div></div><span class="tag">${t.type}</span><div class="money ${t.type==="entrada"?"in":"out"}">${t.type==="entrada"?"+":"-"} ${money(t.value)}</div></div>`}
function bankCard(a){return `<div class="bank"><div class="bank-top"><div class="bank-name">${esc(a.name)}</div><div class="bank-logo">${a.name==="Nubank"?"NU":"INTER"}</div></div><div class="bank-balance">${money(accountBalance(a))}</div><div class="bank-meta">${state.transactions.filter(t=>t.accountId===a.id).length} lançamento(s)</div></div>`}
function accountName(id){return state.accounts.find(a=>a.id===id)?.name||"Sem conta"}
function transactionModal(type="saída",existing=null){
 let t=existing||{type,value:"",description:"",category:"",accountId:state.accounts[0]?.id||"",date:new Date().toISOString().slice(0,10)};
 openModal(`<h2>${existing?"Editar":"Novo"} lançamento</h2><div class="modal-sub">Escolha o banco para que o saldo seja calculado na conta correta.</div>
 <div class="form-grid"><div class="field"><label>Tipo</label><select id="fType"><option value="saída" ${t.type==="saída"?"selected":""}>Saída</option><option value="entrada" ${t.type==="entrada"?"selected":""}>Entrada</option></select></div>
 <div class="field"><label>Valor</label><input id="fValue" type="number" step="0.01" min="0" value="${t.value}"></div>
 <div class="field full"><label>Descrição</label><input id="fDesc" value="${esc(t.description)}" placeholder="Ex.: Mercado"></div>
 <div class="field"><label>Categoria</label><input id="fCat" value="${esc(t.category)}" placeholder="Ex.: Alimentação"></div>
 <div class="field"><label>Banco / conta</label><select id="fAccount">${state.accounts.map(a=>`<option value="${a.id}" ${a.id===t.accountId?"selected":""}>${esc(a.name)}</option>`).join("")}</select></div>
 <div class="field"><label>Data</label><input id="fDate" type="date" value="${t.date}"></div></div>
 <div class="modal-actions"><button class="ghost-btn" id="cancelModal">Cancelar</button><button class="primary-btn" id="saveTx">Salvar lançamento</button></div>`);
 document.getElementById("cancelModal").onclick=closeModal;
 document.getElementById("saveTx").onclick=()=>{
   let value=Number(document.getElementById("fValue").value),desc=document.getElementById("fDesc").value.trim();
   if(!value||!desc)return toast("Informe descrição e valor.");
   let obj={id:t.id||crypto.randomUUID(),type:document.getElementById("fType").value,value,description:desc,category:document.getElementById("fCat").value.trim()||"Sem categoria",accountId:document.getElementById("fAccount").value,date:document.getElementById("fDate").value};
   if(existing){let i=state.transactions.findIndex(x=>x.id===existing.id);state.transactions[i]=obj}else state.transactions.push(obj);
   save();closeModal();render(currentPage);toast("Lançamento salvo.");
 };
}
function addAccount(){
 openModal(`<h2>Adicionar conta</h2><div class="modal-sub">Você pode usar Nubank, Inter ou qualquer outro banco.</div><div class="form-grid"><div class="field"><label>Banco</label><select id="aName"><option>Nubank</option><option>Inter</option><option>Outro</option></select></div><div class="field"><label>Nome personalizado</label><input id="aCustom" placeholder="Ex.: Inter principal"></div><div class="field"><label>Saldo inicial</label><input id="aInitial" type="number" step="0.01" value="0"></div></div><div class="modal-actions"><button class="ghost-btn" id="cancelModal">Cancelar</button><button class="primary-btn" id="saveAccount">Adicionar</button></div>`);
 document.getElementById("cancelModal").onclick=closeModal;document.getElementById("saveAccount").onclick=()=>{let sel=document.getElementById("aName").value,custom=document.getElementById("aCustom").value.trim();state.accounts.push({id:crypto.randomUUID(),name:custom||sel,type:"Conta corrente",initial:Number(document.getElementById("aInitial").value)||0});save();closeModal();render(currentPage);toast("Conta adicionada.")};
}
function genericAdd(type){
 let cfg={card:["Cartão","Nome do cartão","Banco","Limite"],budget:["Orçamento","Categoria","Categoria","Limite mensal"],goal:["Meta","Nome da meta","Meta","Valor alvo"],recurring:["Recorrência","Descrição","Categoria","Valor"]}[type];
 openModal(`<h2>Novo ${cfg[0]}</h2><div class="form-grid"><div class="field"><label>${cfg[1]}</label><input id="gName"></div><div class="field"><label>${cfg[2]}</label><input id="gBank"></div><div class="field"><label>${cfg[3]}</label><input id="gValue" type="number" step="0.01"></div></div><div class="modal-actions"><button class="ghost-btn" id="cancelModal">Cancelar</button><button class="primary-btn" id="saveGeneric">Salvar</button></div>`);
 document.getElementById("cancelModal").onclick=closeModal;document.getElementById("saveGeneric").onclick=()=>{let key=type+"s";state[key]=state[key]||[];let o={id:crypto.randomUUID(),name:document.getElementById("gName").value.trim()||cfg[0],bank:document.getElementById("gBank").value.trim(),value:Number(document.getElementById("gValue").value)||0};if(type==="budget")o.limit=o.value;if(type==="goal")o.target=o.value;state[key].push(o);save();closeModal();render(currentPage);toast("Registro salvo.")};
}
function parseCommand(text){
 let s=text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
 let valueMatch=s.match(/(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)/);let value=valueMatch?Number(valueMatch[1].replace(".","").replace(",", ".")):null;
 let isOut=/\b(gastei|gasto|paguei|pagar|saida|saquei|comprei|comi|despesa)\b/.test(s);
 let isIn=/\b(recebi|ganhei|entrou|entrada|salario|salario)\b/.test(s);
 let account=state.accounts.find(a=>s.includes(a.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")));
 let cats=["alimentacao","mercado","transporte","moradia","lazer","saude","educacao","assinaturas","compras","contas","salario","freelance"];
 let cat=cats.find(c=>s.includes(c))||"Sem categoria";
 if((isOut||isIn)&&value){
   let desc=text.replace(/r\$\s*\d+(?:[.,]\d{1,2})?/ig,"").replace(/\b(gastei|gasto|paguei|pagar|saida|saquei|comprei|comi|despesa|recebi|ganhei|entrou|entrada|salario|freelance|no nubank|no inter)\b/ig,"").trim().replace(/\s+/g," ");
   return {kind:"transaction",type:isIn&&!isOut?"entrada":"saída",value,category:cat,accountId:account?.id||state.accounts[0]?.id,description:desc||cat};
 }
 if(/quanto.*(gastei|gasto|saida)|total.*(gasto|saida)|despesas/.test(s))return {kind:"query",q:"out"};
 if(/quanto.*(recebi|entrada)|total.*entrada/.test(s))return {kind:"query",q:"in"};
 if(/saldo|quanto tenho/.test(s))return {kind:"query",q:"balance"};
 if(/maior.*gasto|maiores.*gastos|onde.*gasto/.test(s))return {kind:"query",q:"top"};
 if(/excel|relatorio/.test(s))return {kind:"excel"};
 return {kind:"help"};
}
function executeAI(text,outputEl){
 let r=parseCommand(text);
 if(r.kind==="transaction"){let t={id:crypto.randomUUID(),type:r.type,value:r.value,description:r.description,category:r.category,accountId:r.accountId,date:new Date().toISOString().slice(0,10)};state.transactions.push(t);save();let bank=accountName(t.accountId);outputEl(`Registrei ${t.type} de ${money(t.value)} em ${t.category}, na conta ${bank}.`);render(currentPage);return}
 if(r.kind==="query"){if(r.q==="out")outputEl(`Você registrou ${money(sum("saída"))} em saídas no total e ${money(monthSum("saída"))} neste mês.`);if(r.q==="in")outputEl(`Você registrou ${money(sum("entrada"))} em entradas no total e ${money(monthSum("entrada"))} neste mês.`);if(r.q==="balance")outputEl(`O saldo calculado das suas contas é ${money(state.accounts.reduce((a,x)=>a+accountBalance(x),0))}.`);if(r.q==="top"){let m={};state.transactions.filter(t=>t.type==="saída").forEach(t=>m[t.category]=(m[t.category]||0)+Number(t.value));let top=Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,5);outputEl(top.length?"Maiores categorias de saída: "+top.map(x=>`${x[0]} (${money(x[1])})`).join(", ")+".":"Ainda não há saídas para analisar.");}return}
 if(r.kind==="excel"){exportExcel();outputEl("Gerei o relatório Excel com os dados atuais.");return}
 outputEl('Posso registrar lançamentos e responder consultas. Exemplo: “gastei 45 em alimentação no Nubank” ou “recebi 1200 no Inter”.');
}
function bindAI(){let inp=document.getElementById("aiInput"),send=()=>{let v=inp.value.trim();if(!v)return;let box=document.getElementById("messages");box.insertAdjacentHTML("beforeend",`<div class="msg user">${esc(v)}</div>`);inp.value="";let out=document.createElement("div");out.className="msg";box.appendChild(out);executeAI(v,x=>out.textContent=x);box.scrollTop=box.scrollHeight};document.getElementById("aiSend").onclick=send;inp.addEventListener("keydown",e=>{if(e.key==="Enter")send()})}
function bindPage(p){if(p==="ai")bindAI();document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>{let t=state.transactions.find(x=>x.id===b.dataset.edit);transactionModal(t.type,t)});document.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{if(confirm("Excluir este lançamento?")){state.transactions=state.transactions.filter(x=>x.id!==b.dataset.del);save();render(p)}});document.querySelectorAll("[data-account-del]").forEach(b=>b.onclick=()=>{if(state.transactions.some(t=>t.accountId===b.dataset.accountDel))return toast("Não exclua uma conta que possui lançamentos.");state.accounts=state.accounts.filter(x=>x.id!==b.dataset.accountDel);save();render(p)});document.querySelectorAll("[data-generic-del]").forEach(b=>b.onclick=()=>{if(confirm("Excluir este registro?")){let k=b.dataset.type+"s";state[k]=state[k].filter(x=>x.id!==b.dataset.genericDel);save();render(p)}});document.querySelectorAll("[data-action]").forEach(b=>b.onclick=()=>{let a=b.dataset.action;if(a==="new")transactionModal();if(a==="income")transactionModal("entrada");if(a==="expense")transactionModal("saída");if(a==="ask")pageNav("ai");if(a==="addAccount")addAccount();if(a==="excel")exportExcel();if(a==="json")backup();if(a==="hide"){state.hide=!state.hide;save();render(p)}if(a==="reset"&&confirm("Apagar TODOS os dados locais?")){localStorage.removeItem(KEY);location.reload()}if(a==="genericAdd")genericAdd(b.dataset.type)})}
function backup(){let blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="noir-finance-backup.json";a.click();URL.revokeObjectURL(a.href)}
function exportExcel(){
 if(typeof XLSX==="undefined")return toast("Biblioteca Excel não carregou. Verifique sua internet e tente novamente.");
 let wb=XLSX.utils.book_new();
 let tx=state.transactions.map(t=>({Data:t.date,Descrição:t.description,Tipo:t.type,Categoria:t.category,Banco:accountName(t.accountId),Valor:Number(t.value)}));
 let income=tx.filter(x=>x.Tipo==="entrada"),out=tx.filter(x=>x.Tipo==="saída"),cat={};out.forEach(x=>cat[x.Categoria]=(cat[x.Categoria]||0)+x.Valor);
 let sheets=[
 ["Resumo",[{Indicador:"Entradas",Valor:sum("entrada")},{Indicador:"Saídas",Valor:sum("saída")},{Indicador:"Resultado",Valor:sum("entrada")-sum("saída")}]],
 ["Lançamentos",tx],["Entradas",income],["Saídas",out],
 ["Por categoria",Object.entries(cat).sort((a,b)=>b[1]-a[1]).map(([Categoria,Valor])=>({Categoria,Valor}))],
 ["Bancos",state.accounts.map(a=>({Banco:a.name,Tipo:a.type,"Saldo inicial":Number(a.initial||0),"Saldo atual":accountBalance(a)}))],
 ["Cartões",(state.cards||[]).map(x=>({Nome:x.name,Banco:x.bank,Limite:Number(x.value||0)}))],
 ["Orçamentos",(state.budgets||[]).map(x=>({Categoria:x.name,Limite:Number(x.limit||0)}))],
 ["Metas",(state.goals||[]).map(x=>({Meta:x.name,"Valor alvo":Number(x.target||0)}))],
 ["Recorrentes",(state.recurring||[]).map(x=>({Descrição:x.name,Categoria:x.bank,Valor:Number(x.value||0)}))]
 ];
 sheets.forEach(([name,data])=>{let ws=XLSX.utils.json_to_sheet(data);ws["!cols"]=[{wch:22},{wch:28},{wch:18},{wch:18},{wch:18},{wch:16}];XLSX.utils.book_append_sheet(wb,ws,name)});
 XLSX.writeFile(wb,"NOIR-relatorio-financeiro.xlsx");
}
document.getElementById("commandInput").addEventListener("keydown",e=>{if(e.key==="Enter"){let v=e.target.value.trim();if(v){pageNav("ai");setTimeout(()=>{let i=document.getElementById("aiInput");i.value=v;document.getElementById("aiSend").click()},30);e.target.value=""}}});
render("overview");
