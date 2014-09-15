package com.spark.test;

import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.JavaRDD;
import org.apache.spark.api.java.JavaSparkContext;
import org.apache.spark.api.java.function.*;
import scala.Tuple2;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Created by mohit on 3/9/14.
 */
public class TotalSales {
    private static final Pattern SPACE = Pattern.compile(" ");

    public static void main(String args[]) {
        JavaSparkContext ctx = new JavaSparkContext("local[*]", "TotalSales", System.getenv("SPARK_HOME"), JavaSparkContext.jarOfClass(TotalSales.class));
        final Calendar c = Calendar.getInstance();

        JavaPairRDD<String, Product> productJavaPairRDD = fetchProductData(ctx);
        JavaPairRDD<String, Sale> saleJavaPairRDD = fetchSalesData(ctx);
        JavaPairRDD<String, Tuple2<Product, Sale>> joinData = productJavaPairRDD.join(saleJavaPairRDD);
        JavaRDD<ProductSale> productSaleMap = fetchFlatMap(joinData);
        JavaPairRDD<Object, Iterable<ProductSale>> groupMap = productSaleMap.groupBy(new Function<ProductSale, Object>() {
            @Override
            public Object call(ProductSale productSale) throws Exception {
                c.setTime(productSale.getSale().getPurchaseDate());
                return c.get(Calendar.YEAR);
            }
        });


        JavaPairRDD<Object, Long> totalSaleData = groupMap.mapValues(new Function<Iterable<ProductSale>, Long>() {
            @Override
            public Long call(Iterable<ProductSale> productSales) throws Exception {
                Long sumData = 0L;
                for (ProductSale productSale : productSales) {
                    sumData = sumData + (productSale.getProduct().getPrice() * productSale.getSale().getItemPurchased());
                }
                return sumData;
            }
        });

        List<Tuple2<Object, Long>> collectData = totalSaleData.sortByKey().collect();
        System.out.println("Collect DAta:::::"+collectData);

        ctx.stop();
    }


    static JavaRDD<ProductSale> fetchFlatMap(JavaPairRDD<String, Tuple2<Product, Sale>> joinData) {
        JavaRDD<ProductSale> productSaleMap = joinData.flatMap(new FlatMapFunction<Tuple2<String, Tuple2<Product, Sale>>, ProductSale>() {
            @Override
            public Iterable<ProductSale> call(Tuple2<String, Tuple2<Product, Sale>> tuple) throws Exception {
                ProductSale productSale = new ProductSale();
                productSale.setProductId(tuple._1());
                productSale.setSale(tuple._2()._2());
                productSale.setProduct(tuple._2()._1());
                List<ProductSale> productSaleList = new ArrayList<ProductSale>();
                productSaleList.add(productSale);
                return productSaleList;
            }
        });
        return productSaleMap;
    }

    static JavaPairRDD<String, Product> fetchProductData(JavaSparkContext ctx) {

        JavaRDD<String> lines = ctx.textFile("hdfs://localhost:9000/user/data/input-data/user/product/part-*", 1);

        JavaRDD<String[]> splitMap = lines.map(new Function<String, String[]>() {
            @Override
            public String[] call(String s) throws Exception {
                return s.split("\t");
            }
        });

        JavaPairRDD<String, Product> mapKey = splitMap.mapToPair(new PairFunction<String[], String, Product>() {
            @Override
            public Tuple2<String, Product> call(String[] strings) throws Exception {
                String[] dataArray = strings[0].split(",");
                Product product = new Product();
                product.setProductId(Long.getLong(dataArray[0]));
                product.setBrandName(dataArray[2]);
                product.setCategory(dataArray[3]);
                product.setPrice(Integer.parseInt(dataArray[4]));
                product.setProductName(dataArray[5]);
                product.setWeight(dataArray[6]);
                return new Tuple2<String, Product>(dataArray[0], product);
            }
        });
        return mapKey;
    }

    static JavaPairRDD<String, Sale> fetchSalesData(JavaSparkContext ctx) {
        JavaRDD<String> salesLines = ctx.textFile("hdfs://localhost:9000/user/data/input-data/user/sale/part-*", 1);

        JavaRDD<String[]> salesLineMap = salesLines.map(new Function<String, String[]>() {
            @Override
            public String[] call(String s) throws Exception {
                return s.split("\t");
            }
        });

        JavaPairRDD<String, Sale> salesMapKey = salesLineMap.mapToPair(new PairFunction<String[], String, Sale>() {
            @Override
            public Tuple2<String, Sale> call(String[] strings) throws Exception {
                String[] dataArray = strings[0].split(",");
                String date_s = dataArray[5];
                SimpleDateFormat dt = new SimpleDateFormat("yyyyy-mm-dd hh:mm:ss");
                Date date = dt.parse(date_s);
                Sale product = new Sale();
                product.setProductId(Long.getLong(dataArray[4]));
                product.setBrandName(dataArray[2]);
                product.setItemPurchased(Long.parseLong(dataArray[3]));
                product.setPurchaseDate(dt.parse(date_s));
                return new Tuple2<String, Sale>(dataArray[4], product);
            }
        });
        return salesMapKey;
    }
}
