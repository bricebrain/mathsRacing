import type { Room } from "./model";
export function readRoom(storage: DurableObjectStorage): Room | null {
  const row = storage.sql
    .exec<{ data: string }>("SELECT data FROM room WHERE id=1")
    .toArray()[0];
  if (!row) return null;
  const room = JSON.parse(row.data) as Room;
  room.capacity ??= 2;
  room.mode ??= "math";
  room.themes ??= [room.mode];
  room.laps ??= 3;
  if (room.race) {
    room.race.laps ??= 3;
    room.race.winners ??= room.race.winner === null ? [] : room.race.winner >= 0
      ? [room.race.winner] : room.race.players.flatMap((player, id) => player.finishedAt === null ? [] : [id]);
    room.race.players.forEach((player) => {
      player.correctionUntil ??= null;
      player.eliminatedAt ??= null;
    });
  }
  return room;
}
export function saveRoom(storage: DurableObjectStorage, room: Room) {
  room.revision++;
  storage.sql.exec(
    "INSERT INTO room (id,data) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data",
    JSON.stringify(room),
  );
}
