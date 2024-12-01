import ICRC1 "mo:icrc1-types";
import Sha256 "mo:sha2/Sha256";
import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Nat8 "mo:base/Nat8";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Result "mo:base/Result";
import JSON "mo:json.mo";
import Types "types";
import Vector "mo:vector";

module Utils {
  type Result<A, B> = Result.Result<A, B>;
  type Model = {
    id : Nat;
  };

  type ModelConvertible = {
    #resource : Vector.Vector<Types.Resource>;
    #question : Vector.Vector<Types.Question>;
  };

  public func resourceEqual(a : Types.Resource, b : Types.Resource) : Bool {
    return a.id == b.id;
  };

  public func questionEqual(a : Types.Question, b : Types.Question) : Bool {
    return a.id == b.id;
  };

  public func vecContains(x : ModelConvertible, id : Nat) : Bool {
    switch (x) {
      case (#resource(v)) {
        for (k in Vector.vals(v)) {
          if (k.id == id) {
            return true;
          };
        };
      };
      case (#question(v)) {
        for (k in Vector.vals(v)) {
          if (k.id == id) {
            return true;
          };
        };
      };
    };
    return false;
  };

  public func createIcrcActor(canisterId : Text) : async ICRC1.Service {
    actor (canisterId);
  };

  public func computeUserSubaccountAccount(p : Principal) : Blob {
    Sha256.fromArray(#sha256, Array.flatten([[0x04 : Nat8], Blob.toArray(Text.encodeUtf8("user")), Blob.toArray(Principal.toBlob(p))]));
  };

  public func getAccountUserSubaccount({
    canisterId : Principal;
    user : Principal;
  }) : ICRC1.Account {
    { owner = canisterId; subaccount = ?(computeUserSubaccountAccount(user)) };
  };

  // public func threadFilter(k : Text, v : Types.ThreadRun) : Bool {

  // };
};
