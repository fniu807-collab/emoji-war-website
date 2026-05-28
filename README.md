# Emoji War / $EMOJI 燃烧冲榜 V5

这是 BSC Testnet 测试网版本。

已接入三个测试合约：

- Army Contract: 0x1579fe91f42caD600a9A3484F4eeA154D00eB0b3
- tEMOJI Test Token: 0xb25519Cf970aE1A12f5F3b288a560C03AEE4DF1D
- Burn Contract: 0xe1082C0D733907B76Ce8B4B995D1CA0dA8B7f795

新增功能：

- 读取 tEMOJI 余额
- 读取授权额度
- Approve 授权燃烧合约
- Burn 燃烧 tEMOJI
- 读取个人燃烧量
- 读取军团燃烧榜
- 读取全赛季总燃烧量

## 更新方法

1. 解压本压缩包
2. 复制全部文件覆盖你的 `emoji-war-website`
3. GitHub Desktop：Summary 写 `connect burn contract`
4. Commit to main
5. Push origin
6. Vercel 自动更新

## 注意

这是测试网版本。正式主网需要重新部署正式合约，并替换地址和网络参数。
