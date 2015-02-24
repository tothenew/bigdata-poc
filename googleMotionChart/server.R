require(googleVis)
library(shiny)
Sys.setenv("HADOOP_PREFIX"="<HADOOP_BASE_PATH>")
Sys.setenv("HADOOP_CMD"="<HADOOP_BASE_PATH>/bin/hadoop")
Sys.setenv("HADOOP_STREAMING"="<HADOOP_BASE_PATH>/contrib/streaming/hadoop-streaming-1.2.1.jar")
Sys.setenv("HDFS_CMD"="<HADOOP_BASE_PATH>/bin/hadoop")
library(rJava)
library(rmr2)
library(rhdfs)
library(ggplot2)
library(xts)
library(reshape)




# Define server logic required to draw a histogram
shinyServer(function(input, output) {
  output$motionchart <- renderGvis({
    hdfs.init();
    
    
    brandGeoTrancs = hdfs.file("/user/data/state_aggregated_data/state.csv","r",buffersize=104857600);
    brandGeoRead = hdfs.read(brandGeoTrancs);
    brandGeoChar = rawToChar(brandGeoRead);
    stateAggregatedData = read.table(textConnection(brandGeoChar), sep = "\t");
    stateAggregatedData$Id<-stateAggregatedData$State
    stateAggregatedData$Profit <- as.numeric(stateAggregatedData$Profit)
    stateAggregatedData$Sale <- as.numeric(stateAggregatedData$Sale)
    stateAggregatedData$Year <- as.integer(stateAggregatedData$Year)
    stateAggregatedData$OrderQuantity <- as.numeric(stateAggregatedData$OrderQuantity)
    return (gvisMotionChart(stateAggregatedData,idvar="Id",timevar="Year",yvar="OrderQuantity",xvar="Sale",options=list(height=750, width=1500)))
    
  })
  

})



