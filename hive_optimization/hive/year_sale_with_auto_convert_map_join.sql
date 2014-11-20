set hive.auto.convert.join=true;
set hive.auto.convert.join.noconditionaltask = true;
set hive.auto.convert.join.noconditionaltask.size = 10000000;

select year(a.purchase_date),a.brand,sum(a.item_purchased*b.price) from salePartition a join product b on a.product_id = b.id group by year(a.purchase_date),a.brand;
