import{FIXED_STAIR_RULE,legacyToCards,targetCards,conditionById,effectDefinition}from'./card-orders.js';
export function activeDirectiveText(s){
 if(s.phase!=='explore')return '';
 if(s.executingRule==='fixed-chests')return '固定指示 · 自分 → 宝箱を取得';
 const fixed=s.executingRule==='fixed',index=s.executingRule,raw=fixed?FIXED_STAIR_RULE:Number.isInteger(index)&&index>=0?s.orders?.[index]:null;
 if(!raw||typeof raw.id!=='string')return '';
 const r=legacyToCards(raw),effect=effectDefinition(r),target=targetCards.find(t=>t.id===r.target);if(r.disabled||!effect||!target)return '';
 const conditions=(r.conditions||[]).map(c=>{const d=conditionById[c.id];return d?.name.replace('HPが','HP').replace('指定%',c.value+'%').replace('指定距離',c.value+'マス').replace('指定ターン',c.value+'ターン').replace('指定数',String(c.value))||'？';});
 return `${fixed?'固定指示':'指示'+(index+1)} · ${[target.name,...conditions].join(' ＋ ')} → ${effect.name}`;
}
