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
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {

      const cartUpdate = [...cart];
      const productExist = cartUpdate.find(item => item.id === productId);
      
      const stock = await api.get(`/stock/${productId}`);
      
      const countAmount = stock.data.amount;
      const currentAmount = productExist ? productExist.amount : 0;
      const amount = currentAmount + 1;

      if(amount > countAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if(productExist) {
        productExist.amount = amount;
      }else {
        const product = await api.get(`/products/${productId}`);

        const data = {
          ...product.data,
          amount: 1
        }

        cartUpdate.push(data);
      }

      setCart(cartUpdate);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartUpdate));

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExist = cart.find(item => item.id === productId);

      if(!productExist) {
        toast.error('Erro na remoção do produto');
        return;
      }

      const cartUpdate = cart.filter(item => item.id !== productId);
      
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartUpdate));

      setCart(cartUpdate);
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      const cartUpdate = [...cart];

      const stock = await api.get(`/stock/${productId}`);
      
      const countAmount = stock.data.amount;

      if(amount > countAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if(amount < 1) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const product = cartUpdate.find(item => item.id === productId)

      if(product) {
        product.amount = amount

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartUpdate));

        setCart(cartUpdate)
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
