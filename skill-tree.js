// Visual grouping does not change costs, prerequisites or skill effects.
export const memoryGroups=[
 {id:'status',name:'ステータス',detail:'骸の基礎能力',ids:['vitality','power','guard','scout']},
 {id:'orders',name:'探索指示',detail:'行動の選択肢と指示枠',ids:['collect','chestSense','chestNear','exitLoot','exploreNear','exploration','commandSlots','exitTimed','survival','healEarly','exitLow','evasion','avoidGroup','huntAny','huntInjured','huntWeak','huntDanger']},
 {id:'skills',name:'スキル',detail:'戦術と自動発動',ids:['tactics','mend']},
 {id:'events',name:'イベント',detail:'鑑定・解呪・合成・絆',ids:['identify','uncurse','synthesis','bond']},
];
export function memoryForest(skills){return memoryGroups.map(group=>{const list=skills.filter(k=>group.ids.includes(k.id));const build=k=>({skill:k,children:list.filter(c=>c.requires===k.id).map(build)});return {...group,roots:list.filter(k=>!list.some(p=>p.id===k.requires)).map(build)};});}

// Leaf-spaced graph: every line follows a real prerequisite, including group roots.
export function memoryLayout(skills,groupId){
 const group=memoryForest(skills).find(g=>g.id===groupId);let leaf=0;const nodes=[],edges=[];
 function place(n,depth){const children=n.children.map(c=>place(c,depth+1));const y=children.length?children.reduce((a,c)=>a+c.y,0)/children.length:70+(leaf++)*76;const p={skill:n.skill,x:235+depth*210,y};nodes.push(p);for(const c of children)edges.push({from:p,to:c});return p;}
 const roots=group.roots.map(n=>place(n,0));const height=Math.max(420,leaf*76+70),root={x:65,y:height/2};for(const n of roots)edges.push({from:root,to:n});return {nodes,edges,root,width:Math.max(760,...nodes.map(n=>n.x+110)),height};
}
