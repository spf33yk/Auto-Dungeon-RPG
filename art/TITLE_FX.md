# タイトル用エフェクト

提供元：骸の旅路_title_fx_1080p.mov（ProRes 4444、1920×1080、30fps、14秒、透過、音声なし）。原MOVはDesktopに保持し、GitHubには配信用ファイルだけを保持。

- title-fx.webm：VP9 yuva420p、CRF32、alpha_mode=1。
- title-fx-screen.mp4：アルファをRGBへ乗算した黒背景版、H.264 yuv420p、CRF22、faststart。透過デコード非対応時のscreen合成用。
- 背景／暗幕・ロゴの上、メニューの下。骸版のみ、無音ループ。

変換：FFmpeg 9.0.2。

```powershell
ffmpeg -i INPUT.mov -an -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 32 -deadline good -cpu-used 4 -row-mt 1 -threads 4 -auto-alt-ref 0 title-fx.webm
ffmpeg -i INPUT.mov -an -vf "format=gbrap,premultiply=inplace=1,format=yuv420p" -c:v libx264 -preset fast -crf 22 -movflags +faststart title-fx-screen.mp4
```
