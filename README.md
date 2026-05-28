# Emoji War V7 Fixed Files

这是基于你刚上传的文件修好的版本。

## 修复内容

1. 保留当前 `App.jsx` 的黑金 V7 页面。
2. 修复 `EmojiWarV7Panel.jsx` 里使用 `fmtWei` 但 `emojiWarV7Client.js` 没有导出的问题。
3. 修复 `EmojiWarV7Widgets.jsx` 依赖 `config.uiText`，但 `config.js` 没有 `uiText` 的问题。
4. 增强 `readV7Dashboard()`：部分链上读取失败时不会导致整个页面崩掉，而是用默认值继续显示。
5. 继续使用你已经部署好的 V7 测试地址。

## 覆盖方式

把压缩包里的 `src` 文件夹复制到：

```text
C:\Users\Administrator\Desktop\emoji-war-website
```

选择覆盖。

如果你的 `package.json` 没有依赖，请安装：

```bash
npm install ethers lucide-react
```

然后运行：

```bash
npm run dev
```

打开：

```text
http://localhost:5173/
```

## 当前测试地址

- EWTEST: `0x1cfe9717be9d02370e3001717e5da157d35e7777`
- Army V7: `0xeB472e8863bce01C3D108477A036A7D24Fd34B38`
- Burn V7: `0x7eB94A7E2fa35d9491d1043a230B201A70052CFA`
- Vault: `0x8b55FA7273c790F1caD86cf96917AcD0469Fc515`
- RewardPool V7: `0xf354AC72248458011e5B5A28b61018B3E11908d6`
