# Soldexer CLI

## Commands

### `soldexer init [project-name]`

Initialize a new Soldexer project from a template repository.

```bash
soldexer init my-indexer
soldexer init --directory custom-folder-name
```

**Options:**
- `[project-name]` - Name of the project directory to create (default: "my-soldexer-project")
- `-d, --directory <dir>` - Custom directory name (overrides project-name)

**What it does:**
- Clones the pipe-template repository from GitHub
- Sets up a new project with soldexer.json configuration
- Removes git history for a fresh start
- Provides next steps for setup

### `soldexer publish`

Build and publish your Soldexer pipe to a server.

```bash
soldexer publish
soldexer publish --server https://my-server.com
```

**Options:**
- `-s, --server <url>` - Server URL (default: "http://localhost:3000")

**What it does:**
- Reads configuration from `soldexer.json`
- Builds a Docker image using your Dockerfile
- Saves the image as a tar file
- Uploads the package to the specified server
- Automatically cleans up temporary files

**Requirements:**
- `soldexer.json` configuration file in current directory
- `Dockerfile` in current directory
- Docker installed and running

### `soldexer run <package>`

Download and run a specific Soldexer package from the server.

```bash
soldexer run my-indexer:1.0.0
soldexer run data-pipeline:latest --server https://my-server.com
```

**Arguments:**
- `<package>` - Package name and version in format `<name>:<version>`

**Options:**
- `-s, --server <url>` - Server URL (default: "http://localhost:3000")

**What it does:**
- Downloads the specified package from the server
- Automatically fetches and creates `.env` file from package's environment schema
- Loads the Docker image
- Runs the container with environment variables
- Streams container output to console
- Cleans up downloaded files

## Configuration

### soldexer.json

Your project must include a `soldexer.json` file with the following structure:

```json
{
  "name": "my-indexer",
  "description": "A blockchain data indexer",
  "version": "1.0.0",
  "envSchema": {
    "DATABASE_URL": {
      "description": "Database connection URL",
      "required": true,
      "default": "postgresql://localhost:5432/mydb"
    },
    "API_KEY": {
      "description": "API key for data source",
      "required": true,
      "default": ""
    }
  }
}
```

**Fields:**
- `name` - Unique package name
- `description` - Package description
- `version` - Package version (semantic versioning)
- `envSchema` - Environment variables schema with validation and defaults

## Examples

### Create a new indexer project

```bash
# Initialize new project
soldexer init ethereum-blocks-indexer
cd ethereum-blocks-indexer

# Edit soldexer.json to configure your pipe
# Add your indexing logic to the project
# Start ClickHouse: docker compose up -d

# Test locally
yarn start

# Publish to server
soldexer publish --server https://pipes.soldexer.io
```

### Run an existing indexer

```bash
# Run a published indexer
soldexer run ethereum-blocks:1.2.0 --server https://pipes.soldexer.io

# The CLI will:
# 1. Download the package
# 2. Create .env file with required variables
# 3. Run the indexer container
```

## Development

### Prerequisites

- Node.js 18+
- Docker
- Git

### Build from source

```bash
git clone <repository-url>
cd spm-cli
yarn install
yarn build

# Link for local development
npm link
```

### Available Scripts

- `yarn build` - Build TypeScript to JavaScript
- `yarn dev` - Run in development mode with hot reload
- `yarn start` - Run the built CLI

## Requirements

- Docker installed and running
- Internet connection for downloading packages and templates
- Git installed (for `init` command)

## Troubleshooting

### Common Issues

**Docker not found:**
- Ensure Docker is installed and running
- Check that `docker` command is available in your PATH

**Git clone fails:**
- Check internet connectivity
- Ensure git is installed

**Package not found:**
- Verify package name and version
- Check server URL is correct
- Ensure the package exists on the specified server

**Environment variables missing:**
- Check your `.env` file was created correctly
- Verify all required variables are set
- Review the package's `envSchema` for required fields
