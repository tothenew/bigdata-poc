package com.spark.test;

import java.io.Serializable;

/**
 * Created by mohit on 3/9/14.
 */
public class ProductSale implements Serializable{
    String productId;

    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public Sale getSale() {
        return sale;
    }

    public void setSale(Sale sale) {
        this.sale = sale;
    }

    Product product;
    Sale sale;
}
