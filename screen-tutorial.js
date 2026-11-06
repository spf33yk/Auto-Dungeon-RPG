// Each step names a real control; the guide never purchases upgrades automatically.
export const screenTutorials={
 explore:[
  {title:'ゆっくり見る',text:'「0.5×」を押してください。移動と戦闘は自動です。',selector:'[data-speed="0.5"]'},
  {title:'速度を戻す',text:'「1×」を押してください。',selector:'[data-speed="1"]'},
  {title:'記録を開く',text:'右上の記録アイコンを押してください。',selector:'#log-open'},
  {title:'記録を閉じる',text:'記録の「×」を押してください。',selector:'[data-close="history-dialog"]'},
  {title:'探索を再開',text:'「探索を再開」を押してください。「ひとやすみ」で止められます。',selector:'#pause-toggle',lastAction:true}
 ],
 prepare:[
  {title:'条件を選ぶ',text:'カードリストの「条件」を押してください。上の指示から優先します。',selector:'#tab-content [data-palette-tab="condition"]'},
  {title:'ターン条件を選ぶ',text:'「指定ターン経過」を押してください。',selector:'#tab-content [data-drag-source="palette|condition|turns"]'},
  {title:'条件を置く',text:'光る「＋条件」を押してください。ドラッグでも置けます。',selector:'#tab-content .insert-condition.valid-drop',placement:true},
  {title:'条件の設定',text:'配置したターン条件を押してください。数値は設定欄で変更できます。',selector:'#tab-content [data-card-kind="condition"][aria-label*="ターン"]'},
  {title:'装備を見る',text:'「装備」を押してください。装備変更は準備中に行えます。',selector:'[data-tab="gear"]'},
  {title:'指示へ戻る',text:'「探索指示」を押してください。強化は記憶の欠片で購入できます。',selector:'[data-tab="orders"]'},
  {title:'出発する',text:'「探索を始める」を押してください。最後の階段指示は自動で実行されます。',selector:'#primary',lastAction:true}
 ]
};
