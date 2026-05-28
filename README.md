# Emoji War / $EMOJI 钱包连接 V3

新增功能：

- Connect Binance Wallet
- 自动尝试切换到 BNB Smart Chain
- 显示钱包地址
- 选择 Emoji 军团
- 军团选择保存到浏览器本地 localStorage
- 页面显示用户当前军团

## 更新你现在的网站

1. 下载并解压这个压缩包
2. 打开 `emoji-war-wallet-v3`
3. 复制里面所有文件
4. 粘贴覆盖你电脑里的 `emoji-war-website`
5. 打开 GitHub Desktop
6. Summary 写：add wallet connect
7. 点击 Commit to main
8. 点击 Push origin
9. 等 Vercel 自动更新

## 注意

当前 V3 是前端钱包连接版，军团选择保存在浏览器本地，不是链上绑定。

下一阶段才是 Solidity 合约版本：

- joinArmy(seasonId, armyId)
- burnForArmy(seasonId, armyId, amount)
- 自动排行榜
- 自动奖励 Claim
