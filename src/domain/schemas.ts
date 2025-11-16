import { z } from 'zod';

export const languageRegex = /^[a-z]{2}(-[A-Z]{2})?$/;

export const subjectCreateSchema = z.object({
  subject_type: z.string().min(1),
  external_ref: z.string().min(1),
  title: z.string().max(255).optional(),
  metadata: z.any().optional()
});

export const aspectSchema = z.object({
  aspect_key: z.string().min(1),
  rating: z.number().int().min(1).max(5)
});

export const reviewCreateSchema = z.object({
  external_user_id: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().max(10000).optional(),
  language: z.string().regex(languageRegex).optional(),
  is_verified_purchase: z.boolean().optional(),
  aspects: z.array(aspectSchema).optional()
});

export const voteSchema = z.object({
  voter_external_user_id: z.string().min(1),
  is_helpful: z.boolean()
});

export const flagSchema = z.object({
  flag_type: z.string().min(1),
  notes: z.string().max(2000).optional(),
  created_by_external_user_id: z.string().optional()
});
