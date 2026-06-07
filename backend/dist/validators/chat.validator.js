"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendChatMessageSchema = void 0;
const zod_1 = require("zod");
exports.sendChatMessageSchema = zod_1.z.object({
    text: zod_1.z.string().trim().min(1, 'Message vide').max(1000, 'Message trop long'),
});
