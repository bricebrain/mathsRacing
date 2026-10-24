import type { Room } from "./model";
export function readRoom(storage: DurableObjectStorage): Room | null {
  const row = storage.sql
    .exec<{ data: string }>("SELECT data FROM room WHERE id=1")
    .toArray()[0];
  return row ? (JSON.parse(row.data) as Room) : null;
}
export function saveRoom(storage: DurableObjectStorage, room: Room) {
  room.revision++;
  storage.sql.exec(
    "INSERT INTO room (id,data) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data",
    JSON.stringify(room),
  );
}
