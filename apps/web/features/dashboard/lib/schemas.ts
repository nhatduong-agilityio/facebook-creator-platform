import { z } from 'zod';

export const postFormSchema = z.object({
  title: z
    .string()
    .trim()
    .max(120, 'Use 120 characters or fewer')
    .or(z.literal('')),
  content: z.string().trim().min(1, 'Post content is required'),
  mediaUrl: z.string().trim().url('Enter a valid URL').or(z.literal('')),
  facebookAccountId: z
    .string()
    .trim()
    .uuid('Choose a valid account')
    .or(z.literal(''))
});

export const facebookCallbackSchema = z.object({
  code: z.string().trim().min(1, 'Facebook authorization code is required'),
  pageId: z.string().trim().or(z.literal(''))
});

export type PostFormValues = z.infer<typeof postFormSchema>;
export type FacebookCallbackValues = z.infer<typeof facebookCallbackSchema>;

export const emptyPostForm: PostFormValues = {
  title: '',
  content: '',
  mediaUrl: '',
  facebookAccountId: ''
};

export const emptyFacebookCallbackForm: FacebookCallbackValues = {
  code: '',
  pageId: ''
};
