require(googleVis)
library(shiny)
library(rJava)
library(ggplot2)
library(xts)
library(reshape)




# Define server logic required to draw a histogram
shinyServer(function(input, output) {
  output$motionchart <- renderGvis({
    stateAggregatedData=read.csv("/var/state_aggregated_data/state.csv",sep = "\t")
    stateAggregatedData$Id<-stateAggregatedData$State
    stateAggregatedData$Profit <- as.numeric(stateAggregatedData$Profit)
    stateAggregatedData$Sale <- as.numeric(stateAggregatedData$Sale)
    stateAggregatedData$Year <- as.integer(stateAggregatedData$Year)
    stateAggregatedData$OrderQuantity <- as.numeric(stateAggregatedData$OrderQuantity)
    return (gvisMotionChart(stateAggregatedData,idvar="Id",timevar="Year",yvar="OrderQuantity",xvar="Sale",options=list(height=750, width=1500)))
    
  })
  

})


