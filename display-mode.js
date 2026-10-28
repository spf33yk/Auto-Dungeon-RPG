// Request from the original tap/click: fullscreen requires user activation.
export const SCENE_WIDTH=1280,SCENE_HEIGHT=720;
export function sceneLayout(width,height,mobile=false){const w=Math.max(1,Number(width)||1),h=Math.max(1,Number(height)||1);return {width:SCENE_WIDTH,height:SCENE_HEIGHT,scale:Math.min(w/SCENE_WIDTH,h/SCENE_HEIGHT),portrait:mobile&&h>w};}
export async function requestLandscapeDisplay(element,orientation){
 if(typeof element?.requestFullscreen!=='function')return {fullscreen:false,landscape:false};
 try{await element.requestFullscreen({navigationUI:'hide'});}catch{return {fullscreen:false,landscape:false};}
 let landscape=false;
 if(typeof orientation?.lock==='function')try{await orientation.lock('landscape');landscape=true;}catch{}
 return {fullscreen:true,landscape};
}
