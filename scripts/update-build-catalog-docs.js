import fs from'node:fs';
import{buildThemes,themedAugments,themedSkills}from'../build-themes.js';
import{SET_EFFECTS}from'../set-bonuses.js';
const file=new URL('../docs/cards/BUILD_THEMES_V2.md',import.meta.url),old=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
const tail=old.slice(old.indexOf('## セット成立条件と表示'));
let out='# 5職業テーマ・オーグメントとスキル\n\n本書はbuild-themes.js／set-bonuses.jsから生成した現行定義。全て仮採用バランス。各テーマのオーグメント・スキルはそれぞれNORMAL3／EPIC2／LEGENDARY1。合計30＋30。\n\n';
for(const t of buildThemes){out+='## '+t.name+'\n\n'+t.detail+'\n\nセットボーナス：'+SET_EFFECTS[t.id]+'\n\n';for(const[label,list]of[['オーグメント',themedAugments],['スキル',themedSkills]]){out+='### '+label+'\n\n|名前|レアリティ|効果|\n|---|---|---|\n';for(const c of list.filter(c=>c.themeId===t.id))out+='|'+c.name+'|'+c.rarity+'|'+c.detail+'|\n';out+='\n';}}
out+=tail;if(process.argv.includes('--check')){if(out!==old)throw Error('Build catalog docs are stale');}else fs.writeFileSync(file,out);
