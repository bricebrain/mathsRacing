import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { base, driver, pause, until, sendRaw } from "./helpers/multiplayer.mjs";
import { correctValue, selectThemes } from "./helpers/quiz.mjs";
const count = Number(process.env.PLAYERS ?? 4);
if (![3, 4].includes(count)) throw new Error("PLAYERS doit valoir 3 ou 4.");
const last = count - 1;
const browser = await chromium.launch();
try {
  const a = await driver(browser, "Alice");
  const code = a.state.view.code;
  await a.page.getByRole("button", { name: `${count} joueurs`, exact: true }).click();
  await until(() => a.state.view.capacity === count);
  await selectThemes(a, ["Culture générale", "Drapeaux du monde"]);
  const names = ["Bob", "Chloé", "David"].slice(0, last);
  const joined = await Promise.all(names.map(async (name) => {
    const response = await a.context.request.post(`${base}/api/rooms/${code}/join`, { data: { name } });
    assert.equal(response.status(), 200);
    return { name, session: await response.json() };
  }));
  assert.equal(new Set(joined.map((item) => item.session.playerId)).size, last);
  const all = [a];
  for (const { name, session } of joined.sort((a, b) => a.session.playerId - b.session.playerId))
    all.push(await driver(browser, name, code, session));
  await until(() => all.every((d) => d.state.view.members.length === count));
  const extra = await a.context.request.post(`${base}/api/rooms/${code}/join`, { data: { name: "En trop" } });
  assert.equal(extra.status(), 409);
  assert.equal(new Set(a.state.view.members.map((member) => member.color)).size, count);
  assert.equal(await all[last].page.getByRole("button", { name: "3 joueurs", exact: true }).isDisabled(), true);
  console.log(`${count} inscriptions dont ${last} simultanées, identités/couleurs uniques et place supplémentaire refusée OK`, code);
  for (const d of all.slice(0, last)) await d.page.getByRole("button", { name: "Je suis prêt" }).click();
  await pause(250);
  assert.equal(a.state.view.phase, "lobby");
  await all[last].page.getByRole("button", { name: "Je suis prêt" }).click();
  await until(() => all.every((d) => d.state.view.raceId && ["countdown", "racing"].includes(d.state.view.phase)))
    .catch((error) => {
      console.error("Départ", all.map((d) => ({ self: d.state.view.selfId, phase: d.state.view.phase,
        members: d.state.view.members.map(({ id, ready, connected }) => ({ id, ready, connected })),
        sent: d.state.sent.filter((action) => action.type === "ready") })));
      throw error;
    });
  assert.equal(new Set(all.map((d) => d.state.view.startsAt)).size, 1);
  await until(() => all.every((d) => d.state.view.phase === "racing"));
  all.forEach((d) => assert.deepEqual(d.state.view.question, a.state.view.question));
  const initial = a.state.view.question;
  await all[last].page.getByRole("group", { name: "Réponses proposées" })
    .getByRole("button").nth(correctValue(initial)).click();
  await until(() => all[last].state.view.state.players[last].correct === 1);
  assert.equal(a.state.view.state.players[0].correct, 0);
  await sendRaw(a, { type: "answer", actionId: crypto.randomUUID(), raceId: a.state.view.raceId,
    operationId: initial.id, value: String((correctValue(initial) + 1) % 4) });
  await until(() => a.state.view.correction);
  all.slice(1).forEach((d) => assert.equal(d.state.view.correction, null));
  await until(() => a.state.view.question?.id === initial.id + 1);
  await all[last].context.setOffline(true);
  await pause(800);
  await all[last].context.setOffline(false);
  await until(() => a.state.view.members.every((m) => m.connected));
  await all[last].page.reload();
  await until(() => all[last].state.view.selfId === last && all[last].state.view.members.every((m) => m.connected));
  assert.equal(all[last].state.view.state.players[last].correct, 1);
  console.log(`Départ à ${count}, questions communes, progression indépendante, correction privée et reprise du dernier joueur OK`);
  for (const d of [a, all[last]]) {
    await d.page.setViewportSize({ width: 375, height: 667 });
    await d.page.locator(`.race-canvas[data-player-count="${count}"] canvas`).waitFor();
    assert.equal(await d.page.locator(".score-driver").count(), count);
    assert.equal(await d.page.locator(".driver-name").first().textContent(), d.state.view.members[d.state.view.selfId].name);
    const layout = await d.page.evaluate(() => ({ width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      height: innerHeight, scrollHeight: document.documentElement.scrollHeight }));
    assert.equal(layout.scrollWidth, layout.width);
    assert.equal(layout.scrollHeight, layout.height);
    await d.page.screenshot({ path: `/tmp/racing-four-${d.state.view.selfId}.png`, fullPage: true });
  }
  console.log(`${count} voitures et positions, joueur local en tête d’affichage, écran 375×667 OK`);
  const deadline = Date.now() + 65000;
  while (a.state.view.phase !== "finished" && Date.now() < deadline) {
    const question = a.state.view.question;
    if (question && !a.state.view.correction) await sendRaw(a, {
      type: "answer", actionId: crypto.randomUUID(), raceId: a.state.view.raceId,
      operationId: question.id, value: String(correctValue(question)),
    });
    await pause(500);
  }
  await until(() => all.every((d) => d.state.view.phase === "finished"));
  all.forEach((d) => assert.deepEqual(d.state.view.state.winners, [0]));
  for (const d of all) {
    await d.page.getByRole("dialog").waitFor();
    assert.equal(await d.page.locator(".result-card thead th").count(), count + 1);
    assert.equal(await d.page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(d.state.errors, []);
  }
  const previous = a.state.view.raceId;
  for (const d of all.slice(0, last)) await d.page.getByRole("button", { name: "Demander une revanche" }).click();
  await pause(250);
  assert.equal(a.state.view.raceId, previous);
  await all[last].page.getByRole("button", { name: "Demander une revanche" }).click();
  await until(() => all.every((d) => d.state.view.raceId !== previous && ["countdown", "racing"].includes(d.state.view.phase)));
  console.log(`Même vainqueur, bilan des ${count} pilotes et revanche après ${count} accords OK`);
} finally {
  await browser.close();
}
