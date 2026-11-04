import {AUGMENT_IMAGES,AUGMENT_FRAME} from './augment-art.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function augmentIllustration(a){const src=AUGMENT_IMAGES[a.id];return src?'<img class="augment-illustration" src="'+src+'" width="192" height="240" alt="" loading="lazy">':'';}
export function augmentCard(a,{choice=false,status=''}={}){
 const tag=choice?'button':'article';
 return '<'+tag+' class="illustrated-augment '+a.rarity+'"'+(choice?' data-augment="'+esc(a.id)+'" type="button"':'')+'>'+
 '<img class="augment-frame" src="'+AUGMENT_FRAME+'" width="384" height="576" alt="" aria-hidden="true">'+
 '<div class="augment-card-content"><small class="augment-theme">'+esc(a.theme)+' · '+esc(a.rarity)+'</small>'+augmentIllustration(a)+'<strong>'+esc(a.name)+'</strong><span class="augment-effect">'+esc(a.detail)+'</span>'+(status?'<small class="augment-status">'+esc(status)+'</small>':'')+'</div></'+tag+'>';
}
export function augmentChip(a){return '<span class="augment-chip illustrated-chip '+a.rarity+'" data-build-augment="'+esc(a.id)+'" tabindex="0" role="button" aria-label="'+esc(a.name+'の組み合わせを確認')+'" title="'+esc(a.detail)+'">'+augmentIllustration(a)+'<span><strong>'+esc(a.name)+'</strong><small>'+esc(a.theme)+' · '+esc(a.rarity)+'</small><small>'+esc(a.detail)+'</small></span></span>';}
