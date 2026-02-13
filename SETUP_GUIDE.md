# Chain Wallet Setup 指南

## 概述

本指南说明如何设置链上钱包并配置环境变量。

## 环境变量说明

`.env` 文件包含以下配置：

- **ENDPOINT**: Solana RPC 端点
- **PRIVATE_KEY**: Manager 1 的私钥（也是 Executor，用于签署交易和付款）
- **PRIVATE_KEY2**: Manager 2 的私钥（用于多签批准）
- **CHAIN_WALLET**: 链上钱包的 PDA 地址
- **CUSTODY**: Custody 账户的 PDA 地址

## 初始设置步骤

### 步骤 1: 准备初始账户

首先，你需要一个有 SOL 的账户来支付钱包创建的交易费用。

1. 复制 `env.example` 到 `.env`
2. 生成一个新账户或使用现有账户：
   ```bash
   solana-keygen new --outfile ./funder-keypair.json
   ```
3. 从生成的密钥对中获取私钥（Base58 格式）并设置到 `.env` 的 `PRIVATE_KEY`
4. 获取公钥：
   ```bash
   solana-keygen pubkey ./funder-keypair.json
   ```
5. 给该账户空投 SOL（**重要！必须先空投才能创建钱包**）：
   ```bash
   solana airdrop 2 <你的公钥> --url devnet
   ```
   或使用在线水龙头：https://faucet.solana.com/

6. 验证余额：
   ```bash
   solana balance <你的公钥> --url devnet
   ```

### 步骤 2: 运行设置测试

**确保步骤 1 中的账户有足够的 SOL 后**，运行以下命令创建新的链上钱包并生成配置：

```bash
npm test -- chain-wallet-setup.test.ts
```

此测试会：
1. 生成两个新的 manager 密钥对
2. 使用你提供的 PRIVATE_KEY 作为付款人
3. 创建链上钱包并将新生成的 manager 添加到钱包中
4. 输出完整的 .env 配置

### 步骤 3: 更新 .env 文件

将测试输出的配置复制到 `.env` 文件中，格式如下：

```
ENDPOINT=https://api.devnet.solana.com/
PRIVATE_KEY=<Manager1的私钥>
PRIVATE_KEY2=<Manager2的私钥>
CHAIN_WALLET=<钱包PDA地址>
CUSTODY=<CustodyPDA地址>
```

### 步骤 4: 给新的 Manager 账户空投 SOL

新生成的 manager 账户需要 SOL 才能签署交易。从测试输出中获取 Manager 1 和 Manager 2 的公钥，然后空投：

```bash
solana airdrop 2 <Manager1公钥> --url devnet
solana airdrop 2 <Manager2公钥> --url devnet
```

## 快速开始示例

```bash
# 1. 安装依赖
npm install

# 2. 复制环境变量模板
cp env.example .env

# 3. 生成新的付款人账户
solana-keygen new --outfile ./funder-keypair.json

# 4. 获取公钥
solana-keygen pubkey ./funder-keypair.json
# 输出类似: 4ag7XA16tm4RiTVYmj47FrqMNhX8p6eD9BMoDYaQvpaC

# 5. 空投 SOL
solana airdrop 5 4ag7XA16tm4RiTVYmj47FrqMNhX8p6eD9BMoDYaQvpaC --url devnet

# 6. 获取私钥并设置到 .env
# 将 funder-keypair.json 中的密钥转换为 Base58 格式并设置到 .env 的 PRIVATE_KEY

# 7. 运行设置测试
npm test -- chain-wallet-setup.test.ts

# 8. 复制输出的配置到 .env

# 9. 给新生成的 manager 账户空投 SOL

# 10. 运行其他测试
npm test -- chain-wallet.test.ts
npm test -- chain-wallet-risk.test.ts
```

## 运行测试

设置完成后，你可以运行各种测试：

```bash
# 运行所有测试
npm test

# 运行特定测试
npm test -- chain-wallet.test.ts
npm test -- chain-wallet-risk.test.ts
```

## 关键概念

- **Manager**: 有权限批准多签交易的账户
- **Executor**: 有权限执行已批准交易的账户
- **Threshold**: 需要多少个 manager 批准才能执行交易（本例中为 1）
- **Custody**: 存储钱包配置和状态的链上账户
- **Chain Wallet**: 实际的钱包 PDA，可以持有 SOL 和代币

## 故障排除

### 错误: "Attempt to debit an account but found no record of a prior credit"

这意味着付款人账户没有足够的 SOL。请确保：
1. 已经给 PRIVATE_KEY 对应的账户空投了 SOL
2. 空投已经确认（等待几秒钟）
3. 账户余额足够支付交易费用

### 错误: "Account does not exist"

这意味着 CHAIN_WALLET 或 CUSTODY 地址不正确，或者钱包还没有创建。请重新运行 setup 测试。

