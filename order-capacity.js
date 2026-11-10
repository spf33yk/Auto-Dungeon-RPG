export const activeOrderCount=orders=>orders.filter(row=>row?.disabled!==true).length;
