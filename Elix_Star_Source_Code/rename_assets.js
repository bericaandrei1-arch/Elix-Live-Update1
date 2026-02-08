import fs from 'fs';
import path from 'path';

const giftsDir = path.join(process.cwd(), 'public', 'gifts');
const giftPanelPath = path.join(process.cwd(), 'src', 'components', 'GiftPanel.tsx');

// 1. Get all files
const files = fs.readdirSync(giftsDir);

// 2. Prepare replacements
const replacements = [];

files.forEach(file => {
    // Skip system files
    if (file.startsWith('.') || file === 'desktop.ini') return;

    const ext = path.extname(file);
    const nameWithoutExt = path.basename(file, ext);
    
    // Create safe name: lowercase, replace non-alphanum with underscore
    let newName = nameWithoutExt.toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_');
    
    // Remove leading/trailing underscores
    newName = newName.replace(/^_/, '').replace(/_$/, '');
    
    const newFilename = newName + ext;

    if (file !== newFilename) {
        // Rename file
        try {
            fs.renameSync(path.join(giftsDir, file), path.join(giftsDir, newFilename));
            console.log(`Renamed: "${file}" -> "${newFilename}"`);
            
            // Add to replacements (escape regex special chars in old filename)
            replacements.push({
                old: file,
                new: newFilename
            });
        } catch (e) {
            console.error(`Failed to rename ${file}:`, e);
        }
    }
});

// 3. Update GiftPanel.tsx
let content = fs.readFileSync(giftPanelPath, 'utf8');
let updatedContent = content;

replacements.forEach(({ old, new: newName }) => {
    // Replace URL paths in the code
    // We look for: giftUrl('/gifts/OLD_NAME')
    // The code might use single or double quotes
    
    // Escape the old filename for use in regex (dots, parens, etc)
    const escapedOld = old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Regex to match the path in the code. 
    // It might be encoded in the code? No, usually written as string literal.
    // But wait, the previous code showed: icon: giftUrl('/gifts/A gleaming treasure chest in a cave.png')
    
    const regex = new RegExp(`/gifts/${escapedOld}`, 'g');
    updatedContent = updatedContent.replace(regex, `/gifts/${newName}`);
});

if (content !== updatedContent) {
    fs.writeFileSync(giftPanelPath, updatedContent, 'utf8');
    console.log('Updated GiftPanel.tsx with new paths.');
} else {
    console.log('No changes needed in GiftPanel.tsx (or matching failed).');
}
