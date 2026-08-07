const STORAGE_KEY="tuguinho-monte-sua-caixa-v3",PRICE=39.99;
const ASSET_BASE=window.TUGUINHO_ASSET_BASE||"public/relogios";
const asset=sku=>`${ASSET_BASE}/${encodeURIComponent(sku)}.svg`;
const money=value=>Number(value||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
function countBox(box){return box.reduce((map,sku)=>(map[sku]=(map[sku]||0)+1,map),{})}
function loadOrder(){
  let state={boxes:[]};
  try{state=JSON.parse(localStorage.getItem(STORAGE_KEY))||state}catch(error){console.warn("Pedido não encontrado",error)}
  const boxes=Array.isArray(state.boxes)?state.boxes:[];
  document.getElementById("orderDate").textContent=new Date().toLocaleDateString("pt-BR");
  if(!boxes.length){document.getElementById("orderBoxes").innerHTML='<div class="empty-order"><b>Nenhuma caixa finalizada.</b><p>Volte ao montador e complete 12 relógios.</p></div>';document.getElementById("orderTotal").textContent="0 caixas";return}
  document.getElementById("orderBoxes").innerHTML=boxes.map((box,index)=>{const counts=countBox(box);return `<section class="order-box"><header><b>CAIXINHA ${index+1}</b><span>12 RELÓGIOS</span></header><div class="order-items">${Object.entries(counts).map(([sku,count])=>`<article class="order-item"><img src="${asset(sku)}" alt="${sku}"><div><b>${sku}</b><span>${count} unidade${count===1?"":"s"}</span></div></article>`).join("")}</div></section>`}).join("");
  document.getElementById("orderTotal").textContent=`${boxes.length} caixinha${boxes.length===1?"":"s"} · ${boxes.length*12} relógios · ${money(boxes.length*12*PRICE)}`;
}
loadOrder();