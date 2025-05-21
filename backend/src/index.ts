import WebSocket, { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

let user1: WebSocket | null = null;
let user2: WebSocket | null = null;
let score1 = 0;
let score2 = 0;

wss.on('connection', (ws) => {
    ws.on('error', console.error);

    ws.on('message', (data: any) => {
        const message = JSON.parse(data);

        switch (message.type) {
            case 'register':
                if (!user1) {
                    user1 = ws;
                    ws.send(JSON.stringify({ type: 'registered', user: 'user1' }));
                } else if (!user2) {
                    user2 = ws;
                    ws.send(JSON.stringify({ type: 'registered', user: 'user2' }));
                    // Notify both users connection is ready
                    user1.send(JSON.stringify({ type: 'start' }));
                    user2.send(JSON.stringify({ type: 'start' }));
                } else {
                    // Too many users
                    ws.send(JSON.stringify({ type: 'full', message: 'Game is already full' }));
                    ws.close();
                }
                break;

            case 'increment-score':
                if (ws === user1) score1 += message.incrementBy;
                else if (ws === user2) score2 += message.incrementBy;

                const scores = JSON.stringify({ type: 'score-update', score1, score2 });
                user1?.send(scores);
                user2?.send(scores);
                break;

            case 'end-connection':
                if (ws === user1) user2?.send(JSON.stringify({ type: 'end', message: 'User1 left' }));
                if (ws === user2) user1?.send(JSON.stringify({ type: 'end', message: 'User2 left' }));
                user1?.close();
                user2?.close();
                user1 = null;
                user2 = null;
                score1 = 0;
                score2 = 0;
                break;
        }
    });
});
