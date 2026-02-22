// Lines 1-23 are generated from DeepSeekV3.2 to set up unit tests for the Backend.
const { 
  realtedProductController,
  productCountController,
  searchProductController,
  productFiltersController
} = require('./productController');
import productModel from '../models/productModel';

// Mock the database model
jest.mock('../models/productModel');

describe('Product Controller Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {}; // Initialize req
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn()
    };
  });

  describe('Product Recommendation (realtedProductController)', () => {
    test('should not show more than 3 related products', async () => {
      req.params = {
        pid: 'product123',
        cid: 'category456'
      };

      const mockProducts = [
        { _id: 'prod1', name: 'Related Product 1', category: 'category456' },
        { _id: 'prod2', name: 'Related Product 2', category: 'category456' }
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockProducts)
      };

      productModel.find.mockReturnValue(mockQuery);

      await realtedProductController(req, res);

      expect(mockQuery.select).toHaveBeenCalledWith('-photo');
      expect(mockQuery.populate).toHaveBeenCalledWith('category');
      expect(mockQuery.limit).toHaveBeenCalledWith(3);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts
      });
    });

    test('should be called with the right params', async () => {
      req.params = {
        pid: 'product123',
        cid: 'category456'
      };

      const mockProducts = [
        { _id: 'prod1', name: 'Related Product 1', category: 'category456' },
        { _id: 'prod2', name: 'Related Product 2', category: 'category456' }
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockProducts)
      };

      productModel.find.mockReturnValue(mockQuery);

      await realtedProductController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({
        category: 'category456',
        _id: { $ne: 'product123' }
      });
    });
  });

  test("shoild return correct error", async () => {
    req.params = {
        pid: 'product123',
        cid: 'category456'
      };

    const mockError = new Error("Database connection failed");

    productModel.find.mockReturnValue( {
        select : jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockRejectedValue(mockError) 

     }
    )

    await realtedProductController(req,res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "error while geting related product",
        error : mockError

  });


  })

  describe("View Product List/Home Page (productCountController)", () => {
    test("should return right product count", async () => {
      const mockCount = 8;
      const mockQuery = {
        estimatedDocumentCount: jest.fn().mockResolvedValue(mockCount)
      };

      productModel.find.mockReturnValue(mockQuery);
      
      await productCountController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({});
      expect(mockQuery.estimatedDocumentCount).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        total: mockCount
      });
    });
    test("should return correct error", async () => {
      
   
    
    const mockError = new Error("Database connection failed");
    
    productModel.find.mockReturnValue({
        estimatedDocumentCount: jest.fn().mockRejectedValue(mockError) 
    });

    await productCountController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error in product count",
        error : mockError
    });




    })


  });

  describe("Search Products (searchProductController)", () => {
    test("should call searchProductController with correct params ", async () => {



     req.params = {
       keyword: 'textbook'
      };

      const mockProducts = [
        { _id: 'prod1', name: 'math textbook ', category: 'category456' },
        { _id: 'prod2', name: 'science textbook', category: 'category456' }
      ];
     
      const mockQuery = {
        select: jest.fn().mockResolvedValue(mockProducts)
      };

     productModel.find.mockReturnValue(mockQuery);

      
      await searchProductController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({
     $or: [
      { name: { $regex: 'textbook', $options: 'i' } },
      { description: { $regex: 'textbook', $options: 'i' } }
    ]
  });

  
  expect(mockQuery.select).toHaveBeenCalledWith('-photo');
  
  
  expect(res.json).toHaveBeenCalledWith(mockProducts);
    });
  });

   test("should return correct error ", async () => {

    req = {
    params: {
      keyword: 'textbook'
    }
  };
   
  //Line 178-183 is generated from DeepSeekV3.2 to show how to return error
  const mockError = new Error("Database connection failed");
  
  // Mock find to return a rejected promise
  productModel.find.mockReturnValue({
    select: jest.fn().mockRejectedValue(mockError) // select rejects
  });

  await searchProductController(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.send).toHaveBeenCalledWith({
    success: false,
    message: "Error In Search Product API",
    error : mockError
  });



   })

   describe('Filter Products (productFiltersController)', () => {
        test('filter products by category only' , async () => {

            req = {
                body: {
                    checked: ['books'], 
                   radio: [] 
            }
        };

        const mockProducts = [
        { _id: '1', name: 'Product 1', category: 'books', price: 50 },
        { _id: '2', name: 'Product 2', category: 'books', price: 100 }
        ];

        productModel.find.mockReturnValue(mockProducts);

        await productFiltersController(req, res);

        expect(productModel.find).toHaveBeenCalledWith({
        category: { $in: ['books'] }
        });
        expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts
        });
        expect(res.status).toHaveBeenCalledWith(200);


        })


        test('filter products by price only' , async () => {

            req = {
                body: {
                    checked: [], 
                   radio: [0, 100] 
            }
        };

        const mockProducts = [
        { _id: '1', name: 'Product 1', category: 'books', price: 50 },
        { _id: '2', name: 'Product 2', category: 'books', price: 100 }
        ];

        productModel.find.mockReturnValue(mockProducts);

        await productFiltersController(req, res);

        expect(productModel.find).toHaveBeenCalledWith({
        price: { $gte: 0, $lte: 100 }
        });
        expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts
        });
        expect(res.status).toHaveBeenCalledWith(200);


        })

         test('filter products by price and category' , async () => {

            req = {
                body: {
                    checked: ['books'], 
                   radio: [0, 100] 
            }
        };

        const mockProducts = [
        { _id: '1', name: 'Product 1', category: 'books', price: 50 },
        { _id: '2', name: 'Product 2', category: 'books', price: 100 }
        ];

        productModel.find.mockReturnValue(mockProducts);

        await productFiltersController(req, res);

        expect(productModel.find).toHaveBeenCalledWith({
        category: { $in: ['books'] },
        price: { $gte: 0, $lte: 100 }
        });
        expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts
        });
        expect(res.status).toHaveBeenCalledWith(200);


        })

         test('no filter' , async () => {

            req = {
                body: {
                    checked: [], 
                   radio: [] 
            }
        };

        const mockProducts = [
        { _id: '1', name: 'Product 1', category: 'books', price: 50 },
        { _id: '2', name: 'Product 2', category: 'books', price: 100 }
        ];

        productModel.find.mockReturnValue(mockProducts);

        await productFiltersController(req, res);

        expect(productModel.find).toHaveBeenCalledWith({});
       
        expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts
        });
        expect(res.status).toHaveBeenCalledWith(200);


        })

        test("error handling", async () => {

            req = {
                body: {
                    checked: [], 
                   radio: [] 
            }
        }

        const mockError = new Error("Database connection failed");

        const mockProducts = [
        { _id: '1', name: 'Product 1', category: 'books', price: 50 },
        { _id: '2', name: 'Product 2', category: 'books', price: 100 }
        ];

        productModel.find.mockRejectedValue(mockError);

        await productFiltersController(req, res);

      
       
        expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error While Filtering Products",
        error: mockError
        });
        expect(res.status).toHaveBeenCalledWith(400);


        })




    
        





            
        });








   })





