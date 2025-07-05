# MyBackup CLI

A lightweight, intelligent backup utility for your important files (images, videos, and documents) to external drives.

## Features

- **Smart Deduplication**: Uses SHA-256 hashing to avoid backing up duplicate files
- **Selective File Types**: Only backs up specific file types (images, videos, documents)
- **Incremental Backups**: Only copies new files that haven't been backed up before
- **ZIP Compression**: Optional ZIP archive creation for space efficiency
- **Safe Directory Handling**: Skips symbolic links and excludes system directories
- **Manifest Tracking**: Maintains a JSON manifest of all backed up files

## Supported File Types

- **Images**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- **Videos**: `.mp4`, `.avi`, `.mkv`, `.mov`
- **Documents**: `.txt`, `.pdf`, `.docx`, `.md`

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Make the script executable (if needed):
   ```bash
   chmod +x bin/backup.js
   ```
4. Optionally, install globally:
   ```bash
   npm install -g .
   ```

## Usage

### Basic Usage

```bash
# Backup to default drive ("New Volume")
./bin/backup.js

# Or if installed globally
mybackup
```

### Options

```bash
# Specify a custom drive label
mybackup -d "MyBackupDrive"
mybackup --drive "MyBackupDrive"

# Disable ZIP compression (copy files only)
mybackup --no-zip

# Combine options
mybackup --drive "MyExternalDrive" --no-zip
```

## How It Works

1. **File Discovery**: Scans your home directory for supported file types
2. **Hash Calculation**: Generates SHA-256 hash for each file to detect duplicates
3. **Manifest Check**: Compares against existing manifest to identify new files
4. **Staging**: Copies new files to a staging directory on the external drive
5. **Archiving** (optional): Creates a timestamped ZIP archive
6. **Manifest Update**: Updates the manifest with new file hashes

## Directory Structure on External Drive

```
/media/username/DriveLabel/
├── staging/           # Temporary staging area for new files
├── backups/          # ZIP archives (if compression enabled)
└── manifest.json     # File tracking database
```

## Excluded Directories

The tool automatically skips these directories to avoid backing up unnecessary files:

- `.PlayOnLinux`
- `.wine`
- `node_modules`
- `.cache`
- `.local/share/Trash`

## Security Features

- **Symbolic Link Protection**: Skips symbolic links to prevent infinite loops
- **Hash-based Deduplication**: Prevents backup of identical files
- **Path Validation**: Ensures backup drive exists before starting

## Requirements

- **Node.js**: Version 12 or higher
- **External Drive**: Must be mounted at `/media/username/DriveLabel/`
- **Permissions**: Read access to home directory, write access to external drive

## Dependencies

- **fs-extra**: Enhanced file system operations
- **commander**: Command-line interface framework
- **archiver**: ZIP archive creation

## Examples

### First-time backup to default drive:
```bash
mybackup
```
Output:
```
🔍 Scanning for files...
✅ Documents/photo.jpg
✅ Videos/vacation.mp4
✅ Pictures/screenshot.png
📦 Creating ZIP archive...
✅ Archive saved: backup-2025-07-05T10-30-00-000Z.zip (1,234,567 bytes)
```

### Subsequent backup (incremental):
```bash
mybackup
```
Output:
```
🔍 Scanning for files...
✅ Documents/new-document.pdf
📂 No new files to back up.
```

### Backup to custom drive without compression:
```bash
mybackup --drive "MyPhotos" --no-zip
```

## Error Handling

- **Drive Not Found**: Exits with error message if the specified drive isn't mounted
- **Permission Issues**: Will display errors for files that can't be read
- **Storage Space**: Archiver will throw errors if insufficient space

## Troubleshooting

### Drive not found error
```
❌ Backup drive not found at /media/username/DriveLabel
```
**Solution**: Ensure your external drive is properly mounted and the label matches

### Permission denied
**Solution**: Ensure you have read permissions for source files and write permissions for the backup drive

### Out of space
**Solution**: Free up space on the external drive or use `--no-zip` to save space

## License

ISC

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Development

```bash
# Install dependencies
npm install

# Run directly
node bin/backup.js --help

# Test with different options
node bin/backup.js --drive "TestDrive" --no-zip
```
