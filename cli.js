#!/usr/bin/env node

const { spawn } = require('node:child_process');

const apiBase = (process.env.SNIP_API || 'http://localhost:3000').replace(/\/+$/, '');

function printUsage() {
  console.log(`Usage:
  snip add <url>    Create a short link
  snip ls            List all links
  snip open <code>  Open a short link in the browser
  snip help          Show this help`);
}

function fail(message) {
  console.error(`Error: ${message}`);
  process.exitCode = 1;
}

function validateUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

async function request(path, options) {
  try {
    return await fetch(`${apiBase}${path}`, options);
  } catch {
    throw new Error(`Could not reach the backend at ${apiBase}`);
  }
}

async function readError(response) {
  try {
    const body = await response.json();
    return body.error || `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}

async function addLink(url) {
  if (!validateUrl(url)) {
    fail('URL must be an http(s) URL.');
    return;
  }

  const response = await request('/api/links', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    fail(await readError(response));
    return;
  }

  const link = await response.json();
  console.log(link.shortUrl);
}

async function listLinks() {
  const response = await request('/api/links');
  if (!response.ok) {
    fail(await readError(response));
    return;
  }

  const links = await response.json();
  if (!links.length) {
    console.log('No links yet.');
    return;
  }

  const codeWidth = Math.max(4, ...links.map((link) => link.code.length));
  const hitsWidth = Math.max(4, ...links.map((link) => String(link.hits).length));
  console.log(`${'CODE'.padEnd(codeWidth)}  ${'HITS'.padStart(hitsWidth)}  URL`);
  for (const link of links) {
    console.log(`${link.code.padEnd(codeWidth)}  ${String(link.hits).padStart(hitsWidth)}  ${link.url}`);
  }
}

function openBrowser(url) {
  let command;
  let args;
  if (process.platform === 'win32') {
    command = 'cmd';
    args = ['/c', 'start', '', url];
  } else if (process.platform === 'darwin') {
    command = 'open';
    args = [url];
  } else {
    command = 'xdg-open';
    args = [url];
  }

  const child = spawn(command, args, { detached: true, stdio: 'ignore' });
  child.unref();
}

async function openLink(code) {
  if (!code || code.includes('/')) {
    fail('A short code is required.');
    return;
  }

  const response = await request(`/${encodeURIComponent(code)}`, { redirect: 'manual' });
  if (!response.ok && response.status !== 302) {
    fail(await readError(response));
    return;
  }

  const target = response.headers.get('location');
  if (!target) {
    fail('The backend did not return a redirect target.');
    return;
  }

  openBrowser(target);
  console.log(`Opened ${target}`);
}

async function main() {
  const [command, value] = process.argv.slice(2);
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printUsage();
    return;
  }

  if (command === 'add') {
    if (!value) {
      fail('Usage: snip add <url>');
      return;
    }
    await addLink(value);
    return;
  }

  if (command === 'ls') {
    await listLinks();
    return;
  }

  if (command === 'open') {
    await openLink(value);
    return;
  }

  fail(`Unknown command: ${command}`);
  printUsage();
}

main().catch((error) => fail(error.message));
