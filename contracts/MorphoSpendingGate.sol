// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IMorphoSpendingGate.sol";
import "./interfaces/IMorphoBlue.sol";
import "./interfaces/IJoltAtlasVerifier.sol";
import "./libraries/PolicyVerifier.sol";
import "./libraries/ProofDecoder.sol";

/**
 * @title MorphoSpendingGate
 * @notice zkML-gated wrapper for Morpho Blue operations
 * @dev Requires Jolt-Atlas SNARK proofs for agents to execute vault operations
 *
 * This contract enables trustless autonomous DeFi by allowing AI agents to
 * manage Morpho vault positions while proving every action complies with
 * owner-defined spending policies.
 */
contract MorphoSpendingGate is IMorphoSpendingGate {
    using PolicyVerifier for *;
    using ProofDecoder for bytes;

    // Immutables
    IMorphoBlue public immutable morpho;
    IJoltAtlasVerifier public immutable verifier;

    // Storage
    mapping(bytes32 => SpendingPolicy) private policies;
    mapping(address => AgentConfig) private agents;
    mapping(address => mapping(address => bool)) private ownerAgents; // owner => agent => authorized
    mapping(bytes32 => bool) private usedProofs; // Prevent proof replay

    // Constants
    uint256 private constant DAY_IN_SECONDS = 86400;

    constructor(address _morpho, address _verifier) {
        morpho = IMorphoBlue(_morpho);
        verifier = IJoltAtlasVerifier(_verifier);
    }

    // ============ Policy Management ============

    /// @inheritdoc IMorphoSpendingGate
    function registerPolicy(SpendingPolicy calldata policy) external returns (bytes32 policyHash) {
        policyHash = PolicyVerifier.computePolicyHash(policy);
        policies[policyHash] = policy;
        emit PolicyRegistered(msg.sender, policyHash, policy);
    }

    /// @inheritdoc IMorphoSpendingGate
    function getPolicy(bytes32 policyHash) external view returns (SpendingPolicy memory) {
        return policies[policyHash];
    }

    /// @inheritdoc IMorphoSpendingGate
    function getPolicyHash(SpendingPolicy calldata policy) external pure returns (bytes32) {
        return PolicyVerifier.computePolicyHash(policy);
    }

    // ============ Agent Management ============

    /// @inheritdoc IMorphoSpendingGate
    function authorizeAgent(address agent, bytes32 policyHash) external {
        if (policies[policyHash].dailyLimit == 0 && policies[policyHash].maxLTV == 0) {
            revert PolicyNotFound();
        }

        agents[agent] = AgentConfig({
            agent: agent,
            owner: msg.sender,
            policyHash: policyHash,
            dailySpent: 0,
            lastResetTimestamp: block.timestamp,
            isActive: true
        });

        ownerAgents[msg.sender][agent] = true;

        emit AgentAuthorized(msg.sender, agent, policyHash);
    }

    /// @inheritdoc IMorphoSpendingGate
    function revokeAgent(address agent) external {
        AgentConfig storage config = agents[agent];
        if (config.owner != msg.sender) revert AgentNotAuthorized();

        config.isActive = false;
        ownerAgents[msg.sender][agent] = false;

        emit AgentRevoked(msg.sender, agent);
    }

    /// @inheritdoc IMorphoSpendingGate
    function getAgentConfig(address agent) external view returns (AgentConfig memory) {
        return agents[agent];
    }

    /// @inheritdoc IMorphoSpendingGate
    function isAgentAuthorized(address agent, address owner) external view returns (bool) {
        return ownerAgents[owner][agent] && agents[agent].isActive;
    }

    // ============ Gated Operations ============

    /// @inheritdoc IMorphoSpendingGate
    function supplyWithProof(
        address market,
        uint256 assets,
        address onBehalf,
        SpendingProof calldata proof
    ) external returns (uint256 shares) {
        AgentConfig storage config = agents[msg.sender];
        _validateAgentAndProof(config, proof, assets, market, ProofDecoder.OPERATION_SUPPLY);

        SpendingPolicy storage policy = policies[config.policyHash];
        if (!policy.requireProofForSupply) {
            // Still validate limits even without proof requirement
            _validateLimits(config, policy, assets, market);
        }

        // Update daily spent
        _updateDailySpent(config, assets);

        // Execute Morpho supply
        IMorphoBlue.MarketParams memory params = _getMarketParams(market);
        (, shares) = morpho.supply(params, assets, 0, onBehalf, "");

        bytes32 proofHash = keccak256(proof.proof);
        emit SupplyExecuted(msg.sender, market, assets, proofHash);
    }

    /// @inheritdoc IMorphoSpendingGate
    function borrowWithProof(
        address market,
        uint256 assets,
        address onBehalf,
        address receiver,
        SpendingProof calldata proof
    ) external returns (uint256 shares) {
        AgentConfig storage config = agents[msg.sender];
        _validateAgentAndProof(config, proof, assets, market, ProofDecoder.OPERATION_BORROW);

        SpendingPolicy storage policy = policies[config.policyHash];
        _validateLimits(config, policy, assets, market);

        // Update daily spent
        _updateDailySpent(config, assets);

        // Execute Morpho borrow
        IMorphoBlue.MarketParams memory params = _getMarketParams(market);
        (, shares) = morpho.borrow(params, assets, 0, onBehalf, receiver);

        bytes32 proofHash = keccak256(proof.proof);
        emit BorrowExecuted(msg.sender, market, assets, proofHash);
    }

    /// @inheritdoc IMorphoSpendingGate
    function withdrawWithProof(
        address market,
        uint256 assets,
        address onBehalf,
        address receiver,
        SpendingProof calldata proof
    ) external returns (uint256 shares) {
        AgentConfig storage config = agents[msg.sender];
        _validateAgentAndProof(config, proof, assets, market, ProofDecoder.OPERATION_WITHDRAW);

        SpendingPolicy storage policy = policies[config.policyHash];
        if (policy.requireProofForWithdraw) {
            _validateLimits(config, policy, assets, market);
        }

        // Update daily spent
        _updateDailySpent(config, assets);

        // Execute Morpho withdraw
        IMorphoBlue.MarketParams memory params = _getMarketParams(market);
        (, shares) = morpho.withdraw(params, assets, 0, onBehalf, receiver);

        bytes32 proofHash = keccak256(proof.proof);
        emit WithdrawExecuted(msg.sender, market, assets, proofHash);
    }

    /// @inheritdoc IMorphoSpendingGate
    function repayWithProof(
        address market,
        uint256 assets,
        address onBehalf,
        SpendingProof calldata proof
    ) external returns (uint256 repaid) {
        AgentConfig storage config = agents[msg.sender];
        _validateAgentAndProof(config, proof, assets, market, ProofDecoder.OPERATION_REPAY);

        // Execute Morpho repay
        IMorphoBlue.MarketParams memory params = _getMarketParams(market);
        (repaid, ) = morpho.repay(params, assets, 0, onBehalf, "");

        bytes32 proofHash = keccak256(proof.proof);
        emit RepayExecuted(msg.sender, market, assets, proofHash);
    }

    // ============ View Functions ============

    /// @inheritdoc IMorphoSpendingGate
    function getDailySpent(address agent) external view returns (uint256) {
        AgentConfig storage config = agents[agent];
        if (PolicyVerifier.shouldResetDailyLimit(config.lastResetTimestamp)) {
            return 0;
        }
        return config.dailySpent;
    }

    /// @inheritdoc IMorphoSpendingGate
    function getRemainingDailyLimit(address agent) external view returns (uint256) {
        AgentConfig storage config = agents[agent];
        SpendingPolicy storage policy = policies[config.policyHash];

        uint256 spent = config.dailySpent;
        if (PolicyVerifier.shouldResetDailyLimit(config.lastResetTimestamp)) {
            spent = 0;
        }

        if (spent >= policy.dailyLimit) return 0;
        return policy.dailyLimit - spent;
    }

    /// @inheritdoc IMorphoSpendingGate
    function verifyProof(SpendingProof calldata proof) external view returns (bool) {
        return verifier.verify(proof.proof, proof.publicInputs, proof.policyHash);
    }

    // ============ Internal Functions ============

    function _validateAgentAndProof(
        AgentConfig storage config,
        SpendingProof calldata proof,
        uint256 amount,
        address market,
        uint256 operationType
    ) internal {
        // Check agent is authorized
        if (!config.isActive) revert AgentNotAuthorized();

        // Check proof hasn't been used
        bytes32 proofHash = keccak256(proof.proof);
        if (usedProofs[proofHash]) revert InvalidProof();

        // Check proof timestamp
        if (!PolicyVerifier.verifyProofTimestamp(proof.timestamp)) {
            revert ProofExpired();
        }

        // Verify zkML proof
        if (!verifier.verify(proof.proof, proof.publicInputs, proof.policyHash)) {
            revert InvalidProof();
        }

        // Verify proof matches policy
        if (proof.policyHash != config.policyHash) revert InvalidProof();

        // Extract and validate metadata
        ProofDecoder.ProofMetadata memory metadata = ProofDecoder.extractMetadata(proof.publicInputs);
        if (metadata.operationType != operationType) revert InvalidProof();
        if (metadata.amount != amount) revert InvalidProof();
        if (metadata.market != market) revert InvalidProof();
        if (metadata.agent != msg.sender) revert InvalidProof();

        // Verify agent signature
        bytes32 proofCommitment = keccak256(abi.encodePacked(proofHash, metadata.nonce));
        if (!PolicyVerifier.verifyAgentSignature(msg.sender, proofCommitment, proof.signature)) {
            revert InvalidSignature();
        }

        // Mark proof as used
        usedProofs[proofHash] = true;

        emit ProofVerified(msg.sender, proof.policyHash, proofHash);
    }

    function _validateLimits(
        AgentConfig storage config,
        SpendingPolicy storage policy,
        uint256 amount,
        address market
    ) internal view {
        // Check market is allowed
        if (!PolicyVerifier.verifyMarketAllowed(market, policy.allowedMarkets)) {
            revert MarketNotAllowed();
        }

        // Check single tx limit
        if (!PolicyVerifier.verifySingleTxLimit(amount, policy.maxSingleTx)) {
            revert ExceedsSingleTxLimit();
        }

        // Check daily limit
        uint256 currentSpent = config.dailySpent;
        if (PolicyVerifier.shouldResetDailyLimit(config.lastResetTimestamp)) {
            currentSpent = 0;
        }
        if (!PolicyVerifier.verifyDailyLimit(amount, currentSpent, policy.dailyLimit)) {
            revert ExceedsDailyLimit();
        }
    }

    function _updateDailySpent(AgentConfig storage config, uint256 amount) internal {
        if (PolicyVerifier.shouldResetDailyLimit(config.lastResetTimestamp)) {
            config.dailySpent = amount;
            config.lastResetTimestamp = block.timestamp;
        } else {
            config.dailySpent += amount;
        }
    }

    function _getMarketParams(address market) internal pure returns (IMorphoBlue.MarketParams memory) {
        // In production, this would fetch actual market params
        // For demo, we return a placeholder
        return IMorphoBlue.MarketParams({
            loanToken: market,
            collateralToken: address(0),
            oracle: address(0),
            irm: address(0),
            lltv: 0
        });
    }
}
