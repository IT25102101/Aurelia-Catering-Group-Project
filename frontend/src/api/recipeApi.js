import { API_BASE_URL } from "./config";

/**
 * All the fetch calls for "Recipe Management" live in this one file.
 * This matches the backend's RecipeController.java one-to-one:
 * every function here calls exactly one endpoint on that controller.
 *
 * Endpoints used:
 *   GET    /api/recipes/menu-item/{menuItemId}  — all recipes for a menu item
 *   GET    /api/recipes/{id}                    — one recipe by id
 *   POST   /api/recipes                         — create a new recipe ingredient
 *   PUT    /api/recipes/{id}                    — update an existing recipe ingredient
 *   DELETE /api/recipes/{id}                    — delete a recipe ingredient
 *
 * Every function returns a Promise — use with async/await in a component.
 */

const BASE = `${API_BASE_URL}/recipes`;

// READ — all recipe ingredients for a specific menu item
// Returns a list of Recipe objects with joined display fields:
//   ingredientName, menuItemName, inventoryUnit, quantityInStock
export async function getRecipesByMenuItemId(menuItemId) {
  const response = await fetch(`${BASE}/menu-item/${menuItemId}`);
  if (!response.ok) throw new Error(`Failed to fetch recipes for menu item #${menuItemId}`);
  return response.json();
}

// READ — one recipe by its recipe_id
export async function getRecipeById(id) {
  const response = await fetch(`${BASE}/${id}`);
  if (!response.ok) throw new Error(`Failed to fetch recipe with id ${id}`);
  return response.json();
}

// CREATE — add a new ingredient to a menu item's recipe
// Required body: { menuItemId, inventoryItemId, quantityPerGuest, unit }
export async function createRecipe(recipeData) {
  const response = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(recipeData),
  });
  if (!response.ok) throw new Error("Failed to create recipe ingredient");
  return response.json();
}

// UPDATE — edit quantity or unit for an existing recipe ingredient
// Required body: { menuItemId, inventoryItemId, quantityPerGuest, unit }
export async function updateRecipe(id, recipeData) {
  const response = await fetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(recipeData),
  });
  if (!response.ok) throw new Error(`Failed to update recipe with id ${id}`);
  return response.json();
}

// DELETE — remove an ingredient from a menu item's recipe
export async function deleteRecipe(id) {
  const response = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error(`Failed to delete recipe with id ${id}`);
}
