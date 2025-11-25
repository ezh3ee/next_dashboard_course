"use server"

import {z, ZodObject} from "zod";
import {revalidatePath} from "next/cache";
import postgres from 'postgres';
import {redirect} from "next/navigation";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export type State = {
    errors?: {
        customerId?: string[];
        amount?: string[];
        status?: string[];
    };
    message?: string | null;
}

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: 'Please select a customer'
    }),
    amount: z.coerce.number().gt(0, {
        message: 'Amount must be greater than 0'
    }),
    status: z.enum(['pending', 'paid'], {
        invalid_type_error: 'Please select a status'
    }),
    date: z.string()
});

const CreateInvoice = FormSchema.omit({id: true, date: true});

function parseForm(validator: ZodObject<any>, formData: FormData) {
    const rawFormData = {
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    };

    const validatedFields = validator.safeParse(rawFormData);

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Invoice.',
        };
    }

    return validatedFields.data;
}

function getAmountInCents(amount: number): number {
    return amount * 100;
}

export async function createInvoice(prevState: State, formData: FormData) {

    const { customerId, amount, status, errors, message } = parseForm(CreateInvoice, formData);

    if (errors) return {errors, message};

    const date = new Date().toISOString().split('T')[0];

    try {

        await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${getAmountInCents(amount)}, ${status}, ${date})
        `;
    } catch (error) {
        console.log(error);

        return {
            message: 'Database Error: Failed to Create Invoice.',
        };
    }

    // Test it out:
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(prevState: State, id: string, formData: FormData) {
    const { customerId, amount, status, errors, message } = parseForm(UpdateInvoice, formData);

    if (errors) return {errors, message};

    try {
        await sql`
            UPDATE invoices
            SET customer_id = ${customerId}, amount = ${getAmountInCents(amount)}, status = ${status}
            WHERE id = ${id}
         `;
    } catch (error) {
        console.log(error);

        return {
            message: 'Database Error: Failed to update Invoice.',
        };
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
    try {
        await sql`DELETE FROM invoices WHERE id = ${id}`;
    } catch (error) {
        console.log(error);

        return {
            message: 'Database Error: Failed to delete Invoice.',
        };
    }

    revalidatePath('/dashboard/invoices');
}