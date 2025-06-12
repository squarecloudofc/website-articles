import {
  generatePostID,
  generateSlug,
  getArticles,
  getFolderFirstUpdate,
  getFolderLastestUpdate,
  projects,
} from "./utils/index.js";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

(async function main() {
  for (const project of projects) {
    const articles = await getArticles(project);

    for (const article of articles) {
      const content = generateMetadata(project, article)
      if (content) {
        const metadataPath = join(project, article.$info.path, "metadata.json");
        writeFileSync(metadataPath, JSON.stringify(content, null, 2));
      }
    }
  }
})();

function generateMetadata(project, article) {
  switch (project) {
    case "docs":
      return generateDocsMetadata(article);
    case "guides":
      return generateGuidesMetadata(article)
    default: return null
  }
}

function generateGuidesMetadata(article) {
  const createdAt = getFolderFirstUpdate(join("guides", article.$info.path))
  const updatedAt = getFolderLastestUpdate(join("guides", article.$info.path))

  const articleId =
    !article.id || article.id.length !== 12 ? generatePostID() : article.id;

  const metadata = Object.entries(article?.metadata ?? {}).reduce((acc, [lang, content]) => {
    const slug = content.title ? generateSlug(content.title) : "";
    acc[lang] = { ...content, slug };
    return acc;
  }, {})

  return {
    $schema: "https://cdn.squarecloud.app/articles/schema.json",
    id: articleId,
    author: { name: article.author?.name ?? "Square Cloud" },
    metadata: metadata,
    attributes: article.attributes,
    created_at: createdAt ?? article.created_at ?? new Date(),
    updated_at: updatedAt ?? article.updated_at ?? new Date(),
  };
}

function generateDocsMetadata(article) {
  const createdAt = getFolderFirstUpdate(join("docs", article.$info.path))
  const updatedAt = getFolderLastestUpdate(join("docs", article.$info.path))

  console.log(createdAt, article.created_at, new Date())
  console.log(createdAt ?? article.created_at ?? new Date())
  return {
    $schema: "https://cdn.squarecloud.app/articles/schema.json",
    type: "docs",
    metadata: article.metadata,
    created_at: createdAt ?? article.created_at ?? new Date(),
    updated_at: updatedAt ?? article.updated_at ?? new Date(),
  };
}
