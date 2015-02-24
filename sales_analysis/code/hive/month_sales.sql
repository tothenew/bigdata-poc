
use sales;


select year(a.purchase_date),month(a.purchase_date),sum(a.item_purchased*b.price) from sale a join product b on a.product_id = b.id group by year(a.purchase_date),month(a.purchase_date);
