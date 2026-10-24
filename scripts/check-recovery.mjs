import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { base, driver, until, sendRaw } from "./helpers/multiplayer.mjs";
const browser = await chromium.launch();
try {
  const a = await driver(browser, "RepriseA"),
    b = await driver(browser, "RepriseB", a.state.view.code);
  await a.page.getByRole("button", { name: "Je suis prêt" }).click();
  await b.page.getByRole("button", { name: "Je suis prêt" }).click();
  await until(
    () => a.state.view.phase === "racing" && b.state.view.phase === "racing",
  );
  const raceId = a.state.view.raceId,
    start = a.state.view.startsAt;
  const second = await a.context.newPage();
  await second.goto(`${base}/room/${a.state.view.code}`);
  await a.page.getByRole("button", { name: "Reprendre ici" }).waitFor();
  await second.locator(".calculation-panel").waitFor();
  await a.page.getByRole("button", { name: "Reprendre ici" }).click();
  await second.getByRole("button", { name: "Reprendre ici" }).waitFor();
  await second.close();
  await until(
    () =>
      a.state.view.raceId === raceId &&
      a.state.view.members.every((m) => m.connected),
  );
  assert.equal(a.state.view.startsAt, start);
  console.log(
    "Reprise entre onglets sans double connexion ni nouveau départ OK",
  );
  const denied = await a.context.request.post(`${base}/api/rooms`, {
    headers: { Origin: "https://autre-origine.invalid" },
    data: { name: "Intrus" },
  });
  assert.equal(denied.status(), 403);
  const closeCode = await a.page.evaluate(
    () =>
      new Promise((resolve) => {
        const socket = new WebSocket(
          `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/api/rooms/${location.pathname.split("/").at(-1)}/socket`,
        );
        const uuid = () => {
          const bytes = crypto.getRandomValues(new Uint8Array(16));
          bytes[6] = (bytes[6] & 15) | 64;
          bytes[8] = (bytes[8] & 63) | 128;
          const hex = [...bytes]
            .map((x) => x.toString(16).padStart(2, "0"))
            .join("");
          return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
        };
        socket.onopen = () =>
          socket.send(
            JSON.stringify({ type: "auth", token: uuid(), clientId: uuid() }),
          );
        socket.onclose = (event) => resolve(event.code);
      }),
  );
  assert.equal(closeCode, 4001);
  console.log("Origine étrangère et faux jeton refusés OK");
  await b.page.evaluate(() =>
    window.__raceSocket.close(4000, "Coupure de test"),
  );
  await until(() =>
    a.state.view.members.some((member) => member.id === 1 && !member.connected),
  );
  await b.context.setOffline(true);
  await until(() =>
    a.state.view.members.some((m) => m.id === 1 && !m.connected),
  );
  console.log("Attente du délai réel de reconnexion avant abandon…");
  await until(() => a.state.view.phase === "finished", 30000);
  assert.equal(a.state.view.reason, "forfeit");
  assert.equal(a.state.view.state.winner, 0);
  assert.ok(a.state.view.state.time >= 20000);
  assert.ok(a.state.view.state.time < 61000);
  await b.context.setOffline(false);
  await until(() => b.state.view.phase === "finished");
  assert.equal(b.state.view.reason, "forfeit");
  assert.equal(b.state.view.state.winner, 0);
  await a.page.getByText(/Victoire par abandon/).waitFor();
  assert.deepEqual(a.state.errors, []);
  assert.deepEqual(b.state.errors, []);
  console.log(
    "Abandon après 20 secondes, retour du joueur et résultat commun conservé OK",
  );
} finally {
  await browser.close();
}
