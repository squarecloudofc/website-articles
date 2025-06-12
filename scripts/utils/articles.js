import { readdirSync, readFileSync } from "node:fs";
import { parseMdxSnippets } from "./remark.js";
import { dirname, join } from "node:path";
import { locales } from "./index.js";
import { globby } from "globby";

export async function getArticles(cwd) {
  const paths = await globby(["**/metadata.json"], { cwd })
  const localesExt = locales.map(l => l + ".mdx")

  const articles = [];
  paths.forEach((article) => {
    const path = join(cwd, dirname(article));
    const files = readdirSync(path);

    let metadata = {};
    try {
      metadata = JSON.parse(readFileSync(join(cwd, article)));
      delete metadata["$schema"];
    } catch (_) { }

    Object.keys(metadata.metadata ?? {}).forEach((k) => {
      if (!locales.includes(k)) delete metadata.metadata[k]
    })

    // if (cwd === "docs") console.log(metadata, article)
    const availableLocales = files.filter(v => localesExt.includes(v))
    articles.push({
      ...metadata,
      $info: {
        path: path.split(/[/\\]/).slice(1).join("/"),
        availableLocales: availableLocales.map((l) => l.slice(0, -4)),
      },
    });
  });

  return articles;
}

export async function getArticlesIndex(project, articles) {
  const indexes = Object.fromEntries(locales.map((locale) => [locale, {}]));

  // console.log(project, articles)
  for (const article of articles) {
    for (const locale of article.$info.availableLocales) {
      const rawContent = readFileSync(join(project, article.$info.path, `${locale}.mdx`));
      const content = await parseMdxSnippets(project, rawContent);

      switch (project) {
        case "docs":
          if (!article.$info.path) continue

          indexes[locale][article.$info.path] = {
            metadata: article.metadata[locale],
            created_at: article.created_at,
            updated_at: article.updated_at,
            content: content.toString(),
          };
          break
        case "guides":
          if (!article.id) continue

          indexes[locale][article.id] = {
            id: article.id,
            path: article.$info.path,
            author: article.author,
            attributes: article.attributes,
            metadata: article.metadata[locale],
            created_at: article.created_at,
            updated_at: article.updated_at,
            content: content.toString(),
          };
          break
      }
    }
  }

  if (project === "docs") console.log(articles)

  return indexes;
}
