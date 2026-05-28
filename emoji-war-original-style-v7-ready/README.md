# Emoji War 原版风格 + V7 功能版

这是基于你上传的原版官网文件生成的版本。

## 保留内容

- 原版官网布局
- 原版黑金风格
- 原版 token-avatar.png
- 原版卡片、按钮、排行榜、Vault、RewardPool 区域视觉

## 升级内容

- Army V7
- Burn V7
- RewardPool V7
- 500,000 持币门槛检测
- Burn Share 实时分红
- Claim Realtime
- Claim Season Bonus
- Claim All
- Top10 个人燃烧榜
- 动态赛季倒计时
- 冠军军团数据

## 当前测试地址

EWTEST:
0x1cfe9717be9d02370e3001717e5da157d35e7777

Army V7:
0xeB472e8863bce01C3D108477A036A7D24Fd34B38

Burn V7:
0x7eB94A7E2fa35d9491d1043a230B201A70052CFA

Vault:
0x8b55FA7273c790F1caD86cf96917AcD0469Fc515

RewardPool V7:
0xf354AC72248458011e5B5A28b61018B3E11908d6

## 使用方法

1. 解压本包
2. 把全部文件复制到 `C:\Users\Administrator\Desktop\emoji-war-website`
3. 选择覆盖
4. 运行：

```bash
npm install
npm run dev
```

5. 打开：

```text
http://localhost:5173/
```

## 正式开盘后

只需要在 `src/App.jsx` 顶部替换：

- TEST_TOKEN_ADDRESS
- ARMY_CONTRACT_ADDRESS
- BURN_CONTRACT_ADDRESS
- EMOJI_WAR_VAULT_ADDRESS
- REWARD_POOL_ADDRESS
- links.flap
