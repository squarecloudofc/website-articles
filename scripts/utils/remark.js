import remarkStringify from "remark-stringify";
import { readFile } from "node:fs/promises";
import { visit } from "unist-util-visit";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import { unified } from "unified";
import { join } from "node:path";

export function remarkInlineSnippets(options) {
  const { rootDir, lang } = options;
  return async (tree, file) => {
    const replacements = [];

    visit(
      tree,
      (node) => node.type === "mdxJsxFlowElement" && node.name === "Snippet",
      (node, index, parent) => {
        if (!parent || typeof index !== "number") return;
        const attrSrc = node.attributes.find((a) => a.name === "src" || a.name === "file");
        if (attrSrc && typeof attrSrc.value === "string") {
          replacements.push({ parent, index, src: attrSrc.value.replace(".mdx", "") });
        }
      }
    );

    for (const { parent, index, src } of replacements) {
      const snippetPath = join(rootDir, src, `${lang}.mdx`);
      let snippetContent;
      try {
        snippetContent = await readFile(snippetPath, "utf8");
      } catch (err) {
        file.message(`Não consegui ler o snippet em ${snippetPath}: ${err.message}`);
        continue;
      }

      const snippetAst = unified().use(remarkParse).use(remarkMdx).parse(snippetContent);

      parent.children.splice(index, 1, ...snippetAst.children);
    }
  };
}

export async function parseMdxSnippets(project, lang, content) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(remarkInlineSnippets, {
      rootDir: join(project, "_snippets"),
      lang,
    })
    .use(remarkStringify, {
      bullet: "-",
    })
    .process(content);

  return file.toString();
}
