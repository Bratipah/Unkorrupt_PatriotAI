import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Backend {
  'addAcls' : ActorMethod<[Principal], undefined>,
  'addQuestion' : ActorMethod<[bigint, Question], Result_1>,
  'changeApiKey' : ActorMethod<[string], undefined>,
  'changeOwner' : ActorMethod<[string], undefined>,
  'createCourse' : ActorMethod<[string, string], Result>,
  'createReport' : ActorMethod<
    [string, string, string, string, Uint8Array | number[]],
    Result_2
  >,
  'createResource' : ActorMethod<
    [bigint, string, string, string, ResourceType__1],
    Result_1
  >,
  'enrollCourse' : ActorMethod<[bigint], Result_1>,
  'generateCourse' : ActorMethod<[string, string], string>,
  'generateQuestionsForCourse' : ActorMethod<[bigint], Result_3>,
  'generateRandomNumber' : ActorMethod<[bigint], bigint>,
  'generateRandomNumberPrng' : ActorMethod<[bigint], bigint>,
  'getAcls' : ActorMethod<[], Array<Principal>>,
  'getCourseDetails' : ActorMethod<[bigint], Result_10>,
  'getCourseQuestions' : ActorMethod<[bigint], Result_7>,
  'getOwner' : ActorMethod<[], Principal>,
  'getProfile' : ActorMethod<[], Result_9>,
  'getRandomCourseQuestions' : ActorMethod<[bigint, bigint], Result_7>,
  'getRunMessage' : ActorMethod<[string], Result_8>,
  'getRunMessage2' : ActorMethod<[string, bigint], Result_8>,
  'getRunQuestions' : ActorMethod<[string], Result_7>,
  'getRunStatus' : ActorMethod<[string], Result_6>,
  'getRunsInQueue' : ActorMethod<[], Array<SharedThreadRun>>,
  'getUserEnrolledCourse' : ActorMethod<[bigint], Result_5>,
  'getUserEnrolledCourses' : ActorMethod<[], Result_4>,
  'get_icrc1_token_canister_id' : ActorMethod<[], string>,
  'listCourses' : ActorMethod<[], Array<SharedCourse>>,
  'listCoursesByStatus' : ActorMethod<[CourseStatus], Array<SharedCourse>>,
  'listReports' : ActorMethod<[string], Array<Report>>,
  'registerUser' : ActorMethod<[string, string, string], Result_1>,
  'removeAcls' : ActorMethod<[Principal], Result_2>,
  'removeQuestion' : ActorMethod<[bigint, bigint], Result_2>,
  'removeResource' : ActorMethod<[bigint, bigint], Result_2>,
  'sendThreadMessage' : ActorMethod<[string, string], Result_3>,
  'setAssistantId' : ActorMethod<[string], undefined>,
  'setRunProcess' : ActorMethod<[string, boolean], undefined>,
  'set_icrc1_token_canister' : ActorMethod<[string], Result_2>,
  'submitQuestionsAttempt' : ActorMethod<
    [bigint, Array<SubmittedAnswer>],
    Result_1
  >,
  'transform' : ActorMethod<[TransformArgs], CanisterHttpResponsePayload>,
  'updateCourse' : ActorMethod<
    [bigint, string, string, CourseStatus],
    Result_1
  >,
  'upvoteReport' : ActorMethod<[bigint], Result>,
}
export interface CanisterHttpResponsePayload {
  'status' : bigint,
  'body' : Uint8Array | number[],
  'headers' : Array<HttpHeader>,
}
export type CourseStatus = { 'InFix' : null } |
  { 'Approved' : null } |
  { 'InReview' : null } |
  { 'Rejected' : null };
export type CourseStatus__1 = { 'InFix' : null } |
  { 'Approved' : null } |
  { 'InReview' : null } |
  { 'Rejected' : null };
export interface EnrolledCourseProgress {
  'id' : bigint,
  'title' : string,
  'completed' : boolean,
}
export interface HttpHeader { 'value' : string, 'name' : string }
export interface HttpResponsePayload {
  'status' : bigint,
  'body' : Uint8Array | number[],
  'headers' : Array<HttpHeader>,
}
export interface Message {
  'content' : string,
  'role' : MessgeType,
  'runId' : [] | [string],
}
export interface Message__1 {
  'content' : string,
  'role' : MessgeType,
  'runId' : [] | [string],
}
export type MessgeType = { 'System' : null } |
  { 'User' : null };
export interface Question {
  'id' : bigint,
  'correctOption' : bigint,
  'description' : string,
  'options' : Array<QuestionOption>,
}
export interface QuestionOption { 'option' : bigint, 'description' : string }
export interface Report {
  'id' : bigint,
  'upvotes' : bigint,
  'country' : string,
  'owner' : Principal,
  'state' : string,
  'details' : string,
  'category' : string,
  'image' : Uint8Array | number[],
}
export interface Resource {
  'id' : bigint,
  'url' : string,
  'title' : string,
  'description' : string,
  'rType' : ResourceType,
}
export type ResourceType = { 'Book' : null } |
  { 'Article' : null } |
  { 'Report' : null } |
  { 'Slides' : null } |
  { 'Video' : null };
export type ResourceType__1 = { 'Book' : null } |
  { 'Article' : null } |
  { 'Report' : null } |
  { 'Slides' : null } |
  { 'Video' : null };
export type Result = { 'ok' : bigint } |
  { 'err' : string };
export type Result_1 = { 'ok' : string } |
  { 'err' : string };
export type Result_10 = { 'ok' : SharedCourseWithResources } |
  { 'err' : string };
export type Result_2 = { 'ok' : null } |
  { 'err' : string };
export type Result_3 = { 'ok' : SendMessageStatus } |
  { 'err' : SendMessageStatus };
export type Result_4 = { 'ok' : Array<EnrolledCourseProgress> } |
  { 'err' : string };
export type Result_5 = { 'ok' : SharedEnrolledCourse } |
  { 'err' : string };
export type Result_6 = { 'ok' : RunStatus__1 } |
  { 'err' : string };
export type Result_7 = { 'ok' : Array<Question> } |
  { 'err' : string };
export type Result_8 = { 'ok' : Message__1 } |
  { 'err' : string };
export type Result_9 = { 'ok' : SharedUser } |
  { 'err' : string };
export type RunStatus = { 'Failed' : null } |
  { 'Cancelled' : null } |
  { 'InProgress' : null } |
  { 'Completed' : null } |
  { 'Expired' : null };
export type RunStatus__1 = { 'Failed' : null } |
  { 'Cancelled' : null } |
  { 'InProgress' : null } |
  { 'Completed' : null } |
  { 'Expired' : null };
export type SendMessageStatus = { 'Failed' : string } |
  { 'ThreadLock' : { 'runId' : string } } |
  { 'Completed' : { 'runId' : string } };
export interface SharedCourse {
  'id' : bigint,
  'status' : CourseStatus__1,
  'title' : string,
  'reportCount' : bigint,
  'summary' : string,
  'enrolledCount' : bigint,
}
export interface SharedCourseWithResources {
  'id' : bigint,
  'status' : CourseStatus__1,
  'title' : string,
  'reportCount' : bigint,
  'resources' : Array<Resource>,
  'summary' : string,
  'enrolledCount' : bigint,
}
export interface SharedEnrolledCourse {
  'id' : bigint,
  'messages' : Array<Message>,
  'completed' : boolean,
  'threadId' : string,
}
export interface SharedThreadRun {
  'job' : ThreadRunJob,
  'status' : RunStatus,
  'lastExecuted' : [] | [Time],
  'timestamp' : Time,
  'threadId' : string,
  'processing' : boolean,
  'runId' : string,
}
export interface SharedUser {
  'id' : bigint,
  'country' : string,
  'username' : string,
  'state' : string,
}
export interface SubmittedAnswer { 'option' : bigint, 'questionId' : bigint }
export type ThreadRunJob = { 'Question' : null } |
  { 'Message' : null };
export type Time = bigint;
export interface TransformArgs {
  'context' : Uint8Array | number[],
  'response' : HttpResponsePayload,
}
export interface _SERVICE extends Backend {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
