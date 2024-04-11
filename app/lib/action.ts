"use server"
import { sql } from "@vercel/postgres"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import {z} from "zod"

const FormSchema = z.object({
    id:z.string(),
    customerId:z.string(),
    amount:z.coerce.number(),
    status:z.enum(["pending","paid"]),
    date:z.string(),
})

const CreateInvoice = FormSchema.omit({id:true,date:true})
export async function createInvoice(formdata:FormData){
    const rawData = {
        customerId:formdata.get("customerId"),
        amount:formdata.get("amount"),
        status:formdata.get("status"),
    }
    // const data = Object.fromEntries(formdata.entries())

    const {customerId,amount,status} = CreateInvoice.parse(rawData)
    const amountInCents = amount * 100
    const date = new Date().toISOString().split('T')[0]
    await sql`
    INSERT INTO Invoices (customer_id,amount,status,date)
    VALUES (${customerId},${amountInCents},${status},${date})
    `
    revalidatePath("/dashboard/invoices")
    redirect("/dashboard/invoices")
}