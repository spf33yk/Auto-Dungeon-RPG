"""Build native 64 px map atlases from approved 64 px art and generated details."""
from pathlib import Path
import json
import hashlib
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'art'

def keyed(piece):
    a=np.array(piece.convert('RGBA'))
    magenta=(a[:,:,0]>170)&(a[:,:,2]>170)&(a[:,:,1]<110)
    a[magenta]=0
    a[:,:,3]=np.where(a[:,:,3]>=128,255,0)
    a[a[:,:,3]==0,:3]=0
    return Image.fromarray(a,'RGBA')

def fit(piece,size=64,body=56,bottom=60):
    piece=keyed(piece)
    bbox=piece.getchannel('A').getbbox()
    if not bbox: raise ValueError('empty source cell')
    piece=piece.crop(bbox)
    factor=min(size/piece.width,body/piece.height)
    w,h=max(1,round(piece.width*factor)),max(1,round(piece.height*factor))
    piece=piece.resize((w,h),Image.Resampling.BOX)
    alpha=piece.getchannel('A').point(lambda value:255 if value>=128 else 0)
    piece.putalpha(alpha)
    result=Image.new('RGBA',(64,64))
    result.alpha_composite(piece,((64-w)//2,bottom-h))
    return result

sample=ART/'scale64-sample'
side_stairs=Image.open(sample/'stairs-side-generated.png').convert('RGBA')
side_stairs=fit(side_stairs,size=58,body=32,bottom=60)
side_stairs.save(sample/'stairs-side-64.png')
floor=Image.open(sample/'floor-64.png').convert('RGB')
floor=floor.resize((64,64),Image.Resampling.BOX)
variant=floor.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
common_lr=np.mean([np.asarray(floor)[:,0],np.asarray(floor)[:,-1],np.asarray(variant)[:,0],np.asarray(variant)[:,-1]],axis=0).astype('uint8')
common_tb=np.mean([np.asarray(floor)[0],np.asarray(floor)[-1],np.asarray(variant)[0],np.asarray(variant)[-1]],axis=0).astype('uint8')
floors=[]
for tile in (floor,variant):
    a=np.array(tile)
    a[:,0]=a[:,-1]=common_lr
    a[0]=a[-1]=common_tb
    a[0,0]=a[0,-1]=a[-1,0]=a[-1,-1]=common_lr[0]
    floors.append(Image.fromarray(a,'RGB'))
terrain=Image.new('RGB',(128,128),(24,24,20))
terrain.paste(floors[0],(0,0));terrain.paste(floors[1],(64,0))
terrain.paste(floors[1],(0,64));terrain.paste(floors[0],(64,64))
terrain.save(ART/'terrain/crypt/atlas-64.png')
zone_colors=['#293a32','#234247','#40382d','#482f2b','#304352','#3d3245','#34442d','#364049','#34334e','#484638']
zone_atlas=Image.new('RGB',(128,128*len(zone_colors)))
base=np.asarray(terrain).astype(float)
for index,hex_color in enumerate(zone_colors):
    color=np.array([int(hex_color[i:i+2],16) for i in (1,3,5)],dtype=float)
    luminance=np.mean(base,axis=2,keepdims=True)
    detail=(base-np.mean(base,axis=2,keepdims=True))*.35
    tinted=np.clip(color[None,None,:]*(.45+luminance/90)+detail,0,255).astype('uint8')
    zone_atlas.paste(Image.fromarray(tinted,'RGB'),(0,index*128))
zone_atlas.save(ART/'terrain/crypt/atlas-zones-64.png')

master=Image.open(ART/'props/master-64.png').convert('RGBA')
if master.size!=(192,128): raise ValueError('expected 3x2 64px prop master')
props=Image.new('RGBA',(192,128))
prop_heights=[[34,32,32],[36,43,43]]
for row in range(2):
 for col in range(3):
  piece=master.crop((col*64,row*64,(col+1)*64,(row+1)*64))
  if row==0 and col==0:piece=Image.open(sample/'chest-64.png').convert('RGBA')
  if row==0 and col==1:piece=side_stairs
  props.alpha_composite(fit(piece,size=58,body=prop_heights[row][col]),(col*64,row*64))
props.save(ART/'props/atlas-64.png')

source=Image.open(ART/'props/map-items-generated-64.png').convert('RGBA')
items=Image.new('RGBA',(192,128))
item_heights=[[26,25,25],[26,28,32]]
for row in range(2):
    for col in range(3):
        cell=source.crop((col*source.width//3,row*source.height//2,(col+1)*source.width//3,(row+1)*source.height//2))
        if row==1 and col==2: cell=side_stairs
        items.alpha_composite(fit(cell,size=58,body=item_heights[row][col]), (col*64,row*64))
items.save(ART/'props/map-items-64.png')

source=Image.open(ART/'enemies/generated-64.png').convert('RGBA')
enemies=Image.new('RGBA',(128,64))
for col in range(2):
    cell=source.crop((col*source.width//2,0,(col+1)*source.width//2,source.height))
    enemies.alpha_composite(fit(cell,size=58,body=32 if col==0 else 48), (col*64,0))
enemies.save(ART/'enemies/atlas-64.png')

old=Image.open(ART/'terrain/walls/crypt/autotile-32.png').convert('RGBA').resize((256,560),Image.Resampling.NEAREST)
wall=np.array(old).copy()
texture=np.array(Image.open(sample/'wall-64.png').convert('RGB'))
for y in range(560):
    local_y=y%112
    for x in range(256):
        local_x=x%64
        if wall[y,x,3]==0 or local_x<8 or local_x>=56 or local_y<8 or 56<=local_y<72 or local_y>=104: continue
        tone=float(np.mean(texture[local_y%64,local_x]))
        factor=max(1.0,min(1.18,tone/105))
        wall[y,x,:3]=np.clip(wall[y,x,:3].astype(float)*factor,0,255).astype('uint8')
Image.fromarray(wall,'RGBA').save(ART/'terrain/walls/crypt/autotile-64.png')

dpath=ART/'terrain/walls/crypt/tileset.json'
d=json.loads(dpath.read_text(encoding='utf-8'))
wall_path=ART/'terrain/walls/crypt/autotile-64.png'
d['image']='autotile-64.png?v='+hashlib.sha256(wall_path.read_bytes()).hexdigest()[:12]
d['tileSize']=64;d['width']=256;d['height']=560
d['material']['capPixels']=64;d['material']['facePixels']=48
if d['tiles']['0'][0][2]==32:
    for group in ('tiles','entrances'):
        for frames in d[group].values():
            for frame in frames:
                frame[:]=[value*2 for value in frame]
dpath.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('built terrain, props, map items, enemies and wall atlases at 64px')
