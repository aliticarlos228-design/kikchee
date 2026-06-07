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
exports.register = register;
exports.login = login;
exports.me = me;
exports.updateMe = updateMe;
const auth_validator_1 = require("../validators/auth.validator");
const authService = __importStar(require("../services/auth.service"));
function handleError(res, err) {
    if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
        const e = err;
        return res.status(e.status).json({ error: e.message, code: e.code });
    }
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur', code: 'INTERNAL_ERROR' });
}
async function register(req, res) {
    const parsed = auth_validator_1.registerSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            error: parsed.error.errors[0]?.message || 'Données invalides',
            code: 'VALIDATION_ERROR',
        });
    }
    try {
        const user = await authService.registerUser(parsed.data);
        return res.status(201).json(user);
    }
    catch (err) {
        return handleError(res, err);
    }
}
async function login(req, res) {
    const parsed = auth_validator_1.loginSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            error: parsed.error.errors[0]?.message || 'Données invalides',
            code: 'VALIDATION_ERROR',
        });
    }
    try {
        const result = await authService.loginUser(parsed.data.email, parsed.data.password);
        return res.json(result);
    }
    catch (err) {
        return handleError(res, err);
    }
}
async function me(req, res) {
    try {
        const user = await authService.getProfile(req.user.userId);
        return res.json(user);
    }
    catch (err) {
        return handleError(res, err);
    }
}
async function updateMe(req, res) {
    const parsed = auth_validator_1.updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            error: parsed.error.errors[0]?.message || 'Données invalides',
            code: 'VALIDATION_ERROR',
        });
    }
    try {
        const user = await authService.updateProfile(req.user.userId, parsed.data);
        return res.json(user);
    }
    catch (err) {
        return handleError(res, err);
    }
}
