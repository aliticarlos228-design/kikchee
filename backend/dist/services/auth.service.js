"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.getProfile = getProfile;
exports.updateProfile = updateProfile;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const env_1 = require("../config/env");
const brand_1 = require("../constants/brand");
const auth_validator_1 = require("../validators/auth.validator");
async function registerUser(data) {
    const existing = await database_1.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
        throw { status: 409, message: 'Cet email est déjà utilisé', code: 'EMAIL_EXISTS' };
    }
    const passwordHash = await bcryptjs_1.default.hash(data.password, 10);
    const user = await database_1.prisma.user.create({
        data: {
            email: data.email,
            passwordHash,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            role: data.role,
            vehicleType: data.role === 'driver' ? data.vehicleType : null,
        },
    });
    return (0, auth_validator_1.formatUser)(user);
}
async function loginUser(email, password) {
    const user = await database_1.prisma.user.findUnique({ where: { email } });
    if (!user || !user.active) {
        throw { status: 401, message: 'Email ou mot de passe incorrect', code: 'INVALID_CREDENTIALS' };
    }
    const valid = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!valid) {
        throw { status: 401, message: 'Email ou mot de passe incorrect', code: 'INVALID_CREDENTIALS' };
    }
    const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, env_1.config.jwtSecret, {
        expiresIn: '24h',
    });
    return { token, user: (0, auth_validator_1.formatUser)(user) };
}
async function getProfile(userId) {
    const user = await database_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw { status: 404, message: 'Utilisateur introuvable', code: 'USER_NOT_FOUND' };
    }
    return (0, auth_validator_1.formatUser)(user);
}
async function updateProfile(userId, data) {
    const existing = await database_1.prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
        throw { status: 404, message: 'Utilisateur introuvable', code: 'USER_NOT_FOUND' };
    }
    if (existing.role === 'client' || existing.role === 'merchant' || existing.role === 'driver') {
        throw {
            status: 403,
            message: `Les informations de profil ne peuvent être modifiées que par l'administration ${brand_1.APP_NAME}`,
            code: 'PROFILE_LOCKED',
        };
    }
    const user = await database_1.prisma.user.update({
        where: { id: userId },
        data,
    });
    return (0, auth_validator_1.formatUser)(user);
}
