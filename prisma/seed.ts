import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "couple@example.com";
  const password = process.env.ADMIN_PASSWORD ?? "changeme123!";
  const name = process.env.ADMIN_NAME ?? "Admin";

  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin ${email} already exists, skipping.`);
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.admin.create({
      data: { email, passwordHash, name, role: "FULL_ADMIN" },
    });
    console.log(`Created Full Admin: ${email}`);
    if (!process.env.ADMIN_PASSWORD) {
      console.log(
        `  Using default password "${password}" — set ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME env vars before seeding in any shared environment.`,
      );
    }
  }

  await prisma.eventSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
  console.log("Ensured EventSettings row exists.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
