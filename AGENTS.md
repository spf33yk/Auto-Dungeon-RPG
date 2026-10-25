# 制作ルール

- ゲームの仕様・UI・難易度・保存形式を変更するたび、必ず `SPEC.md` を同時に更新する。
- ソースと仕様書は同じコミットに含める。数値・取得条件・操作方法・既存セーブへの影響を実装と一致させる。
- `DESIGN.md` は企画・物語・制作範囲、`SPEC.md` は詳細仕様、`SYSTEM_DESIGN.md` はシステム設計として分けて管理する。仮バランスは仮採用と明記する。
- 検証結果と未確定事項は `IMPLEMENTATION_NOTES.md` に記録する。

- 修正依頼を受けたらソースと各資料（DESIGN.md・SPEC.md・SYSTEM_DESIGN.md・IMPLEMENTATION_NOTES.md・README.md）の整合を確認し、該当する変更を同時に反映する。

- 今後は毎回、push後にGitHub Actionsの自動テスト成功とGitHub Pagesのデプロイ成功を確認し、公開URLで今回の変更を実操作テストする。ローカル確認やpush成功だけで「公開版に反映済み」と報告しない。
- 公開版のテスト結果・確認したコミット・未確認事項はIMPLEMENTATION_NOTES.mdへ記録する。公開確認できない場合は、その制約を完了報告で明記する。

- ブラウザ用JS・CSS変更後はnode scripts/update-assets.jsでindex.htmlの配信URLを更新し、node scripts/update-assets.js --checkを通す。公開版で古いキャッシュとの混在がないことも確認する。
