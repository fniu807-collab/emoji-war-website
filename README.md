# Emoji War V6.1 主网 EWTEST 燃烧测试版

这是主网测试燃烧版，不是正式 $EMOJI 版本。

## 已接入

- BNB Smart Chain 主网
- 主网 Army 合约
- 主网 EWTEST 测试币
- 主网 Burn 合约
- Approve 授权
- Burn 燃烧
- 个人燃烧量
- 军团燃烧榜
- 军团成员榜

## 主网地址

EWTEST:
0x1cfe9717be9d02370e3001717e5da157d35e7777

Burn:
0xd534Af3200adA27829EC116368C24356D6E46211

Army:
0x274F9F99237a15e346de226D171c607Fb5E8ca3E

VaultFactory:
0x4cc87327A76430fF09Fa6879BF85BE09e03d1CBA

GMGN / Flap:
https://gmgn.ai/bsc/token/0x1cfe9717be9d02370e3001717e5da157d35e7777

## 更新方法

1. 解压本压缩包
2. 复制全部文件覆盖你的 `emoji-war-website`
3. GitHub Desktop：Summary 写 `connect ewtest burn`
4. Commit to main
5. Push origin
6. 等 Vercel 自动更新

## 测试流程

1. 打开官网
2. 连接钱包
3. 切到 BNB Smart Chain 主网
4. 买少量 EWTEST
5. 确认已经选择军团
6. 输入燃烧数量
7. Approve
8. Burn
9. 查看军团燃烧榜是否更新

## 注意

这是正式上线前彩排版本。正式 $EMOJI 创建后，需要替换：

- TEST_TOKEN_ADDRESS
- BURN_CONTRACT_ADDRESS
- Flap 购买链接


## V6.2 金库数据显示版

新增接入真正的 EmojiWarVault 合约：

```text
0x8b55FA7273c790F1caD86cf96917AcD0469Fc515
```

新增展示：

- Vault Balance 当前金库余额
- Total Received 累计收到税收
- Total Withdrawn 累计提现
- Season Received 当前赛季收入
- Season Withdrawn 当前赛季提现
- Vault Treasury 金库提现地址
