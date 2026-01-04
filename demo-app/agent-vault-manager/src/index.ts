/**
 * Agentic Vault Manager - Entry Point
 *
 * Export main components for use as a library or run standalone
 */

export { AgentVaultManager, createAgentVaultManager } from './agent';
export * from './types';

// CLI entry point
if (require.main === module) {
  console.log('Morpho Agentic Vault Manager');
  console.log('============================');
  console.log();
  console.log('Usage:');
  console.log('  npm run simulate    - Run demo simulation');
  console.log('  npm run agent       - Start agent (requires config)');
  console.log();
  console.log('For demo, run: npm run simulate');
}
