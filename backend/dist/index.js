"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const brand_1 = require("./constants/brand");
const env_1 = require("./config/env");
const geocode_routes_1 = __importDefault(require("./routes/geocode.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const orders_routes_1 = __importDefault(require("./routes/orders.routes"));
const packages_routes_1 = __importDefault(require("./routes/packages.routes"));
const deliveries_routes_1 = __importDefault(require("./routes/deliveries.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const origins = env_1.config.corsOrigin.split(',').map((o) => o.trim()).filter(Boolean);
app.use((0, cors_1.default)({
    origin: origins.length > 1 ? origins : origins[0] || true,
    credentials: true,
}));
app.use(express_1.default.json({ limit: '6mb' }));
const swaggerSpec = (0, swagger_jsdoc_1.default)({
    definition: {
        openapi: '3.0.0',
        info: {
            title: `${brand_1.APP_NAME} API`,
            version: '1.0.0',
            description: 'API REST — Plateforme logistique multi-acteurs',
        },
        servers: [{ url: `http://localhost:${env_1.config.port}/api` }],
        components: {
            securitySchemes: {
                bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            },
        },
    },
    apis: ['./src/routes/*.ts'],
});
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: `${brand_1.APP_NAME} API` });
});
app.use('/api/auth', auth_routes_1.default);
app.use('/api/geocode', geocode_routes_1.default);
app.use('/api/orders', orders_routes_1.default);
app.use('/api/packages', packages_routes_1.default);
app.use('/api/deliveries', deliveries_routes_1.default);
app.use('/api/chat', chat_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use((_req, res) => {
    res.status(404).json({ error: 'Route introuvable', code: 'NOT_FOUND' });
});
app.listen(env_1.config.port, () => {
    console.log(`${brand_1.APP_NAME} API → http://localhost:${env_1.config.port}`);
    console.log(`Swagger     → http://localhost:${env_1.config.port}/api-docs`);
});
