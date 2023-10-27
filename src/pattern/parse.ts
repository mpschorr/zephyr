/* eslint-disable @typescript-eslint/no-unused-vars */
type PatternElementNodeType = 'LITERAL' | 'OPTIONAL' | 'TYPE' | 'CHOICE';

interface PatternElementNode {
  type: PatternElementNodeType;
  value: string | PatternElementNode[] | PatternElementNode[][];
}

interface LiteralPatternElementNode extends PatternElementNode {
  type: 'LITERAL';
  value: string;
}

interface OptionalPatternElementNode extends PatternElementNode {
  type: 'OPTIONAL';
  value: PatternElementNode[];
}

interface TypePatternElementNode extends PatternElementNode {
  type: 'TYPE';
  value: string;
}

interface ChoicePatternElementNode extends PatternElementNode {
  type: 'CHOICE';
  value: PatternElementNode[][];
}

interface BracketTypes {
  [key: string]: { end: string; type: PatternElementNodeType };
}
const bracketTypes: BracketTypes = {
  '[': { end: ']', type: 'OPTIONAL' },
  '%': { end: '%', type: 'TYPE' },
  '(': { end: ')', type: 'CHOICE' },
};

export function parsePatternElement(patternStr: string): PatternElementNode[] {
  const nodes: PatternElementNode[] = [];
  let literalBuffer: string[] = [];

  for (let i = 0; i < patternStr.length; i++) {
    const char = patternStr[i];

    const bracketType = bracketTypes[char];
    // If the char is an opening bracket
    if (bracketType) {
      // If the literal buffer has data, push a new literal element
      if (literalBuffer.length != 0) {
        nodes.push({ type: 'LITERAL', value: literalBuffer.join('') });
        literalBuffer = [];
      }

      // Get the index of the next bracket
      let nextBracketIndex: number;
      if (bracketType.end != char) {
        nextBracketIndex = getMatchingBracket(patternStr, i, char, bracketType.end);
      } else {
        nextBracketIndex = patternStr.indexOf(bracketType.end, i + 1);
      }

      // Push the data of the sub-pattern inside the brackets
      const nestedPattern = patternStr.substring(i + 1, nextBracketIndex);
      if (bracketType.type == 'TYPE') {
        const nestedLiteral = nestedPattern;
        nodes.push({ type: bracketType.type, value: nestedLiteral });
      } else if (bracketType.type == 'CHOICE') {
        const choices: PatternElementNode[][] = [];
        const split = nestedPattern.split('|');
        // Add a choice for each subpattern
        for (let j = 0; j < split.length; j++) {
          const nestedElement = parsePatternElement(split[j]);
          choices.push([...nestedElement]);
        }
        nodes.push({ type: bracketType.type, value: choices });
      } else {
        const nestedElement = parsePatternElement(nestedPattern);
        nodes.push({ type: bracketType.type, value: nestedElement });
      }

      // Skip to end bracket
      i = nextBracketIndex;
    } else {
      literalBuffer.push(char);
    }
  }

  if (literalBuffer.length != 0) {
    nodes.push({ type: 'LITERAL', value: literalBuffer.join('') });
  }

  return nodes;
}

// startIndex should be the index of the start bracket (ex. 'abc [' =)
function getMatchingBracket(str: string, startIndex: number, startBracket: string, endBracket: string): number {
  let depth = 0;
  for (let i = startIndex; i < str.length; i++) {
    if (str[i] == startBracket) {
      depth++;
    } else if (str[i] == endBracket) {
      depth--;
    }
    if (depth == 0) {
      return i;
    }
  }
  return -1;
}
