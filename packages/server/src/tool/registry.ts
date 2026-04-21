import { createReadTool } from './read';
import { createWriteTool, PermissionCallback } from './write';
import { createEditTool } from './edit';
import { createBashTool } from './bash';
import { globTool } from './glob';
import { grepTool } from './grep';
import { findFileTool } from './find-file';
import { mapProjectTool } from './map-project';

export interface ToolContext {
  onConfirm: PermissionCallback;
  activeFiles?: string[];
}

export const getTools = (context: ToolContext) => ({
  readFile: createReadTool(context.onConfirm),
  writeFile: createWriteTool(context.onConfirm, context.activeFiles),
  editFile: createEditTool(context.onConfirm, context.activeFiles),
  executeBash: createBashTool(context.onConfirm),
  listWithGlob: globTool,
  searchWithGrep: grepTool,
  findFile: findFileTool,
  mapProject: mapProjectTool,
});
