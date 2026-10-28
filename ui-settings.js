export const MINIMAP_SIZES=['small','medium','large'];
export function readUiSettings(storage){try{const input=JSON.parse(storage.getItem('abyss-ui-settings')||'{}');return {minimap:MINIMAP_SIZES.includes(input.minimap)?input.minimap:'medium'};}catch{return {minimap:'medium'};}}
export function saveUiSettings(storage,value){const settings={minimap:MINIMAP_SIZES.includes(value.minimap)?value.minimap:'medium'};try{storage.setItem('abyss-ui-settings',JSON.stringify(settings));}catch{}return settings;}
