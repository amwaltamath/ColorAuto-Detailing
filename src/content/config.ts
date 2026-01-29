import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.date(),
    image: z.string(),
    imageAlt: z.string(),
    category: z.enum(['detailing', 'ppf', 'ceramic-coating', 'window-tint', 'color-ppf']),
    featured: z.boolean().default(false),
    author: z.string().default('ColorAuto Team'),
    location: z.string().default('Grand Junction, CO'),
  }),
});

export const collections = {
  blog,
};
