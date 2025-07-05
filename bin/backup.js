#!/usr/bin/env node

const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
const os = require("os");
const archiver = require("archiver");
const { program } = require("commander");

const homeDir = os.homedir();
const defaultDriveLabel = "New Volume";

const allowedExtensions = [
  ".jpg", ".jpeg", ".png", ".gif", ".webp",
  ".mp4", ".avi", ".mkv", ".mov",
  ".txt", ".pdf", ".docx", ".md"
];

const getFileHash = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("error", reject);
    stream.on("data", chunk => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
};

const walkAndCollectFiles = async (dir, fileList = []) => {
  const entries = await fs.readdir(dir);
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = await fs.lstat(fullPath);

// 🛡️ Skip symbolic links entirely
if (stat.isSymbolicLink()) {
  continue;
}

if (stat.isDirectory()) {
  await walkAndCollectFiles(fullPath, fileList);
} else if (allowedExtensions.includes(path.extname(entry).toLowerCase())) {
  fileList.push(fullPath);
}

const excludeDirs = [
  ".PlayOnLinux", ".wine", "node_modules", ".cache", ".local/share/Trash"
];

if (stat.isDirectory()) {
  const relative = path.relative(homeDir, fullPath);
  if (excludeDirs.some(dir => relative.startsWith(dir))) {
    continue;
  }
  await walkAndCollectFiles(fullPath, fileList);
}


  }
  return fileList;
};

const loadManifest = async (manifestPath) => {
  if (await fs.pathExists(manifestPath)) {
    return fs.readJson(manifestPath);
  }
  return {};
};

const saveManifest = async (manifestPath, manifest) => {
  await fs.writeJson(manifestPath, manifest, { spaces: 2 });
};

const backupFiles = async ({ driveLabel, zip }) => {
  const backupRoot = `/media/${os.userInfo().username}/${driveLabel}`;
  const stagingDir = path.join(backupRoot, "staging");
  const backupDir = path.join(backupRoot, "backups");
  const manifestPath = path.join(backupRoot, "manifest.json");

  if (!await fs.pathExists(backupRoot)) {
    console.error(`❌ Backup drive not found at ${backupRoot}`);
    process.exit(1);
  }

  console.log("🔍 Scanning for files...");
  const allFiles = await walkAndCollectFiles(homeDir);
  const manifest = await loadManifest(manifestPath);

  await fs.ensureDir(stagingDir);
  await fs.ensureDir(backupDir);

  let copied = 0;

  for (const file of allFiles) {
    const hash = await getFileHash(file);
    if (manifest[hash]) continue;

    const relativePath = path.relative(homeDir, file);
    const destPath = path.join(stagingDir, relativePath);
    await fs.ensureDir(path.dirname(destPath));
    await fs.copy(file, destPath);

    manifest[hash] = relativePath;
    copied++;
    console.log(`✅ ${relativePath}`);
  }

  if (copied === 0) {
    console.log("📂 No new files to back up.");
    return;
  }

  if (zip) {
    console.log("📦 Creating ZIP archive...");
    const dateStr = new Date().toISOString().replace(/[:.]/g, "-");
    const zipName = `backup-${dateStr}.zip`;
    const outputZip = path.join(backupDir, zipName);
    const output = fs.createWriteStream(outputZip);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      console.log(`✅ Archive saved: ${zipName} (${archive.pointer()} bytes)`);
      fs.remove(stagingDir);
    });

    archive.on("error", err => { throw err; });
    archive.pipe(output);
    archive.directory(stagingDir, false);
    await archive.finalize();
  }

  await saveManifest(manifestPath, manifest);
};

program
  .name("mybackup")
  .description("Back up images, videos and documents to an external drive.")
  .option("-d, --drive <label>", "Drive label", defaultDriveLabel)
  .option("--no-zip", "Disable zipping (copy files only)")
  .action((options) => {
    backupFiles({ driveLabel: options.drive, zip: options.zip });
  });

program.parse();
