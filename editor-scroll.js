// Keep scroll offsets across DOM replacement; row offsets follow rule identity.
const previousRows=new WeakMap();
const selectors=['.card-rules','.instruction-trays','.card-library-list'];
export function captureEditorScroll(host){
 const old=previousRows.get(host)||[];
 return {top:host.scrollTop,left:host.scrollLeft,panels:selectors.map(selector=>{const el=host.querySelector(selector);return [selector,el?.scrollTop||0,el?.scrollLeft||0];}),rows:[...host.querySelectorAll('[data-card-row]')].map(el=>({rule:old[Number(el.dataset.cardRow)],left:el.querySelector('.tray-scroll')?.scrollLeft||0}))};
}
export function restoreEditorScroll(host,orders,snapshot){
 for(const [selector,top,left]of snapshot.panels){const el=host.querySelector(selector);if(el){el.scrollTop=top;el.scrollLeft=left;}}
 for(const el of host.querySelectorAll('[data-card-row]')){const rule=orders[Number(el.dataset.cardRow)],saved=snapshot.rows.find(row=>row.rule===rule),scroll=el.querySelector('.tray-scroll');if(scroll&&saved)scroll.scrollLeft=saved.left;}
 host.scrollTop=snapshot.top;host.scrollLeft=snapshot.left;previousRows.set(host,[...orders]);
}
