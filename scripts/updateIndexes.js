import { mkdirSync, readFileSync, writeFileSync } from "fs"

import { unified } from "unified";

import remarkParse from 'remark-parse'
import strip from 'strip-markdown';
import remarkStringify from 'remark-stringify';
import { join, resolve } from "path";
import { getArticles, getSnippets, locales, projects } from "./utils.js";

main()

async function main() {
  projects.forEach(async (project) => {
    const articles = await getArticles((project))
    const articlesIndexes = await getIndexes(articles)

    const snippets = await getSnippets((project))

    const indexesPath = resolve(project, ".index")
    mkdirSync(indexesPath, { recursive: true })

    locales.forEach(v => {
      const content = {
        articles: articlesIndexes[v],
        snippets: snippets,
      }

      writeFileSync(join(indexesPath, `${v}.index.json`), JSON.stringify(content, undefined, "  "))
    })
  })
}

async function getIndexes(articles) {
  const indexes = {}
  locales.forEach(l => indexes[l] = {})

  for (const article of articles) {
    for (const l of article.availableLocales) {
      const index = await convertMarkdownToPlain(join(article.path, `${l}.mdx`))

      const metadata = {
        ...(article.metadata?.[l] ?? {}),
      }

      Object.keys(article?.metadata ?? {}).filter(k => !locales.includes(k)).forEach(k => metadata[k] = article.metadata[k])


      indexes[l][article.id] = {
        id: article.id,
        path: article.path.split("/").slice(1).join("/"),
        metadata,
        updated_at: article.updated_at,
        content: index.replaceAll("\n", " ")
      }
    }
  }

  return indexes
}

async function convertMarkdownToPlain(filePath) {
  const file = await unified()
    .use(remarkParse)
    .use(strip)
    .use(remarkStringify)
    .process(readFileSync(filePath))

  return file.value
}

