import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { driver, pause, until } from "./helpers/multiplayer.mjs";
const source = await readFile(new URL("../src/constants/europeCapitals.ts", import.meta.url), "utf8");
const capitals = new Map([...source.matchAll(/\["([A-Z]{2})", "[^"]+", "([^"]+)"/g)]
  .map((match) => [match[1], match[2]]));
const browser = await chromium.launch();
try {
  const a = await driver(browser, "Alice Géo");
  const b = await driver(browser, "Bob Géo", a.state.view.code);
  await until(() => a.state.view.members.length === 2);
  assert.equal(a.state.view.state.laps, 3);
  assert.equal(await b.page.getByRole("button", { name: "10 tours", exact: true }).isDisabled(), true);
  assert.equal(await b.page.getByRole("button", { name: "Capitales d’Europe", exact: true }).isDisabled(), true);
  await b.page.getByRole("button", { name: "Je suis prêt" }).click();
  await until(() => a.state.view.members[1].ready);
  await a.page.getByRole("button", { name: "Capitales d’Europe", exact: true }).click();
  await until(() => a.state.view.mode === "capitals" && b.state.view.mode === "capitals");
  assert.ok(a.state.view.members.every((m) => !m.ready));
  for (const laps of [5, 10]) {
    await a.page.getByRole("button", { name: `${laps} tours`, exact: true }).click();
    await until(() => a.state.view.state.laps === laps && b.state.view.state.laps === laps);
  }
  for (const d of [a, b]) await d.page.getByRole("button", { name: "Je suis prêt" }).click();
  await until(() => a.state.view.phase === "racing" && b.state.view.phase === "racing");
  assert.equal(a.state.view.state.laps, 10);
  await a.page.locator(".driver-progress").first().getByText(/\/ 10/).waitFor();
  assert.deepEqual(a.state.view.question, b.state.view.question);
  const question = a.state.view.question;
  const correct = question.choices.indexOf(capitals.get(question.countryId));
  assert.ok(correct >= 0);
  const options = a.page.getByRole("group", { name: /Capitales proposées/ }).getByRole("button");
  assert.equal(await options.count(), 4);
  assert.equal(await a.page.locator(".keypad").count(), 0);
  await options.nth((correct + 1) % 4).click();
  await until(() => a.state.view.state.players[0].errors === 1);
  assert.equal(a.state.view.question.id, question.id);
  await pause(350);
  // Entrée sur un bouton focalisé reste une validation accessible native.
  await options.nth(correct).focus();
  await a.page.keyboard.press("Enter");
  await until(() => a.state.view.state.players[0].correct === 1);
  assert.equal(b.state.view.question.id, question.id);
  await b.page.keyboard.press(String(correct + 1));
  await until(() => b.state.view.state.players[1].correct === 1);
  assert.deepEqual(a.state.view.question, b.state.view.question);
  console.log("Mode commun, accord annulé au changement, QCM, erreur, Entrée et touches 1–4 OK");
  for (const size of [{ width: 375, height: 667 }, { width: 360, height: 740 }, { width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
    await a.page.setViewportSize(size);
    await pause(150);
    const layout = await a.page.evaluate(() => ({ width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      height: innerHeight, scrollHeight: document.documentElement.scrollHeight }));
    assert.equal(layout.scrollWidth, layout.width);
    if (size.width < 700) assert.equal(layout.scrollHeight, layout.height);
    await a.page.screenshot({ path: `/tmp/capitals-racing-${size.width}.png`, fullPage: true });
  }
  await b.page.reload();
  await until(() => b.state.view.phase === "racing" && b.state.view.members.every((m) => m.connected));
  await b.page.getByRole("group", { name: /Capitales proposées/ }).waitFor();
  assert.equal(b.state.view.mode, "capitals");
  assert.equal(b.state.view.state.laps, 10);
  assert.equal(b.state.view.state.players[1].correct, 1);
  await until(() => b.state.view.state.time - b.state.view.state.players[1].questionAt >= 8100);
  await b.page.getByRole("button", { name: "Passer →" }).click();
  await until(() => b.state.view.state.players[1].skipped === 1);
  assert.deepEqual(a.state.errors, []);
  assert.deepEqual(b.state.errors, []);
  console.log("Affichage mobile/desktop, rechargement, progression conservée et passage à 8 secondes OK");
} finally {
  await browser.close();
}
