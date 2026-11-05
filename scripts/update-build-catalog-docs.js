import{augmentStrength}from'../augment-strength.js';
import fs from'node:fs';
import{buildThemes,themedAugments,themedSkills}from'../build-themes.js';
import{SET_EFFECTS}from'../set-bonuses.js';
const file=new URL('../docs/cards/BUILD_THEMES_V2.md',import.meta.url),old=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
const tail=old.slice(old.indexOf('## セット成立条件と表示')).split('## オーグメント星別性能（現行）')[0].trimEnd()+'\n';
let out='# 5職業テーマ・オーグメントとスキル\n\n本書はbuild-themes.js／set-bonuses.jsから生成した現行定義。全て仮採用バランス。各テーマのオーグメント・スキルはそれぞれNORMAL3／EPIC2／LEGENDARY1。合計30＋30。\n\n';
for(const t of buildThemes){out+='## '+t.name+'\n\n'+t.detail+'\n\nセットボーナス：'+SET_EFFECTS[t.id]+'\n\n';for(const[label,list]of[['オーグメント',themedAugments],['スキル',themedSkills]]){out+='### '+label+'\n\n|名前|レアリティ|効果|\n|---|---|---|\n';for(const c of list.filter(c=>c.themeId===t.id))out+='|'+c.name+'|'+c.rarity+'|'+c.detail+'|\n';out+='\n';}}
out+=tail;
out+='\n## オーグメント星別性能（現行）\n\n整数補正・回数は切上げ。ダメージ倍率は基本倍率そのものではなく増加分を強化。確率・軽減率は100%が上限。発動条件やデメリットは維持。\n\n|名前|★☆☆|★★☆|★★★|\n|---|---|---|---|\n';
for(const a of themedAugments){const list=themedSkills.filter(k=>k.themeId===a.themeId);out+='|'+a.name+'|'+[1,3,6].map(count=>{const own=list.slice(0,count);const s={augments:[a.id],ownedCards:own.map(k=>'skill:'+k.id),abilities:own.map(k=>k.id),unlockedOrders:['warp'],orders:own.map(k=>({cards:true,target:'self',effect:{kind:'skill',id:k.id}}))};return augmentStrength(a,s);}).join('|')+'|\n';}
if(process.argv.includes('--check')){if(out!==old)throw Error('Build catalog docs are stale');}else fs.writeFileSync(file,out);
