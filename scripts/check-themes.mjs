import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { driver, pause, until, sendRaw } from "./helpers/multiplayer.mjs";
import { correctValue, selectThemes, europeIds } from "./helpers/quiz.mjs";
const browser = await chromium.launch();
try {
  const a = await driver(browser, "Alice thèmes");
  const b = await driver(browser, "Bob thèmes", a.state.view.code);
  await until(() => a.state.view.members.length === 2);
  await selectThemes(a, ["Capitales d’Europe", "Capitales du monde", "Culture générale", "Drapeaux du monde", "Maths"]);
  await until(() => b.state.view.themes.length === 5);
  assert.equal(await b.page.getByRole("checkbox", { name: "Culture générale", exact: true }).isDisabled(), true);
  await a.page.getByRole("button", { name: "10 tours", exact: true }).click();
  await until(() => a.state.view.state.laps === 10);
  await a.page.screenshot({ path: "/tmp/racing-themes-lobby.png", fullPage: true });
  for (const d of [a, b]) await d.page.getByRole("button", { name: "Je suis prêt" }).click();
  await until(() => a.state.view.phase === "racing" && b.state.view.phase === "racing");
  assert.deepEqual(a.state.view.question, b.state.view.question);
  const question = a.state.view.question;
  const correct = correctValue(question);
  const choice = !!question.choices;
  await sendRaw(a, { type: "answer", actionId: crypto.randomUUID(), raceId: a.state.view.raceId,
    operationId: question.id, value: choice ? String((correct + 1) % 4) : "999" });
  await until(() => a.state.view.correction?.operationId === question.id);
  const untilTime = a.state.view.correction.until;
  assert.equal(b.state.view.correction, null);
  assert.equal(await a.page.getByRole("button", { name: /Passer/ }).isDisabled(), true);
  await sendRaw(a, { type: "answer", actionId: crypto.randomUUID(), raceId: a.state.view.raceId,
    operationId: question.id, value: String(correct) });
  await pause(300);
  assert.equal(a.state.view.state.players[0].correct, 0);
  assert.equal(a.state.view.state.players[0].errors, 1);
  await a.page.reload();
  await until(() => a.state.view.members.every((m) => m.connected));
  await until(() => a.state.view.question?.id === question.id + 1);
  assert.ok(a.state.view.state.time >= untilTime);
  assert.equal(a.state.view.state.players[0].correct, 0);
  console.log("Sélection de cinq thèmes, correction privée, tentatives bloquées et rechargement OK");
  const seen = new Set();
  for (let i = 0; i < 12 && seen.size < 5; i++) {
    await until(() => a.state.view.question && !a.state.view.correction);
    const current = a.state.view.question;
    const theme = current.kind === "quiz" ? current.theme
      : current.kind === "capital" ? "capital" : "math";
    seen.add(theme === "capital" ? (europeIds.has(current.countryId) ? "europe" : "world") : theme);
    if (theme === "flags") {
      const flag = a.page.getByAltText("Drapeau à identifier");
      await flag.waitFor();
      assert.equal(await flag.evaluate((img) => img.complete && img.naturalWidth > 0), true);
    }
    for (const size of [{ width: 375, height: 667 }, { width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
      await a.page.setViewportSize(size);
      await pause(50);
      const overflow = await a.page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      assert.equal(overflow, false);
      await a.page.screenshot({ path: `/tmp/racing-${theme}-${size.width}.png`, fullPage: true });
    }
    const value = correctValue(current);
    assert.ok(value >= 0);
    const count = a.state.view.state.players[0].correct;
    if (current.choices) {
      await a.page.getByRole("group", { name: /proposées/ }).getByRole("button").nth(value).click();
    } else {
      await a.page.keyboard.type(String(value));
      await a.page.keyboard.press("Enter");
    }
    await until(() => a.state.view.state.players[0].correct === count + 1);
    await pause(350);
  }
  assert.equal(seen.size, 5);
  assert.deepEqual(a.state.errors, []);
  assert.deepEqual(b.state.errors, []);
  console.log("Cinq thèmes jouables, drapeaux SVG chargés, réponses et formats téléphone/ordinateur OK");
} finally {
  await browser.close();
}
