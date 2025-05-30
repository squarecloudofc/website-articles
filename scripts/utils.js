import { globby } from "globby";
import { dirname, join } from "path"
import { readdirSync, readFileSync } from "fs"
import { customAlphabet } from "nanoid"

export const projects = ["guides", "docs", "blog"]
export const locales = ["en", "pt-br", "es", "zh"]

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

export async function getSnippets(cwd) {
  const paths = await globby(["_snippets/**/*.mdx"], { cwd })

  const snippets = []
  paths.forEach(snippet => {
    const path = join(cwd, dirname(snippet))
    if (snippets.some(s => s.path === path)) return

    const files = readdirSync(path)
    const availableLanguages = files.map(f => f.replace(".mdx", ""))

    snippets.push({
      path: path.split("/").slice(1).join("/"),
      availableLanguages
    })
  })


  return snippets
}

export function generatePostID() {
  return customAlphabet("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 12)()
}
