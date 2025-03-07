import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCharmManager } from "@/contexts/CharmManagerContext.tsx";
import { getRecipe } from "@commontools/runner";
import { createPath } from "@/routes.ts";

export default function SpellbookLaunchView() {
  const { spellId, replicaName } = useParams<{
    spellId: string;
    replicaName: string;
  }>();
  const navigate = useNavigate();
  const { charmManager, currentReplica } = useCharmManager();

  useEffect(() => {
    console.log("SpellbookLaunchView effect triggered", {
      spellId,
      replicaName,
      currentReplica,
      charmManager,
    });

    // If charm manager context is not initialized yet, we need to retry
    if (!charmManager) {
      console.log("CharmManager not available yet, waiting...");
      // Return to detail view if not loading after 2 seconds
      const timeout = setTimeout(() => {
        console.log(
          "CharmManager still not available after timeout, redirecting back"
        );
        if (spellId) {
          navigate(createPath("spellbookDetail", { spellId }));
        }
      }, 2000);

      return () => clearTimeout(timeout);
    }

    const launchSpell = async () => {
      console.log("launchSpell function called");
      if (!spellId) {
        console.log("No spellId provided, returning early");
        return;
      }

      try {
        console.log("Attempting to sync recipe for spellId:", spellId);
        // Sync the recipe
        await charmManager.syncRecipeBlobby(spellId);
        console.log("Recipe sync completed");

        const recipe = getRecipe(spellId);
        console.log("Retrieved recipe:", recipe);

        if (!recipe) {
          console.error("Recipe not found");
          navigate(createPath("spellbookDetail", { spellId }));
          return;
        }

        // Get AI suggestions for initial data
        console.log("Fetching AI suggestions");
        const imagineUrl = `/api/ai/spell/imagine`;
        const response = await fetch(imagineUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            accepts: "application/json",
          },
          body: JSON.stringify({
            schema: recipe.argumentSchema?.properties,
            prompt: "", // TODO(bf): we can pass something to make this more personal
            options: {
              many: false,
            },
          }),
        });

        const suggestionData = await response.json();
        console.log("Received AI suggestions:", suggestionData);

        // Run the spell with the suggested values
        console.log("Creating run with suggested values");
        const spell = await charmManager.runPersistent(
          recipe,
          suggestionData.values || {}
        );
        console.log("Spell run created:", spell);

        // Navigate to the charm show view
        if (
          spell &&
          spell.entityId &&
          spell.entityId["/"] &&
          typeof spell.entityId["/"] === "string"
        ) {
          const charmId = spell.entityId["/"] as string;
          navigate(
            createPath("charmShow", {
              charmId,
              replicaName: replicaName || currentReplica,
            })
          );
        } else {
          navigate(createPath("spellbookDetail", { spellId }));
        }
      } catch (error) {
        console.error("Error launching spell:", error);
        navigate(createPath("spellbookDetail", { spellId }));
      }
    };

    launchSpell();
  }, [spellId, replicaName, navigate, charmManager, currentReplica]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Launching Spell...</h1>
        <p className="text-gray-600">
          Please wait while we prepare your spell.
        </p>
      </div>
    </div>
  );
}
