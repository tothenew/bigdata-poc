package com.spark.test;

import java.io.Serializable;
import java.util.Date;

class Sale implements Serializable{
    String brandName;
    Long productId;
    Date purchaseDate;

    public java.sql.Date getPurchaseDateForSql() {
        return purchaseDateForSql;
    }

    public void setPurchaseDateForSql(java.sql.Date purchaseDateForSql) {
        this.purchaseDateForSql = purchaseDateForSql;
    }

    java.sql.Date purchaseDateForSql;
    Long itemPurchased;

    public String getBrandName() {
        return brandName;
    }

    public void setBrandName(String brandName) {
        this.brandName = brandName;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public Date getPurchaseDate() {
        return purchaseDate;
    }

    public void setPurchaseDate(Date purchaseDate) {
        this.purchaseDate = purchaseDate;
    }

    public Long getItemPurchased() {
        return itemPurchased;
    }

    public void setItemPurchased(Long itemPurchased) {
        this.itemPurchased = itemPurchased;
    }
}
