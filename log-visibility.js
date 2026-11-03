export const LOG_VISIBLE_MS=5000;
export function createLogVisibility({show,hide,schedule=setTimeout,cancel=clearTimeout}){
 let active=false,last=null,timer=null,generation=0,held=false;
 const reveal=()=>{generation++;if(timer!==null)cancel(timer);timer=null;show();if(!active||held)return;const current=generation;timer=schedule(()=>{if(active&&!held&&generation===current){timer=null;hide();}},LOG_VISIBLE_MS);};
 return {
  sync(overlay,signature){if(!overlay){active=false;last=signature;reveal();return;}if(active&&last===signature)return;active=true;last=signature;reveal();},
  setHeld(value){if(held===Boolean(value))return;held=Boolean(value);reveal();}
 };
}
