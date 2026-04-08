/**
 * AOSP Code Search Tools
 *
 * Proxy tool that forwards code search requests to a remote AOSP MCP server.
 * Endpoint: http://10.23.12.96:8888/mcp
 */

import { z } from 'zod';
import type { ToolDefinition } from './types.js';

const AOSP_MCP_URL = process.env.AOSP_MCP_URL || 'http://10.23.12.96:8888/mcp';
const AOSP_MCP_KEY = process.env.AOSP_MCP_KEY || 'sk-abc123';

interface McpToolResult {
  content?: Array<{ type: string; text: string }>;
  error?: string;
}

async function callAospMcp(method: string, params: Record<string, unknown>): Promise<McpToolResult> {
  const body = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method,
    params,
  });

  const res = await fetch(AOSP_MCP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AOSP_MCP_KEY}`,
    },
    body,
  });

  if (!res.ok) {
    throw new Error(`AOSP MCP request failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json() as { result?: McpToolResult; error?: { message: string } };
  if (json.error) {
    throw new Error(`AOSP MCP error: ${json.error.message}`);
  }

  return json.result ?? { content: [{ type: 'text', text: JSON.stringify(json) }] };
}

export const aospCodeSearchTool: ToolDefinition<{
  tool: z.ZodString;
  arguments: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}> = {
  name: 'aosp_code_search',
  description: 'Search AOSP (Android Open Source Project) codebase via remote MCP server. Use the "tool" param to specify which remote tool to call (e.g. "search", "lookup"), and "arguments" for tool-specific parameters.',
  annotations: { readOnlyHint: true, openWorldHint: true },
  schema: {
    tool: z.string().describe('Remote AOSP MCP tool name to invoke (e.g. "search", "lookup", "list_tools")'),
    arguments: z.record(z.string(), z.string()).optional().describe('Arguments to pass to the remote tool as key-value pairs'),
  },
  handler: async (args) => {
    try {
      if (args.tool === 'list_tools') {
        const result = await callAospMcp('tools/list', {});
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      }

      const result = await callAospMcp('tools/call', {
        name: args.tool,
        arguments: args.arguments ?? {},
      });

      return {
        content: result.content
          ? result.content.map(c => ({ type: 'text' as const, text: c.text }))
          : [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text' as const, text: `AOSP MCP error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  },
};

export const aospTools = [aospCodeSearchTool];
