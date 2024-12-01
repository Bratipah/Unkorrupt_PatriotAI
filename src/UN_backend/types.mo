import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import Nat64 "mo:base/Nat64";
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Vector "mo:vector";
import JSON "mo:json.mo";

module {
  public type Vector<T> = Vector.Vector<T>;
  public type Result<A, B> = Result.Result<A, B>;

  public let INVALID_CANISTER_ID = "invalid!canister!id";

  public type User = {
    id : Nat;
    username : Text;
    country : Text;
    state : Text;
    enrolledCourses : Vector<EnrolledCourse>;
  };

  public type EnrolledCourse = {
    id : Nat;
    threadId : Text;
    completed : Bool;
    messages : Vector<Message>;
  };

  public type SharedEnrolledCourse = {
    id : Nat;
    threadId : Text;
    completed : Bool;
    messages : [Message];
  };

  public type EnrolledCourseProgress = {
    id : Nat;
    title : Text;
    completed : Bool;
  };

  public type RunStatus = {
    #InProgress;
    #Completed;
    #Failed;
    #Cancelled;
    #Expired;
  };

  public type ThreadRunJob = {
    #Message;
    #Question;
  };

  public type ThreadRun = {
    runId : Text;
    threadId : Text;
    status : RunStatus;
    timestamp : Time.Time;
    lastExecuted : ?Time.Time;
    job : ThreadRunJob;
    var processing : Bool;
  };

  public type SharedThreadRun = {
    runId : Text;
    threadId : Text;
    status : RunStatus;
    timestamp : Time.Time;
    lastExecuted : ?Time.Time;
    job : ThreadRunJob;
    processing : Bool;
  };

  public type MessgeType = {
    #User;
    #System;
  };

  public type Message = {
    runId : ?Text;
    content : Text;
    role : MessgeType;
  };

  public type SendMessageStatus = {
    #Completed : {
      runId : Text;
    };
    #ThreadLock : {
      runId : Text;
    };
    #Failed : Text;
  };

  public type SharedUser = {
    id : Nat;
    username : Text;
    country : Text;
    state : Text;
  };

  public type CourseStatus = {
    #InReview;
    #Approved;
    #Rejected;
    #InFix;
  };

  public type Course = {
    id : Nat;
    title : Text;
    summary : Text;
    enrolledCount : Nat;
    reportCount : Nat;
    status : CourseStatus;
    resources : Vector<Resource>;
    questions : Vector<Question>;
    nextQuestionId : Nat;
    nextResourceId : Nat;
  };

  public type SharedCourse = {
    id : Nat;
    title : Text;
    summary : Text;
    enrolledCount : Nat;
    reportCount : Nat;
    status : CourseStatus;
  };

  public type SharedCourseWithResources = {
    id : Nat;
    title : Text;
    summary : Text;
    enrolledCount : Nat;
    reportCount : Nat;
    status : CourseStatus;
    resources : [Resource];
  };

  public type ResourceType = {
    #Book;
    #Video;
    #Article;
    #Slides;
    #Report;
  };

  public type Resource = {
    id : Nat;
    title : Text;
    description : Text;
    url : Text;
    rType : ResourceType;
  };

  public type Question = {
    id : Nat;
    description : Text;
    options : [QuestionOption];
    correctOption : Nat;
  };

  public type QuestionOption = {
    option : Nat;
    description : Text;
  };

  public type SubmittedAnswer = {
    questionId : Nat;
    option : Nat;
  };

  // Report types
  public type Report = {
    id : Nat;
    country : Text;
    state : Text;
    details : Text;
    category : Text;
    image : Blob;
    upvotes : Nat;
    owner : Principal;
  };

  // HTTP Request types
  public type Timestamp = Nat64;

  public type HttpRequestArgs = {
    url : Text;
    max_response_bytes : ?Nat64;
    headers : [HttpHeader];
    body : ?[Nat8];
    method : HttpMethod;
    transform : ?TransformRawResponseFunction;
  };

  public type HttpHeader = {
    name : Text;
    value : Text;
  };

  public type HttpMethod = {
    #get;
    #post;
    #head;
  };

  public type HttpResponsePayload = {
    status : Nat;
    headers : [HttpHeader];
    body : [Nat8];
  };

  public type HttpReponse = {
    status : Nat;
    body : JSON.JSON;
  };

  public type TransformFn = shared query TransformArgs -> async HttpResponsePayload;

  public type TransformRawResponseFunction = {
    function : TransformFn;
    context : Blob;
  };

  public type TransformArgs = {
    response : HttpResponsePayload;
    context : Blob;
  };

  public type CanisterHttpResponsePayload = {
    status : Nat;
    headers : [HttpHeader];
    body : [Nat8];
  };

  public type TransformContext = {
    function : TransformFn;
    context : Blob;
  };

  public type IC = actor {
    http_request : HttpRequestArgs -> async HttpResponsePayload;
  };
};
