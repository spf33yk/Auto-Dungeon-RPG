export const PREPARATION_SKINS=[
 {id:'classic',name:'古金',accent:'#cdb378',edge:'#736347',panel:'#151817',text:'#ede5d2'},
 {id:'black-iron',name:'黒鉄',accent:'#b4c9da',edge:'#536b7e',panel:'#11191f',text:'#e6edf3'},
 {id:'bone-parchment',name:'骨白',accent:'#e4d6af',edge:'#98805b',panel:'#211c17',text:'#f2e7cd'},
 {id:'obsidian-runes',name:'黒曜石',accent:'#bca4ee',edge:'#6e5889',panel:'#171321',text:'#e9e0f6'}
];
export const skinById=id=>PREPARATION_SKINS.find(s=>s.id===id)||PREPARATION_SKINS[0];
export const nextPreparationSkin=id=>PREPARATION_SKINS[(PREPARATION_SKINS.findIndex(s=>s.id===id)+1)%PREPARATION_SKINS.length];
