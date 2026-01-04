# Morpho ZKML Spending Proofs

**Trustless Autonomous DeFi: AI Agents Managing Morpho Vaults with Cryptographic Policy Compliance**

This project integrates [Jolt-Atlas ZKML Spending Proofs](https://github.com/hshadab/spendingproofs) with [Morpho Blue](https://github.com/morpho-org/morpho-blue), enabling AI agents to autonomously manage lending positions while proving every action complies with owner-defined spending policies.

## The Problem

As AI agents become capable of managing DeFi positions, a critical trust gap emerges:

- **Vault owners** want to delegate management to AI agents for 24/7 optimization
- **But they can't verify** that agents will respect spending limits, risk parameters, and operational constraints
- Traditional access controls are binary: either full access or none

## The Solution

**ZKML Spending Proofs** solve this by requiring agents to generate cryptographic proofs for every operation:

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
- Agent making decisions and generating ZKML proofs
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

### Run Demo

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

- [Jolt-Atlas Spending Proofs](https://github.com/hshadab/spendingproofs)
- [Morpho Blue](https://github.com/morpho-org/morpho-blue)
- [Morpho Documentation](https://docs.morpho.org)

---

**Built for trustless autonomous DeFi.**
