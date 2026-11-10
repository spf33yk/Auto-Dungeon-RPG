from pathlib import Path
from PIL import Image
import json,hashlib,shutil
P=Path(__file__).resolve().parent.parent
A=P/'art/characters/mukuro-minimal64-v1/source'
R=P/'art/characters/mukuro-minimal64-v1';R.mkdir(parents=True,exist_ok=True)
approved=json.loads((A/'manifest.json').read_text(encoding='utf-8'))
for e in approved['files']:
 assert hashlib.sha256((A/e['file']).read_bytes()).hexdigest()==e['sha256'],e['file']
shutil.copy2(A/'poses-64px.png',R/'sprites.png')
raw=Image.open(A/'slash-source.png').convert('RGBA')
raw.putalpha(raw.getchannel('A').point(lambda a:255 if a>=128 else 0))
crops=[]
for i in range(3):
 im=raw.crop((round(i*raw.width/3),0,round((i+1)*raw.width/3),raw.height));crops.append(im.crop(im.getbbox()))
scale=min(44/max(i.height for i in crops),56/max(i.width for i in crops))
atlas=Image.new('RGBA',(192,256))
for row,angle in enumerate([270,180,0,90]):
 for col,c in enumerate(crops):
  im=c.resize((max(1,round(c.width*scale)),max(1,round(c.height*scale))),Image.Resampling.LANCZOS)
  im.putalpha(im.getchannel('A').point(lambda a:255 if a>=128 else 0))
  im=im.rotate(angle,expand=True)
  assert im.width<=64 and im.height<=64
  atlas.alpha_composite(im,(col*64+(64-im.width)//2,row*64+(64-im.height)//2))
atlas.save(R/'slash.png')
version=lambda n:hashlib.sha256((R/n).read_bytes()).hexdigest()[:12]
d={'format':'character-minimal-4dir','version':1,'id':'mukuro-minimal64-v1','image':'sprites.png?v='+version('sprites.png'),'tileSize':128,'columns':3,'rows':4,'width':384,'height':512,'directions':['south','west','east','north'],'anchor':[64,96],'displayScale':1.71875,'portrait':[16,8,96,96],'animation':{'idleStepMs':200,'moveStepMs':100,'attackMs':300,'deathMs':780,'lungePx':16},'effect':{'image':'slash.png?v='+version('slash.png'),'tileSize':64,'columns':3,'rows':4,'width':192,'height':256,'anchor':[32,32],'forwardPx':34,'heightPx':32}}
(R/'sprites.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
pose_hashes={f'{direction}-{pose}':hashlib.sha256(Image.open(A/f'{direction}-{pose}.png').convert('RGBA').tobytes()).hexdigest() for direction in ['down','left','right','up'] for pose in ['stand','bob1','bob2']}
(R/'APPROVED_SOURCE.json').write_text(json.dumps({'approved_source':str(A.relative_to(P)).replace('\\','/'),'sprites_sha256':hashlib.sha256((R/'sprites.png').read_bytes()).hexdigest(),'approved_sprites_sha256':next(e['sha256'] for e in approved['files'] if e['file']=='poses-64px.png'),'pose_rgba_sha256':pose_hashes,'character_pixels_modified':False,'effect_source':'art/characters/mukuro-minimal64-v1/source/slash-source.png'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(R/'README.md').write_text('完成扱いのapproved-v1から本編へ登録した4方向・3姿勢の素材。sprites.pngは承認PNGと完全一致。身体64px、セル128px、原点[64,96]。表示倍率1.71875で従来の可視高約55pxへ合わせる。正面・左・右・背面を個別に描画し反転しない。列は立ち・1px屈伸・2px屈伸。斬撃だけ承認された別素材から64pxセル3列4行へ書き出す。実装仕様と検証はSPEC.md・IMPLEMENTATION_NOTES.mdを参照。\n',encoding='utf-8')
print('Exported approved character pixels unchanged and12 transparent slash frames.')
