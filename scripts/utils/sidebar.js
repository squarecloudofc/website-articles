import { readdirSync, readFileSync } from "fs";
import { globby } from "globby";
import { dirname, join } from "path";
import { locales } from "./index.js";

export async function getSidebars(cwd) {
  const paths = await globby(["**/sidebar.*.json"], { cwd });

  const sidebars = [];
  paths.forEach((sidebar) => {
    const path = dirname(sidebar)
    if (sidebars.some((s) => s.path === path)) return;

    const files = readdirSync(join(cwd, path));
    const availableLocales = files.filter(f => f.endsWith(".json")).map((f) => f.split(".")[1]);

    sidebars.push({
      path: path,
      availableLocales,
    });
  });

  return sidebars;
}


export async function getSidebarIndexes(project, sidebars) {
  const indexes = Object.fromEntries(locales.map((locale) => [locale, {}]));

  const pickLocale = (target, available) => {
    if (available.includes(target))
      return target;


    return locales.find((loc) => available.includes(loc));
  };

  for (const sidebar of sidebars) {
    for (const locale of locales) {
      const contentLocale = pickLocale(locale, sidebar.availableLocales)
      if (!contentLocale) continue

      const content = JSON.parse(readFileSync(join(project, sidebar.path, `sidebar.${contentLocale}.json`)).toString());

      indexes[locale][sidebar.path === "." ? "root" : sidebar.path] = {
        content: content,
      };
    }
  }

  return indexes;
}

