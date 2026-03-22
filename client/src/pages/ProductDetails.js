import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Layout from "./../components/Layout";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/ProductDetailsStyles.css";
import Pagenotfound from "./Pagenotfound";
import { useCart } from "../context/cart";

const ProductDetails = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState({});
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const [cart, setCart] = useCart();

  //initalp details
  useEffect(() => {
    if (params?.slug) getProduct();
  }, [params?.slug]);
  //getProduct
  const getProduct = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `/api/v1/product/get-product/${params.slug}`,
      );
      setProduct(data?.product);
      getSimilarProduct(data?.product._id, data?.product.category._id);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };
  //get similar product
  const getSimilarProduct = async (pid, cid) => {
    try {
      const { data } = await axios.get(
        `/api/v1/product/related-product/${pid}/${cid}`,
      );
      setRelatedProducts(data?.products);
    } catch (error) {
      console.log(error);
    }
  };

  if (!product) {
    return <Pagenotfound />;
  }

  return (
    <Layout>
      <div className="row container product-details">
        <div className="col-md-6">
          {loading ? (
            <div className="text-center">Loading...</div>
          ) : (
            <img
              src={`/api/v1/product/product-photo/${product._id}`}
              className="card-img-top"
              alt={product.name}
              height="300"
              width={"350px"}
            />
          )}
        </div>
        <div className="col-md-6 product-details-info">
          <h1 className="text-center">Product Details</h1>
          {loading ? (
            <div className="text-center">Loading...</div>
          ) : (
            <>
              <hr />
              <h6>Name : {product.name}</h6>
              <h6>Description : {product.description}</h6>
              <h6>
                Price :{" "}
                {product?.price?.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                })}
              </h6>
              <h6>Category : {product?.category?.name}</h6>
              <button
                className="btn btn-dark ms-1"
                disabled={
                  addingToCart ||
                  product?.quantity < 1 ||
                  (cart?.filter((item) => item._id === product._id) || [])
                    .length >= product?.quantity
                }
                onClick={async () => {
                  const currentInCart = cart?.filter(
                    (item) => item._id === product._id,
                  ).length;

                  if (currentInCart < product.quantity) {
                    setAddingToCart(true);

                    try {
                      // Replace this with an actual API call if you sync cart to backend
                      await new Promise((resolve) => setTimeout(resolve, 800));

                      const updatedCart = [...cart, product];
                      setCart(updatedCart);
                      localStorage.setItem("cart", JSON.stringify(updatedCart));
                      toast.success("Item Added to cart");
                    } finally {
                      setAddingToCart(false);
                    }
                  } else {
                    toast.error(
                      `Only ${product.quantity} units available in stock`,
                    );
                  }
                }}
              >
                {addingToCart ? (
                  <div>Loading...</div>
                ) : product?.quantity < 1 ||
                  (cart?.filter((item) => item._id === product._id) || [])
                    .length >= product?.quantity ? (
                  "OUT OF STOCK"
                ) : (
                  "ADD TO CART"
                )}
              </button>
            </>
          )}
        </div>
      </div>
      <hr />
      <div className="row container similar-products">
        <h4>Similar Products ➡️</h4>
        {relatedProducts.length < 1 && (
          <p className="text-center">No Similar Products found</p>
        )}
        <div className="d-flex flex-wrap">
          {relatedProducts?.map((p) => (
            <div className="card m-2" key={p._id}>
              <img
                src={`/api/v1/product/product-photo/${p._id}`}
                className="card-img-top"
                alt={p.name}
              />
              <div className="card-body">
                <div className="card-name-price">
                  <h5 className="card-title">{p.name}</h5>
                  <h5 className="card-title card-price">
                    {p.price.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    })}
                  </h5>
                </div>
                <p className="card-text ">
                  {p.description.substring(0, 60)}...
                </p>
                <div className="card-name-price">
                  <button
                    className="btn btn-info ms-1"
                    onClick={() => navigate(`/product/${p.slug}`)}
                  >
                    More Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetails;
