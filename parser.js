// Token types and operators configuration
const TokenType = {
    LPAREN: 'LPAREN',
    RPAREN: 'RPAREN',
    NOT: 'NOT',
    AND: 'AND',
    OR: 'OR',
    VAR: 'VAR',
    LITERAL: 'LITERAL'
};

const OPERATORS = {
    not: TokenType.NOT,
    and: TokenType.AND,
    or: TokenType.OR
};

// Tokenizer class to handle string tokenization
class Tokenizer {
    constructor(input) {
        this.input = input;
        this.tokens = [];
        this.pos = 0;
    }

    tokenize() {
        while (this.pos < this.input.length) {
            const char = this.input[this.pos];

            if (this.isWhitespace(char)) {
                this.pos++;
                continue;
            }

            if (this.isParenthesis(char)) {
                this.handleParenthesis(char);
                continue;
            }

            if (this.isAlpha(char)) {
                this.handleWord();
                continue;
            }

            throw new Error(`Invalid character '${char}' at position ${this.pos}`);
        }
        return this.tokens;
    }

    isWhitespace(char) {
        return /\s/.test(char);
    }

    isParenthesis(char) {
        return char === '(' || char === ')';
    }

    isAlpha(char) {
        return /[a-zA-Z]/.test(char);
    }

    isAlphanumeric(char) {
        return /[a-zA-Z0-9]/.test(char);
    }

    handleParenthesis(char) {
        this.tokens.push({
            type: char === '(' ? TokenType.LPAREN : TokenType.RPAREN,
            value: char
        });
        this.pos++;
    }

    handleWord() {
        let word = '';
        while (this.pos < this.input.length && this.isAlphanumeric(this.input[this.pos])) {
            word += this.input[this.pos];
            this.pos++;
        }

        if (word === 'true' || word === 'false') {
            this.tokens.push({
                type: TokenType.LITERAL,
                value: word === 'true'
            });
        } else if (word in OPERATORS) {
            this.tokens.push({
                type: OPERATORS[word],
                value: word
            });
        } else {
            this.tokens.push({
                type: TokenType.VAR,
                value: word
            });
        }
    }
}

// AST Node classes for better type safety and organization
class ASTNode {
    constructor(type) {
        this.type = type;
    }
}

class VariableNode extends ASTNode {
    constructor(name) {
        super(TokenType.VAR);
        this.name = name;
    }
}

class LiteralNode extends ASTNode {
    constructor(value) {
        super(TokenType.LITERAL);
        this.value = value;
    }
}

class UnaryNode extends ASTNode {
    constructor(type, expr) {
        super(type);
        this.expr = expr;
    }
}

class BinaryNode extends ASTNode {
    constructor(type, left, right) {
        super(type);
        this.left = left;
        this.right = right;
    }
}

// Parser class with improved error handling and organization
class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.pos = 0;
    }

    parse() {
        const expr = this.parseExpression();
        if (this.pos < this.tokens.length) {
            throw new Error(`Unexpected token: ${this.currentToken().type}`);
        }
        return expr;
    }

    currentToken() {
        return this.tokens[this.pos];
    }

    consume() {
        return this.tokens[this.pos++];
    }

    expect(type) {
        const token = this.currentToken();
        if (!token || token.type !== type) {
            throw new Error(`Expected ${type}, found ${token ? token.type : 'EOF'}`);
        }
        return this.consume();
    }

    parseExpression() {
        return this.parseOr();
    }

    parseOr() {
        let left = this.parseAnd();
        while (this.currentToken()?.type === TokenType.OR) {
            this.consume();
            left = new BinaryNode(TokenType.OR, left, this.parseAnd());
        }
        return left;
    }

    parseAnd() {
        let left = this.parseNot();
        while (this.currentToken()?.type === TokenType.AND) {
            this.consume();
            left = new BinaryNode(TokenType.AND, left, this.parseNot());
        }
        return left;
    }

    parseNot() {
        if (this.currentToken()?.type === TokenType.NOT) {
            this.consume();
            return new UnaryNode(TokenType.NOT, this.parseNot());
        }
        return this.parsePrimary();
    }

    parsePrimary() {
        const token = this.currentToken();
        if (!token) {
            throw new Error('Unexpected end of input');
        }

        switch (token.type) {
            case TokenType.VAR:
                this.consume();
                return new VariableNode(token.value);
            case TokenType.LITERAL:
                this.consume();
                return new LiteralNode(token.value);
            case TokenType.LPAREN:
                this.consume();
                const expr = this.parseExpression();
                this.expect(TokenType.RPAREN);
                return expr;
            default:
                throw new Error(`Unexpected token: ${token.type}`);
        }
    }
}

// Code generator class to handle JavaScript code generation
class CodeGenerator {
    static generate(node) {
        switch (node.type) {
            case TokenType.VAR:
                return node.name;
            case TokenType.LITERAL:
                return node.value.toString();
            case TokenType.NOT:
                return `!(${this.generate(node.expr)})`;
            case TokenType.AND:
                return `(${this.generate(node.left)} && ${this.generate(node.right)})`;
            case TokenType.OR:
                return `(${this.generate(node.left)} || ${this.generate(node.right)})`;
            default:
                throw new Error(`Unknown node type: ${node.type}`);
        }
    }

    static collectVariables(node) {
        const variables = new Set();
        function traverse(n) {
            if (n instanceof VariableNode) {
                variables.add(n.name);
            } else if (n instanceof UnaryNode) {
                traverse(n.expr);
            } else if (n instanceof BinaryNode) {
                traverse(n.left);
                traverse(n.right);
            }
        }
        traverse(node);
        return Array.from(variables);
    }
}

// Main function that ties everything together
function parseExpression(input) {
    try {
        const tokenizer = new Tokenizer(input);
        const tokens = tokenizer.tokenize();
        const parser = new Parser(tokens);
        const ast = parser.parse();
        const variables = CodeGenerator.collectVariables(ast);
        const code = CodeGenerator.generate(ast);
        return {
            variables,
            decisionFunction: new Function(...variables, `return ${code};`)
        };
    } catch (error) {
        throw new Error(`Failed to parse expression: ${error.message}`);
    }
}
