import { parsePatternElement } from './pattern/parse';

const line = '(send|message) %strings% [to %senders%]';

const nodes = parsePatternElement(line);
nodes.forEach((node) => {
  console.dir(node, { depth: null });
});
