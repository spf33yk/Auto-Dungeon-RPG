import test from 'node:test';
import assert from 'node:assert/strict';
import {requestLandscapeDisplay} from './display-mode.js';
test('fullscreen is requested before orientation lock, with browser rejection safely handled',async()=>{
 const calls=[];assert.deepEqual(await requestLandscapeDisplay({requestFullscreen:async o=>calls.push(o)},{lock:async mode=>calls.push(mode)}),{fullscreen:true,landscape:true});
 assert.deepEqual(calls,[{navigationUI:'hide'},'landscape']);
 assert.deepEqual(await requestLandscapeDisplay({},{}),{fullscreen:false,landscape:false});
 assert.deepEqual(await requestLandscapeDisplay({requestFullscreen:async()=>{throw Error('denied');}},{lock:async()=>assert.fail('must not lock')}),{fullscreen:false,landscape:false});
 assert.deepEqual(await requestLandscapeDisplay({requestFullscreen:async()=>{}},{lock:async()=>{throw Error('unsupported');}}),{fullscreen:true,landscape:false});
});
