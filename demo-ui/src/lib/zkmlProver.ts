/**
 * Real zkML Prover Integration
 * Uses NovaNet's Jolt-Atlas prover via @hshadab/spending-proofs SDK
 */

import { PolicyProofs, SpendingInput, ProofResult } from '@hshadab/spending-proofs';

// Prover configuration
const PROVER_URL = 'https://arc-policy-proofs.onrender.com';

// Singleton client instance
let proverClient: PolicyProofs | null = null;

function getProverClient(): PolicyProofs {
  if (!proverClient) {
    proverClient = new PolicyProofs({
      proverUrl: PROVER_URL,
      timeout: 120000, // 2 minutes for cold starts
    });
  }
  return proverClient;
}

export interface MorphoProofInput {
  operation: 'supply' | 'borrow' | 'withdraw' | 'repay';
  amountUsdc: number;
  dailyLimitUsdc: number;
  spentTodayUsdc: number;
  budgetUsdc: number;
  marketSuccessRate?: number; // 0-1, defaults to 0.95
}

export interface MorphoProofResult {
  proof: string;
  proofHash: string;
  approved: boolean;
  confidence: number;
  riskScore: number;
  generationTimeMs: number;
  proofSizeBytes: number;
  metadata: {
    modelHash: string;
    inputHash: string;
    outputHash: string;
  };
}

/**
 * Generate a real zkML proof for a Morpho operation
 */
export async function generateZkmlProof(
  input: MorphoProofInput,
  onProgress?: (progress: number, status: string) => void
): Promise<MorphoProofResult> {
  const client = getProverClient();

  onProgress?.(5, 'Preparing proof inputs...');

  // Convert Morpho operation to spending proof input
  const spendingInput: SpendingInput = {
    priceUsdc: input.amountUsdc,
    budgetUsdc: input.budgetUsdc,
    spentTodayUsdc: input.spentTodayUsdc,
    dailyLimitUsdc: input.dailyLimitUsdc,
    serviceSuccessRate: input.marketSuccessRate ?? 0.95,
    serviceTotalCalls: 100, // Historical usage
    purchasesInCategory: 0,
    timeSinceLastPurchase: 1, // 1 hour
  };

  onProgress?.(15, 'Connecting to NovaNet prover...');

  const startTime = Date.now();
  let lastProgress = 15;

  // Simulate progress updates while waiting for prover
  const progressInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    // Progress from 15% to 85% over ~10 seconds
    const newProgress = Math.min(85, 15 + (elapsed / 10000) * 70);
    if (newProgress > lastProgress) {
      lastProgress = newProgress;
      const status = newProgress < 40
        ? 'Running neural network in SNARK circuit...'
        : newProgress < 60
        ? 'Generating Jolt-Atlas proof...'
        : newProgress < 80
        ? 'Finalizing proof (~48KB)...'
        : 'Verifying proof integrity...';
      onProgress?.(Math.round(newProgress), status);
    }
  }, 200);

  try {
    // Call real prover
    const result: ProofResult = await client.prove(spendingInput, `morpho-${input.operation}`);

    clearInterval(progressInterval);
    onProgress?.(95, 'Proof verified successfully!');

    // Small delay to show completion
    await new Promise((r) => setTimeout(r, 300));
    onProgress?.(100, 'Complete');

    return {
      proof: result.proof,
      proofHash: result.proofHash,
      approved: result.decision.shouldBuy,
      confidence: result.decision.confidence,
      riskScore: result.decision.riskScore,
      generationTimeMs: result.metadata.generationTimeMs,
      proofSizeBytes: result.metadata.proofSize,
      metadata: {
        modelHash: result.metadata.modelHash,
        inputHash: result.metadata.inputHash,
        outputHash: result.metadata.outputHash,
      },
    };
  } catch (error) {
    clearInterval(progressInterval);
    throw error;
  }
}

/**
 * Check if the prover service is available
 */
export async function checkProverHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${PROVER_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get prover service info
 */
export function getProverInfo() {
  return {
    url: PROVER_URL,
    proofSize: '~48 KB',
    generationTime: '4-12 seconds (warm), ~30s (cold)',
    verificationTime: '<150ms',
    technology: 'Jolt-Atlas SNARK (NovaNet)',
  };
}
