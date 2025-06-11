import { customAlphabet } from "nanoid"
import { execSync } from "node:child_process"

export const projects = ["guides", "docs", "blog"]
export const locales = ["en", "pt-br", "es", "zh"]

export * from "./articles.js"
export * from "./snippets.js"

export function generatePostID() {
  return customAlphabet("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 12)()
}
export function generateSlug(title) {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\u4e00-\u9fff\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export function getFolderMdxs(folder) {
  return execSync(`git ls-files ${folder} ":!${folder}/metadata.json"`, { encoding: "utf8" })
    .split("\n")
    .filter(Boolean)
    .map(f => `"${f}"`)
    .join(" ");
}

export function getFolderLastestUpdate(folder) {
  try {
    const files = getFolderMdxs(folder)
    if (!files)
      throw new Error("Nenhum arquivo encontrado.");

    const date = execSync(`git log -1 --format=%aI -- ${files}`, { encoding: "utf8" }).trim();
    return new Date(date);
  } catch (error) {
    return null;
  }
}


export function getFolderFirstUpdate(folder) {
  try {
    const files = getFolderMdxs(folder)
    if (!files)
      throw new Error("Nenhum arquivo encontrado.");

    const date = execSync(`git log --reverse --format=%aI -- ${files} | head -n 1`, { encoding: "utf8" }).trim();
    return new Date(date);
  } catch (error) {
    return null;
  }
}
