create database  if not exists sales;
use sales;
DROP TABLE sale;
create EXTERNAL table IF NOT EXISTS sale(id bigint,version tinyint,brand_name STRING,item_purchased INT,product_id BIGINT,purchase_date TIMESTAMP)row format delimited 
fields terminated by ',' 
lines terminated by '\n' 
stored as textfile;
load data inpath '${SALE}' overwrite into table sale;



DROP TABLE product;
create EXTERNAL table IF NOT EXISTS product(id bigint,version tinyint,brand_name STRING,category STRING,price INT,product_name STRING,weight INT)row format delimited 
fields terminated by ',' 
lines terminated by '\n' 
stored as textfile;
load data inpath '${PRODUCT}' overwrite into table product;



DROP TABLE inventory;
create EXTERNAL table IF NOT EXISTS inventory(id bigint,version tinyint,inventory bigint,product_id bigint,production_date timestamp)row format delimited 
fields terminated by ',' 
lines terminated by '\n' 
stored as textfile;
load data inpath '${INVENTORY}' overwrite into table inventory;

INSERT OVERWRITE DIRECTORY '${OUTPUT}' select sum(a.item_purchased*b.price),year(a.purchase_date) from sale a join product b on a.product_id = b.id group by year(a.purchase_date);

