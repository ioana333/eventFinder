/*
  Warnings:

  - The primary key for the `Event` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `description` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `sourceSiteId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `Event` table. All the data in the column will be lost.
  - The `id` column on the `Event` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `usedCodeId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Wishlist` table. All the data in the column will be lost.
  - You are about to drop the `AdminInviteCode` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Attendance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Photo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Site` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `category` on table `Event` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `eventId` on the `Wishlist` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "public"."AdminInviteCode" DROP CONSTRAINT "AdminInviteCode_createdById_fkey";

-- DropForeignKey
ALTER TABLE "public"."Attendance" DROP CONSTRAINT "Attendance_eventId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Attendance" DROP CONSTRAINT "Attendance_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Event" DROP CONSTRAINT "Event_sourceSiteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Photo" DROP CONSTRAINT "Photo_eventId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Photo" DROP CONSTRAINT "Photo_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."User" DROP CONSTRAINT "User_usedCodeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Wishlist" DROP CONSTRAINT "Wishlist_eventId_fkey";

-- DropIndex
DROP INDEX "public"."Event_category_idx";

-- DropIndex
DROP INDEX "public"."Event_city_idx";

-- DropIndex
DROP INDEX "public"."Event_startDate_idx";

-- DropIndex
DROP INDEX "public"."User_usedCodeId_key";

-- AlterTable
ALTER TABLE "Event" DROP CONSTRAINT "Event_pkey",
DROP COLUMN "description",
DROP COLUMN "endDate",
DROP COLUMN "imageUrl",
DROP COLUMN "sourceSiteId",
DROP COLUMN "startDate",
DROP COLUMN "updatedAt",
DROP COLUMN "url",
ADD COLUMN     "date" TIMESTAMP(3),
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "category" SET NOT NULL,
ADD CONSTRAINT "Event_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
DROP COLUMN "usedCodeId";

-- AlterTable
ALTER TABLE "Wishlist" DROP COLUMN "createdAt",
DROP COLUMN "eventId",
ADD COLUMN     "eventId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "public"."AdminInviteCode";

-- DropTable
DROP TABLE "public"."Attendance";

-- DropTable
DROP TABLE "public"."Photo";

-- DropTable
DROP TABLE "public"."Site";

-- DropEnum
DROP TYPE "public"."Role";

-- CreateIndex
CREATE UNIQUE INDEX "Wishlist_userId_eventId_key" ON "Wishlist"("userId", "eventId");

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
