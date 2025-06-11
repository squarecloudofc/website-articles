import { globby } from "globby";
import { dirname, join } from "path";
import { readdirSync, readFileSync } from "fs";
import { locales } from "./index.js";

export async function getSnippets(cwd) {
  const paths = await globby(["_snippets/**/*.mdx"], { cwd });

  const snippets = [];
  paths.forEach((snippet) => {
    const path = join(cwd, dirname(snippet));
    if (snippets.some((s) => s.path === path)) return;

    const files = readdirSync(path);
    const availableLocales = files.map((f) => f.replace(".mdx", ""));

    snippets.push({
      path: path.split(/[/\\]/).slice(1).join("/"),
      availableLocales,
    });
  });

  return snippets;
}

export async function getSnippetsIndex(project, snippets) {
  const indexes = Object.fromEntries(locales.map((locale) => [locale, {}]));

  for (const snippet of snippets) {
    for (const locale of snippet.availableLocales) {
      const content = readFileSync(join(project, snippet.path, `${locale}.mdx`));

      indexes[locale][snippet.path] = {
        path: snippet.path,
        content: content.toString(),
      };
    }
  }

  return indexes;
}
