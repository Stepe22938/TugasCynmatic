/**
 * CartContext.tsx
 * Manages global cart state using React Context and useReducer.
 * Persists data to localStorage.
 */
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";

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
  | { type: "CLEAR_CART" }
  | { type: "SET_CART"; payload: CartState };

interface CartContextType {
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  totalItems: number;
  subtotal: number;
}

// Initial state
const initialState: CartState = {
  items: []
};

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
    case "SET_CART":
      return action.payload;
    default:
      return state;
  }
}

// Context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider Component
export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const cartKey = `toko_cart_${user ? user.id : "guest"}`;
  
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load from localStorage when user (and cartKey) changes
  useEffect(() => {
    try {
      const localData = localStorage.getItem(cartKey);
      const cartState = localData ? JSON.parse(localData) : { items: [] };
      dispatch({ type: "SET_CART", payload: cartState });
    } catch {
      dispatch({ type: "SET_CART", payload: { items: [] } });
    }
  }, [cartKey]);

  // Sync to localStorage on change
  useEffect(() => {
    // Only save if it's the actual loaded state (prevent overwriting with empty initial state before load)
    if (state !== initialState || state.items.length > 0) {
      localStorage.setItem(cartKey, JSON.stringify(state));
    } else if (state === initialState && localStorage.getItem(cartKey)) {
      // It's strictly the initial empty state, but a real state exists in localStorage
      // do nothing to prevent overwriting during rapid re-renders before SET_CART
    } else {
      localStorage.setItem(cartKey, JSON.stringify(state));
    }
  }, [state, cartKey]);

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
