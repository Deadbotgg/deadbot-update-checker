import fs from 'fs';

export function parseVData(lines: string[]): any {
  let stack: any[] = [];
  let current: any = {};
  let root: any = current;
  let key: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    const nextLine = lines[i + 1];

    if (!line || line.startsWith('//')) {
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
        continue;
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

// get all files in the directory recursively
function getFiles(dir: string): string[] {
  const dirents = fs.readdirSync(dir, { withFileTypes: true });
  const files = dirents
    .filter((dirent) => dirent.isFile())
    .map((dirent) => `${dir}/${dirent.name}`);
  const dirs = dirents.filter((dirent) => dirent.isDirectory());
  for (const d of dirs) {
    files.push(...getFiles(`${dir}/${d.name}`));
  }
  return files;
}

// read all files in the directory
function readFiles(dir: string): { name: string | undefined; data: string }[] {
  return getFiles(dir).map((file) => ({
    name: file?.split('/')?.pop()?.split('.').shift(),
    data: fs.readFileSync(file, 'utf-8'),
  }));
}

readFiles('./data').forEach(({ data, name }) => {
  const lines = data.split(/\r?\n/);
  const result = parseVData(lines);
  console.log(result);

  fs.writeFileSync(`./data/${name}.json`, JSON.stringify(result, null, 2));
});
