import { THEME_IDS } from "../src/constants/themes";
import { z } from "zod";
import { CAR_COLORS, sequenceLength } from "../src/engine/config";
import type { ClientAction } from "../src/shared/protocol";
export const nameSchema = z.string().trim().min(1).max(16);
const raceAction = {
  actionId: z.uuid(),
  raceId: z.uuid(),
  operationId: z
    .number()
    .int()
    .min(0)
    .max(sequenceLength(10) - 1),
};
export const actionSchema: z.ZodType<ClientAction> = z.discriminatedUnion(
  "type",
  [
    z.object({
      type: z.literal("auth"),
      token: z.uuid(),
      clientId: z.uuid(),
      takeover: z.boolean().optional(),
    }),
    z.object({ type: z.literal("ping"), sentAt: z.number().finite() }),
    z.object({ type: z.literal("capacity"), capacity: z.union([z.literal(2), z.literal(3), z.literal(4)]) }),
    z.object({ type: z.literal("laps"), laps: z.union([z.literal(3), z.literal(5), z.literal(10)]) }),
    z.object({ type: z.literal("theme"), theme: z.enum(THEME_IDS), selected: z.boolean() }),
    z.object({ type: z.literal("themes"), themes: z.array(z.enum(THEME_IDS)).min(1)
      .max(THEME_IDS.length).refine((themes) => new Set(themes).size === themes.length) }),
    z.object({ type: z.literal("mode"), mode: z.enum(THEME_IDS) }),
    z.object({ type: z.literal("ready"), ready: z.boolean() }),
    z.object({ type: z.literal("color"), color: z.enum(CAR_COLORS) }),
    z.object({ type: z.literal("rematch"), ready: z.boolean() }),
    z.object({
      type: z.literal("answer"),
      ...raceAction,
      value: z.string().regex(/^\d{1,3}$/),
    }),
    z.object({ type: z.literal("skip"), ...raceAction }),
  ],
);
