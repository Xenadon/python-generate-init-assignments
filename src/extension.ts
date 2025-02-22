import * as vscode from 'vscode';

interface PythonParameter {
    name: string;
    type?: string;
    defaultValue?: string;
    isVarArgs?: boolean;
    isKWArgs?: boolean;
}

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('generate.initAssignments', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor');
                return;
            }

            try {
                const startPos = findInitStart(editor.document, editor.selection.active);
                if (!startPos) {
                    vscode.window.showErrorMessage('No __init__ method found above cursor');
                    return;
                }

                const argsStr = extractArgsString(editor.document, startPos.line);
                const params = splitParameters(argsStr);
                const parsedParams = params.slice(1).map(parseParameter); // Skip self

                // 获取缩进层级
                const initIndent = editor.document.lineAt(startPos.line).text.match(/^\s*/)?.[0] || '';
                const assignmentIndent = initIndent + '    '; // 在方法体内增加一层缩进

                const assignments = generateAssignments(parsedParams, assignmentIndent);
                await insertAssignments(editor, startPos, assignments);
                
                vscode.window.showInformationMessage('Generated assignments successfully');
            } catch (error) {
                vscode.window.showErrorMessage(`Error generating assignments: ${error}`);
            }
        })
    );
}

function findInitStart(document: vscode.TextDocument, position: vscode.Position): vscode.Position | null {
    for (let line = position.line; line >= 0; line--) {
        const text = document.lineAt(line).text;

        // 检测是否匹配 "def __init__"
        if (/def\s+__init__\s*\(/.test(text)) {
            return new vscode.Position(line, text.indexOf('def'));
        }

        // 检测是否匹配 "def 标识符" 或 "class 标识符"
        if (/^\s*def\s+\w+\s*\(/.test(text) || /^\s*class\s+\w+/.test(text)) {
            vscode.window.showErrorMessage('Not inside an __init__ function');
            return null;
        }
    }
    return null;
}

function extractArgsString(document: vscode.TextDocument, startLine: number): string {
    let argsStr = '';
    let bracketDepth = 0; // 记录括号嵌套深度
    let inString: string | null = null; // 当前是否在字符串中，记录引号类型（单引号或双引号）

    for (let line = startLine; line < document.lineCount; line++) {
        const text = document.lineAt(line).text;
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (inString) {
                // 在字符串状态下，只有匹配到同种引号才会退出字符串状态
                argsStr += char;
                if (char === inString) {
                    inString = null; // 匹配到同种引号，退出字符串状态
                }
            } else {
                // 非字符串状态下，处理括号、引号和注释
                switch (char) {
                    case '(':
                        if (bracketDepth === 0) {
                            bracketDepth++;
                        } else {
                            argsStr += char;
                        }
                        break;
                    case ')':
                        if (bracketDepth === 1) {
                            return argsStr; // 返回完整的参数列表字符串
                        } else {
                            argsStr += char;
                        }
                        break;
                    case '"':
                    case "'":
                        inString = char; // 进入字符串状态，记录引号类型
                        argsStr += char;
                        break;
                    case '#':
                        // 在非字符串状态下检测到#，直接跳转到下一行
                        i = text.length; // 跳过当前行的剩余部分
                        break;
                    default:
                        argsStr += char;
                }
            }
        }
    }
    throw new Error('Unclosed parentheses or string in __init__ definition');
}

function splitParameters(argsStr: string): string[] {
    const params: string[] = [];
    let currentParam = '';
    let bracketDepth = 0;
    let inString: string | null = null;

    for (const char of argsStr) {
        if (inString) {
            currentParam += char;
            if (char === inString) inString = null;
        } else {
            switch (char) {
                case '(': case '[': case '{': bracketDepth++; break;
                case ')': case ']': case '}': bracketDepth--; break;
                case '"': case "'": inString = char; break;
                case ',': 
                    if (bracketDepth === 0) {
                        params.push(currentParam.trim());
                        currentParam = '';
                        continue;
                    }
            }
            currentParam += char;
        }
    }
    if (currentParam.trim()) params.push(currentParam.trim());
    return params;
}

function parseParameter(param: string): PythonParameter {
    param = param.trim();
    const result: PythonParameter = { name: '' };

    if (param.startsWith('**')) {
        result.isKWArgs = true;
        result.name = param.slice(2).trim();
    } else if (param.startsWith('*')) {
        result.isVarArgs = true;
        result.name = param.slice(1).trim();
    } else {
        const defaultSplit = splitOutsideBrackets(param, '=');
        if (defaultSplit.length > 1) {
            result.defaultValue = defaultSplit[1].trim();
            param = defaultSplit[0].trim();
        }

        const typeSplit = splitOutsideBrackets(param, ':');
        if (typeSplit.length > 1) {
            result.name = typeSplit[0].trim();
            result.type = typeSplit[1].trim();
        } else {
            result.name = param.trim();
        }
    }

    return result;
}

function splitOutsideBrackets(str: string, separator: string): string[] {
    let bracketDepth = 0;
    let inString: string | null = null;
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (inString) {
            if (char === inString) inString = null;
        } else {
            switch (char) {
                case '(': case '[': case '{': bracketDepth++; break;
                case ')': case ']': case '}': bracketDepth--; break;
                case '"': case "'": inString = char; break;
                case separator: 
                    if (bracketDepth === 0) {
                        return [str.slice(0, i), str.slice(i + 1)];
                    }
            }
        }
    }
    return [str];
}

function generateAssignments(params: PythonParameter[], indent: string): string {
    return params
        .filter(p => !p.isVarArgs && !p.isKWArgs)
        .map(p => `${indent}self.${p.name} = ${p.name}`) // 每行都加上缩进
        .join('\n'); // 用换行符分隔
}

async function insertAssignments(editor: vscode.TextEditor, startPos: vscode.Position, code: string) {
    const document = editor.document;
    const initLine = document.lineAt(startPos.line);
    const bodyStart = findBodyStart(document, startPos.line);

    await editor.edit(editBuilder => {
        if (bodyStart) {
            // 在方法体开始处插入赋值语句
            editBuilder.insert(bodyStart, `${code}\n`);
        } else {
            // 如果没有找到方法体，则在__init__下方插入赋值语句
            editBuilder.insert(startPos.translate(1, 0), `${code}\n`);
        }
    });
}

function findBodyStart(document: vscode.TextDocument, startLine: number): vscode.Position | null {
    for (let line = startLine; line < document.lineCount; line++) {
        const text = document.lineAt(line).text;
        if (text.includes('):')) {
            // 返回方法体第一行的起始位置
            return new vscode.Position(line + 1, 0);
        }
    }
    return null;
}