products =  LOAD '/user/${user.name}/sales/product/' using PigStorage('\t') as (product_id:int,version:int,brand_name:chararray,category:chararray,price:int,product_name:chararray,weight:chararray);

sale =  LOAD '/user/${user.name}/sales/sale/' using PigStorage('\t') as (sale_id:int,version:int,brand_name:chararray,item_purchased:int,product_id:int,purchase_date:chararray);

by_sale_product = join products by product_id, sale by product_id;

combinedData = foreach by_sale_product generate products::product_id as product_id, products::brand_name as brand_name, products::category as category, products::price as price, products::product_name as product_name, products::weight as weight, sale::item_purchased,sale::purchase_date as purchase_date, SUBSTRING(sale::purchase_date,5,7) as month,SUBSTRING(sale::purchase_date,0,4) as year;

filtered = FILTER combinedData by (price is not null) AND (item_purchased is not null);

price_brand = foreach filtered generate year as year, brand_name as brand_name,month as month, product_name as product_name, (item_purchased*price) as totalPrice;

group_by_brand = Group price_brand by (year,month, brand_name,product_name);

finalResult = foreach group_by_brand generate FLATTEN(group) as (year,month, brand_name,product_name), SUM(price_brand.totalPrice) as totalPrice;

store finalResult into '/user/${user.name}/sales/output/brand_month_sales/' Using PigStorage('\t');

