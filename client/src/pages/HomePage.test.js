import React from 'react';
import { render, screen, act, waitFor , fireEvent} from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import ProductDetails from '../pages/ProductDetails';
import HomePage from './HomePage';
import { mock } from 'node:test';
import Register from "./Auth/Register";
import Login from "./Auth/Login";
import CartPage from './CartPage';





jest.mock('axios');

jest.mock('../context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn()])
}));

jest.mock('../context/cart', () => ({
  useCart: jest.fn(() => [null, jest.fn()])
}));

jest.mock('../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()])
}));


jest.mock('../hooks/useCategory', () => ({
  __esModule: true,
  default: jest.fn(() => [[
    { _id: 'cat1', name: 'Electronics', slug: 'electronics' },
    { _id: 'cat2', name: 'Books', slug: 'books' },
    { _id: 'cat3', name: 'Clothing', slug: 'clothing' }
  ], jest.fn()])
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

describe('Home Page Component/ View Product List', () => {
  const mockProduct = {
    _id: '123',
    name: 'Test Product',
    description: 'Test Description',
    price: 100,
    category: { _id: 'cat1', name: 'Electronics' },
    slug: 'test-product'
  };

   const mockProductList = Array.from({ length: 10 }, (_, i) => ({
     _id: `prod${i}`,
     name: `Test Product ${i}`,
     description: `Test Description ${i}`,
     price: 100 + i,
     category: { _id: 'cat1', name: 'Electronics' },
     slug: `test-product-${i}`
 }));

  const mockSimilarProducts = [
    {
      _id: '456',
      name: 'Similar Product',
      description: 'Similar Description',
      price: 150,
      slug: 'similar-product'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state before product list is loaded', async () => {
    
    let resolveProductCall;
    let resolveCategoryCall;
    let resolveCountCall;
    let resolveProductListCall;
    
    const productPromise = new Promise((resolve) => {
      resolveProductCall = resolve;
    });
    
    const categoryPromise = new Promise((resolve) => {
      resolveCategoryCall = resolve;
    });

    const page = 1;

    const productCountPromise = new Promise((resolve)=> {
        resolveCountCall = resolve;
    })

     const productListPromise = new Promise((resolve)=> {
        resolveProductListCall = resolve;
    })


    axios.get.mockImplementation((url) => {
      if (url.includes('/api/v1/product/get-product/')) {
        return productPromise;
      }
      if (url.includes('/api/v1/category/get-category')) {
        return categoryPromise;
      }
       if (url.includes(`/api/v1/product/product-list/${page}`)) {
        return productListPromise;
      }
       if (url.includes("/api/v1/product/product-count")) {
        return productCountPromise;
      }
      
      return Promise.reject(new Error('Not mocked'));
    });

      render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  );

  
  
  expect(screen.getByText('Loading...')).toBeInTheDocument();



    

});

 it('should show product list after loaded (1 product)', async () => {
    

    let resolveCategoryCall;
    let resolveCountCall;
    let resolveProductListCall;

    
    const categoryPromise = new Promise((resolve) => {
      resolveCategoryCall = resolve;
    });

    const page = 1;

    const productCountPromise = new Promise((resolve)=> {
        resolveCountCall = resolve;
    })

     const productListPromise = new Promise((resolve)=> {
        resolveProductListCall = resolve;
    })


    axios.get.mockImplementation((url) => {
   
      if (url.includes('/api/v1/category/get-category')) {
        return categoryPromise;
      }
       if (url.includes(`/api/v1/product/product-list/${page}`)) {
        return productListPromise;
      }
       if (url.includes("/api/v1/product/product-count")) {
        return productCountPromise;
      }
      
      return Promise.reject(new Error('Not mocked'));
    });

      render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  );

  
  
  expect(screen.getByText('Loading...')).toBeInTheDocument();



    

    await act(async () => {
      resolveCategoryCall({ data: { category: [] } });
      await Promise.resolve();
    });

    await act(async () => {
      resolveProductListCall({ 
        data: { 
          products: [mockProduct],
          success: true 
        } 
      });
    });


    await act(async () => {
      resolveCountCall({ 
        data: { 
          total: 1,
        
        } 
      });

    });

   
    
    expect(screen.getByText('All Products')).toBeInTheDocument();

    const moreDetailsButtons = screen.getAllByText('More Details');
    expect(moreDetailsButtons.length).toBe(1);

    const addToCartButtons = screen.getAllByText('ADD TO CART');
    expect(addToCartButtons.length).toBe(1);

    expect(screen.getByText(`${mockProduct.name}`)).toBeInTheDocument();
    
    expect(screen.getByText(   mockProduct.price.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                      }))).toBeInTheDocument();
    
   
});


it('should show product list after loaded (10 products)', async () => {
    

    let resolveCategoryCall;
    let resolveCountCall;
    let resolveProductListCall;

    
    const categoryPromise = new Promise((resolve) => {
      resolveCategoryCall = resolve;
    });

    const page = 1;

    const productCountPromise = new Promise((resolve)=> {
        resolveCountCall = resolve;
    })

     const productListPromise = new Promise((resolve)=> {
        resolveProductListCall = resolve;
    })


    axios.get.mockImplementation((url) => {
   
      if (url.includes('/api/v1/category/get-category')) {
        return categoryPromise;
      }
       if (url.includes(`/api/v1/product/product-list/${page}`)) {
        return productListPromise;
      }
       if (url.includes("/api/v1/product/product-count")) {
        return productCountPromise;
      }
      
      return Promise.reject(new Error('Not mocked'));
    });

      render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  );

  
  
  expect(screen.getByText('Loading...')).toBeInTheDocument();



    

    await act(async () => {
      resolveCategoryCall({ data: { category: [] } });
      await Promise.resolve();
    });

    await act(async () => {
      resolveProductListCall({ 
        data: { 
          products: mockProductList,
          success: true 
        } 
      });
    });


    await act(async () => {
      resolveCountCall({ 
        data: { 
          total: 10,
        
        } 
      });

    });

   
    // Check product details are rendered
    expect(screen.getByText('All Products')).toBeInTheDocument();

    const moreDetailsButtons = screen.getAllByText('More Details');
    expect(moreDetailsButtons.length).toBe(10);

    const addToCartButtons = screen.getAllByText('ADD TO CART');
    expect(addToCartButtons.length).toBe(10);

    expect(screen.getByText(`${mockProductList[0].name}`)).toBeInTheDocument();
    expect(screen.getByText(`${mockProductList[1].name}`)).toBeInTheDocument();
    expect(screen.getByText(`${mockProductList[2].name}`)).toBeInTheDocument();
    expect(screen.getByText(`${mockProductList[3].name}`)).toBeInTheDocument();
    expect(screen.getByText(`${mockProductList[4].name}`)).toBeInTheDocument();
    expect(screen.getByText(`${mockProductList[5].name}`)).toBeInTheDocument();
    expect(screen.getByText(`${mockProductList[6].name}`)).toBeInTheDocument();
    expect(screen.getByText(`${mockProductList[7].name}`)).toBeInTheDocument();
    expect(screen.getByText(`${mockProductList[8].name}`)).toBeInTheDocument();
    expect(screen.getByText(`${mockProductList[9].name}`)).toBeInTheDocument();
   
});


it('navigation to Register Page works', async () => {


    
     render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </MemoryRouter>
  );

  const registerButton = screen.getByText(/register/i);
  fireEvent.click(registerButton);
   expect(screen.getByText('REGISTER FORM')).toBeInTheDocument()







 })


it('navigation to Login Page works', async () => {

   render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </MemoryRouter>
  );

  const loginButton = screen.getByText(/login/i);
  fireEvent.click(loginButton);
   expect(screen.getByText('LOGIN FORM')).toBeInTheDocument()






 })

it('navigation to Cart Page works', async () => {

   render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/cart" element={<CartPage />} />
      </Routes>
    </MemoryRouter>
  );

  const cartButton = screen.getByText(/cart/i);
  fireEvent.click(cartButton);
  expect(screen.getByText(/cart summary/i)).toBeInTheDocument()
  expect(screen.getByText(/Hello Guest/i)).toBeInTheDocument()

 })



})

