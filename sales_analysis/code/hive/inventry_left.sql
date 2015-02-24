use sales;


select year(a.purchase_date),month(a.purchase_date),b.id,b.brand_name,b.product_name,sum(a.item_purchased),c.inventory,((c.inventory)-sum(a.item_purchased))from sale a join product b on a.product_id = b.id join inventory c on year(a.purchase_date) = year(c.production_date) and month(a.purchase_date) = month(c.production_date) and c.product_id=a.product_id group by b.id, year(a.purchase_date),month(a.purchase_date),b.brand_name,b.product_name,c.inventory;
