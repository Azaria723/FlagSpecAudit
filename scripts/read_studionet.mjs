import { createClient } from "../frontend/node_modules/genlayer-js/dist/index.js";
import { studionet } from "../frontend/node_modules/genlayer-js/dist/chains/index.js";

const contract = process.env.CONTRACT_ADDRESS;
if (!/^0x[0-9a-fA-F]{40}$/.test(contract || "")) throw new Error("Set CONTRACT_ADDRESS");
const client = createClient({ chain: studionet });
const read = (functionName, args = []) => client.readContract({ address: contract, functionName, args });

console.log(`contract=${contract}`);
console.log(`counts=${await read("get_counts")}`);
