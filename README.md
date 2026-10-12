# 骆驼祥子 · 改写命运

网页混合叙事游戏：在关键转折点做抉择，穿插拉车小游戏，用**积蓄 / 体力 / 体面**改写祥子的命运。

## 如何打开

本项目使用 ES Module，请用本地静态服务打开（不要直接双击 `index.html`）：

```bash
# Python
python3 -m http.server 22000

# 或 Node
npx --yes serve -p 22000
```

浏览器访问：<http://localhost:22000>

## 操作说明

- **剧情**：阅读后点选抉择，数值会立即变化
- **拉车**：按住空格 / 触屏加速，松开滑行；方向键 ↑↓（或 W/S）变道；手机可上下滑动变道
- **配音**：拉车时使用浏览器中文语音合成（需允许站点播放声音；建议用 Chrome / Edge）
- **存档**：进度自动写入浏览器 `localStorage`，开场可选「继续存档」

## 结局

| 结局 | 条件概要 |
|------|----------|
| 沉沦 | 体面过低（贴近原著） |
| 有车无光 | 有钱/有车但体面崩坏 |
| 守住体面 | 体面与体力达标 |
| 双全 | 积蓄、体面、体力均达标 |

## 目录

```
index.html
css/main.css
css/game.css
js/main.js
js/state.js
js/story.js
js/minigame.js
js/endings.js
```
