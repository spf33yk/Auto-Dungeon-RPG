import test from 'node:test';
import assert from 'node:assert/strict';
import {requestLandscapeDisplay,sceneLayout} from './display-mode.js';
test('fullscreen is requested before orientation lock, with browser rejection safely handled',async()=>{
 const calls=[];assert.deepEqual(await requestLandscapeDisplay({requestFullscreen:async o=>calls.push(o)},{lock:async mode=>calls.push(mode)}),{fullscreen:true,landscape:true});
 assert.deepEqual(calls,[{navigationUI:'hide'},'landscape']);
 assert.deepEqual(await requestLandscapeDisplay({},{}),{fullscreen:false,landscape:false});
 assert.deepEqual(await requestLandscapeDisplay({requestFullscreen:async()=>{throw Error('denied');}},{lock:async()=>assert.fail('must not lock')}),{fullscreen:false,landscape:false});
 assert.deepEqual(await requestLandscapeDisplay({requestFullscreen:async()=>{}},{lock:async()=>{throw Error('unsupported');}}),{fullscreen:true,landscape:false});
});
test('PC and landscape phones share one scene with no crop or aspect distortion',()=>{
 for(const [w,h]of [[1280,720],[1920,1080],[740,416],[844,390],[360,740],[2560,1440]]){const layout=sceneLayout(w,h,true);assert.equal(layout.width,1280);assert.equal(layout.height,720);assert.ok(layout.width*layout.scale<=w+1e-8);assert.ok(layout.height*layout.scale<=h+1e-8);assert.ok(Math.abs(layout.width/layout.height-16/9)<1e-8);assert.equal(layout.portrait,h>w);}
 assert.equal(sceneLayout(360,740,false).portrait,false);assert.equal(sceneLayout(1280,720).scale,1);assert.equal(sceneLayout(1920,1080).scale,1.5);
});
