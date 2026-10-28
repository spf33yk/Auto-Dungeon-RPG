import {readFileSync} from 'node:fs';import {inflateSync} from 'node:zlib';
// Test-only PNG reader: 8-bit RGB/RGBA and indexed 1/2/4/8-bit, all standard filters.
export function readPng(path){const b=readFileSync(path),parts=[];let width,height,depth,type,palette,alpha;
 for(let p=8;p<b.length;){const length=b.readUInt32BE(p),name=b.toString('ascii',p+4,p+8),data=b.subarray(p+8,p+8+length);if(name==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);depth=data[8];type=data[9];if(data[12])throw Error('Interlaced test PNG not supported');}if(name==='PLTE')palette=data;if(name==='tRNS')alpha=data;if(name==='IDAT')parts.push(data);p+=12+length;}
 const channels=type===6?4:type===2?3:type===3?1:0;if(!channels||type!==3&&depth!==8)throw Error('Unsupported PNG');
 const stride=Math.ceil(width*channels*depth/8),bpp=Math.max(1,Math.ceil(channels*depth/8)),raw=inflateSync(Buffer.concat(parts)),rows=Buffer.alloc(stride*height),rgba=Buffer.alloc(width*height*4);let pos=0;
 const paeth=(a,b,c)=>{const p=a+b-c,da=Math.abs(p-a),db=Math.abs(p-b),dc=Math.abs(p-c);return da<=db&&da<=dc?a:db<=dc?b:c;};
 for(let y=0;y<height;y++){const filter=raw[pos++];for(let x=0;x<stride;x++){const a=x>=bpp?rows[y*stride+x-bpp]:0,up=y?rows[(y-1)*stride+x]:0,ul=y&&x>=bpp?rows[(y-1)*stride+x-bpp]:0;rows[y*stride+x]=(raw[pos++]+[0,a,up,Math.floor((a+up)/2),paeth(a,up,ul)][filter])&255;}
  for(let x=0;x<width;x++){const i=(y*width+x)*4;if(type===3){const bit=x*depth,index=(rows[y*stride+Math.floor(bit/8)]>>(8-depth-bit%8))&((1<<depth)-1);for(let c=0;c<3;c++)rgba[i+c]=palette[index*3+c];rgba[i+3]=alpha?.[index]??255;}else{for(let c=0;c<3;c++)rgba[i+c]=rows[y*stride+x*channels+c];rgba[i+3]=channels===4?rows[y*stride+x*4+3]:255;}}
 }
 return {width,height,pixel:(x,y)=>[...rgba.subarray((y*width+x)*4,(y*width+x)*4+4)]};
}
