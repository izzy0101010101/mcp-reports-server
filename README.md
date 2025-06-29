# Reports MCP Server

A Model Context Protocol (MCP) server for managing penetration testing reports and vulnerabilities. This server provides tools to create, read, update, and delete reports and vulnerabilities through a REST API.

## Features

- **Report Management**: Create, retrieve, update, and list penetration testing reports
- **Vulnerability Management**: Add, modify, and delete vulnerabilities within reports
- **CVSS Support**: Full CVSS 3.1 scoring and vector string support
- **HTML Formatting**: Automatic formatting of text content to HTML
- **JWT Authentication**: Secure API access with configurable authentication

## Prerequisites

### 1. Install Node.js

Download and install Node.js (version 18 or higher) from [nodejs.org](https://nodejs.org/).

**On macOS:**
```bash
# Using Homebrew (recommended)
brew install node

# Or download from nodejs.org
```

**On Windows:**
- Download the installer from [nodejs.org](https://nodejs.org/)
- Run the installer and follow the setup wizard

**On Linux:**
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL/Fedora
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install nodejs npm
```

### 2. Verify Installation

```bash
node --version    # Should show v18.0.0 or higher
npm --version     # Should show npm version
```

## Installation

### 1. Clone or Download the Project

Create a new directory for your MCP server:

```bash
mkdir reports-mcp-server
cd reports-mcp-server
```

### 2. Create Project Files

Create the following files in your project directory:

**package.json:**
```json
{
  "name": "mcp-reports-server",
  "version": "0.1.0",
  "description": "MCP server for accessing reports API",
  "main": "server.js",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.4.0",
    "axios": "^1.6.0"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "keywords": [
    "mcp",
    "server",
    "reports",
    "api"
  ],
  "author": "",
  "license": "MIT"
}
```

**server.js:** (Copy the complete server code provided)

### 3. Install Dependencies

```bash
npm install
```

This will install:
- `@modelcontextprotocol/sdk`: The MCP SDK for Node.js
- `axios`: HTTP client for making API requests

### 4. Test the Server

```bash
npm start
```

You should see:
```
Reports MCP server running on stdio
No JWT token configured - bearerToken parameter required for all requests
```

Press `Ctrl+C` to stop the server.

## Configuration

### 1. Get Your JWT Token

Obtain your JWT authentication token from your reports API system.

### 2. Configure Claude Desktop

Add the server to your Claude Desktop MCP configuration file:

**Location of config file:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

**Configuration:**
```json
{
  "mcpServers": {
    "reports-server": {
      "command": "node",
      "args": ["/full/path/to/your/reports-mcp-server/server.js"],
      "env": {
        "REPORTS_JWT_TOKEN": "your_actual_jwt_token_here"
      }
    }
  }
}
```

**Important Notes:**
- Replace `/full/path/to/your/reports-mcp-server/server.js` with the actual full path to your server.js file
- Replace `your_actual_jwt_token_here` with your real JWT token
- Use forward slashes `/` in paths, even on Windows

**Example paths:**
- **macOS**: `/Users/username/reports-mcp-server/server.js`
- **Windows**: `C:/Users/username/reports-mcp-server/server.js`

### 3. Restart Claude Desktop

Close and reopen Claude Desktop for the configuration to take effect.

## API Configuration

The server is configured to connect to:
- **Base URL**: `http://10.10.10.117:3000/api`
- **Reports Endpoint**: `/report`
- **Vulnerabilities Endpoint**: `/vulnerability`

To change the API URL, edit the `API_BASE_URL` constant in `server.js`:

```javascript
const API_BASE_URL = 'https://your-api-domain.com/api';
```

## Available Tools

### Report Management

1. **get_all_reports** - Retrieve all reports
2. **get_report** - Get a specific report by ID
3. **create_report** - Create a new report
4. **update_report** - Update report fields (title, platform, goal, scope, summary, recommendations, status)

### Vulnerability Management

1. **get_vulnerabilities** - Get all vulnerabilities for a report
2. **get_vulnerability** - Get a specific vulnerability by ID
3. **create_vulnerabilities** - Add vulnerabilities to a report
4. **update_vulnerability** - Update vulnerability details
5. **delete_vulnerability** - Remove a vulnerability

## Usage Examples

### Creating a Report

```json
{
  "title": "Web Application Security Test",
  "platform": "Web",
  "templateId": "67b1dac12c8d23272ad47cbd"
}
```

### Adding Vulnerabilities

```json
{
  "reportId": "67b1dac12c8d23272ad47cbd",
  "vulnerabilities": [
    {
      "title": "SQL Injection",
      "description": "The application is vulnerable to SQL injection attacks.",
      "severity": "High",
      "cvssScore": 8.5,
      "impact": "Data breach; Unauthorized access; Data manipulation",
      "remediation": "Use parameterized queries; Input validation; Least privilege access"
    }
  ]
}
```

## HTML Formatting

The server automatically formats text content to HTML:

- **Plain text** → Wrapped in `<p>` tags
- **Lists** (separated by newlines, commas, or semicolons) → Converted to `<ul><li>` format
- **Existing HTML** → Left unchanged

Supported HTML tags: `<p>`, `<ul>`, `<li>` only.

## Troubleshooting

### Common Issues

1. **"Network error: Unable to reach the API"**
   - Check that your API server is running
   - Verify the API_BASE_URL is correct
   - Check firewall/network connectivity

2. **"No bearer token provided"**
   - Ensure REPORTS_JWT_TOKEN is set in your MCP configuration
   - Verify the JWT token is valid and not expired

3. **"Invalid reportId format"**
   - Report IDs must be 24-character MongoDB ObjectIds
   - Example: `67b1dac12c8d23272ad47cbd`

4. **"Command not found: node"**
   - Ensure Node.js is installed and in your PATH
   - Try using the full path to node: `/usr/local/bin/node` (macOS) or `C:\Program Files\nodejs\node.exe` (Windows)

### Debugging

1. **Check server logs in Claude Desktop**
   - Look for error messages in the Claude Desktop console

2. **Test the server manually**
   ```bash
   cd /path/to/reports-mcp-server
   npm start
   ```

3. **Verify dependencies**
   ```bash
   npm list
   ```

4. **Check Node.js version**
   ```bash
   node --version  # Should be 18.0.0 or higher
   ```

## Development

### Running in Development Mode

```bash
npm run dev
```

### Project Structure

```
reports-mcp-server/
├── package.json          # Project configuration and dependencies
├── server.js             # Main MCP server implementation
├── node_modules/         # Installed dependencies (auto-generated)
└── README.md            # This file
```

### Environment Variables

- `REPORTS_JWT_TOKEN`: JWT token for API authentication
- `NODE_ENV`: Set to 'development' for additional logging

## Security Notes

- Keep your JWT token secure and never commit it to version control
- Use environment variables for sensitive configuration
- Regularly rotate your API tokens
- Only use HTTPS endpoints in production

## Support

For issues with:
- **MCP Configuration**: Check Claude Desktop documentation
- **API Connectivity**: Verify your reports API server status
- **Authentication**: Confirm your JWT token is valid

## License

MIT License - see LICENSE file for details.