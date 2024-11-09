import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { collateHeroData } from './collateHeroData';
import { collateItemData } from './collateItemsData';
import { combineLocalisations, parseLocalisation } from './parseLocalisation';

dotenv.config();

function parseSteamInf(steamdbRepoPath: string): { clientVersion: string; versionDate: string } | null {
  try {
    const steamInfPath = path.join(steamdbRepoPath, 'steam.inf');
    if (!fs.existsSync(steamInfPath)) {
      console.error('steam.inf not found');
      return null;
    }

    const content = fs.readFileSync(steamInfPath, 'utf-8');
    const lines = content.split('\n');
    let clientVersion = '';
    let versionDate = '';

    for (const line of lines) {
      if (line.startsWith('ClientVersion=')) {
        clientVersion = line.split('=')[1].trim();
      } else if (line.startsWith('VersionDate=')) {
        versionDate = line.split('=')[1].trim();
      }
    }

    if (!clientVersion || !versionDate) {
      console.error('Could not find ClientVersion or VersionDate in steam.inf');
      return null;
    }

    // Write version info to a file that can be read by the commit script
    const versionInfo = { clientVersion, versionDate };
    const outputBaseDir = path.join(
      steamdbRepoPath,
      process.env.OUTPUT_PATH || '../../output'
    );
    fs.writeFileSync(
      path.join(outputBaseDir, 'version_info.json'),
      JSON.stringify(versionInfo, null, 2)
    );

    return versionInfo;
  } catch (error) {
    console.error('Error parsing steam.inf:', error);
    return null;
  }
}

export function parseVData(lines: string[]): any {
  let stack: any[] = [];
  let current: any = {};
  let root: any = current;
  let key: string | null = null;

  // filter out all whitespace and comments
  lines = lines.filter((line) => line.trim() !== '');

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    const nextLine = lines[i + 1];
    const previousLine = lines[i - 1];

    if (
      !line ||
      line.startsWith('//') ||
      line.startsWith('#') ||
      line.startsWith('<!')
    ) {
      continue;
    }

    if (line === '{') {
      const obj: any = {};
      if (Array.isArray(current)) {
        current.push(obj);
        stack.push(current);
        current = obj;
      } else if (key !== null && current[key] === undefined) {
        current[key] = obj;
        stack.push(current);
        current = obj;
        key = null;
      } else if (stack.length === 0) {
        stack.push(current);
        current = obj;
        root = current;
      } else continue;
    }

    if (line === '[') {
      const arr: any[] = [];
      if (Array.isArray(current)) {
        if (previousLine?.trim() === '[' || previousLine?.trim() === '],') {
          current.push(arr);
          stack.push(current);
          current = arr;
        }
      } else if (key !== null && current[key] === undefined) {
        current[key] = arr;
        stack.push(current);
        current = arr;
        key = null;
      } else if (stack.length === 0) {
        stack.push(current);
        current = arr;
        root = current;
      }
      continue;
    }

    if (line.includes('=')) {
      const [keyPart, valuePart] = line.split('=', 2);
      key = keyPart.trim();
      let value = valuePart.trim();

      if (
        [value, nextLine?.trim()].includes('{') ||
        [value, nextLine?.trim()].includes('[')
      ) {
        const item: any = [value, nextLine?.trim()].includes('{') ? {} : [];
        current[key] = item;
        stack.push(current);
        current = item;
        key = null;
      } else {
        value = parseValue(value);
        current[key] = value;
        key = null;
      }
    } else if (['}', '},', ']', '],'].includes(line)) {
      if (stack.length > 0) {
        current = stack.pop();
        key = null;
      }
    } else {
      const value = parseValue(line);
      if (Array.isArray(current)) {
        current.push(value);
      } else if (key !== null) {
        current[key] = value;
        key = null;
      }
    }
  }

  return root;
}

function parseValue(valueStr: string): any {
  valueStr = valueStr.trim();

  if (valueStr.endsWith(',')) {
    valueStr = valueStr.slice(0, -1);
  }

  if (
    (valueStr.startsWith('"') && valueStr.endsWith('"')) ||
    (valueStr.startsWith("'") && valueStr.endsWith("'"))
  ) {
    valueStr = valueStr.slice(1, -1);
  }

  if (valueStr === 'true') return true;
  if (valueStr === 'false') return false;

  const num = Number(valueStr);
  if (!isNaN(num)) {
    return num;
  }

  return valueStr;
}

function getVDataFiles(dir: string): string[] {
  try {
    const dirents = fs.readdirSync(dir, { withFileTypes: true });
    const vDataFiles = dirents
      .filter((dirent) => dirent.isFile() && dirent.name.endsWith('.vdata'))
      .map((dirent) => path.join(dir, dirent.name));
    const dirs = dirents.filter((dirent) => dirent.isDirectory());
    for (const d of dirs) {
      vDataFiles.push(...getVDataFiles(path.join(dir, d.name)));
    }
    return vDataFiles;
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
    return [];
  }
}

function getLocalisationFiles(dir: string): string[] {
  try {
    const directories = fs.readdirSync(dir, { withFileTypes: true });
    const localisationFiles = directories
      .filter(
        (directory) => directory.isFile() && directory.name.endsWith('.txt')
      )
      .map((directory) => path.join(dir, directory.name));
    const dirs = directories.filter((directory) => directory.isDirectory());
    for (const d of dirs) {
      localisationFiles.push(...getLocalisationFiles(path.join(dir, d.name)));
    }
    return localisationFiles.filter((file) => file.includes('localization'));
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
    return [];
  }
}

function processFiles(steamdbRepoPath: string) {
  console.log(`Processing .vdata files in ${steamdbRepoPath}`);

  if (!fs.existsSync(steamdbRepoPath)) {
    console.error(`Error: Directory ${steamdbRepoPath} does not exist.`);
    return;
  }

  // Parse steam.inf first
  const versionInfo = parseSteamInf(steamdbRepoPath);
  if (!versionInfo) {
    console.warn('Could not parse steam.inf, continuing with file processing...');
  }

  const vdataFiles = getVDataFiles(steamdbRepoPath);

  const localisationFiles = getLocalisationFiles(steamdbRepoPath);

  if (vdataFiles.length === 0) {
    console.log('No .vdata files found.');
    return;
  }

  const outputBaseDir = path.join(
    steamdbRepoPath,
    process.env.OUTPUT_PATH || '../../output'
  );
  if (!fs.existsSync(outputBaseDir)) {
    fs.mkdirSync(outputBaseDir, { recursive: true });
  }

  function parseFile(file: string, ext: string) {
    const data = fs.readFileSync(file, 'utf-8');
    const lines = data.split(/\r?\n/);
    const result =
      ext === '.vdata' ? parseVData(lines) : parseLocalisation(lines);
    let parentDir = ext === '.vdata' ? 'scripts' : 'localisation';

    const name = path.basename(file, ext);
    const outputDir = path.join(outputBaseDir, parentDir);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `${name}.json`);
    console.log(`Writing output to: ${outputPath}`);
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`Parsed data written to: ${outputPath}`);
  }

  vdataFiles.forEach((file) => {
    console.log(`Processing file: ${file}`);
    parseFile(file, '.vdata');
  });

  localisationFiles.forEach((file) => {
    console.log(`Processing file: ${file}`);
    parseFile(file, '.txt');
  });

  console.log('All .vdata files processed successfully.');
}

// Path to the steamdb repo
const steamdbRepoPath = process.env.DATA_PATH || '/app/repo';

// Call the main function
processFiles(steamdbRepoPath);

collateHeroData(
  path.join(steamdbRepoPath, process.env.OUTPUT_PATH || '../../output')
);

collateItemData(
  path.join(steamdbRepoPath, process.env.OUTPUT_PATH || '../../output')
);

combineLocalisations(path.join(steamdbRepoPath, process.env.OUTPUT_PATH || '../../output'));
