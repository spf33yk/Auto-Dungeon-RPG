export const NORMAL_END_LINES=[
  '「魔物か」',
  '地上に出た骸を、冒険者の剣が打ち倒した。その面影に、見覚えがあった。',
  '声にならない言葉を残して、骸は動かなくなった。',
  '闇の中で思い出す。自分は勇者だった。魔王に敗れ、記憶を奪われ、骸骨に変えられた。',
  '帰れなかったときのため、遺書を箱に残していた。',
  'あの冒険者は、幼い日に見送ってくれた息子だ。',
];

export const WILL_END_LINES=[
  '階段の先に、朝の光があった。向こうから、あの日の冒険者が歩いてくる。',
  '名前を呼ぼうとした。声の代わりに、肩から小さな骨が落ちた。',
  '遺書を握ったまま、骸は地上で朽ち果てた。',
  '若者は骨の間から遺書を拾い、ゆっくりと開いた。',
  '「帰れなかったら、どうか、自分の道を歩いてほしい。ずっとお前を想っている」',
  '父だったのか、若者には分からなかった。外套で骨を包み、小さな墓を作った。',
];

const missedLines=[
  '「魔物か」',
  '息子の声に振り向いたとき、骸の骨はもう崩れ始めていた。',
  '渡せるものは何もなかった。',
  'また闇に落ちていく。あの箱から、遺書を持ってこなければ。',
];

export function normalEndingLines(normalClears, ending = normalClears > 1 ? 'will' : 'first') {
  if (ending === 'will') return WILL_END_LINES;
  if (ending === 'missed') return missedLines;
  return NORMAL_END_LINES;
}
