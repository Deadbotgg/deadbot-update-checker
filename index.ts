import fs from 'fs';
import path from 'path';

const preferredFolders = ['scripts', 'localization', 'styles'];

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
        if (previousLine?.trim() === '[') {
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

// get all .vdata files in the directory recursively
function getVDataFiles(dir: string): string[] {
  try {
    const dirents = fs.readdirSync(dir, { withFileTypes: true });
    const files = dirents
      .filter(
        (dirent) =>
          dirent.isFile() &&
          (dirent.name.endsWith('.vdata') || dirent.name.endsWith('.txt'))
      )
      .map((dirent) => path.join(dir, dirent.name));
    const dirs = dirents.filter((dirent) => dirent.isDirectory());
    for (const d of dirs) {
      files.push(...getVDataFiles(path.join(dir, d.name)));
    }
    return files;
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
    return [];
  }
}

// read all .vdata files in the directory
function readVDataFiles(dir: string): { name: string; data: string }[] {
  const files = getVDataFiles(dir);
  return files.map((file) => ({
    name: path.basename(file, '.vdata'),
    data: fs.readFileSync(file, 'utf-8'),
  }));
}

function processVDataFiles(steamdbRepoPath: string) {
  console.log(`Processing .vdata files in ${steamdbRepoPath}`);

  if (!fs.existsSync(steamdbRepoPath)) {
    console.error(`Error: Directory ${steamdbRepoPath} does not exist.`);
    return;
  }

  const vdataFiles = getVDataFiles(steamdbRepoPath);

  if (vdataFiles.length === 0) {
    console.log('No .vdata files found.');
    return;
  }

  const outputBaseDir = path.join('/app', 'output');
  if (!fs.existsSync(outputBaseDir)) {
    fs.mkdirSync(outputBaseDir, { recursive: true });
  }

  vdataFiles.forEach((file) => {
    console.log(`Processing file: ${file}`);
    const data = fs.readFileSync(file, 'utf-8');
    const lines = data.split(/\r?\n/);
    const result = parseVData(lines);
    let parentDir = path.basename(path.dirname(file));
    const preferredFoldersIndex = preferredFolders.findIndex((folder) => file.includes(folder));
    if (preferredFoldersIndex !== -1) {
      parentDir = preferredFolders[preferredFoldersIndex];
    }
    const name = path.basename(file, '.vdata');
    const outputDir = path.join(outputBaseDir, parentDir);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `${name}.json`);
    console.log(`Writing output to: ${outputPath}`);
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`Parsed data written to: ${outputPath}`);
  });

  console.log('All .vdata files processed successfully.');
}

// Path to the steamdb repo
const steamdbRepoPath = '/app/repo';

// Call the main function
processVDataFiles(steamdbRepoPath);
