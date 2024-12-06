export const idlFactory = ({ IDL }) => {
  const QuestionOption = IDL.Record({
    'option' : IDL.Nat,
    'description' : IDL.Text,
  });
  const Question = IDL.Record({
    'id' : IDL.Nat,
    'correctOption' : IDL.Nat,
    'description' : IDL.Text,
    'options' : IDL.Vec(QuestionOption),
  });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const Result = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  const Result_2 = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const ResourceType__1 = IDL.Variant({
    'Book' : IDL.Null,
    'Article' : IDL.Null,
    'Report' : IDL.Null,
    'Slides' : IDL.Null,
    'Video' : IDL.Null,
  });
  const SendMessageStatus = IDL.Variant({
    'Failed' : IDL.Text,
    'ThreadLock' : IDL.Record({ 'runId' : IDL.Text }),
    'Completed' : IDL.Record({ 'runId' : IDL.Text }),
  });
  const Result_3 = IDL.Variant({
    'ok' : SendMessageStatus,
    'err' : SendMessageStatus,
  });
  const CourseStatus__1 = IDL.Variant({
    'InFix' : IDL.Null,
    'Approved' : IDL.Null,
    'InReview' : IDL.Null,
    'Rejected' : IDL.Null,
  });
  const ResourceType = IDL.Variant({
    'Book' : IDL.Null,
    'Article' : IDL.Null,
    'Report' : IDL.Null,
    'Slides' : IDL.Null,
    'Video' : IDL.Null,
  });
  const Resource = IDL.Record({
    'id' : IDL.Nat,
    'url' : IDL.Text,
    'title' : IDL.Text,
    'description' : IDL.Text,
    'rType' : ResourceType,
  });
  const SharedCourseWithResources = IDL.Record({
    'id' : IDL.Nat,
    'status' : CourseStatus__1,
    'title' : IDL.Text,
    'reportCount' : IDL.Nat,
    'resources' : IDL.Vec(Resource),
    'summary' : IDL.Text,
    'enrolledCount' : IDL.Nat,
  });
  const Result_10 = IDL.Variant({
    'ok' : SharedCourseWithResources,
    'err' : IDL.Text,
  });
  const Result_7 = IDL.Variant({ 'ok' : IDL.Vec(Question), 'err' : IDL.Text });
  const SharedUser = IDL.Record({
    'id' : IDL.Nat,
    'country' : IDL.Text,
    'username' : IDL.Text,
    'state' : IDL.Text,
  });
  const Result_9 = IDL.Variant({ 'ok' : SharedUser, 'err' : IDL.Text });
  const MessgeType = IDL.Variant({ 'System' : IDL.Null, 'User' : IDL.Null });
  const Message__1 = IDL.Record({
    'content' : IDL.Text,
    'role' : MessgeType,
    'runId' : IDL.Opt(IDL.Text),
  });
  const Result_8 = IDL.Variant({ 'ok' : Message__1, 'err' : IDL.Text });
  const RunStatus__1 = IDL.Variant({
    'Failed' : IDL.Null,
    'Cancelled' : IDL.Null,
    'InProgress' : IDL.Null,
    'Completed' : IDL.Null,
    'Expired' : IDL.Null,
  });
  const Result_6 = IDL.Variant({ 'ok' : RunStatus__1, 'err' : IDL.Text });
  const ThreadRunJob = IDL.Variant({
    'Question' : IDL.Null,
    'Message' : IDL.Null,
  });
  const RunStatus = IDL.Variant({
    'Failed' : IDL.Null,
    'Cancelled' : IDL.Null,
    'InProgress' : IDL.Null,
    'Completed' : IDL.Null,
    'Expired' : IDL.Null,
  });
  const Time = IDL.Int;
  const SharedThreadRun = IDL.Record({
    'job' : ThreadRunJob,
    'status' : RunStatus,
    'lastExecuted' : IDL.Opt(Time),
    'timestamp' : Time,
    'threadId' : IDL.Text,
    'processing' : IDL.Bool,
    'runId' : IDL.Text,
  });
  const Message = IDL.Record({
    'content' : IDL.Text,
    'role' : MessgeType,
    'runId' : IDL.Opt(IDL.Text),
  });
  const SharedEnrolledCourse = IDL.Record({
    'id' : IDL.Nat,
    'messages' : IDL.Vec(Message),
    'completed' : IDL.Bool,
    'threadId' : IDL.Text,
  });
  const Result_5 = IDL.Variant({
    'ok' : SharedEnrolledCourse,
    'err' : IDL.Text,
  });
  const EnrolledCourseProgress = IDL.Record({
    'id' : IDL.Nat,
    'title' : IDL.Text,
    'completed' : IDL.Bool,
  });
  const Result_4 = IDL.Variant({
    'ok' : IDL.Vec(EnrolledCourseProgress),
    'err' : IDL.Text,
  });
  const SharedCourse = IDL.Record({
    'id' : IDL.Nat,
    'status' : CourseStatus__1,
    'title' : IDL.Text,
    'reportCount' : IDL.Nat,
    'summary' : IDL.Text,
    'enrolledCount' : IDL.Nat,
  });
  const CourseStatus = IDL.Variant({
    'InFix' : IDL.Null,
    'Approved' : IDL.Null,
    'InReview' : IDL.Null,
    'Rejected' : IDL.Null,
  });
  const Report = IDL.Record({
    'id' : IDL.Nat,
    'upvotes' : IDL.Nat,
    'country' : IDL.Text,
    'owner' : IDL.Principal,
    'state' : IDL.Text,
    'details' : IDL.Text,
    'category' : IDL.Text,
    'image' : IDL.Vec(IDL.Nat8),
  });
  const SubmittedAnswer = IDL.Record({
    'option' : IDL.Nat,
    'questionId' : IDL.Nat,
  });
  const HttpHeader = IDL.Record({ 'value' : IDL.Text, 'name' : IDL.Text });
  const HttpResponsePayload = IDL.Record({
    'status' : IDL.Nat,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(HttpHeader),
  });
  const TransformArgs = IDL.Record({
    'context' : IDL.Vec(IDL.Nat8),
    'response' : HttpResponsePayload,
  });
  const CanisterHttpResponsePayload = IDL.Record({
    'status' : IDL.Nat,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(HttpHeader),
  });
  const Backend = IDL.Service({
    'addAcls' : IDL.Func([IDL.Principal], [], ['oneway']),
    'addQuestion' : IDL.Func([IDL.Nat, Question], [Result_1], []),
    'changeApiKey' : IDL.Func([IDL.Text], [], ['oneway']),
    'changeOwner' : IDL.Func([IDL.Text], [], ['oneway']),
    'createCourse' : IDL.Func([IDL.Text, IDL.Text], [Result], []),
    'createReport' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Vec(IDL.Nat8)],
        [Result_2],
        [],
      ),
    'createResource' : IDL.Func(
        [IDL.Nat, IDL.Text, IDL.Text, IDL.Text, ResourceType__1],
        [Result_1],
        [],
      ),
    'enrollCourse' : IDL.Func([IDL.Nat], [Result_1], []),
    'generateCourse' : IDL.Func([IDL.Text, IDL.Text], [IDL.Text], []),
    'generateQuestionsForCourse' : IDL.Func([IDL.Nat], [Result_3], []),
    'generateRandomNumber' : IDL.Func([IDL.Nat], [IDL.Nat], []),
    'generateRandomNumberPrng' : IDL.Func([IDL.Nat], [IDL.Nat], ['query']),
    'getAcls' : IDL.Func([], [IDL.Vec(IDL.Principal)], ['query']),
    'getCourseDetails' : IDL.Func([IDL.Nat], [Result_10], ['query']),
    'getCourseQuestions' : IDL.Func([IDL.Nat], [Result_7], ['query']),
    'getOwner' : IDL.Func([], [IDL.Principal], ['query']),
    'getProfile' : IDL.Func([], [Result_9], []),
    'getRandomCourseQuestions' : IDL.Func([IDL.Nat, IDL.Nat], [Result_7], []),
    'getRunMessage' : IDL.Func([IDL.Text], [Result_8], []),
    'getRunMessage2' : IDL.Func([IDL.Text, IDL.Nat], [Result_8], []),
    'getRunQuestions' : IDL.Func([IDL.Text], [Result_7], []),
    'getRunStatus' : IDL.Func([IDL.Text], [Result_6], ['query']),
    'getRunsInQueue' : IDL.Func([], [IDL.Vec(SharedThreadRun)], ['query']),
    'getUserEnrolledCourse' : IDL.Func([IDL.Nat], [Result_5], []),
    'getUserEnrolledCourses' : IDL.Func([], [Result_4], []),
    'get_icrc1_token_canister_id' : IDL.Func([], [IDL.Text], ['query']),
    'listCourses' : IDL.Func([], [IDL.Vec(SharedCourse)], ['query']),
    'listCoursesByStatus' : IDL.Func(
        [CourseStatus],
        [IDL.Vec(SharedCourse)],
        ['query'],
      ),
    'listReports' : IDL.Func([IDL.Text], [IDL.Vec(Report)], ['query']),
    'registerUser' : IDL.Func([IDL.Text, IDL.Text, IDL.Text], [Result_1], []),
    'removeAcls' : IDL.Func([IDL.Principal], [Result_2], []),
    'removeQuestion' : IDL.Func([IDL.Nat, IDL.Nat], [Result_2], []),
    'removeResource' : IDL.Func([IDL.Nat, IDL.Nat], [Result_2], []),
    'sendThreadMessage' : IDL.Func([IDL.Text, IDL.Text], [Result_3], []),
    'setAssistantId' : IDL.Func([IDL.Text], [], ['oneway']),
    'setRunProcess' : IDL.Func([IDL.Text, IDL.Bool], [], ['oneway']),
    'set_icrc1_token_canister' : IDL.Func([IDL.Text], [Result_2], []),
    'submitQuestionsAttempt' : IDL.Func(
        [IDL.Nat, IDL.Vec(SubmittedAnswer)],
        [Result_1],
        [],
      ),
    'transform' : IDL.Func(
        [TransformArgs],
        [CanisterHttpResponsePayload],
        ['query'],
      ),
    'updateCourse' : IDL.Func(
        [IDL.Nat, IDL.Text, IDL.Text, CourseStatus],
        [Result_1],
        [],
      ),
    'upvoteReport' : IDL.Func([IDL.Nat], [Result], []),
  });
  return Backend;
};
export const init = ({ IDL }) => { return []; };
