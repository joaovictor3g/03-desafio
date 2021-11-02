import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const response = await api.get(`/products/${productId}`);
      const stockedProductResponse = await api.get(`/stock/${productId}`);
      const stockedProduct: Stock = stockedProductResponse.data;
    
      const storagedProduct = cart.find(product => product.id===productId);

      if(storagedProduct) {
        if(storagedProduct.amount < stockedProduct.amount) {
          storagedProduct.amount += 1;
          setCart(prev => {
            const mappedProducts = prev.map(product => {
              if(product.id===productId) {
                product.amount = storagedProduct.amount;
              }
              return product;
            });
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(mappedProducts));
            return mappedProducts;
          });
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
        return;
      }

      const product = {
        ...response.data,
        amount: 1
      };
      const newProduct = [...cart, product];
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newProduct));
      setCart(newProduct);
    
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const foundProduct = cart.find(product => product.id===productId)

      if(!foundProduct) {
        toast.error('Erro na remoção do produto');
        return;
      }

      const filteredProducts = cart.filter(product => product.id!==productId)
      setCart(filteredProducts);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(filteredProducts));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const stockedProductResponse = await api.get(`/stock/${productId}`);
      const stockedProduct: Stock = stockedProductResponse.data;
      
      const storagedProduct = cart.find(product => product.id===productId) as Product;

      if(storagedProduct.amount <= stockedProduct.amount && amount < stockedProduct.amount && amount >= 1 ) {
        setCart(prev => {
          const mappedProducts = prev.map(product => {
            if(product.id===productId) {
              product.amount = amount;
            }
            return product;
          });
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(mappedProducts));
          return mappedProducts;
        });
      } else {
        toast.error('Quantidade solicitada fora de estoque');
      }
        
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
