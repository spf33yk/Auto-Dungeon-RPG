export const SUBTITLE_CHAR_MS=45;
const segments=text=>typeof Intl.Segmenter==='function'?[...new Intl.Segmenter('ja',{granularity:'grapheme'}).segment(text)].map(s=>s.segment):Array.from(text);
export class SubtitlePlayer{
 constructor(lines,{charMs=SUBTITLE_CHAR_MS}={}){this.lines=lines.map(segments);this.index=0;this.elapsed=0;this.charMs=charMs;this.complete=false;}
 get done(){return this.index>=this.lines.length;}
 get full(){return this.done||this.complete||Math.floor(this.elapsed/this.charMs)>=this.lines[this.index].length;}
 get text(){return this.done?'':this.lines[this.index].slice(0,this.full?Infinity:Math.floor(this.elapsed/this.charMs)).join('');}
 update(ms){if(!this.done)this.elapsed+=Math.max(0,ms);}
 advance(){if(this.done)return;if(!this.full){this.complete=true;return;}this.index++;this.elapsed=0;this.complete=false;}
 finish(){this.index=this.lines.length;}
}
