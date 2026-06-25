import { z } from "zod";

export const askAiSalesAnalystSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, "Enter a question for AI Sales Analyst.")
    .max(1000, "Questions must be 1000 characters or less."),
  sessionId: z
    .string()
    .uuid("Select a valid AI chat session.")
    .optional()
    .or(z.literal("")),
});

export const aiChatSessionSchema = z.object({
  title: z
    .string()
    .trim()
    .max(120, "Session titles must be 120 characters or less.")
    .optional()
    .or(z.literal("")),
});

export const aiContextSummarySchema = z.object({}).default({});
