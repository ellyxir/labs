// Load .env file
import { parse } from "https://deno.land/std@0.224.0/flags/mod.ts";
import {
  CharmManager,
  compileRecipe,
  setBobbyServerUrl,
  storage,
} from "@commontools/charm";
import { getEntityId, isStream } from "@commontools/runner";

const { space, charmId, recipeFile, cause } = parse(Deno.args);

const toolshedUrl = Deno.env.get("TOOLSHED_API_URL") ??
  "https://toolshed.saga-castor.ts.net/";

storage.setRemoteStorage(new URL(toolshedUrl));
setBobbyServerUrl(toolshedUrl);

async function main() {
  const manager = new CharmManager(space ?? "common-cli");
  const charms = await manager.getCharms();

  charms.sink((charms) => {
    console.log(
      "charms:",
      charms.map((c) => c.toJSON().cell?.["/"]),
    );
  });

  if (charmId) {
    const charm = await manager.get(charmId);
    charm?.sink((value) => {
      console.log("charm:", charmId, value);
    });
  }

  if (recipeFile) {
    try {
      const recipeSrc = await Deno.readTextFile(recipeFile);
      const recipe = await compileRecipe(recipeSrc, "recipe", []);
      const charm = await manager.runPersistent(recipe, undefined, cause);
      await manager.syncRecipe(charm);
      manager.add([charm]);
      const charmWithSchema = (await manager.get(charm))!;
      charmWithSchema.sink((value) => {
        console.log("running charm:", getEntityId(charm), value);
      });
      const updater = charmWithSchema.get()?.updater;
      if (isStream(updater)) {
        console.log("running updater");
        updater.send({ newValues: ["test"] });
      }
    } catch (error) {
      console.error("Error loading and compiling recipe:", error);
    }
  }

  return new Promise(() => {
    // This promise never resolves, keeping the program alive
    console.log("Program running. Press Ctrl+C to exit.");
  });
}

main();
