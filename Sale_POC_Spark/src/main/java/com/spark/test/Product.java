package com.spark.test;

import java.io.Serializable;

/**
 * Created by mohit on 3/9/14.
 */
public class Product implements Serializable {
    Long productId;
    String brandName;
    String productName;
    Integer price;
    String category;
    String weight;

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getBrandName() {
        return brandName;
    }

    public void setBrandName(String brandName) {
        this.brandName = brandName;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public Integer getPrice() {
        return price;
    }

    public void setPrice(Integer price) {
        this.price = price;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getWeight() {
        return weight;
    }

    public void setWeight(String weight) {
        this.weight = weight;
    }
}
