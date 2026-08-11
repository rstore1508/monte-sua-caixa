const ASSET_BASE=window.TUGUINHO_ASSET_BASE||"public/relogios";
const SKUS=["TG30615","TG30616","TG30617","TG30618","TG30619","TG30620","TG30622","TG30623","TG30624","TG30625","TG30626","TG30627","TG30628","TG30629","TG30630","TG30631","TG30632","TG30633","TG30634","TG30635","TG30636","TG30637","TG30638","TG30639","TG30640","TG30641","TG30642","TG30643","TG30644","TG30645","TG30646","TG30647","TG30648","TG30649","TG30650","TG30651","TG30652","TG30653","TG30654"];
const PRICE=39.99,BOX_SIZE=12,STORAGE_KEY="tuguinho-monte-sua-caixa-v3";
let state={current:[],boxes:[]};
let inventory=new Map();
let inventoryLoaded=false;
let zoomLevel=1;
let toastTimer;
let imageBusy=false,orderImageBlob=null,orderImageUrl="";
const $=id=>document.getElementById(id);
const money=value=>Number(value||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const asset=sku=>`${ASSET_BASE}/${encodeURIComponent(sku)}.svg`;

function load(){
  try{
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(saved&&Array.isArray(saved.current)&&Array.isArray(saved.boxes))state={current:saved.current,boxes:saved.boxes};
  }catch(error){console.warn("Não foi possível recuperar a seleção anterior.",error)}
}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function productCount(sku){return state.current.filter(item=>item===sku).length}
function selectionCount(sku){return state.current.filter(item=>item===sku).length+state.boxes.flat().filter(item=>item===sku).length}
function stockInfo(sku){return inventory.get(sku)||null}
function localAvailable(sku){const stock=stockInfo(sku);return stock?Math.max(0,stock.available-selectionCount(sku)):null}
function stockLabel(sku){
  const available=localAvailable(sku);
  if(available===null)return "Consultando disponibilidade";
  if(available===0)return "Esgotado no pré-lançamento";
  if(available<=30)return `Últimas ${available} unidades`;
  return `${available} disponíveis`;
}
async function loadAvailability(renderAfter=true){
  if(!window.tuguinhoDb)return;
  const {data,error}=await window.tuguinhoDb.from("sku_inventory").select("sku,capacity,reserved,available").order("sku");
  if(error){console.error("Falha ao consultar disponibilidade",error);return}
  inventory=new Map((data||[]).map(item=>[item.sku,{capacity:Number(item.capacity),reserved:Number(item.reserved),available:Number(item.available)}]));
  inventoryLoaded=true;
  if(renderAfter)render();
}
function toast(text){clearTimeout(toastTimer);$("toast").textContent=text;$("toast").classList.add("show");toastTimer=setTimeout(()=>$("toast").classList.remove("show"),2500)}

function renderProducts(filter=""){
  const list=SKUS.filter(sku=>sku.toLowerCase().includes(filter.toLowerCase()));
  $("visibleCount").textContent=list.length;
  $("productGrid").innerHTML=list.length?list.map(sku=>{
    const count=productCount(sku);
    const available=localAvailable(sku),soldOut=available===0;
    const stockClass=soldOut?"stock-out":available!==null&&available<=30?"stock-low":"";
    return `<article class="product ${count?"selected":""} ${soldOut?"sold-out":""}" data-sku="${sku}">
      ${count?`<span class="product-badge">${count} na caixa</span>`:""}
      <button class="product-photo zoom-trigger" type="button" aria-label="Ampliar relógio ${sku}"><img src="${asset(sku)}" alt="Relógio infantil ${sku}" loading="lazy"><span>⌕ VER DETALHES</span></button>
      <h3>${sku}</h3><b class="product-price">R$ 39,99</b>
      <small class="stock-label ${stockClass}">${stockLabel(sku)}</small>
      <div class="quantity"><button class="remove" ${count?"":"disabled"} aria-label="Remover ${sku}">−</button><b>${count}</b><button class="add" ${state.current.length>=BOX_SIZE||soldOut?"disabled":""} aria-label="Adicionar ${sku}"><span>${soldOut?"Esgotado":count?"Mais":"Adicionar"}</span><b>+</b></button></div>
    </article>`;
  }).join(""):`<div class="empty-result">Nenhum SKU encontrado.</div>`;
  document.querySelectorAll(".product").forEach(card=>{
    const sku=card.dataset.sku;
    card.querySelector(".zoom-trigger").onclick=()=>openProductZoom(sku);
    card.querySelector(".add").onclick=()=>addProduct(sku,card.querySelector("img"));
    card.querySelector(".remove").onclick=()=>removeProduct(sku);
  });
}

function flyToBox(image){
  if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const start=image.getBoundingClientRect();
  const target=(innerWidth<=820?$("mobileBoxDock"):$("boxPanel")).getBoundingClientRect();
  const clone=image.cloneNode();clone.className="fly";clone.style.left=(start.left+start.width/2-45)+"px";clone.style.top=(start.top+start.height/2-45)+"px";document.body.appendChild(clone);
  requestAnimationFrame(()=>{clone.style.transform=`translate(${target.left+target.width/2-(start.left+start.width/2)}px,${target.top+target.height/2-(start.top+start.height/2)}px) scale(.28) rotate(12deg)`;clone.style.opacity=".15"});
  setTimeout(()=>clone.remove(),340);
}
function addProduct(sku,image){
  if(state.current.length>=BOX_SIZE)return toast("A caixinha já está completa.");
  if(localAvailable(sku)===0)return toast(`${sku} esgotou no pré-lançamento.`);
  flyToBox(image);state.current.push(sku);save();render();
  if(state.current.length===BOX_SIZE)setTimeout(openCompleteModal,380);
  else if(productCount(sku)>1)toast("Pode repetir: esse modelo entrou novamente ✓");
}
function removeProduct(sku){const index=state.current.lastIndexOf(sku);if(index<0)return;state.current.splice(index,1);save();render();toast(`${sku} saiu da caixinha`)}
function progressMessage(){const n=state.current.length;if(n===0)return"Toque no + para colocar o primeiro relógio.";if(n===12)return"✓ Caixinha completa. Agora veja seu pedido!";if(n===6)return"Metade pronta. Continue escolhendo!";if(n===11)return"Só falta 1 relógio.";return`Escolha mais ${12-n} relógio${12-n===1?"":"s"}.`}

function renderBox(){
  const n=state.current.length,remaining=BOX_SIZE-n;
  document.body.classList.toggle("first-choice",n===0);
  $("catalogProgressText").textContent=`${n} de 12 escolhidos`;
  $("catalogProgressHint").textContent=n===12?"Caixa completa!":`Faltam ${remaining} relógio${remaining===1?"":"s"}`;
  $("catalogProgressBar").setAttribute("aria-valuenow",n);
  $("catalogProgressBar").querySelector("i").style.width=`${(n/BOX_SIZE)*100}%`;
  $("boxNumber").textContent=state.boxes.length+1;
  $("boxCount").innerHTML=`${n}<small>/12</small>`;
  $("progressMessage").textContent=progressMessage();$("progressMessage").classList.toggle("complete",n===12);
  $("subtotal").textContent=money(n*PRICE);
  $("segments").innerHTML=Array.from({length:12},(_,i)=>`<i class="${i<n?"on":""}"></i>`).join("");
  $("slots").innerHTML=Array.from({length:12},(_,i)=>state.current[i]?`<div class="slot full" data-index="${i}"><img src="${asset(state.current[i])}" alt="${state.current[i]}"><button aria-label="Remover ${state.current[i]}">×</button><small>${state.current[i]}</small></div>`:`<div class="slot"><i>${i+1}</i><small>livre</small></div>`).join("");
  document.querySelectorAll(".slot.full").forEach(slot=>slot.querySelector("button").onclick=()=>{state.current.splice(Number(slot.dataset.index),1);save();render()});
  const confirm=$("confirmBox");confirm.disabled=n!==12;confirm.textContent=n===12?`Concluir caixinha ${state.boxes.length+1} →`:`Escolha mais ${12-n}`;
  $("clearBox").hidden=n===0;
  $("mobileBoxCount").textContent=`${n}/12`;$("mobileBoxDock").querySelector(":scope > span:last-child").textContent=n===12?"Finalizar":"Minha caixa";$("mobileBoxDock").setAttribute("aria-label",n===12?"Caixa completa. Finalizar pedido":`Abrir minha caixa, ${n} de 12 relógios`);$("mobileBoxDock").classList.toggle("ready",n===12);
}
function renderSaved(){
  const count=state.boxes.length;
  $("headerBoxes").textContent=count?`${count} caixinha${count===1?"":"s"} pronta${count===1?"":"s"}`:"Sua seleção";
  $("headerUnits").textContent=`${state.current.length}/12`;
  $("savedBoxes").hidden=count===0;
  $("savedBoxesList").innerHTML=state.boxes.map((box,i)=>`<div class="saved-row"><div class="saved-thumbs">${box.slice(0,4).map(sku=>`<img src="${asset(sku)}" alt="">`).join("")}<i>+8</i></div><span>✓ Caixinha ${i+1}</span><b>12 peças</b><button class="delete-saved-box" type="button" data-box-index="${i}" aria-label="Excluir caixinha ${i+1}">Excluir</button></div>`).join("");
  document.querySelectorAll(".delete-saved-box").forEach(button=>button.onclick=()=>deleteSavedBox(Number(button.dataset.boxIndex)));
}
function emptyCurrentBox(){
  if(!state.current.length)return;
  if(!confirm("Esvaziar esta caixinha? Todos os relógios escolhidos nela serão removidos."))return;
  state.current=[];save();closeModal();render();toast("Caixinha esvaziada. Você pode começar novamente.");
}
function deleteSavedBox(index){
  if(!state.boxes[index])return;
  if(!confirm(`Excluir a caixinha ${index+1}? Essa ação removerá os 12 relógios dela.`))return;
  state.boxes.splice(index,1);save();render();toast("Caixinha excluída.");
}

function render(){renderProducts($("search").value);renderBox();renderSaved()}

function openCompleteModal(){$("completeModal").hidden=false;document.body.style.overflow="hidden";$("modalTitle").textContent=`Caixinha ${state.boxes.length+1} pronta!`}
function closeModal(){$("completeModal").hidden=true;document.body.style.overflow=""}
function confirmCurrent(startAnother){
  if(state.current.length!==12)return;
  closeMobileDrawer();state.boxes.push([...state.current]);state.current=[];save();closeModal();render();
  if(startAnother){$("montador").scrollIntoView({behavior:"smooth"});toast(`Caixinha ${state.boxes.length} guardada. Monte a próxima!`)}
  else finalizeSelection();
}

function countBox(box){return box.reduce((map,sku)=>(map[sku]=(map[sku]||0)+1,map),{})}
function selectionShortages(){
  const counts=state.boxes.flat().reduce((map,sku)=>(map[sku]=(map[sku]||0)+1,map),{});
  return Object.entries(counts).flatMap(([sku,quantity])=>{
    const stock=stockInfo(sku);
    return stock&&quantity>stock.available?[{sku,quantity,available:stock.available}]:[];
  });
}
function stockErrorDetails(error){
  if(error?.shortages?.length)return error.shortages[0];
  const match=String(error?.message||"").match(/ESTOQUE_INSUFICIENTE\|([^|]+)\|(\d+)/);
  return match?{sku:match[1],available:Number(match[2])}:null;
}
function orderText(){return ["TUGUINHO — SELEÇÃO DO PRÉ-SAVE","",...state.boxes.flatMap((box,index)=>[`CAIXINHA ${index+1}`, ...Object.entries(countBox(box)).map(([sku,count])=>`${sku} — ${count} un.`),""]),`TOTAL: ${state.boxes.length} caixinha(s) — ${state.boxes.length*12} relógios — ${money(state.boxes.length*12*PRICE)}`].join("\n")}
function renderPrintCard(){
  $("printDate").textContent=new Date().toLocaleDateString("pt-BR");
  $("printBoxes").innerHTML=state.boxes.map((box,index)=>{
    const counts=countBox(box);
    return `<section class="print-box"><header><b>CAIXINHA ${index+1}</b><span>12 RELÓGIOS</span></header><div class="print-items">${Object.entries(counts).map(([sku,count])=>`<article><img crossorigin="anonymous" src="${asset(sku)}" alt="${sku}"><div><b>${sku}</b><span>${count} unidade${count===1?"":"s"}</span></div></article>`).join("")}</div></section>`;
  }).join("");
  $("printTotal").textContent=`${state.boxes.length} caixinha${state.boxes.length===1?"":"s"} · ${state.boxes.length*12} relógios · ${money(state.boxes.length*12*PRICE)}`;
}
async function saveAnonymousSelection(){
  if(!window.tuguinhoDb)throw new Error("Banco indisponível");
  await loadAvailability(false);
  const shortages=selectionShortages();
  if(shortages.length){const error=new Error("Disponibilidade alterada");error.shortages=shortages;throw error}
  const {error}=await window.tuguinhoDb.from("orders").insert({store_name:null,buyer_name:null,representative:null,phone:null,boxes:state.boxes,unit_price:PRICE,consent_at:null});
  if(error)throw error;
}
async function finalizeSelection(){
  toast("Abrindo o pedido…");
  try{
    await saveAnonymousSelection();
    location.href="pedido.html";
  }catch(error){
    console.error("Falha ao salvar seleção",error);
    await loadAvailability();
    const shortage=stockErrorDetails(error);
    if(shortage){
      alert(`${shortage.sku} possui apenas ${shortage.available} unidade${shortage.available===1?"":"s"} ${shortage.available===1?"disponível":"disponíveis"}. Exclua a caixinha que contém esse modelo e monte novamente com outro relógio.`);
      toast("Um modelo atingiu o limite de 200 unidades.");
      $("boxPanel").scrollIntoView({behavior:"smooth",block:"center"});
      return;
    }
    alert("Não foi possível registrar sua seleção agora. Confira sua internet e tente finalizar novamente.");
    toast("Pedido não registrado. Tente novamente.");
  }
}

function openProductZoom(sku){zoomLevel=1;$("zoomTitle").textContent=sku;$("zoomImage").src=asset(sku);$("zoomImage").alt=`Relógio infantil ${sku}`;applyZoom();$("productZoom").hidden=false;document.body.style.overflow="hidden"}
function closeProductZoom(){$("productZoom").hidden=true;document.body.style.overflow=""}
function applyZoom(){$("zoomImage").style.transform=`scale(${zoomLevel})`;$("zoomValue").textContent=`${Math.round(zoomLevel*100)}%`;$("zoomOut").disabled=zoomLevel<=1;$("zoomIn").disabled=zoomLevel>=2.5}
function changeZoom(delta){zoomLevel=Math.min(2.5,Math.max(1,zoomLevel+delta));applyZoom()}
function setMobileNavActive(active){document.querySelectorAll(".mobile-nav-item").forEach(item=>{const on=item===active;item.classList.toggle("active",on);if(on)item.setAttribute("aria-current","page");else item.removeAttribute("aria-current")})}

function openMobileDrawer(){setMobileNavActive($("mobileBoxDock"));$("boxPanel").classList.add("mobile-open");$("mobileBoxBackdrop").classList.add("open");document.body.classList.add("drawer-open")}
function closeMobileDrawer(){$("boxPanel").classList.remove("mobile-open");$("mobileBoxBackdrop").classList.remove("open");document.body.classList.remove("drawer-open");setMobileNavActive(document.querySelector('.mobile-nav-item[href="#montador"]'))}

async function inlineImage(src,square=false){
  const response=await fetch(src,{mode:"cors",cache:"force-cache"});if(!response.ok)throw new Error(`Falha ao carregar imagem: ${src}`);
  const objectUrl=URL.createObjectURL(await response.blob());
  try{
    const image=await new Promise((resolve,reject)=>{const item=new Image();item.onload=()=>resolve(item);item.onerror=()=>reject(new Error(`Imagem inválida: ${src}`));item.src=objectUrl});
    const naturalWidth=image.naturalWidth||900,naturalHeight=image.naturalHeight||900;
    if(square){
      const size=900,padding=70,scale=Math.min((size-padding*2)/naturalWidth,(size-padding*2)/naturalHeight);
      const drawWidth=naturalWidth*scale,drawHeight=naturalHeight*scale,canvas=document.createElement("canvas");canvas.width=size;canvas.height=size;
      canvas.getContext("2d").drawImage(image,(size-drawWidth)/2,(size-drawHeight)/2,drawWidth,drawHeight);return canvas.toDataURL("image/png",.96);
    }
    const scale=Math.min(1,900/naturalWidth,900/naturalHeight),canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(naturalWidth*scale));canvas.height=Math.max(1,Math.round(naturalHeight*scale));
    canvas.getContext("2d").drawImage(image,0,0,canvas.width,canvas.height);return canvas.toDataURL("image/png",.96);
  }finally{URL.revokeObjectURL(objectUrl)}

}async function makeOrderImage(){
  if(!window.html2canvas)throw new Error("Gerador de imagem indisponível");
  await document.fonts?.ready;
  const card=$("printCard");
  const clone=card.cloneNode(true);clone.removeAttribute("id");clone.classList.add("capture-mode");clone.style.cssText=`position:fixed;left:-10000px;top:0;width:${Math.max(720,card.getBoundingClientRect().width)}px;z-index:99999;background:#fff`;
  document.body.appendChild(clone);
  try{
    const images=[...clone.querySelectorAll("img")];
    await Promise.all(images.map(async img=>{img.src=await inlineImage(img.src,Boolean(img.closest(".print-items")));if(img.decode)await img.decode().catch(()=>{});}));
    const canvas=await window.html2canvas(clone,{scale:Math.min(2,window.devicePixelRatio||2),backgroundColor:"#ffffff",useCORS:false,logging:false});
    return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("Não foi possível criar a imagem")),"image/png",.96));
  }finally{clone.remove()}
}
async function saveOrderImage(){
  if(imageBusy)return;imageBusy=true;
  const button=$("downloadImage"),original=button.innerHTML;button.disabled=true;button.textContent="Montando a foto…";
  try{
    orderImageBlob=await makeOrderImage();if(orderImageUrl)URL.revokeObjectURL(orderImageUrl);orderImageUrl=URL.createObjectURL(orderImageBlob);$("orderImagePreview").src=orderImageUrl;
    $("deviceSaveHint").textContent="Tire um print desta tela e envie ao seu representante.";
    $("orderImageModal").hidden=false;document.body.style.overflow="hidden";toast("Foto pronta com todos os relógios ✓");
  }catch(error){console.error("Falha ao criar a imagem",error);toast("Não foi possível carregar as fotos. Tente novamente.")}
  finally{imageBusy=false;button.disabled=false;button.innerHTML=original}
}
function closeOrderImage(){$("orderImageModal").hidden=true;document.body.style.overflow=""}
function copySummary(){
  const text=orderText();
  if(navigator.clipboard?.writeText){navigator.clipboard.writeText(text).then(()=>toast("Resumo copiado ✓")).catch(()=>fallbackCopy(text))}else fallbackCopy(text);
}
function fallbackCopy(text){const area=document.createElement("textarea");area.value=text;area.style.position="fixed";area.style.opacity="0";document.body.appendChild(area);area.select();document.execCommand("copy");area.remove();toast("Resumo copiado ✓")}

function setupStory(){
  const cards=[...document.querySelectorAll(".story-card")];
  if(!cards.length)return;
  if(matchMedia("(prefers-reduced-motion: reduce)").matches){cards.forEach(card=>card.classList.add("is-active"));return}
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle("is-active",entry.isIntersecting)),{threshold:.55});
  cards.forEach(card=>observer.observe(card));
}

function setupRevealAnimations(){
  const targets=document.querySelectorAll(".benefits article,.story-intro,.how h2,.how article,.print-heading");
  targets.forEach(el=>el.setAttribute("data-reveal",""));
  if(matchMedia("(prefers-reduced-motion: reduce)").matches||!("IntersectionObserver" in window)){targets.forEach(el=>el.classList.add("visible"));return}
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("visible");observer.unobserve(entry.target)}}),{threshold:.08,rootMargin:"0px 0px -6%"});
  targets.forEach(el=>observer.observe(el));
}

// Eventos principais
document.querySelectorAll(".mobile-nav-item[href]").forEach(link=>link.addEventListener("click",()=>{closeMobileDrawer();setMobileNavActive(link)}));
document.querySelectorAll("[data-scroll]").forEach(button=>button.onclick=()=>$(button.dataset.scroll).scrollIntoView({behavior:"smooth"}));
$("search").oninput=event=>renderProducts(event.target.value);
$("clearBox").onclick=emptyCurrentBox;
$("confirmBox").onclick=openCompleteModal;$("modalClose").onclick=closeModal;$("adjustBox").onclick=closeModal;$("discardCompleteBox").onclick=emptyCurrentBox;
$("nextBox").onclick=()=>confirmCurrent(true);$("finishOrder").onclick=()=>confirmCurrent(false);
$("completeModal").onclick=event=>{if(event.target===$("completeModal"))closeModal()};
$("mobileBoxDock").onclick=()=>state.current.length===BOX_SIZE?openCompleteModal():openMobileDrawer();$("closeMobileBox").onclick=closeMobileDrawer;$("mobileBoxBackdrop").onclick=closeMobileDrawer;
$("zoomClose").onclick=closeProductZoom;$("zoomOut").onclick=()=>changeZoom(-.25);$("zoomIn").onclick=()=>changeZoom(.25);$("productZoom").onclick=event=>{if(event.target===$("productZoom"))closeProductZoom()};
$("downloadImage").onclick=saveOrderImage;$("orderImageClose").onclick=closeOrderImage;$("orderImageModal").onclick=event=>{if(event.target===$("orderImageModal"))closeOrderImage()};
$("newOrder").onclick=()=>{if(confirm("Começar uma nova seleção?")){state={current:[],boxes:[]};save();$("printOrder").hidden=true;render();$("montador").scrollIntoView({behavior:"smooth"})}};
window.addEventListener("scroll",()=>document.querySelector(".topbar")?.classList.toggle("scrolled",scrollY>24),{passive:true});
document.addEventListener("keydown",event=>{if(event.key==="Escape"){if(!$("completeModal").hidden)closeModal();if(!$("productZoom").hidden)closeProductZoom();if(!$("orderImageModal").hidden)closeOrderImage();closeMobileDrawer()}});

load();render();loadAvailability();setupStory();setupRevealAnimations();
(function(){const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;const intro=$("brandIntro");const seen=sessionStorage.getItem("tuguinho-intro-seen");if(intro&&!reduced&&!seen){document.body.classList.add("intro-lock");sessionStorage.setItem("tuguinho-intro-seen","1");setTimeout(()=>{intro.classList.add("done");document.body.classList.remove("intro-lock")},1450)}else intro?.classList.add("done")})();
