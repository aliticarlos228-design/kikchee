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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversations = conversations;
exports.list = list;
exports.send = send;
const chat_validator_1 = require("../validators/chat.validator");
const chatService = __importStar(require("../services/chat.service"));
function handleError(res, err) {
    if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
        const e = err;
        return res.status(e.status).json({ error: e.message, code: e.code });
    }
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur', code: 'INTERNAL_ERROR' });
}
async function conversations(req, res) {
    try {
        const data = await chatService.listConversations(req.user.userId, req.user.role);
        return res.json(data);
    }
    catch (err) {
        return handleError(res, err);
    }
}
async function list(req, res) {
    try {
        const messages = await chatService.listMessages(req.user.userId, req.user.role, String(req.params.orderId));
        return res.json(messages);
    }
    catch (err) {
        return handleError(res, err);
    }
}
async function send(req, res) {
    const parsed = chat_validator_1.sendChatMessageSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            error: parsed.error.errors[0]?.message || 'Message invalide',
            code: 'VALIDATION_ERROR',
        });
    }
    try {
        const message = await chatService.sendMessage(req.user.userId, req.user.role, String(req.params.orderId), parsed.data.text);
        return res.status(201).json(message);
    }
    catch (err) {
        return handleError(res, err);
    }
}
