const ASSET_BASE=window.TUGUINHO_ASSET_BASE||"public/relogios";
const SKUS=["TG30615","TG30616","TG30617","TG30618","TG30619","TG30620","TG30622","TG30623","TG30624","TG30625","TG30626","TG30627","TG30628","TG30629","TG30630","TG30631","TG30632","TG30633","TG30634","TG30635","TG30636","TG30637","TG30638","TG30639","TG30640","TG30641","TG30642","TG30643","TG30644","TG30645","TG30646","TG30647","TG30648","TG30649","TG30650","TG30651","TG30652","TG30653","TG30654"];
const PRICE=39.99,BOX_SIZE=12,STORAGE_KEY="tuguinho-monte-sua-caixa-v3";
let state={current:[],boxes:[]};
let zoomLevel=1;
let toastTimer;
let imageBusy=false;
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
function toast(text){clearTimeout(toastTimer);$("toast").textContent=text;$("toast").classList.add("show");toastTimer=setTimeout(()=>$("toast").classList.remove("show"),2500)}

function renderProducts(filter=""){
  const list=SKUS.filter(sku=>sku.toLowerCase().includes(filter.toLowerCase()));
  $("visibleCount").textContent=list.length;
  $("productGrid").innerHTML=list.length?list.map(sku=>{
    const count=productCount(sku);
    return `<article class="product ${count?"selected":""}" data-sku="${sku}">
      ${count?`<span class="product-badge">${count} na caixa</span>`:""}
      <button class="product-photo zoom-trigger" type="button" aria-label="Ampliar relógio ${sku}"><img src="${asset(sku)}" alt="Relógio infantil ${sku}" loading="lazy"><span>⌕ VER DETALHES</span></button>
      <h3>${sku}</h3><b class="product-price">R$ 39,99</b>
      <div class="quantity"><button class="remove" ${count?"":"disabled"} aria-label="Remover ${sku}">−</button><b>${count}</b><button class="add" ${state.current.length>=BOX_SIZE?"disabled":""} aria-label="Adicionar ${sku}">+</button></div>
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
  flyToBox(image);state.current.push(sku);save();render();
  if(state.current.length===BOX_SIZE)setTimeout(openCompleteModal,380);
  else if(productCount(sku)>1)toast("Pode repetir: esse modelo entrou novamente ✓");
}
function removeProduct(sku){const index=state.current.lastIndexOf(sku);if(index<0)return;state.current.splice(index,1);save();render();toast(`${sku} saiu da caixinha`)}
function progressMessage(){const n=state.current.length;if(n===0)return"Toque no + para colocar o primeiro relógio.";if(n===12)return"✓ Caixinha completa. Agora veja seu pedido!";if(n===6)return"Metade pronta. Continue escolhendo!";if(n===11)return"Só falta 1 relógio.";return`Escolha mais ${12-n} relógio${12-n===1?"":"s"}.`}

function renderBox(){
  const n=state.current.length;
  $("boxNumber").textContent=state.boxes.length+1;
  $("boxCount").innerHTML=`${n}<small>/12</small>`;
  $("progressMessage").textContent=progressMessage();$("progressMessage").classList.toggle("complete",n===12);
  $("subtotal").textContent=money(n*PRICE);
  $("segments").innerHTML=Array.from({length:12},(_,i)=>`<i class="${i<n?"on":""}"></i>`).join("");
  $("slots").innerHTML=Array.from({length:12},(_,i)=>state.current[i]?`<div class="slot full" data-index="${i}"><img src="${asset(state.current[i])}" alt="${state.current[i]}"><button aria-label="Remover ${state.current[i]}">×</button><small>${state.current[i]}</small></div>`:`<div class="slot"><i>${i+1}</i><small>livre</small></div>`).join("");
  document.querySelectorAll(".slot.full").forEach(slot=>slot.querySelector("button").onclick=()=>{state.current.splice(Number(slot.dataset.index),1);save();render()});
  const confirm=$("confirmBox");confirm.disabled=n!==12;confirm.textContent=n===12?`Concluir caixinha ${state.boxes.length+1} →`:`Escolha mais ${12-n}`;
  $("clearBox").hidden=n===0;
  $("mobileBoxCount").textContent=`${n}/12`;$("mobileBoxTotal").textContent=n?"VER CAIXINHA":"COMEÇAR";
}
function renderSaved(){
  const count=state.boxes.length;
  $("headerBoxes").textContent=count?`${count} caixinha${count===1?"":"s"} pronta${count===1?"":"s"}`:"Sua seleção";
  $("headerUnits").textContent=`${state.current.length}/12`;
  $("savedBoxes").hidden=count===0;
  $("savedBoxesList").innerHTML=state.boxes.map((box,i)=>`<div class="saved-row"><div class="saved-thumbs">${box.slice(0,4).map(sku=>`<img src="${asset(sku)}" alt="">`).join("")}<i>+8</i></div><span>✓ Caixinha ${i+1}</span><b>12 peças</b></div>`).join("");
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
  const {error}=await window.tuguinhoDb.from("orders").insert({store_name:null,buyer_name:null,representative:null,phone:null,boxes:state.boxes,unit_price:PRICE,consent_at:null});
  if(error)throw error;
}
async function finalizeSelection(){
  renderPrintCard();$("printOrder").hidden=false;$("saveStatus").textContent="Registrando os modelos mais escolhidos…";$("printOrder").scrollIntoView({behavior:"smooth"});
  try{await saveAnonymousSelection();$("saveStatus").textContent="✓ Seleção registrada. Agora envie a imagem ao seu representante.";toast("Imagem do pedido pronta ✓")}
  catch(error){console.error("Falha ao salvar seleção",error);$("saveStatus").textContent="A imagem está pronta. A contagem online não pôde ser atualizada.";toast("Imagem pronta. A contagem online falhou.")}
}

function openProductZoom(sku){zoomLevel=1;$("zoomTitle").textContent=sku;$("zoomImage").src=asset(sku);$("zoomImage").alt=`Relógio infantil ${sku}`;applyZoom();$("productZoom").hidden=false;document.body.style.overflow="hidden"}
function closeProductZoom(){$("productZoom").hidden=true;document.body.style.overflow=""}
function applyZoom(){$("zoomImage").style.transform=`scale(${zoomLevel})`;$("zoomValue").textContent=`${Math.round(zoomLevel*100)}%`;$("zoomOut").disabled=zoomLevel<=1;$("zoomIn").disabled=zoomLevel>=2.5}
function changeZoom(delta){zoomLevel=Math.min(2.5,Math.max(1,zoomLevel+delta));applyZoom()}
function openMobileDrawer(){$("boxPanel").classList.add("mobile-open");$("mobileBoxBackdrop").classList.add("open");document.body.classList.add("drawer-open")}
function closeMobileDrawer(){$("boxPanel").classList.remove("mobile-open");$("mobileBoxBackdrop").classList.remove("open");document.body.classList.remove("drawer-open")}

function blobToDataUrl(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob)})}
async function inlineImage(src){const response=await fetch(src,{mode:"cors",cache:"force-cache"});if(!response.ok)throw new Error(`Falha ao carregar imagem: ${src}`);return blobToDataUrl(await response.blob())}
async function makeOrderImage(){
  if(!window.html2canvas)throw new Error("Gerador de imagem indisponível");
  await document.fonts?.ready;
  const card=$("printCard");
  const clone=card.cloneNode(true);clone.removeAttribute("id");clone.style.cssText=`position:fixed;left:-10000px;top:0;width:${card.getBoundingClientRect().width}px;z-index:-1;background:#fff`;
  document.body.appendChild(clone);
  try{
    const images=[...clone.querySelectorAll("img")];
    await Promise.all(images.map(async img=>{img.src=await inlineImage(img.src);if(img.decode)await img.decode().catch(()=>{});}));
    const canvas=await window.html2canvas(clone,{scale:Math.min(2,window.devicePixelRatio||2),backgroundColor:"#ffffff",useCORS:false,logging:false});
    return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("Não foi possível criar a imagem")),"image/png",.96));
  }finally{clone.remove()}
}
function downloadOrderImage(blob){
  const link=document.createElement("a");link.href=URL.createObjectURL(blob);link.download=`pedido-tuguinho-${new Date().toISOString().slice(0,10)}.png`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(link.href),1500);
}
async function saveOrderImage(){
  if(imageBusy)return;imageBusy=true;
  const button=$("downloadImage");const original=button.innerHTML;button.disabled=true;button.textContent="Carregando fotos…";
  try{const blob=await makeOrderImage();downloadOrderImage(blob);toast("Foto do pedido baixada ✓")}
  catch(error){console.error("Falha ao criar a imagem",error);toast("Não foi possível carregar as fotos. Tente novamente.")}
  finally{imageBusy=false;button.disabled=false;button.innerHTML=original}
}
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
document.querySelectorAll("[data-scroll]").forEach(button=>button.onclick=()=>$(button.dataset.scroll).scrollIntoView({behavior:"smooth"}));
$("search").oninput=event=>renderProducts(event.target.value);
$("clearBox").onclick=()=>{if(confirm("Limpar todos os relógios da caixinha atual?")){state.current=[];save();render()}};
$("confirmBox").onclick=openCompleteModal;$("modalClose").onclick=closeModal;$("adjustBox").onclick=closeModal;
$("nextBox").onclick=()=>confirmCurrent(true);$("finishOrder").onclick=()=>confirmCurrent(false);
$("completeModal").onclick=event=>{if(event.target===$("completeModal"))closeModal()};
$("mobileBoxDock").onclick=openMobileDrawer;$("closeMobileBox").onclick=closeMobileDrawer;$("mobileBoxBackdrop").onclick=closeMobileDrawer;
$("zoomClose").onclick=closeProductZoom;$("zoomOut").onclick=()=>changeZoom(-.25);$("zoomIn").onclick=()=>changeZoom(.25);$("productZoom").onclick=event=>{if(event.target===$("productZoom"))closeProductZoom()};
$("downloadImage").onclick=saveOrderImage;
$("newOrder").onclick=()=>{if(confirm("Começar uma nova seleção?")){state={current:[],boxes:[]};save();$("printOrder").hidden=true;render();$("montador").scrollIntoView({behavior:"smooth"})}};
window.addEventListener("scroll",()=>document.querySelector(".topbar")?.classList.toggle("scrolled",scrollY>24),{passive:true});
document.addEventListener("keydown",event=>{if(event.key==="Escape"){if(!$("completeModal").hidden)closeModal();if(!$("productZoom").hidden)closeProductZoom();closeMobileDrawer()}});

load();render();setupStory();setupRevealAnimations();
(function(){const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;const intro=$("brandIntro");const seen=sessionStorage.getItem("tuguinho-intro-seen");if(intro&&!reduced&&!seen){document.body.classList.add("intro-lock");sessionStorage.setItem("tuguinho-intro-seen","1");setTimeout(()=>{intro.classList.add("done");document.body.classList.remove("intro-lock")},1450)}else intro?.classList.add("done")})();
