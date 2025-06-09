import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import strip from "strip-markdown";
import remarkStringify from "remark-stringify";
import { getArticles, getSnippets, locales, projects } from "./utils.js";

(async function main() {
  for (const project of projects) {
    const articles = await getArticles(project);
    const articlesIndexes = await getIndexes(project, articles);
    const snippets = await getSnippets(project);

    const indexesPath = resolve(project, ".index");
    mkdirSync(indexesPath, { recursive: true });

    for (const locale of locales) {
      const content = {
        articles: articlesIndexes[locale],
        snippets,
      };

      writeFileSync(
        join(indexesPath, `${locale}.index.json`),
        JSON.stringify(content, null, 2)
      );
    }
  }
})();

async function getIndexes(project, articles) {
  const indexes = Object.fromEntries(locales.map(locale => [locale, {}]));

  for (const article of articles) {
    if (!article.id) continue;

    for (const locale of article.availableLocales) {
      const plainContent = await convertMarkdownToPlain(
        join(project, article.path, `${locale}.mdx`)
      );

      const metadata = {
        ...(article.metadata?.[locale] ?? {}),
        ...Object.fromEntries(
          Object.entries(article.metadata ?? {}).filter(
            ([key]) => !locales.includes(key)
          )
        ),
      };

      indexes[locale][article.id] = {
        id: article.id,
        path: article.path,
        metadata,
        updated_at: article.updated_at,
        content: String(plainContent).replace(/\n/g, " "),
      };
    }
  }

  return indexes;
}

async function convertMarkdownToPlain(filePath) {
  const file = await unified()
    .use(remarkParse)
    .use(strip)
    .use(remarkStringify)
    .process(readFileSync(filePath));

  return file.value;
}
