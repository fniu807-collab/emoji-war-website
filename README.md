# Emoji War 链上军团绑定 V4

测试网军团合约地址：

```text
0x1579fe91f42caD600a9A3484F4eeA154D00eB0b3
```

新增功能：

- 连接钱包
- 自动切换 BSC Testnet
- 读取 currentSeason
- 读取用户链上军团身份
- 读取五大军团成员数
- 点击军团按钮调用 joinArmy(armyId)
- 钱包确认后军团身份写入链上

## 更新网站

1. 下载并解压这个压缩包
2. 打开 `emoji-war-chain-v4`
3. 复制里面所有文件
4. 粘贴覆盖电脑里的 `emoji-war-website`
5. 打开 GitHub Desktop
6. Summary 写：connect army contract
7. 点击 Commit to main
8. 点击 Push origin
9. 等 Vercel 自动更新

## 注意

当前是 BSC Testnet 测试网版本，不是主网版本。正式上线主网时，需要重新部署主网合约，并替换 App.jsx 里的 `ARMY_CONTRACT_ADDRESS` 和链 ID。
