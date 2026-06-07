"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.driverLocationSchema = exports.updateDeliveryStatusSchema = void 0;
const zod_1 = require("zod");
exports.updateDeliveryStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['IN_PROGRESS', 'COMPLETED', 'FAILED']),
});
exports.driverLocationSchema = zod_1.z.object({
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
});
