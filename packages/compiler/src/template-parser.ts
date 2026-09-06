/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

export interface Position {
    line: number;
    column: number;
  }
  
  export interface SourceLocation {
    start: Position;
    end: Position;
  }
  
  export interface TemplateNode {
    type: string;
    loc: SourceLocation;
    parent?: TemplateNode;
    children?: TemplateNode[];
  }
  
  export interface ElementNode extends TemplateNode {
    type: 'Element';
    tag: string;
    attributes: AttributeNode[];
    children: TemplateNode[];
    selfClosing: boolean;
    namespace?: string;
  }
  
  export interface AttributeNode extends TemplateNode {
    type: 'Attribute';
    name: string;
    value: ExpressionNode | TextNode | null;
    dynamic: boolean;
    directive?: string; // @click, @bind, etc.
    modifiers?: string[]; // Changed to array for multiple modifiers
  }
  
  export interface TextNode extends TemplateNode {
    type: 'Text';
    value: string;
    interpolated: boolean;
  }
  
  export interface ExpressionNode extends TemplateNode {
    type: 'Expression';
    expression: string;
    dependencies: string[];
  }
  
  export interface SlotNode extends TemplateNode {
    type: 'Slot';
    name: string;
    props: Record<string, ExpressionNode>;
    children: TemplateNode[];
  }
  
  export interface ConditionalNode extends TemplateNode {
    type: 'Conditional';
    condition: ExpressionNode;
    then: TemplateNode[];
    else?: TemplateNode[];
  }
  
  export interface LoopNode extends TemplateNode {
    type: 'Loop';
    iterable: ExpressionNode;
    item: string;
    index?: string;
    key?: ExpressionNode;
    body: TemplateNode[];
  }
  
  export interface ComponentNode extends TemplateNode {
    type: 'Component';
    name: string;
    props: AttributeNode[];
    slots: Record<string, TemplateNode[]>;
    children: TemplateNode[];
  }
  
  export type TemplateASTNode = 
    | ElementNode
    | ComponentNode
    | TextNode
    | ExpressionNode
    | SlotNode
    | ConditionalNode
    | LoopNode;
  
  // ==================== TOKENIZER ====================
  export enum TokenType {
    TAG_OPEN = 'TAG_OPEN',
    TAG_CLOSE = 'TAG_CLOSE',
    TAG_SLASH = 'TAG_SLASH',
    TAG_NAME = 'TAG_NAME',
    ATTR_NAME = 'ATTR_NAME',
    ATTR_VALUE = 'ATTR_VALUE',
    TEXT = 'TEXT',
    EXPRESSION_OPEN = 'EXPRESSION_OPEN',
    EXPRESSION_CLOSE = 'EXPRESSION_CLOSE',
    EXPRESSION_CONTENT = 'EXPRESSION_CONTENT',
    DIRECTIVE = 'DIRECTIVE',
    COMMENT = 'COMMENT',
    EQUALS = 'EQUALS',
    WHITESPACE = 'WHITESPACE',
    DOT = 'DOT',
    EOF = 'EOF'
  }
  
  export interface Token {
    type: TokenType;
    value: string;
    loc: SourceLocation;
  }
  
  export class Tokenizer {
    private source: string;
    private pos: number = 0;
    private line: number = 1;
    private column: number = 1;
    private currentChar: string = '';
  
    constructor(source: string) {
      this.source = source;
      this.currentChar = source[0] || '';
    }
  
    tokenize(): Token[] {
      const tokens: Token[] = [];
      while (this.pos < this.source.length) {
        const token = this.nextToken();
        if (token) {
          tokens.push(token);
        }
      }
      tokens.push(this.createToken(TokenType.EOF, ''));
      return tokens;
    }
  
    private nextToken(): Token | null {
      this.skipWhitespace();
      
      if (this.pos >= this.source.length) {
        return null;
      }
  
      const char = this.source[this.pos];
  
      // Comments
      if (char === '<' && this.source.startsWith('<!--', this.pos)) {
        return this.readComment();
      }
  
      // Tags
      if (char === '<') {
        this.advance();
        return this.createToken(TokenType.TAG_OPEN, '<');
      }
  
      if (char === '>') {
        this.advance();
        return this.createToken(TokenType.TAG_CLOSE, '>');
      }
  
      if (char === '/') {
        this.advance();
        return this.createToken(TokenType.TAG_SLASH, '/');
      }
  
      // Expressions
      if (char === '{') {
        return this.readExpression();
      }
  
      // Directives
      if (char === '@') {
        return this.readDirective();
      }
  
      // Strings (attribute values)
      if (char === '"' || char === "'") {
        return this.readString(char);
      }
  
      // Equals sign for attributes
      if (char === '=') {
        this.advance();
        return this.createToken(TokenType.EQUALS, '=');
      }
  
      // Dot for modifiers
      if (char === '.') {
        this.advance();
        return this.createToken(TokenType.DOT, '.');
      }
  
      // Identifiers (tag names, attribute names)
      if (this.isAlpha(char) || char === '_' || char === '$' || char === ':') {
        return this.readIdentifier();
      }
  
      // Text content
      return this.readText();
    }
  
    private readComment(): Token {
      // Skip '<!--'
      for (let i = 0; i < 4; i++) this.advance();
      let content = '';
      while (this.pos < this.source.length - 2) {
        if (this.source.startsWith('-->', this.pos)) {
          for (let i = 0; i < 3; i++) this.advance();
          break;
        }
        content += this.currentChar;
        this.advance();
      }
      return this.createToken(TokenType.COMMENT, content);
    }
  
    private readExpression(): Token {
      this.advance(); // Skip '{'
      // Check for double brace
      let isDoubleBrace = false;
      if (this.currentChar === '{') {
        isDoubleBrace = true;
        this.advance();
      }
      let content = '';
      while (this.pos < this.source.length) {
        if (this.currentChar === '}') {
          if (isDoubleBrace && this.source[this.pos + 1] === '}') {
            this.advance(); // Skip first '}'
            this.advance(); // Skip second '}'
            break;
          } else if (!isDoubleBrace) {
            this.advance(); // Skip '}'
            break;
          }
        }
        content += this.currentChar;
        this.advance();
      }
      return this.createToken(
        TokenType.EXPRESSION_CONTENT, 
        content.trim()
      );
    }
  
    private readDirective(): Token {
      this.advance(); // Skip '@'
      let name = '';
      while (
        this.pos < this.source.length &&
        (this.isAlphaNum(this.currentChar) || this.currentChar === '-')
      ) {
        name += this.currentChar;
        this.advance();
      }
      return this.createToken(TokenType.DIRECTIVE, name);
    }
  
    private readString(quote: string): Token {
      this.advance(); // Skip opening quote
      let value = '';
      while (this.pos < this.source.length && this.currentChar !== quote) {
        if (this.currentChar === '\\') {
          this.advance(); // Skip escape character
        }
        value += this.currentChar;
        this.advance();
      }
      if (this.pos < this.source.length && this.currentChar === quote) {
        this.advance(); // Skip closing quote
      }
      return this.createToken(TokenType.ATTR_VALUE, value);
    }
  
    private readIdentifier(): Token {
      let value = '';
      while (this.pos < this.source.length && 
             (this.isAlphaNum(this.currentChar) || 
              this.currentChar === '_' || 
              this.currentChar === '$' || 
              this.currentChar === '-' ||
              this.currentChar === ':')) {
        value += this.currentChar;
        this.advance();
      }
      const type = this.isComponentName(value) ? 
        TokenType.TAG_NAME : 
        TokenType.ATTR_NAME;
      return this.createToken(type, value);
    }
  
    private readText(): Token {
      let value = '';
      while (this.pos < this.source.length && 
             this.currentChar !== '<' && 
             this.currentChar !== '{' && 
             this.currentChar !== '@' &&
             this.currentChar !== '>') {
        value += this.currentChar;
        this.advance();
      }
      return this.createToken(TokenType.TEXT, value);
    }
  
    private skipWhitespace(): void {
      while (this.pos < this.source.length && /\s/.test(this.currentChar)) {
        if (this.currentChar === '\n') {
          this.line++;
          this.column = 0;
        }
        this.advance();
      }
    }
  
    private advance(): void {
      if (this.currentChar === '\n') {
        this.line++;
        this.column = 1;
      } else {
        this.column++;
      }
      
      this.pos++;
      this.currentChar = this.source[this.pos] || '';
    }
  
    private isAlpha(char: string): boolean {
      return /[a-zA-Z]/.test(char);
    }
  
    private isAlphaNum(char: string): boolean {
      return /[a-zA-Z0-9]/.test(char);
    }
  
    private isComponentName(name: string): boolean {
      return /^[A-Z]/.test(name);
    }
  
    private createToken(type: TokenType, value: string): Token {
      return {
        type,
        value,
        loc: {
          start: { line: this.line, column: this.column },
          end: { line: this.line, column: this.column }
        }
      };
    }
  }
  
  // ==================== PARSER ====================
  export class TemplateParser {
    private tokens: Token[];
    private currentIndex: number = 0;
    private currentToken: Token;
    private stack: TemplateASTNode[] = [];
  
    constructor(source: string) {
      const tokenizer = new Tokenizer(source);
      this.tokens = tokenizer.tokenize();
      this.currentToken = this.tokens[0];
    }
  
    parse(): TemplateASTNode[] {
      const nodes: TemplateASTNode[] = [];
      
      while (!this.isAtEnd()) {
        const node = this.parseNode();
        if (node) {
          nodes.push(node);
        }
      }
      
      return nodes;
    }
  
    private parseNode(): TemplateASTNode | null {
      if (!this.currentToken) return null;
      
      switch (this.currentToken.type) {
        case TokenType.TAG_OPEN:
          return this.parseElement();
        case TokenType.TEXT:
          return this.parseText();
        case TokenType.DIRECTIVE:
          return this.parseDirective();
        case TokenType.EXPRESSION_CONTENT:
          return this.parseExpression();
        case TokenType.COMMENT:
          this.advance(); // Skip comments
          return null;
        default:
          this.advance();
          return null;
      }
    }
  
    private parseElement(): ElementNode | ComponentNode | SlotNode | null {
      const startLoc = this.currentToken.loc.start;
      this.consume(TokenType.TAG_OPEN);

      // Check for closing tag
      if (this.currentToken.type === TokenType.TAG_SLASH) {
        this.advance(); // Skip slash
        this.consume(TokenType.TAG_NAME);
        this.consume(TokenType.TAG_CLOSE);
        return null; // Closing tags don't produce nodes
      }

      // Accept either TAG_NAME or ATTR_NAME here: lowercase HTML tags like 'div'
      // are tokenized as ATTR_NAME by the tokenizer's readIdentifier().
      let tagToken: Token;
      if (this.currentToken.type === TokenType.TAG_NAME) {
        tagToken = this.consume(TokenType.TAG_NAME);
      } else if (this.currentToken.type === TokenType.ATTR_NAME) {
        tagToken = this.consume(TokenType.ATTR_NAME);
      } else {
        throw new Error(`Expected TAG_NAME, got ${this.currentToken.type}`);
      }
      const tagName = tagToken.value;
      // ============== START OF FIX ==============
      if (!tagName || tagName.trim() === '') {
        const errorLocation = `line ${startLoc.line}, column ${startLoc.column}`;
        throw new Error(
          `SwissJS Compiler: JSX element with missing/empty tag at ${errorLocation}.\n` +
          `This usually means a malformed or empty JSX node. If you intended a fragment, use 'Fragment' as the tag.`
        );
      }
      // ============== END OF FIX ==============
      const isComponent = /^[A-Z]/.test(tagName);
      const isSlot = tagName === 'slot';
      
      // Parse attributes
      const attributes: AttributeNode[] = [];
      while ((this.currentToken.type as unknown as string) === (TokenType.ATTR_NAME as unknown as string) || 
             (this.currentToken.type as unknown as string) === (TokenType.DIRECTIVE as unknown as string)) {
        attributes.push(this.parseAttribute());
      }
      
      // Check self-closing
      const selfClosing = (this.currentToken.type as string) === 'TAG_SLASH';
      if (selfClosing) {
        this.advance();
      }
      
      this.consume(TokenType.TAG_CLOSE);
      
      // Parse children if not self-closing
      const children: TemplateASTNode[] = [];
      if (!selfClosing) {
        this.stack.push({
          type: isComponent ? 'Component' : 'Element',
          tag: tagName,
          loc: { start: startLoc, end: this.currentToken.loc.end }
        } as unknown as TemplateASTNode);
        
        while (!this.isAtEnd() && 
              !(((this.currentToken.type as unknown as string) === (TokenType.TAG_OPEN as unknown as string)) && 
                ((this.peek()?.type as unknown as string) === (TokenType.TAG_SLASH as unknown as string)))) {
          const child = this.parseNode();
          if (child) children.push(child);
        }
        
        // Check for matching closing tag
        if ((this.currentToken.type as unknown as string) === (TokenType.TAG_OPEN as unknown as string)) {
          this.consume(TokenType.TAG_OPEN);
          this.consume(TokenType.TAG_SLASH);
          // Accept either TAG_NAME or ATTR_NAME here (lowercase html tags like 'div')
          let closingTagToken: Token;
          if ((this.currentToken.type as unknown as string) === (TokenType.TAG_NAME as unknown as string) || (this.currentToken.type as unknown as string) === (TokenType.ATTR_NAME as unknown as string)) {
            closingTagToken = this.currentToken;
            this.advance();
          } else {
            throw new Error(`Expected ${TokenType.TAG_NAME} or ${TokenType.ATTR_NAME}, got ${this.currentToken.type}`);
          }
          const closingTag = closingTagToken.value;
          this.consume(TokenType.TAG_CLOSE);
          
          if (closingTag !== tagName) {
            throw new Error(`Mismatched closing tag: expected ${tagName}, got ${closingTag}`);
          }
        }
        
        // Fixed: Type assertion to satisfy linter
        const poppedElement = this.stack.pop();
        void poppedElement;
      }

      const endLoc = this.currentToken.loc.end;

      // ============== FRAGMENT HANDLING FIX ==============
      if (tagName === 'Fragment' || tagName === '') {
        return {
          type: 'Element',
          tag: 'Fragment',
          attributes: [],
          children,
          selfClosing: false,
          loc: { start: startLoc, end: endLoc }
        };
      }
      // ============== END OF FIX ==============
      
      if (isSlot) {
        // Extract slot name from attributes
        const nameAttr = attributes.find(attr => attr.name === 'name');
        const name = nameAttr?.value?.type === 'Text' ? 
          nameAttr.value.value : 
          'default';
        
        return {
          type: 'Slot',
          name,
          props: this.extractSlotProps(attributes),
          children,
          loc: { start: startLoc, end: endLoc }
        };
      }
      
      if (isComponent) {
        return {
          type: 'Component',
          name: tagName,
          props: attributes,
          slots: this.extractSlots(children),
          children: children.filter(child => child.type !== 'Slot'),
          loc: { start: startLoc, end: endLoc }
        };
      }
      
      return {
        type: 'Element',
        tag: tagName,
        attributes,
        children,
        selfClosing,
        loc: { start: startLoc, end: endLoc }
      };
    }
  
    private parseAttribute(): AttributeNode {
      const startLoc = this.currentToken.loc.start;
      const name = this.currentToken.value;
      let directive: string | undefined;
      let modifiers: string[] | undefined;
      
      // Handle directives
      if (this.currentToken.type === TokenType.DIRECTIVE) {
        directive = name;
        this.advance();
      } else {
        this.advance(); // Regular attribute
      }
      
      let value: ExpressionNode | TextNode | null = null;
      
      // Parse attribute value if exists
      if (this.currentToken.type === TokenType.EQUALS) {
        this.advance();
        
        if ((this.currentToken.type as string) === 'ATTR_VALUE') {
          value = {
            type: 'Text',
            value: this.currentToken.value,
            interpolated: false,
            loc: this.currentToken.loc
          };
          this.advance();
        } else if ((this.currentToken.type as string) === 'EXPRESSION_CONTENT') {
          value = {
            type: 'Expression',
            expression: this.currentToken.value,
            dependencies: this.extractDependencies(this.currentToken.value),
            loc: this.currentToken.loc
          };
          this.advance();
        }
      }
      
      if (this.currentToken.value.startsWith('@')) {
        const [directive, ...modifiers] = this.currentToken.value
          .substring(1)
          .split('.');
        return {
          type: 'Attribute',
          name: this.currentToken.value,
          value, // parsed value
          dynamic: true,
          directive,
          modifiers,
          loc: { start: startLoc, end: this.currentToken.loc.end }
        };
      }
      
      return {
        type: 'Attribute',
        name,
        value,
        dynamic: !!directive || (value?.type === 'Expression'),
        directive,
        modifiers,
        loc: { start: startLoc, end: this.currentToken.loc.end }
      };
    }
  
    private parseExpression(): ExpressionNode {
      const token = this.consume(TokenType.EXPRESSION_CONTENT);
      return {
        type: 'Expression',
        expression: token.value,
        dependencies: this.extractDependencies(token.value),
        loc: token.loc
      };
    }
  
    private parseText(): TextNode {
      const token = this.consume(TokenType.TEXT);
      return {
        type: 'Text',
        value: token.value,
        interpolated: false,
        loc: token.loc
      };
    }
  
    private parseDirective(): TemplateASTNode | null {
      const directive = this.currentToken.value;
      const startLoc = this.currentToken.loc.start;
      this.advance(); // skip directive token
      
      switch (directive) {
        case 'if':
          return this.parseConditional(startLoc);
        case 'for':
          return this.parseLoop(startLoc);
        case 'slot':
          return this.parseSlotDirective(startLoc);
        default:
          throw new Error(`Unknown directive: @${directive}`);
      }
    }
  
    private parseConditional(startLoc: Position): ConditionalNode {
      this.consume(TokenType.TAG_OPEN);
      const condition = this.parseExpression();
      this.consume(TokenType.TAG_CLOSE);
      
      const thenNodes: TemplateASTNode[] = [];
      while (!this.isAtEnd() && 
             !(this.currentToken.type === TokenType.DIRECTIVE && 
               (this.currentToken.value === 'else' || this.currentToken.value === 'endif'))) {
        const node = this.parseNode();
        if (node) thenNodes.push(node);
      }
      
      let elseNodes: TemplateASTNode[] | undefined;
      if (this.currentToken.type === TokenType.DIRECTIVE && this.currentToken.value === 'else') {
        this.advance(); // skip @else
        elseNodes = [];
        while (
          !this.isAtEnd() &&
          !((this.currentToken.type as string) === 'DIRECTIVE' && (this.currentToken.value as string) === 'endif')
        ) {
          const node = this.parseNode();
          if (node) elseNodes.push(node);
        }
      }
      
      if (this.currentToken.type === TokenType.DIRECTIVE && this.currentToken.value === 'endif') {
        this.advance(); // skip @endif
      }
      
      return {
        type: 'Conditional',
        condition,
        then: thenNodes,
        else: elseNodes,
        loc: { start: startLoc, end: this.currentToken.loc.end }
      };
    }
  
    private parseLoop(startLoc: Position): LoopNode {
      this.consume(TokenType.TAG_OPEN);
      const expressionToken = this.consume(TokenType.EXPRESSION_CONTENT);
      this.consume(TokenType.TAG_CLOSE);
      
      const body: TemplateASTNode[] = [];
      while (!this.isAtEnd() && 
             !(this.currentToken.type === TokenType.DIRECTIVE && this.currentToken.value === 'endfor')) {
        const node = this.parseNode();
        if (node) body.push(node);
      }
      
      if (this.currentToken.type === TokenType.DIRECTIVE && this.currentToken.value === 'endfor') {
        this.advance(); // skip @endfor
      }
      
      // Parse loop parameters (item in items)
      const [itemPart, iterablePart] = expressionToken.value.split(' in ').map(s => s.trim());
      const [item, index] = itemPart.split(',').map(s => s.trim());
      
      return {
        type: 'Loop',
        iterable: {
          type: 'Expression',
          expression: iterablePart,
          dependencies: this.extractDependencies(iterablePart),
          loc: expressionToken.loc
        },
        item: item || 'item',
        index: index,
        body,
        loc: { start: startLoc, end: this.currentToken.loc.end }
      };
    }
  
    private parseSlotDirective(startLoc: Position): SlotNode {
      this.consume(TokenType.TAG_OPEN);
      const nameToken = this.consume(TokenType.ATTR_NAME);
      const props: Record<string, ExpressionNode> = {};
      
      // Parse slot props
      while (this.currentToken.type === TokenType.ATTR_NAME) {
        const propName = this.currentToken.value;
        this.advance();
        
        if ((this.currentToken.type as string) === 'EQUALS') {
          this.advance();
          props[propName] = this.parseExpression();
        }
      }
      
      this.consume(TokenType.TAG_CLOSE);
      
      return {
        type: 'Slot',
        name: nameToken.value,
        props,
        children: [],
        loc: { start: startLoc, end: this.currentToken.loc.end }
      };
    }
  
    private extractSlotProps(attributes: AttributeNode[]): Record<string, ExpressionNode> {
      const props: Record<string, ExpressionNode> = {};
      
      for (const attr of attributes) {
        if (attr.name.startsWith(':') && attr.value?.type === 'Expression') {
          const propName = attr.name.slice(1);
          props[propName] = attr.value;
        }
      }
      
      return props;
    }
  
    private extractSlots(children: TemplateASTNode[]): Record<string, TemplateASTNode[]> {
      const slots: Record<string, TemplateASTNode[]> = {};
      
      for (const child of children) {
        if (child.type === 'Slot') {
          const name = (child as SlotNode).name || 'default';
          slots[name] = (child.children || []) as TemplateASTNode[];
        }
      }
      
      return slots;
    }
  
    private extractDependencies(expression: string): string[] {
      const identifiers = new Set<string>();
      const regex = /[a-zA-Z_$][a-zA-Z0-9_$]*/g;
      let match;
      
      while ((match = regex.exec(expression)) !== null) {
        identifiers.add(match[0]);
      }
      
      return Array.from(identifiers);
    }
  
    private consume(expectedType: TokenType): Token {
      if (this.currentToken.type !== expectedType) {
        throw new Error(`Expected ${expectedType}, got ${this.currentToken.type}`);
      }
      
      const token = this.currentToken;
      this.advance();
      return token;
    }
  
    private advance(): void {
      if (this.currentIndex < this.tokens.length - 1) {
        this.currentIndex++;
        this.currentToken = this.tokens[this.currentIndex];
      }
    }
  
    private peek(): Token | null {
      if (this.currentIndex < this.tokens.length - 1) {
        return this.tokens[this.currentIndex + 1];
      }
      return null;
    }
  
    private isAtEnd(): boolean {
      return this.currentToken.type === TokenType.EOF;
    }
  }
  
  // ==================== AST VISITOR ====================
  export abstract class ASTVisitor {
    visit(node: TemplateASTNode): void {
      switch (node.type) {
        case 'Element':
          this.visitElement(node);
          break;
        case 'Component':
          this.visitComponent(node);
          break;
        case 'Text':
          this.visitText();
          break;
        case 'Expression':
          this.visitExpression();
          break;
        case 'Slot':
          this.visitSlot(node);
          break;
        case 'Conditional':
          this.visitConditional(node);
          break;
        case 'Loop':
          this.visitLoop(node);
          break;
      }
    }
  
    protected visitElement(node: ElementNode): void {
      node.attributes.forEach(attr => this.visitAttribute(attr));
      (node.children as TemplateASTNode[]).forEach(child => this.visit(child));
    }
  
    protected visitComponent(node: ComponentNode): void {
      node.props.forEach(prop => this.visitAttribute(prop));
      Object.values(node.slots).forEach(slot => slot.forEach(child => this.visit(child as TemplateASTNode)));
      (node.children as TemplateASTNode[]).forEach(child => this.visit(child));
    }
  
    protected visitText(): void {
      // Text node processing
    }
  
    protected visitExpression(): void {
      // Expression processing
    }
  
    protected visitSlot(node: SlotNode): void {
      Object.values(node.props).forEach(prop => this.visit(prop));
      (node.children as TemplateASTNode[]).forEach(child => this.visit(child));
    }
  
    protected visitConditional(node: ConditionalNode): void {
      this.visit(node.condition);
      (node.then as TemplateASTNode[]).forEach(child => this.visit(child));
      (node.else as TemplateASTNode[])?.forEach(child => this.visit(child));
    }
  
    protected visitLoop(node: LoopNode): void {
      this.visit(node.iterable);
      (node.body as TemplateASTNode[]).forEach(child => this.visit(child));
    }
  
    protected visitAttribute(attr: AttributeNode): void {
      if (attr.value) {
        this.visit(attr.value);
      }
    }
  }
  
  // ==================== UTILITY FUNCTIONS ====================
  export function parseTemplate(source: string): TemplateASTNode[] {
    const parser = new TemplateParser(source);
    return parser.parse();
  }
  
  export function createPositionTracker(source: string) {
    let line = 1;
    let column = 1;
    const positions: Position[] = [];
    
    for (let i = 0; i <= source.length; i++) {
      positions.push({ line, column });
      if (source[i] === '\n') {
        line++;
        column = 1;
      } else {
        column++;
      }
    }
    
    return (offset: number): Position => {
      return positions[Math.min(offset, positions.length - 1)];
    };
  }

// ==================== CODEGEN ====================
export function emitTemplateASTToJS(ast: TemplateASTNode[]): string {
  function emitNode(node: TemplateASTNode): string {
    switch (node.type) {
      case 'Element':
      case 'Component': {
        // Validate tag
        const tag = getTagFromNode(node);
        if (!tag || tag.trim() === '') {
          throw new Error(`JSX element with missing/empty tag at line ${node.loc.start.line}, column ${node.loc.start.column}`);
        }
        // Build props object
        const props = emitProps(getAttributesFromNode(node));
        // Build children array
        const children = ((node.children || []) as TemplateASTNode[]).map(emitNode);
        return `createElement(${JSON.stringify(tag)}, ${props}, ${children.join(', ')})`;
      }
      case 'Text':
        return JSON.stringify(getValueFromTextNode(node));
      case 'Expression':
        return getExpressionFromNode(node);
      // Add cases for Fragment, Slot, etc. as needed
      default:
        return '';
    }
  }

  function getTagFromNode(node: TemplateASTNode): string {
    if (node.type === 'Element') return node.tag;
    if (node.type === 'Component') return node.name;
    return '';
  }

  function getAttributesFromNode(node: TemplateASTNode): AttributeNode[] {
    if (node.type === 'Element') return node.attributes;
    if (node.type === 'Component') return node.props;
    return [];
  }

  function getValueFromTextNode(node: TemplateASTNode): string {
    if (node.type === 'Text') return node.value;
    return '';
  }

  function getExpressionFromNode(node: TemplateASTNode): string {
    if (node.type === 'Expression') return node.expression;
    return '';
  }

  function emitProps(attributes: unknown[]): string {
    if (!attributes || !attributes.length) return 'null';
    const props: Record<string, string> = {};
    for (const attr of attributes) {
      if (isAttributeNode(attr)) {
        props[attr.name] = attr.value?.type === 'Expression'
          ? `{${attr.value.expression}}`
          : JSON.stringify(attr.value?.value ?? true);
      }
      // Handle directives, events, etc.
    }
    // Convert props object to JS code
    return JSON.stringify(props).replace(/"({.*?})"/g, '$1');
  }

  function isAttributeNode(attr: unknown): attr is AttributeNode {
    return typeof attr === 'object' && attr !== null && (attr as AttributeNode).type === 'Attribute';
  }

  return ast.map(emitNode).join('\n');
}
