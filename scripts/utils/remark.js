import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import remarkMdx from "remark-mdx";
import { visit } from "unist-util-visit";
import fs from "fs/promises";
import path from "path";

export function remarkInlineSnippets(options) {
  const { rootDir } = options;
  return async (tree, file) => {
    const replacements = [];

    visit(tree,
      node => node.type === "mdxJsxFlowElement" && node.name === "Snippet",
      (node, index, parent) => {
        if (!parent || typeof index !== "number") return;
        const attrSrc = node.attributes.find(a => a.name === "src");
        if (attrSrc && typeof attrSrc.value === "string") {
          replacements.push({ parent, index, src: attrSrc.value });
        }
      }
    );

    for (const { parent, index, src } of replacements) {
      const snippetPath = path.join(rootDir, src, "pt-br.mdx");
      let snippetContent;
      try {
        snippetContent = await fs.readFile(snippetPath, "utf8");
      } catch (err) {
        console.log(err)
        file.message(`Não consegui ler o snippet em ${snippetPath}: ${err.message}`);
        continue;
      }

      const snippetAst = unified()
        .use(remarkParse)
        .use(remarkMdx)
        .parse(snippetContent);

      parent.children.splice(index, 1, ...snippetAst.children);
    }
  };
}

export async function parseMdxSnippets(project, content) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(remarkInlineSnippets, {
      rootDir: project
    })
    .use(remarkStringify, {
      bullet: "-",
    })
    .process(content);

  return file.toString();
}
