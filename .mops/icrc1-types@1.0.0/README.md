# icrc1-types

[![mops](https://oknww-riaaa-aaaam-qaf6a-cai.raw.ic0.app/badge/mops/icrc1-types)](https://mops.one/icrc1-types)
[![documentation](https://oknww-riaaa-aaaam-qaf6a-cai.raw.ic0.app/badge/documentation/icrc1-types)](https://mops.one/icrc1-types/docs)

[ICRC-1](https://github.com/dfinity/ICRC-1/tree/main/standards/ICRC-1) canister interface for Motoko.

## Install
```
mops add icrc1-types
```

## Usage

Get the balance of `r7inp-6aaaa-aaaaa-aaabq-cai` account on the `ryjl3-tyaaa-aaaaa-aaaba-cai` (ICP) canister.

```motoko
import ICRC1 "mo:icrc1-types";

let icp = actor("ryjl3-tyaaa-aaaaa-aaaba-cai") : ICRC1.Service;

let balance = await icp.icrc1_balance_of({
  owner = Principal.fromText("r7inp-6aaaa-aaaaa-aaabq-cai");
  subaccount = null;
});
```