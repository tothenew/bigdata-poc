CREATE EXTERNAL TABLE IF NOT EXISTS salePartition(id bigint,version tinyint,brand_name STRING,item_purchased INT,product_id BIGINT,purchase_date TIMESTAMP) PARTITIONED BY(brand string) row format delimited
fields terminated by ','
lines terminated by '\n'
stored as textfile;

SET hive.exec.dynamic.partition = true;    
SET hive.exec.dynamic.partition.mode = nonstrict;

insert OVERWRITE TABLE   salePartition PARTITION(brand) select id,version, brand_name,item_purchased,product_id,purchase_date,brand_name from sale;

