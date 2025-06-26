import { readdirSync, readFileSync } from "node:fs";
import { parseMdxSnippets } from "./remark.js";
import { dirname, join } from "node:path";
import { locales } from "./index.js";
import { globby } from "globby";

export async function getArticles(cwd) {
  const paths = await globby(["**/metadata.json"], { cwd });
  const localesExt = locales.map((l) => l + ".mdx");

  const articles = [];
  paths.forEach((article) => {
    const path = join(cwd, dirname(article));
    const files = readdirSync(path);

    let metadata = {};
    try {
      metadata = JSON.parse(readFileSync(join(cwd, article)).toString());
      delete metadata["$schema"];
    } catch (_) {}

    Object.keys(metadata.metadata ?? {}).forEach((k) => {
      if (!locales.includes(k)) delete metadata.metadata[k];
    });

    const availableLocales = files.filter((v) => localesExt.includes(v));
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

  const pickLocale = (target, available) => {
    if (available.includes(target)) {
      return target;
    }
    return locales.find((loc) => available.includes(loc));
  };

  for (const article of articles) {
    const available = article.$info.availableLocales;
    const availableMetadata = Object.keys(article.metadata);

    for (const articleLocale of locales) {
      const contentLocale = pickLocale(articleLocale, available);
      if ((project === "guides" && contentLocale !== articleLocale) || !contentLocale) continue;

      if (!availableMetadata.includes(contentLocale)) continue;

      if ((project === "docs" && !article.$info.path) || (project === "guides" && !article.id)) continue;

      const rawContent = readFileSync(join(project, article.$info.path, `${contentLocale}.mdx`));
      const content = await parseMdxSnippets(project, contentLocale, rawContent);

      const metadataObj = article.metadata[contentLocale];

      if (project === "guides" && !metadataObj?.slug) continue;

      switch (project) {
        case "docs":
          indexes[articleLocale][article.$info.path] = {
            metadata: metadataObj,
            attributes: article.attributes,
            created_at: article.created_at,
            updated_at: article.updated_at,
            content: content.toString(),
          };
          break;
        case "guides":
          indexes[articleLocale][article.id] = {
            id: article.id,
            path: article.$info.path,
            author: article.author,
            attributes: article.attributes,
            metadata: metadataObj,
            created_at: article.created_at,
            updated_at: article.updated_at,
            content: content.toString(),
          };
          break;
      }
    }
  }

  return indexes;
}
