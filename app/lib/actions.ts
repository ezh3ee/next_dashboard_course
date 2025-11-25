"use server"

import {z, ZodObject} from "zod";
import {revalidatePath} from "next/cache";
import postgres from 'postgres';
import {redirect} from "next/navigation";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string()
});

const CreateInvoice = FormSchema.omit({id: true, date: true});

function parseForm(validator: ZodObject<any>, formData: FormData) {
    const rawFormData = {
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    };

    return validator.parse(rawFormData);
}

function getAmountInCents(amount: number): number {
    return amount * 100;
}

export async function createInvoice(formData: FormData) {

    const { customerId, amount, status } = parseForm(CreateInvoice, formData);

    const date = new Date().toISOString().split('T')[0];

    await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${getAmountInCents(amount)}, ${status}, ${date})
        `;

    // Test it out:
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formData: FormData) {
    const { customerId, amount, status } = parseForm(UpdateInvoice, formData);

    await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${getAmountInCents(amount)}, status = ${status}
    WHERE id = ${id}
  `;

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
}