CREATE DATABASE IF NOT EXISTS sales;
USE sales;


CREATE EXTERNAL TABLE IF NOT EXISTS inventory(id bigint,version tinyint,inventory bigint,product_id bigint,production_date timestamp)row format delimited 
fields terminated by ',' 
lines terminated by '\n' 
stored as textfile;

load data inpath '/user/${user.name}/sales/inventory/part-*' overwrite INTO TABLE inventory;



CREATE EXTERNAL TABLE IF NOT EXISTS product(id bigint,version tinyint,brand_name STRING,category STRING,price INT,product_name STRING,weight INT)row format delimited 
fields terminated by ',' 
lines terminated by '\n' 
stored as textfile;

load data inpath '/user/${user.name}/sales/product/part-*' overwrite INTO TABLE product;



CREATE EXTERNAL TABLE IF NOT EXISTS sale(id bigint,version tinyint,brand_name STRING,item_purchased INT,product_id BIGINT,purchase_date TIMESTAMP)row format delimited 
fields terminated by ',' 
lines terminated by '\n' 
stored as textfile;

load data inpath '/user/${user.name}/sales/sale/part-*' overwrite INTO TABLE sale;

