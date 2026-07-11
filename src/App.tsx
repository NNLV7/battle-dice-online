import "./App.css";
import DiceScene from "./DiceScene";
import RollLogPanel from "./RollLogPanel";
import { socket } from "./socket";
import {
  useEffect,
  useRef,
  useState,
} from "react";

type DiceResult =
  | "sword"
  | "sparkles"
  | "shield"
  | "shield-alert"
  | "blank";

type RollLog = {
  id: string;
  roomId: string;
  playerId: string;
  time: string;
  playerName: string;
  diceType: "ATK" | "DEF";
  results: DiceResult[];
};

function App() {
  const [rollTrigger, setRollTrigger] =
    useState(0);

  const [attackDice, setAttackDice] =
    useState(3);

  const [defenseDice, setDefenseDice] =
    useState(2);

  const [rollType, setRollType] = useState<
    "attack" | "defense"
  >("attack");

  const [playerName, setPlayerName] =
    useState("Player A");

  const [results, setResults] = useState<
    DiceResult[]
  >([]);

  const [logs, setLogs] = useState<RollLog[]>(
    []
  );

  const [showLog, setShowLog] =
    useState(false);

  const [roomId, setRoomId] = useState("");
  const [joinCode, setJoinCode] =
    useState("");

  const [playerCount, setPlayerCount] =
    useState(1);

  const [roomError, setRoomError] =
    useState("");

  const [isConnected, setIsConnected] =
    useState(false);

  const currentResultsRef = useRef<
    DiceResult[]
  >([]);


  // ป้องกัน Log เดิมถูกแสดงซ้ำ
  const displayedLogIdsRef = useRef(
    new Set<string>()
  );

  const diceCount =
    rollType === "attack"
      ? attackDice
      : defenseDice;

  useEffect(() => {
    const savedLogs = localStorage.getItem(
      "battle-dice-logs"
    );

    if (!savedLogs) return;

    try {
      const parsedLogs: RollLog[] =
        JSON.parse(savedLogs);

      setLogs(parsedLogs);

      displayedLogIdsRef.current = new Set(
        parsedLogs.map((log) => log.id)
      );
    } catch {
      localStorage.removeItem(
        "battle-dice-logs"
      );
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "battle-dice-logs",
      JSON.stringify(logs)
    );
  }, [logs]);

  useEffect(() => {
    socket.connect();

    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("room-created", (data) => {
      setRoomId(data.roomCode);
      setPlayerCount(data.players.length);
      setRoomError("");
    });

    socket.on("room-updated", (data) => {
      setRoomId(data.roomCode);
      setPlayerCount(data.players.length);
      setRoomError("");
    });

    socket.on(
      "join-error",
      (message: string) => {
        setRoomError(message);
      }
    );

    socket.on(
      "roll-started",
      (data: {
        rollId: string;
        roomCode: string;
        rollType: "attack" | "defense";
        diceCount: number;
        results: DiceResult[];
        playerName: string;
      }) => {
        currentResultsRef.current = [];
    

        setResults([]);
        setRollType(data.rollType);

        if (data.rollType === "attack") {
          setAttackDice(data.diceCount);
        } else {
          setDefenseDice(data.diceCount);
        }

        // รอให้ชนิดและจำนวนลูกเต๋า Render ก่อน
        requestAnimationFrame(() => {
          setResults(data.results);
          setRollTrigger((value) => value + 1);
        });
      }
    );

    socket.on("log-added", (log: RollLog) => {
  window.setTimeout(() => {
    if (displayedLogIdsRef.current.has(log.id)) return;

    displayedLogIdsRef.current.add(log.id);

    setLogs((previousLogs) => [
      log,
      ...previousLogs,
    ]);
  }, 3000);
});

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("room-created");
      socket.off("room-updated");
      socket.off("join-error");
      socket.off("roll-started");
      socket.off("log-added");

      socket.disconnect();
    };
  }, []);

  const handleRoll = () => {
    if (!roomId) return;

    currentResultsRef.current = [];
    setResults([]);

    socket.emit("roll-dice", {
      roomCode: roomId,
      rollType,
      diceCount,
      playerName,
    });
  };

  const handleResult = (
    index: number,
    result: DiceResult
  ) => {
  const next = [...currentResultsRef.current];

  next[index] = result;

  currentResultsRef.current = next;
  setResults(next);
};

  const createRoom = () => {
    socket.emit("create-room");
  };

  const joinRoom = () => {
    const code = joinCode.trim();

    if (!code) return;

    socket.emit("join-room", code);
  };

  const clearLogs = () => {
    setLogs([]);
    displayedLogIdsRef.current.clear();

    localStorage.removeItem(
      "battle-dice-logs"
    );
  };

  return (
    <div className="app">
      <h1>🎲 Battle Dice Online</h1>

      <div className="room">
        <span>
          Room : {roomId || "No Room"}
        </span>

        <span>
          Players : {playerCount}/8
        </span>

        <span>
          {isConnected
            ? "🟢 Online"
            : "🔴 Offline"}
        </span>

        <button
          onClick={() =>
            setShowLog((value) => !value)
          }
        >
          📜 Log
        </button>
      </div>

      <div className="room-controls">
        <button onClick={createRoom}>
          Create Room
        </button>

        <input
          value={joinCode}
          onChange={(event) =>
            setJoinCode(event.target.value)
          }
          placeholder="Room Code"
        />

        <button onClick={joinRoom}>
          Join Room
        </button>

        {roomError && (
          <span>{roomError}</span>
        )}
      </div>

      <div className="table">
        <DiceScene
          rollTrigger={rollTrigger}
          attackDice={attackDice}
          defenseDice={defenseDice}
          rollType={rollType}
          results={results}
          onResult={handleResult}
        />
      </div>

      <div className="panel">
        <div className="row">
          <span>Player Name</span>

          <input
            value={playerName}
            onChange={(event) =>
              setPlayerName(
                event.target.value
              )
            }
          />
        </div>

        <div className="row">
          <span>⚔ Attack Dice</span>

          <div>
            <button
              onClick={() =>
                setAttackDice(
                  Math.max(
                    1,
                    attackDice - 1
                  )
                )
              }
            >
              -
            </button>

            <span>{attackDice}</span>

            <button
              onClick={() =>
                setAttackDice(
                  Math.min(
                    10,
                    attackDice + 1
                  )
                )
              }
            >
              +
            </button>
          </div>
        </div>

        <div className="row">
          <span>🛡 Defense Dice</span>

          <div>
            <button
              onClick={() =>
                setDefenseDice(
                  Math.max(
                    1,
                    defenseDice - 1
                  )
                )
              }
            >
              -
            </button>

            <span>{defenseDice}</span>

            <button
              onClick={() =>
                setDefenseDice(
                  Math.min(
                    10,
                    defenseDice + 1
                  )
                )
              }
            >
              +
            </button>
          </div>
        </div>

        <div className="row">
          <button
            onClick={() =>
              setRollType("attack")
            }
          >
            ⚔ Attack Roll
          </button>

          <button
            onClick={() =>
              setRollType("defense")
            }
          >
            🛡 Defense Roll
          </button>
        </div>

        <button
          className="roll"
          onClick={handleRoll}
          disabled={!roomId}
        >
          {rollType === "attack"
            ? "⚔ Roll Attack Dice"
            : "🛡 Roll Defense Dice"}
        </button>
      </div>

      {showLog && (
        <RollLogPanel
          logs={logs}
          onClear={clearLogs}
        />
      )}
    </div>
  );
}

export default App;