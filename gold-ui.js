import {GOLD_ART} from './gold-art.js';
const names={target:'ターゲットカード',condition:'条件カード',action:'アクションカード',skill:'スキルカード'};
export const kindIcon=kind=>Object.hasOwn(names,kind)?'<img class="card-kind-icon" src="'+GOLD_ART['kind-'+kind]+'" alt="" aria-hidden="true">':'';
export const kindMark=kind=>kindIcon(kind)+'<span class="card-kind-label" aria-hidden="true">'+(names[kind]||'')+'</span>';
export const abilityIcon=kind=>'<img class="ability-icon" src="'+GOLD_ART['ability-'+kind]+'" alt="" aria-hidden="true">';
