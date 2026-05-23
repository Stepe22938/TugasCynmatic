import { Router } from "express";
import { db } from "@workspace/db";
import { androidPackages, users } from "@workspace/db/schema";
import { eq, ne, desc, and } from "drizzle-orm";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const router = Router();

// Helper to log admin actions inside users table JSON activityLog
async function logAdminActivity(userId: string, action: string) {
  try {
    const userRows = await db.select({ activityLog: users.activityLog }).from(users).where(eq(users.id, userId));
    if (userRows.length > 0) {
      let logs: any[] = [];
      const rawLog = userRows[0].activityLog;
      if (rawLog) {
        if (typeof rawLog === "string") {
          try { logs = JSON.parse(rawLog); } catch { logs = []; }
        } else if (Array.isArray(rawLog)) {
          logs = rawLog;
        }
      }
      logs.push({ action, timestamp: new Date().toISOString() });
      await db.update(users).set({ activityLog: logs }).where(eq(users.id, userId));
    }
  } catch (error) {
    console.error(`[LOG ADMIN ACTIVITY ERROR]`, error);
  }
}

// ─── GET LATEST RELEASED PACKAGE (PUBLIC) ──────────────────────────────────
// Returns only the single active production-ready release
router.get("/latest", async (req, res) => {
  try {
    const latestPackage = await db
      .select()
      .from(androidPackages)
      .where(
        and(
          eq(androidPackages.buildStatus, "success"),
          eq(androidPackages.releaseStatus, "latest")
        )
      )
      .orderBy(desc(androidPackages.createdAt))
      .limit(1);

    if (latestPackage.length === 0) {
      return res.status(404).json({ message: "No active release found." });
    }

    res.json(latestPackage[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── ADMIN REQUIREMENT MIDDLEWARE ──────────────────────────────────────────
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "Akses ditolak. ID Pengguna diperlukan." });
    }

    const userRows = await db.select().from(users).where(eq(users.id, userId));
    if (userRows.length === 0) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan." });
    }

    if (userRows[0].role !== "admin") {
      return res.status(403).json({ error: "Akses ditolak. Hanya Admin yang diperbolehkan." });
    }

    req.adminUser = userRows[0];
    next();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Apply requireAdmin middleware to all endpoints below
router.use(requireAdmin);

// ─── GET ALL PACKAGES (ADMIN ONLY) ─────────────────────────────────────────
// Full God Mode history visibility for admins
router.get("/", async (req: any, res: any) => {
  try {
    const allPackages = await db
      .select()
      .from(androidPackages)
      .orderBy(desc(androidPackages.createdAt));
    res.json(allPackages);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST TRIGGER BUILD NEW ANDROID APP (ADMIN ONLY) ───────────────────────
router.post("/build", async (req: any, res: any) => {
  try {
    const { versionName, versionCode, changelog, releaseStatus } = req.body;
    const adminUser = req.adminUser;

    if (!versionName || !versionCode || !changelog) {
      return res.status(400).json({ error: "Semua input (Version Name, Version Code, Changelog) wajib diisi." });
    }

    const parsedVersionCode = parseInt(versionCode, 10);
    if (isNaN(parsedVersionCode)) {
      return res.status(400).json({ error: "Version Code harus berupa angka." });
    }

    // Insert record with queued status in the database
    const insertResult = await db.insert(androidPackages).values({
      versionName,
      versionCode: parsedVersionCode,
      changelog,
      buildStatus: "queued",
      releaseStatus: releaseStatus === "latest" ? "latest" : "draft",
      createdBy: adminUser.name || adminUser.email || "Admin",
    });

    const newPackageId = insertResult[0].insertId;

    // Log the build initiation
    await logAdminActivity(
      adminUser.id,
      `[Build Android] Memulai antrean build APK versi ${versionName} (Build ${parsedVersionCode})`
    );

    // Spawn async build server pipeline simulator in the background
    setTimeout(async () => {
      try {
        console.log(`[CI PIPELINE] Package #${newPackageId} moved from queued to building.`);
        // 1. Transition to 'building'
        await db
          .update(androidPackages)
          .set({ buildStatus: "building" })
          .where(eq(androidPackages.id, newPackageId));

        await logAdminActivity(
          adminUser.id,
          `[Build Android] Kompilasi modul aplikasi Android v${versionName} sedang berlangsung...`
        );

        // 2. Complete compile after 10 more seconds
        setTimeout(async () => {
          try {
            // Check if build simulation should fail
            const shouldFail = versionName.toLowerCase().includes("fail");

            if (shouldFail) {
              await db
                .update(androidPackages)
                .set({
                  buildStatus: "failed",
                })
                .where(eq(androidPackages.id, newPackageId));

              await logAdminActivity(
                adminUser.id,
                `[Build Android] Gagal membangun APK versi ${versionName}: Kesalahan kompilasi internal.`
              );
              console.log(`[CI PIPELINE] Package #${newPackageId} build failed.`);
            } else {
              // Success compile: Copy real template APK or fallback to mock
              const possibleTemplatePaths = [
                path.resolve(process.cwd(), "src/assets/template.apk"),
                path.resolve(process.cwd(), "artifacts/api-server/src/assets/template.apk"),
                path.resolve(__dirname, "../src/assets/template.apk"),
                path.resolve(__dirname, "../../src/assets/template.apk")
              ];

              let templatePath = "";
              for (const p of possibleTemplatePaths) {
                if (fs.existsSync(p)) {
                  templatePath = p;
                  break;
                }
              }

              const uploadsDir = path.resolve(process.cwd(), "uploads/packages");
              if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
              }

              const fileName = `cynmatic-v${versionName}-b${parsedVersionCode}.apk`;
              const filePath = path.join(uploadsDir, fileName);

              if (templatePath) {
                fs.copyFileSync(templatePath, filePath);
                console.log(`[CI PIPELINE] Real APK generated at ${filePath} from template: ${templatePath}`);
              } else {
                const mockApkContent = `Cynmatic Android Package Binary.\nVersion Name: ${versionName}\nVersion Code: ${parsedVersionCode}\nChangelog: ${changelog}\nCompiled At: ${new Date().toISOString()}\nBuild Signature: ${crypto.randomBytes(16).toString("hex")}\nDisclaimer: Mock binary compiled in simulated CI/CD environment for testing.`;
                fs.writeFileSync(filePath, mockApkContent, "utf-8");
                console.log(`[CI PIPELINE] Fallback mock APK generated at ${filePath}.`);
              }

              // Compute SHA-256 hash
              const fileBuffer = fs.readFileSync(filePath);
              const shaHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

              const fileUrl = `/uploads/packages/${fileName}`;

              // Update package in db
              await db
                .update(androidPackages)
                .set({
                  buildStatus: "success",
                  fileUrl,
                  fileHash: shaHash,
                })
                .where(eq(androidPackages.id, newPackageId));

              // If it's the latest release, set all other packages to draft
              if (releaseStatus === "latest") {
                await db
                  .update(androidPackages)
                  .set({ releaseStatus: "draft" })
                  .where(ne(androidPackages.id, newPackageId));
              }

              await logAdminActivity(
                adminUser.id,
                `[Build Android] Sukses mempublikasikan APK versi ${versionName} (Hash: ${shaHash})`
              );
              console.log(`[CI PIPELINE] Package #${newPackageId} built successfully! URL: ${fileUrl}`);
            }
          } catch (compileError: any) {
            console.error(`[CI PIPELINE SIMULATOR ERROR AT COMPILATION]`, compileError);
            await db.update(androidPackages).set({ buildStatus: "failed" }).where(eq(androidPackages.id, newPackageId));
          }
        }, 10000);
      } catch (transitionError: any) {
        console.error(`[CI PIPELINE SIMULATOR ERROR AT TRANSITION]`, transitionError);
        await db.update(androidPackages).set({ buildStatus: "failed" }).where(eq(androidPackages.id, newPackageId));
      }
    }, 5000);

    // Return the queued record instantly
    const queuedRecord = await db.select().from(androidPackages).where(eq(androidPackages.id, newPackageId));
    res.json(queuedRecord[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST UPDATE RELEASE STATUS (ADMIN ONLY) ───────────────────────────────
router.post("/:id/release-status", async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { releaseStatus } = req.body;
    const adminUser = req.adminUser;

    if (!["draft", "latest"].includes(releaseStatus)) {
      return res.status(400).json({ error: "Release status harus berupa 'draft' atau 'latest'." });
    }

    const packageId = parseInt(id, 10);
    if (isNaN(packageId)) {
      return res.status(400).json({ error: "ID tidak valid." });
    }

    const targetPackage = await db.select().from(androidPackages).where(eq(androidPackages.id, packageId));
    if (targetPackage.length === 0) {
      return res.status(404).json({ error: "Package tidak ditemukan." });
    }

    if (targetPackage[0].buildStatus !== "success") {
      return res.status(400).json({ error: "Hanya build dengan status 'success' yang bisa dijadikan rilis." });
    }

    // Update release status
    await db
      .update(androidPackages)
      .set({ releaseStatus: releaseStatus as any })
      .where(eq(androidPackages.id, packageId));

    // If setting to latest, update all others to draft
    if (releaseStatus === "latest") {
      await db
        .update(androidPackages)
        .set({ releaseStatus: "draft" })
        .where(ne(androidPackages.id, packageId));
    }

    await logAdminActivity(
      adminUser.id,
      `[Build Android] Mengubah status rilis v${targetPackage[0].versionName} menjadi ${releaseStatus.toUpperCase()}`
    );

    res.json({ success: true, message: `Release status updated to ${releaseStatus}.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
