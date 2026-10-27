import test from 'node:test';
import assert from 'node:assert/strict';
import {createLogVisibility,LOG_VISIBLE_MS} from './log-visibility.js';

test('field log hides after three seconds without new messages and reappears for an update',()=>{
 let now=0,serial=0,visible=false;const timers=new Map();
 const advance=ms=>{now+=ms;for(const [id,t] of [...timers])if(t.at<=now){timers.delete(id);t.fn();}};
 const v=createLogVisibility({show:()=>{visible=true;},hide:()=>{visible=false;},schedule:(fn,delay)=>{const id=++serial;timers.set(id,{fn,at:now+delay});return id;},cancel:id=>timers.delete(id)});
 assert.equal(LOG_VISIBLE_MS,3000);v.sync(true,'first');assert.equal(visible,true);
 advance(2000);v.sync(true,'first');advance(999);assert.equal(visible,true);advance(1);assert.equal(visible,false);
 v.sync(true,'second');assert.equal(visible,true);advance(2000);v.sync(true,'third');advance(1000);assert.equal(visible,true);advance(2000);assert.equal(visible,false);
 v.sync(false,'third');assert.equal(visible,true);advance(10000);assert.equal(visible,true);
 v.sync(true,'third');assert.equal(visible,true);advance(3000);assert.equal(visible,false);
});

test('stale timers cannot hide a newer message or the preparation log',()=>{
 let visible=false;const callbacks=[];
 const v=createLogVisibility({show:()=>{visible=true;},hide:()=>{visible=false;},schedule:fn=>(callbacks.push(fn),callbacks.length),cancel:()=>{}});
 v.sync(true,'a');v.sync(true,'b');callbacks[0]();assert.equal(visible,true);
 v.sync(false,'b');callbacks[1]();assert.equal(visible,true);
});
