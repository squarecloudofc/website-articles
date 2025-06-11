import { join } from "path";
import { writeFileSync } from "fs";
import { generatePostID, generateSlug, getArticles, getFolderFirstUpdate, getFolderLastestUpdate, projects } from "./utils/index.js";

(async function main() {
  for (const project of projects) {
    const articles = await getArticles(project);

    for (const article of articles) {
      const createdAt = getFolderFirstUpdate(join(project, article.path))
      const updatedAt = getFolderLastestUpdate(join(project, article.path))

      const articleId =
        !article.id || article.id.length !== 12 ? generatePostID() : article.id;

      const metadata = Object.entries(article.metadata).reduce((acc, [lang, content]) => {
        const slug = content.title ? generateSlug(content.title) : "";
        acc[lang] = { ...content, slug };
        return acc;
      }, {})

      const content = {
        $schema: "https://cdn.squarecloud.app/articles/schema.json",
        id: articleId,
        author: {
          name: article.author?.name ?? "Square Cloud"
        },
        metadata: metadata,
        attributes: article.attributes,
        created_at: createdAt ?? article.created_at,
        updated_at: updatedAt ?? article.updated_at,
      };

      const metadataPath = join(project, article.path, "metadata.json");
      writeFileSync(metadataPath, JSON.stringify(content, null, 2));
    }
  }
})();
