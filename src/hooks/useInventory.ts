import { useState, useEffect } from 'react';
import { Product } from '../types';

const STORAGE_KEY = 'inventory_data';

export function useInventory() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setProducts(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse inventory data', e);
      }
    }
  }, []);

  const saveProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProducts));
  };

  const addProduct = (product: Product) => {
    saveProducts([...products, product]);
  };

  const updateProductQuantity = (id: string, newQuantity: number) => {
    saveProducts(
      products.map((p) =>
        p.id === id ? { ...p, quantity: Math.max(0, newQuantity) } : p
      )
    );
  };

  const deleteProduct = (id: string) => {
    saveProducts(products.filter((p) => p.id !== id));
  };

  const findProductByBarcode = (barcode: string) => {
    return products.find((p) => p.barcode === barcode);
  };

  return {
    products,
    addProduct,
    updateProductQuantity,
    deleteProduct,
    findProductByBarcode,
  };
}
