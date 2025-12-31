export var TaskStatus;
(function (TaskStatus) {
    TaskStatus["PENDING"] = "PENDING";
    TaskStatus["IN_PROGRESS"] = "IN_PROGRESS";
    TaskStatus["COMPLETED"] = "COMPLETED";
    TaskStatus["CANCELLED"] = "CANCELLED";
})(TaskStatus || (TaskStatus = {}));
export var TaskPriority;
(function (TaskPriority) {
    TaskPriority["LOW"] = "LOW";
    TaskPriority["MEDIUM"] = "MEDIUM";
    TaskPriority["HIGH"] = "HIGH";
    TaskPriority["URGENT"] = "URGENT";
})(TaskPriority || (TaskPriority = {}));
export var TaskType;
(function (TaskType) {
    TaskType["TASK"] = "TASK";
    TaskType["POLL"] = "POLL";
    TaskType["PLAN"] = "PLAN";
})(TaskType || (TaskType = {}));
export var TaskVisibility;
(function (TaskVisibility) {
    TaskVisibility["PRIVATE"] = "PRIVATE";
    TaskVisibility["PUBLIC"] = "PUBLIC";
})(TaskVisibility || (TaskVisibility = {}));
export var BoardRole;
(function (BoardRole) {
    BoardRole["ADMIN"] = "ADMIN";
    BoardRole["MEMBER"] = "MEMBER";
})(BoardRole || (BoardRole = {}));
