# tools

Helpers for regenerating the icons. Nothing here is deployed.

`public/favicon.svg` is written by hand. The PNG and ICO versions are rendered from it with headless
Microsoft Edge while `npm run dev` is running (`tools/icon.html` shows the SVG filling the window).
Headless Edge won't make a window narrower than about 500px, so the images are rendered at 512px and
scaled down with `--force-device-scale-factor`. Edge needs absolute paths for `--screenshot`.

```sh
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
D=$(pwd -W)   # Git Bash on Windows; use $(pwd) elsewhere
shot() { "$EDGE" --headless=new --hide-scrollbars --default-background-color=00000000 \
  --window-size="$1" --force-device-scale-factor="$2" --virtual-time-budget=2000 --screenshot="$3" "$4"; }

shot 512,512 0.3515625 "$D/public/apple-touch-icon.png" "http://localhost:8124/tools/icon.html?bleed"
shot 512,512 0.09375   "$D/icon-48.png"                 http://localhost:8124/tools/icon.html
node tools/make-ico.mjs icon-48.png public/favicon.ico && rm icon-48.png
```
