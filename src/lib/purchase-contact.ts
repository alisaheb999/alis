import { z } from 'zod';

// Match the order service's email length limit; phone input is deliberately
// restricted to numbers and familiar formatting rather than stripping letters.
export const purchaseContactSchema = z.union([
  z.string().trim().email().max(200),
  z.string().trim().max(30).regex(/^\+?[0-9][0-9 ()-]*$/).refine(value => {
    const digits = value.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15;
  }),
]);