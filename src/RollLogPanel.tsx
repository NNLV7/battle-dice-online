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

type Props = {
  logs: RollLog[];
  onClear: () => void;
};

function displayResult(result: string) {
  if (result === "sword") return "⚔";
  if (result === "sparkles") return "✨";
  if (result === "shield") return "🛡";
  if (result === "shield-alert") return "🛡️!";
  return "";
}

function exportLogs(logs: RollLog[]) {
  const text = logs
    .map((log) => {
      const results =
        log.results
          .filter((r) => r !== "blank")
          .map(displayResult)
          .join(" ") || "-";

      return `${log.time} | ${log.playerName} | ${log.diceType} | ${results}`;
    })
    .join("\n");

  const blob = new Blob([text], {
    type: "text/plain;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = "battle-dice-log.txt";
  a.click();

  URL.revokeObjectURL(url);
}

export default function RollLogPanel({ logs, onClear }: Props) {
  return (
    <div className="log-panel">
      <h2>📜 Roll Log</h2>

      <button onClick={onClear}>Clear Log</button>
      <button onClick={() => exportLogs(logs)}>
  Export Log
</button>

      {logs.length === 0 && <p>No log yet</p>}

      {logs.map((log) => (
        <div key={log.id} className="log-item">
          <span>{log.time}</span>
          <span>{log.playerName}</span>
          <span>{log.diceType}</span>
          <span>
            {log.results
              .filter((r) => r !== "blank")
              .map(displayResult)
              .join(" ") || "-"}
          </span>
        </div>
      ))}
    </div>
  );
}