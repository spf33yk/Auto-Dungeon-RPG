import{themeIcon,augmentSetHint}from'./theme-view.js';
import {AUGMENT_IMAGES,AUGMENT_FRAME} from './augment-art.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function augmentIllustration(a){const src=AUGMENT_IMAGES[a.id];return src?'<img class="augment-illustration" src="'+src+'" width="192" height="192" alt="" loading="lazy">':'';}
export function augmentCard(a,{choice=false,status='',state=null}={}){
 const tag=choice?'button':'article';
 return '<'+tag+' class="illustrated-augment '+a.rarity+'"'+(choice?' data-augment="'+esc(a.id)+'" type="button"':'')+'>'+
 '<img class="augment-frame" src="'+AUGMENT_FRAME+'" width="384" height="576" alt="" aria-hidden="true">'+
 '<div class="augment-card-content"><small class="augment-theme">'+themeIcon(a.themeId)+esc(a.theme)+' · '+esc(a.rarity)+'</small>'+augmentIllustration(a)+'<strong>'+esc(a.name)+'</strong><span class="augment-effect">'+esc(a.detail)+'</span>'+augmentSetHint(a,state,{preview:choice})+(status?'<small class="augment-status">'+esc(status)+'</small>':'')+'</div></'+tag+'>';
}
export function augmentChip(a,state=null){return '<span class="augment-chip illustrated-chip '+a.rarity+'" title="'+esc(a.detail)+'">'+augmentIllustration(a)+'<span><strong>'+esc(a.name)+'</strong><small>'+themeIcon(a.themeId)+esc(a.theme)+' · '+esc(a.rarity)+'</small><small>'+esc(a.detail)+'</small></span></span>';}
