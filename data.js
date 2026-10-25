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
export const minibosses=[
 {id:'boss-b20',name:'封門の骸騎士',basement:20,zone:3,type:'brute',hp:88,attack:15,defense:4,period:2,color:['#89634b','#dfbc79']},
 {id:'boss-b10',name:'霧冠の番人',basement:10,zone:6,type:'brute',hp:136,attack:23,defense:7,period:2,color:['#654b7c','#c9b6e5']},
];
export const monsters = species.flatMap((names,z)=>names.map((name,k)=>({id:`enemy-${z}-${k}`,name,zone:z,type:k?'brute':'slime',hp:(k?19:11)+z*4,attack:(k?7:4)+Math.floor(z*2.75),defense:Math.floor(z*.8)+(k?1:0),period:k?2:1,color:k?['#966e68','#c7aba0']:['#507f69','#a2c6a5']}))).concat(minibosses);
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
  {id:'scout',group:'索敵',name:'感覚の記憶',icon:'◉',detail:'視界半径 +0.5マス。4段階。',cost:5,max:4},
  {id:'commandSlots',group:'指示',name:'指揮の記憶',icon:'☷',detail:'設定できる探索指示 +1枠。初期2枠、最大8枠。',cost:6,max:6},
  {id:'mend',group:'生存',name:'再生の祈り',icon:'✚',detail:'HP35%以下で40%回復。各階1回。',cost:10,max:1,requires:'guard'},
];
