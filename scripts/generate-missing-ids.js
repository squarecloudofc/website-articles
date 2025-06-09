import { join } from "path";
import { writeFileSync } from "fs";
import { generatePostID, getArticles, projects } from "./utils.js";

(async function main() {
  for (const project of projects) {
    const articles = await getArticles(project);

    for (const article of articles) {
      const articleId =
        !article.id || article.id.length !== 12 ? generatePostID() : article.id;

      const content = {
        $schema: "https://cdn.squarecloud.app/articles/schema.json",
        id: articleId,
        updated_at: article.updated_at,
        metadata: article.metadata,
      };

      const metadataPath = join(project, article.path, "metadata.json");
      writeFileSync(metadataPath, JSON.stringify(content, null, 2));
    }
  }
})();
