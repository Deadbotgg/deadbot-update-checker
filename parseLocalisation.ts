import type { LocalisationData, LocalisationsByLanguage } from '@deadbot/types';
import * as fs from 'fs';
import * as path from 'path';

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

// Function to extract language from filename
function extractLanguage(filename: string): string {
    // Remove the .json extension
    const nameWithoutExt = filename.replace('.json', '');
    
    // Split by underscore and get the last part which should be the language
    const parts = nameWithoutExt.split('_');
    return parts[parts.length - 1];
}

// Function to combine JSON localization files grouped by language
export function combineLocalisations(dir: string): LocalisationsByLanguage {
    const baseDir = path.join(dir, 'localisation');
    const localizationsByLanguage: LocalisationsByLanguage = {};

    // Get all JSON files in the directory
    const files = fs.readdirSync(baseDir)
        .filter(file => file.endsWith('.json'));
    console.log('Files:', files);

    // Read and group files by language
    for (const file of files) {
        const filePath = path.join(baseDir, file);
        console.log('Processing:', file);
        
        // Extract language from filename
        const language = extractLanguage(file);
        
        // Initialize language group if it doesn't exist
        if (!localizationsByLanguage[language]) {
            localizationsByLanguage[language] = {};
        }

        // Read and merge file content into appropriate language group
        const fileContent = readJsonFile(filePath);
        localizationsByLanguage[language] = { 
            ...localizationsByLanguage[language], 
            ...fileContent 
        };
    }

    // Create output directory if it doesn't exist
    const outputDir = path.join(baseDir, 'locale');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    // Write combined files for each language
    for (const [language, content] of Object.entries(localizationsByLanguage)) {
        const outputPath = path.join(outputDir, `${language}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(content, null, 2), 'utf8');
        console.log(`Combined ${language} localization file created at:`, outputPath);
    }

    return localizationsByLanguage;
}
