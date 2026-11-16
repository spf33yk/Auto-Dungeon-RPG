import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readUiSettings,saveUiSettings} from './ui-settings.js';

const storage=()=>{
 let value=null;
 return {getItem:()=>value,setItem:(_,next)=>{value=next;}};
};

test('three cursor choices persist as device UI settings without changing other settings',()=>{
 const store=storage();
 assert.equal(readUiSettings(store).cursorStyle,'arrow');
 for(const cursorStyle of ['arrow','shaded','triangle']){
  saveUiSettings(store,{cursorStyle,brightness:125});
  assert.equal(readUiSettings(store).cursorStyle,cursorStyle);
  assert.equal(readUiSettings(store).brightness,125);
 }
});

test('unknown cursor choice falls back to the first supplied arrow',()=>{
 const store=storage();
 store.setItem('abyss-ui-settings',JSON.stringify({cursorStyle:'old-small-cursor'}));
 assert.equal(readUiSettings(store).cursorStyle,'arrow');
 assert.equal(saveUiSettings(store,{cursorStyle:'unknown'}).cursorStyle,'arrow');
});

test('every game cursor uses the 64px Double asset',()=>{
 const manifest=JSON.parse(readFileSync(new URL('./art/ui/cursors-v1/manifest.json',import.meta.url)));
 assert.equal(manifest.cell,64);
 assert.deepEqual(Object.keys(manifest.variants),['arrow','shaded','triangle']);
 for(const asset of Object.values(manifest.states).concat(Object.values(manifest.variants))){
  const png=readFileSync(new URL('./art/ui/cursors-v1/'+asset.file,import.meta.url));
  assert.equal(png.readUInt32BE(16),64,asset.file);
  assert.equal(png.readUInt32BE(20),64,asset.file);
 }
});
