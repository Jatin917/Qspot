'use client';

import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const socketRef = useRef<WebSocket | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [started, setStarted] = useState(false);
  const [user1Connected, setUser1Connected] = useState(false);
  const [user2Connected, setUser2Connected] = useState(false);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');
    socketRef.current = socket;

    socket.onopen = () => {
      const storedUser = localStorage.getItem('userType');
      socket.send(JSON.stringify({ type: 'register', user: storedUser || null }));
      console.log("on open")
    };
    
    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      console.log("on message")

      switch (msg.type) {
        case 'registered':
          setUserType(msg.user);
          if(msg.score1 && msg.score2){
            setScore1(msg.score1);
            setScore2(msg.score2);
          }
          localStorage.setItem('userType', msg.user);
          break;

        case 'start':
          setStarted(true);
          break;

        case 'score-update':
          setScore1(msg.score1);
          setScore2(msg.score2);
          break;

        case 'presence-update':
          setUser1Connected(msg.users.user1Connected);
          setUser2Connected(msg.users.user2Connected);
          break;

        case 'end':
          alert(msg.message);
          localStorage.removeItem('userType');
          socket.close();
          console.log("usertype ", user1Connected, user2Connected, userType)
          break;

        case 'full':
          alert('Room is full');
          break;
      }
    };

    socket.onclose = () => console.log('WebSocket closed');
    socket.onerror = (e) => console.error('WebSocket Error ', e);

    return () => {
      socket.close()
    };
  }, []);

  const incrementScore = () => {
    socketRef.current?.send(JSON.stringify({ type: 'increment-score', incrementBy: 1 }));
  };

  const endConnection = () => {
    localStorage.removeItem("userType");
    socketRef.current?.send(JSON.stringify({ type: 'end-connection' }));
  };
    console.log("update presence ", user1Connected, user2Connected)
  return (
    <div className="flex h-screen">
      <div className="w-1/2 bg-blue-100 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-2 text-black">
          {user1Connected ? 'User 1' : 'No user'}
        </h1>
        {user1Connected && <p className="text-xl text-black">Score: {score1}</p>}
        {userType === 'user1' && started && (
          <>
            <button className="mt-4 px-4 py-2 bg-blue-500 text-black rounded" onClick={incrementScore}>
              +1
            </button>
            <button className="mt-2 px-4 py-2 bg-red-500 text-black rounded" onClick={endConnection}>
              End
            </button>
          </>
        )}
      </div>
      <div className="w-1/2 bg-green-100 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-2 text-black">
          {user2Connected ? 'User 2' : 'No user'}
        </h1>
        {user2Connected && <p className="text-xl text-black">Score: {score2}</p>}
        {userType === 'user2' && started && (
          <>
            <button className="mt-4 px-4 py-2 bg-green-500 text-black rounded" onClick={incrementScore}>
              +1
            </button>
            <button className="mt-2 px-4 py-2 bg-red-500 text-black rounded" onClick={endConnection}>
              End
            </button>
          </>
        )}
      </div>
    </div>
  );
}
