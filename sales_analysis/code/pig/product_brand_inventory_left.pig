products =  LOAD '/user/cloudera/sales/product/' using PigStorage('\t') as (product_id:int,version:int,brand_name:chararray,category:chararray,price:int,product_name:chararray,weight:chararray);
sale =  LOAD '/user/cloudera/sales/sale/' using PigStorage('\t') as (sale_id:int,version:int,brand_name:chararray,item_purchased:int,product_id:int,purchase_date:chararray);

inventory =  LOAD '/user/cloudera/sales/inventory/' using PigStorage('\t') as (inventory_id:int,version:int,inventory:int,product_id:int,production_date:chararray);

by_sale_product = join products by product_id, sale by product_id;
by_inventory_product = join products by product_id, inventory by product_id;


combinedData = foreach by_sale_product generate products::product_id as product_id, products::brand_name as brand_name, products::category as category, products::price as price, products::product_name as product_name, products::weight as weight, sale::item_purchased,sale::purchase_date as purchase_date, SUBSTRING(sale::purchase_date,5,7) as month,SUBSTRING(sale::purchase_date,0,4) as year;

combinedInventoryData = foreach by_inventory_product generate products::product_id as product_id, products::brand_name as brand_name, products::category as category, products::price as price, products::product_name as product_name, products::weight as weight, inventory::inventory as inventory,inventory::production_date as production_date, SUBSTRING(inventory::production_date,5,7) as month,SUBSTRING(inventory::production_date,0,4) as year;



filteredSalesData = FILTER combinedData by (price is not null) AND (item_purchased is not null);

filteredInventoryData = Filter combinedInventoryData by (inventory is not null);

group_sale_by_month = Group filteredSalesData by (product_id, year , month);

group_inventory_by_month = Group filteredInventoryData by (product_id,year, month);

month_sales_item = foreach group_sale_by_month generate FLATTEN(group) as (product_id,year, month), SUM(filteredSalesData.item_purchased) as totalItemPurchased;

month_inventory_item = foreach group_inventory_by_month generate FLATTEN(group) as (product_id,year, month), SUM(filteredInventoryData.inventory) as totalInventory;

joinedData = join month_sales_item by product_id, month_inventory_item by product_id;


combinedInventoryData = foreach joinedData generate month_sales_item::product_id as product_id,month_sales_item::month as month,month_sales_item::year as year,month_sales_item::totalItemPurchased as totalItemPurchased, month_inventory_item::totalInventory as totalInventory, (month_inventory_item::totalInventory - month_sales_item::totalItemPurchased);

dump combinedInventoryData;



