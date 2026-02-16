// Lines 1 - 25 set up by DeepSeek-V3.2 to show how to set up unit test for controller.
const { 
  realtedProductController,
  
} = require('./productController');
import productModel  from '../models/productModel';

// Mock the database model
jest.mock('../models/productModel');

describe('Product Controller Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn()
    };
  });


  describe('View Product Recommendation (relatedProductController)', () => {
    test('should not show more than 3 related products', async () => {
      
      req = {
        params: {
          pid: 'product123',
          cid: 'category456'
        }
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
      expect(mockQuery.select).toHaveBeenCalledWith('-photo');
      expect(mockQuery.limit).toHaveBeenCalledWith(3);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts
      });
    });

test('should get from the same category', async () => {
      
      req = {
        params: {
          pid: 'product123',
          cid: 'category456'
        }
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
      expect(mockQuery.select).toHaveBeenCalledWith('-photo');
      expect(mockQuery.populate).toHaveBeenCalledWith('category');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts
      });
    });
     
});

describe('View Product List', () => {

})







});