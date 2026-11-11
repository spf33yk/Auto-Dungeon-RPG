import{augmentName,augmentStrength}from'./augment-strength.js';
import{themeIcon,augmentSetHint,augmentHoverText}from'./theme-view.js';
import {AUGMENT_IMAGES,AUGMENT_FRAME} from './augment-art.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function augmentIllustration(a){const src=AUGMENT_IMAGES[a.id];return src?'<img class="augment-illustration" src="'+src+'" width="192" height="192" alt="" loading="lazy">':'';}
export function augmentCard(a,{choice=false,status='',state=null,showSetHint=true}={}){
 const tag=choice?'button':'article';
 const previewState=choice&&state?{...state,augments:[...state.augments,a.id]}:state;
 return '<'+tag+' class="illustrated-augment '+a.rarity+'"'+(choice?' data-augment="'+esc(a.id)+'" type="button"':' title="'+esc(augmentHoverText(a,state))+'" tabindex="0"')+'>'+
 '<img class="augment-frame" src="'+AUGMENT_FRAME+'" width="384" height="576" alt="" aria-hidden="true">'+
 '<div class="augment-card-content"><small class="augment-theme">'+themeIcon(a.themeId)+esc(a.theme)+' · '+esc(a.rarity)+'</small>'+augmentIllustration(a)+'<strong>'+esc(augmentName(a,previewState))+'</strong><span class="augment-effect">'+esc(augmentStrength(a,previewState))+'</span>'+(choice||!showSetHint?'':augmentSetHint(a,state))+(status?'<small class="augment-status">'+esc(status)+'</small>':'')+'</div></'+tag+'>';
}
export function augmentChip(a,state=null){return '<span class="augment-chip illustrated-chip '+a.rarity+'" title="'+esc(augmentHoverText(a,state))+'" tabindex="0">'+augmentIllustration(a)+'<span><strong>'+esc(augmentName(a,state))+'</strong><small>'+themeIcon(a.themeId)+esc(a.theme)+' · '+esc(a.rarity)+'</small><small>'+esc(augmentStrength(a,state))+'</small></span></span>';}
