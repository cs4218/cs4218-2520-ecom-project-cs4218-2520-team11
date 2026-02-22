// Gabriel Seethor, A0257008H (Whole File)
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

describe('Home Page Component/ Filter Products', () => {
  



  beforeEach(() => {
    jest.clearAllMocks();
   

    
    const mockProductList = [
    
    {
    _id: '1',
    name: 'iPhone',
    description: 'Test Description',
    price: 999,
    category: { _id: 'cat1', name: 'Electronics' },
    slug: 'iphone-product'
  }, 
    {
      _id: '2',
      name: 'Laptop',
      description: 'Another Test Description',
      price: 599,
      category: { _id: 'cat1', name: 'Electronics' },
      slug: 'laptop-product'
    }, 
    {
      _id: '3',
      name: 'T-Shirt',
      description: 'Clothing Test Description',
      price: 29,
      category: { _id: 'cat3', name: 'Clothing' },
      slug: 'tshirt-product'
    }, {
      _id: '4',
      name: 'Shorts',
      description: 'Clothing Test Description',
      price: 89,
      category: { _id: 'cat3', name: 'Clothing' },
      slug: 'shorts-product'
    }, 
    {
      _id: '5',
      name: 'textbook',
      description: 'Books Test Description',
      price: 39,
      category: { _id: 'cat2', name: 'Books' },
      slug: 'textbook-product'
    }
    
];

   const categoryList =   [  
    
            { _id: 'electronics', name: 'Electronics' },
              { _id: 'clothing', name: 'Clothing' },
              { _id: 'books', name: 'Books' }]
   




    axios.get.mockImplementation((url) => {
      
      if (url.includes('/api/v1/category/get-category')) {
        return Promise.resolve({ data: { success: true, category: categoryList } });
      }
       if (url.includes(`/api/v1/product/product-list/`)) {
        return Promise.resolve({data : { products: mockProductList }});
      }
       if (url.includes("/api/v1/product/product-count")) {
         return Promise.resolve({ data: { total: 5 } });
      }
      
      return Promise.reject(new Error('Not mocked'));
    });



  });
   
  // Test case : 'filter by category' was partially aided by DeepSeekV3.2 to fix a few bugs and what not, but the test case was written by me.
  it('filter by category', async () => {


    const filteredProducts = [
         {
    _id: '1',
    name: 'iPhone',
    description: 'Test Description',
    price: 999,
    category: { _id: 'cat1', name: 'Electronics' },
    slug: 'iphone-product'
     }, 
    {
      _id: '2',
      name: 'Laptop',
      description: 'Another Test Description',
      price: 599,
      category: { _id: 'cat1', name: 'Electronics' },
      slug: 'laptop-product'
    }
    ]

    axios.post.mockResolvedValueOnce({
      data: { products: filteredProducts }
    });

       render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
       )



    const electronicsCheckbox = await screen.findByLabelText('Electronics');
    fireEvent.click(electronicsCheckbox);

    expect(electronicsCheckbox.checked).toBe(true);




    await screen.findByText('iPhone');

    expect(screen.getByText('iPhone' )).toBeInTheDocument();
    expect(screen.getByText('Laptop')).toBeInTheDocument();
    expect(screen.queryByText('T-Shirt')).not.toBeInTheDocument();


});

it('filter by price', async () => {


     const filteredProducts = [
          {
      _id: '3',
      name: 'T-Shirt',
      description: 'Clothing Test Description',
      price: 29,
      category: { _id: 'cat3', name: 'Clothing' },
      slug: 'tshirt-product'
    }, 
    {
      _id: '5',
      name: 'textbook',
      description: 'Books Test Description',
      price: 39,
      category: { _id: 'cat2', name: 'Books' },
      slug: 'textbook-product'
    }
    ]

    axios.post.mockResolvedValueOnce({
      data: { products: filteredProducts }
    });

       render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
       )



    const radio = screen.getByRole('radio', { name: /20 to 39/i });
    fireEvent.click(radio);

    expect(radio.checked).toBe(true);




    await screen.findByText('T-Shirt');

    expect(screen.getByText('T-Shirt' )).toBeInTheDocument();
    expect(screen.getByText('textbook')).toBeInTheDocument();
    expect(screen.queryByText('iPhone')).not.toBeInTheDocument();
    
});


it('filter by price and category', async () => {


     const filteredProducts = [
         {
    _id: '1',
    name: 'iPhone',
    description: 'Test Description',
    price: 999,
    category: { _id: 'cat1', name: 'Electronics' },
    slug: 'iphone-product'
  }, 
    {
      _id: '2',
      name: 'Laptop',
      description: 'Another Test Description',
      price: 599,
      category: { _id: 'cat1', name: 'Electronics' },
      slug: 'laptop-product'
    }
    ]

    axios.post.mockResolvedValueOnce({
      data: { products: filteredProducts }
    });

       render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
       )



    const radio = screen.getByRole('radio', { name: /100 or more/i });
    fireEvent.click(radio);

    expect(radio.checked).toBe(true);


    const electronicsCheckbox = await screen.findByLabelText('Electronics');
    fireEvent.click(electronicsCheckbox);

    expect(electronicsCheckbox.checked).toBe(true);




    await screen.findByText('iPhone');

    expect(screen.getByText('iPhone' )).toBeInTheDocument();
    expect(screen.getByText('Laptop')).toBeInTheDocument();
    expect(screen.queryByText('textbook')).not.toBeInTheDocument();
    
});


it('filter by price and category', async () => {


     const filteredProducts = [
         {
    _id: '1',
    name: 'iPhone',
    description: 'Test Description',
    price: 999,
    category: { _id: 'cat1', name: 'Electronics' },
    slug: 'iphone-product'
  }, 
    {
      _id: '2',
      name: 'Laptop',
      description: 'Another Test Description',
      price: 599,
      category: { _id: 'cat1', name: 'Electronics' },
      slug: 'laptop-product'
    }
    ]

    axios.post.mockResolvedValueOnce({
      data: { products: filteredProducts }
    });

       render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
       )



    const radio = screen.getByRole('radio', { name: /100 or more/i });
    fireEvent.click(radio);

    expect(radio.checked).toBe(true);


    const electronicsCheckbox = await screen.findByLabelText('Electronics');
    fireEvent.click(electronicsCheckbox);

    expect(electronicsCheckbox.checked).toBe(true);




    await screen.findByText('iPhone');

    expect(screen.getByText('iPhone' )).toBeInTheDocument();
    expect(screen.getByText('Laptop')).toBeInTheDocument();
    expect(screen.queryByText('textbook')).not.toBeInTheDocument();
    
});


it('filter returns nothing', async () => {


     const filteredProducts = [
       
      
    ]

    axios.post.mockResolvedValueOnce({
      data: { products: filteredProducts }
    });

       render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
       )

    const electronicsCheckbox = await screen.findByLabelText('Electronics');
   fireEvent.click(electronicsCheckbox);



    
    waitFor(() => {
    expect(screen.getByText('iPhone' )).not.toBeInTheDocument();
    expect(screen.getByText('Laptop')).not.toBeInTheDocument();
    expect(screen.queryByText('textbook')).not.toBeInTheDocument();
    expect(screen.getByText('T-Shirt')).not.toBeInTheDocument();
    expect(screen.getByText('Shorts')).not.toBeInTheDocument();
    })

    
});


it('reset filter returns all products', async () => {


    // Had to ask DeepSeekV3.2 to help me test this portion of actually calling the reload. L:ines 383-387
      const mockReload = jest.fn();
    Object.defineProperty(window, 'location', {
    value: { reload: mockReload },
    writable: true
  });


     const filteredProducts = [
             {
    _id: '1',
    name: 'iPhone',
    description: 'Test Description',
    price: 999,
    category: { _id: 'cat1', name: 'Electronics' },
    slug: 'iphone-product'
     }, 
    {
      _id: '2',
      name: 'Laptop',
      description: 'Another Test Description',
      price: 599,
      category: { _id: 'cat1', name: 'Electronics' },
      slug: 'laptop-product'
    }

       
      
    ]

    axios.post.mockResolvedValueOnce({
      data: { products: filteredProducts }
    });

   


       render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
       )

    const electronicsCheckbox = await screen.findByLabelText('Electronics');
    fireEvent.click(electronicsCheckbox);

    await screen.findByText('iPhone');

    expect(screen.getByText('iPhone' )).toBeInTheDocument();
    expect(screen.getByText('Laptop')).toBeInTheDocument();
    expect(screen.queryByText('T-Shirt')).not.toBeInTheDocument();



    const mockProductList = [
    
    {
    _id: '1',
    name: 'iPhone',
    description: 'Test Description',
    price: 999,
    category: { _id: 'cat1', name: 'Electronics' },
    slug: 'iphone-product'
  }, 
    {
      _id: '2',
      name: 'Laptop',
      description: 'Another Test Description',
      price: 599,
      category: { _id: 'cat1', name: 'Electronics' },
      slug: 'laptop-product'
    }, 
    {
      _id: '3',
      name: 'T-Shirt',
      description: 'Clothing Test Description',
      price: 29,
      category: { _id: 'cat3', name: 'Clothing' },
      slug: 'tshirt-product'
    }, {
      _id: '4',
      name: 'Shorts',
      description: 'Clothing Test Description',
      price: 89,
      category: { _id: 'cat3', name: 'Clothing' },
      slug: 'shorts-product'
    }, 
    {
      _id: '5',
      name: 'textbook',
      description: 'Books Test Description',
      price: 39,
      category: { _id: 'cat2', name: 'Books' },
      slug: 'textbook-product'
    }
    
    ];

    const categoryList =   [  
    
            { _id: 'electronics', name: 'Electronics' },
              { _id: 'clothing', name: 'Clothing' },
              { _id: 'books', name: 'Books' }]
   



    axios.get.mockImplementation((url) => {
      
      if (url.includes('/api/v1/category/get-category')) {
        return Promise.resolve({ data: { success: true, category: categoryList } });
      }
       if (url.includes(`/api/v1/product/product-list/`)) {
        return Promise.resolve({data : { products: mockProductList }});
      }
       if (url.includes("/api/v1/product/product-count")) {
         return Promise.resolve({ data: { total: 5 } });
      }
      
      return Promise.reject(new Error('Not mocked'));
    });

    const resetButton = screen.getByRole('button', { name: /reset filters/i });
    fireEvent.click(resetButton);

    
    expect(mockReload).toHaveBeenCalledTimes(1);





    
    
    
});



})

