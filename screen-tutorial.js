// Each step names a real control; the guide never purchases upgrades automatically.
export const screenTutorials={
 prepare:[
  {title:'条件を選ぶ',text:'カードリストの「条件」を押してください。上の指示から優先します。',selector:'#tab-content [data-palette-tab="condition"]'},
  {title:'ターン条件を選ぶ',text:'「指定ターン経過」を押してください。',selector:'#tab-content [data-drag-source="palette|condition|turns"]'},
  {title:'条件を置く',text:'光る「＋条件」を押してください。ドラッグでも置けます。',selector:'#tab-content .insert-condition.valid-drop',placement:true},
  {title:'数値を変える',text:'カード内の数字を変更し、Enterか別の場所を押して確定してください。',selector:'#tab-content [data-inline-condition][data-condition-id="turns"]',event:'change'},
  {title:'装備を見る',text:'「装備」を押してください。装備変更は準備中に行えます。',selector:'[data-tab="gear"]'},
  {title:'指示へ戻る',text:'「探索指示」を押してください。強化は記憶の欠片で購入できます。',selector:'[data-tab="orders"]'},
  {title:'出発する',text:'「探索を始める」を押してください。最後の階段指示は自動で実行されます。',selector:'#primary',lastAction:true}
 ]
};
