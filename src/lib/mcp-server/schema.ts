/** Tiny Zod → JSON Schema converter covering the shapes our MCP tools use. */
export function zodToJsonSchema(s: any): any {
  const d = s?._def;
  switch (d?.typeName) {
    case "ZodEffects": return zodToJsonSchema(d.schema);
    case "ZodOptional": return zodToJsonSchema(d.innerType);
    case "ZodDefault": return { ...zodToJsonSchema(d.innerType), default: d.defaultValue() };
    case "ZodString": return { type: "string" };
    case "ZodNumber": return { type: d.checks?.some((c: any) => c.kind === "int") ? "integer" : "number" };
    case "ZodBoolean": return { type: "boolean" };
    case "ZodEnum": return { type: "string", enum: d.values };
    case "ZodArray": return { type: "array", items: zodToJsonSchema(d.type) };
    case "ZodObject": {
      const shape = d.shape();
      const required = Object.keys(shape).filter((k) => !["ZodOptional", "ZodDefault"].includes(shape[k]._def.typeName));
      return { type: "object", properties: Object.fromEntries(Object.entries(shape).map(([k, v]) => [k, zodToJsonSchema(v)])), ...(required.length ? { required } : {}), additionalProperties: false };
    }
    default: return {};
  }
}
