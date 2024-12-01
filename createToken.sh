#!/bin/bash

export PRE_MINTED_TOKENS=10_000_000_000_000
//dfx identity use default//
export DEFAULT=$(dfx identity get-principal)

export TRANSFER_FEE=10_000

dfx identity new archive_controller
dfx identity use archive_controller
export ARCHIVE_CONTROLLER=$(dfx identity get-principal)

export TRIGGER_THRESHOLD=2000

export CYCLE_FOR_ARCHIVE_CREATION=10000000000000

export NUM_OF_BLOCK_TO_ARCHIVE=1000

export TOKEN_NAME="Unkorrupt"

export TOKEN_SYMBOL="UNK"

# Make the canister the minter so can mint new tokens to users
export MINTER=$(dfx canister id UN_backend --ic)

export FEATURE_FLAGS=true

dfx identity use DevJourney
dfx start --clean --background
dfx deploy icrc1_ledger_canister --argument "(variant {Init =
record {
     token_symbol = \"${TOKEN_SYMBOL}\";
     token_name = \"${TOKEN_NAME}\";
     minting_account = record { owner = principal \"${MINTER}\" };
     transfer_fee = ${TRANSFER_FEE};
     metadata = vec {};
     feature_flags = opt record{icrc2 = ${FEATURE_FLAGS}};
     initial_balances = vec { record { record { owner = principal \"${DEFAULT}\"; }; ${PRE_MINTED_TOKENS}; }; };
     archive_options = record {
         num_blocks_to_archive = ${NUM_OF_BLOCK_TO_ARCHIVE};
         trigger_threshold = ${TRIGGER_THRESHOLD};
         controller_id = principal \"${ARCHIVE_CONTROLLER}\";
         cycles_for_archive_creation = opt ${CYCLE_FOR_ARCHIVE_CREATION};
     };
 }
})" --network ic
moncm-xhwy2-4clkt-pr3qp-ndzhp-irwng-lmlj3-5myps-45z73-u54iv-mae
3q2ak-3juch-whtsj-xdkao-ktb2i-gpa6n-uhgzc-zp7vf-sygw7-nrj2j-hqe
