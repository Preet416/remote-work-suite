import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";

const SOCKET_SERVER_URL = "http://localhost:5000";

export default function MeetingRoom({ roomId, username, isHost }) {
  const [peers, setPeers] = useState([]);
  const [waitingUsers, setWaitingUsers] = useState([]);
  const [approved, setApproved] = useState(isHost ? new Set() : new Set());
  const [joined, setJoined] = useState(false);

  const socketRef = useRef();
  const userVideo = useRef();
  const peersRef = useRef([]);

  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER_URL);

    if (isHost) {
      // Host joins automatically
      setJoined(true);
      approved.add(socketRef.current.id);
    } else {
      // Non-host requests approval
      socketRef.current.emit("join-room-request", { roomId, username });
    }

    socketRef.current.on("waiting-user", ({ socketId, username }) => {
      setWaitingUsers((prev) => [...prev, { socketId, username }]);
    });

    socketRef.current.on("approved-to-join", () => {
      setJoined(true);
      initMediaStream();
    });

    socketRef.current.on("new-user-approved", ({ socketId }) => {
      const peer = createPeer(socketId, socketRef.current.id, userVideo.current.srcObject);
      peersRef.current.push({ peerID: socketId, peer });
      setPeers((prev) => [...prev, peer]);
    });

    socketRef.current.on("signal", ({ from, signal }) => {
      const item = peersRef.current.find((p) => p.peerID === from);
      if (item) {
        item.peer.signal(signal);
      } else if (joined) {
        const peer = addPeer(signal, from, userVideo.current.srcObject);
        peersRef.current.push({ peerID: from, peer });
        setPeers((prev) => [...prev, peer]);
      }
    });

    socketRef.current.on("user-disconnected", (userId) => {
      const item = peersRef.current.find((p) => p.peerID === userId);
      if (item) item.peer.destroy();
      peersRef.current = peersRef.current.filter((p) => p.peerID !== userId);
      setPeers(peersRef.current.map((p) => p.peer));
    });

    if (isHost) {
      initMediaStream();
    }
  }, []);

  const initMediaStream = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        userVideo.current.srcObject = stream;
      })
      .catch((err) => console.error("Media error:", err));
  };

  const approveUser = (socketId) => {
    socketRef.current.emit("approve-user", { roomId, socketIdToApprove: socketId });
    setWaitingUsers(waitingUsers.filter((u) => u.socketId !== socketId));
  };

  function createPeer(userToSignal, callerID, stream) {
    const peer = new Peer({ initiator: true, trickle: false, stream });
    peer.on("signal", (signal) => {
      socketRef.current.emit("signal", { to: userToSignal, from: callerID, signal });
    });
    return peer;
  }

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({ initiator: false, trickle: false, stream });
    peer.on("signal", (signal) => {
      socketRef.current.emit("signal", { to: callerID, from: socketRef.current.id, signal });
    });
    peer.signal(incomingSignal);
    return peer;
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900 p-4 gap-4 overflow-auto">
      <h1 className="text-indigo-400 text-2xl mb-4">Meeting Room: {roomId}</h1>

      {isHost && waitingUsers.length > 0 && (
        <div className="mb-4 p-4 bg-gray-800 rounded-lg">
          <h2 className="text-lg text-indigo-300 mb-2">Waiting for approval:</h2>
          {waitingUsers.map((user) => (
            <div key={user.socketId} className="flex justify-between items-center mb-2">
              <span>{user.username}</span>
              <button
                className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                onClick={() => approveUser(user.socketId)}
              >
                Approve
              </button>
            </div>
          ))}
        </div>
      )}

      {!joined && !isHost && <p className="text-gray-400">Waiting for host approval...</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {joined && (
          <video
            ref={userVideo}
            autoPlay
            muted
            playsInline
            className="w-full rounded-lg border-2 border-indigo-400"
          />
        )}
        {peers.map((peer, index) => (
          <Video key={index} peer={peer} />
        ))}
      </div>
    </div>
  );
}

function Video({ peer }) {
  const ref = useRef();
  useEffect(() => {
    peer.on("stream", (stream) => {
      if (ref.current) ref.current.srcObject = stream;
    });
  }, [peer]);
  return <video ref={ref} autoPlay playsInline className="w-full rounded-lg border-2 border-gray-400" />;
}
