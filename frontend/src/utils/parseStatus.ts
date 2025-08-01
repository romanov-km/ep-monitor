// Унифицированная функция для определения, что сервер работает
export function parseStatus(entry: { status: string }) {
  return (
    entry.status.toUpperCase().includes("UP") || entry.status.includes("🟢")
  );
}
