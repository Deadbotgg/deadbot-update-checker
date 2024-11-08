interface LocalisationData {
  [key: string]: string;
}

export function parseLocalisation(lines: string[]): LocalisationData {
  const result: LocalisationData = {};
  let currentKey: string | null = null;

  for (const line of lines) {
    const trimmedLine: string = line.trim().replace('//"', '"');

    if (trimmedLine.startsWith('"') && trimmedLine.endsWith('"')) {
      const parts = trimmedLine.split(/"\s+"/).map(part => part.replace(/^"|"$/g, ''));
      
      if (parts.length !== 2) {
        continue;
      }

      const [key, value] = parts;

      if (key.includes('/')) {
        const keys = key.split('/');
        for (const k of keys) {
          if(result[k]) continue;
          result[k] = value;
        }
      } else {
        result[key] = value;
      }
      currentKey = key;
    }
  }

  return result;
}

import * as fs from 'fs';
import * as path from 'path';

// Function to read and parse a JSON file
function readJsonFile(filePath: string): any {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        return {};
    }
}

// New function to combine JSON localization files
export function combineLocalisations() {
    const baseDir = path.join('data', 'output', 'localisation');
    let combinedLocalization = {};

    // Get all JSON files in the directory
    const files = fs.readdirSync(baseDir)
        .filter(file => file.endsWith('.json'));
        console.log('Files:', files);

    // Read and merge each file
    for (const file of files) {
        const filePath = path.join(baseDir, file);
        console.log('Processing:', file);
        const fileContent = readJsonFile(filePath);
        combinedLocalization = { ...combinedLocalization, ...fileContent };
    }

    // Write combined localization to a new file
    const outputPath = path.join(baseDir, 'english.json');
    fs.writeFileSync(outputPath, JSON.stringify(combinedLocalization, null, 2), 'utf8');
    console.log('Combined localization file created at:', outputPath);
    
    return combinedLocalization;
}

