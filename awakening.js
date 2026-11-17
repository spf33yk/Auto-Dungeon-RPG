import {openingThought} from './story-text.js';
export function awakeningLines(normalClears=0,shortJourney=true){return normalClears>0?['また、闇の中で目が覚めた。','大切な何かを思い出した気がする。けれど、顔も声も遠い。',openingThought(normalClears),...(shortJourney?['前の旅のカードを引き継ぎました。装備・オーグメント・拡張機能は初期状態に戻ります。','この旅では、ボスが固有スキルを使います。次の階の情報で効果を確認できます。']:[])]:['目が覚めると、そこには骨だけの手があった。','名前も、顔も、思い出せない。','それでも、上へ行かなければ。'];}
