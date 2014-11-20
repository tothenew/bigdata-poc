use sales;
CREATE EXTERNAL TABLE IF NOT EXISTS sale(id bigint,version tinyint,brand_name STRING,item_purchased INT,product_id BIGINT,purchase_date TIMESTAMP)row format delimited
fields terminated by ','
lines terminated by '\n'
stored as textfile;
load data inpath '/user/cloudera/warehouse/sales/sale/part-*' overwrite INTO TABLE sale;

