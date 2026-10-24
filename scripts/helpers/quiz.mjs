import { until } from "./multiplayer.mjs";
import { readFile } from "node:fs/promises";
const countriesSource = await readFile(new URL("../../src/constants/worldCountries.ts", import.meta.url), "utf8");
export const countries = new Map(countriesSource.split("\n").filter((line) => line.trim().startsWith('["'))
  .map((line) => JSON.parse(line.trim().replace(/,$/, ""))).map(([id, country, capital]) => [id, { country, capital }]));
const cultureSource = await readFile(new URL("../../src/constants/cultureQuestions.ts", import.meta.url), "utf8");
const culture = new Map([...cultureSource.matchAll(/const (veryEasy|easy|medium|hard): Row\[\] = \[([\s\S]*?)\n\];/g)]
  .flatMap(([, level, block]) => block.split("\n").filter((line) => line.trim().startsWith('["'))
    .map((line, index) => [`${level}-${index}`, JSON.parse(line.trim().replace(/,$/, ""))[1]])));
export function correctValue(question) {
  if (question.kind === "capital") return question.choices.indexOf(countries.get(question.countryId).capital);
  if (question.kind === "quiz") return question.choices.indexOf(question.theme === "flags"
    ? countries.get(question.entryId).country : culture.get(question.entryId));
  return question.operator === "+" ? question.a + question.b
    : question.operator === "−" ? question.a - question.b : question.a * question.b;
}
export async function selectThemes(driver, names) {
  const labels = ["Maths", "Capitales d’Europe", "Capitales du monde", "Culture générale", "Drapeaux du monde"];
  for (const label of names) {
    const input = driver.page.getByRole("checkbox", { name: label, exact: true });
    if (!await input.isChecked()) {
      await input.click();
      await until(() => input.isChecked());
    }
  }
  for (const label of labels.filter((name) => !names.includes(name))) {
    const input = driver.page.getByRole("checkbox", { name: label, exact: true });
    if (await input.isChecked()) {
      await input.click();
      await until(async () => !await input.isChecked());
    }
  }
}

const europeSource = await readFile(new URL("../../src/constants/europeCapitals.ts", import.meta.url), "utf8");
export const europeIds = new Set([...europeSource.matchAll(/\["([A-Z]{2})",/g)].map((match) => match[1]));
