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
exports.available = available;
exports.submitBid = submitBid;
exports.accept = accept;
exports.updateStatus = updateStatus;
exports.updateLocation = updateLocation;
exports.confirmPayment = confirmPayment;
exports.mine = mine;
exports.redevance = redevance;
exports.getOne = getOne;
const delivery_validator_1 = require("../validators/delivery.validator");
const deliveryService = __importStar(require("../services/delivery.service"));
const bidService = __importStar(require("../services/bid.service"));
function handleError(res, err) {
    if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
        const e = err;
        return res.status(e.status).json({ error: e.message, code: e.code });
    }
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur', code: 'INTERNAL_ERROR' });
}
async function available(req, res) {
    try {
        const deliveries = await deliveryService.listAvailableDeliveries(req.user.userId);
        return res.json(deliveries);
    }
    catch (err) {
        return handleError(res, err);
    }
}
async function submitBid(req, res) {
    const proposedPrice = Number(req.body.proposedPrice);
    if (!Number.isFinite(proposedPrice) || proposedPrice <= 0) {
        return res.status(400).json({ error: 'Prix invalide', code: 'VALIDATION_ERROR' });
    }
    try {
        const bid = await bidService.submitDriverBid(req.user.userId, String(req.params.orderId), proposedPrice);
        return res.status(201).json(bid);
    }
    catch (err) {
        return handleError(res, err);
    }
}
async function accept(req, res) {
    try {
        const delivery = await deliveryService.acceptDelivery(req.user.userId, String(req.params.orderId));
        return res.json(delivery);
    }
    catch (err) {
        return handleError(res, err);
    }
}
async function updateStatus(req, res) {
    const parsed = delivery_validator_1.updateDeliveryStatusSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            error: parsed.error.errors[0]?.message || 'Données invalides',
            code: 'VALIDATION_ERROR',
        });
    }
    try {
        const delivery = await deliveryService.updateDeliveryStatus(req.user.userId, String(req.params.id), parsed.data.status);
        return res.json(delivery);
    }
    catch (err) {
        return handleError(res, err);
    }
}
async function updateLocation(req, res) {
    const parsed = delivery_validator_1.driverLocationSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            error: parsed.error.errors[0]?.message || 'Position invalide',
            code: 'VALIDATION_ERROR',
        });
    }
    try {
        const result = await deliveryService.updateDeliveryLocation(req.user.userId, String(req.params.id), parsed.data.latitude, parsed.data.longitude);
        return res.json(result);
    }
    catch (err) {
        return handleError(res, err);
    }
}
async function confirmPayment(req, res) {
    try {
        const result = await deliveryService.confirmDeliveryPayment(req.user.userId, String(req.params.id));
        return res.json(result);
    }
    catch (err) {
        return handleError(res, err);
    }
}
async function mine(req, res) {
    try {
        const deliveries = await deliveryService.listDriverDeliveries(req.user.userId);
        return res.json(deliveries);
    }
    catch (err) {
        return handleError(res, err);
    }
}
async function redevance(req, res) {
    try {
        const data = await deliveryService.getDriverRedevance(req.user.userId);
        return res.json(data);
    }
    catch (err) {
        return handleError(res, err);
    }
}
async function getOne(req, res) {
    try {
        const delivery = await deliveryService.getDriverDelivery(req.user.userId, String(req.params.id));
        return res.json(delivery);
    }
    catch (err) {
        return handleError(res, err);
    }
}
