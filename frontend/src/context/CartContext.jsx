import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";

const CART_STORAGE_KEY = "aurelia_cart";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Safe fallback if localStorage is disabled or corrupted
    }
    return [];
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // Safe fallback on quota/storage errors
    }
  }, [cartItems]);

  // Add an item to the cart
  const addItem = useCallback((item) => {
    if (!item || item.id === undefined || item.id === null) return;

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((i) => String(i.id) === String(item.id));
      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: (updated[existingIndex].quantity || 1) + 1,
        };
        return updated;
      }

      let parsedPrice = item.price;
      if (typeof parsedPrice === "string") {
        parsedPrice = Number(parsedPrice.replace(/[^0-9.-]+/g, "")) || 0;
      }

      const newItem = {
        id: item.id,
        name: item.name || "Specialty Dish",
        description: item.description || "",
        price: typeof parsedPrice === "number" ? parsedPrice : 0,
        category: item.category || "",
        dietaryTags: item.dietaryTags || "",
        image: item.image || "",
        quantity: 1,
      };

      return [...prevItems, newItem];
    });
  }, []);

  // Remove an item entirely from cart
  const removeItem = useCallback((itemId) => {
    setCartItems((prevItems) => prevItems.filter((i) => String(i.id) !== String(itemId)));
  }, []);

  // Increase quantity by 1
  const increaseQuantity = useCallback((itemId) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        String(item.id) === String(itemId)
          ? { ...item, quantity: (item.quantity || 1) + 1 }
          : item
      )
    );
  }, []);

  // Decrease quantity by 1 (removes if quantity reaches 0)
  const decreaseQuantity = useCallback((itemId) => {
    setCartItems((prevItems) =>
      prevItems
        .map((item) => {
          if (String(item.id) === String(itemId)) {
            const newQty = (item.quantity || 1) - 1;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  }, []);

  // Clear the entire cart
  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // Computed total quantity
  const totalItems = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }, [cartItems]);

  // Computed subtotal
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const p = Number(item.price) || 0;
      const q = Number(item.quantity) || 1;
      return sum + p * q;
    }, 0);
  }, [cartItems]);

  const value = useMemo(
    () => ({
      cartItems,
      totalItems,
      subtotal,
      addItem,
      removeItem,
      increaseQuantity,
      decreaseQuantity,
      clearCart,
    }),
    [
      cartItems,
      totalItems,
      subtotal,
      addItem,
      removeItem,
      increaseQuantity,
      decreaseQuantity,
      clearCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
