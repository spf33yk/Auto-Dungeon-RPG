# 骸の旅路 ― システム設計書

更新日：2026-11-04。保存v16。基準実装a4ee1abと、本書と同時コミットのビルド工房変更。現行の機能仕様は[SPEC.md](SPEC.md)、企画は[DESIGN.md](DESIGN.md)。[整理前の設計履歴](docs/history/2026-11-04/SYSTEM_DESIGN.md)は互換・制作経緯の参照専用。

## 1. 構成と責務

ビルド不要のJavaScript ES modulesとCanvas。server.jsで静的配信し、index.htmlのimport mapで内容ハッシュ付きURLを指定する。ゲーム進行の乱数と視覚表現の時計を分離する。

| 分野 | 実装 | 責務 |
|---|---|---|
| 定義 | data.js、field-events.js | 敵・装備・強化・エリア・階数・異変・次階ヒント |
| 本編 | game-engine.js（入口engine.js） | 状態・地形配置・行動・戦闘・拾得・周回・保存正規化 |
| 地形 | dungeon-layout.js、boss-arena.js、crypt-obstacles.js | 通常階ランダム・対称ボス部屋・墓石と到達可能性 |
| 指示 | card-orders.js、card-placement.js、orders.js | カード判定・互換性・配置操作・旧指示互換 |
| 所持 | card-access.js、card-catalog.js、card-inventory.js、retired-cards.js | 初期5枚・29カード・抽選・図鑑・旧カード移行 |
| 成長・報酬 | progression.js、drop-system.js、reinforcements.js | EXP・二段階ドロップ・保存RNG・増援 |
| オーグメント | augments.js、augment-view.js、augment-art.js | 19効果・3択・計算・共通画像付き表示・配信URL |
| 画面統括 | app.js、index.html、style.css、screens.css | 入力・フェイズ表示・ダイアログ停止・描画・保存 |
| 指示UI | card-editor.js、editor-scroll.js | ドラッグ／タップ・行ゴースト・再描画前後の位置保持 |
| 準備予測 | exploration-forecast.js、forecast-view.js | 複製状態の非同期試行、結果と警告 |
| 表示・設定 | display-mode.js、ui-settings.js、preparation-skins.js、screen-tutorial.js | 16:9拡縮・全画面要求・端末設定・スキン・案内 |
| 視界・地図 | map-view.js、map-discovery.js、scene-lighting.js、scene-depth.js | 追従カメラ・入室式地図・明暗・足元ソート |
| 素材描画 | character-animation.js、terrain-view.js、wall-tileset.js、entrance-view.js、prop-view.js、enemy-view.js | 形式検証・セル切出し・統合壁・小物・敵HP表示 |
| 演出 | awakening.js、normal-ending.js、subtitle-player.js、opening.js、thought-view.js、story-text.js、damage-view.js、log-visibility.js | 回想・終了・文字送り・タイトル版・思考・ダメージ・5秒ログ |
| 音 | scene-music.js、app.js | 場面BGM・ループ・音量・ブラウザの再生許可、Web Audio効果音 |
| 検証 | *.test.js、test-support/ | Node標準テスト。画面確認は隔離したローカル保存で実施 |

## 2. 状態と遷移

newGameはversion16・floor1（B30）・phase awakening。初期所持5種類と自分→階段の1行、Lv1・HP54・欠片12を設定。profileは複製して引き継ぐ。

app.jsのshowingTitleはエンジンphaseと別。タイトル中はtick・自動保存を止め、hasSaveでLoadGame可否を管理。開始前映像・開始字幕も一時UI状態。開始3択の候補と未選択状態はエンジン状態として保存する。

awakening → 字幕・開始選択 → explore → cleared → prepare → explore。B1 clearedからascendするとending、normalClearsを増やし手紙カードを付与。dead／あきらめる／次の旅ではprofileを引き継いでnewGame。TRUE本編へ進む遷移は存在しない。

tickはexploreかつaugmentOfferなしでのみ実行。turnは旅の累計、stepsは階ごとの経過。カード行を判定し、隣接戦闘またはスキル・退避・移動を実行、拾得・罠・敵行動・Clear・増援の順に処理する。ボス撃破の3択発生時はその先の処理を停止する。

## 3. 保存・移行

状態本体の進行、grid・敵・品物・seen・visited、装備、levels、level／experience、orders、ownedCards、augments／augmentOffer、seed／rngState、profile等をJSON化しabyss-normal-v2へ保存。normalizeSaveがv2〜v15を順次移行しvalidateSaveで検証する。全データ初期化と旅だけの初期化はデバッグで区別する。

旧鍵・廃止カード・常時スキルは互換移行で処理し、新規取得とは分ける。data.jsの旧rewardDefinitions・chestRewards、orders.jsの旧形式、非公開の旧図鑑経路が残っていても、現在の画面で利用する新規カード箱・4図鑑とは区別する。

ゲーム保存とui-settings.jsの端末設定を分離。設定はミニマップ・映像スキップ・準備スキン・BGM・画面別案内閲覧フラグ。案内やスクロールのためゲーム保存版を上げない。視覚時計、ドラッグ・選択、スクロール、ダメージ演出は一時状態。

## 4. 乱数・地形・到達性

地形用random(seed＋floor×997)、異変用fieldPlan、戦闘・報酬用rngStateを区別。保存済みの敵・品物・3択は読み直しで再抽選しない。地形は47×35、通常階は接続グラフと部屋、ボスはbossArena。通常ルートは6エリアを選び、定義上の10エリアすべてを均等配分しない。

routeは既知床を使う幅優先探索で、敵側の経路だけ未知床も利用できる。障害物・敵・目的地を考慮する。視界は四角い範囲と遮蔽、MAPの部屋公開は別モデル。canSeeを敵対象・図鑑登録・描画の共通根拠として使う。

## 5. 描画と座標

ワールドは1マス64px。UI設計座標は1280×720で等倍率拡縮、Canvas描画面は1920×1080。cameraForが視界と位置から追従カメラを計算し、視覚上の移動補間を使う。身体64px、保存セル128px、ワールド64px、画面倍率を混同しない。

主人公はdata-heroからmukuro-minimal64-v1/sprites.jsonを読込。character-minimal-4dir/v1は下・左・右・上、3列の立ち／沈み1／沈み2と足元原点[64,96]、displayScale1.71875。屈伸・踏み込み・斬撃は表示だけで、攻撃判定やグリッド座標を変えない。旧character-4dir/v1は互換形式で現在の主人公への作画指示ではない。

床はシームレスfloor-texture/v2、壁はwall-material/v1入力・wall-autotile/v2配信。北1・東2・南4・西8で接続番号を求め、入口と角も同じ壁PNG・光源・riseで描く。15は埋め壁で外枠なし。旧entrance-parts/v1を別材質として重ねない。前景壁は通行床からはみ出さず、足元深度で描画順を決定する。明暗は実視界に合わせ、既知地形を薄暗く残す。

## 6. 準備UI・スクロール

HUDは探索・準備で共用。ResizeObserverがHUD下端＋余白を--shared-hud-spaceへ設定。#workspace:beforeの上端をこの値、左右・下端を0にして準備枠を描画する。主枠20px・パネル16px、48pxスライスの9分割、辺repeat、pointer-events:none。画像比率保持・内容の安全余白を設ける。

renderCardEditorは指示・能力・所持・phase等の署名で不要なDOM置換を避ける。変更がある場合だけeditor-scroll.jsがホスト・パネル・一覧の縦横位置を採取し復元。WeakMapで前回の指示オブジェクトと行の対応を保持し、移動後の横位置をその指示へ追従する。保存へDOM情報を含めない。

ドラッグはPointer Eventsで、カード／行の複製ゴーストが掴んだ位置に追従。タップでも選択→配置、番号選択→移動先行に対応。カード列のoverscroll-behavior-yはautoで指示一覧の縦スクロールを遮らず、横だけcontain。カードや行番号以外はpan-x pan-yを許可する。

## 7. 予測・停止・案内

forecastExplorationは入力を複製して本編tickを試行し、実状態や乱数を変えない。入力署名は表示専用ログ・intent等を除外。変更時は世代を更新し古い結果を破棄、短い処理区間ごとにUIへ制御を返す。未選択の将来オーグメントは付与しない。

openDialog／finishDialogは元のpausedを保持し、他のダイアログが残る間も停止。screenTutorialsのexplore4項目／prepare5項目を初回表示し、完了・閉じる・Escapeで画面別閲覧フラグを記録。オプションからどちらも再閲覧できる。ログはlog-visibility.jsが5000ms・ホバー／タップ保持を管理する。

## 8. 配信・検証・既知課題

scripts/update-assets.jsがroot JS・CSS・指定画像と音等の内容ハッシュをindex.htmlや配信定義へ反映。--checkはGitHubテストでも実行。Node標準テストとローカル画面確認を基本とし、公開障害時にはPagesのbuild／deployと公開HTMLの実URLまで確認する。

直近の検証は261件成功。横向きサイズ検証はPC内iframeであり、スマホ実機のタッチやSafari・回転・全画面が検証済みという意味ではない。実施コミット・配信確認・未確認はIMPLEMENTATION_NOTESへ記録する。

戦術と明示攻撃の競合・罠回避の基本探索への未適用はビルド工房実装時に解消。一部条件の常時成立は既知のまま。TRUE分岐、将来の合成等、現在の全旅クリア率は未実装／未測定として扱う。


## 9. ビルド工房と判断の共通化（2026-11-04）

- game-engine.jsのplanHeroTurnはtickから分離した読み取り専用の判断入口。本編とbuild-lab.jsの仮想状況が同じ関数を使用する。明示攻撃候補への戦術ソート、基本行動も含む罠回避ルート、発見済み階段への最終移動を共通化。
- build-insights.jsは取得済み効果と配置行から関係データを返す。build-workshop.jsが準備の関係チップ・対応する記憶／行の強調・状況入力と判断結果・前階記録を描画。合成マップは本編を複製して作り、乱数を進めない。
- forecast-comparison.jsは準備入口の状態複製と試行数別の基準結果を保持。app.jsの既存世代番号・階／旅コンテキストと組み合わせ、古い結果を表示しない。Clear率・ターン・HPの差分を同一サンプル系列で比較。基準自体はセーブしない。
- build-performance.jsは実イベントの非負整数を集計。tick／attackEnemy／takeHeroDamage／スキル／Clearが追記し、ascendが前階のスナップショットを残す。makeFloorで当階をリセット。任意のbuildReport・lastBuildReportを保存v16で検証し、旧保存のフィールド欠落を許可。途中からの記録はstartStepで区別する。
- 行の実行回数は実際に選ばれた行動だけを加算。オーグメント等の補助が成立した回数と混同しない。予測・仮想テストの記録は複製内に留め、実レポートへ合算しない。
