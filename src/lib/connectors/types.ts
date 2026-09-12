/**
 * Future connectors (social, work, calendar, productivity). Interface only.
 * Every connector declares the permissions it needs; nothing is ingested silently.
 */
export type Connector = {
  id: string;
  name: string;
  description: string;
  requiredPermissions: string[];
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  fetchData(scope: string): Promise<unknown>;
};

export const connectors: Connector[] = [];
