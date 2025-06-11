import { globby } from "globby";
import { dirname, join } from "path"
import { readdirSync, readFileSync } from "fs"
import { locales } from "./index.js";
import { parseMdxSnippets } from "./remark.js";

export async function getArticles(cwd) {
  const paths = await globby(["**/*.json"], { cwd })
  const localesExt = locales.map(l => l + ".mdx")

  const articles = []
  paths.forEach(article => {
    const path = join(cwd, dirname(article))
    const files = readdirSync(path)

    let metadata = {};
    try {

      metadata = JSON.parse(readFileSync(join(cwd, article)))
      delete metadata["$schema"]
    } catch (_) { }

    const availableLocales = files.filter(v => localesExt.includes(v))
    articles.push({
      ...metadata,
      path: path.split(/[/\\]/).slice(1).join("/"),
      availableLocales: availableLocales.map(l => l.slice(0, -4)),
    })
  })

  return articles
}

export async function getArticlesIndex(project, articles) {
  const indexes = Object.fromEntries(locales.map(locale => [locale, {}]));

  for (const article of articles) {
    if (!article.id) continue;

    for (const locale of article.availableLocales) {
      const rawContent = readFileSync(join(project, article.path, `${locale}.mdx`))
      const content = await parseMdxSnippets(project, rawContent)

      indexes[locale][article.id] = {
        id: article.id,
        path: article.path,
        author: article.author,
        attributes: article.attributes,
        metadata: article.metadata[locale],
        created_at: article.created_at,
        updated_at: article.updated_at,
        content: content.toString(),
      };
    }
  }

  return indexes;
}