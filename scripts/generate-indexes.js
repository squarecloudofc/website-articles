import { getArticles, getArticlesIndex, getSnippets, getSnippetsIndex, locales, projects } from "./utils/index.js";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { getSidebarIndexes, getSidebars } from "./utils/sidebar.js";

(async function main() {
  for (const project of projects) {
    const articles = await getArticles(project);
    const articlesIndexes = await getArticlesIndex(project, articles);

    const snippets = await getSnippets(project);
    const snippetsIndexes = await getSnippetsIndex(project, snippets);

    const indexesPath = resolve(project, ".index");
    mkdirSync(indexesPath, { recursive: true });

    const sidebars = project === "docs" ? await getSidebars(project) : null;
    const sidebarIndexes = project === "docs" ? await getSidebarIndexes(project, sidebars) : null;

    for (const locale of locales) {
      const content = {
        articles: articlesIndexes[locale],
        snippets: snippetsIndexes[locale],
      };

      if (project === "docs" && sidebars && sidebarIndexes) {
        content.sidebars = sidebarIndexes[locale];
      }

      writeFileSync(join(indexesPath, `${locale}.index.json`), JSON.stringify(content, null, 2));
    }
  }
})();
