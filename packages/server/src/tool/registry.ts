import { createReadTool } from './read';
import { createWriteTool, PermissionCallback } from './write';
import { createEditTool } from './edit';
import { createBashTool } from './bash';
import { globTool } from './glob';
import { grepTool } from './grep';
import { mapProjectTool } from './map-project';

export const getTools = (onConfirm: PermissionCallback) => ({
  readFile: createReadTool(onConfirm),
  writeFile: createWriteTool(onConfirm),
  editFile: createEditTool(onConfirm),
  executeBash: createBashTool(onConfirm),
  listWithGlob: globTool,
  searchWithGrep: grepTool,
  mapProject: mapProjectTool,
});
