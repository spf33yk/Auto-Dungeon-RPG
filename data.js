// Balance values are provisional. IDs are shared by combat, inventory and codices.
export const zones = [
  ['忘却の地下墓地','crypt', '#293a32','#56614b','rooms'],
  ['苔むす水路','water', '#234247','#3e6661','channels'],
  ['崩れた鉱山','mine', '#40382d','#776246','caves'],
  ['灼熱の炉跡','forge', '#482f2b','#845046','hall'],
  ['凍りついた聖堂','frost', '#304352','#708597','cross'],
  ['封じられた書庫','library', '#3d3245','#70617f','rooms'],
  ['毒霧の庭園','garden', '#34442d','#69764d','caves'],
  ['沈黙の城塞','fortress', '#364049','#6a7279','hall'],
  ['月影の回廊','moon', '#34334e','#77729a','channels'],
  ['黎明への門','dawn', '#484638','#8d8665','cross'],
].map(([name,id,floorColor,wallColor,layout],index)=>({name,id,floorColor,wallColor,layout,index}));
const species = [['墓地スライム','骨の番兵'],['水路ヒル','水門の守り手'],['洞窟コウモリ','岩の巨兵'],['火の精','炉の鎧兵'],['氷の精','凍てつく騎士'],['魔導の影','書庫の番人'],['毒胞子','根の巨人'],['城塞の亡霊','重装の番兵'],['月影の獣','影の騎士'],['門の使い魔','黎明の守護者']];
export const monsters = species.flatMap((names,z)=>names.map((name,k)=>({id:`enemy-${z}-${k}`,name,zone:z,type:k?'brute':'slime',hp:(k?19:11)+z*4,attack:(k?7:4)+Math.floor(z*2.75),defense:Math.floor(z*.8)+(k?1:0),period:k?2:1,color:k?['#966e68','#c7aba0']:['#507f69','#a2c6a5']})));
const weapons=['錆びた剣','銅の剣','鉄の剣','炉鍛の剣','氷晶の剣','魔導の剣','茨の剣','騎士の剣','月影の剣','黎明の剣'];
const armors=['ほころびた外套','旅人の外套','鉄の胸当て','炉鍛の鎧','氷晶の鎧','魔導の外套','樹皮の鎧','騎士の鎧','月影の鎧','黎明の鎧'];
export const equipment = [...weapons.map((name,rank)=>({id:`weapon-${rank}`,name,slot:'weapon',rank,attack:2+rank*2,defense:0})),...armors.map((name,rank)=>({id:`armor-${rank}`,name,slot:'armor',rank,attack:0,defense:rank*2}))];
export const monsterById=Object.fromEntries(monsters.map(m=>[m.id,m]));
export const gearById=Object.fromEntries(equipment.map(g=>[g.id,g]));
export const skills = [
  {id:'vitality',group:'能力',name:'生命の記憶',icon:'♥',detail:'最大HP +12、HPも12回復。',cost:5,max:5},
  {id:'power',category:'weapon',group:'能力',name:'剣技の記憶',icon:'⚔',detail:'攻撃力 +2。',cost:6,max:5},
  {id:'guard',category:'armor',group:'能力',name:'守護の記憶',icon:'◇',detail:'防御力 +1。',cost:6,max:4},
  {id:'tactics',group:'戦術',name:'戦術判断の記憶',icon:'◈',detail:'倒し切れる敵、攻撃力の高い敵を優先。',cost:8,max:1},
  {id:'collect',group:'探索',name:'一括回収の心得',icon:'✦',detail:'「発見した品をすべて回収」を解放。泉も回収するため、消費時期に注意。',cost:7,max:1},
  {id:'exploration',group:'探索',name:'全探索の心得',icon:'◎',detail:'「すべての床を探索」だけを解放。探索時間と交戦の危険が増す。',cost:8,max:1,requires:'exploreNear'},
  {id:'scout',group:'索敵',name:'感覚の記憶',icon:'◉',detail:'視界半径 +0.5マス。4段階。',cost:5,max:4},
  {id:'commandSlots',group:'指示',name:'指揮の記憶',icon:'☷',detail:'設定できる探索指示 +1枠。初期2枠、最大8枠。',cost:6,max:6},
  {id:'survival',group:'判断',name:'緊急回復の記憶',icon:'♡',detail:'「瀕死時に泉へ向かう」だけを解放。HP条件を設定できる。',cost:6,max:1},
  {id:'evasion',group:'判断',name:'負傷退避の記憶',icon:'↶',detail:'「HP低下時は敵から離れる」だけを解放。退避4ターン後は6ターン休止。',cost:8,max:1,requires:'survival'},
  {id:'exitLow',group:'指示',name:'緊急帰還',icon:'⇧',detail:'「HP低下時は階段へ」を解放。既知の階段が対象。',cost:5,max:1,requires:'survival'},
  {id:'exitTimed',group:'指示',name:'探索時間の管理',icon:'◷',detail:'「指定ターン後は階段へ」を解放。滞在ターン数を設定。',cost:5,max:1},
  {id:'exitLoot',group:'指示',name:'回収後の帰還',icon:'⇱',detail:'「見つけた品の回収後に階段へ」を解放。既知の取得可能な品がなくなると帰還。',cost:6,max:1,requires:'collect'},
  {id:'chestSense',group:'指示',name:'宝箱の選別',icon:'▣',detail:'「宝箱を優先して回収」を解放。泉を回収対象に含めない。',cost:5,max:1,requires:'collect'},
  {id:'chestNear',group:'指示',name:'近距離の宝箱',icon:'▧',detail:'「近くの宝箱だけ回収」を解放。距離1〜20マスを設定。',cost:6,max:1,requires:'chestSense'},
  {id:'healEarly',group:'指示',name:'予防回復',icon:'✙',detail:'「負傷したら泉へ向かう」を解放。早めに回復するHP基準を設定。',cost:6,max:1,requires:'survival'},
  {id:'exploreNear',group:'指示',name:'近距離の踏査',icon:'⌖',detail:'「近くの未踏床を調べる」を解放。距離1〜20マスを設定。',cost:5,max:1},
  {id:'avoidGroup',group:'指示',name:'包囲の察知',icon:'⤴',detail:'「包囲されそうなら退避」を解放。隣接敵数1〜4体を設定。',cost:7,max:1,requires:'evasion'},
  {id:'huntAny',group:'指示',name:'追跡の心得',icon:'➶',detail:'「見える敵を追う」を解放。視認した敵だけが対象。',cost:5,max:1},
  {id:'huntInjured',group:'指示',name:'負傷敵の追跡',icon:'◔',detail:'「負傷した敵を追う」を解放。HP半分以下の視認敵に接近。',cost:6,max:1,requires:'huntAny'},
  {id:'huntWeak',group:'指示',name:'とどめの追跡',icon:'✧',detail:'「一撃で倒せる敵を追う」を解放。接近後の攻撃対象選択は戦術判断が別途必要。',cost:7,max:1,requires:'huntInjured'},
  {id:'huntDanger',group:'指示',name:'強敵への追跡',icon:'⚑',detail:'「攻撃力の高い敵を追う」を解放。攻撃力最大の視認敵に接近。',cost:7,max:1,requires:'huntAny'},
  {id:'mend',group:'生存',name:'再生の祈り',icon:'✚',detail:'HP35%以下で40%回復。各階1回。',cost:10,max:1,requires:'guard'},
  {id:'identify',group:'道具',name:'鑑定の記憶',icon:'⌕',detail:'準備中の鑑定を解放。1個3pt。',cost:5,max:1},
  {id:'uncurse',group:'道具',name:'解呪の記憶',icon:'☼',detail:'準備中の解呪を解放。1個5pt。',cost:5,max:1},
  {id:'synthesis',group:'道具',name:'合成の記憶',icon:'⚒',detail:'同名の鑑定済み装備を合成。',cost:8,max:1,requires:'identify'},
  {id:'bond',group:'イベント',name:'絆の記憶',icon:'❖',detail:'B25の手紙の宝箱を開封。TRUE本編は後続制作。',cost:15,max:1,event:true},
];
