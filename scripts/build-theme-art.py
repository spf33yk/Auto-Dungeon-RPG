"""Re-export image_gen icon atlases without stretching. Raw PNGs are local-only."""
import argparse,json,hashlib
from pathlib import Path
from PIL import Image
p=argparse.ArgumentParser();p.add_argument('--sources',type=Path,required=True);p.add_argument('--out',type=Path,default=Path('art/ui/build-themes-v2'));a=p.parse_args()
spec=json.loads((a.out/'format.json').read_text(encoding='utf-8'));cache={};report=[]
for source in spec['sources']:
 file=a.sources/source['source']
 if hashlib.sha256(file.read_bytes()).hexdigest()!=source['sha256']:raise ValueError('Source hash mismatch: '+file.name)
 cache[source['source']]=Image.open(file).convert('RGBA')
for item in spec['icons']:
 im=cache[item['source']].crop(item['sourceBox']);box=im.getchannel('A').point(lambda x:255 if x>24 else 0).getbbox()
 if not box:raise ValueError('Empty icon: '+item['id'])
 im=im.crop(box);im.thumbnail((int(item['width']*.88),int(item['height']*.88)),Image.Resampling.LANCZOS)
 canvas=Image.new('RGBA',(item['width'],item['height']));canvas.alpha_composite(im,((canvas.width-im.width)//2,(canvas.height-im.height)//2));target=a.out/item['file'];canvas.save(target,'WEBP',quality=88,method=6)
 alpha=canvas.getchannel('A');assert all(alpha.getpixel(pt)==0 for pt in [(0,0),(0,canvas.height-1),(canvas.width-1,0),(canvas.width-1,canvas.height-1)])
 report.append({'id':item['id'],'bytes':target.stat().st_size,'cornersTransparent':True,'nonempty':True})
(a.out/'qa.json').write_text(json.dumps({'art_source':'host_image','route':'image_gen','warnings':[],'icons':report,'totalBytes':sum(r['bytes'] for r in report)},indent=2),encoding='utf-8')
print('Exported '+str(len(report))+' icons, '+str(sum(r['bytes'] for r in report))+' bytes')
