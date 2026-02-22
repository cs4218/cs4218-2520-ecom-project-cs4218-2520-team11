// Lines 1-23 are generated from DeepSeekV3.2 to set up unit tests for the Backend.
const { 
  realtedProductController,
  productCountController,
  searchProductController,
  productFiltersController,
  getProductController,
  getSingleProductController,
  productPhotoController,
  productListController,
  productCategoryController
} = require('./productController');
import productModel from '../models/productModel';
import categoryModel from '../models/categoryModel';

// Mock the database model
jest.mock('../models/productModel');
jest.mock('../models/categoryModel');

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

//Below onwards, all used AI to help generate since its mostly mundane unit tests.
describe('Get Products (getProductController)', () => {
   
   let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn()
    };
  });
  test('should return 12 most recent products with category populated', async () => {
    const mockProducts = [
      { 
        _id: '1', 
        name: 'Product 1', 
        category: { name: 'Category 1', _id: 'cat1' },
        createdAt: new Date('2024-01-03')
      },
      { 
        _id: '2', 
        name: 'Product 2', 
        category: { name: 'Category 2', _id: 'cat2' },
        createdAt: new Date('2024-01-02')
      }
    ];

    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(mockProducts)
    };

    productModel.find.mockReturnValue(mockQuery);

    await getProductController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({});
    expect(mockQuery.populate).toHaveBeenCalledWith('category');
    expect(mockQuery.select).toHaveBeenCalledWith('-photo');
    expect(mockQuery.limit).toHaveBeenCalledWith(12);
    expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      counTotal: 2,
      message: "ALlProducts ",
      products: mockProducts
    });
  });

  test('should return empty array when no products exist', async () => {
    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([])
    };

    productModel.find.mockReturnValue(mockQuery);

    await getProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      counTotal: 0,
      message: "ALlProducts ",
      products: []
    });
  });

  test('should handle database errors gracefully', async () => {
    const mockError = new Error('Database connection failed');
    
    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockRejectedValue(mockError)
    };

    productModel.find.mockReturnValue(mockQuery);

    jest.spyOn(console, 'log').mockImplementation(() => {});

    await getProductController(req, res);

    expect(console.log).toHaveBeenCalledWith(mockError);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Erorr in getting products",
      error: "Database connection failed"
    });

    console.log.mockRestore();
  });
});
describe('Get Single Product (getSingleProductController)', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn()
    };
  });

  test('should return single product when valid slug is provided', async () => {
    req.params.slug = 'test-product-123';
    
    const mockProduct = {
      _id: '1',
      name: 'Test Product',
      slug: 'test-product-123',
      category: { name: 'Category 1', _id: 'cat1' }
    };

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(mockProduct)
    };

    productModel.findOne.mockReturnValue(mockQuery);

    await getSingleProductController(req, res);

    expect(productModel.findOne).toHaveBeenCalledWith({ slug: 'test-product-123' });
    expect(mockQuery.select).toHaveBeenCalledWith('-photo');
    expect(mockQuery.populate).toHaveBeenCalledWith('category');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Single Product Fetched",
      product: mockProduct
    });
  });

  test('should return 200 with null product when slug does not exist', async () => {
    req.params.slug = 'non-existent-product';

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(null)
    };

    productModel.findOne.mockReturnValue(mockQuery);

    await getSingleProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Single Product Fetched",
      product: null
    });
  });

  test('should handle database errors gracefully', async () => {
    req.params.slug = 'test-product-123';
    const mockError = new Error('Database connection failed');

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockRejectedValue(mockError)
    };

    productModel.findOne.mockReturnValue(mockQuery);
    jest.spyOn(console, 'log').mockImplementation(() => {});

    await getSingleProductController(req, res);

    expect(console.log).toHaveBeenCalledWith(mockError);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Eror while getitng single product",
      error: mockError
    });

    console.log.mockRestore();
  });
});



describe('Product Photo (productPhotoController)', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      params: {}
    };
    res = {
      set: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
  });

  test('should return product photo when product exists', async () => {
    req.params.pid = 'product123';
    
    const mockProduct = {
      photo: {
        data: Buffer.from('fake-image-data'),
        contentType: 'image/jpeg'
      }
    };

    productModel.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockProduct)
    });

    await productPhotoController(req, res);

    expect(productModel.findById).toHaveBeenCalledWith('product123');
    expect(res.set).toHaveBeenCalledWith('Content-type', 'image/jpeg');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(mockProduct.photo.data);
  });

  test('should handle case when product has no photo', async () => {
    req.params.pid = 'product123';
    
    const mockProduct = {
      photo: {
        data: null,
        contentType: null
      }
    };

    productModel.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockProduct)
    });

    await productPhotoController(req, res);

    expect(productModel.findById).toHaveBeenCalledWith('product123');
    expect(res.set).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
  });

  test('should handle database errors gracefully', async () => {
    req.params.pid = 'product123';
    const mockError = new Error('Database connection failed');

    productModel.findById.mockReturnValue({
      select: jest.fn().mockRejectedValue(mockError)
    });

    jest.spyOn(console, 'log').mockImplementation(() => {});

    await productPhotoController(req, res);

    expect(console.log).toHaveBeenCalledWith(mockError);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Erorr while getting photo",
      error: mockError
    });

    console.log.mockRestore();
  });
});

describe('Product List (productListController)', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
  });

  test('should return first page of products when no page param', async () => {
    req.params.page = undefined;
    const perPage = 6;
    const mockProducts = [
      { _id: '1', name: 'Product 1' },
      { _id: '2', name: 'Product 2' },
      { _id: '3', name: 'Product 3' },
      { _id: '4', name: 'Product 4' },
      { _id: '5', name: 'Product 5' },
      { _id: '6', name: 'Product 6' }
    ];

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(mockProducts)
    };

    productModel.find.mockReturnValue(mockQuery);

    await productListController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({});
    expect(mockQuery.select).toHaveBeenCalledWith('-photo');
    expect(mockQuery.skip).toHaveBeenCalledWith(0); // (1-1) * 6 = 0
    expect(mockQuery.limit).toHaveBeenCalledWith(perPage);
    expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: mockProducts
    });
  });

  test('should return page 2 products when page=2', async () => {
    req.params.page = '2';
    const perPage = 6;
    const mockProducts = [
      { _id: '7', name: 'Product 7' },
      { _id: '8', name: 'Product 8' },
      { _id: '9', name: 'Product 9' },
      { _id: '10', name: 'Product 10' },
      { _id: '11', name: 'Product 11' },
      { _id: '12', name: 'Product 12' }
    ];

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(mockProducts)
    };

    productModel.find.mockReturnValue(mockQuery);

    await productListController(req, res);

    expect(mockQuery.skip).toHaveBeenCalledWith(6); // (2-1) * 6 = 6
    expect(mockQuery.limit).toHaveBeenCalledWith(perPage);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: mockProducts
    });
  });

  test('should return empty array when page exceeds available products', async () => {
    req.params.page = '999';
    const perPage = 6;
    const mockProducts = [];

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(mockProducts)
    };

    productModel.find.mockReturnValue(mockQuery);

    await productListController(req, res);

    expect(mockQuery.skip).toHaveBeenCalledWith(5988); // (999-1) * 6 = 5988
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: []
    });
  });

  test('should handle database errors gracefully', async () => {
    req.params.page = '1';
    const mockError = new Error('Database connection failed');

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockRejectedValue(mockError)
    };

    productModel.find.mockReturnValue(mockQuery);
    jest.spyOn(console, 'log').mockImplementation(() => {});

    await productListController(req, res);

    expect(console.log).toHaveBeenCalledWith(mockError);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "error in per page ctrl",
      error: mockError
    });

    console.log.mockRestore();
  });
});

describe('Product Category (productCategoryController)', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
  });

  test('should return products for valid category slug', async () => {
    req.params.slug = 'electronics';
    
    const mockCategory = {
      _id: 'cat123',
      name: 'Electronics',
      slug: 'electronics'
    };
    
    const mockProducts = [
      { _id: '1', name: 'Laptop', category: mockCategory },
      { _id: '2', name: 'Phone', category: mockCategory },
      { _id: '3', name: 'Tablet', category: mockCategory }
    ];

    categoryModel.findOne.mockResolvedValue(mockCategory);
    
    productModel.find.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockProducts)
    });

    await productCategoryController(req, res);

    expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: 'electronics' });
    expect(productModel.find).toHaveBeenCalledWith({ category: mockCategory });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      category: mockCategory,
      products: mockProducts
    });
  });

  test('should return empty products array when category has no products', async () => {
    req.params.slug = 'new-category';
    
    const mockCategory = {
      _id: 'cat456',
      name: 'New Category',
      slug: 'new-category'
    };
    
    const mockProducts = [];

    categoryModel.findOne.mockResolvedValue(mockCategory);
    
    productModel.find.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockProducts)
    });

    await productCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      category: mockCategory,
      products: []
    });
  });


  test('should handle database errors gracefully', async () => {
    req.params.slug = 'electronics';
    const mockError = new Error('Database connection failed');

    categoryModel.findOne.mockRejectedValue(mockError);
    jest.spyOn(console, 'log').mockImplementation(() => {});

    await productCategoryController(req, res);

    expect(console.log).toHaveBeenCalledWith(mockError);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: mockError,
      message: "Error While Getting products"
    });

    console.log.mockRestore();
  });
});

