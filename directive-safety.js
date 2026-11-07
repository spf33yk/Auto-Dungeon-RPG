// Provisional anti-stall tuning. Saved counters also drive the forecast copy.
export const DIRECTIVE_LIMITS=Object.freeze({wait:8,waitCooldown:20,idle:10,recovery:20,floor:1000});
export const newDirectiveSafety=()=>({idleTurns:0,waitStreak:0,waitUntil:0,bypassUntil:0,timeoutNotified:false,recentTiles:[]});
export function validDirectiveSafety(s){const d=s.directiveSafety;if(d===undefined)return true;return d&&typeof d==='object'&&!Array.isArray(d)&&['idleTurns','waitStreak','waitUntil','bypassUntil'].every(k=>Number.isSafeInteger(d[k])&&d[k]>=0&&d[k]<=Number.MAX_SAFE_INTEGER)&&d.idleTurns<=DIRECTIVE_LIMITS.idle&&d.waitStreak<=DIRECTIVE_LIMITS.wait&&typeof d.timeoutNotified==='boolean'&&(d.recentTiles===undefined||Array.isArray(d.recentTiles)&&d.recentTiles.length<=DIRECTIVE_LIMITS.idle*2&&d.recentTiles.every(i=>Number.isInteger(i)&&i>=0&&i<(s.grid?.length||0)*(s.grid?.[0]?.length||0)));}
export const bypassDirectives=s=>s.steps>=DIRECTIVE_LIMITS.floor||s.steps<(s.directiveSafety?.bypassUntil||0);
export function progressSnapshot(s){return {visited:s.visited.flat().filter(Boolean).length,seen:s.seen.flat().filter(Boolean).length,items:[...s.items],foes:s.enemies.map(e=>[e,e.hp]),used:s.themeState?.used?.length||0};}
export function updateDirectiveSafety(s,before,waited,log){const d=s.directiveSafety??=newDirectiveSafety();
 if(waited){d.waitStreak++;if(d.waitStreak>=DIRECTIVE_LIMITS.wait){d.waitStreak=0;d.waitUntil=s.steps+DIRECTIVE_LIMITS.waitCooldown+1;log(s,`待機が${DIRECTIVE_LIMITS.wait}ターン続いたため、${DIRECTIVE_LIMITS.waitCooldown}ターンは待機指示を飛ばします。`,'story');}}else d.waitStreak=0;
 const tile=s.player.y*s.grid[0].length+s.player.x;d.recentTiles??=[];const movingForward=!d.recentTiles.includes(tile);d.recentTiles.push(tile);if(d.recentTiles.length>DIRECTIVE_LIMITS.idle*2)d.recentTiles.shift();
 const progress=movingForward||s.visited.flat().filter(Boolean).length>before.visited||s.seen.flat().filter(Boolean).length>before.seen||before.items.some(i=>!s.items.includes(i))||before.foes.some(([e,hp])=>e.hp<hp||!s.enemies.includes(e))||(s.themeState?.used?.length||0)>before.used;
 if(progress)d.idleTurns=0;else if(!bypassDirectives(s))d.idleTurns++;
 if(d.idleTurns>=DIRECTIVE_LIMITS.idle){d.idleTurns=0;d.bypassUntil=s.steps+DIRECTIVE_LIMITS.recovery+1;log(s,`${DIRECTIVE_LIMITS.idle}ターン進展がないため、${DIRECTIVE_LIMITS.recovery}ターンは指示より基本行動を優先します。`,'story');}
}
export function beginDirectiveSafety(s,log){const d=s.directiveSafety??=newDirectiveSafety();if(!d.recentTiles?.length)d.recentTiles=[s.player.y*s.grid[0].length+s.player.x];if(s.steps>=DIRECTIVE_LIMITS.floor&&!d.timeoutNotified){d.timeoutNotified=true;log(s,`この階で${DIRECTIVE_LIMITS.floor}ターン経過。以後は指示より階段への進行を優先します。ボスがいれば通常戦闘を続けます。`,'story');}}
