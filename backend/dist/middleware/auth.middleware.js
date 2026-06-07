"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const database_1 = require("../config/database");
async function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token manquant', code: 'UNAUTHORIZED' });
    }
    const token = header.slice(7);
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.config.jwtSecret);
        const user = await database_1.prisma.user.findUnique({ where: { id: payload.userId } });
        if (!user || !user.active) {
            return res.status(401).json({ error: 'Compte invalide ou désactivé', code: 'UNAUTHORIZED' });
        }
        database_1.prisma.user
            .update({ where: { id: user.id }, data: { lastActiveAt: new Date() } })
            .catch(() => { });
        req.user = { userId: user.id, role: user.role };
        next();
    }
    catch {
        return res.status(401).json({ error: 'Token invalide ou expiré', code: 'UNAUTHORIZED' });
    }
}
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Accès refusé pour ce rôle', code: 'FORBIDDEN' });
        }
        next();
    };
}
