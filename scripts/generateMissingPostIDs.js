import { join } from "path";
import { writeFileSync } from "fs"
import { generatePostID, getArticles, projects } from "./utils.js";

main()

async function main() {
  projects.forEach(async project => {
    const articles = await getArticles(project)

    articles.forEach(article => {
      if (article.id && article.id?.length === 12) return

      const content = {
        "$schema": "https://gist.githubusercontent.com/richaardev/a5fec5b851f33166757e3827b03ddded/raw/e942bbdf03b0128c0b6b189e299843cc57734588/schema.json",
        id: article.id ?? generatePostID(),
        updated_at: article?.updated_at,
        metadata: article?.metadata,
      }
      // console.log(content, article)

      writeFileSync(join(project, article.path, "metadata.json"), JSON.stringify(content, undefined, "  "))
    })
  })
}
