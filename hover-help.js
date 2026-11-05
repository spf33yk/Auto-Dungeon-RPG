// Shared readable help for cards and augments, including keyboard focus.
export function installHoverHelp(){
 const box=document.createElement('div');box.id='game-hover-help';box.className='game-hover-help';box.setAttribute('role','tooltip');box.hidden=true;box.setAttribute('popover','manual');document.body.append(box);let owner=null;
 const selector='.palette-card,.board-slot,.card-reward-choice,.illustrated-augment,.illustrated-chip,.set-bonus-chip,.card-codex-item';
 const hide=()=>{if(owner)owner.removeAttribute('aria-describedby');owner=null;box.hidePopover?.();box.hidden=true;};
 const show=(el,x,y)=>{const text=el.getAttribute('title')||el.dataset.help;if(!text){hide();return;}if(el.hasAttribute('title')){el.dataset.help=text;el.removeAttribute('title');}owner?.removeAttribute('aria-describedby');owner=el;el.setAttribute('aria-describedby',box.id);box.textContent=text;box.hidden=false;box.showPopover?.();box.style.left='0px';box.style.top='0px';const r=box.getBoundingClientRect();box.style.left=Math.max(8,Math.min(innerWidth-r.width-8,x+14))+'px';box.style.top=Math.max(8,Math.min(innerHeight-r.height-8,y+18))+'px';};
 document.addEventListener('pointerover',e=>{if(e.pointerType==='touch')return;const el=e.target.closest(selector);if(el)show(el,e.clientX,e.clientY);});
 document.addEventListener('pointerout',e=>{if(owner&&!owner.contains(e.relatedTarget))hide();});
 document.addEventListener('focusin',e=>{const el=e.target.closest(selector);if(el){const r=el.getBoundingClientRect();show(el,r.left,r.bottom);}});
 document.addEventListener('focusout',hide);document.addEventListener('scroll',hide,true);document.addEventListener('pointerdown',hide);document.addEventListener('keydown',e=>{if(e.key==='Escape')hide();});window.addEventListener('resize',hide);
}
