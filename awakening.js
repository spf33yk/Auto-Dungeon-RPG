import {openingThought} from './story-text.js';
export function awakeningLines(normalClears=0){return normalClears>0?['また、闇の中で目が覚めた。','今度は、帰りたい理由を覚えている。',openingThought(normalClears)]:['目が覚めると、そこには骨だけの手があった。','名前も、顔も、思い出せない。','それでも、上へ行かなければ。'];}
