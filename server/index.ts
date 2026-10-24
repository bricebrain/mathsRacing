import { readSmallBody } from "./http";
export { RacingRoom } from "./RacingRoom";
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url),
      origin = request.headers.get("Origin");
    if (origin && origin !== url.origin)
      return Response.json({ error: "Origine refusée." }, { status: 403 });
    if (url.pathname === "/api/health") return Response.json({ ok: true });
    if (
      !(
        await env.TRAFFIC.limit({
          key: request.headers.get("CF-Connecting-IP") ?? "local",
        })
      ).success
    )
      return Response.json(
        { error: "Trop de demandes. Réessaie dans une minute." },
        { status: 429 },
      );
    const match = url.pathname.match(
      /^\/api\/rooms\/([A-Z2-9]{6})\/(join|session|socket)$/,
    );
    const create = url.pathname === "/api/rooms" && request.method === "POST";
    if (!create && !match)
      return Response.json({ error: "Route inconnue." }, { status: 404 });
    if (match && request.method !== (match[2] === "join" ? "POST" : "GET"))
      return new Response(null, { status: 405 });
    try {
      if (request.method === "POST") {
        if (!request.headers.get("Content-Type")?.includes("application/json"))
          return Response.json({ error: "JSON attendu." }, { status: 400 });
        const body = await readSmallBody(request);
        if (body === null)
          return Response.json(
            { error: "Requête trop longue." },
            { status: 413 },
          );
        if (create) {
          for (let attempt = 0; attempt < 3; attempt++) {
            const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
            const code = Array.from(
              crypto.getRandomValues(new Uint8Array(6)),
              (byte) => alphabet[byte % alphabet.length],
            ).join("");
            const response = await env.ROOMS.getByName(code).fetch(
              new Request(`${url.origin}/api/rooms/${code}/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body,
              }),
            );
            if (response.status !== 409) return response;
          }
          return Response.json(
            { error: "Création impossible. Réessaie." },
            { status: 503 },
          );
        }
        return env.ROOMS.getByName(match![1]).fetch(
          new Request(request, { body }),
        );
      }
      return env.ROOMS.getByName(match![1]).fetch(request);
    } catch (error) {
      if (error instanceof SyntaxError)
        return Response.json({ error: "JSON invalide." }, { status: 400 });
      console.error(
        JSON.stringify({ event: "request.failed", path: url.pathname }),
      );
      return Response.json(
        { error: "Le serveur est indisponible. Réessaie." },
        { status: 500 },
      );
    }
  },
} satisfies ExportedHandler<Env>;
