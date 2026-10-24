import assert from "node:assert/strict";
export const base = process.env.GAME_URL || "http://localhost:5175";
export const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export async function until(predicate, timeout = 12000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await pause(75);
  }
  throw Error("Condition multijoueur non satisfaite dans le délai attendu");
}
export async function driver(browser, name, code = "", savedSession = null) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } }),
    page = await context.newPage();
  const state = { view: null, acks: [], errors: [], sent: [], audio: [] };
  await page.addInitScript(() => {
    const Native = window.WebSocket;
    window.WebSocket = class extends Native {
      constructor(...args) {
        super(...args);
        if (String(args[0]).includes("/api/rooms/")) window.__raceSocket = this;
      }
    };
    window.__audio = [];
    const NativeAudio = window.AudioContext;
    window.AudioContext = class extends NativeAudio {
      createBufferSource() {
        const source = super.createBufferSource();
        const record = { source, ended: false, stopped: false };
        window.__audio.push(record);
        source.addEventListener("ended", () => (record.ended = true));
        const stop = source.stop.bind(source);
        source.stop = (...args) => {
          record.stopped = true;
          return stop(...args);
        };
        return source;
      }
    };
  });
  page.on("pageerror", (error) => state.errors.push(error.message));
  page.on("websocket", (socket) => {
    if (!socket.url().includes("/api/rooms/")) return;
    socket.on("framereceived", (event) => {
      let message;
      try {
        message = JSON.parse(String(event.payload));
      } catch {
        return;
      }
      if (message.type === "room.state") {
        state.view = message.view;
        assert.equal("sequence" in message.view.state, false);
        assert.equal("token" in message.view.members[0], false);
        if (message.view.phase !== "finished")
          assert.deepEqual(message.view.review, []);
      }
      if (message.type === "action.result") state.acks.push(message);
    });
    socket.on("framesent", (event) => {
      try {
        state.sent.push(JSON.parse(String(event.payload)));
      } catch {}
    });
  });
  if (savedSession) await page.addInitScript((session) => {
    localStorage.setItem(`mr:session:${session.code}`, JSON.stringify(session));
  }, savedSession);
  await page.goto(`${base}${code ? `/room/${code}` : "/"}`);
  if (!savedSession) {
  await page.getByLabel("Ton pseudo").fill(name);
  await page
    .getByRole("button", {
      name: code ? "Rejoindre la salle" : "Créer une salle",
    })
    .click();
  }
  await until(() => state.view?.members.some((member) => member.name === name));
  return { context, page, state };
}
export function valueOf(operation) {
  return operation.operator === "+"
    ? operation.a + operation.b
    : operation.operator === "−"
      ? operation.a - operation.b
      : operation.a * operation.b;
}
export async function answerCurrent(driver, value) {
  const { page, state } = driver;
  await until(() => state.view?.phase === "racing" && state.view.question);
  await until(() =>
    page.getByRole("button", { name: "Valider la réponse" }).isEnabled(),
  );
  const operation = state.view.question;
  const before = state.acks.length;
  await pause(350);
  await page.keyboard.type(String(value ?? valueOf(operation)));
  await page.keyboard.press("Enter");
  await until(() => state.acks.length > before);
}
export async function sendRaw(driver, action) {
  await driver.page.evaluate(
    (action) => window.__raceSocket.send(JSON.stringify(action)),
    action,
  );
}
