const ASSET_BASE=window.TUGUINHO_ASSET_BASE||"../public/relogios";
const db=window.tuguinhoDb;
const $=id=>document.getElementById(id);
const money=value=>Number(value||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const dateTime=value=>new Date(value).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"});
const statusLabels={novo:"Novo",em_contato:"Em contato",confirmado:"Confirmado",cancelado:"Cancelado"};
const SKUS=["TG30615","TG30616","TG30617","TG30618","TG30619","TG30620","TG30622","TG30623","TG30624","TG30625","TG30626","TG30627","TG30628","TG30629","TG30630","TG30631","TG30632","TG30633","TG30634","TG30635","TG30636","TG30637","TG30638","TG30639","TG30640","TG30641","TG30642","TG30643","TG30644","TG30645","TG30646","TG30647","TG30648","TG30649","TG30650","TG30651","TG30652","TG30653","TG30654"];
let orders=[];
let inventoryRows=[];
let currentAdmin=null;
let toastTimer;

function escapeHtml(value=""){return String(value).replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char])}
function toast(message){clearTimeout(toastTimer);$("adminToast").textContent=message;$("adminToast").classList.add("show");toastTimer=setTimeout(()=>$("adminToast").classList.remove("show"),2600)}
function showLogin(message=""){$("adminView").hidden=true;$("loginView").hidden=false;$("loginError").textContent=message}
function showDashboard(){$("loginView").hidden=true;$("adminView").hidden=false}

async function verifyAdmin(user){
  const {data,error}=await db.from("admin_users").select("display_name").eq("user_id",user.id).maybeSingle();
  if(error)throw error;
  return data;
}

async function enterAdmin(session){
  if(!session?.user)return showLogin();
  try{
    const admin=await verifyAdmin(session.user);
    if(!admin){await db.auth.signOut();return showLogin("Esta conta não possui acesso administrativo.")}
    currentAdmin=admin;
    $("profileName").textContent=admin.display_name;
    $("profileInitial").textContent=admin.display_name.trim().charAt(0).toUpperCase();
    showDashboard();
    await loadOrders();
  }catch(error){console.error(error);showLogin("Não foi possível validar seu acesso agora.")}
}

$("loginForm").onsubmit=async event=>{
  event.preventDefault();
  const button=$("loginButton");
  $("loginError").textContent="";
  button.disabled=true;
  button.innerHTML="Validando acesso…";
  const {data,error}=await db.auth.signInWithPassword({email:$("loginEmail").value.trim(),password:$("loginPassword").value});
  button.disabled=false;
  button.innerHTML='Entrar com segurança <span>→</span>';
  if(error)return $("loginError").textContent="E-mail ou senha inválidos.";
  await enterAdmin(data.session);
};

$("logoutButton").onclick=async()=>{await db.auth.signOut();orders=[];showLogin();toast("Sessão encerrada com segurança.")};
$("refreshButton").onclick=()=>loadOrders(true);
$("orderSearch").oninput=renderOrders;
$("statusFilter").onchange=renderOrders;
$("launchSize").onchange=renderDemand;
$("dailyRange").onchange=renderDailyBoxes;
$("dialogClose").onclick=()=>$("orderDialog").close();
$("orderDialog").onclick=event=>{if(event.target===$("orderDialog"))$("orderDialog").close()};

async function loadOrders(manual=false){
  $("loadingState").hidden=false;
  $("emptyState").hidden=true;
  $("ordersList").innerHTML="";
  const pageSize=1000;
  let loaded=[];
  let from=0;
  let loadError=null;
  while(true){
    const {data,error}=await db.from("orders").select("*").order("created_at",{ascending:false}).range(from,from+pageSize-1);
    if(error){loadError=error;break}
    loaded.push(...(data||[]));
    if(!data||data.length<pageSize)break;
    from+=pageSize;
  }
  $("loadingState").hidden=true;
  if(loadError){console.error(loadError);toast("Não foi possível carregar os pedidos.");return}
  const {data:stockData,error:stockError}=await db.from("sku_inventory").select("sku,capacity,reserved,available").order("sku");
  if(stockError){console.error(stockError);toast("Pedidos carregados, mas o saldo não pôde ser consultado.")}
  inventoryRows=stockData||[];
  orders=loaded;
  updateMetrics();
  renderDailyBoxes();
  renderDemand();
  renderOrders();
  if(manual)toast("Pedidos atualizados.");
}

function localDayKey(value){
  const date=value instanceof Date?value:new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}
function dailyBoxRows(days){
  const totals=new Map();
  orders.filter(order=>order.status!=="cancelado").forEach(order=>{
    const key=localDayKey(order.created_at);
    const boxes=Number(order.box_count||((Array.isArray(order.boxes)&&order.boxes.length)||0));
    totals.set(key,(totals.get(key)||0)+boxes);
  });
  const today=new Date();
  return Array.from({length:days},(_,index)=>{
    const date=new Date(today.getFullYear(),today.getMonth(),today.getDate()-(days-index-1));
    return {date,key:localDayKey(date),boxes:totals.get(localDayKey(date))||0};
  });
}
function renderDailyBoxes(){
  const days=Number($("dailyRange").value||7);
  const rows=dailyBoxRows(days);
  const total=rows.reduce((sum,item)=>sum+item.boxes,0);
  const peak=rows.reduce((best,item)=>item.boxes>best.boxes?item:best,rows[0]);
  const max=Math.max(1,...rows.map(item=>item.boxes));
  $("dailyToday").textContent=rows.at(-1)?.boxes||0;
  $("dailyTotal").textContent=total;
  $("dailyAverage").textContent=(total/days).toLocaleString("pt-BR",{maximumFractionDigits:1});
  $("dailyPeak").textContent=peak?.boxes?peak.date.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"}):"—";
  $("dailyPeakValue").textContent=`${peak?.boxes||0} caixa${peak?.boxes===1?"":"s"}`;
  $("dailyChart").style.setProperty("--days",days);
  $("dailyChart").setAttribute("aria-label",`${total} caixas nos últimos ${days} dias. Melhor dia: ${peak?.boxes||0} caixas.`);
  $("dailyChart").innerHTML=rows.map((item,index)=>{
    const height=item.boxes?Math.max(8,item.boxes/max*100):2;
    const label=days<=14?item.date.toLocaleDateString("pt-BR",{weekday:"short"}).replace(".",""):String(item.date.getDate()).padStart(2,"0");
    const fullDate=item.date.toLocaleDateString("pt-BR");
    return `<div class="daily-column ${index===rows.length-1?"is-today":""}" title="${fullDate}: ${item.boxes} caixa${item.boxes===1?"":"s"}"><b>${item.boxes}</b><div class="daily-track"><i style="height:${height}%"></i></div><span>${label}</span><small>${String(item.date.getDate()).padStart(2,"0")}/${String(item.date.getMonth()+1).padStart(2,"0")}</small></div>`;
  }).join("");
}

function updateMetrics(){
  const totalBoxes=orders.reduce((sum,order)=>sum+Number(order.box_count||0),0);
  const totalItems=orders.reduce((sum,order)=>sum+Number(order.item_count||0),0);
  const totalValue=orders.reduce((sum,order)=>sum+Number(order.total_amount||0),0);
  $("metricOrders").textContent=orders.length;
  $("metricBoxes").textContent=totalBoxes;
  $("metricItems").textContent=totalItems;
  $("metricValue").textContent=money(totalValue);
}

function demandRows(){
  const inventoryMap=new Map(inventoryRows.map(item=>[item.sku,item]));
  const stats=new Map(SKUS.map(sku=>[sku,{sku,units:0,stores:new Set()}]));
  orders.filter(order=>order.status!=="cancelado").forEach(order=>{
    const seen=new Set();
    const boxes=Array.isArray(order.boxes)?order.boxes:[];
    boxes.flat().forEach(rawSku=>{
      const sku=String(rawSku||"").toUpperCase();
      if(!stats.has(sku))stats.set(sku,{sku,units:0,stores:new Set()});
      stats.get(sku).units+=1;
      if(!seen.has(sku)){stats.get(sku).stores.add(String(order.id));seen.add(sku)}
    });
  });
  return [...stats.values()].map(item=>{
    const stock=inventoryMap.get(item.sku);
    return {...item,units:stock?Number(stock.reserved):item.units,stores:item.stores.size,capacity:stock?Number(stock.capacity):200,available:stock?Number(stock.available):Math.max(0,200-item.units)};
  }).sort((a,b)=>b.units-a.units||b.stores-a.stores||a.sku.localeCompare(b.sku));
}

function renderDemand(){
  const rows=demandRows();
  const total=rows.reduce((sum,item)=>sum+item.units,0);
  const launchSize=Number($("launchSize").value||9);
  const active=rows.filter(item=>item.units>0).length;
  const leader=rows[0];
  const launchUnits=rows.slice(0,launchSize).reduce((sum,item)=>sum+item.units,0);
  const share=total?Math.round(launchUnits/total*100):0;
  const urgent=rows.filter(item=>item.available<=30);
  $("topSku").textContent=leader?.units?leader.sku:"—";
  $("topSkuUnits").textContent=leader?.units?`${leader.units} unidade${leader.units===1?"":"s"} em ${leader.stores} seleção${leader.stores===1?"":"ões"}`:"Sem escolhas ainda";
  $("activeSkus").textContent=active;
  $("launchUnits").textContent=`${launchUnits} un.`;
  $("launchShare").textContent=`${share}% da procura`;
  $("launchCallout").innerHTML=urgent.length
    ?`<span class="callout-icon">!</span><div><b>${urgent.length} modelo${urgent.length===1?" atingiu":"s atingiram"} o alerta de últimas 30 unidades.</b><p>${urgent.map(item=>`${item.sku}: ${item.available} restantes`).join(" · ")}. O banco bloqueia automaticamente cada SKU ao chegar em 200.</p></div>`
    :total
    ?`<span class="callout-icon">★</span><div><b>Comece pelos ${launchSize} primeiros modelos: eles concentram ${share}% da demanda.</b><p>Cada SKU está protegido pelo limite de 200 unidades.</p></div>`
    :`<span class="callout-icon">★</span><div><b>A recomendação aparecerá com os primeiros pré-pedidos.</b><p>Quanto mais seleções forem finalizadas, mais segura fica a ordem de fabricação.</p></div>`;
  const maxUnits=Math.max(1,...rows.map(item=>item.units));
  $("modelRanking").innerHTML=rows.map((item,index)=>{
    const first=item.units>0&&index<launchSize;
    const second=item.units>0&&index>=launchSize&&index<launchSize*2;
    const wave=item.available===0?["wave-stock-out","Esgotado"]:item.available<=30?["wave-stock-low",`Restam ${item.available}`]:first?["wave-first","Produzir primeiro"]:second?["wave-second","Segunda onda"]:["wave-wait",item.units?"Aguardar":"Sem demanda"];
    const percent=total?Math.round(item.units/total*100):0;
    return `<article class="model-row ${first?"is-launch":""}">
      <span class="model-rank">${index+1}º</span>
      <img class="model-thumb" src="${ASSET_BASE}/${item.sku}.svg" alt="Relógio ${item.sku}" loading="lazy">
      <div class="model-id"><b>${escapeHtml(item.sku)}</b><small>${percent}% da procura total</small></div>
      <div class="demand-visual"><div class="demand-bar"><i style="width:${item.units/maxUnits*100}%"></i></div></div>
      <div class="model-stat"><b>${item.units} un.</b><small>pré-selecionadas</small></div>
      <div class="model-stat stores-stat"><b>${item.available} restantes</b><small>limite ${item.capacity}</small></div>
      <span class="wave-badge ${wave[0]}">${wave[1]}</span>
    </article>`;
  }).join("");
}
function filteredOrders(){
  const term=$("orderSearch").value.trim().toLocaleLowerCase("pt-BR");
  const status=$("statusFilter").value;
  return orders.filter(order=>{
    const matchesStatus=status==="todos"||order.status===status;
    const haystack=[order.id,order.store_name,order.buyer_name,order.phone,order.representative,...(Array.isArray(order.boxes)?order.boxes.flat():[])].join(" ").toLocaleLowerCase("pt-BR");
    return matchesStatus&&(!term||haystack.includes(term));
  });
}

function renderOrders(){
  const list=filteredOrders();
  $("resultsCount").textContent=`${list.length} resultado${list.length===1?"":"s"}`;
  $("emptyState").hidden=list.length!==0;
  $("ordersList").innerHTML=list.map(order=>`
    <article class="order-row">
      <div class="order-main"><b>${order.store_name?escapeHtml(order.store_name):`Seleção #${String(order.id).padStart(5,"0")}`}</b><span>${order.buyer_name?`${escapeHtml(order.buyer_name)} · ${escapeHtml(order.phone||"")}`:"Sem dados pessoais"}</span></div>
      <div class="cell"><b>${order.representative?escapeHtml(order.representative):"Anônima"}</b><span>${order.representative?"Representante":"Origem"}</span></div>
      <div class="cell"><b>${order.box_count}</b><span>caixa${order.box_count===1?"":"s"}</span></div>
      <div class="cell hide-medium"><b>${money(order.total_amount)}</b><span>valor potencial</span></div>
      <div><span class="status status-${order.status}">${statusLabels[order.status]||escapeHtml(order.status)}</span></div>
      <button class="detail-button" data-order-id="${order.id}">Ver pedido</button>
    </article>`).join("");
  document.querySelectorAll(".detail-button").forEach(button=>button.onclick=()=>openOrder(Number(button.dataset.orderId)));
}

function boxMarkup(box,index){
  const counts=box.reduce((map,sku)=>(map[sku]=(map[sku]||0)+1,map),{});
  return `<section class="box-detail"><header><span>Caixa ${index+1}</span><b>12 relógios · R$ 479,88</b></header><div class="sku-chips">${Object.entries(counts).map(([sku,count])=>`<span>${escapeHtml(sku)} · ${count} un.</span>`).join("")}</div></section>`;
}

function openOrder(id){
  const order=orders.find(item=>Number(item.id)===id);
  if(!order)return;
  $("dialogContent").innerHTML=`<div class="dialog-body">
    <span class="eyebrow">PEDIDO #${String(order.id).padStart(5,"0")}</span>
    <h2>${order.store_name?escapeHtml(order.store_name):`Seleção anônima #${String(order.id).padStart(5,"0")}`}</h2>
    <div class="dialog-meta">
      <div><span>Comprador</span><b>${order.buyer_name?escapeHtml(order.buyer_name):"Não solicitado"}</b></div>
      <div><span>Telefone / WhatsApp</span><b>${order.phone?escapeHtml(order.phone):"Não solicitado"}</b></div>
      <div><span>Representante</span><b>${order.representative?escapeHtml(order.representative):"Não solicitado"}</b></div>
      <div><span>Recebido em</span><b>${dateTime(order.created_at)}</b></div>
      <div><span>Quantidade</span><b>${order.box_count} caixa${order.box_count===1?"":"s"} · ${order.item_count} relógios</b></div>
      <div><span>Valor potencial</span><b>${money(order.total_amount)}</b></div>
    </div>
    <div>${(order.boxes||[]).map(boxMarkup).join("")}</div>
    <div class="admin-fields">
      <label>Status<select id="dialogStatus">${Object.entries(statusLabels).map(([value,label])=>`<option value="${value}" ${order.status===value?"selected":""}>${label}</option>`).join("")}</select></label>
      <label>Observações<textarea id="dialogNotes" placeholder="Anotações internas sobre o atendimento">${escapeHtml(order.admin_notes||"")}</textarea></label>
      <button class="save-status" id="saveOrderStatus">Salvar acompanhamento</button>
    </div>
  </div>`;
  $("saveOrderStatus").onclick=()=>saveOrderStatus(order.id);
  $("orderDialog").showModal();
}

async function saveOrderStatus(id){
  const button=$("saveOrderStatus");
  button.disabled=true;
  button.textContent="Salvando…";
  const status=$("dialogStatus").value;
  const admin_notes=$("dialogNotes").value.trim()||null;
  const updated_at=new Date().toISOString();
  const {error}=await db.from("orders").update({status,admin_notes,updated_at}).eq("id",id);
  button.disabled=false;
  button.textContent="Salvar acompanhamento";
  if(error){console.error(error);return toast("Não foi possível atualizar o pedido.")}
  const order=orders.find(item=>Number(item.id)===Number(id));
  if(order)Object.assign(order,{status,admin_notes,updated_at});
  $("orderDialog").close();
  renderOrders();
  updateMetrics();
  renderDemand();
  toast("Pedido atualizado.");
}

(async()=>{const {data:{session}}=await db.auth.getSession();await enterAdmin(session)})();






