import fs from "fs";
import path from "path";

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach((f) => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(path.join(dir, f));
    }
  });
}

const targets = ["src/app", "src/components"];
let modifiedCount = 0;

targets.forEach((targetDir) => {
  walkDir(targetDir, (filePath) => {
    if (!filePath.endsWith(".tsx") && !filePath.endsWith(".ts")) return;
    
    let content = fs.readFileSync(filePath, "utf-8");
    const original = content;

    content = content.replaceAll("#DCE2EB", "#E5E7EB");
    content = content.replaceAll("#172033", "#111827");
    content = content.replaceAll("#667085", "#6B7280");

    if (content !== original) {
      fs.writeFileSync(filePath, content, "utf-8");
      modifiedCount++;
      console.log(`Updated tokens in: ${filePath}`);
    }
  });
});

console.log(`Total files updated: ${modifiedCount}`);
