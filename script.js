const SKUS=["TG30615","TG30616","TG30617","TG30618","TG30619","TG30620","TG30622","TG30623","TG30624","TG30625","TG30626","TG30627","TG30628","TG30629","TG30630","TG30631","TG30632","TG30633","TG30634","TG30635","TG30636","TG30637","TG30638","TG30639","TG30640","TG30641","TG30642","TG30643","TG30644","TG30645","TG30646","TG30647","TG30648","TG30649","TG30650","TG30651","TG30652","TG30653","TG30654"];
const PRICE=39.99,BOX_SIZE=12,STORAGE_KEY="tuguinho-monte-sua-caixa-v2";
let state={current:[],boxes:[],checkoutVisible:false};
const $=id=>document.getElementById(id);
const money=value=>value.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
function load(){try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));if(saved&&Array.isArray(saved.current)&&Array.isArray(saved.boxes))state={current:saved.current,boxes:saved.boxes,checkoutVisible:Boolean(saved.checkoutVisible)}}catch(e){}}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function productCount(sku){return state.current.filter(item=>item===sku).length}
function renderProducts(filter=""){
 const list=SKUS.filter(s=>s.toLowerCase().includes(filter.toLowerCase()));$("visibleCount").textContent=list.length;
 $("productGrid").innerHTML=list.length?list.map(sku=>{const n=productCount(sku);return `<article class="product ${n?"selected":""}" data-sku="${sku}">${n?`<span class="product-badge">${n} na caixa</span>`:""}<div class="product-photo"><img src="public/relogios/${sku}.svg" alt="Relógio infantil ${sku}" loading="lazy"></div><small>RELÓGIO INFANTIL</small><h3>${sku}</h3><b class="product-price">R$ 39,99</b><div class="quantity"><button class="remove" ${n?"":"disabled"} aria-label="Remover ${sku}">−</button><b>${n}</b><button class="add" ${state.current.length>=BOX_SIZE?"disabled":""} aria-label="Adicionar ${sku}">+</button></div></article>`}).join(""):`<div class="empty-result">Nenhum SKU encontrado.</div>`;
 document.querySelectorAll(".product").forEach(card=>{card.querySelector(".add").onclick=()=>addProduct(card.dataset.sku,card.querySelector("img"));card.querySelector(".remove").onclick=()=>removeProduct(card.dataset.sku)});
}
function flyToBox(image){if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;const start=image.getBoundingClientRect();const target=(innerWidth<=820?$("mobileBoxDock"):$("boxPanel")).getBoundingClientRect();const clone=image.cloneNode();clone.className="fly";clone.style.left=(start.left+start.width/2-45)+"px";clone.style.top=(start.top+start.height/2-45)+"px";document.body.appendChild(clone);requestAnimationFrame(()=>{clone.style.transform=`translate(${target.left+target.width/2-(start.left+start.width/2)}px,${target.top+target.height/2-(start.top+start.height/2)}px) scale(.28) rotate(12deg)`;clone.style.opacity=".15"});setTimeout(()=>clone.remove(),340)}
function addProduct(sku,image){if(state.current.length>=BOX_SIZE)return;flyToBox(image);state.current.push(sku);state.checkoutVisible=false;save();render();if(state.current.length===BOX_SIZE)setTimeout(openCompleteModal,380);else if(productCount(sku)>1)toast("Pode repetir: esse modelo entrou novamente ✓")}
function removeProduct(sku){const index=state.current.lastIndexOf(sku);if(index<0)return;state.current.splice(index,1);save();render();toast(`${sku} saiu da caixa`)}
function progressMessage(){const n=state.current.length;if(n===0)return"Escolha o primeiro Tuguinho para começar.";if(n===12)return"✓ Caixa completa. Seu mix ficou incrível!";if(n===6)return"Metade da caixa pronta!";if(n===11)return"Só falta 1 relógio para fechar.";return`Faltam ${12-n} relógios para completar.`}
function renderBox(){const n=state.current.length;$("boxNumber").textContent=state.boxes.length+1;$("boxCount").innerHTML=`${n}<small>/12</small>`;$("progressMessage").textContent=progressMessage();$("progressMessage").classList.toggle("complete",n===12);$("subtotal").textContent=money(n*PRICE);$("segments").innerHTML=Array.from({length:12},(_,i)=>`<i class="${i<n?"on":""}"></i>`).join("");$("slots").innerHTML=Array.from({length:12},(_,i)=>state.current[i]?`<div class="slot full" data-index="${i}"><img src="public/relogios/${state.current[i]}.svg" alt="${state.current[i]}"><button aria-label="Remover ${state.current[i]}">×</button><small>${state.current[i]}</small></div>`:`<div class="slot"><i>${i+1}</i><small>livre</small></div>`).join("");document.querySelectorAll(".slot.full").forEach(slot=>slot.querySelector("button").onclick=()=>{state.current.splice(Number(slot.dataset.index),1);save();render()});const confirm=$("confirmBox");confirm.disabled=n!==12;confirm.textContent=n===12?`Concluir Caixa ${state.boxes.length+1} →`:`Faltam ${12-n} para completar`;$("clearBox").hidden=n===0;$("mobileBoxCount").textContent=`${n}/12`;$("mobileBoxTotal").textContent=money(n*PRICE)}
function renderSaved(){const count=state.boxes.length;$("headerBoxes").textContent=`Caixa ${count+1}`;$("headerUnits").textContent=`${state.current.length}/12`;$("savedBoxes").hidden=count===0;$("savedBoxesList").innerHTML=state.boxes.map((box,i)=>`<div class="saved-row"><div class="saved-thumbs">${box.slice(0,4).map(sku=>`<img src="public/relogios/${sku}.svg" alt="">`).join("")}<i>+8</i></div><span>✓ Caixa ${i+1} guardada</span><b>12 peças · R$ 479,88</b></div>`).join("");$("grandTotal").textContent=`${count} caixa${count===1?"":"s"} · ${count*12} peças · ${money(count*12*PRICE)}`;$("sendOrder").disabled=count===0;$("checkout").hidden=!(state.checkoutVisible&&count>0)}
function render(){renderProducts($("search").value);renderBox();renderSaved()}
function openCompleteModal(){$("completeModal").hidden=false;document.body.style.overflow="hidden";$("modalTitle").textContent=`Uhu! Caixa ${state.boxes.length+1} pronta!`}
function closeModal(){$("completeModal").hidden=true;document.body.style.overflow=""}
function confirmCurrent(startAnother){if(state.current.length!==12)return;closeMobileDrawer();state.boxes.push([...state.current]);state.current=[];state.checkoutVisible=!startAnother;save();closeModal();render();if(startAnother){$("montador").scrollIntoView({behavior:"smooth"});toast(`Caixa ${state.boxes.length} guardada. Vamos montar a próxima!`)}else{setTimeout(()=>$("checkout").scrollIntoView({behavior:"smooth"}),60);toast("Caixa confirmada. Agora faltam só seus dados.")}}
function buildWhatsapp(){const store=$("storeName").value.trim(),buyer=$("buyerName").value.trim(),representative=$("representative").value.trim(),phone=$("phone").value.trim();const lines=["*PRÉ-PEDIDO TUGUINHO - MONTE SUA CAIXA*",`Loja: ${store}`,`Comprador: ${buyer}`,`Representante: ${representative}`,`Telefone/WhatsApp: ${phone}`,"",...state.boxes.flatMap((box,i)=>{const counts=box.reduce((a,sku)=>(a[sku]=(a[sku]||0)+1,a),{});return [`*CAIXA ${i+1} - 12 PEÇAS*`,...Object.entries(counts).map(([sku,n])=>`• ${sku}: ${n} un.`),"Subtotal: R$ 479,88",""]}),`*TOTAL: ${state.boxes.length} caixa(s) · ${state.boxes.length*12} relógios · ${money(state.boxes.length*12*PRICE)}*`,"","Pré-pedido sujeito à confirmação comercial."];return lines.join("\n")}
function updatePackageReveal(value){const p=Number(value)/100;const closed=Math.max(0,1-p*2);const open=1-Math.abs(p-.5)*2;const unit=Math.max(0,(p-.5)*2);const stage=$("packageReveal");stage.style.setProperty("--closed",closed);stage.style.setProperty("--open",open);stage.style.setProperty("--unit",unit);const activeIndex=p<.34?0:p<.72?1:2;stage.querySelectorAll(".reveal-tab").forEach((tab,i)=>{const active=i===activeIndex;tab.classList.toggle("active",active);tab.setAttribute("aria-pressed",String(active))});if(p<.34){$("revealStep").textContent="01. Protegida para chegar";$("revealDescription").textContent="A caixa viaja fechada e segura até a sua loja.";$("revealBadge").textContent="PROTEGIDA"}else if(p<.72){$("revealStep").textContent="02. Virou expositor";$("revealDescription").textContent="Abriu, colocou no balcão: está pronta para chamar atenção.";$("revealBadge").textContent="12 RELÓGIOS"}else{$("revealStep").textContent="03. Cada Tuguinho no seu espaço";$("revealDescription").textContent="Cada relógio fica organizado em sua própria embalagem.";$("revealBadge").textContent="INDIVIDUAL"}}
function openMobileDrawer(){$("boxPanel").classList.add("mobile-open");$("mobileBoxBackdrop").classList.add("open");document.body.classList.add("drawer-open")}function closeMobileDrawer(){$("boxPanel").classList.remove("mobile-open");$("mobileBoxBackdrop").classList.remove("open");document.body.classList.remove("drawer-open")}
let revealDemoTimers=[];function stopRevealDemo(){revealDemoTimers.forEach(clearTimeout);revealDemoTimers=[];$("packageReveal")?.classList.remove("demo-playing")}function setDemoStage(value){$("packageSlider").value=value;updatePackageReveal(value)}function playRevealDemo(){if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;const reveal=$("packageReveal");if(!reveal||reveal.dataset.demoSeen)return;reveal.dataset.demoSeen="true";reveal.classList.add("demo-playing");setDemoStage(0);revealDemoTimers=[setTimeout(()=>setDemoStage(50),850),setTimeout(()=>setDemoStage(100),1850),setTimeout(()=>reveal.classList.remove("demo-playing"),2800)]}
let toastTimer;function toast(text){clearTimeout(toastTimer);$("toast").textContent=text;$("toast").classList.add("show");toastTimer=setTimeout(()=>$("toast").classList.remove("show"),2500)}
document.querySelectorAll("[data-scroll]").forEach(btn=>btn.onclick=()=>$(btn.dataset.scroll).scrollIntoView({behavior:"smooth"}));$("search").oninput=e=>renderProducts(e.target.value);$("clearBox").onclick=()=>{if(confirm("Limpar todos os relógios da caixa atual?")){state.current=[];save();render()}};$("confirmBox").onclick=openCompleteModal;$("modalClose").onclick=closeModal;$("adjustBox").onclick=closeModal;$("nextBox").onclick=()=>confirmCurrent(true);$("finishOrder").onclick=()=>confirmCurrent(false);$("completeModal").onclick=e=>{if(e.target===$("completeModal"))closeModal()};$("packageSlider").oninput=e=>{stopRevealDemo();updatePackageReveal(e.target.value)};document.querySelectorAll(".reveal-tab").forEach(tab=>tab.onclick=()=>{stopRevealDemo();$("packageSlider").value=tab.dataset.stage;updatePackageReveal(tab.dataset.stage)});$("mobileBoxDock").onclick=openMobileDrawer;$("closeMobileBox").onclick=closeMobileDrawer;$("mobileBoxBackdrop").onclick=closeMobileDrawer;
async function saveOrderToDatabase(){
  if(!window.tuguinhoDb)throw new Error("Banco indisponível");
  const payload={
    store_name:$("storeName").value.trim(),
    buyer_name:$("buyerName").value.trim(),
    representative:$("representative").value.trim(),
    phone:$("phone").value.trim(),
    boxes:state.boxes,
    unit_price:PRICE,
    consent_at:new Date().toISOString()
  };
  const {error}=await window.tuguinhoDb.from("orders").insert(payload);
  if(error)throw error;
}
$("orderForm").onsubmit=async e=>{
  e.preventDefault();
  if(!state.boxes.length)return toast("Confirme pelo menos uma caixa primeiro.");
  const sendButton=$("sendOrder");
  const originalLabel=sendButton.innerHTML;
  const whatsappWindow=window.open("about:blank","_blank");
  sendButton.disabled=true;
  sendButton.textContent="Salvando pré-pedido...";
  try{
    await saveOrderToDatabase();
    const link=`https://wa.me/?text=${encodeURIComponent(buildWhatsapp())}`;
    if(whatsappWindow)whatsappWindow.location.href=link;else window.location.href=link;
    $("checkout").hidden=true;
    $("successSummary").textContent=`${state.boxes.length} caixa${state.boxes.length===1?"":"s"}, ${state.boxes.length*12} relógios e ${money(state.boxes.length*12*PRICE)} em produtos.`;
    $("successCard").hidden=false;
    $("successCard").scrollIntoView({behavior:"smooth"});
    toast("Pré-pedido salvo e preparado para o WhatsApp ✓");
  }catch(error){
    whatsappWindow?.close();
    console.error("Falha ao salvar pré-pedido",error);
    toast("Não foi possível salvar. Confira a internet e tente novamente.");
  }finally{
    sendButton.innerHTML=originalLabel;
    sendButton.disabled=state.boxes.length===0;
  }
};
$("newOrder").onclick=()=>{if(confirm("Começar um novo pedido?")){state={current:[],boxes:[],checkoutVisible:false};save();$("successCard").hidden=true;render();$("montador").scrollIntoView({behavior:"smooth"})}};
load();render();updatePackageReveal(0);
(function(){const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;const intro=$("brandIntro");const introSeen=sessionStorage.getItem("tuguinho-intro-seen");if(intro&&!reduced&&!introSeen){document.body.classList.add("intro-lock");sessionStorage.setItem("tuguinho-intro-seen","1");setTimeout(()=>{intro.classList.add("done");document.body.classList.remove("intro-lock")},1450)}else intro?.classList.add("done");const targets=document.querySelectorAll(".benefits article,.package-copy,.package-reveal,.how h2,.how article,.checkout-copy");targets.forEach(el=>el.setAttribute("data-reveal",""));if(reduced||!("IntersectionObserver" in window)){targets.forEach(el=>el.classList.add("visible"));return}const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("visible");observer.unobserve(entry.target)}}),{threshold:.07,rootMargin:"0px 0px -6%"});targets.forEach(el=>observer.observe(el))})();

document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!document.getElementById('completeModal').hidden)closeModal();closeMobileDrawer()}});

const packageDemoObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){playRevealDemo();packageDemoObserver.disconnect()}}),{threshold:.35});packageDemoObserver.observe($("packageReveal"));