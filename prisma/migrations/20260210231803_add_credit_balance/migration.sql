-- CreateTable
CREATE TABLE "credit_balance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "meterId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_balance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "credit_balance_userId_meterId_key" ON "credit_balance"("userId", "meterId");

-- AddForeignKey
ALTER TABLE "credit_balance" ADD CONSTRAINT "credit_balance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
