use sales;

CREATE EXTERNAL TABLE IF NOT EXISTS product(id bigint,version tinyint,brand_name STRING,category STRING,price INT,product_name STRING,weight INT)row format delimited
fields terminated by ','
lines terminated by '\n'
stored as textfile;

load data inpath '/user/cloudera/warehouse/sales/product/part-*' overwrite INTO TABLE product;

