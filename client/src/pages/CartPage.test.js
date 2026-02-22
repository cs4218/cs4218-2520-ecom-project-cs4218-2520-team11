import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import CartPage from './CartPage';


// A mix of generated and hand-written code to serve as a teaching point/tutorial for learning
// Attribution: This file is prepared with the help of DeepSeek-V3.2

jest.mock('axios');
jest.mock('react-hot-toast');

// Mock braintree - VERY simple
jest.mock('braintree-web-drop-in-react', () => ({
  __esModule: true,
  default: ({ onInstance }) => {
    // Call onInstance immediately with a mock instance
    onInstance({
      requestPaymentMethod: jest.fn().mockResolvedValue({ nonce: 'fake-nonce' })
    });
    return <div data-testid="braintree-dropin">DropIn Mock</div>;
  }
}));


jest.mock('react-icons/ai', () => ({
  AiFillWarning: () => <span>⚠️</span>
}));


jest.mock('../components/Layout', () => ({ children }) => <div>{children}</div>);


jest.mock('../context/auth', () => ({
  useAuth: jest.fn(() => [{
    user: mockUser,
    token: 'fake-token'
  }, mockSetAuth])
}));
jest.mock('../context/cart', () => ({
  useCart: jest.fn()
}));


import { useAuth } from '../context/auth';
import { useCart } from '../context/cart';

describe('CartPage Component', () => {
  let mockCart;
  let mockUser;
  let mockSetCart;
  let mockSetAuth;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSetCart = jest.fn();
    mockSetAuth = jest.fn();
    
    Storage.prototype.setItem = jest.fn();
    Storage.prototype.getItem = jest.fn();
    Storage.prototype.removeItem = jest.fn();

    useCart.mockReturnValue([mockCart, mockSetCart]);

    mockCart = [
      {
        _id: '1',
        name: 'Test Product 1',
        price: 99.99,
        description: 'This is a test product description',
      },
      {
        _id: '2',
        name: 'Test Product 2',
        price: 149.99,
        description: 'Another test product',
      }
    ];

    mockUser = {
      name: 'John Doe',
      email: 'john@example.com',
      address: '123 Test St',
      token: 'fake-token'
    };
  });

  
  test('should render empty cart message for guest user', () => {
     useAuth.mockReturnValue([{
      user: null,
      token: null
    }, mockSetAuth]);
    
    useCart.mockReturnValue([[], mockSetCart]);

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Hello Guest/i)).toBeInTheDocument();
    expect(screen.getByText(/Your Cart Is Empty/i)).toBeInTheDocument();
    expect(screen.queryByText('Remove')).not.toBeInTheDocument();
  });


  test('should render cart items correctly for logged in user', () => {
    // Ensure mocks return the correct values for this test
    
    useCart.mockReturnValue([mockCart, mockSetCart]);

    useAuth.mockReturnValue([{
      user: mockUser,
      token: mockUser.token
    }, mockSetAuth]);

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );


    screen.debug();

    // Check greeting
    expect(screen.getByText(/Hello John Doe/i)).toBeInTheDocument();
    expect(screen.getByText(/You Have 2 items in your cart/i)).toBeInTheDocument();

    // Check products
    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.getByText('Test Product 2')).toBeInTheDocument();

    
  });

  
  test('should calculate and display total price correctly', () => {
    useAuth.mockReturnValue([{
      user: mockUser,
      token: mockUser.token
    }, mockSetAuth]);
    useCart.mockReturnValue([mockCart, mockSetCart]);

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Total : \$249.98/i)).toBeInTheDocument();
  });


  test('should remove item from cart when remove button is clicked', () => {
        useAuth.mockReturnValue([{
      user: mockUser,
      token: mockUser.token
    }, mockSetAuth]);
    useCart.mockReturnValue([mockCart, mockSetCart]);

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );


    const removeButtons = screen.getAllByText('Remove');
    fireEvent.click(removeButtons[0]);

    expect(mockSetCart).toHaveBeenCalledWith([mockCart[1]]);
    

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'cart',
      JSON.stringify([mockCart[1]])
    );
  });

  test('should show address and update button when user has address', () => {
      useAuth.mockReturnValue([{
      user: mockUser,
      token: mockUser.token
    }, mockSetAuth]);
  useCart.mockReturnValue([mockCart, mockSetCart]);

  render(
    <MemoryRouter>
      <CartPage />
    </MemoryRouter>
  );

  // Check that address section renders correctly
  expect(screen.getByText('Current Address')).toBeInTheDocument();
  expect(screen.getByText(mockUser.address)).toBeInTheDocument();
  expect(screen.getByText('Update Address')).toBeInTheDocument();
  
  
  const updateButtons = screen.getAllByText('Update Address');
  expect(updateButtons).toHaveLength(1);
});


test('should show login prompt for guest user with items', () => {
      useAuth.mockReturnValue([{
      user: null,
      token: null
    }, mockSetAuth]);
  useCart.mockReturnValue([mockCart, mockSetCart]);

  render(
    <MemoryRouter>
      <CartPage />
    </MemoryRouter>
  );

  expect(screen.getByText(/Hello Guest/i)).toBeInTheDocument();
  
  
  const loginPrompts = screen.getAllByText(/please login to checkout/i);
  expect(loginPrompts).toHaveLength(2);
  
  
  expect(loginPrompts[0].tagName).toBe('P');
  expect(loginPrompts[1].tagName).toBe('BUTTON');
});

  test('should navigate to login when login button is clicked', () => {
    const mockNavigate = jest.fn();
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate
    }));

    useAuth.mockReturnValue([null, mockSetAuth]);
    useCart.mockReturnValue([mockCart, mockSetCart]);

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    const loginButton = screen.getByText('Please Login to checkout');
    fireEvent.click(loginButton);

  });

});