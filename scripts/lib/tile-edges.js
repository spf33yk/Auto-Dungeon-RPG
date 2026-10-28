// One shared periodic edge per family; no solid border or blended edge band.
export function stitchTileEdges(input,width,tile,channels){
 const out=Buffer.from(input),copy=(dx,dy,sx,sy)=>{for(let c=0;c<channels;c++)out[(dy*width+dx)*channels+c]=input[(sy*width+sx)*channels+c];};
 for(let row=0;row<2;row++)for(let variant=0;variant<2;variant++){
  const x0=variant*tile,y0=row*tile;
  for(let n=0;n<tile;n++){copy(x0,y0+n,0,y0+n);copy(x0+tile-1,y0+n,0,y0+n);copy(x0+n,y0,n,y0);copy(x0+n,y0+tile-1,n,y0);}
  for(const x of [x0,x0+tile-1])for(const y of [y0,y0+tile-1])copy(x,y,0,y0);
 }
 return out;
}
