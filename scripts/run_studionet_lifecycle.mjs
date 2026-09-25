import { createClient } from "../frontend/node_modules/genlayer-js/dist/index.js";
import { studionet } from "../frontend/node_modules/genlayer-js/dist/chains/index.js";
import { TransactionStatus } from "../frontend/node_modules/genlayer-js/dist/types/index.js";
import { privateKeyToAccount } from "../frontend/node_modules/viem/_esm/accounts/index.js";

const contract = process.env.CONTRACT_ADDRESS;
const deployer = (process.env.DEPLOYER_ADDRESS || "").toLowerCase();
const keys = [process.env.TEST_WALLET_A_PRIVATE_KEY, process.env.TEST_WALLET_B_PRIVATE_KEY];
if (!/^0x[0-9a-fA-F]{40}$/.test(contract || "")) throw new Error("Set CONTRACT_ADDRESS");
if (keys.some((key) => !key)) throw new Error("Set both test wallet keys");
const wallets = keys.map((key) => privateKeyToAccount(key.startsWith("0x") ? key : `0x${key}`));
if (wallets[0].address.toLowerCase() === wallets[1].address.toLowerCase()) throw new Error("Test wallets must differ");
if (deployer && wallets.some((wallet) => wallet.address.toLowerCase() === deployer)) throw new Error("Deployer cannot act as a test wallet");

const reader = createClient({ chain: studionet });
const writer = (wallet) => createClient({ chain: studionet, account: wallet });
const read = (functionName, args = []) => reader.readContract({ address: contract, functionName, args });
const parse = async (functionName, args = []) => JSON.parse(await read(functionName, args));
const transactions = [];
const write = async (wallet, functionName, args, label) => {
  const hash = await writer(wallet).writeContract({ address: contract, functionName, args });
  console.log(`${label}_tx=${hash}`);
  let receipt;
  for (let attempt = 0; attempt < 30; attempt++) {
    try { receipt = await reader.waitForTransactionReceipt({ hash, status: TransactionStatus.FINALIZED }); break; }
    catch (error) { if (attempt === 29) throw error; await new Promise((resolve) => setTimeout(resolve, 5000)); }
  }
  transactions.push({ label, hash, actor: wallet.address, status: receipt.status_name || receipt.status });
};
const unchanged = async (action, label) => {
  const before = await read("get_counts");
  await action();
  const after = await read("get_counts");
  if (before !== after) throw new Error(`${label} mutated counters`);
};

const owner = "Azaria723", repo = "FlagSpecAudit", commit = "d1dad225ebe22577c0bb84683cc6be0f7b1e0e5c";
const source = (path, digest) => JSON.stringify({ owner, repo, commit, path, digest });
const consistent = {
  DOCUMENTATION: source("/fixtures/consistent/docs.md", "8541f58cb14ef0b6bbad2f7ac0e2d31d83c7c4fbeac7144a4b0cdf86c113e3c1"),
  IMPLEMENTATION: source("/fixtures/consistent/implementation.py", "4359d8a21ac6dc6d2b867c0a513f720899c24a453450aedfe61ac08cf4a68cda"),
  TESTS: source("/fixtures/consistent/tests.py", "aaa786f2fffba3edd6c868c3b467062f57f990592a38c03b661063fd98e78a41")
};

let counts = await parse("get_counts");
if (counts.audit_count === 0) await write(wallets[0], "create_audit", ["SafeArchive CLI", "--safe-extract", "Archive members escaping the extraction directory must be rejected before extraction."], "create_happy");
let audit = await parse("get_audit", [0n]);
for (const [slot, boundSource] of Object.entries(consistent)) {
  if ((await parse("get_evidence", [0n, slot])).error) await write(wallets[1], "attach_evidence", [0n, slot, boundSource], `attach_${slot.toLowerCase()}`);
}
audit = await parse("get_audit", [0n]);
if (audit.status === "DRAFT") await write(wallets[0], "seal_audit", [0n], "seal_happy");
audit = await parse("get_audit", [0n]);
if (audit.status === "SEALED") await write(wallets[1], "assess_audit", [0n], "assess_happy");
audit = await parse("get_audit", [0n]);
if (audit.status !== "FINALIZED") throw new Error(`Happy audit not finalized: ${JSON.stringify(audit)}`);

await unchanged(() => write(wallets[0], "attach_evidence", [0n, "TESTS", consistent.TESTS], "sealed_immutability_guard"), "sealed immutability");
await unchanged(() => write(wallets[1], "assess_audit", [0n], "terminal_replay_guard"), "terminal replay");
await unchanged(() => write(wallets[0], "attach_evidence", [999n, "TESTS", consistent.TESTS], "missing_audit_guard"), "missing audit");
await unchanged(() => write(wallets[1], "create_audit", ["x", "-", "short"], "invalid_audit_guard"), "invalid audit");

counts = await parse("get_counts");
if (counts.audit_count === 1) await write(wallets[1], "create_audit", ["SafeArchive CLI", "--safe-extract", "Documentation claims safe archive extraction, but the registered source digest is intentionally invalid."], "create_bad_digest");
if ((await parse("get_evidence", [1n, "DOCUMENTATION"])).error) {
  const bad = source("/fixtures/consistent/docs.md", "0".repeat(64));
  await write(wallets[0], "attach_evidence", [1n, "DOCUMENTATION", bad], "attach_bad_digest");
  await write(wallets[0], "attach_evidence", [1n, "IMPLEMENTATION", consistent.IMPLEMENTATION], "attach_bad_impl");
  await write(wallets[0], "attach_evidence", [1n, "TESTS", consistent.TESTS], "attach_bad_tests");
}
let badAudit = await parse("get_audit", [1n]);
if (badAudit.status === "DRAFT") await write(wallets[1], "seal_audit", [1n], "seal_bad_digest");
badAudit = await parse("get_audit", [1n]);
if (badAudit.status === "SEALED") await write(wallets[0], "assess_audit", [1n], "assess_bad_digest");
badAudit = await parse("get_audit", [1n]);
if (badAudit.verdict !== "SOURCE_UNVERIFIED") throw new Error(`Bad digest did not fail closed: ${JSON.stringify(badAudit)}`);

console.log(`wallet_a=${wallets[0].address}`);
console.log(`wallet_b=${wallets[1].address}`);
console.log(`happy=${JSON.stringify(audit)}`);
console.log(`bad_digest=${JSON.stringify(badAudit)}`);
console.log(`counts_after=${await read("get_counts")}`);
console.log(`transactions=${JSON.stringify(transactions)}`);
