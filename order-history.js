// Session-only preparation history; purchases and currency never roll back.
export function createOrderHistory(){
 let key='',entries=[],index=-1;
 const snapshot=s=>JSON.stringify({orders:s.orders,fixedOrderExpanded:s.fixedOrderExpanded||[]});
 return {observe(s){const next=[s.seed,s.profile?.runs,s.floor].join(':');if(next!==key){key=next;entries=[];index=-1;}const value=snapshot(s);if(entries[index]!==value){entries=entries.slice(0,index+1);entries.push(value);if(entries.length>100)entries.shift();index=entries.length-1;}},get back(){return index>0;},get forward(){return index<entries.length-1;},move(s,direction){const next=index+(direction==='back'?-1:1);if(s.phase!=='prepare'||next<0||next>=entries.length)return false;index=next;Object.assign(s,JSON.parse(entries[index]));return true;}};
}
