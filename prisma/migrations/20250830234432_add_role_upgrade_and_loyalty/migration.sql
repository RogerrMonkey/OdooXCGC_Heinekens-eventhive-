-- CreateEnum
CREATE TYPE "public"."RoleUpgradeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "loyaltyPoints" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."RoleUpgradeRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestedRole" "public"."Role" NOT NULL,
    "currentRole" "public"."Role" NOT NULL,
    "reason" TEXT,
    "status" "public"."RoleUpgradeStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleUpgradeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LoyaltyTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "bookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyTransaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."RoleUpgradeRequest" ADD CONSTRAINT "RoleUpgradeRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
