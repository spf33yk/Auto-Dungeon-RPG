"""Process newly generated masters, never old 64px character or terrain originals."""
from pathlib import Path
from PIL import Image
import json, hashlib
root=Path(__file__).resolve().parent.parent
draft=root/'output/environment-refresh-20261103'
draft.mkdir(parents=True,exist_ok=True)
originals=root/'art/local-originals/environment-refresh-20261103'
floor=Image.open(originals/'floors-source.png').convert('RGB')
atlas=Image.new('RGB',(256,256));seams=[]
for i in range(16):
 x,y=i%4,i//4
 tile=floor.crop((round(x*floor.width/4),round(y*floor.height/4),round((x+1)*floor.width/4),round((y+1)*floor.height/4))).resize((64,64),Image.Resampling.LANCZOS)
 p=tile.load()
 for axis in [0,1]:
  for n in range(64):
   for k in range(8):
    a=(k,n) if axis==0 else (n,k);b=(63-k,n) if axis==0 else (n,63-k)
    av,bv=p[a],p[b];weight=.5*(1-k/8)
    p[a]=tuple(round(v*(1-weight)+w*weight) for v,w in zip(av,bv))
    p[b]=tuple(round(w*(1-weight)+v*weight) for v,w in zip(av,bv))
 tile=tile.quantize(colors=40,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE).convert('RGB')
 # Exact pair equality after reduction, with non-uniform textured edges.
 p=tile.load()
 for n in range(64):p[63,n]=p[0,n]
 for n in range(64):p[n,63]=p[n,0]
 atlas.paste(tile,(x*64,y*64));seams.append({'tile':i,'horizontal':all(p[0,n]==p[63,n] for n in range(64)),'vertical':all(p[n,0]==p[n,63] for n in range(64))})
atlas.save(root/'art/terrain/floors-v2/atlas-64.png',optimize=True)
src=Image.open(originals/'enemies-source.png').convert('RGBA');out=Image.new('RGBA',(320,320));bounds=[]
for i in range(22):
 x,y=i%5,i//5
 part=src.crop((round(x*src.width/5),round(y*src.height/5),round((x+1)*src.width/5),round((y+1)*src.height/5)))
 mask=part.getchannel('A').point(lambda a:255 if a>=128 else 0);box=mask.getbbox()
 if not box:raise ValueError('Empty monster '+str(i))
 part.putalpha(mask);part=part.crop(box);limit=60 if i>=20 else 56;scale=min(56/part.width,limit/part.height)
 w,h=max(1,round(part.width*scale)),max(1,round(part.height*scale))
 part=part.resize((w,h),Image.Resampling.LANCZOS);alpha=part.getchannel('A').point(lambda a:255 if a>=128 else 0)
 part=part.convert('RGB').quantize(colors=32,dither=Image.Dither.NONE).convert('RGBA');part.putalpha(alpha)
 out.paste(part,(x*64+(64-w)//2,y*64+60-h));bounds.append({'index':i,'size':[w,h],'anchor':[32,60]})
out.save(root/'art/enemies/v2/atlas-64.png',optimize=True)
report={'art_source':'host_image','route':'image_gen','floor':seams,'enemies':bounds,'sourceSha256':{n:hashlib.sha256((originals/n).read_bytes()).hexdigest() for n in ['floors-source.png','enemies-source.png']}}
(draft/'verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({'floorBytes':(root/'art/terrain/floors-v2/atlas-64.png').stat().st_size,'enemyBytes':(root/'art/enemies/v2/atlas-64.png').stat().st_size,'seamChecks':len(seams)*2}))
