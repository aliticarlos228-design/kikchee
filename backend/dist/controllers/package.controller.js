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
exports.create = create;
exports.list = list;
exports.ship = ship;
exports.getPackage = getPackage;
exports.linkableOrders = linkableOrders;
exports.linkOrder = linkOrder;
exports.updateStatus = updateStatus;
const package_validator_1 = require("../validators/package.validator");
const packageService = __importStar(require("../services/package.service"));
function handleError(res, err) {
    if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
        const e = err;
        return res.status(e.status).json({ error: e.message, code: e.code });
    }
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur', code: 'INTERNAL_ERROR' });
}
async function create(req, res) {
    const parsed = package_validator_1.createPackageSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            error: parsed.error.errors[0]?.message || 'Données invalides',
            code: 'VALIDATION_ERROR',
        });
    }
    try {
        const pkg = await packageService.createPackage(req.user.userId, parsed.data);
        return res.status(201).json(pkg);
    }
    catch (err) {
        return handleError(res, err);
    }
}
async function list(req, res) {
    try {
        const packages = await packageService.listMerchantPackages(req.user.userId);
        return res.json(packages);
    }
    catch (err) {
        return handleError(res, err);
    }
}
async function ship(req, res) {
    const parsed = package_validator_1.shipPackageSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            error: parsed.error.errors[0]?.message || 'Données invalides',
            code: 'VALIDATION_ERROR',
        });
    }
    try {
        const result = await packageService.shipToClient(req.user.userId, parsed.data);
        return res.status(201).json(result);
    }
    catch (err) {
        return handleError(res, err);
    }
}
async function getPackage(req, res) {
    try {
        const data = await packageService.getMerchantPackageDetail(req.user.userId, String(req.params.id));
        return res.json(data);
    }
    catch (err) {
        return handleError(res, err);
    }
}
async function linkableOrders(_req, res) {
    try {
        const orders = await packageService.listLinkableOrders();
        return res.json(orders);
    }
    catch (err) {
        return handleError(res, err);
    }
}
async function linkOrder(req, res) {
    const parsed = package_validator_1.linkOrderSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            error: parsed.error.errors[0]?.message || 'Données invalides',
            code: 'VALIDATION_ERROR',
        });
    }
    try {
        const pkg = await packageService.linkPackageToOrder(req.user.userId, String(req.params.id), parsed.data.orderId);
        return res.json(pkg);
    }
    catch (err) {
        return handleError(res, err);
    }
}
async function updateStatus(req, res) {
    const parsed = package_validator_1.updatePackageStatusSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            error: parsed.error.errors[0]?.message || 'Données invalides',
            code: 'VALIDATION_ERROR',
        });
    }
    try {
        const pkg = await packageService.updatePackageStatus(req.user.userId, String(req.params.id), parsed.data.status);
        return res.json(pkg);
    }
    catch (err) {
        return handleError(res, err);
    }
}
