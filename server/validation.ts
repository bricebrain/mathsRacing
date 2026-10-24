import { z } from "zod";
import { CAR_COLORS, RACE } from "../src/engine/config";
import type { ClientAction } from "../src/shared/protocol";
export const nameSchema = z.string().trim().min(1).max(16);
const raceAction = {
  actionId: z.uuid(),
  raceId: z.uuid(),
  operationId: z
    .number()
    .int()
    .min(0)
    .max(RACE.sequenceLength - 1),
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
