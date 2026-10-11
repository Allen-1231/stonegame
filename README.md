# Beyond Infinity

六款無限寶石主題網頁小遊戲集合（單機、純前端）。

## 結構

```
index.html              # 入口頁面
css/style.css           # 全站樣式
js/three.js             # Three.js（靈魂戰場用）
js/core.js              # 路由、頁面、音效、排行榜、寶石 3D 繪製
js/games/
  archer.js             # 寶石弓手（力量）
  tunnel.js             # 螺旋隧道（空間）
  shooter.js            # 寶石機鬥（現實）
  soul.js               # 靈魂戰場（靈魂）
  typing.js             # 打字遊戲（時間）
  vault.js              # 心靈密碼（心靈）
```

## 本機預覽

請用本機 HTTP 伺服器開啟（避免部分瀏覽器對 `file://` 的限制）：

```bash
# Python
python3 -m http.server 8080

# 或 Node
npx serve .
```

然後開啟 http://localhost:8080

## 部署到 GitHub Pages

1. 把本資料夾推到 GitHub repository
2. Settings → Pages → Source 選 `main` branch、`/` root
3. 稍等一會即可用 `https://<user>.github.io/<repo>/` 開啟

功能與原先單檔版相同，僅拆成多檔方便維護。
