import { join } from "path";
import { writeFileSync } from "fs"
import { generatePostID, getArticles, projects } from "./utils.js";

main()

async function main() {
  projects.forEach(async project => {
    const articles = await getArticles(project)
    articles.forEach(article => {
      if (article.id || article.id.length !== 12) return

      const content = structuredClone(article)
      content["id"] = generatePostID()
      console.log(content)

      writeFileSync(join(article.path, "metadata.json"), JSON.stringify(content, undefined, "  "))
    })
  })
}
