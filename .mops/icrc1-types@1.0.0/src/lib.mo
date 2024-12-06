module {
	public type SupportedStandards = [{
		url : Text;
		name : Text;
	}];
	public type Account = { owner : Principal; subaccount : ?Subaccount };
	public type Subaccount = Blob;
	public type Timestamp = Nat64;
	public type TransferArgs = {
		to : Account;
		fee : ?Nat;
		memo : ?Blob;
		from_subaccount : ?Subaccount;
		created_at_time : ?Timestamp;
		amount : Nat;
	};
	public type TransferResult = {
		#Ok : Nat;
		#Err : TransferError;
	};
	public type TransferError = {
		#GenericError : { message : Text; error_code : Nat };
		#TemporarilyUnavailable;
		#BadBurn : { min_burn_amount : Nat };
		#Duplicate : { duplicate_of : Nat };
		#BadFee : { expected_fee : Nat };
		#CreatedInFuture : { ledger_time : Timestamp };
		#TooOld;
		#InsufficientFunds : { balance : Nat };
	};
	public type Metadata = [(Text, Value)];
	public type Value = { #Int : Int; #Nat : Nat; #Blob : Blob; #Text : Text };

	public type Service = actor {
		icrc1_supported_standards : shared query () -> async SupportedStandards;
		icrc1_name : shared query () -> async Text;
		icrc1_symbol : shared query () -> async Text;
		icrc1_decimals : shared query () -> async Nat8;
		icrc1_fee : shared query () -> async Nat;
		icrc1_metadata : shared query () -> async Metadata;
		icrc1_minting_account : shared query () -> async ?Account;

		icrc1_total_supply : shared query () -> async Nat;
		icrc1_balance_of : shared query Account -> async Nat;
		icrc1_transfer : shared TransferArgs -> async TransferResult;
	};
};