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

    // Eradicate cobalt blue completely
    content = content.replaceAll("#3558D4", "#20242D");
    content = content.replaceAll("#2846B4", "#191C24");
    content = content.replaceAll("#EFF4FE", "#F0F1F3");
    content = content.replaceAll("#BFD5FB", "#ECEEF1");

    // Standardize borders to SpendHub #ECEEF1
    content = content.replaceAll("#E5E7EB", "#ECEEF1");
    content = content.replaceAll("#DCE2EB", "#ECEEF1");
    content = content.replaceAll("#E2E8F0", "#ECEEF1");

    // Standardize background to SpendHub #F8F9FB
    content = content.replaceAll("#FAF9F6", "#F8F9FB");
    content = content.replaceAll("#F7F8FA", "#F8F9FB");

    // Standardize text colors to SpendHub #191C24 & #747B87
    content = content.replaceAll("#111827", "#191C24");
    content = content.replaceAll("#172033", "#191C24");
    content = content.replaceAll("#6B7280", "#747B87");
    content = content.replaceAll("#667085", "#747B87");

    // Brand accent #FF6A13
    content = content.replaceAll("#F97316", "#FF6A13");
    content = content.replaceAll("#EA580C", "#FF6A13");

    if (content !== original) {
      fs.writeFileSync(filePath, content, "utf-8");
      modifiedCount++;
      console.log(`Updated SpendHub tokens in: ${filePath}`);
    }
  });
});

console.log(`Total files updated: ${modifiedCount}`);
