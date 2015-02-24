products =  LOAD '/user/${user.name}/sales/product/' using PigStorage('\t') as (product_id:int,version:int,brand_name:chararray,category:chararray,price:int,product_name:chararray,weight:chararray);
sale =  LOAD '/user/${user.name}/sales/sale/' using PigStorage('\t') as (sale_id:int,version:int,brand_name:chararray,item_purchased:int,product_id:int,purchase_date:chararray);

by_sale_product = join products by product_id, sale by product_id;

combinedData = foreach by_sale_product generate products::product_id as product_id, products::brand_name as brand_name, products::category as category, products::price as price, products::product_name as product_name, products::weight as weight, sale::item_purchased,sale::purchase_date as purchase_date, SUBSTRING(sale::purchase_date,0,4) as year;

filtered = FILTER combinedData by (price is not null) AND (item_purchased is not null);

price_year = foreach filtered generate year as year, (item_purchased*price) as totalPrice;

group_by_year = Group price_year by year;

finalResult = foreach group_by_year generate group, SUM(price_year.totalPrice) as totalPrice;

dump finalResult;

