const {
  DEFAULT_POTION_GAME_CONFIG,
  DEFAULT_POTION_INGREDIENTS,
} = require("./config");

function buildPotionComboCatalog(
  ingredients = DEFAULT_POTION_INGREDIENTS,
  config = DEFAULT_POTION_GAME_CONFIG,
) {
  validateIngredients(ingredients, config.ingredientCount);

  const singles = createComboEntries(createIngredientCombinations(ingredients, 1), "single");
  const pairs = createComboEntries(createIngredientCombinations(ingredients, 2), "pair");
  const triples = createComboEntries(createIngredientCombinations(ingredients, 3), "triple");

  assertComboCount(singles, config.comboCountBySize.single, "single");
  assertComboCount(pairs, config.comboCountBySize.pair, "pair");
  assertComboCount(triples, config.comboCountBySize.triple, "triple");

  const catalog = [...singles, ...pairs, ...triples];
  if (catalog.length !== config.comboCountTotal) {
    throw new Error(
      `Generated combo count (${catalog.length}) does not match config.comboCountTotal (${config.comboCountTotal}).`,
    );
  }

  return Object.freeze(catalog);
}

function validateIngredients(ingredients, ingredientCount) {
  if (!Array.isArray(ingredients) || ingredients.length !== ingredientCount) {
    throw new Error(
      `Expected ${ingredientCount} ingredients, received ${Array.isArray(ingredients) ? ingredients.length : "invalid input"}.`,
    );
  }

  const ids = new Set();
  for (const ingredient of ingredients) {
    if (!ingredient || typeof ingredient.id !== "string" || ingredient.id.length === 0) {
      throw new Error("Each ingredient must have a non-empty string id.");
    }

    if (ids.has(ingredient.id)) {
      throw new Error(`Duplicate ingredient id "${ingredient.id}" is not allowed.`);
    }

    ids.add(ingredient.id);
  }
}

function createComboEntries(combinations, sizeKey) {
  return combinations.map((group) =>
    Object.freeze({
      id: group.map((ingredient) => ingredient.id).join("+"),
      size: group.length,
      sizeKey,
      ingredientIds: Object.freeze(group.map((ingredient) => ingredient.id)),
      ingredientLabels: Object.freeze(
        group.map((ingredient) => ingredient.label ?? ingredient.id),
      ),
    }),
  );
}

function createIngredientCombinations(ingredients, size) {
  const results = [];

  function walk(startIndex, currentGroup) {
    if (currentGroup.length === size) {
      results.push([...currentGroup]);
      return;
    }

    for (let index = startIndex; index < ingredients.length; index += 1) {
      currentGroup.push(ingredients[index]);
      walk(index + 1, currentGroup);
      currentGroup.pop();
    }
  }

  walk(0, []);
  return results;
}

function assertComboCount(combos, expectedCount, sizeKey) {
  if (combos.length !== expectedCount) {
    throw new Error(
      `Expected ${expectedCount} ${sizeKey} combos, received ${combos.length}.`,
    );
  }
}

module.exports = {
  buildPotionComboCatalog,
};
