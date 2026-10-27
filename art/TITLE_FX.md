# タイトル用エフェクト（現行v3）

- 骸の旅路_v3_fx_1080p.mov → title-mukuro-v3.webm / title-mukuro-v3-screen.mp4
- 倅の旅路_v3_fx_1080p.mov → title-segare-v3.webm / title-segare-v3-screen.mp4

両方ProRes 4444、1920×1080、30fps、14秒、透過、音声なし。原MOVはユーザーのDesktopに保持。配信用ファイルだけをリポジトリへ追加。旧title-fx.webmとtitle-fx-screen.mp4は置換済み。

背景／ロゴの上、ボタンの下。両方無音ループ、タイトル切替で対応動画へ切替。

変換：FFmpeg 9.0.2。WebMはVP9 yuva420p CRF32、alpha_mode=1。MP4はアルファをRGBへ乗算した黒背景、H.264 yuv420p CRF22、faststart。MP4代替はscreen合成で元のアルファ合成とは完全一致しない。

```powershell
ffmpeg -i INPUT.mov -an -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 32 -deadline good -cpu-used 4 -row-mt 1 -threads 4 -auto-alt-ref 0 OUTPUT.webm
ffmpeg -i INPUT.mov -an -vf "format=gbrap,premultiply=inplace=1,format=yuv420p" -c:v libx264 -preset fast -crf 22 -movflags +faststart OUTPUT-screen.mp4
```
