import { definePluginEntry } from 'openclaw/plugin-sdk/plugin-entry';

// The host's MCP client discovers schemas and executes tools directly.
// No Ridian handlers, OAuth implementation, or tool descriptions are copied here.
export default definePluginEntry({
  id: 'ridian',
  name: 'Ridian',
  description: 'Ridian calendars, tasks, contacts and mail through MCP and OAuth.',
  register() {},
});
