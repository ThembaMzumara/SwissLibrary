import * as ts from 'typescript';

export interface CompileOptions {
  target?: ts.ScriptTarget;
  module?: ts.ModuleKind;
  sourceMap?: boolean;
  outputFormat?: 'typescript' | 'javascript';
}

export interface FileInfo {
  path: string;
  content: string;
}

export interface TransformResult {
  code: string;
  sourceMap?: string;
  dependencies: string[];
}

export interface TransformerContext {
  fileName: string;
  options: CompileOptions;
  program?: ts.Program;
  checker?: ts.TypeChecker;
}
