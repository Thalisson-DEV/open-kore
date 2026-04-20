import { readTool } from './read';
import { writeTool } from './write';
import { editTool } from './edit';
import { bashTool } from './bash';
import { globTool } from './glob';
import { grepTool } from './grep';
import { mapProjectTool } from './map-project';

export const tools = {
  readFile: readTool,
  writeFile: writeTool,
  editFile: editTool,
  executeBash: bashTool,
  listWithGlob: globTool,
  searchWithGrep: grepTool,
  mapProject: mapProjectTool,
};
