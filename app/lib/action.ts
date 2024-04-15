'use server';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'please select a customer',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'pease input a number greater than zero' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'please select an invoice status',
  }),
  date: z.string(),
});

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

const CreateInvoice = FormSchema.omit({ id: true, date: true });
export async function createInvoice(prevState: State, formData: FormData) {
  const rawData = {
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  };
  // const data = Object.fromEntries(formdata.entries())
  const validateFields = CreateInvoice.safeParse(rawData);
  if (!validateFields.success) {
    return {
      errors: validateFields.error.flatten().fieldErrors,
      message: 'missing fields.',
    };
  }

  const { customerId, amount, status } = validateFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  try {
    await sql`
    INSERT INTO Invoices (customer_id,amount,status,date)
    VALUES (${customerId},${amountInCents},${status},${date})
    `;
  } catch (error) {
    return {
      message: 'Database Error,Failed to Create Invoice',
    };
  }
  // clear client cache and request the server
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

const UpdateInvoice = FormSchema.omit({ id: true, date: true });
export async function updateInvoice(
  id: string,
  prevState: State,
  formdata: FormData,
) {
  const validateFields = UpdateInvoice.safeParse({
    customerId: formdata.get('customerId'),
    amount: formdata.get('amount'),
    status: formdata.get('status'),
  });
  if (!validateFields.success) {
    return {
      errors: validateFields.error.flatten().fieldErrors,
      message: 'Missing Fields',
    };
  }
  const { customerId, amount, status } = validateFields.data;

  const amountInCents = amount * 100;

  try {
    await sql`
    UPDATE Invoices
    SET customer_id=${customerId},amount=${amountInCents},status=${status}
    WHERE id=${id}
    `;
  } catch (error) {
    return {
      message: 'Database Error: Failed to Update Invoice',
    };
  }
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  try {
    await sql`
    DELETE FROM Invoices
    WHERE id=${id}
    `;
  } catch (error) {
    return {
      message: 'Database Error: Failed to Delete Invoice',
    };
  }

  revalidatePath('/dashboard/invoices');
}


export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
  ) {
    try {
      await signIn('credentials', formData);
    } catch (error) {
      if (error instanceof AuthError) {
        switch (error.type) {
          case 'CredentialsSignin':
            return 'Invalid credentials.';
          default:
            return 'Something went wrong.';
        }
      }
      throw error;
    }
  }