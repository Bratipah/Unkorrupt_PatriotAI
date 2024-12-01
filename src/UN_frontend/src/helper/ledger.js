import { IcrcLedgerCanister } from "@dfinity/ledger-icrc";
import { createAgent } from "@dfinity/utils";
import { createClient } from "./auth";
import { UN_backend } from "../../../declarations/UN_backend";

/**
 * Create an ICRC ledger canister
 */
export async function createLedgerCanister() {
  const client = await createClient();

  if (!client.isAuthenticated()) {
    throw new Error("User not authenticated");
  }

  const MY_LEDGER_CANISTER_ID =
    await UN_backend.get_icrc1_token_canister_id();
  
  const agent = await createAgent({
    identity: client.getIdentity(),
    host: process.env.DFX_NETWORK !== 'ic' ? `http://localhost:4943` : undefined,
    fetchRootKey: true,
  });

  return IcrcLedgerCanister.create({
    agent,
    canisterId: MY_LEDGER_CANISTER_ID,
  });
}
