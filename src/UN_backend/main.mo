import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Text "mo:base/Text";
import Float "mo:base/Float";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Types "types";
import Request "request";
import Map "mo:map/Map";
import { hash } "mo:base/Hash";
import { phash; thash; nhash } "mo:map/Map";
import Vector "mo:vector";
import Random "mo:base/Random";
import Blob "mo:base/Blob";
import Error "mo:base/Error";
import Debug "mo:base/Debug";
import Time "mo:base/Time";
import JSON "mo:json.mo";
import ICRC1 "mo:icrc1-types";
import Utils "utils";
import serdeJson "mo:serde/JSON";
import { recurringTimer } = "mo:base/Timer";
import Prng "mo:prng";

shared ({ caller }) actor class Backend() {
  type Result<A, B> = Types.Result<A, B>;
  type SharedCourseWithResources = Types.SharedCourseWithResources;
  type SharedCourse = Types.SharedCourse;
  type User = Types.User;
  type SharedUser = Types.SharedUser;
  type Course = Types.Course;
type coursedetails = Types.course 
  type Question = Types.Question;
  type ResourceType = Types.ResourceType;
  type CourseStatus = Types.CourseStatus;
  type QuestionOption = Types.QuestionOption;
  type Resource = Types.Resource;
  type EnrolledCourse = Types.EnrolledCourse;
  type SharedEnrolledCourse = Types.SharedEnrolledCourse;
  type SubmittedAnswer = Types.SubmittedAnswer;
  type Report = Types.Report;
  type RunStatus = Types.RunStatus;
  type ThreadRun = Types.ThreadRun;
  type SendMessageStatus = Types.SendMessageStatus;
  type Message = Types.Message;
  type SharedThreadRun = Types.SharedThreadRun;
  type EnrolledCourseProgress = Types.EnrolledCourseProgress;

  stable let members = Map.new<Principal, User>();
  stable let courses = Vector.new<Course>();
  stable let reports = Vector.new<Report>();
  stable let reportUpvotes = Vector.new<Vector.Vector<Principal>>();
  stable var threadRunQueue = Map.new<Text, ThreadRun>();
  stable var acls = Vector.new<Principal>();
  stable var courseThreads = Map.new<Nat, Text>();

  stable var nextUserId = 0;
  stable var nextCourseId = 0;
  stable var nextReportId = 0;
  stable var owner = caller;

  var icrc1Actor_ : ICRC1.Service = actor ("mxzaz-hqaaa-aaaar-qaada-cai");
  stable var icrc1TokenCanisterId_ : Text = Types.INVALID_CANISTER_ID;

  stable var API_KEY : Text = "";
  stable var ASSISTANT_ID : Text = "";

  stable var seed : Nat32 = 0;
  let rng = Prng.SFC32a(); // or Prng.SFC32b()

  private func _getInProgressThreadRuns(threadId : Text) : [ThreadRun] {
    let runs = Map.filter(
      threadRunQueue,
      thash,
      func(k : Text, v : ThreadRun) : Bool {
        return v.threadId == threadId and v.status == #InProgress;
      },
    );
    return Iter.toArray(Map.vals(runs));
  };

  private func _getCourse(courseId : Nat) : ?Course {
    Vector.getOpt(courses, courseId);
  };

  private func _getRandomNumber(range : Nat) : async Nat {
    assert range > 0;
    let seed = await Random.blob();
    let random = Random.Finite(seed);
    let val = random.range(32);
    switch (val) {
      case (null) {
        return await _getRandomNumber(range);
      };
      case (?v) {
        let randN = Float.fromInt(v) / 4294967296;
        Debug.print("Random float: " # debug_show (randN));

        let div = Float.fromInt(range);
        Debug.print("Float int: " # debug_show (div));

        let num = Float.floor(randN * div);
        Debug.print("Generated number: " # debug_show (num));

        let toText = Text.trimEnd(Text.trimEnd(Float.toText(num), #char '0'), #char '.');
        Debug.print("To Text number: " # toText);

        let fromText = Nat.fromText(toText);
        Debug.print("From Text number: " # debug_show (fromText));

        switch (fromText) {
          case (?n) {
            return n;
          };
          case (null) {
            return 0;
          };
        };
      };
    };
  };

  private func _getRandomNumberUsingPrng(range : Nat) : Nat {
    assert range > 0;
    rng.init(Nat32.fromIntWrap(Time.now()));
    let val = Nat32.toNat(rng.next());
    let randN = val * range / 4294967296;
    Debug.print("Generated number: " # debug_show (randN));
    return randN;
  };

  private func _getRandomNumberUsingPrngWithSeed(range : Nat) : Nat {
    assert range > 0;
    seed := seed + 1;
    rng.init(Nat32.fromIntWrap(Time.now()) + seed);
    let val = Nat32.toNat(rng.next());
    let randN = val * range / 4294967296;
    Debug.print("Generated number: " # debug_show (randN) # " With seed " # debug_show(seed));
    return randN;
  };

  public shared ({ caller }) func generateRandomNumber(range : Nat) : async Nat {
    await _getRandomNumber(range);
  };

  public query func generateRandomNumberPrng(range: Nat) : async Nat {
    _getRandomNumberUsingPrng(range);
  };

  private func generateXUniqueRandomNumbers(x : Nat, range : Nat) : [Nat] {
    let vec = Vector.new<Nat>();
    var idx: Nat = 0;
    while (idx < x) {
      let n = _getRandomNumberUsingPrngWithSeed(range);
      let hasValue = Vector.forSome<Nat>(vec, func x { x == n });
      if (hasValue == false) {
        Vector.add(vec, n);
        idx := idx + 1;
      };
    };
    Vector.toArray(vec);
  };

  private func _isOwner(p : Principal) : Bool {
    Debug.print(Principal.toText(owner));
    Debug.print(Principal.toText(p));
    Debug.print(debug_show (Principal.toText(p) == Principal.toText(owner)));
    Principal.equal(owner, p);
  };

  private func _isAllowed(p : Principal) : Bool {
    if (_isOwner(p)) {
      return true;
    };
    for (k in Vector.vals(acls)) {
      if (Principal.equal(p, k)) {
        return true;
      };
    };
    return false;
  };

  // Get acls
  public query func getAcls() : async [Principal] {
    Vector.toArray(acls);
  };

  // Get owner
  public query func getOwner() : async Principal {
    owner;
  };

  // Add acls
  public shared ({ caller }) func addAcls(p : Principal) : () {
    assert _isOwner(caller);
    Vector.add(acls, p);
  };

  // Remove acls
  public shared ({ caller }) func removeAcls(p : Principal) : async Result<(), Text> {
    assert _isOwner(caller);
    let newAcls = Vector.new<Principal>();
    if (Vector.contains<Principal>(acls, p, Principal.equal) == false) {
      return #err("Principal not found");
    };
    for (k in Vector.vals(acls)) {
      if (Principal.notEqual(p, k)) {
        Vector.add(newAcls, k);
      };
    };
    acls := newAcls;
    #ok();
  };

  // get token canister id
  public query func get_icrc1_token_canister_id() : async Text {
    icrc1TokenCanisterId_;
  };

  // set icrc1 token canister
  public shared ({ caller }) func set_icrc1_token_canister(tokenCanisterId : Text) : async Result<(), Text> {
    if (_isAllowed(caller) == false) return #err("Not authorized");

    let icrc1Canister = try {
      #ok(await Utils.createIcrcActor(tokenCanisterId));
    } catch e #err(e);

    switch (icrc1Canister) {
      case (#ok(icrc1Actor)) {
        icrc1Actor_ := icrc1Actor;
        icrc1TokenCanisterId_ := tokenCanisterId;
        #ok;
      };
      case (#err(e)) {
        #err("Failed to instantiate icrc1 token canister from given id(" # tokenCanisterId # ") for reason " # Error.message(e));
      };
    };
  };

  public shared ({ caller }) func changeOwner(newOwner : Text) {
    assert _isOwner(caller);
    owner := Principal.fromText(newOwner);
  };

  // Set api key
  public shared ({ caller }) func changeApiKey(apiKey : Text) {
    assert _isAllowed(caller);
    API_KEY := apiKey;
  };

  // Set assistant id
  public shared ({ caller }) func setAssistantId(id : Text) {
    assert _isAllowed(caller);
    ASSISTANT_ID := id;
  };

  // List all courses
  public query func listCourses() : async [SharedCourse] {
    let filteredCourses = Vector.new<Types.SharedCourse>();
    for (course in Vector.vals(courses)) {
      let sharedCourse = {
        id = course.id;
        title = course.title;
        summary = course.summary;
        enrolledCount = course.enrolledCount;
        reportCount = course.reportCount;
        status = course.status;
      };
      Vector.add(filteredCourses, sharedCourse);
    };
    return Vector.toArray(filteredCourses);
  };

  // List all courses by status
  public query func listCoursesByStatus(status : CourseStatus) : async [SharedCourse] {
    let filteredCourses = Vector.new<Types.SharedCourse>();
    for (course in Vector.vals(courses)) {
      if (course.status == status) {
        let sharedCourse = {
          id = course.id;
          title = course.title;
          summary = course.summary;
          enrolledCount = course.enrolledCount;
          reportCount = course.reportCount;
          status = course.status;
        };
        Vector.add(filteredCourses, sharedCourse);
      };
    };
    return Vector.toArray(filteredCourses);
  };

  // Get user enrolled courses
  public shared ({ caller }) func getUserEnrolledCourses() : async Result<[EnrolledCourseProgress], Text> {
    let user = Map.get(members, phash, caller);
    switch (user) {
      case (?member) {
        let enrolledCourses = Vector.new<EnrolledCourseProgress>();
        for (enrolledCourse in Vector.vals(member.enrolledCourses)) {
          let course = _getCourse(enrolledCourse.id);
          switch (course) {
            case (?c) {
              let sharedCourse = {
                id = c.id;
                title = c.title;
                completed = enrolledCourse.completed;
              };
              Vector.add(enrolledCourses, sharedCourse);
            };
            case (null) {
              return #err("Course " # Nat.toText(enrolledCourse.id) # " not found");
            };
          };
        };
        return #ok(Vector.toArray(enrolledCourses));
      };
      case (null) {
        return #err("Member not found");
      };
    };
  };

  // Get user enrolled course details
  public shared ({ caller }) func getUserEnrolledCourse(courseId : Nat) : async Result<SharedEnrolledCourse, Text> {
    let user = Map.get(members, phash, caller);
    switch (user) {
      case (?member) {
        let course = _getCourse(courseId);
        switch (course) {
          case (?c) {
            for (_course in Vector.vals(member.enrolledCourses)) {
              if (_course.id == c.id) {
                let sharedCourse = {
                  id = _course.id;
                  threadId = _course.threadId;
                  completed = _course.completed;
                  messages = Vector.toArray(_course.messages);
                };
                return #ok(sharedCourse);
              };
            };
            return #err("Course enrolled successfully");
          };
          case (null) {
            return #err("Course " # Nat.toText(courseId) # " not found");
          };
        };
      };
      case (null) {
        return #err("Member not found");
      };
    };
  };

  // Get course details including resources
  public query func getCourseDetails(courseId : Nat) : async Result<SharedCourseWithResources, Text> {
    let course = _getCourse(courseId);
    switch (course) {
      case (?c) {
        let sharedCourse = {
          id = c.id;
          title = c.title;
          summary = c.summary;
          enrolledCount = c.enrolledCount;
          reportCount = c.reportCount;
          status = c.status;
          resources = Vector.toArray(c.resources);
        };
        return #ok(sharedCourse);
      };
      case (null) {
        return #err("Course " # Nat.toText(courseId) # " not found");
      };
    };
  };

  // Get random course questions
  public shared func getRandomCourseQuestions(courseId : Nat, questionCount : Nat) : async Result<[Question], Text> {
    let course = _getCourse(courseId);
    switch (course) {
      case (?c) {
        let questions = Vector.new<Question>();
        let len = Vector.size(c.questions);

        if (len == 0) {
          return #err("Course has no questions");
        };
        if (questionCount > len) {
          return #err("Question count " # Nat.toText(questionCount) # " is greater than the number of questions " # Nat.toText(len));
        };

        let choices = generateXUniqueRandomNumbers(questionCount, len);

        for (number in choices.vals()) {
          Debug.print("Random: " # debug_show (number));
          let question = Vector.get(c.questions, number);
          Vector.add(questions, question);
        };

        return #ok(Vector.toArray(questions));
      };
      case (null) {
        return #err("Course " # Nat.toText(courseId) # " not found");
      };
    };
  };

  // Register a new user
  public shared ({ caller }) func registerUser(username : Text, country : Text, state : Text) : async Result<Text, Text> {
    let user = Map.get(members, phash, caller);
    switch (user) {
      case (?_) {
        return #err("User already registered");
      };
      case (null) {
        let newUser = {
          id = nextUserId;
          username = username;
          country = country;
          state = state;
          enrolledCourses = Vector.new<EnrolledCourse>();
        };
        Map.set(members, phash, caller, newUser);
        nextUserId := nextUserId + 1;
        return #ok("User registered successfully");
      };
    };
  };

  // Get user profile
  public shared ({ caller }) func getProfile() : async Result<SharedUser, Text> {
    let user = Map.get(members, phash, caller);
    switch (user) {
      case (?member) {
        let sharedUser = {
          id = member.id;
          username = member.username;
          country = member.country;
          state = member.state;
        };
        return #ok(sharedUser);
      };
      case (null) {
        return #err("Member not found");
      };
    };
  };

  // Enroll in a course
  public shared ({ caller }) func enrollCourse(courseId : Nat) : async Result<Text, Text> {
    let user = Map.get(members, phash, caller);
    switch (user) {
      case (?member) {
        let course = _getCourse(courseId);
        switch (course) {
          case (?c) {
            for (_course in Vector.vals(member.enrolledCourses)) {
              if (_course.id == c.id) {
                return #ok("Course already enrolled");
              };
            };

            // Create thread
            let headers : ?[Types.HttpHeader] = ?[
              {
                name = "Authorization";
                value = "Bearer " # API_KEY;
              },
              {
                name = "OpenAI-Beta";
                value = "assistants=v2";
              },
              {
                name = "x-forwarded-host";
                value = "api.openai.com";
              },
            ];

            let response = await Request.post(
              "https://idempotent-proxy-cf-worker.zensh.workers.dev/v1/threads",
              null,
              transform,
              headers,
            );

            if (response.status != 200) {
              return #err("Failed to create thread");
            };

            var threadId = "";

            switch (response.body) {
              case (#Object(v)) {
                label findId for ((k, v) in v.vals()) {
                  if (k == "id") {
                    switch (v) {
                      case (#String(v)) {
                        threadId := v;
                        break findId;
                      };
                      case (_) {
                        return #err("Json parse failed");
                      };
                    };
                  };
                };
              };
              case (_) {
                return #err("Json parse failed");
              };
            };

            if (threadId == "") {
              return #err("Create thread failed");
            };

            let messages = Vector.new<Message>();
            let enrolledCourse = {
              id = c.id;
              completed = false;
              threadId = threadId;
              messages = messages;
            };
            Vector.add(member.enrolledCourses, enrolledCourse);

            // Update course enrolled count
            let updatedCourse = {
              id = c.id;
              title = c.title;
              summary = c.summary;
              enrolledCount = c.enrolledCount + 1;
              reportCount = c.reportCount;
              status = c.status;
              resources = c.resources;
              questions = c.questions;
              nextResourceId = c.nextResourceId;
              nextQuestionId = c.nextQuestionId;
            };
            Vector.put(courses, c.id, updatedCourse);

            return #ok("Course enrolled successfully");
          };
          case (null) {
            return #err("Course " # Nat.toText(courseId) # " not found");
          };
        };
      };
      case (null) {
        return #err("Member not found");
      };
    };
  };

  // Create a course
  public shared ({ caller }) func createCourse(title : Text, summary : Text) : async Result<Nat, Text> {
    assert _isAllowed(caller);

    let resources = Vector.new<Resource>();
    let questions = Vector.new<Question>();
    let course = {
      id = nextCourseId;
      title = title;
      summary = summary;
      enrolledCount = 0;
      reportCount = 0;
      status = #Approved;
      resources = resources;
      questions = questions;
      nextQuestionId = 0;
      nextResourceId = 0;
    };

    Vector.add(courses, course);
    nextCourseId := nextCourseId + 1;
    #ok(nextCourseId - 1);
  };

  // Create new resource for course
  public shared ({ caller }) func createResource(courseId : Nat, title : Text, description : Text, url : Text, rType : ResourceType) : async Result<Text, Text> {
    assert _isAllowed(caller);
    let course = _getCourse(courseId);
    switch (course) {
      case (?c) {
        let resource = {
          id = c.nextResourceId;
          title = title;
          description = description;
          url = url;
          rType = rType;
        };
        Vector.add(c.resources, resource);
        let updatedCourse = {
          id = c.id;
          title = c.title;
          summary = c.summary;
          enrolledCount = c.enrolledCount;
          reportCount = c.reportCount;
          status = c.status;
          resources = c.resources;
          questions = c.questions;
          nextResourceId = c.nextResourceId + 1;
          nextQuestionId = c.nextQuestionId;
        };
        Vector.put(courses, c.id, updatedCourse);
      };
      case (null) {
        return #err("Course " # Nat.toText(courseId) # " not found");
      };
    };
    return #ok("Resource created successfully");
  };

  // Remove resource from course
  public shared ({ caller }) func removeResource(courseId : Nat, resourceId : Nat) : async Result<(), Text> {
    assert _isAllowed(caller);
    let course = _getCourse(courseId);
    switch (course) {
      case (?c) {
        let contains = Utils.vecContains(#resource(c.resources), resourceId);
        if (contains == false) {
          return #err("Resource not found");
        };
        let newResources = Vector.new<Resource>();
        for (k in Vector.vals(c.resources)) {
          if (k.id != resourceId) {
            Vector.add(newResources, k);
          };
        };
        let updatedCourse = {
          id = c.id;
          title = c.title;
          summary = c.summary;
          enrolledCount = c.enrolledCount;
          reportCount = c.reportCount;
          status = c.status;
          resources = newResources;
          questions = c.questions;
          nextResourceId = c.nextResourceId;
          nextQuestionId = c.nextQuestionId;
        };
        Vector.put(courses, c.id, updatedCourse);
      };
      case (null) {
        return #err("Course " # Nat.toText(courseId) # " not found");
      };
    };
    #ok();
  };

  // Update course details
  public shared ({ caller }) func updateCourse(courseId : Nat, title : Text, summary : Text, status : CourseStatus) : async Result<Text, Text> {
    assert _isAllowed(caller);
    let course = _getCourse(courseId);
    switch (course) {
      case (?c) {
        let updatedCourse = {
          id = c.id;
          title = title;
          summary = summary;
          status = status;
          enrolledCount = c.enrolledCount;
          reportCount = c.reportCount;
          resources = c.resources;
          questions = c.questions;
          nextResourceId = c.nextResourceId;
          nextQuestionId = c.nextQuestionId;
        };
        Vector.put(courses, c.id, updatedCourse);
        return #ok("Course updated successfully");
      };
      case (null) {
        return #err("Course " # Nat.toText(courseId) # " not found");
      };
    };
  };

  // Add a question to a course
  public shared ({ caller }) func addQuestion(courseId : Nat, data : Question) : async Result<Text, Text> {
    assert _isAllowed(caller);
    let course = _getCourse(courseId);
    switch (course) {
      case (?c) {
        let question = {
          id = c.nextQuestionId;
          options = data.options;
          correctOption = data.correctOption;
          description = data.description;
        };
        Vector.add(c.questions, question);
        let updatedCourse = {
          id = c.id;
          title = c.title;
          summary = c.summary;
          enrolledCount = c.enrolledCount;
          reportCount = c.reportCount;
          status = c.status;
          resources = c.resources;
          questions = c.questions;
          nextResourceId = c.nextResourceId;
          nextQuestionId = c.nextQuestionId + 1;
        };
        Vector.put(courses, c.id, updatedCourse);
        return #ok("Question added successfully");
      };
      case (null) {
        return #err("Course " # Nat.toText(courseId) # " not found");
      };
    };
  };

  // Remove question from a course
  public shared ({ caller }) func removeQuestion(courseId : Nat, questionId : Nat) : async Result<(), Text> {
    assert _isAllowed(caller);
    let course = _getCourse(courseId);
    switch (course) {
      case (?c) {
        let contains = Utils.vecContains(#question(c.questions), questionId);
        if (contains == false) {
          return #err("Question not found");
        };
        let newQuestions = Vector.new<Question>();
        for (k in Vector.vals(c.questions)) {
          if (k.id != questionId) {
            Vector.add<Question>(newQuestions, k);
          };
        };
        let updatedCourse = {
          id = c.id;
          title = c.title;
          summary = c.summary;
          enrolledCount = c.enrolledCount;
          reportCount = c.reportCount;
          status = c.status;
          resources = c.resources;
          questions = newQuestions;
          nextResourceId = c.nextResourceId;
          nextQuestionId = c.nextQuestionId;
        };
        Vector.put(courses, c.id, updatedCourse);
      };
      case (null) {
        return #err("Course " # Nat.toText(courseId) # " not found");
      };
    };
    #ok();
  };

  // Submit questions attempt
  public shared ({ caller }) func submitQuestionsAttempt(courseId : Nat, answers : [SubmittedAnswer]) : async Result<Text, Text> {
    let user = Map.get(members, phash, caller);
    switch (user) {
      case (?member) {
        let course = _getCourse(courseId);
        switch (course) {
          case (?c) {

            var enrolledCourse : ?EnrolledCourse = null;

            label findCourse for (_course in Vector.vals(member.enrolledCourses)) {
              if (_course.id == c.id) {
                enrolledCourse := ?_course;
                break findCourse;
              };
            };

            switch (enrolledCourse) {
              case (null) {
                return #err("Course not enrolled");
              };
              case (?enrolledCourse) {

                let len = Vector.size(c.questions);
                if (len == 0) {
                  return #err("Course has no questions");
                };
                if (Array.size(answers) > len) {
                  return #err("Number of answers is greater than the number of questions");
                };

                var correctCount = 0;
                for (answer in answers.vals()) {
                  for (question in Vector.vals(c.questions)) {
                    if (question.id == answer.questionId) {
                      if (question.correctOption == answer.option) {
                        correctCount += 1;
                      };
                    };
                  };
                };

                if (correctCount != Array.size(answers)) {
                  return #err("You did not get all the questions, Try again");
                };

                var enrolledCourseIndex = 0;
                label findCourse for (i in Iter.range(0, Vector.size(member.enrolledCourses))) {
                  if (Vector.get(member.enrolledCourses, i).id == c.id) {
                    enrolledCourseIndex := i;
                    break findCourse;
                  };
                };

                let previousValue = Vector.get(member.enrolledCourses, enrolledCourseIndex);
                if (previousValue.completed) {
                  return #err("You have already completed this course before");
                };

                let icrc1Canister = try {
                  #ok(await Utils.createIcrcActor(icrc1TokenCanisterId_));
                } catch e #err(e);

                switch (icrc1Canister) {
                  case (#ok(icrc1Actor)) {
                    // Transfer tokens to user
                    // Make the icrc1 intercanister transfer call, catching if error'd:
                    let response : Result<ICRC1.TransferResult, Text> = try {
                      let decimal = 100000000;
                      #ok(await icrc1Actor.icrc1_transfer({ amount = 10 * decimal; created_at_time = null; from_subaccount = null; fee = null; memo = null; to = { owner = caller; subaccount = null } }));
                    } catch (e) {
                      #err(Error.message(e));
                    };

                    // Parse the results of the icrc1 intercansiter transfer call:
                    switch (response) {
                      case (#ok(transferResult)) {
                        switch (transferResult) {
                          case (#Ok _) {
                            // Updated enrolled course to completed
                            let updatedECourse : EnrolledCourse = {
                              id = enrolledCourse.id;
                              threadId = enrolledCourse.threadId;
                              completed = true;
                              messages = enrolledCourse.messages;
                            };
                            Vector.put(member.enrolledCourses, enrolledCourseIndex, updatedECourse);
                            // Update user object
                            Map.set(members, phash, caller, member);
                            return #ok("You have successfully completed the course");
                          };
                          case (#Err _) #err(
                            "The icrc1 transfer call could not be completed as requested."
                          );
                        };
                      };
                      case (#err(k)) {
                        #err(
                          "The intercanister icrc1 transfer call caught an error: " # k
                        );
                      };
                    };
                  };
                  case (#err(_)) {
                    #err("Internal transfer error");
                  };
                };

              };
            };
          };
          case (null) {
            return #err("Course " # Nat.toText(courseId) # " not found");
          };
        };
      };
      case (null) {
        return #err("Member not found");
      };
    };
  };

  // Send new message to a thread
  public shared ({ caller }) func sendThreadMessage(threadId : Text, prompt : Text) : async Result<SendMessageStatus, SendMessageStatus> {
    let user = Map.get(members, phash, caller);
    switch (user) {
      case (?member) {
        var enrolledCourse : ?EnrolledCourse = null;
        var enrolledCourseIdx = 0;

        label findCourseIdx for (_course in Vector.vals(member.enrolledCourses)) {
          if (_course.threadId == threadId) {
            enrolledCourse := ?_course;
            break findCourseIdx;
          };
          enrolledCourseIdx := enrolledCourseIdx + 1;
        };

        switch (enrolledCourse) {
          case (null) {
            return #err(#Failed("Enrolled course with thread id not found"));
          };
          case (?eCourse) {
            // Check if there is no pending run
            let inProgressRuns = _getInProgressThreadRuns(threadId);
            if (Array.size(inProgressRuns) > 0) {
              return #err(#ThreadLock({ runId = inProgressRuns[0].runId }));
            };

            var data = #Object([
              ("role", #String("user")),
              ("content", #String(prompt)),
            ]);

            let headers : ?[Types.HttpHeader] = ?[
              {
                name = "Authorization";
                value = "Bearer " # API_KEY;
              },
              {
                name = "OpenAI-Beta";
                value = "assistants=v2";
              },
              {
                name = "x-forwarded-host";
                value = "api.openai.com";
              },
            ];

            let response = await Request.post(
              "https://idempotent-proxy-cf-worker.zensh.workers.dev/v1/threads/" # threadId # "/messages",
              ?data,
              transform,
              headers,
            );

            if (response.status != 200) {
              return #err(#Failed("Failed to create message"));
            };

            let newMessage = {
              runId = null;
              content = prompt;
              role = #User;
            };

            Vector.add(eCourse.messages, newMessage);
            Vector.put(member.enrolledCourses, enrolledCourseIdx, eCourse);
            Map.set(members, phash, caller, member);

            // Create new run
            data := #Object([
              ("assistant_id", #String(ASSISTANT_ID)),
              ("instructions", #String("You are a helpful assistant, here to train users on the impacts of corruption and how to mitigate them based on the files you have been trained with and all your responses must be in markdown format")),
            ]);
            let runResponse = await Request.post(
              "https://idempotent-proxy-cf-worker.zensh.workers.dev/v1/threads/" # threadId # "/runs",
              ?data,
              transform,
              headers,
            );

            Debug.print(JSON.show(runResponse.body));

            var runId = "";

            switch (runResponse.body) {
              case (#Object(v)) {
                label findId for ((k, v) in v.vals()) {
                  if (k == "id") {
                    switch (v) {
                      case (#String(v)) {
                        runId := v;
                        break findId;
                      };
                      case (_) {
                        return #err(#Failed("Json parse failed"));
                      };
                    };
                  };
                };
              };
              case (_) {
                return #err(#Failed("Json parse failed"));
              };
            };

            if (runId == "") {
              return #err(#Failed("Run failed"));
            };

            let threadRun = {
              runId = runId;
              threadId = threadId;
              status = #InProgress;
              timestamp = Time.now();
              lastExecuted = null;
              var processing = false;
              job = #Message;
            };

            Map.set<Text, ThreadRun>(threadRunQueue, thash, runId, threadRun);
            return #ok(#Completed({ runId = runId }));
          };
        };
      };
      case (null) {
        return #err(#Failed("Member not found"));
      };
    };

  };

  // Get run id status
  public query func getRunStatus(runId : Text) : async Result<RunStatus, Text> {
    let run = Map.get(threadRunQueue, thash, runId);
    switch (run) {
      case (null) {
        #err("Run ID not found");
      };
      case (?r) {
        #ok(r.status);
      };
    };
  };

  // Get run message
  public shared ({ caller }) func getRunMessage2(runId : Text, courseId : Nat) : async Result<Message, Text> {
    let user = Map.get(members, phash, caller);
    switch (user) {
      case (?member) {
        for (c in Vector.vals(member.enrolledCourses)) {
          if (c.id == courseId) {
            let run = Map.get(threadRunQueue, thash, runId);
            switch (run) {
              case (null) {
                return #err("Run ID not found");
              };
              case (?r) {
                for (k in Vector.vals(c.messages)) {
                  switch (k.runId) {
                    case (null) {};
                    case (?id) {
                      if (id == runId) {
                        return #ok(k);
                      };
                    };
                  };
                };
                return #err("No message with run id");
              };
            };
          };
        };
        #err("Course not enrolled");
      };
      case (null) {
        #err("Member not found");
      };
    };
  };

  // Make call to AI model
  public shared func generateCourse(title : Text, description : Text) : async Text {
    let prompt = "Create a detailed course description in JSON format for a course titled "
    # title
    # ". Include a description and recommended resources (books, articles, videos, slides, reports),"
    # "Note: This data should be taken from live and verified sources online. Every Url generated should point to active working URL."
    # "IMPORTANT: Return only the valid json format, no extra text, just the json file, don't explain"
    # "JSON Structure:"
    # "title: " # title
    # "description: " # description
    # "resources: An array of objects, each containing title, description, URL, and resource type (Book, Article, Video, Slides, Report)."
    # " Don't add the ```json``` text"
    # "{"
    # "'title': '',"
    # "'description': '',"
    # "'resources': ["
    # "{"
    # "'title': '',"
    # "'description': '',"
    # "'url': '',"
    # "'rType': 'Book | Article | Video | Slides | Report'"
    # "}"
    # "]"
    # "}";
    let model = "gpt-4o-mini";
    let data : JSON.JSON = #Object([
      ("model", #String(model)),
      ("messages", #Array([#Object([("role", #String("system")), ("content", #String("You are a helpful assistant."))]), #Object([("role", #String("user")), ("content", #String(prompt))])])),
    ]);

    let headers : ?[Types.HttpHeader] = ?[
      {
        name = "Authorization";
        value = "Bearer " # API_KEY;
      },
      {
        name = "x-forwarded-host";
        value = "api.openai.com";
      },
    ];

    let response = await Request.post(
      "https://idempotent-proxy-cf-worker.zensh.workers.dev/v1/chat/completions",
      ?data,
      transform,
      headers,
    );

    Debug.print(JSON.show(response.body));
    switch (response.body) {
      case (#Object v) {
        for ((k, v) in v.vals()) {
          if (k == "choices") {
            return switch (v) {
              case (#Array val) {
                Debug.print("Got here 1");
                let item = val[0];
                Debug.print(debug_show (item));
                switch (item) {
                  case (#Object kvs) {
                    Debug.print("Got here 2");
                    let message = kvs[1].1;
                    Debug.print(debug_show (message));
                    switch (message) {
                      case (#Object items) {
                        let content = items[1].1;
                        return JSON.show(content);
                      };
                      case (_) {
                        return "3";
                      };
                    };
                  };
                  case (_) {
                    return "2";
                  };
                };
              };
              case (_) {
                return "1";
              };
            };
          };
        };
        return "e";
      };
      case (_) {
        return "0";
      };
    };
  };

  public query func transform(raw : Types.TransformArgs) : async Types.CanisterHttpResponsePayload {
    let transformed : Types.CanisterHttpResponsePayload = {
      status = raw.response.status;
      body = raw.response.body;
      headers = [
        {
          name = "Content-Security-Policy";
          value = "default-src 'self'";
        },
        { name = "Referrer-Policy"; value = "strict-origin" },
        { name = "Permissions-Policy"; value = "geolocation=(self)" },
        {
          name = "Strict-Transport-Security";
          value = "max-age=63072000";
        },
        { name = "X-Frame-Options"; value = "DENY" },
        { name = "X-Content-Type-Options"; value = "nosniff" },
      ];
    };
    transformed;
  };

  // Create a new report
  public shared ({ caller }) func createReport(country : Text, state : Text, details : Text, category : Text, image : Blob) : async Result<(), Text> {
    let user = Map.get(members, phash, caller);
    switch (user) {
      case (?_) {
        let report : Report = {
          id = nextReportId;
          country = country;
          state = state;
          details = details;
          category = category;
          image = image;
          upvotes = 0;
          owner = caller;
        };
        Vector.add<Report>(reports, report);

        // Create a new upvote array with same id to ensure upvoting is unique
        let upvotes = Vector.new<Principal>();
        Vector.add(reportUpvotes, upvotes);

        nextReportId := nextReportId + 1;
        #ok();
      };
      case (null) {
        return #err("Member not found");
      };
    };
  };

  // List reports by category
  public query func listReports(category : Text) : async [Report] {
    if (category == "") {
      return Vector.toArray(reports);
    };
    let filtered = Vector.new<Report>();
    for (report in Vector.vals(reports)) {
      if (report.category == category) {
        Vector.add(filtered, report);
      };
    };
    Vector.toArray(filtered);
  };

  // Upvote a report
  public shared ({ caller }) func upvoteReport(reportId : Nat) : async Result<Nat, Text> {
    let user = Map.get(members, phash, caller);
    switch (user) {
      case (?_) {
        switch (Vector.getOpt(reports, reportId)) {
          case (?report) {
            let upvotes = Vector.get(reportUpvotes, reportId);
            let hasUpvoted = Vector.forSome<Principal>(upvotes, func x { x == caller });
            var newVoteCount = report.upvotes;
            if (hasUpvoted) {
              // Unvote
              let newVotes = Vector.new<Principal>();
              for (vote in Vector.vals(upvotes)) {
                if (Principal.equal(caller, vote) == false) {
                  Vector.add(newVotes, vote);
                };
              };
              Vector.put(reportUpvotes, reportId, newVotes);
              newVoteCount := newVoteCount - 1;
            } else {
              Vector.add(upvotes, caller);
              Vector.put(reportUpvotes, reportId, upvotes);
              newVoteCount := newVoteCount + 1;
            };
            let updatedReport = {
              id = report.id;
              country = report.country;
              state = report.state;
              details = report.details;
              category = report.category;
              image = report.image;
              upvotes = newVoteCount;
              owner = report.owner;
            };
            Vector.put(reports, reportId, updatedReport);
            #ok(newVoteCount);
          };
          case (null) {
            #err("Report not found");
          };
        };
      };
      case (null) {
        #err("Member not found");
      };
    };
  };

  // Generate questions
  public shared ({ caller }) func generateQuestionsForCourse(courseId : Nat) : async Result<SendMessageStatus, SendMessageStatus> {
    assert _isAllowed(caller);

    // Get or create thread
    var threadId = Map.get(courseThreads, nhash, courseId);

    switch (threadId) {
      case (null) {
        // Create thread
        let headers : ?[Types.HttpHeader] = ?[
          {
            name = "Authorization";
            value = "Bearer " # API_KEY;
          },
          {
            name = "OpenAI-Beta";
            value = "assistants=v2";
          },
          {
            name = "x-forwarded-host";
            value = "api.openai.com";
          },
        ];

        var data = #Object([]);

        Debug.print("DATA");
        Debug.print(JSON.show(data));

        let response = await Request.post(
          "https://idempotent-proxy-cf-worker.zensh.workers.dev/v1/threads",
          ?data,
          transform,
          headers,
        );

        Debug.print(debug_show (response.status));
        Debug.print(JSON.show(response.body));

        if (response.status != 200) {
          return #err(#Failed("Failed to create thread"));
        };

        switch (response.body) {
          case (#Object(v)) {
            label findId for ((k, v) in v.vals()) {
              if (k == "id") {
                switch (v) {
                  case (#String(v)) {
                    threadId := ?v;
                    break findId;
                  };
                  case (_) {
                    return #err(#Failed("Json parse failed"));
                  };
                };
              };
            };
          };
          case (_) {
            return #err(#Failed("Json parse failed"));
          };
        };
      };
      case (_) {};
    };

    switch (threadId) {
      case (?threadId) {
        Map.set<Nat, Text>(courseThreads, nhash, courseId, threadId);
        // Check if there a pending run for this course thread
        let runs = _getInProgressThreadRuns(threadId);
        if (Array.size(runs) > 0) {
          return #err(#ThreadLock({ runId = runs[0].runId }));
        };

        let course = _getCourse(courseId);

        switch (course) {
          case (null) { return #err(#Failed("Course not found ")) };
          case (?c) {
            let prompt = "Create 10 questions in JSON format for the course titled"
            # c.title
            # " with description: '" # c.summary # "'."
            # "Note: This data should be taken from the resources."
            # "IMPORTANT: Return only the valid json format, no extra text, just the json file, don't explain"
            # " Don't add the ```json``` text"
            # "JSON Structure:"
            # "[{"
            # "'q': '',"
            # "'o': ['Option 0','Option 1','Option 2','Option 3'],"
            # "'a': '0'"
            # "}]";

            let data = #Object([
              ("role", #String("user")),
              ("content", #String(prompt)),
            ]);

            let headers : ?[Types.HttpHeader] = ?[
              {
                name = "Authorization";
                value = "Bearer " # API_KEY;
              },
              {
                name = "OpenAI-Beta";
                value = "assistants=v2";
              },
              {
                name = "x-forwarded-host";
                value = "api.openai.com";
              },
            ];

            let response = await Request.post(
              "https://idempotent-proxy-cf-worker.zensh.workers.dev/v1/threads/" # threadId # "/messages",
              ?data,
              transform,
              headers,
            );

            Debug.print(debug_show (response.status));
            Debug.print(JSON.show(response.body));

            if (response.status != 200) {
              return #err(#Failed("Failed to create message"));
            };

            // Create new run
            let data2 = #Object([
              ("assistant_id", #String(ASSISTANT_ID)),
              ("instructions", #String("You are a helpful assistant, here to train users on the impacts of corruption and how to mitigate them based on the files you have been trained with and all your responses must be in json format")),
            ]);

            Debug.print("DATA RUN");
            Debug.print(JSON.show(data));
            Debug.print("https://idempotent-proxy-cf-worker.zensh.workers.dev/v1/threads/" # threadId # "/runs");
            let runResponse = await Request.post(
              "https://idempotent-proxy-cf-worker.zensh.workers.dev/v1/threads/" # threadId # "/runs",
              ?data2,
              transform,
              headers,
            );

            Debug.print(JSON.show(runResponse.body));

            var runId = "";

            switch (runResponse.body) {
              case (#Object(v)) {
                label findId for ((k, v) in v.vals()) {
                  if (k == "id") {
                    switch (v) {
                      case (#String(v)) {
                        runId := v;
                        break findId;
                      };
                      case (_) {
                        return #err(#Failed("Json parse failed"));
                      };
                    };
                  };
                };
              };
              case (_) {
                return #err(#Failed("Json parse failed"));
              };
            };

            if (runId == "") {
              return #err(#Failed("Run failed"));
            };

            let threadRun = {
              runId = runId;
              threadId = threadId;
              status = #InProgress;
              timestamp = Time.now();
              lastExecuted = null;
              var processing = false;
              job = #Question;
            };

            Map.set<Text, ThreadRun>(threadRunQueue, thash, runId, threadRun);
            return #ok(#Completed({ runId = runId }));
          };
        };
      };
      case (null) {
        return #err(#Failed("Thread is not available"));
      };
    };
  };

  // Get run message
  public shared ({ caller }) func getRunMessage(runId : Text) : async Result<Message, Text> {
    let user = Map.get(members, phash, caller);
    switch (user) {
      case (?member) {
        let _r = Map.get(threadRunQueue, thash, runId);
        switch (_r) {
          case (null) { #err("Run not found") };
          case (?run) {
            if (run.processing or run.status != #Completed) {
              return #err("Run lock");
            };
            run.processing := true;
            Map.set(threadRunQueue, thash, run.runId, run);

            var enrolledCourse : ?EnrolledCourse = null;
            var enrolledCourseIdx = 0;

            label findCourse for (_course in Vector.vals(member.enrolledCourses)) {
              if (_course.threadId == run.threadId) {
                enrolledCourse := ?_course;
                break findCourse;
              };
              enrolledCourseIdx := enrolledCourseIdx + 1;
            };

            switch (enrolledCourse) {
              case (null) { #err("Enrolled course not found") };
              case (?eCourse) {
                let headers : ?[Types.HttpHeader] = ?[
                  {
                    name = "Authorization";
                    value = "Bearer " # API_KEY;
                  },
                  {
                    name = "OpenAI-Beta";
                    value = "assistants=v2";
                  },
                  {
                    name = "x-forwarded-host";
                    value = "api.openai.com";
                  },
                ];

                let response = await Request.get(
                  "https://idempotent-proxy-cf-worker.zensh.workers.dev/v1/threads/" # run.threadId # "/messages",
                  transform,
                  headers,
                );

                var value : ?Text = null;

                switch (response.body) {
                  case (#Object(v)) {
                    label findData for ((k, v) in v.vals()) {
                      if (k == "data") {
                        switch (v) {
                          case (#Array(v)) {
                            for (i in v.vals()) {
                              switch (i) {
                                case (#Object(v)) {
                                  var foundRunId = false;
                                  label findRunId for ((k, v) in v.vals()) {
                                    if (k == "run_id") {
                                      switch (v) {
                                        case (#String(rid)) {
                                          if (rid == run.runId) {
                                            foundRunId := true;
                                          };
                                        };
                                        case (_) {};
                                      };
                                      break findRunId;
                                    };
                                  };
                                  if (foundRunId) {
                                    label findContent for ((k, v) in v.vals()) {
                                      if (k == "content") {
                                        switch (v) {
                                          case (#Array(items)) {
                                            if (Array.size(items) != 0) {
                                              let firstItem = items[0];
                                              switch (firstItem) {
                                                case (#Object(v)) {
                                                  label findText for ((k, v) in v.vals()) {
                                                    if (k == "text") {
                                                      switch (v) {
                                                        case (#Object(v)) {
                                                          label findValue for ((k, v) in v.vals()) {
                                                            if (k == "value") {
                                                              switch (v) {
                                                                case (#String(t)) {
                                                                  value := ?t;
                                                                };
                                                                case (_) {};
                                                              };
                                                              break findValue;
                                                            };
                                                          };
                                                        };
                                                        case (_) {};
                                                      };
                                                      break findText;
                                                    };
                                                  };
                                                };
                                                case (_) {};
                                              };
                                            };
                                          };
                                          case (_) {};
                                        };
                                        break findContent;
                                      };
                                    };
                                  };
                                };
                                case (_) {};
                              };
                            };
                          };
                          case (_) {};
                        };
                      };
                    };
                  };
                  case (_) {};
                };

                switch (value) {
                  case (null) { #err("Run has no message") };
                  case (?v) {
                    switch (run.job) {
                      case (#Message) {
                        let newMessage : Message = {
                          runId = ?run.runId;
                          content = v;
                          role = #System;
                        };
                        Vector.add<Message>(eCourse.messages, newMessage);
                        Vector.put(member.enrolledCourses, enrolledCourseIdx, eCourse);
                        Map.set(members, phash, caller, member);
                        let updatedRun = {
                          runId = run.runId;
                          threadId = run.threadId;
                          status = run.status;
                          timestamp = run.timestamp;
                          lastExecuted = ?Time.now();
                          job = run.job;
                          var processing = false;
                        };
                        Map.set<Text, ThreadRun>(threadRunQueue, thash, run.runId, updatedRun);
                        return #ok(newMessage);
                      };
                      case (_) {
                        #err("Run is not a message run");
                      };
                    };
                  };
                };
              };
            };
          };
        };
      };
      case (null) {
        #err("Member not found");
      };
    };
  };

  public shared ({ caller }) func setRunProcess(runId : Text, processing : Bool) : () {
    assert _isAllowed(caller);
    let newRun = Map.get(threadRunQueue, thash, runId);
    switch (newRun) {
      case (null) {};
      case (?n) {
        n.processing := processing;
        Map.set<Text, ThreadRun>(threadRunQueue, thash, runId, n);
      };
    };
  };

  // Get course questions
  public query func getCourseQuestions(courseId : Nat) : async Result<[Question], Text> {
    let course = _getCourse(courseId);
    switch (course) {
      case (null) { #err("Course not found") };
      case (?c) {
        #ok(Vector.toArray(c.questions));
      };
    };
  };

  // Get run questions
  public shared ({ caller }) func getRunQuestions(runId : Text) : async Result<[Question], Text> {
    assert _isAllowed(caller);
    let _r = Map.get(threadRunQueue, thash, runId);
    switch (_r) {
      case (null) { #err("Run not found") };
      case (?run) {
        if (run.processing or run.status != #Completed) {
          return #err("Run lock");
        };
        run.processing := true;
        Map.set(threadRunQueue, thash, run.runId, run);

        var course : ?Course = null;

        label findCourse for ((k, v) in Map.entries(courseThreads)) {
          if (v == run.threadId) {
            course := _getCourse(k);
            break findCourse;
          };
        };

        switch (course) {
          case (null) { #err("Course not found for thread id") };
          case (?c) {
            let headers : ?[Types.HttpHeader] = ?[
              {
                name = "Authorization";
                value = "Bearer " # API_KEY;
              },
              {
                name = "OpenAI-Beta";
                value = "assistants=v2";
              },
              {
                name = "x-forwarded-host";
                value = "api.openai.com";
              },
            ];

            let response = await Request.get(
              "https://idempotent-proxy-cf-worker.zensh.workers.dev/v1/threads/" # run.threadId # "/messages",
              transform,
              headers,
            );

            var value : ?Text = null;

            switch (response.body) {
              case (#Object(v)) {
                label findData for ((k, v) in v.vals()) {
                  if (k == "data") {
                    switch (v) {
                      case (#Array(v)) {
                        for (i in v.vals()) {
                          switch (i) {
                            case (#Object(v)) {
                              var foundRunId = false;
                              label findRunId for ((k, v) in v.vals()) {
                                if (k == "run_id") {
                                  switch (v) {
                                    case (#String(rid)) {
                                      if (rid == run.runId) {
                                        foundRunId := true;
                                      };
                                    };
                                    case (_) {};
                                  };
                                  break findRunId;
                                };
                              };
                              if (foundRunId) {
                                label findContent for ((k, v) in v.vals()) {
                                  if (k == "content") {
                                    switch (v) {
                                      case (#Array(items)) {
                                        if (Array.size(items) != 0) {
                                          let firstItem = items[0];
                                          switch (firstItem) {
                                            case (#Object(v)) {
                                              label findText for ((k, v) in v.vals()) {
                                                if (k == "text") {
                                                  switch (v) {
                                                    case (#Object(v)) {
                                                      label findValue for ((k, v) in v.vals()) {
                                                        if (k == "value") {
                                                          switch (v) {
                                                            case (#String(t)) {
                                                              value := ?t;
                                                            };
                                                            case (_) {};
                                                          };
                                                          break findValue;
                                                        };
                                                      };
                                                    };
                                                    case (_) {};
                                                  };
                                                  break findText;
                                                };
                                              };
                                            };
                                            case (_) {};
                                          };
                                        };
                                      };
                                      case (_) {};
                                    };
                                    break findContent;
                                  };
                                };
                              };
                            };
                            case (_) {};
                          };
                        };
                      };
                      case (_) {};
                    };
                  };
                };
              };
              case (_) {};
            };
            switch (value) {
              case (null) { #err("Run has no message") };
              case (?v) {

                Debug.print("Run value");
                Debug.print(v);

                switch (run.job) {
                  case (#Question) {
                    var jsonText = Text.trimStart(v, #text "```json");
                    jsonText := Text.trimEnd(v, #text "```");
                    let json = JSON.parse(jsonText);
                    switch (json) {
                      case (null) { return #err("Bad json format") };
                      case (?j) {
                        switch (j) {
                          case (#Array(v)) {
                            let qsItems = c.questions;
                            var nextId = c.nextQuestionId;
                            for (i in v.vals()) {
                              switch (i) {
                                case (#Object(v)) {
                                  var description = "";
                                  var correctOption = 0;
                                  let options = Vector.new<QuestionOption>();
                                  for ((k, v) in v.vals()) {
                                    switch (k) {
                                      case ("q") {
                                        switch (v) {
                                          case (#String(v)) {
                                            description := v;
                                          };
                                          case (_) {
                                            return #err("Expected: String");
                                          };
                                        };
                                      };
                                      case ("o") {
                                        switch (v) {
                                          case (#Array(v)) {
                                            var idx = 0;
                                            for (i in v.vals()) {
                                              let option = {
                                                option = idx;
                                                description = switch (i) {
                                                  case (#String(v)) {
                                                    v;
                                                  };
                                                  case (_) { "" };
                                                };
                                              };
                                              Vector.add(options, option);
                                              idx := idx + 1;
                                            };
                                          };
                                          case (_) {
                                            return #err("Expected: Array");
                                          };
                                        };
                                      };
                                      case ("a") {
                                        switch (v) {
                                          case (#String(v)) {
                                            switch (Nat.fromText(v)) {
                                              case (null) {
                                                return #err("Invalid option");
                                              };
                                              case (?n) {
                                                correctOption := n;
                                              };
                                            };
                                          };
                                          case (_) {
                                            return #err("Expected: String for answer");
                                          };
                                        };
                                      };
                                      case (_) {
                                        return #err("Expected: q, a or o");
                                      };
                                    };
                                  };
                                  let aOptions = Vector.toArray(options);
                                  let qsItem = {
                                    id = nextId;
                                    description = description;
                                    correctOption = correctOption;
                                    options = aOptions;
                                  };
                                  nextId := nextId + 1;
                                  Vector.add<Question>(qsItems, qsItem);
                                };
                                case (_) {
                                  return #err("Unexpected json format");
                                };
                              };
                            };
                            let updatedCourse = {
                              id = c.id;
                              title = c.title;
                              summary = c.summary;
                              enrolledCount = c.enrolledCount;
                              reportCount = c.reportCount;
                              status = c.status;
                              resources = c.resources;
                              questions = qsItems;
                              nextResourceId = c.nextResourceId;
                              nextQuestionId = c.nextQuestionId + Vector.size(qsItems);
                            };
                            Vector.put(courses, c.id, updatedCourse);

                            let updatedRun = {
                              runId = run.runId;
                              threadId = run.threadId;
                              status = run.status;
                              timestamp = run.timestamp;
                              lastExecuted = ?Time.now();
                              job = run.job;
                              var processing = false;
                            };
                            Map.set<Text, ThreadRun>(threadRunQueue, thash, run.runId, updatedRun);
                            return #ok(Vector.toArray(qsItems));
                          };
                          case (_) {
                            return #err("Expected array of questions");
                          };
                        };
                      };
                    };
                  };
                  case (_) {
                    return #err("Run is not a question run");
                  };
                };
              };
            };
          };
        };
      };
    };
  };

  public query func getRunsInQueue() : async [SharedThreadRun] {
    let sharedRuns = Vector.new<SharedThreadRun>();
    for (k in Map.vals(threadRunQueue)) {
      let sharedRun = {
        runId = k.runId;
        threadId = k.threadId;
        status = k.status;
        timestamp = k.timestamp;
        lastExecuted = k.lastExecuted;
        job = k.job;
        processing = k.processing;
      };
      Debug.print(debug_show (k.processing));
      Vector.add(sharedRuns, sharedRun);
    };
    Vector.toArray(sharedRuns);
  };

  // Jobs
  private func pollRuns() : async () {
    // Poll for run status
    label queue for (run in Map.vals(threadRunQueue)) {
      if (run.processing) {
        continue queue;
      };
      run.processing := true;
      Debug.print("Processing " # run.runId);
      Map.set(threadRunQueue, thash, run.runId, run);

      switch (run.status) {
        case (#InProgress) {
          // Poll run id
          let headers : ?[Types.HttpHeader] = ?[
            {
              name = "Authorization";
              value = "Bearer " # API_KEY;
            },
            {
              name = "OpenAI-Beta";
              value = "assistants=v2";
            },
            {
              name = "x-forwarded-host";
              value = "api.openai.com";
            },
          ];

          let response = await Request.get(
            "https://idempotent-proxy-cf-worker.zensh.workers.dev/v1/threads/" # run.threadId # "/runs/" # run.runId,
            transform,
            headers,
          );

          Debug.print(debug_show (response.status));
          Debug.print(JSON.show(response.body));

          var runStatus : RunStatus = #InProgress;

          if (response.status != 200) {
            runStatus := #Failed;
          } else {
            var status = "";
            switch (response.body) {
              case (#Object(v)) {
                label findId for ((k, v) in v.vals()) {
                  if (k == "status") {
                    switch (v) {
                      case (#String(v)) {
                        status := v;
                        break findId;
                      };
                      case (_) {};
                    };
                  };
                };
              };
              case (_) {};
            };

            Debug.print("Run status: " # status);
            switch (status) {
              case ("in_progress") {
                runStatus := #InProgress;
              };
              case ("queued") {
                runStatus := #InProgress;
              };
              case ("completed") {
                runStatus := #Completed;
              };
              case ("failed") {
                runStatus := #Failed;
              };
              case ("cancelled") {
                runStatus := #Cancelled;
              };
              case ("expired") {
                runStatus := #Expired;
              };
              case (_) {
                runStatus := #Failed;
              };
            };
          };

          let updatedRun = {
            runId = run.runId;
            threadId = run.threadId;
            status = runStatus;
            timestamp = run.timestamp;
            lastExecuted = ?Time.now();
            job = run.job;
            var processing = false;
          };
          Debug.print("Updating run: " # debug_show (runStatus));
          Map.set<Text, ThreadRun>(threadRunQueue, thash, run.runId, updatedRun);
        };
        case (_) {
          switch (run.lastExecuted) {
            case (null) {};
            case (?timestamp) {
              let LIFESPAN = 60 * 60000000000; // 5 mins in nano secs
              if (Time.now() - timestamp > LIFESPAN) {
                // Run has exceeded lifespan and should be removed
                Map.delete<Text, ThreadRun>(threadRunQueue, thash, run.runId);
              };
            };
          };
        };
      };
      let newRun = Map.get(threadRunQueue, thash, run.runId);
      switch (newRun) {
        case (null) {};
        case (?n) {
          n.processing := false;
          Debug.print("Finished Processing " # run.runId);
          Map.set<Text, ThreadRun>(threadRunQueue, thash, run.runId, n);
        };
      };
    };
  };

  // Timers
  ignore recurringTimer<system>(#seconds 2, pollRuns);
};
