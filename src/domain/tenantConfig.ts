// Hardcoded tenant configuration for allowed aspect keys. Replace with DB-backed config later.
const tenantAspectMap: Record<string, string[]> = {
  // demo tenant id used in seed
  '00000000-0000-0000-0000-000000000001': ['quality', 'delivery', 'value']
};

export function getAllowedAspectKeys(tenantId: string) {
  return tenantAspectMap[tenantId] || [];
}
