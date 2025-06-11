import { globby } from "globby";
import { dirname, join } from "path"
import { readdirSync, readFileSync } from "fs"
import { unified } from "unified";
import remarkParse from "remark-parse";
import strip from "strip-markdown";
import remarkStringify from "remark-stringify";
import { locales } from "./index.js";

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
      path: path.split("/").slice(1).join("/"),
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
      const content = readFileSync(join(project, article.path, `${locale}.mdx`))
      const plainContent = await convertMarkdownToPlain(content);

      indexes[locale][article.id] = {
        id: article.id,
        path: article.path,
        author: article.author,
        attributes: article.attributes,
        metadata: article.metadata,
        created_at: article.created_at,
        updated_at: article.updated_at,
        content: content.toString(),
        search_content: String(plainContent).replace(/\n/g, " "),
      };
    }
  }

  return indexes;
}

async function convertMarkdownToPlain(content) {
  const file = await unified()
    .use(remarkParse)
    .use(strip)
    .use(remarkStringify)
    .process(content);

  return file.value;
}
