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

// Update a report
async function updateReport(providedToken, reportId, reportData) {
  try {
    const bearerToken = getBearerToken(providedToken);
    
    // Validate reportId format (should be MongoDB ObjectId)
    if (!reportId || !reportId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Invalid reportId format. Must be a valid MongoDB ObjectId (24 characters)'
      );
    }

    // Validate status if provided
    if (reportData.status !== undefined) {
      const validStatuses = ['Draft', 'In Progress', 'Submitted', 'Reviewed', 'Closed'];
      if (!validStatuses.includes(reportData.status)) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Status must be one of: ${validStatuses.join(', ')}`
        );
      }
    }

    const response = await axios.put(`${REPORTS_ENDPOINT}/${reportId}`, reportData, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
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
            message: `Successfully updated report ${reportId}`,
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
        `Network error: Unable to reach the API at ${REPORTS_ENDPOINT}/${reportId}`
      );
    } else {
      throw new McpError(
        ErrorCode.InternalError,
        `Request setup error: ${error.message}`
      );
    }
  }
}

// Get a specific report by ID
async function getReport(providedToken, reportId) {
  try {
    const bearerToken = getBearerToken(providedToken);
    
    // Validate reportId format (should be MongoDB ObjectId)
    if (!reportId || !reportId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Invalid reportId format. Must be a valid MongoDB ObjectId (24 characters)'
      );
    }

    const response = await axios.get(`${REPORTS_ENDPOINT}/${reportId}`, {
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
            message: `Retrieved report ${reportId}`,
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
        `Network error: Unable to reach the API at ${REPORTS_ENDPOINT}/${reportId}`
      );
    } else {
      throw new McpError(
        ErrorCode.InternalError,
        `Request setup error: ${error.message}`
      );
    }
  }
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

// Create a new report function
async function createReport(providedToken, reportData) {
  try {
    const bearerToken = getBearerToken(providedToken);
    
    // Build the report payload with default templateId if not provided
    const payload = {
      title: reportData.title || "",
      platform: reportData.platform || "",
      templateId: reportData.templateId || "67b1dac12c8d23272ad47cbd",
      testers: reportData.testers || []
    };

    const response = await axios.post(REPORTS_ENDPOINT, payload, {
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
            message: 'Report created successfully',
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

// Get a specific vulnerability by ID
async function getVulnerability(providedToken, vulnerabilityId) {
  try {
    const bearerToken = getBearerToken(providedToken);
    
    // Validate vulnerabilityId format (should be MongoDB ObjectId)
    if (!vulnerabilityId || !vulnerabilityId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Invalid vulnerabilityId format. Must be a valid MongoDB ObjectId (24 characters)'
      );
    }

    const response = await axios.get(`${VULNERABILITY_ENDPOINT}/${vulnerabilityId}`, {
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
            message: `Retrieved vulnerability ${vulnerabilityId}`,
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
        `Network error: Unable to reach the API at ${VULNERABILITY_ENDPOINT}/${vulnerabilityId}`
      );
    } else {
      throw new McpError(
        ErrorCode.InternalError,
        `Request setup error: ${error.message}`
      );
    }
  }
}

// Helper function to auto-format text content as HTML
function formatAsHTML(content, fieldType = 'paragraph') {
  if (!content || typeof content !== 'string') {
    return content;
  }
  
  // If already contains HTML tags, return as-is
  if (content.includes('<') && content.includes('>')) {
    return content;
  }
  
  // For simple text, wrap in appropriate HTML tags
  if (fieldType === 'list') {
    // Split by newlines or common list separators and create bullet list
    const items = content.split(/\n|;|,|\|/).map(item => item.trim()).filter(item => item);
    if (items.length > 1) {
      return '<ul>' + items.map(item => `<li>${item}</li>`).join('') + '</ul>';
    }
  }
  
  // Default: wrap in paragraph tags
  return `<p>${content}</p>`;
}

// Update a vulnerability
async function updateVulnerability(providedToken, vulnerabilityId, vulnerabilityData) {
  try {
    const bearerToken = getBearerToken(providedToken);
    
    // Validate vulnerabilityId format (should be MongoDB ObjectId)
    if (!vulnerabilityId || !vulnerabilityId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Invalid vulnerabilityId format. Must be a valid MongoDB ObjectId (24 characters)'
      );
    }

    // Validate vulnerability data
    if (vulnerabilityData.cvssScore !== undefined) {
      if (typeof vulnerabilityData.cvssScore !== 'number' || vulnerabilityData.cvssScore < 0 || vulnerabilityData.cvssScore > 10) {
        throw new McpError(
          ErrorCode.InvalidParams,
          'CVSS Score must be a number between 0.0 and 10.0'
        );
      }
    }
    
    if (vulnerabilityData.severity !== undefined) {
      const validSeverities = ['Informational', 'Low', 'Medium', 'High', 'Critical'];
      if (!validSeverities.includes(vulnerabilityData.severity)) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Severity must be one of: ${validSeverities.join(', ')}`
        );
      }
    }
    
    if (vulnerabilityData.cvss !== undefined) {
      if (typeof vulnerabilityData.cvss !== 'string' || !vulnerabilityData.cvss.startsWith('CVSS:3.1/')) {
        throw new McpError(
          ErrorCode.InvalidParams,
          'CVSS vector must be a valid CVSS 3.1 string starting with "CVSS:3.1/"'
        );
      }
    }

    const response = await axios.put(`${VULNERABILITY_ENDPOINT}/${vulnerabilityId}`, vulnerabilityData, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
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
            message: `Successfully updated vulnerability ${vulnerabilityId}`,
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
        `Network error: Unable to reach the API at ${VULNERABILITY_ENDPOINT}/${vulnerabilityId}`
      );
    } else {
      throw new McpError(
        ErrorCode.InternalError,
        `Request setup error: ${error.message}`
      );
    }
  }
}

// Delete a vulnerability
async function deleteVulnerability(providedToken, vulnerabilityId) {
  try {
    const bearerToken = getBearerToken(providedToken);
    
    // Validate vulnerabilityId format (should be MongoDB ObjectId)
    if (!vulnerabilityId || !vulnerabilityId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Invalid vulnerabilityId format. Must be a valid MongoDB ObjectId (24 characters)'
      );
    }

    const response = await axios.delete(`${VULNERABILITY_ENDPOINT}/${vulnerabilityId}`, {
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
            message: `Successfully deleted vulnerability ${vulnerabilityId}`,
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
        `Network error: Unable to reach the API at ${VULNERABILITY_ENDPOINT}/${vulnerabilityId}`
      );
    } else {
      throw new McpError(
        ErrorCode.InternalError,
        `Request setup error: ${error.message}`
      );
    }
  }
}

// Get vulnerabilities for a report
async function getVulnerabilities(providedToken, reportId) {
  try {
    const bearerToken = getBearerToken(providedToken);
    
    // Validate reportId format (should be MongoDB ObjectId)
    if (!reportId || !reportId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Invalid reportId format. Must be a valid MongoDB ObjectId (24 characters)'
      );
    }

    const response = await axios.get(`${VULNERABILITY_ENDPOINT}/report/${reportId}`, {
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
            message: `Retrieved vulnerabilities for report ${reportId}`,
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
        `Network error: Unable to reach the API at ${VULNERABILITY_ENDPOINT}/report/${reportId}`
      );
    } else {
      throw new McpError(
        ErrorCode.InternalError,
        `Request setup error: ${error.message}`
      );
    }
  }
}

// Create vulnerabilities for a report
async function createVulnerabilities(providedToken, reportId, vulnerabilities) {
  try {
    const bearerToken = getBearerToken(providedToken);
    
    // Validate reportId format (should be MongoDB ObjectId)
    if (!reportId || !reportId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Invalid reportId format. Must be a valid MongoDB ObjectId (24 characters)'
      );
    }

    // Ensure vulnerabilities is an array
    if (!Array.isArray(vulnerabilities)) {
      vulnerabilities = [vulnerabilities];
    }

    // Validate and format each vulnerability object
    for (const vuln of vulnerabilities) {
      if (!vuln.title || typeof vuln.title !== 'string') {
        throw new McpError(
          ErrorCode.InvalidParams,
          'Each vulnerability must have a title (string)'
        );
      }
      if (!vuln.description || typeof vuln.description !== 'string') {
        throw new McpError(
          ErrorCode.InvalidParams,
          'Each vulnerability must have a description (HTML string)'
        );
      }
      
      // Auto-format content fields as HTML
      vuln.description = formatAsHTML(vuln.description);
      if (vuln.details) vuln.details = formatAsHTML(vuln.details);
      if (vuln.impact) vuln.impact = formatAsHTML(vuln.impact, 'list');
      if (vuln.remediation) vuln.remediation = formatAsHTML(vuln.remediation, 'list');
      
      // Validate CVSS fields if provided
      if (vuln.cvssScore !== undefined) {
        if (typeof vuln.cvssScore !== 'number' || vuln.cvssScore < 0 || vuln.cvssScore > 10) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'CVSS Score must be a number between 0.0 and 10.0'
          );
        }
      }
      
      if (vuln.severity !== undefined) {
        const validSeverities = ['Informational', 'Low', 'Medium', 'High', 'Critical'];
        if (!validSeverities.includes(vuln.severity)) {
          throw new McpError(
            ErrorCode.InvalidParams,
            `Severity must be one of: ${validSeverities.join(', ')}`
          );
        }
      }
      
      if (vuln.cvss !== undefined) {
        if (typeof vuln.cvss !== 'string' || !vuln.cvss.startsWith('CVSS:3.1/')) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'CVSS vector must be a valid CVSS 3.1 string starting with "CVSS:3.1/"'
          );
        }
      }
    }

    const response = await axios.post(`${VULNERABILITY_ENDPOINT}/${reportId}`, vulnerabilities, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
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
            message: `Successfully created ${vulnerabilities.length} vulnerability(ies) for report ${reportId}`,
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
        `Network error: Unable to reach the API at ${VULNERABILITY_ENDPOINT}/${reportId}`
      );
    } else {
      throw new McpError(
        ErrorCode.InternalError,
        `Request setup error: ${error.message}`
      );
    }
  }
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'update_report',
        description: 'Update a report. HTML fields (goal, scope, summary description/keyFindings, recommendations) use minimal HTML formatting: only <p> tags for paragraphs and <ul><li> for simple bullet lists. NO nesting, NO numbered lists, NO code blocks, NO headers.',
        inputSchema: {
          type: 'object',
          properties: {
            bearerToken: {
              type: 'string',
              description: 'Bearer token for authentication (optional if REPORTS_JWT_TOKEN env var is set)',
            },
            reportId: {
              type: 'string',
              description: 'The ID of the report to update (24-character MongoDB ObjectId)',
            },
            title: {
              type: 'string',
              description: 'Report title (optional, max 100 characters)',
            },
            platform: {
              type: 'string',
              description: 'Platform name (optional)',
            },
            goal: {
              type: 'string',
              description: 'HTML-formatted goal/objective using only <p> and <ul><li> tags (optional)',
            },
            scope: {
              type: 'string',
              description: 'HTML-formatted scope using only <p> and <ul><li> tags (optional)',
            },
            summaryDescription: {
              type: 'string',
              description: 'HTML-formatted summary description using only <p> and <ul><li> tags (optional)',
            },
            summaryKeyFindings: {
              type: 'string',
              description: 'HTML-formatted key findings using only <p> and <ul><li> tags (optional)',
            },
            recommendations: {
              type: 'string',
              description: 'HTML-formatted recommendations using only <p> and <ul><li> tags (optional)',
            },
            status: {
              type: 'string',
              enum: ['Draft', 'In Progress', 'Submitted', 'Reviewed', 'Closed'],
              description: 'Report status (optional)',
            },
          },
          required: ['reportId'],
        },
      },
      {
        name: 'get_report',
        description: 'Retrieve a specific report by ID',
        inputSchema: {
          type: 'object',
          properties: {
            bearerToken: {
              type: 'string',
              description: 'Bearer token for authentication (optional if REPORTS_JWT_TOKEN env var is set)',
            },
            reportId: {
              type: 'string',
              description: 'The ID of the report to retrieve (24-character MongoDB ObjectId)',
            },
          },
          required: ['reportId'],
        },
      },
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
          required: [],
        },
      },
      {
        name: 'create_report',
        description: 'Create a new report',
        inputSchema: {
          type: 'object',
          properties: {
            bearerToken: {
              type: 'string',
              description: 'Bearer token for authentication (optional if REPORTS_JWT_TOKEN env var is set)',
            },
            title: {
              type: 'string',
              description: 'The title/name of the report',
            },
            platform: {
              type: 'string',
              description: 'The platform for the report (e.g., iOS, Android, Web)',
            },
            templateId: {
              type: 'string',
              description: 'Template ID for the report (defaults to 67b1dac12c8d23272ad47cbd if not provided)',
            },
            testers: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of tester IDs (optional, defaults to empty array)',
            },
          },
          required: ['title'],
        },
      },
      {
        name: 'get_vulnerability',
        description: 'Retrieve a specific vulnerability by ID',
        inputSchema: {
          type: 'object',
          properties: {
            bearerToken: {
              type: 'string',
              description: 'Bearer token for authentication (optional if REPORTS_JWT_TOKEN env var is set)',
            },
            vulnerabilityId: {
              type: 'string',
              description: 'The ID of the vulnerability to retrieve (24-character MongoDB ObjectId)',
            },
          },
          required: ['vulnerabilityId'],
        },
      },
      {
        name: 'update_vulnerability',
        description: 'Update a vulnerability. Use minimal HTML formatting: only <p> tags for paragraphs and <ul><li> for simple bullet lists. NO nesting, NO numbered lists, NO code blocks, NO headers.',
        inputSchema: {
          type: 'object',
          properties: {
            bearerToken: {
              type: 'string',
              description: 'Bearer token for authentication (optional if REPORTS_JWT_TOKEN env var is set)',
            },
            vulnerabilityId: {
              type: 'string',
              description: 'The ID of the vulnerability to update (24-character MongoDB ObjectId)',
            },
            title: {
              type: 'string',
              description: 'The title of the vulnerability (optional)',
            },
            description: {
              type: 'string',
              description: 'Simple HTML description using only <p> tags (optional)',
            },
            details: {
              type: 'string',
              description: 'Simple HTML details using only <p> and <ul><li> tags (optional)',
            },
            impact: {
              type: 'string',
              description: 'Simple HTML impact using only <p> and <ul><li> tags (optional)',
            },
            remediation: {
              type: 'string',
              description: 'Simple HTML remediation using only <p> and <ul><li> tags (optional)',
            },
            cvss: {
              type: 'string',
              description: 'CVSS 3.1 vector string (optional)',
            },
            cvssScore: {
              type: 'number',
              minimum: 0,
              maximum: 10,
              description: 'CVSS 3.1 score (0.0 to 10.0, optional)',
            },
            severity: {
              type: 'string',
              enum: ['Informational', 'Low', 'Medium', 'High', 'Critical'],
              description: 'Vulnerability severity level (optional)',
            },
            taskId: {
              type: 'string',
              description: 'Task ID associated with the vulnerability (optional)',
            },
          },
          required: ['vulnerabilityId'],
        },
      },
      {
        name: 'delete_vulnerability',
        description: 'Delete a vulnerability by ID',
        inputSchema: {
          type: 'object',
          properties: {
            bearerToken: {
              type: 'string',
              description: 'Bearer token for authentication (optional if REPORTS_JWT_TOKEN env var is set)',
            },
            vulnerabilityId: {
              type: 'string',
              description: 'The ID of the vulnerability to delete (24-character MongoDB ObjectId)',
            },
          },
          required: ['vulnerabilityId'],
        },
      },
      {
        name: 'get_vulnerabilities',
        description: 'Retrieve all vulnerabilities for a specific report',
        inputSchema: {
          type: 'object',
          properties: {
            bearerToken: {
              type: 'string',
              description: 'Bearer token for authentication (optional if REPORTS_JWT_TOKEN env var is set)',
            },
            reportId: {
              type: 'string',
              description: 'The ID of the report to get vulnerabilities from (24-character MongoDB ObjectId)',
            },
          },
          required: ['reportId'],
        },
      },
      {
        name: 'create_vulnerabilities',
        description: 'Create one or more vulnerabilities for a specific report. Use minimal HTML formatting: only <p> tags for paragraphs and <ul><li> for simple bullet lists. NO nesting, NO numbered lists, NO code blocks, NO headers.',
        inputSchema: {
          type: 'object',
          properties: {
            bearerToken: {
              type: 'string',
              description: 'Bearer token for authentication (optional if REPORTS_JWT_TOKEN env var is set)',
            },
            reportId: {
              type: 'string',
              description: 'The ID of the report to add vulnerabilities to (24-character MongoDB ObjectId)',
            },
            vulnerabilities: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: {
                    type: 'string',
                    description: 'The title of the vulnerability',
                  },
                  description: {
                    type: 'string',
                    description: 'Simple HTML description using only <p> tags. Keep it concise and minimal.',
                  },
                  details: {
                    type: 'string',
                    description: 'Simple HTML details using only <p> and <ul><li> tags. No nesting or complex formatting.',
                  },
                  impact: {
                    type: 'string',
                    description: 'Simple HTML impact using only <p> and <ul><li> tags. List impacts as simple bullet points.',
                  },
                  remediation: {
                    type: 'string',
                    description: 'Simple HTML remediation using only <p> and <ul><li> tags. List fixes as simple bullet points.',
                  },
                  cvss: {
                    type: 'string',
                    description: 'CVSS 3.1 vector string (e.g., "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N")',
                  },
                  cvssScore: {
                    type: 'number',
                    minimum: 0,
                    maximum: 10,
                    description: 'CVSS 3.1 score (0.0 to 10.0)',
                  },
                  severity: {
                    type: 'string',
                    enum: ['Informational', 'Low', 'Medium', 'High', 'Critical'],
                    description: 'Vulnerability severity level based on CVSS score',
                  },
                },
                required: ['title', 'description'],
              },
              description: 'Array of vulnerability objects to create. Format content with minimal HTML: <p> for text, <ul><li> for lists only.',
            },
          },
          required: ['reportId', 'vulnerabilities'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_report':
        if (!args.reportId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Report ID is required'
          );
        }
        return await getReport(args.bearerToken, args.reportId);

      case 'update_report':
        if (!args.reportId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Report ID is required'
          );
        }
        
        // Build update data object from provided fields with auto-HTML formatting for HTML fields
        const reportUpdateData = {};
        if (args.title !== undefined) reportUpdateData.title = args.title;
        if (args.platform !== undefined) reportUpdateData.platform = args.platform;
        if (args.goal !== undefined) reportUpdateData.goal = formatAsHTML(args.goal);
        if (args.scope !== undefined) reportUpdateData.scope = formatAsHTML(args.scope);
        if (args.recommendations !== undefined) reportUpdateData.recommendations = formatAsHTML(args.recommendations, 'list');
        if (args.status !== undefined) reportUpdateData.status = args.status;
        
        // Handle summary object fields
        if (args.summaryDescription !== undefined || args.summaryKeyFindings !== undefined) {
          reportUpdateData.summary = {};
          if (args.summaryDescription !== undefined) {
            reportUpdateData.summary.description = formatAsHTML(args.summaryDescription);
          }
          if (args.summaryKeyFindings !== undefined) {
            reportUpdateData.summary.keyFindings = formatAsHTML(args.summaryKeyFindings, 'list');
          }
        }
        
        if (Object.keys(reportUpdateData).length === 0) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'At least one field must be provided to update'
          );
        }
        
        return await updateReport(args.bearerToken, args.reportId, reportUpdateData);

      case 'get_all_reports':
        return await getAllReports(args.bearerToken);
        
      case 'create_report':
        if (!args.title) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Report title is required'
          );
        }
        return await createReport(args.bearerToken, {
          title: args.title,
          platform: args.platform,
          templateId: args.templateId,
          testers: args.testers,
        });

      case 'get_vulnerabilities':
        if (!args.reportId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Report ID is required'
          );
        }
        return await getVulnerabilities(args.bearerToken, args.reportId);

      case 'get_vulnerability':
        if (!args.vulnerabilityId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Vulnerability ID is required'
          );
        }
        return await getVulnerability(args.bearerToken, args.vulnerabilityId);

      case 'update_vulnerability':
        if (!args.vulnerabilityId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Vulnerability ID is required'
          );
        }
        
        // Build update data object from provided fields with auto-HTML formatting
        const updateData = {};
        if (args.title !== undefined) updateData.title = args.title;
        if (args.description !== undefined) updateData.description = formatAsHTML(args.description);
        if (args.details !== undefined) updateData.details = formatAsHTML(args.details);
        if (args.impact !== undefined) updateData.impact = formatAsHTML(args.impact, 'list');
        if (args.remediation !== undefined) updateData.remediation = formatAsHTML(args.remediation, 'list');
        if (args.cvss !== undefined) updateData.cvss = args.cvss;
        if (args.cvssScore !== undefined) updateData.cvssScore = args.cvssScore;
        if (args.severity !== undefined) updateData.severity = args.severity;
        if (args.taskId !== undefined) updateData.taskId = args.taskId;
        
        if (Object.keys(updateData).length === 0) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'At least one field must be provided to update'
          );
        }
        
        return await updateVulnerability(args.bearerToken, args.vulnerabilityId, updateData);

      case 'delete_vulnerability':
        if (!args.vulnerabilityId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Vulnerability ID is required'
          );
        }
        return await deleteVulnerability(args.bearerToken, args.vulnerabilityId);

      case 'create_vulnerabilities':
        if (!args.reportId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Report ID is required'
          );
        }
        if (!args.vulnerabilities || !Array.isArray(args.vulnerabilities) || args.vulnerabilities.length === 0) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'At least one vulnerability is required'
          );
        }
        return await createVulnerabilities(args.bearerToken, args.reportId, args.vulnerabilities);
        
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