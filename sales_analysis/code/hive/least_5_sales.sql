use sales;

select year(a.purchase_date),month(a.purchase_date),b.brand_name,b.product_name,sum(a.item_purchased*b.price) as amount from sale a join product b on a.product_id = b.id group by year(a.purchase_date),month(a.purchase_date),b.brand_name,b.product_name ORDER BY amount limit 10 ;
