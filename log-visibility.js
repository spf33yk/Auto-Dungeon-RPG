export const LOG_VISIBLE_MS=3000;

// Only a changed log or a transition into the field starts a fresh timeout.
export function createLogVisibility({show,hide,schedule=setTimeout,cancel=clearTimeout}){
 let active=false,last=null,timer=null,generation=0;
 return {
  sync(overlay,signature){
   if(!overlay){active=false;last=signature;generation++;if(timer!==null)cancel(timer);timer=null;show();return;}
   if(active&&last===signature)return;
   active=true;last=signature;generation++;if(timer!==null)cancel(timer);show();
   const current=generation;
   timer=schedule(()=>{if(active&&generation===current){timer=null;hide();}},LOG_VISIBLE_MS);
  }
 };
}
