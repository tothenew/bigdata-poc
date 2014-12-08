library(shiny)

shinyUI(navbarPage(title="Google Motion Graph",
                 
                   tabPanel("Motion Chart",
                           
                            htmlOutput("motionchart")
                            
                   )
                   
                   
                  
))