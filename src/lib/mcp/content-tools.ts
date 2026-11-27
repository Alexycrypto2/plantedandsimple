import { ToolError, type ToolContext, type ZodRawShape } from '@lovable.dev/mcp-js';
import { createPostTools } from '@/lib/mcp-server/tools.server';
import { createRecipeTools } from '@/lib/mcp-server/recipe-tools.server';
import { ownerClient } from './supabase';

const unavailable = async (): Promise<never> => { throw new ToolError('A verified owner connection is required.'); };
const definitions = [...createPostTools(unavailable), ...createRecipeTools(unavailable)];

export function contentToolSpec(name: string) {
  const definition = definitions.find((t) => t.name === name);
  if (!definition) throw new Error(`Unknown content tool: ${name}`);
  let schema: any = definition.inputSchema;
  while (schema._def.typeName === 'ZodEffects') schema = schema._def.schema;
  const inputSchema: ZodRawShape = schema.shape;
  return {
    name, title: name.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    description: definition.description,
    inputSchema,
    annotations: { readOnlyHint: definition.readOnly, destructiveHint: name.startsWith('delete_') },
    handler: async (args: Record<string, unknown>, ctx: ToolContext) => {
      const db = await ownerClient(ctx);
      if (name === 'generate_post') throw new ToolError('Long-running article generation stays in Admin → AI Studio. Use create_draft to save assistant-written articles for review.');
      const tool = [...createPostTools(async () => db), ...createRecipeTools(async () => db)].find((t) => t.name === name);
      if (!tool) throw new ToolError('Unknown content tool.');
      const parsed = tool.inputSchema.safeParse(args);
      if (!parsed.success) throw new ToolError(parsed.error.message);
      try {
        const result = await (tool.run as (input: unknown) => Promise<unknown>)(parsed.data);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
      } catch (error) {
        throw new ToolError(error instanceof Error ? error.message : 'The content operation failed.');
      }
    },
  };
}