"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireFullAdmin } from "@/lib/dal";
import { isLinkPlatform } from "@/lib/payment-link";

// FormData.get() returns null (not undefined) for a field that isn't
// present in the submitted form at all (e.g. amountRaised, which the "add a
// cash fund" form omits since a new fund starts at $0 raised). Zod's
// .optional() only accepts undefined, so every read needs this coalesce.
function fd(formData: FormData, name: string) {
  return formData.get(name) ?? undefined;
}

function emptyToNull(v: string | undefined) {
  return v && v.length > 0 ? v : null;
}

function dollarsToCents(v: string | undefined): number | null {
  if (!v) return null;
  const n = Math.round(parseFloat(v) * 100);
  return Number.isFinite(n) ? n : null;
}

function revalidateRegistry() {
  revalidatePath("/admin/registry");
  revalidatePath("/registry");
}

const RegistryItemSchema = z.object({
  title: z.string().trim().min(1, { error: "Required" }),
  url: z.url({ error: "Enter a valid URL" }).trim(),
  logoUrl: z.url().trim().optional().or(z.literal("")),
});

export async function createRegistryItem(formData: FormData) {
  const admin = await requireFullAdmin();
  const parsed = RegistryItemSchema.parse({
    title: fd(formData, "title"),
    url: fd(formData, "url"),
    logoUrl: fd(formData, "logoUrl"),
  });

  const count = await prisma.registryItem.count();
  await prisma.registryItem.create({
    data: {
      title: parsed.title,
      url: parsed.url,
      logoUrl: emptyToNull(parsed.logoUrl),
      sortOrder: count,
      createdById: admin.id,
    },
  });

  revalidateRegistry();
}

export async function updateRegistryItem(itemId: string, formData: FormData) {
  await requireFullAdmin();
  const parsed = RegistryItemSchema.parse({
    title: fd(formData, "title"),
    url: fd(formData, "url"),
    logoUrl: fd(formData, "logoUrl"),
  });

  await prisma.registryItem.update({
    where: { id: itemId },
    data: {
      title: parsed.title,
      url: parsed.url,
      logoUrl: emptyToNull(parsed.logoUrl),
    },
  });

  revalidateRegistry();
}

export async function deleteRegistryItem(itemId: string) {
  await requireFullAdmin();
  await prisma.registryItem.delete({ where: { id: itemId } });
  revalidateRegistry();
}

const PaymentPlatformSchema = z.enum(["VENMO", "PAYPAL", "CASHAPP", "ZELLE", "OTHER"]);

// Status isn't part of this schema: a new fund always starts OPEN, and only
// the edit form exposes the status control (see CashFundStatusSchema below).
// paymentLink is validated as a URL for every platform except ZELLE, which
// has no public payment link — its "link" is contact info (email/phone),
// see src/lib/payment-link.ts.
const CashFundSchema = z
  .object({
    title: z.string().trim().min(1, { error: "Required" }),
    description: z.string().trim().optional().or(z.literal("")),
    imageUrl: z.url().trim().optional().or(z.literal("")),
    goalAmount: z.string().trim().optional().or(z.literal("")),
    amountRaised: z.string().trim().optional().or(z.literal("")),
    paymentPlatform: PaymentPlatformSchema,
    paymentLink: z.string().trim().min(1, { error: "Payment link/contact is required" }),
  })
  .refine(
    (data) => !isLinkPlatform(data.paymentPlatform) || /^https?:\/\//i.test(data.paymentLink),
    { error: "Enter a valid payment link", path: ["paymentLink"] },
  );

const CashFundStatusSchema = z.enum(["OPEN", "RESERVED", "FULFILLED"]);

export async function createCashFund(formData: FormData) {
  const admin = await requireFullAdmin();
  const parsed = CashFundSchema.parse({
    title: fd(formData, "title"),
    description: fd(formData, "description"),
    imageUrl: fd(formData, "imageUrl"),
    goalAmount: fd(formData, "goalAmount"),
    amountRaised: fd(formData, "amountRaised"),
    paymentPlatform: fd(formData, "paymentPlatform"),
    paymentLink: fd(formData, "paymentLink"),
  });

  await prisma.cashFund.create({
    data: {
      title: parsed.title,
      description: emptyToNull(parsed.description),
      imageUrl: emptyToNull(parsed.imageUrl),
      goalAmountCents: dollarsToCents(parsed.goalAmount),
      amountRaisedCents: dollarsToCents(parsed.amountRaised) ?? 0,
      paymentPlatform: parsed.paymentPlatform,
      paymentLink: parsed.paymentLink,
      status: "OPEN",
      createdById: admin.id,
    },
  });

  revalidateRegistry();
}

export async function updateCashFund(fundId: string, formData: FormData) {
  await requireFullAdmin();
  const parsed = CashFundSchema.parse({
    title: fd(formData, "title"),
    description: fd(formData, "description"),
    imageUrl: fd(formData, "imageUrl"),
    goalAmount: fd(formData, "goalAmount"),
    amountRaised: fd(formData, "amountRaised"),
    paymentPlatform: fd(formData, "paymentPlatform"),
    paymentLink: fd(formData, "paymentLink"),
  });
  const status = CashFundStatusSchema.parse(fd(formData, "status"));

  await prisma.cashFund.update({
    where: { id: fundId },
    data: {
      title: parsed.title,
      description: emptyToNull(parsed.description),
      imageUrl: emptyToNull(parsed.imageUrl),
      goalAmountCents: dollarsToCents(parsed.goalAmount),
      amountRaisedCents: dollarsToCents(parsed.amountRaised) ?? 0,
      paymentPlatform: parsed.paymentPlatform,
      paymentLink: parsed.paymentLink,
      status,
    },
  });

  revalidateRegistry();
}

export async function deleteCashFund(fundId: string) {
  await requireFullAdmin();
  await prisma.cashFund.delete({ where: { id: fundId } });
  revalidateRegistry();
}
