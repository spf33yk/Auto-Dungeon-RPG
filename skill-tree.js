// Visual grouping does not change costs, prerequisites or skill effects.
export const memoryGroups=[
 {id:'status',name:'ステータス',detail:'骸の基礎能力',ids:['vitality','power','guard','scout']},
 {id:'orders',name:'探索指示',detail:'行動の選択肢と指示枠',ids:['collect','exploration','commandSlots','survival','evasion']},
 {id:'skills',name:'スキル',detail:'戦術と自動発動',ids:['tactics','mend']},
 {id:'events',name:'イベント',detail:'鑑定・解呪・合成・絆',ids:['identify','uncurse','synthesis','bond']},
];
export function memoryForest(skills){return memoryGroups.map(group=>{const list=skills.filter(k=>group.ids.includes(k.id));const build=k=>({skill:k,children:list.filter(c=>c.requires===k.id).map(build)});return {...group,roots:list.filter(k=>!list.some(p=>p.id===k.requires)).map(build)};});}
