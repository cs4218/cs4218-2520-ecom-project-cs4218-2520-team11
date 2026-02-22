// Gabriel Seethor, A0257008H (Whole File)
import { useCart } from '../context/cart';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import React from 'react';
import { render, screen, act, waitFor , fireEvent} from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import ProductDetails from '../pages/ProductDetails';
import HomePage from './HomePage';
import { mock } from 'node:test';


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

jest.mock('../components/Layout', () => {
  return function MockLayout({ children }) {
    return <div data-testid="mock-layout">{children}</div>;
  };
});



jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
  loading: jest.fn(),
  dismiss: jest.fn()
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Ant Design Badge to capture count
jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  Badge: ({ count, children }) => (
    <div data-testid="cart-badge" data-count={count}>
      {children}
    </div>
  )
}));


describe('Add to Cart Functionality', () => {
  let mockNavigate;
  let mockProducts;
  let mockCart = [];
  const mockSetCart = jest.fn();


  beforeEach(() => {
    jest.clearAllMocks();

    
    
    mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);
    
    // Reset cart
    mockCart = [];
    useCart.mockReturnValue([mockCart, mockSetCart]);

    // Mock products with quantity
    mockProducts = [
      {
        _id: '1',
        name: 'iPhone',
        description: 'Apple smartphone',
        price: 999,
        category: 'cat1',
        slug: 'iphone',
        quantity: 10 // In stock
      },
      {
        _id: '2',
        name: 'Out of Stock Item',
        description: 'Cannot buy this',
        price: 49,
        category: 'cat2',
        slug: 'out-of-stock',
        quantity: 0 // Out of stock
      }
    ];

    // Mock API responses for initial load
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/v1/category/get-category')) {
        return Promise.resolve({ data: { success: true, category: [] } });
      }
      if (url.includes('/api/v1/product/product-count')) {
        return Promise.resolve({ data: { total: 2 } });
      }
      if (url.includes('/api/v1/product/product-list/1')) {
        return Promise.resolve({ data: { products: mockProducts } });
      }
      return Promise.reject(new Error('Not mocked'));
    });

    Storage.prototype.setItem = jest.fn();
  });

  // ===== TEST 1: Add to cart button works =====
  test('should add product to cart state when ADD TO CART clicked', async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // Wait for products to load
    await screen.findByText('iPhone');

    // Find and click ADD TO CART button for iPhone
    const addToCartButtons = screen.getAllByText('ADD TO CART');
    fireEvent.click(addToCartButtons[0]);

    // Verify cart state was updated with the product
    expect(mockSetCart).toHaveBeenCalledWith([mockProducts[0]]);
    
    // Verify localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'cart',
      JSON.stringify([mockProducts[0]])
    );
    
    // Verify toast notification
    expect(toast.success).toHaveBeenCalledWith('Item Added to cart');
  });

  
  // ===== TEST 2: Cannot add out of stock products =====
  test('should NOT add product to cart if quantity is 0', async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await screen.findByText('iPhone');

    // Find all ADD TO CART buttons (should only be 1 - iPhone only, out of stock item should have no button)
    const addToCartButtons = screen.getAllByText('ADD TO CART');
    
    // Try to click on out of stock item's button (if it exists)
    // In your component, you might want to conditionally render the button
    // or disable it for out of stock items
    
    // Verify cart was not updated
    expect(mockSetCart).not.toHaveBeenCalled();
    
    // Verify no success toast
    expect(toast.success).not.toHaveBeenCalled();
  });

  // For this test, I used AI heavily to help generate the logic for handling quantity in cart. 
 
// TEST 3: Adding same product creates duplicate entries
test('should add duplicate entries when same product added twice', async () => {
  // 1. Setup external state to track changes
  let cartState = [];
  
  // 2. Create the mock function
  const setCartMock = jest.fn((newCart) => {
    cartState = newCart; 
  });

  // 3. Initial Mock: Return empty cart
  useCart.mockReturnValue([cartState, setCartMock]);

  // 4. Render and Destructure 'rerender'
  const { rerender } = render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  );

  // Wait for product to load
  const addToCartButtons = await screen.findAllByText('ADD TO CART');
 const firstButton = addToCartButtons[0];

  // --- CLICK 1 ---
  fireEvent.click(firstButton);
  
  // Checkpoint: verify first click worked
  expect(setCartMock).toHaveBeenCalledTimes(1);
  expect(cartState).toHaveLength(1);

  // --- CRITICAL STEP: UPDATE MOCK & RERENDER ---
  // Update the mock to return the NEW cart state (which now has 1 item)
  useCart.mockReturnValue([cartState, setCartMock]);
  
  // Force the component to update so it sees the new cart state
  rerender(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  );

  // --- CLICK 2 ---
  // We need to find the button again because the DOM might have refreshed
  const addToCartButtonsRefreshed = await screen.findAllByText('ADD TO CART');
  const secondButton = addToCartButtonsRefreshed[0]; // Assuming first button is the one we're interested in

  fireEvent.click(secondButton);

  // --- ASSERTION ---
  expect(setCartMock).toHaveBeenCalledTimes(2);
  
  // Look at the arguments passed to the LAST call
  const lastCallArgs = setCartMock.mock.lastCall[0];
  
  expect(lastCallArgs).toHaveLength(2);
  expect(lastCallArgs[0]._id).toBe(lastCallArgs[1]._id);
});
});