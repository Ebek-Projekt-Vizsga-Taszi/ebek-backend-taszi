-- CreateTable
CREATE TABLE `Tulajdonos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tulajdonosNeve` VARCHAR(191) NOT NULL,
    `tulajdonosCim` VARCHAR(191) NOT NULL,
    `tulajdonosTel` VARCHAR(191) NULL,
    `tulajdonosEmail` VARCHAR(191) NOT NULL,
    `jelszo` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Tulajdonos_tulajdonosEmail_key`(`tulajdonosEmail`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Eb` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tartoId` INTEGER NOT NULL,
    `utlevelSzam` VARCHAR(191) NULL,
    `chipSorszam` VARCHAR(191) NOT NULL,
    `ivartalanitasIdo` DATETIME(3) NULL,
    `ivartalanitasBelyegzo` VARCHAR(191) NULL,
    `oltasiKonyvSzam` VARCHAR(191) NULL,
    `fajta` VARCHAR(191) NOT NULL,
    `szin` VARCHAR(191) NULL,
    `nem` VARCHAR(191) NOT NULL,
    `hivonev` VARCHAR(191) NULL,
    `szulIdo` DATETIME(3) NOT NULL,
    `veszelyes` BOOLEAN NOT NULL DEFAULT false,
    `veszIdopont` DATETIME(3) NULL,
    `veszett` BOOLEAN NOT NULL DEFAULT false,
    `veszettIdopont` DATETIME(3) NULL,

    UNIQUE INDEX `Eb_chipSorszam_key`(`chipSorszam`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Oltas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `oltasIdo` DATETIME(3) NOT NULL,
    `orvosiBelyegzoSzam` VARCHAR(191) NOT NULL,
    `oltasTipusa` VARCHAR(191) NOT NULL,
    `oltanyagSorszam` VARCHAR(191) NULL,
    `ebId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Urlap` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bekuldesiHatarido` DATETIME(3) NOT NULL,
    `bekuldesDatuma` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ebId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Onkormanyzat` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `felhasznalonev` VARCHAR(191) NOT NULL,
    `jelszo` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Onkormanyzat_felhasznalonev_key`(`felhasznalonev`),
    UNIQUE INDEX `Onkormanyzat_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Eb` ADD CONSTRAINT `Eb_tartoId_fkey` FOREIGN KEY (`tartoId`) REFERENCES `Tulajdonos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Oltas` ADD CONSTRAINT `Oltas_ebId_fkey` FOREIGN KEY (`ebId`) REFERENCES `Eb`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Urlap` ADD CONSTRAINT `Urlap_ebId_fkey` FOREIGN KEY (`ebId`) REFERENCES `Eb`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
