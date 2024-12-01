export const CourseStatus = {
  InFix: { InFix: null },
  Approved: { Approved: null },
  InReview: { InReview: null },
  Rejected: { Rejected: null },
};

export const RunStatus = {
  Cancelled: { Cancelled: null },
  InProgress: { InProgress: null },
  Expired: { Expired: null },
  Completed: { Completed: null },
  Failed: { Failed: null },
};

export const MessgeType = {
  User: { User: null },
  System: { System: null },
};

export const ResourceType = {
  Book: { Book: null },
  Article: { Article: null },
  Report: { Report: null },
  Slides: { Slides: null },
  Video: { Video: null },
};

export const ResourceTypes = Object.keys(ResourceType);
export const CourseStatuses = Object.keys(CourseStatus);

export const getEnum = (option, enumObject) => {
  for (let key of Object.keys(enumObject)) {
    if (key === Object.keys(option)[0]) {
      return key;
    }
  }
};

export const Categories = [
  "Private Sector",
  "Public Sector",
  "Judicial Corruption",
  "Natural Resources",
  "International Aid and Development",
  "Elections and Political Processes",
  "Healthcare",
  "Education",
  "Law Enforcement",
  "Procurement and Public Contracting",
];
