import type { Principal } from "@dfinity/principal";
import type { Agent, HttpAgent, Identity } from "@dfinity/agent";
import { StoicIdentity } from "ic-stoic-identity";
import { AuthClient } from "@dfinity/auth-client";
import {
  backend,
} from "../../declarations/backend";

declare global {
  interface Window {
    ic: {
      plug: {
        agent: HttpAgent;
        sessionManager: {
          sessionData: {
            accountId: string;
          };
        };
        getPrincipal: () => Promise<Principal>;
        deleteAgent: () => void;
        requestConnect: (options?: {
          whitelist?: string[];
          host?: string;
        }) => Promise<any>;
        createActor: (options: {}) => Promise<typeof backend>;
        isConnected: () => Promise<boolean>;
        disconnect: () => Promise<boolean>;
        createAgent: (args?: {
          whitelist: string[];
          host?: string;
        }) => Promise<Agent | undefined>;
        requestBalance: () => Promise<
          Array<{
            amount: number;
            canisterId: string | null;
            image: string;
            name: string;
            symbol: string;
            value: number | null;
          }>
        >;
        requestTransfer: (arg: {
          to: string;
          amount: number;
          opts?: {
            fee?: number;
            memo?: string;
            from_subaccount?: number;
            created_at_time?: {
              timestamp_nanos: number;
            };
          };
        }) => Promise<{ height: number }>;
      };
      infinityWallet: {
        getPrincipal: () => Promise<Principal>;
        requestConnect: (options?: {
          whitelist?: string[];
          //host?: string;
        }) => Promise<any>;
        createActor: (options: {
          canisterId: string;
          interfaceFactory: any;
          host?: string;
        }) => Promise<typeof backend>;
        isConnected: () => Promise<boolean>;
        getUserAssets: () => Promise<any>;
        batchTransactions: () => Promise<any>;
      };
    };
  }
}
