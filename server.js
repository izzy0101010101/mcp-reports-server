#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import axios from 'axios';

// Configuration
const API_BASE_URL = 'http://10.10.10.117:3000/api';
const REPORTS_ENDPOINT = `${API_BASE_URL}/report`;
const VULNERABILITY_ENDPOINT = `${API_BASE_URL}/vulnerability`;

// JWT Configuration - read from environment variable
let JWT_TOKEN = process.env.REPORTS_JWT_TOKEN;

// Create server instance
const server = new Server(
  {
    name: 'reports-server',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper function to get bearer token
function getBearerToken(providedToken) {
  // If a token is provided in the request, use it
  if (providedToken) {
    return providedToken;
  }
  
  // Otherwise, use the configured JWT token
  if (JWT_TOKEN) {
    return JWT_TOKEN;
  }
  
  // If no token is available, throw an error
  throw new McpError(
    ErrorCode.InvalidParams,
    'No bearer token provided. Either pass bearerToken parameter or set REPORTS_JWT_TOKEN environment variable.'
  );
}

// Get all reports function
async function getAllReports(providedToken) {
  try {
    const bearerToken = getBearerToken(providedToken);
    
    const response = await axios.get(REPORTS_ENDPOINT, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            status: response.status,
            data: response.data,
            timestamp: new Date().toISOString(),
            message: `Retrieved ${response.data?.length || 0} reports`,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    
    if (error.response) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              status: error.response.status,
              error: error.response.data || error.message,
              timestamp: new Date().toISOString(),
            }, null, 2),
          },
        ],
      };
    } else if (error.request) {
      throw new McpError(
        ErrorCode.InternalError,
        `Network error: Unable to reach the API at ${REPORTS_ENDPOINT}`
      );
    } else {
      throw new McpError(
        ErrorCode.InternalError,
        `Request setup error: ${error.message}`
      );
    }
  }
}

// ... (include all other functions from your server.js with the same pattern) ...

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_all_reports',
        description: 'Retrieve all reports from the API',
        inputSchema: {
          type: 'object',
          properties: {
            bearerToken: {
              type: 'string',
              description: 'Bearer token for authentication (optional if REPORTS_JWT_TOKEN env var is set)',
            },
          },
          required: [], // No longer required if env var is set
        },
      },
      // ... (include all other tools with updated schemas) ...
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_all_reports':
        return await getAllReports(args.bearerToken);
        
      // ... (handle other cases) ...
        
      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    
    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error.message}`
    );
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Reports MCP server running on stdio');
  
  // Log JWT configuration status
  if (JWT_TOKEN) {
    console.error('JWT token configured via environment variable');
  } else {
    console.error('No JWT token configured - bearerToken parameter required for all requests');
  }
}

// Handle process events
process.on('SIGINT', () => {
  console.error('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Run the server
main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});