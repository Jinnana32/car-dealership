import { z } from "zod";

import { assignmentUpdateSchema, followUpUpdateSchema, inquiryNoteSchema } from "@/features/inquiries/validators";
import {
  ACTIVE_PIPELINE_STATUSES,
  LOST_REASONS,
  PIPELINE_VIEW_MODES,
} from "@/features/pipeline/constants";

export const pipelineViewSchema = z
  .enum(PIPELINE_VIEW_MODES)
  .catch("board");

export const updateInquiryStatusSchema = z.object({
  inquiry_id: z.string().uuid("Invalid inquiry."),
  redirect_to: z.string().trim().optional(),
  status: z.enum(ACTIVE_PIPELINE_STATUSES),
});

export const moveInquiryToStageSchema = updateInquiryStatusSchema.extend({
  target_status: z.enum(ACTIVE_PIPELINE_STATUSES),
});

export const markInquiryLostSchema = z
  .object({
    inquiry_id: z.string().uuid("Invalid inquiry."),
    lost_reason: z.enum(LOST_REASONS),
    note: z
      .string()
      .trim()
      .max(5000, "Note must be 5000 characters or fewer.")
      .optional()
      .transform((value) => value ?? ""),
    redirect_to: z.string().trim().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.lost_reason === "other" && value.note.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add a note when the lost reason is Other.",
        path: ["note"],
      });
    }
  });

export const markInquiryWonSchema = z.object({
  confirm: z.literal("won"),
  inquiry_id: z.string().uuid("Invalid inquiry."),
  redirect_to: z.string().trim().optional(),
});

export {
  assignmentUpdateSchema,
  followUpUpdateSchema,
  inquiryNoteSchema,
};
