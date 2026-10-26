// Request from the original tap/click: fullscreen requires user activation.
export async function requestLandscapeDisplay(element,orientation){
 if(typeof element?.requestFullscreen!=='function')return {fullscreen:false,landscape:false};
 try{await element.requestFullscreen({navigationUI:'hide'});}catch{return {fullscreen:false,landscape:false};}
 let landscape=false;
 if(typeof orientation?.lock==='function')try{await orientation.lock('landscape');landscape=true;}catch{}
 return {fullscreen:true,landscape};
}
