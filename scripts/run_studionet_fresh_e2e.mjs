import { createClient } from "../frontend/node_modules/genlayer-js/dist/index.js";
import { studionet } from "../frontend/node_modules/genlayer-js/dist/chains/index.js";
import { TransactionStatus } from "../frontend/node_modules/genlayer-js/dist/types/index.js";
import { privateKeyToAccount } from "../frontend/node_modules/viem/_esm/accounts/index.js";

const contract = process.env.CONTRACT_ADDRESS;
const keys = [process.env.TEST_WALLET_A_PRIVATE_KEY, process.env.TEST_WALLET_B_PRIVATE_KEY];
if (!/^0x[0-9a-fA-F]{40}$/.test(contract || "") || keys.some((key) => !key)) throw new Error("Set contract and both test wallets");
const wallets = keys.map((key) => privateKeyToAccount(key.startsWith("0x") ? key : `0x${key}`));
if (wallets[0].address.toLowerCase() === wallets[1].address.toLowerCase()) throw new Error("Test wallets must differ");

const reader = createClient({ chain: studionet });
const writer = (wallet) => createClient({ chain: studionet, account: wallet });
const read = (functionName, args = []) => reader.readContract({ address: contract, functionName, args });
const parse = async (functionName, args = []) => JSON.parse(await read(functionName, args));
const transactions = [];
const write = async (wallet, functionName, args, label) => {
  const hash = await writer(wallet).writeContract({ address: contract, functionName, args });
  console.log(`${label}_tx=${hash}`);
  const receipt = await reader.waitForTransactionReceipt({ hash, status: TransactionStatus.FINALIZED, interval: 3000, retries: 60 });
  const status = receipt.status_name || receipt.status;
  if (status !== TransactionStatus.FINALIZED) throw new Error(`${label} ended as ${status}`);
  transactions.push({ label, hash, actor: wallet.address, status });
  return hash;
};

const before = await parse("get_counts");
const auditId = BigInt(before.audit_count);
const owner = "Azaria723", repo = "FlagSpecAudit", commit = "d1dad225ebe22577c0bb84683cc6be0f7b1e0e5c";
const source = (path, digest) => JSON.stringify({ owner, repo, commit, path, digest });
const evidence = {
  DOCUMENTATION: source("/fixtures/consistent/docs.md", "8541f58cb14ef0b6bbad2f7ac0e2d31d83c7c4fbeac7144a4b0cdf86c113e3c1"),
  IMPLEMENTATION: source("/fixtures/consistent/implementation.py", "4359d8a21ac6dc6d2b867c0a513f720899c24a453450aedfe61ac08cf4a68cda"),
  TESTS: source("/fixtures/consistent/tests.py", "aaa786f2fffba3edd6c868c3b467062f57f990592a38c03b661063fd98e78a41")
};

await write(wallets[0], "create_audit", ["SafeArchive CLI E2E", "--safe-extract", "Fresh live lifecycle proof: archive members escaping the extraction directory must be rejected before extraction."], "fresh_create");
for (const [slot, value] of Object.entries(evidence)) await write(wallets[1], "attach_evidence", [auditId, slot, value], `fresh_attach_${slot.toLowerCase()}`);
await write(wallets[0], "seal_audit", [auditId], "fresh_seal");
await write(wallets[1], "assess_audit", [auditId], "fresh_assess");

const audit = await parse("get_audit", [auditId]);
const after = await parse("get_counts");
const diagnostics = JSON.parse(audit.diagnostics);
if (audit.status !== "FINALIZED" || audit.verdict !== "CONSISTENT" || audit.confidence !== "HIGH" || audit.coverage_bitmap !== 7) throw new Error(`Unexpected audit: ${JSON.stringify(audit)}`);
if (!diagnostics.documentation_support || !diagnostics.implementation_support || !diagnostics.test_support) throw new Error(`Support flags mismatch: ${audit.diagnostics}`);
if (after.audit_count !== before.audit_count + 1 || after.evidence_count !== before.evidence_count + 3 || after.sealed_count !== before.sealed_count + 1 || after.finalized_count !== before.finalized_count + 1) throw new Error(`Counter mismatch: before=${JSON.stringify(before)} after=${JSON.stringify(after)}`);

console.log(`audit_id=${auditId}`);
console.log(`audit=${JSON.stringify(audit)}`);
console.log(`support_flags=${JSON.stringify({documentation_support:diagnostics.documentation_support,implementation_support:diagnostics.implementation_support,test_support:diagnostics.test_support})}`);
console.log(`counts_before=${JSON.stringify(before)}`);
console.log(`counts_after=${JSON.stringify(after)}`);
console.log(`transactions=${JSON.stringify(transactions)}`);
