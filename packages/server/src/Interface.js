"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatMessageRatingType = exports.ChatType = exports.MODE = void 0;
var MODE;
(function (MODE) {
    MODE["QUEUE"] = "queue";
    MODE["MAIN"] = "main";
})(MODE || (exports.MODE = MODE = {}));
var ChatType;
(function (ChatType) {
    ChatType["INTERNAL"] = "INTERNAL";
    ChatType["EXTERNAL"] = "EXTERNAL";
})(ChatType || (exports.ChatType = ChatType = {}));
var ChatMessageRatingType;
(function (ChatMessageRatingType) {
    ChatMessageRatingType["THUMBS_UP"] = "THUMBS_UP";
    ChatMessageRatingType["THUMBS_DOWN"] = "THUMBS_DOWN";
})(ChatMessageRatingType || (exports.ChatMessageRatingType = ChatMessageRatingType = {}));
[];
// DocumentStore related
__exportStar(require("./Interface.DocumentStore"), exports);
// Supabase related
__exportStar(require("./Interface.Supabase"), exports);
//# sourceMappingURL=Interface.js.map