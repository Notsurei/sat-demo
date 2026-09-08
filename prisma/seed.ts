import bcrypt from "bcrypt";
import { PrismaClient, SubscriptionPlan, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "KhoiVo.7703@gmail.com";

  const existingAdmin = await prisma.user.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    console.log("Admin already exists");
    return;
  }

  const passwordHash = await bcrypt.hash("Admin123!", 10);

  await prisma.user.create({
    data: {
      firstName: "Khoi",
      lastName: "Admin",
      email,
      passwordHash,
      role: UserRole.ADMIN,
      subscriptionPlan: SubscriptionPlan.VIP,
      isVerified: true,
    },
  });

  console.log("Admin created successfully");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
