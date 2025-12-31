-- CreateTable
CREATE TABLE "InstructionVideo" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "embedUrl" TEXT NOT NULL,
    "isCustom" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstructionVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstructionImage" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "isCustom" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstructionImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InstructionVideo_order_idx" ON "InstructionVideo"("order");

-- CreateIndex
CREATE INDEX "InstructionVideo_isCustom_idx" ON "InstructionVideo"("isCustom");

-- CreateIndex
CREATE INDEX "InstructionImage_order_idx" ON "InstructionImage"("order");

-- CreateIndex
CREATE INDEX "InstructionImage_isCustom_idx" ON "InstructionImage"("isCustom");
