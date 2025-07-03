#!/usr/bin/env node

import { Command } from 'commander';
import { publishCommand } from './commands/publish';
import { runCommand } from './commands/run';
import { initCommand } from './commands/init';
import { listCommand } from './commands/list';

const program = new Command();

program
  .name('soldexer')
  .description('CLI tool for publishing and running Soldexer pipes')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize a new Soldexer project from template')
  .argument('[project-name]', 'Name of the project directory to create', 'my-soldexer-project')
  .option('-d, --directory <dir>', 'Custom directory name (overrides project-name)')
  .action(initCommand);

program
  .command('publish')
  .description('Build Docker image and publish package to server using soldexer.json')
  .option('-s, --server <url>', 'Server URL', 'http://localhost:3000')
  .action(publishCommand);

program
  .command('run')
  .description('Query the server for a specific package')
  .argument('<package>', 'Package name and version in format <n>:<version>')
  .option('-s, --server <url>', 'Server URL', 'http://localhost:3000')
  .action(runCommand);

program
  .command('list')
  .description('List all available pipes with their versions')
  .option('-s, --server <url>', 'Server URL', 'http://localhost:3000')
  .action(listCommand);

program.parse();
