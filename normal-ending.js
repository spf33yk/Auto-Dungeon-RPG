export const NORMAL_END_LINES=['「魔物か」','若者の剣が、骸を打ち倒した。','声にならない想いは、届かなかった。','闇の中で、失われた記憶が戻り始める。','自分は、かつて魔王討伐に挑んだ勇者だった。','そして、息子を残して帰れなかった父親だった。'];
const laterLines=['「魔物か」','伸ばした手は、また届かなかった。','骸は、息子の剣に倒れた。','再び、闇に沈んでいく。','それでも、会いたい。','今度こそ、あの手紙を届けよう。'];
export const normalEndingLines=normalClears=>normalClears>1?laterLines:NORMAL_END_LINES;
