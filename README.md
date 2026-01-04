# NovaNet zkML Spending Proofs for Morpho Blue

**Trustless Autonomous DeFi: AI Agents Managing Morpho Vaults with Cryptographic Policy Compliance**

> ⚠️ **Disclaimer: Integration Prototype - Testnet Only**
>
> This repository demonstrates NovaNet's Jolt-Atlas zkML infrastructure integrated with Morpho Blue. The demo connects to a **live zkML prover** and contracts are **deployed on Arc Testnet**.
>
> **Not for production use.** Smart contracts have not been audited. On-chain transactions in the demo UI are simulated. See [What's Real vs. Simulated](#whats-real-vs-simulated) for details.

---

This project integrates [NovaNet Jolt-Atlas zkML Spending Proofs](https://github.com/hshadab/spendingproofs) with [Morpho Blue](https://github.com/morpho-org/morpho-blue), enabling AI agents to autonomously manage lending positions while proving every action complies with owner-defined spending policies.

## The Problem

As AI agents become capable of managing DeFi positions, a critical trust gap emerges:

- **Vault owners** want to delegate management to AI agents for 24/7 optimization
- **But they can't verify** that agents will respect spending limits, risk parameters, and operational constraints
- Traditional access controls are binary: either full access or none

## The Solution

**zkML Spending Proofs** solve this by requiring agents to generate cryptographic proofs for every operation:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   AI Agent      │────▶│ Jolt-Atlas SNARK │────▶│ MorphoSpending  │
│ (Makes Decision)│     │ Prover (48KB)    │     │ Gate (Verify)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                         │
                              ┌──────────────────────────┘
                              ▼
                        ┌─────────────────┐
                        │  Morpho Blue    │
                        │  (Execute)      │
                        └─────────────────┘
```

**No proof, no transaction.** Every operation is cryptographically verified against the owner's policy.

### What is a "Spending Policy"?

In this context, "spending" refers to **capital disbursement**—how an agent allocates and moves the owner's funds:

| Operation | Spending Action |
|-----------|-----------------|
| **Supply** | Spending funds into a lending market |
| **Borrow** | Spending collateral/credit to take a loan |
| **Withdraw** | Spending (moving) funds out of a market |
| **Repay** | Spending funds to clear debt |

A **spending policy** defines constraints on these capital flows: daily limits, max transaction size, allowed markets, and risk parameters (LTV, health factor). The zkML proof verifies that a neural network policy model approved the agent's action given these constraints.

## Key Features

- **Policy-Gated Operations**: Supply, borrow, withdraw, repay all require valid proofs
- **Configurable Constraints**: Daily limits, single-tx limits, LTV bounds, market whitelists
- **~48KB Proofs**: Generated in 4-12 seconds by Jolt-Atlas prover
- **On-chain Verification**: ~200K gas per verification
- **SDK + React Hooks**: Easy integration for dApps and agents

## Project Structure

```
morpho/
├── contracts/                    # Solidity smart contracts
│   ├── MorphoSpendingGate.sol   # Main gate contract
│   ├── interfaces/              # Contract interfaces
│   ├── libraries/               # Verification libraries
│   └── mocks/                   # Testing mocks
├── sdk/                         # TypeScript SDK
│   └── src/
│       ├── client.ts           # Main SDK client
│       ├── policies/           # Policy templates
│       ├── hooks/              # React hooks
│       └── types/              # Type definitions
├── demo-app/
│   └── agent-vault-manager/    # Agentic vault demo
├── scripts/                    # Deployment & setup
└── foundry.toml               # Foundry config
```

## Quick Start

### 1. Install Dependencies

```bash
# Install Foundry for contracts
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Install SDK dependencies
cd sdk && npm install

# Install demo dependencies
cd ../demo-app/agent-vault-manager && npm install
```

### 2. Run the Demo

```bash
cd demo-app/agent-vault-manager
npm run simulate
```

This demonstrates:
- Owner defining a spending policy
- Agent authorization with policy constraints
- Agent making decisions and generating zkML proofs
- On-chain verification and execution

### 3. Deploy Contracts

```bash
# Set environment variables
export RPC_URL=https://...
export PRIVATE_KEY=0x...
export MORPHO_BLUE_ADDRESS=0x...

# Deploy
npx tsx scripts/deploy.ts
```

## Usage

### Define a Spending Policy

```typescript
import { createCombinedPolicy } from '@hshadab/morpho-spending-proofs';

const policy = createCombinedPolicy({
  dailyLimitUSD: 10_000,        // $10K daily max
  maxSingleTxUSD: 5_000,        // $5K per transaction
  maxLTVPercent: 70,            // 70% max LTV
  minHealthFactor: 1.2,         // 1.2 min health factor
  allowedMarkets: ['0x...'],    // Whitelisted markets
});
```

### Generate a Proof

```typescript
import { createMorphoSpendingProofsClient, MorphoOperation } from '@hshadab/morpho-spending-proofs';

const client = createMorphoSpendingProofsClient({
  proverUrl: 'https://prover.example.com',
  chainId: 1,
  gateAddress: '0x...',
  morphoAddress: '0x...',
});

const proof = await client.generateProof({
  policy,
  operation: MorphoOperation.SUPPLY,
  amount: 1000000000n,  // 1000 USDC
  market: '0x...',
  agent: '0x...',
}, signer);
```

### React Integration

```tsx
import { useMorphoSpendingProof, MorphoOperation } from '@hshadab/morpho-spending-proofs';

function SupplyButton() {
  const { status, progress, generateProof } = useMorphoSpendingProof({
    proverUrl: 'https://prover.example.com',
    chainId: 1,
    gateAddress: '0x...',
    morphoAddress: '0x...',
    signer: wallet,
  });

  const handleSupply = async () => {
    const proof = await generateProof({
      policy: myPolicy,
      operation: MorphoOperation.SUPPLY,
      amount: parseUnits('1000', 6),
      market: marketAddress,
      agent: agentAddress,
    });

    if (proof) {
      // Submit to MorphoSpendingGate
    }
  };

  return (
    <button onClick={handleSupply} disabled={status === 'generating'}>
      {status === 'generating' ? `Generating proof ${progress}%` : 'Supply'}
    </button>
  );
}
```

## Policy Templates

### Vault Limits
```typescript
import { createVaultLimitsPolicy, VAULT_LIMITS_PRESETS } from '@hshadab/morpho-spending-proofs';

// Use preset
const policy = createPolicyFromPreset('moderate', allowedMarkets);

// Or custom
const policy = createVaultLimitsPolicy({
  dailyLimitUSD: 50_000,
  maxSingleTxUSD: 10_000,
  allowedMarkets,
});
```

### LTV Bounds
```typescript
import { createLTVBoundsPolicy, LTV_RISK_TIERS } from '@hshadab/morpho-spending-proofs';

const policy = createPolicyFromRiskTier('safe', {
  dailyLimitUSD: 100_000,
  allowedMarkets,
});
```

### Agent Presets
```typescript
import { AGENT_POLICY_PRESETS } from '@hshadab/morpho-spending-proofs';

// Ready-to-use policies for different agent types
const policies = {
  conservativeYieldAgent,    // Low risk yield farming
  moderateRebalanceAgent,    // Balanced rebalancing
  aggressiveTradingAgent,    // High frequency trading
  institutionalTreasuryAgent // Enterprise treasury management
};
```

## Smart Contract Integration

### MorphoSpendingGate

The gate contract wraps Morpho Blue operations with proof verification:

```solidity
// Owner registers a policy
bytes32 policyHash = gate.registerPolicy(policy);

// Owner authorizes an agent
gate.authorizeAgent(agentAddress, policyHash);

// Agent executes with proof
gate.supplyWithProof(market, amount, onBehalf, proof);
```

### Proof Structure

```solidity
struct SpendingProof {
    bytes32 policyHash;    // Policy being proven against
    bytes proof;           // Jolt-Atlas SNARK (~48KB)
    bytes32[] publicInputs; // Operation parameters
    uint256 timestamp;     // Proof generation time
    bytes signature;       // Agent signature
}
```

## Architecture

### Flow Diagram

```
1. POLICY SETUP
   Owner ─────▶ Define Policy ─────▶ Register on Gate ─────▶ Authorize Agent

2. AGENT OPERATION
   Agent ─────▶ Analyze Market ─────▶ Make Decision ─────▶ Generate Proof
                                                                │
                                                                ▼
   Morpho Blue ◀───── Execute ◀───── Verify Proof ◀───── Submit to Gate

3. VERIFICATION
   Gate ─────▶ Check proof validity
        ─────▶ Verify policy constraints
        ─────▶ Check daily limits
        ─────▶ Validate LTV/health factor
        ─────▶ Execute on Morpho Blue
```

### Security Model

- **Proof Replay Prevention**: Each proof can only be used once
- **Timestamp Validation**: Proofs expire after 5 minutes
- **Signature Verification**: Agent must sign proof commitment
- **Policy Binding**: Proof must match registered policy
- **Limit Enforcement**: Daily limits reset every 24 hours

## Use Cases

### 1. Autonomous Yield Farming
AI agents optimize yield across Morpho markets while staying within risk parameters.

### 2. Institutional Treasury
Enterprises delegate DeFi operations to agents with auditable compliance.

### 3. Leveraged Position Management
Agents manage leveraged positions with strict LTV constraints.

### 4. Rebalancing Bots
Automated rebalancers prove their actions stay within bounds.

## What's Real vs. Simulated

This prototype demonstrates the **architecture and integration pattern** for zkML-verified agent operations on Morpho Blue. Here's what's implemented vs. simulated:

### ✅ Real / Live Components

| Component | Status | Description |
|-----------|--------|-------------|
| **zkML Proof Generation** | **Live** | Connects to NovaNet Jolt-Atlas prover at `arc-policy-proofs.onrender.com` |
| **Proof Data** | **Live** | Real ~48KB SNARK proofs generated in 4-12s (warm) / ~30s (cold start) |
| **Smart Contracts** | **Deployed** | `MorphoSpendingGate` deployed on Arc Testnet at `0x93BDD317371A2ab0D517cdE5e9FfCDa51247770D` |
| **Market Data** | **Live** | Fetches real APY/utilization from Morpho API (with fallback) |
| **Policy Structure** | Real | `SpendingPolicy` struct with daily limits, LTV bounds, health factors, market whitelists |
| **SDK TypeScript Types** | Real | Full type definitions for policies, proofs, operations |
| **React Hooks Pattern** | Real | `useMorphoSpendingProof` hook architecture |
| **Demo UI Workflow** | Real | End-to-end visualization with live prover toggle |

### 🔶 Simulated / Mock Components

| Component | Status | Notes |
|-----------|--------|-------|
| **On-chain Transactions** | Simulated | Demo UI simulates tx execution, no actual wallet signing |
| **Agent Decisions** | Scripted | Demo uses pre-defined decision sequence |
| **Morpho Blue Contract** | Mock | Uses `MockMorphoBlue.sol` on Arc Testnet |
| **On-chain Verification** | Off-chain | Proofs verified by NovaNet prover, not on-chain verifier contract |

### 🔄 Demo UI Toggle

The demo UI includes a **Real/Simulated toggle** in the sidebar:
- **Real Mode**: Calls live NovaNet prover, displays actual proof generation time and size
- **Simulated Mode**: Uses mock proof animation for faster demos

### 🚀 Path to Production

1. ~~**Integrate NovaNet Prover**~~ ✅ - Live integration with `@hshadab/spending-proofs` SDK
2. ~~**Deploy to Arc Testnet**~~ ✅ - Contracts deployed (see addresses below)
3. ~~**Live Market Data**~~ ✅ - Morpho API integration implemented
4. **On-chain Verification** - Deploy SNARK verifier contract for trustless on-chain verification
5. **Wallet Integration** - Connect real wallets for actual transaction signing
6. **Security Audit** - Full audit of smart contracts before mainnet

### 📍 Deployed Contract Addresses (Arc Testnet)

| Contract | Address |
|----------|---------|
| MockMorphoBlue | `0x034459863E9d2d400E4d005015cB74c2Cd584e0E` |
| MorphoSpendingGate | `0x93BDD317371A2ab0D517cdE5e9FfCDa51247770D` |

## Network Configuration

### Arc Testnet (Circle L1)

The demo is configured for [Arc Testnet](https://docs.arc.network/), Circle's new L1 blockchain where Morpho is a launch partner:

| Parameter | Value |
|-----------|-------|
| Chain ID | `5042002` |
| RPC URL | `https://rpc.testnet.arc.network` |
| Block Explorer | [testnet.arcscan.app](https://testnet.arcscan.app) |
| Faucet | [faucet.circle.com](https://faucet.circle.com) |
| Native Token | USDC |

### Live Morpho Data

The demo fetches real market data from Morpho's GraphQL API when available:
- Supply/Borrow APY
- Utilization rates
- Total supply/borrow volumes

Falls back to cached data if API is unreachable.

---

## Development

### Build Contracts

```bash
forge build
forge test
```

### Build SDK

```bash
cd sdk
npm run build
npm run test
```

### Run Demo UI

```bash
cd demo-ui
npm install
npm run dev
```

### Run Agent Simulation

```bash
cd demo-app/agent-vault-manager
npm run simulate
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Links

- [NovaNet](https://novanet.xyz) - zkML Infrastructure
- [Jolt-Atlas Spending Proofs](https://github.com/hshadab/spendingproofs)
- [Morpho Blue](https://github.com/morpho-org/morpho-blue)
- [Morpho Documentation](https://docs.morpho.org)

---

**A NovaNet integration prototype for trustless autonomous DeFi.**
