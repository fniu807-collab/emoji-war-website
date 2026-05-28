# Emoji War V7 Full Replace Project

这是一个完整替换版 Vite React 官网项目。

## 用法

1. 备份你原来的项目。
2. 解压本包。
3. 把本包里面所有文件复制到 `emoji-war-website` 项目根目录。
4. 覆盖同名文件。
5. 在项目目录执行：

```bash
npm install
npm run dev
```

## 当前测试配置

- EWTEST: 0x1cfe9717be9d02370e3001717e5da157d35e7777
- Army V7: 0xeB472e8863bce01C3D108477A036A7D24Fd34B38
- Burn V7: 0x7eB94A7E2fa35d9491d1043a230B201A70052CFA
- Vault: 0x8b55FA7273c790F1caD86cf96917AcD0469Fc515
- RewardPool V7: 0xf354AC72248458011e5B5A28b61018B3E11908d6

## 正式开盘后

只改：

```text
src/emojiWarV7/config.js
```

替换正式 Token、Army、Burn、Vault、RewardPool 和购买链接。

## 注意

这个包是完整替换版。它不是你线上旧官网的 1:1 原文件修改版，但视觉会保持 Emoji War 黑金主站风格，并已经接好 V7 合约。
