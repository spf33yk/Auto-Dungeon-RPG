import test from 'node:test';
import assert from 'node:assert/strict';
import {storyFragment,displayStoryText,openingThought,letterFloorThought} from './story-text.js';
import {newGame,notifyB15,LETTER_FLOOR,normalizeSave,zones} from './engine.js';

test('the first journey uses fragments and the next remembers the son without changing milestone floors',()=>{
 for(const floor of [6,12,18,24]){
  assert.ok(storyFragment(floor,0));assert.ok(storyFragment(floor,1));assert.notEqual(storyFragment(floor,0),storyFragment(floor,1));
  assert.doesNotMatch(storyFragment(floor,0),/息子|父さん|人質|魔王は告げた/);
 }
 assert.equal(storyFragment(7,0),undefined);
 const first=newGame(7),second=newGame(7,{...first.profile,normalClears:1});
 assert.doesNotMatch(openingThought(0),/息子|手紙/);assert.match(openingThought(1),/息子.*手紙/);
 for(const s of [first,second]){s.floor=LETTER_FLOOR;assert.equal(notifyB15(s),true);assert.equal(s.logs[0].text,letterFloorThought(s.profile.normalClears));assert.equal(notifyB15(s),false);}
});
test('legacy fragments and hint names are converted for display without altering saved data',()=>{
 const s=newGame(8),legacy='魔王は告げた。「息子の命が惜しければ、記憶を捨てろ」';s.memories=[legacy];s.logs.unshift({text:legacy,type:'story',turn:0});
 const copy=normalizeSave(JSON.parse(JSON.stringify(s)));
 assert.equal(displayStoryText(copy.memories[0],0),storyFragment(18,0));assert.equal(copy.memories[0],legacy);assert.equal(copy.logs[0].text,legacy);
 assert.equal(displayStoryText('B28 · 忘却の地下墓地',0),'B28 · 忘れられた地下墓所');
 assert.deepEqual([0,1,3,4,6,9].map(i=>zones[i].name),['忘れられた地下墓所','苔むした水路','燃え盛る炉跡','凍てついた聖堂','毒の庭園','暁への門']);
});
