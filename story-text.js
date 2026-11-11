// Story fragments are indexed by the cleared floor, not by display basement number.
const first={6:'小さな手の温もり。誰かの笑い声が、遠くに聞こえた気がした。',12:'陽だまりの中で、誰かと過ごしたような……懐かしい気持ちが残った。',18:'剣を握る手。遠い旅路の風景が、一瞬だけ浮かんでは消えた。',24:'暗い影と、倒れた身体。何かを失った気がして、胸が痛んだ。'};
const later={6:'あの小さな手を、もう一度握れるだろうか。',12:'もっと一緒に過ごしたかった。どんな顔だったか、まだ思い出せない。',18:'帰るつもりで旅立った。だが、あの戦いから帰れなかった。',24:'顔も声も、少しずつ戻ってきた。もう一度会えるだろうか。'};
const old={6:'かつて、この手は誰かを守るために剣を握っていた。',12:'「父さん、帰ってくるよね」――小さな手の温もりが蘇る。',18:'魔王は告げた。「息子の命が惜しければ、記憶を捨てろ」',24:'忘れていた名前よりも先に、帰る理由を思い出した。'};
export const storyFragment=(floor,normalClears=0)=>(normalClears>0?later:first)[floor];
export function displayStoryText(text,normalClears=0){
 for(const [floor,legacy] of Object.entries(old))if(text===legacy)return storyFragment(Number(floor),normalClears);
 const legacyLogs={'地上1F。息子は剣を抜いた。「父の仇……魔物め」':'地上で、若者が剣を抜いた。「魔物か」','届かなかった声。砕けた骸は、再び深淵へ沈む。':'骸は言葉を伝えられないまま、若者の剣に倒れた。','息子への手紙を入手した。TRUEルートの物語は今後追加。':'古びた手紙を手に取った。今度こそ、届けよう。','骨が崩れた。記憶を失い、再び最深部へ。':'骨が崩れた。再び最深部へ。'};
 text=legacyLogs[text]||text;
 const replacements=[['忘却の地下墓地','忘れられた地下墓所'],['苔むす水路','苔むした水路'],['灼熱の炉跡','燃え盛る炉跡'],['凍りついた聖堂','凍てついた聖堂'],['毒霧の庭園','毒の庭園'],['黎明への門','暁への門'],['階段の先で、誰かが剣を握っている。伝えたい想いがあるなら、その証を忘れずに。','階段の先から、かすかな風が吹いてくる。'],['骨は砕けても、旅の記録は残る。B30で装備と2枠の指示を確認しよう。','骨は砕けても、旅の記録は残る。再びB30から歩き始めよう。']];
 for(const [from,to] of replacements)text=text.replaceAll(from,to);
 return text.replaceAll('手紙','遺書').replace(/記憶のかけら|かけら|(?<!記憶の)欠片/g,'記憶の欠片').replace(/(?:記憶の欠片\s*)?(\d+)\s*pt\b/g,'記憶の欠片 $1個');
}
export const openingThought=normalClears=>normalClears>0?'この箱を、前にも見た気がする。今度は開けられる。':'名前も、顔も、思い出せない。それでも、上へ行かなければ。';
export const letterFloorThought=normalClears=>normalClears>0?'あの箱に残した遺書を、持っていこう。':'何か大事なものを忘れている気がする';

export const WILL_PICKUP_LINE='箱の底に、帰れなかったときのために書いた遺書があった。骸はそれを懐にしまった。';
export const WILL_UNLOCK_LINE='次の旅でB30の遺書の宝箱が開き、固定探索指示「自分は宝箱を取得する」が追加されます。';
export const fixedChestUnlocked = state => state.profile?.normalClears > 0;

const bossMemories = {
  11: [
    '門番が倒れると、握ってもいない剣の重さが手に戻った。この構えを、身体が覚えている。',
    '門番が倒れる音に、同じ廊下、同じ傷、同じ目覚めが重なった。この旅を、もう何度も繰り返している。',
  ],
  21: [
    '誰かをかばって剣を構えた背中が浮かぶ。自分を呼ぶ声が聞こえたが、その名前は思い出せない。',
    '陽だまりで、小さな手が自分の指を握った。「父さん」と笑う声。そうだ、私には息子がいた。',
  ],
  30: [
    '門番の先に光が見えた。光へ向かって剣を掲げたことがある。だが、その先の記憶は途切れている。',
    '指先から、骨の粉がこぼれた。次も目覚められるとは限らない。今度こそ、地上へ。',
  ],
};

export const bossMemory = (floor, normalClears = 0) => bossMemories[floor]?.[normalClears > 0 ? 1 : 0];
