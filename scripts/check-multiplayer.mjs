import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import {
  base,
  pause,
  until,
  driver,
  answerCurrent,
  sendRaw,
  valueOf,
} from "./helpers/multiplayer.mjs";
const browser = await chromium.launch();
try {
  const a = await driver(browser, "Alice");
  const code = a.state.view.code;
  const b = await driver(browser, "Bob", code);
  await until(() => a.state.view.members.length === 2);
  assert.equal(
    a.state.view.members[0].color === a.state.view.members[1].color,
    false,
  );
  const third = await browser.newContext();
  const rejected = await third.request.post(`${base}/api/rooms/${code}/join`, {
    data: { name: "Troisième" },
  });
  assert.equal(rejected.status(), 409);
  await third.close();
  console.log(
    "Création, invitation, deux identités distinctes et salle complète OK",
    code,
  );
  await a.page.getByRole("button", { name: "Je suis prêt" }).click();
  await pause(300);
  assert.equal(a.state.view.phase, "lobby");
  await b.page.getByRole("button", { name: "Je suis prêt" }).click();
  await until(
    () =>
      a.state.view.phase === "countdown" && b.state.view.phase === "countdown",
  );
  assert.equal(a.state.view.startsAt, b.state.view.startsAt);
  assert.equal(a.state.view.raceId, b.state.view.raceId);
  assert.equal(a.state.view.question, null);
  await until(
    () => a.state.view.phase === "racing" && b.state.view.phase === "racing",
  );
  assert.deepEqual(a.state.view.question, b.state.view.question);
  await a.page.screenshot({
    path: "/tmp/math-racing-multiplayer.png",
    fullPage: true,
  });
  await until(() =>
    a.page.evaluate(() =>
      window.__audio.some(
        (p) =>
          !p.stopped &&
          !p.ended &&
          p.source.loop &&
          Math.abs(p.source.buffer.duration - 28.56) < 0.15,
      ),
    ),
  );
  console.log(
    "Départ commun, même première opération, ambiance audio et aucune séquence exposée OK",
  );
  await answerCurrent(a, 999);
  await until(() => a.state.view.state.players[0].errors === 1);
  const initial = b.state.view.question;
  await until(() => a.state.view.correction?.operationId === initial.id);
  assert.equal(await a.page.getByRole("button", { name: "Valider la réponse" }).isDisabled(), true);
  await until(() => a.state.view.question?.id === initial.id + 1);
  assert.equal(a.state.view.state.players[0].correct, 0);
  await answerCurrent(a);
  await until(() => a.state.view.state.players[0].correct === 1);
  assert.deepEqual(b.state.view.question, initial);
  const next = a.state.view.question;
  const action = a.state.sent
      .filter((action) => action.type === "answer")
      .at(-1),
    ackCount = a.state.acks.length;
  await sendRaw(a, action);
  await until(() => a.state.acks.length > ackCount);
  assert.equal(a.state.view.state.players[0].correct, 1);
  await answerCurrent(b);
  await until(() => b.state.view.state.players[1].correct === 1);
  assert.equal(b.state.view.question.id, initial.id + 1);
  console.log(
    "Erreurs, validation serveur, progression indépendante et dédoublonnage OK",
  );
  await b.context.setOffline(true);
  await until(() => b.page.getByText(/Connexion perdue/).isVisible());
  await pause(1500);
  await b.context.setOffline(false);
  await until(() => b.state.view.members.every((member) => member.connected));
  assert.equal(b.state.view.state.players[1].correct, 1);
  await b.page.reload();
  await until(() => b.state.view.members.every((member) => member.connected));
  await until(() => b.page.locator(".calculation-panel").isVisible());
  assert.equal(b.state.view.selfId, 1);
  console.log(
    "Coupure réseau et rechargement : identité et progression conservées OK",
  );
  for (const size of [
    { width: 375, height: 667 },
    { width: 360, height: 740 },
    { width: 390, height: 844 },
  ]) {
    await a.page.setViewportSize(size);
    await pause(100);
    const layout = await a.page.evaluate(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      height: innerHeight,
      scrollHeight: document.documentElement.scrollHeight,
    }));
    assert.equal(layout.width, layout.scrollWidth);
    assert.equal(layout.height, layout.scrollHeight);
  }
  await until(
    () =>
      b.state.view.state.time - b.state.view.state.players[1].questionAt >=
      8100,
  );
  await b.page.getByRole("button", { name: "Passer →" }).click();
  await until(() => b.state.view.state.players[1].skipped === 1);
  assert.equal(b.state.view.state.players[1].correct, 1);
  console.log(
    "Passage validé côté serveur après huit secondes, sans bonne réponse supplémentaire OK",
  );
  const deadline = Date.now() + 65000;
  let nextReport = Date.now() + 10000;
  while (a.state.view.phase !== "finished" && Date.now() < deadline) {
    if (a.state.view.question) {
      const current = a.state.view.question;
      const actionId = crypto.randomUUID();
      await sendRaw(a, {
        type: "answer",
        actionId,
        raceId: a.state.view.raceId,
        operationId: current.id,
        value: String(valueOf(current)),
      });
    }
    if (Date.now() >= nextReport) {
      console.log(
        "Course réelle en cours",
        Math.round(a.state.view.state.time / 1000),
        "s",
      );
      nextReport = Date.now() + 10000;
    }
    await pause(500);
  }
  await until(
    () =>
      a.state.view.phase === "finished" && b.state.view.phase === "finished",
  );
  assert.equal(a.state.view.state.winner, 0);
  assert.equal(b.state.view.state.winner, 0);
  assert.equal(a.state.view.state.time, b.state.view.state.time);
  assert.equal(b.state.view.state.players[1].finishedAt, null);
  await a.page.getByRole("dialog").waitFor();
  await b.page.getByRole("dialog").waitFor();
  await a.page.getByText(/À revoir/).click();
  assert.ok((await a.page.locator(".review-calculations li").count()) > 0);
  console.log(
    "Arrivée autoritaire, gagnant commun, chrono figé et corrections privées OK",
  );
  const previous = a.state.view.raceId;
  await a.page.getByRole("button", { name: "Demander une revanche" }).click();
  await pause(250);
  assert.equal(a.state.view.raceId, previous);
  await b.page.getByRole("button", { name: "Demander une revanche" }).click();
  await until(
    () =>
      a.state.view.raceId !== previous && a.state.view.phase === "countdown",
  );
  await until(() => b.state.view.raceId === a.state.view.raceId);
  assert.equal(a.state.view.startsAt, b.state.view.startsAt);
  assert.deepEqual(a.state.errors, []);
  assert.deepEqual(b.state.errors, []);
  console.log(
    "Revanche uniquement après deux accords et nouveau départ commun OK",
  );
} finally {
  await browser.close();
}
