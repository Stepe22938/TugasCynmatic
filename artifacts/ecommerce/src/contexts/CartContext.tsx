/**
 * CartContext.tsx
 * Manages global cart state using React Context and useReducer.
 * Persists data to localStorage.
 */
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";

// Types
export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD_ITEM"; payload: Omit<CartItem, "quantity"> }
  | { type: "REMOVE_ITEM"; payload: { id: number } }
  | { type: "UPDATE_QUANTITY"; payload: { id: number; quantity: number } }
  | { type: "CLEAR_CART" };

interface CartContextType {
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  totalItems: number;
  subtotal: number;
}

// Initial state, optionally loaded from localStorage
const initialState: CartState = {
  items: []
};

function initCartState(initial: CartState): CartState {
  try {
    const localData = localStorage.getItem("toko_cart");
    return localData ? JSON.parse(localData) : initial;
  } catch (error) {
    console.error("Failed to parse cart state from localStorage", error);
    return initial;
  }
}

// Reducer
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingItemIndex = state.items.findIndex(item => item.id === action.payload.id);
      if (existingItemIndex > -1) {
        // Increment quantity if item already exists
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex].quantity += 1;
        return { ...state, items: updatedItems };
      }
      // Add new item with quantity 1
      return { ...state, items: [...state.items, { ...action.payload, quantity: 1 }] };
    }
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload.id)
      };
    case "UPDATE_QUANTITY":
      if (action.payload.quantity < 1) return state;
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id ? { ...item, quantity: action.payload.quantity } : item
        )
      };
    case "CLEAR_CART":
      return { ...state, items: [] };
    default:
      return state;
  }
}

// Context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider Component
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState, initCartState);

  // Sync to localStorage on change
  useEffect(() => {
    localStorage.setItem("toko_cart", JSON.stringify(state));
  }, [state]);

  // Derived state
  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ state, dispatch, totalItems, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

// Hook
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
