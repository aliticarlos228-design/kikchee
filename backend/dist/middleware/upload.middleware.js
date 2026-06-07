"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadPackagePhotos = void 0;
const multer_1 = __importDefault(require("multer"));
const storage = multer_1.default.memoryStorage();
exports.uploadPackagePhotos = (0, multer_1.default)({
    storage,
    limits: { fileSize: 8 * 1024 * 1024, files: 2 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Seules les images sont acceptées'));
        }
    },
}).fields([
    { name: 'weightPhoto', maxCount: 1 },
    { name: 'productPhoto', maxCount: 1 },
]);
