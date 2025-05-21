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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importStar(require("ws"));
const wss = new ws_1.WebSocketServer({ port: 8080 });
let user1 = null;
let user2 = null;
let score1 = 0;
let score2 = 0;
function updatePresence() {
    const presenceMsg = JSON.stringify({
        type: 'presence-update',
        users: {
            user1Connected: !!user1,
            user2Connected: !!user2,
        }
    });
    user1 === null || user1 === void 0 ? void 0 : user1.send(presenceMsg);
    user2 === null || user2 === void 0 ? void 0 : user2.send(presenceMsg);
}
wss.on('connection', (ws) => {
    ws.on('error', console.error);
    ws.on('close', () => {
        if (ws === user1) {
            user1 = null;
            //   score1 = 0;
        }
        if (ws === user2) {
            user2 = null;
            //   score2 = 0;
        }
        updatePresence();
    });
    ws.on('message', (data) => {
        const message = JSON.parse(data);
        switch (message.type) {
            case 'register':
                if (message.user === 'user1') {
                    if (user1 && user1.readyState === ws_1.default.OPEN && user1 !== ws)
                        user1.close();
                    user1 = ws;
                    ws.send(JSON.stringify({ type: 'registered', user: 'user1', score1, score2 }));
                }
                else if (message.user === 'user2') {
                    if (user2 && user2.readyState === ws_1.default.OPEN && user2 !== ws)
                        user2.close();
                    user2 = ws;
                    ws.send(JSON.stringify({ type: 'registered', user: 'user2', score1, score2 }));
                }
                else if (!user1) {
                    user1 = ws;
                    ws.send(JSON.stringify({ type: 'registered', user: 'user1' }));
                }
                else if (!user2) {
                    user2 = ws;
                    ws.send(JSON.stringify({ type: 'registered', user: 'user2' }));
                }
                else {
                    ws.send(JSON.stringify({ type: 'full', message: 'Game is full' }));
                    ws.close();
                    return;
                }
                if (user1 && user2) {
                    const startMsg = JSON.stringify({ type: 'start' });
                    user1.send(startMsg);
                    user2.send(startMsg);
                }
                updatePresence();
                break;
            case 'increment-score':
                if (ws === user1)
                    score1 += message.incrementBy;
                else if (ws === user2)
                    score2 += message.incrementBy;
                const scoreMsg = JSON.stringify({
                    type: 'score-update',
                    score1,
                    score2
                });
                user1 === null || user1 === void 0 ? void 0 : user1.send(scoreMsg);
                user2 === null || user2 === void 0 ? void 0 : user2.send(scoreMsg);
                break;
            case 'end-connection':
                if (ws === user1)
                    user2 === null || user2 === void 0 ? void 0 : user2.send(JSON.stringify({ type: 'end', message: 'User1 left' }));
                if (ws === user2)
                    user1 === null || user1 === void 0 ? void 0 : user1.send(JSON.stringify({ type: 'end', message: 'User2 left' }));
                user1 === null || user1 === void 0 ? void 0 : user1.close();
                user2 === null || user2 === void 0 ? void 0 : user2.close();
                user1 = null;
                user2 = null;
                score1 = 0;
                score2 = 0;
                break;
        }
    });
});
