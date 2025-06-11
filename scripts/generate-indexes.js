import { getArticles, getArticlesIndex, getSnippets, getSnippetsIndex, locales, projects } from "./utils/index.js";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

(async function main() {
  for (const project of projects) {
    const articles = await getArticles(project);
    const articlesIndexes = await getArticlesIndex(project, articles);

    const snippets = await getSnippets(project);
    const snippetsIndexes = await getSnippetsIndex(project, snippets)

    const indexesPath = resolve(project, ".index");
    mkdirSync(indexesPath, { recursive: true });

    for (const locale of locales) {
      const content = {
        articles: articlesIndexes[locale],
        snippets: snippetsIndexes[locale],
      };

      writeFileSync(
        join(indexesPath, `${locale}.index.json`),
        JSON.stringify(content, null, 2)
      );
    }
  }
})();

