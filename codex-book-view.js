import{codexRows}from'./engine.js';
import{monsters,equipment}from'./data.js';
import{cardCodexRows}from'./card-catalog.js';
import{augments}from'./augments.js';
import{buildThemes}from'./build-themes.js';
import{augmentName,augmentStrength}from'./augment-strength.js';
import{augmentCard}from'./augment-view.js';
import{themeIcon,skillTitle}from'./theme-view.js';
import{kindMark}from'./gold-ui.js';
import{enemyFrame}from'./enemy-view.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const CODEX_KINDS={monsters:'モンスター図鑑',equipment:'装備図鑑',cards:'カード図鑑',augments:'オーグメント図鑑'};
export function codexBookRows(state,options={}){
 const kind=options.kind||'monsters';
 if(kind==='cards')return cardCodexRows(state).filter(c=>!options.cardKind||options.cardKind==='all'||c.kind===options.cardKind).map(c=>({...c,known:true}));
 if(kind==='augments')return [...augments].sort((a,b)=>options.augmentOrder==='rarity'?['NORMAL','EPIC','LEGENDARY'].indexOf(a.rarity)-['NORMAL','EPIC','LEGENDARY'].indexOf(b.rarity):buildThemes.findIndex(t=>t.id===a.themeId)-buildThemes.findIndex(t=>t.id===b.themeId)).map(a=>({...a,known:true,owned:state.augments.includes(a.id),discovered:state.profile.augments?.includes(a.id)}));
 const rows=codexRows(state,kind).map((r,i)=>r.known?{...(kind==='monsters'?monsters[i]:equipment[i]),...r}:{known:false,slot:r.slot,unknownIndex:i});
 if(kind!=='equipment')return rows;
 return rows.filter(r=>r.slot===(options.slot||'weapon')).sort((a,b)=>Number(b.known)-Number(a.known)||(a.known&&b.known?(options.sort&&options.sort!=='acquired'?b[options.sort]-a[options.sort]:a.acquiredOrder-b.acquiredOrder):0));
}
export function codexPage(rows,page=0,size=6){const pages=Math.max(1,Math.ceil(rows.length/size)),index=Math.max(0,Math.min(pages-1,Math.floor(Number(page)||0)));return{page:index,pages,rows:rows.slice(index*size,(index+1)*size)};}
const select=(key,label,value,choices)=>'<label>'+label+'<select data-book-filter="'+key+'">'+choices.map(([id,name])=>'<option value="'+id+'"'+(value===id?' selected':'')+'>'+name+'</option>').join('')+'</select></label>';
export function codexBookView(state,options={},art={}){
 const kind=options.kind||'toc';
 if(kind==='toc')return{title:'図鑑の目次',left:'<h2>目 次</h2><nav class="book-toc" aria-label="図鑑の目次">'+Object.entries(CODEX_KINDS).map(([id,name],i)=>'<button type="button" data-book-kind="'+id+'">'+name+'<span>0'+(i+1)+'</span></button>').join('')+'</nav>',right:'<div class="book-intro"><h2>旅の記録</h2><p>見つけた魔物や装備、<br>手にしたカードと記憶を<br>読み返す。</p><p>左の目次から<br>図鑑を選んでください。</p></div>',page:0,selected:0};
 const rows=codexBookRows(state,options),part=codexPage(rows,options.page,options.pageSize||6),selected=Math.max(0,Math.min(part.rows.length-1,Math.floor(Number(options.selected)||0))),row=part.rows[selected];
 let filters='';
 if(kind==='cards')filters=select('cardKind','種類',options.cardKind||'all',[['all','すべて'],['target','ターゲット'],['condition','条件'],['action','アクション'],['skill','スキル']]);
 if(kind==='equipment')filters=select('slot','装備',options.slot||'weapon',[['weapon','武器'],['armor','防具']])+select('sort','順序',options.sort||'acquired',[['acquired','入手順'],['attack','攻撃力順'],['defense','防御力順']]);
 if(kind==='augments')filters=select('augmentOrder','順序',options.augmentOrder||'theme',[['theme','テーマ順'],['rarity','レアリティ順']]);
 const list=part.rows.map((r,i)=>'<button type="button" data-book-entry="'+i+'" aria-pressed="'+(selected===i)+'" class="book-entry'+(selected===i?' selected':'')+'"><span>'+esc(r.known?r.name:'？ 未登録')+'</span><small>'+(r.owned?'所持中':r.discovered?'取得記録あり':selected===i?'選択中':'')+'</small></button>').join('');
 const left='<h2>'+CODEX_KINDS[kind]+'</h2><div class="book-filters">'+filters+'</div><div class="book-list" role="group" aria-label="図鑑の項目">'+(list||'<p>該当する記録はありません。</p>')+'</div><div class="book-pagination"><button type="button" data-book-page="-1" aria-label="前の一覧ページ"'+(part.page===0?' disabled':'')+'>◀</button><span>'+ (part.page+1)+' / '+part.pages+'</span><button type="button" data-book-page="1" aria-label="次の一覧ページ"'+(part.page+1===part.pages?' disabled':'')+'>▶</button></div><button type="button" data-book-toc class="book-return">目次へ戻る</button>';
 let detail='';
 if(!row)detail='<p>左の一覧から項目を選んでください。</p>';
 else if(!row.known)detail='<h2>未登録</h2><p>旅で見つけると、<br>名前と詳しい情報が記録されます。</p>';
 else if(kind==='cards')detail='<div class="book-card codex-card-art" data-card-kind="'+row.kind+'">'+kindMark(row.kind)+'<span class="card-kind-label">'+esc(row.group)+'カード</span><strong class="gold-card-name">'+esc(row.name)+'</strong><small class="gold-card-rarity">'+esc(row.rarity)+'</small></div><h2>'+esc(row.name)+'</h2><p class="book-meta">'+esc(row.group)+' · '+(row.owned?'所持中':row.discovered?'過去に取得／現在未所持':'未取得')+'</p><p>'+esc(row.detail)+'</p><p class="book-meta">入手：'+(row.id==='letter'?'旧セーブから引き継ぎ':row.initial?'旅の開始時':'宝箱')+'</p>'+(row.themeId?'<p class="book-meta">'+themeIcon(row.themeId)+esc(buildThemes.find(t=>t.id===row.themeId)?.name||'')+'：スキルは探索指示へ配置して使用。'+'</p>':'');
 else if(kind==='augments')detail='<div class="book-framed-augment">'+augmentCard(row,{state,showSetHint:false,status:row.owned?'所持中':row.discovered?'過去に取得':'未取得'})+'</div>';
 else if(kind==='monsters'){
  const boss=['boss-b20','boss-b10','boss-b1'].indexOf(row.id),frame=enemyFrame(row);let sprite='';if(boss>=0&&art.bosses)sprite='<div class="book-monster boss" style="background-image:url(&quot;'+esc(art.bosses)+'&quot;);background-position:-'+(boss*128)+'px 0"></div>';else if(frame&&art.enemies)sprite='<div class="book-monster" style="background-image:url(&quot;'+esc(art.enemies)+'&quot;);background-position:-'+frame.x+'px -'+frame.y+'px"></div>';
  detail='<div class="book-monster-art">'+sprite+'</div><h2>'+esc(row.name)+'</h2><p class="book-meta">'+esc(row.zone)+'</p><dl class="book-stats"><div><dt>HP</dt><dd>'+row.hp+'</dd></div><div><dt>攻撃</dt><dd>'+row.attack+'</dd></div><div><dt>防御</dt><dd>'+row.defense+'</dd></div><div><dt>行動間隔</dt><dd>'+row.period+'ターン</dd></div></dl><p class="book-meta">基礎能力の記録です。長期滞在の増援は強化されます。</p>';
 }else detail='<div class="book-gear-art"><span class="equipment-icon '+row.slot+'" aria-hidden="true"></span></div><h2>'+esc(row.name)+'</h2><dl class="book-stats"><div><dt>攻撃</dt><dd>'+row.attack+'</dd></div><div><dt>防御</dt><dd>'+row.defense+'</dd></div></dl><p>'+esc(row.slot==='weapon'?'武器':'防具')+'</p><p class="book-meta">入手した装備の基礎能力。取得記録は周回後も保持します。</p>';
 return{title:CODEX_KINDS[kind],left,right:'<div class="book-detail" tabindex="0" role="region" aria-label="選択した項目の詳細">'+detail+'</div>',page:part.page,selected};
}
