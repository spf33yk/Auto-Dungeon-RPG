export const ENDING_STEP_MS=3200;
export const NORMAL_END_LINES=['「魔物か」','若者は剣を振るい、骸を打ち倒した。','伝えようとした声は、届かなかった。','闇の中で、失われた記憶が戻り始める。','かつて、自分は勇者だった。','そして――息子を残して帰れなかった、父親だった。'];
const laterLines=['「魔物か」','伸ばした手は、また届かなかった。','骸は、息子の剣に倒れた。','再び、闇に沈んでいく。','それでも、会いたい。','今度こそ、あの手紙を届けよう。'];
export function normalEndingFrame(elapsed,normalClears=1){const lines=normalClears>1?laterLines:NORMAL_END_LINES,index=Math.floor(Math.max(0,elapsed)/ENDING_STEP_MS);return {index,text:lines[index]||'',memory:index>=3,done:index>=lines.length};}
