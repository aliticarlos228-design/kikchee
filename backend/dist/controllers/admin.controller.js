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
exports.stats = stats;
exports.users = users;
exports.createUser = createUser;
exports.getUser = getUser;
exports.deleteUser = deleteUser;
exports.updateUser = updateUser;
exports.toggleUserActive = toggleUserActive;
exports.finances = finances;
exports.orders = orders;
exports.deliveries = deliveries;
const admin_validator_1 = require("../validators/admin.validator");
const adminService = __importStar(require("../services/admin.service"));
function handleError(res, err) {
    if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
        const e = err;
        return res.status(e.status).json({ error: e.message, code: e.code });
    }
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur', code: 'INTERNAL_ERROR' });
}
async function stats(_req, res) {
    try {
        const data = await adminService.getStats();
        return res.json(data);
    }
    catch (err) {
        return handleError(res, err);
    }
}
async function users(req, res) {
    try {
        const role = typeof req.query.role === 'string' ? req.query.role : undefined;
        const data = await adminService.listUsers(role);
        return res.json(data);
    }
    catch (err) {
        return handleError(res, err);
    }
}
async function createUser(req, res) {
    const parsed = admin_validator_1.adminCreateUserSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            error: parsed.error.errors[0]?.message || 'Données invalides',
            code: 'VALIDATION_ERROR',
        });
    }
    try {
        const user = await adminService.createUser(parsed.data);
        return res.status(201).json(user);
    }
    catch (err) {
        return handleError(res, err);
    }
}
async function getUser(req, res) {
    try {
        const data = await adminService.getUserDetail(String(req.params.id));
        return res.json(data);
    }
    catch (err) {
        return handleError(res, err);
    }
}
async function deleteUser(req, res) {
    try {
        await adminService.deleteUser(String(req.params.id), req.user.userId);
        return res.json({ success: true });
    }
    catch (err) {
        return handleError(res, err);
    }
}
async function updateUser(req, res) {
    const parsed = admin_validator_1.adminUpdateUserSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            error: parsed.error.errors[0]?.message || 'Données invalides',
            code: 'VALIDATION_ERROR',
        });
    }
    try {
        const user = await adminService.updateUser(String(req.params.id), parsed.data);
        return res.json(user);
    }
    catch (err) {
        return handleError(res, err);
    }
}
async function toggleUserActive(req, res) {
    const parsed = admin_validator_1.toggleUserActiveSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            error: parsed.error.errors[0]?.message || 'Données invalides',
            code: 'VALIDATION_ERROR',
        });
    }
    try {
        const user = await adminService.toggleUserActive(String(req.params.id), parsed.data.active, req.user.userId);
        return res.json(user);
    }
    catch (err) {
        return handleError(res, err);
    }
}
async function finances(_req, res) {
    try {
        const data = await adminService.listFinancialTransactions();
        return res.json(data);
    }
    catch (err) {
        return handleError(res, err);
    }
}
async function orders(_req, res) {
    try {
        const data = await adminService.listAllOrders();
        return res.json(data);
    }
    catch (err) {
        return handleError(res, err);
    }
}
async function deliveries(_req, res) {
    try {
        const data = await adminService.listAllDeliveries();
        return res.json(data);
    }
    catch (err) {
        return handleError(res, err);
    }
}
