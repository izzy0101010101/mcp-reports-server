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

### 1. Clone this Repository

```bash
git clone https://github.com/izzy0101010101/mcp-reports-server.git
cd mcp-reports-server
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- `@modelcontextprotocol/sdk`: The MCP SDK for Node.js
- `axios`: HTTP client for making API requests

### 3. Test the Server

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
      "args": ["/full/path/to/your/mcp-reports-server/server.js"],
      "env": {
        "REPORTS_JWT_TOKEN": "your_actual_jwt_token_here"
      }
    }
  }
}
```

**Important Notes:**
- Replace `/full/path/to/your/mcp-reports-server/server.js` with the actual full path to your server.js file
- Replace `your_actual_jwt_token_here` with your real JWT token
- Use forward slashes `/` in paths, even on Windows

**Example paths:**
- **macOS**: `/Users/username/reports-mcp-server/server.js`
- **Windows**: `C:/Users/username/reports-mcp-server/server.js`

### 3. Restart Claude Desktop

Close and reopen Claude Desktop for the configuration to take effect.
