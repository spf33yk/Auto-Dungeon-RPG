// Shared readiness barriers; failed requests remain retryable.
export function createAssetCache(load){
 const cache=new Map();return {load(key){if(!cache.has(key)){const job=Promise.resolve().then(()=>load(key));cache.set(key,job);job.catch(()=>{if(cache.get(key)===job)cache.delete(key);});}return cache.get(key);},has:key=>cache.has(key)};
}
export async function preloadAssets(urls,{load,concurrency=6,onProgress=()=>{}}){
 const list=[...new Set(urls)].filter(Boolean);let cursor=0,done=0;const worker=async()=>{while(cursor<list.length){const url=list[cursor++];await load(url);onProgress(++done,list.length);}};await Promise.all(Array.from({length:Math.min(Math.max(1,concurrency),list.length)},worker));
}
export function withAssetDeadline(job,ms=30000){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Asset readiness timed out')),ms);Promise.resolve(job).then(value=>{clearTimeout(timer);resolve(value);},error=>{clearTimeout(timer);reject(error);});});}
export function imageReady(image){
 if(image.complete&&image.naturalWidth>0)return typeof image.decode==='function'?withAssetDeadline(image.decode()).catch(error=>{throw Error('Image '+image.src+': '+error.message);}):Promise.resolve();
 if(typeof image.decode==='function')return withAssetDeadline(image.decode()).catch(error=>{throw Error('Image '+image.src+': '+error.message);});
 return withAssetDeadline(new Promise((resolve,reject)=>{image.addEventListener('load',resolve,{once:true});image.addEventListener('error',()=>reject(Error('Image could not load')),{once:true});}));
}
export function videoReady(video,{enough=false}={}){
 const required=enough?4:2;if(video.readyState>=required)return Promise.resolve();video.preload='auto';
 return new Promise((resolve,reject)=>{let timer;const cleanup=()=>{clearTimeout(timer);for(const name of ['loadeddata','canplay','canplaythrough'])video.removeEventListener(name,check);video.removeEventListener('error',fail);};const check=()=>{if(video.readyState>=required){cleanup();resolve();}};const fail=()=>queueMicrotask(()=>{if(video.error){cleanup();reject(Error('Video could not load'));}});timer=setTimeout(()=>{cleanup();reject(Error('Video readiness timed out'));},30000);for(const name of ['loadeddata','canplay','canplaythrough'])video.addEventListener(name,check);video.addEventListener('error',fail);if(video.networkState===0)video.load();check();});
}
export function collectScreenImages(doc){
 const urls=new Set(),add=(value,base=doc.baseURI)=>{if(!value)return;try{const url=new URL(value,base);if(url.origin===new URL(doc.baseURI).origin&&/\.(png|webp|jpe?g|svg)(\?|$)/i.test(url.href))urls.add(url.href);}catch{}};
 for(const el of doc.querySelectorAll('*')){if(el.tagName==='IMG')add(el.getAttribute('src'));for(const value of Object.values(el.dataset))add(value);}
 const rules=(list,base)=>{for(const rule of list){if(rule.style){for(const match of rule.style.cssText.matchAll(/url\(\s*['"]?([^'"\)]+)['"]?\s*\)/g))add(match[1],base);}if(rule.cssRules)rules(rule.cssRules,base);}};
 for(const sheet of doc.styleSheets)try{rules(sheet.cssRules,sheet.href||doc.baseURI);}catch{}
 return [...urls];
}
let activeGuard=null;
export function prepareScreenAssets(elements,options){return activeGuard?activeGuard.prepare(elements,options):Promise.all(elements.map(el=>el.tagName==='VIDEO'?videoReady(el,options):imageReady(el)));}
export function installScreenAssetGuard(doc=document){
 const dialog=doc.createElement('dialog');dialog.id='screen-asset-loading';dialog.setAttribute('aria-label','素材の読み込み');dialog.innerHTML='<div role="status" aria-live="polite"><strong>読み込み中…</strong><p>画面の準備ができるまでお待ちください。</p></div><button type="button" hidden>再試行</button>';doc.body.append(dialog);dialog.addEventListener('cancel',e=>e.preventDefault());
 const retry=dialog.querySelector('button'),message=dialog.querySelector('p'),waiters=new Set();let holds=0,queued=false,observed='';
 retry.onclick=()=>{for(const done of waiters)done();waiters.clear();retry.hidden=true;message.textContent='画面の準備ができるまでお待ちください。';};
 const prepare=async(elements,options)=>{if(!elements.length)return;holds++;if(!dialog.open)dialog.showModal();try{for(;;){try{await Promise.all(elements.map(el=>el.tagName==='VIDEO'?videoReady(el,options):imageReady(el)));break;}catch(error){console.warn('Screen asset readiness:',error);message.textContent='素材を読み込めませんでした。通信を確認して再試行してください。';retry.hidden=false;await new Promise(resolve=>waiters.add(resolve));for(const el of elements){if(el.tagName==='VIDEO'&&el.error)el.load();else if(el.tagName==='IMG'&&el.complete&&!el.naturalWidth)el.src=el.src;}}}await new Promise(resolve=>requestAnimationFrame(resolve));}finally{if(--holds===0&&dialog.open)dialog.close();}};
 const scan=()=>{queued=false;const elements=[...doc.querySelectorAll('img,video')].filter(el=>!el.closest('[hidden]')&&el.getClientRects().length&&(el.tagName==='IMG'?(!el.complete||!el.naturalWidth):Boolean(el.currentSrc||el.getAttribute('src'))&&el.readyState<2));const signature=elements.map(el=>el.tagName+':'+el.src).sort().join('|');if(!signature){observed='';return;}if(signature===observed)return;observed=signature;void prepare(elements).then(()=>{observed='';schedule();});};
 const schedule=()=>{if(!queued){queued=true;queueMicrotask(scan);}};
 const observer=new MutationObserver(records=>{if(records.some(record=>record.target!==dialog&&!dialog.contains(record.target)))schedule();});observer.observe(doc.body,{subtree:true,childList:true,attributes:true,attributeFilter:['src','hidden','open']});doc.addEventListener('loadeddata',schedule,true);activeGuard={prepare,get loading(){return holds>0;},disconnect:()=>observer.disconnect()};schedule();return activeGuard;
}

export async function screenFontsReady(fonts){await withAssetDeadline(fonts.ready);return true;}
