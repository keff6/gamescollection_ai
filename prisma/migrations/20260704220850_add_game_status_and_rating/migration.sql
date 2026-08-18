-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('WISHLIST', 'BACKLOG', 'OWNED', 'PLAYING', 'COMPLETED');

-- AlterTable
ALTER TABLE "game" ADD COLUMN     "rating" INTEGER,
ADD COLUMN     "status" "GameStatus" NOT NULL DEFAULT 'OWNED';
