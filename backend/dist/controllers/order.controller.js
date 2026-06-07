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
exports.estimate = estimate;
exports.create = create;
exports.listMine = listMine;
exports.getOne = getOne;
exports.cancel = cancel;
exports.listBids = listBids;
exports.selectBid = selectBid;
exports.track = track;
const order_validator_1 = require("../validators/order.validator");
const orderService = __importStar(require("../services/order.service"));
const bidService = __importStar(require("../services/bid.service"));
function handleError(res, err) {
    if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
        const e = err;
        return res.status(e.status).json({ error: e.message, code: e.code });
    }
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur', code: 'INTERNAL_ERROR' });
}
async function estimate(req, res) {
    const parsed = order_validator_1.estimateOrderSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            error: parsed.error.errors[0]?.message || 'Données invalides',
            code: 'VALIDATION_ERROR',
        });
    }
    try {
        const result = await orderService.estimateOrder(parsed.data);
        return res.json(result);
    }
    catch (err) {
        return handleError(res, err);
    }
}
async function create(req, res) {
    const parsed = order_validator_1.createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            error: parsed.error.errors[0]?.message || 'Données invalides',
            code: 'VALIDATION_ERROR',
        });
    }
    try {
        const order = await orderService.createOrder(req.user.userId, parsed.data);
        return res.status(201).json(order);
    }
    catch (err) {
        return handleError(res, err);
    }
}
async function listMine(req, res) {
    try {
        const orders = await orderService.listClientOrders(req.user.userId);
        return res.json(orders);
    }
    catch (err) {
        return handleError(res, err);
    }
}
async function getOne(req, res) {
    const id = String(req.params.id);
    try {
        const order = await orderService.getClientOrder(req.user.userId, id);
        return res.json(order);
    }
    catch (err) {
        return handleError(res, err);
    }
}
async function cancel(req, res) {
    try {
        const result = await orderService.cancelOrder(req.user.userId, String(req.params.id));
        return res.json(result);
    }
    catch (err) {
        return handleError(res, err);
    }
}
async function listBids(req, res) {
    try {
        const bids = await bidService.listOrderBids(req.user.userId, String(req.params.id));
        return res.json(bids);
    }
    catch (err) {
        return handleError(res, err);
    }
}
async function selectBid(req, res) {
    try {
        const result = await bidService.selectDriverBid(req.user.userId, String(req.params.id), String(req.params.bidId));
        return res.json(result);
    }
    catch (err) {
        return handleError(res, err);
    }
}
async function track(req, res) {
    const id = String(req.params.id);
    try {
        const tracking = await orderService.trackOrder(req.user.userId, id);
        return res.json(tracking);
    }
    catch (err) {
        return handleError(res, err);
    }
}
